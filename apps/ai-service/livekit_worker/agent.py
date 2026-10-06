from uuid import UUID

from livekit.agents import (
    Agent,
    ChatContext,
    ChatMessage,
    StopResponse,
)
from interview.models import UserTurnCompletedPayload
from lib.logging.logging import get_logger
from livekit_worker.interview_agent_registry import InterviewAgentRegistry
from livekit_worker.message_publisher import RealtimeMessagePublisher
from livekit_worker.models import DataChannelMesage, MessageType, ParticipantMetadata, TranscriptPayload
from interview.factory import get_interview_coordinator

logger = get_logger(__name__)

class InterviewAgent(Agent):
    def __init__(
        self, 
        session_id: UUID,
        metadata: ParticipantMetadata,
        participant_id: UUID,
        message_publisher: RealtimeMessagePublisher,
    ):
        super().__init__(instructions="")
        self.session_id = session_id
        self._room_metadata = metadata
        self.participant_id = participant_id
        self._message_publisher = message_publisher
    
    async def on_enter(self) -> None:
        InterviewAgentRegistry.register(
            self.session_id,
            self
        )
        payload = TranscriptPayload(
            session_id = self.session_id,
            participant_id = self.participant_id,
            transcript = "AI agent connected successfully",
            role = "ai"
        )
        await self._message_publisher.publish(DataChannelMesage(
            type=MessageType.TRANSCRIPT,
            payload= payload.model_dump(mode="json")
        ))
        logger.info("Message sent succefully")
    async def on_exit(self) -> None:
        InterviewAgentRegistry.remove(self.session_id)
    
    
    async def on_user_turn_completed(
        self, 
        turn_ctx: ChatContext,
        new_message: ChatMessage
    ) -> None:
        transcript = new_message.text_content
        if not transcript:
            raise StopResponse()
        
        logger.info("turn_completed", session_id=self.session_id, transcript_length=len(transcript))
        
        payload = TranscriptPayload(
            session_id = self.session_id,
            participant_id = self.participant_id,
            transcript = transcript,
            role = self._room_metadata.role
        )
        await self._message_publisher.publish(DataChannelMesage(
            type=MessageType.TRANSCRIPT,
            payload= payload.model_dump(mode="json")
        ))
        
        coordinator = get_interview_coordinator()
        await coordinator.on_user_turn_complete(UserTurnCompletedPayload(
            transcript=transcript,
            session_id=self.session_id,
            participant_id=self.participant_id,
            role=self._room_metadata.role
        ))
        
    async def handle_interviewer_response(
        self,
        response: str,
    ):
        # this transcript is the agent's own speech, not the candidate's turn,
        # so it must be attributed to the AI role
        payload = TranscriptPayload(
            session_id = self.session_id,
            participant_id = self.participant_id,
            transcript = response,
            role = "ai"
        )
        await self._message_publisher.publish(DataChannelMesage(
            type=MessageType.TRANSCRIPT,
            payload=payload.model_dump(mode="json")
        ))
        await self.session.say(response)