from models.enums import ContentType
from models.graph_state import InterviewGraphState
from services.question_service import QuestionService

class QuestionGeneratorNode:
    def __init__(
        self,
        question_service: QuestionService,
    ) -> None:
        self._question_service = question_service
    
    async def __call__(
        self,
        state: InterviewGraphState,
    ) -> dict:
        session = state.context.session
        runtime = state.context.runtime
        
        # generate new question
        new_question = await self._question_service.generate_question(
            topic_type=session.topic_type,
            domain=session.domain,
            current_difficulty=runtime.current_difficulty,
            ai_strictness=session.ai_strictness,
            fundamental_phase=runtime.fundamental_phase,
            session_brief=session.session_brief,
            custom_instructions=session.custom_instructions,
            overall_score=session.overall_score,
            previous_score=runtime.previous_score,
            active_context=runtime.active_context,
            interview_plan=session.interview_plan,
            interview_runtime_context=runtime.interview_runtime_context,
        )
        # update question asked
        updated_runtime_ctx = runtime.model_copy(
            update={
                "questions_asked" : runtime.questions_asked + 1
            }
        )
        updated_context = state.context.model_copy(
            update={
                "runtime" : updated_runtime_ctx,
            }
        )
        
        return {
            "context" : updated_context,
            "next_question": new_question,
            "content_type" : ContentType.QUESTION,
        }
