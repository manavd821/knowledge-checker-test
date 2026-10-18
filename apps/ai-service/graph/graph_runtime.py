import asyncio

import structlog

from execution_profile.enums import ExecutionProfile
from execution_profile.provider.graph import GraphProvider
from graph.enums import GraphType
from graph.graph_registry import GraphRegistry
from models.graph_result import GraphResult
from models.graph_state import InterviewGraphState
from langgraph.graph.state import CompiledStateGraph

logger = structlog.get_logger(__name__)
class GraphRuntime:
    def __init__(
        self,
        graph_registry: GraphRegistry,
        graph_profile_provider: GraphProvider,
    ) -> None:
        self._graph_registry = graph_registry
        self._graph_profile_provider = graph_profile_provider
        self._graphs : dict[
            tuple[GraphType,ExecutionProfile, int],
            CompiledStateGraph[InterviewGraphState]
        ] = {}
        
    async def execute(
        self,
        graph_type: GraphType,
        state: InterviewGraphState,
    ) -> GraphResult:
        
        profile = self._graph_profile_provider.select(
            state.context
        )
        loop_id = id(asyncio.get_running_loop())
        key = (graph_type,profile, loop_id)
        graph = self._graphs.get(key, None)
        if graph is None:
        
            graph_factory = self._graph_registry.get(graph_type)
            graph = graph_factory.create(profile)
            self._graphs[key] = graph
        
        logger.info(
            "Invokig graph...",
            transcript = state.user_transcript,
        )
        response = await graph.ainvoke(
            state
        )
        logger.info(
            "graph execution completed",
            final_response = state.final_response,
        )
        result = InterviewGraphState.model_validate(response)
        
        return GraphResult(
            fundamental_phase=result.context.runtime.fundamental_phase,
            current_difficulty=result.context.runtime.current_difficulty,
            previous_score=result.context.runtime.previous_score,
            overall_score=result.context.runtime.overall_score,
            evaluation_score = result.evaluation_score,
            evaluation_rubric=result.evaluation_rubric,
            evaluation_feedback=result.evaluation_feedback,
            next_question=result.next_question,
            question_asked = result.context.runtime.questions_asked,
            content_type=result.content_type,
            final_response=result.final_response,
            needs_summarization=result.needs_summarization,
            active_context=result.context.runtime.active_context, # changes on every graph execution
            context_tokens=result.context.runtime.context_tokens,
            interview_runtime_context=result.context.runtime.interview_runtime_context,
            runtime_version=result.context.runtime.version + 1
        )