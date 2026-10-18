from langchain_core.output_parsers import StrOutputParser
from llm.enums import Tasks
from llm.gateway import LLMGateway
from models.enums import (
    TopicType,
    AI_STRICTNESS,
    Difficulty,
)
from models.interview_plan import InterviewPlan
from models.interview_runtime_context import InterviewRuntimeContext
from prompts.registry import get_prompt

class QuestionService:
    task = Tasks.QUESTION_GEN
    def __init__(
        self,
        llm_gateway : LLMGateway,
    ) -> None:
        self._llm_gateway = llm_gateway
    
    def get_chain(self):
        llm = self._llm_gateway.get_model(self.task)
        prompt = get_prompt(Tasks.QUESTION_GEN)
        return prompt | llm | StrOutputParser(name="QuestionService")
        
    async def generate_question(
        self,
        topic_type : TopicType | None,
        domain : str | None,
        current_difficulty : Difficulty | None,
        ai_strictness : AI_STRICTNESS | None,
        fundamental_phase : bool,
        session_brief : str | None,
        custom_instructions : str | None,
        overall_score : float | None,
        previous_score : float | None,
        active_context : str,
        interview_plan : InterviewPlan | None = None,
        interview_runtime_context : InterviewRuntimeContext | None = None,
    ) -> str:
        chain = self.get_chain()
        return await chain.ainvoke({
            "topic_type" : topic_type,
            "domain" : str(domain),
            "current_difficulty" : str(current_difficulty),
            "ai_strictness" : str(ai_strictness),
            "fundamental_phase" : fundamental_phase,
            "session_brief" : session_brief,
            "custom_instructions" : custom_instructions,
            "overall_score" : overall_score,
            "previous_score" : previous_score,
            "active_context" : active_context,
            "interview_plan" : (
                interview_plan.model_dump_json(indent=2)
                if interview_plan is not None
                else "No plan available."
            ),
            "interview_runtime_context" : (
                interview_runtime_context
                if interview_runtime_context is not None
                else InterviewRuntimeContext()
            ).model_dump_json(indent=2),
        })