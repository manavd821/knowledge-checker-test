import asyncio
from uuid import UUID
import uuid
from pydantic import BaseModel
from events.enums import HandlerPolicy, LiveSessionEvent
from events.handlers.base import IEventHandler
from graph.graph_selector import GraphSelector
from lib.logging.logging import get_logger
from models.graph_result import GraphResult
from models.graph_state import InterviewGraphState
from models.sessions import SessionContext
from services.session_context_store import SessionContextStore
from graph.graph_runtime import GraphRuntime
from services.session_runtime_context import SessionRuntimeContextService
from services.token_service import TokenService
from events.event_publisher import EventPublisher
from events.payloads import (
    CandidateTurnCompleted, 
    CandidateTurnUpdated,
    InterviewerResponseReady, 
    InterviewerTurnCompleted, 
    RuntimeContextUpdated, 
)
from events.models import (
    MergeCandidateTurn, 
    SessionContextUpdate, 
    SessionExecutionState, 
    SessionRuntimeContextUpdate,
)
logger = get_logger(__name__)

class SessionProcessor(IEventHandler):

    def __init__(
        self,
        graph_selector: GraphSelector,
        session_ctx_store: SessionContextStore,
        session_runtime_ctx_service : SessionRuntimeContextService,
        event_publisher: EventPublisher,
        graph_runtime: GraphRuntime
    ) -> None:
        super().__init__()
        self._graph_selector = graph_selector
        self._session_ctx_store = session_ctx_store
        self._session_runtime_ctx_service = session_runtime_ctx_service
        self._event_publisher = event_publisher
        self._graph_runtime = graph_runtime
        self._sessions : dict[
            UUID,
            SessionExecutionState,
        ] = {}
        # Strong references to the per-session processing tasks. asyncio only
        # keeps weak references to tasks, and these tasks must be owned (and
        # awaited on shutdown) by this component, not by the caller that
        # happened to enqueue the event.
        self._background_tasks : set[asyncio.Task] = set()
        self._drained = False
        
    @property
    def policy(self) -> HandlerPolicy:
        return HandlerPolicy.CRITICAL
    
    async def handle(
        self,
        event: LiveSessionEvent,
        payload: BaseModel,
    ) -> None:
        
        if event is not LiveSessionEvent.CANDIDATE_TURN_COMPLETED:
            return
        
        if not isinstance(payload, CandidateTurnCompleted):
            raise TypeError(
                f"Expected CandidateTurnCompleted, "
                f"got {type(payload).__name__}"
            )

        await self._enqueue(payload)
    
    async def _enqueue(self, payload: CandidateTurnCompleted):
        if self._drained:
            # Shutdown already started: the session is gone, so no new
            # processing may be spawned on a loop that is about to close.
            logger.warning(
                "SessionProcessor is shutting down, dropping candidate turn",
                session_id=str(payload.session_id),
            )
            return

        state = self._sessions.setdefault(
            payload.session_id,
            SessionExecutionState()
        )
        state.queue.append(payload)
        if state.running:
            return
        
        state.running = True
        self._start_processing(payload.session_id)

    def _start_processing(self, session_id: UUID) -> None:
        task = asyncio.create_task(
            self._process_session(session_id),
            name=f"session-processor:{session_id}",
        )
        self._background_tasks.add(task)
        task.add_done_callback(self._on_task_done)

    def _on_task_done(self, task: asyncio.Task) -> None:
        self._background_tasks.discard(task)
        if task.cancelled():
            return
        # Failures are already logged by _process_session; retrieve the
        # exception here so this owner, not the event loop, accounts for it.
        task.exception()

    async def drain(self) -> None:
        """
        Stop accepting new turns and wait for every in-flight
        _process_session() task (LangGraph execution, Gemini calls,
        Redis publishes) to finish.

        The component that owns the event loop must await this BEFORE
        closing shared clients or shutting down the loop executor.
        """
        self._drained = True

        pending = len(self._background_tasks)
        if pending:
            logger.info(
                "Waiting for in-flight session processing to finish",
                pending=pending,
            )

        while self._background_tasks:
            await asyncio.gather(
                *list(self._background_tasks),
                return_exceptions=True,
            )

    async def _process_session(self, session_id: UUID):
        state = self._sessions[session_id]
        try:
            while state.queue:
                batch = list(state.queue)
                state.queue.clear()

                await self._execute_batch(batch)
                    
        except Exception as e:
            logger.error(str(e),error = e)
            raise
        
        finally:
            state.running = False
            if not state.queue:
                self._sessions.pop(
                    session_id, None
                )
                
    async def _execute_batch(
        self,
        turns: list[CandidateTurnCompleted],
    ):
        candidate_input = self._merge_candidate_turn(turns)
        session_ctx = await self._session_ctx_store.get_session_context(
            candidate_input.session_id
        )
        
        session_id = candidate_input.session_id
        participant_id = candidate_input.participant_id
        evaluation_turn_id = candidate_input.turn_id[-1]
        
        graph_type = self._graph_selector.select(session_ctx)
        graph_input = self.build_graph_input(session_ctx,candidate_input)
        
        result = await self._graph_runtime.execute(
            graph_type,
            graph_input,
        )
        # 1. update caches
        await self._update_caches(session_id, result)
        # 2. publish graph result
        await self.publish_graph_result(
            session_id,
            evaluation_turn_id,
            participant_id,
            result
        )
        # finally publish final response
        await self._event_publisher.publish(
            LiveSessionEvent.INTERVIEWER_RESPONSE_READY,
            InterviewerResponseReady(
                session_id=session_id,
                response=result.final_response, # type: ignore
            )
        )
    
    async def publish_graph_result(
        self,
        session_id: UUID,
        candidate_turn_id: UUID, 
        participant_id: UUID,
        result: GraphResult,
    ):
        # candidate turn update
        await self._event_publisher.publish(
            LiveSessionEvent.CANDIDATE_TURN_UPDATE,
            CandidateTurnUpdated(
                session_id=session_id,
                turn_id=candidate_turn_id,
                evaluation_score=result.evaluation_score,
                evaluation_feedback=result.evaluation_feedback,
                evaluation_rubric=result.evaluation_rubric,
            )
        )
        
        # interviewer turn completed
        interviewer_turn_id = uuid.uuid4()
        await self._event_publisher.publish(
            LiveSessionEvent.INTERVIEWER_TURN_COMPLETED,
            InterviewerTurnCompleted(
                session_id = session_id,
                participant_id = participant_id,
                turn_id = interviewer_turn_id,
                content = result.final_response, # type: ignore
                # tokens_used = result.toke
            )
        )
        # runtime context update
        await self._event_publisher.publish(
            LiveSessionEvent.RUNTIME_CONTEXT_UPDATED,
            RuntimeContextUpdated(
                session_id=session_id,

                questions_asked=result.question_asked,

                fundamental_phase=result.fundamental_phase,
                current_difficulty=result.current_difficulty,

                previous_score=result.previous_score,
                overall_score=result.overall_score,

                current_question=result.next_question,

                active_context=result.active_context,
                context_tokens=result.context_tokens,

                version=result.runtime_version,
            ),
        )

    async def _update_caches(
        self,
        session_id: UUID,
        result: GraphResult,
    ):
        # 1. session context cache
        context_update = SessionContextUpdate(
            fundamental_phase = result.fundamental_phase,
            current_difficulty = result.current_difficulty,
            previous_score = result.previous_score,
            overall_score = result.overall_score,

            current_question = result.next_question,
            questions_asked = result.question_asked,

            active_context = result.active_context,
            context_tokens = result.context_tokens,

            version = result.runtime_version,        
        )   
        await self._session_ctx_store.update_session_context_cache(
            session_id=session_id,
            update=context_update,
        )
        
        # 2. session runtime context cache
        runtime_context = SessionRuntimeContextUpdate(
            fundamental_phase=result.fundamental_phase,
            current_difficulty=result.current_difficulty,
            previous_score=result.previous_score,
            overall_score=result.overall_score,
            current_question=result.next_question,
            questions_asked=result.question_asked,
            version=result.runtime_version,
        )
        await self._session_runtime_ctx_service.update_ctx_cache(
            session_id=session_id,
            update=runtime_context,
        )
        
    def _merge_candidate_turn(
        self, 
        turns: list[CandidateTurnCompleted]
        ) -> MergeCandidateTurn:
        transcript = "".join(
                turn.content
                for turn in turns
            )
        token_services = TokenService()
        transcript_tokens = token_services.estimate_tokens(transcript)
        
        return MergeCandidateTurn(
            session_id=turns[0].session_id,
            participant_id=turns[0].participant_id,
            turn_id=[turn.turn_id for turn in turns],
            transcript=transcript,
            transcript_tokens=transcript_tokens,
            evaluation_turn_id=turns[-1].turn_id,
        )

    def build_graph_input(
        self,
        ctx: SessionContext,
        candidate_input: MergeCandidateTurn,
    ) -> InterviewGraphState:
        return InterviewGraphState(
            context=ctx,
            user_transcript=candidate_input.transcript,
            transcript_tokens=candidate_input.transcript_tokens,
            current_question=ctx.runtime.current_question,
        )
        
        