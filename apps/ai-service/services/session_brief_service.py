from langchain_core.output_parsers import StrOutputParser
from llm.enums import Tasks
from llm.gateway import LLMGateway
from models.enums import (
    TopicType,
    RoleLevel,
    Difficulty,
    Domain,
    AI_STRICTNESS,
)
from prompts.registry import get_prompt

# The BFF bounds extracted document text before sending it (see
# MAX_BRIEF_DOCUMENT_CHARS in the web app). This is a defensive upper bound so
# an oversized payload is rejected with a validation error instead of reaching
# the model.
MAX_DOCUMENT_TEXT_CHARS = 20000

class SessionBriefService:
    task = Tasks.SESSION_BRIEF
    def __init__(
        self,
        llm_gateway : LLMGateway,
    ) -> None:
        self._llm_gateway = llm_gateway

    def get_chain(self):
        llm = self._llm_gateway.get_model(self.task)
        prompt = get_prompt(self.task)
        return prompt | llm | StrOutputParser(name="SessionBriefService")

    async def generate_brief(
        self,
        topic_type : TopicType,
        role_level : RoleLevel,
        difficulty : Difficulty,
        domain : Domain,
        ai_strictness : AI_STRICTNESS,
        custom_domain : str | None = None,
        custom_instructions : str | None = None,
        document_text : str | None = None,
    ) -> str:
        chain = self.get_chain()
        return await chain.ainvoke({
            "topic_type" : topic_type,
            "role_level" : role_level,
            "difficulty" : difficulty,
            "domain" : domain,
            "custom_domain" : custom_domain,
            "ai_strictness" : ai_strictness,
            "custom_instructions" : custom_instructions,
            "document_text" : document_text,
        })
