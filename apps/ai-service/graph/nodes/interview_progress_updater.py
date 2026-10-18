from models.graph_state import InterviewGraphState
from services.interview_progress_service import InterviewProgressService


class InterviewProgressUpdaterNode:
    def __init__(
        self,
        progress_service: InterviewProgressService,
    ) -> None:
        self._progress_service = progress_service

    async def __call__(
        self,
        state: InterviewGraphState,
    ) -> dict:
        runtime = state.context.runtime
        session = state.context.session

        if runtime.questions_asked == 0 or state.evaluation_score is None:
            return {}

        updated_progress = await self._progress_service.update_progress(
            plan=session.interview_plan,
            runtime_context=runtime.interview_runtime_context,
            question=state.current_question,
            answer=state.user_transcript,
            evaluation_score=state.evaluation_score,
            evaluation_feedback=state.evaluation_feedback,
            session_brief=session.session_brief,
            topic_type=session.topic_type,
            domain=session.domain,
        )
        updated_runtime = runtime.model_copy(
            update={
                "interview_runtime_context": updated_progress,
            }
        )
        updated_context = state.context.model_copy(
            update={
                "runtime": updated_runtime,
            }
        )
        return {
            "context": updated_context,
        }
