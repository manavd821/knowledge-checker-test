from llm.enums import Tasks
from llm.gateway import LLMGateway
from models.enums import (
    AI_STRICTNESS,
    Difficulty,
    Domain,
    RoleLevel,
    TopicType,
)
from models.interview_plan import InterviewPlan
from prompts.registry import get_prompt


class InterviewPlanService:
    task = Tasks.INTERVIEW_PLAN

    def __init__(
        self,
        llm_gateway: LLMGateway,
    ) -> None:
        self._llm_gateway = llm_gateway

    def get_chain(self):
        llm = self._llm_gateway.get_structure_model(
            self.task,
            schema=InterviewPlan,
        )
        prompt = get_prompt(self.task)
        return prompt | llm

    async def generate_plan(
        self,
        topic_type: TopicType,
        role_level: RoleLevel,
        difficulty: Difficulty,
        domain: Domain,
        ai_strictness: AI_STRICTNESS,
        session_brief: str | None = None,
        custom_domain: str | None = None,
        custom_instructions: str | None = None,
        document_text: str | None = None,
    ) -> InterviewPlan:
        chain = self.get_chain()
        return await chain.ainvoke({
            "topic_type": str(topic_type),
            "role_level": str(role_level),
            "difficulty": str(difficulty),
            "domain": str(domain),
            "custom_domain": custom_domain,
            "ai_strictness": str(ai_strictness),
            "custom_instructions": custom_instructions,
            "session_brief": session_brief,
            "document_text": document_text,
        })
