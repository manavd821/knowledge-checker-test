from uuid import UUID

from livekit.agents import (
    JobContext,
    AgentSession,
    TurnHandlingOptions,
    inference
)
from livekit.rtc import RemoteParticipant
import structlog
from execution_profile.enums import ExecutionProfile
from lib.logging.logging import configure_logging
from livekit_worker.agent import InterviewAgent
from livekit_worker.lifespan import clean_up
from livekit_worker.message_publisher import RealtimeMessagePublisher
from livekit_worker.models import ParticipantMetadata
from speech_llm.enums import SpeechTasks
from speech_llm.factory import get_stt_factory, get_tts_factory


configure_logging()
logger = structlog.get_logger(__name__)

async def entrypoint(ctx : JobContext):
    ctx.add_shutdown_callback(clean_up)
    session_id = ctx.room.name
    logger.info("job_dispatch", session_id=session_id, job_id=ctx.job.id)

    
    @ctx.room.on("participant_connected")
    def on_participant_join(participant: RemoteParticipant):
        logger.info("participant_connected", session_id=session_id, identity=participant.identity)
    
    await ctx.connect()
    room_sid = await ctx.room.sid
    logger.info("worker_connected_to_room", session_id=session_id, room_sid=room_sid)

    participant = await ctx.wait_for_participant()
    participant_id = participant.identity
    metadata = ParticipantMetadata.model_validate_json(participant.metadata)

    # Speech-to-text / text-to-speech are resolved through the same
    # config-driven selection the LLM tasks use: the profile picks the
    # provider + model, never the worker.
    speech_profile = ExecutionProfile.BALANCED
    stt = get_stt_factory().create(SpeechTasks.LIVE_STT, speech_profile)
    tts = get_tts_factory().create(SpeechTasks.LIVE_TTS, speech_profile)

    session = AgentSession(
        stt = stt,
        tts = tts,
        turn_handling=TurnHandlingOptions(
            turn_detection=inference.TurnDetector(),
            endpointing={
                "mode":"dynamic",
                "min_delay":2,
                "max_delay": 4
            }
        )
    )
    message_publisher = RealtimeMessagePublisher(ctx.room)
    await session.start(
        room=ctx.room,
        agent=InterviewAgent(
            session_id=UUID(session_id),
            metadata=metadata,
            participant_id=UUID(participant_id),
            message_publisher=message_publisher,
        ),
    )