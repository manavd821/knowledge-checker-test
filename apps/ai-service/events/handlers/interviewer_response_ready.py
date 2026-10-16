from pydantic import BaseModel
import structlog

from events.enums import HandlerPolicy, LiveSessionEvent
from events.handlers.base import IEventHandler
from events.payloads import InterviewerResponseReady
from livekit_worker.interview_agent_registry import InterviewAgentRegistry

logger = structlog.get_logger(__name__)
class InterviewerResponseReadyHandler(IEventHandler):
        
    @property 
    def policy(self) -> HandlerPolicy:
        return HandlerPolicy.CRITICAL

    async def handle(
        self,
        event: LiveSessionEvent,
        payload: BaseModel,
    ) -> None:
        if not isinstance(payload, InterviewerResponseReady):
            raise ValueError(f"Invalid payload type: {type(payload)}")
        
        agent = InterviewAgentRegistry.get(payload.session_id)
        await agent.handle_interviewer_response(payload.response)