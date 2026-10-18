from llm.enums import Tasks
from llm.gateway import LLMGateway
from models.enums import Domain, TopicType
from models.interview_plan import InterviewPlan
from models.interview_runtime_context import InterviewRuntimeContext
from prompts.registry import get_prompt


class InterviewProgressService:
    task = Tasks.INTERVIEW_PROGRESS

    def __init__(
        self,
        llm_gateway: LLMGateway,
    ) -> None:
        self._llm_gateway = llm_gateway

    def get_chain(self):
        llm = self._llm_gateway.get_structure_model(
            self.task,
            schema=InterviewRuntimeContext,
        )
        prompt = get_prompt(self.task)
        return prompt | llm

    async def update_progress(
        self,
        plan: InterviewPlan | None,
        runtime_context: InterviewRuntimeContext | None,
        question: str | None,
        answer: str,
        evaluation_score: float | None,
        evaluation_feedback: str | None,
        session_brief: str | None,
        topic_type: TopicType,
        domain: Domain,
    ) -> InterviewRuntimeContext:
        chain = self.get_chain()
        updated = await chain.ainvoke({
            "topic_type": str(topic_type),
            "domain": str(domain),
            "session_brief": session_brief,
            "interview_plan": (
                plan.model_dump_json(indent=2)
                if plan is not None
                else "No plan available."
            ),
            "runtime_context": (
                runtime_context
                if runtime_context is not None
                else InterviewRuntimeContext()
            ).model_dump_json(indent=2),
            "question": question,
            "answer": answer,
            "evaluation_score": (
                evaluation_score
                if evaluation_score is not None
                else "not scored"
            ),
            "evaluation_feedback": evaluation_feedback,
        })
        return updated.reconcile(plan).bounded()
