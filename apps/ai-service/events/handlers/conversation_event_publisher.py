from pydantic import BaseModel
import structlog

from events.enums import HandlerPolicy, LiveSessionEvent
from events.handlers.base import IEventHandler
from lib.redis.stream.base import IRedisStream
from stream_worker.stream_events import StreamEvent
from stream_worker.enums import CONVERSATION_STREAM_KEY

logger = structlog.get_logger(__name__)
class ConversationEventPublisher(IEventHandler):

    def __init__(
        self,
        redis_stream: IRedisStream,
    ):
        self._redis_stream = redis_stream

    @property 
    def policy(self) -> HandlerPolicy:
        return HandlerPolicy.CRITICAL

    def _get_stream_event(
        self,
        event: LiveSessionEvent,
    ) -> StreamEvent | None:
        match(event):
            case LiveSessionEvent.CANDIDATE_TURN_COMPLETED:
                return StreamEvent.CREATE_TURN_EVENT
            
            case LiveSessionEvent.INTERVIEWER_TURN_COMPLETED:
                return StreamEvent.CREATE_TURN_EVENT
            
            case LiveSessionEvent.CANDIDATE_TURN_UPDATE:
                return StreamEvent.UPDATE_CANDIDATE_TURN_EVENT
            
            case LiveSessionEvent.RUNTIME_CONTEXT_UPDATED:
                return StreamEvent.RUNTIME_CONTEXT_UPDATED
            case _:
                return None
    
    async def handle(
        self,
        event: LiveSessionEvent,
        payload: BaseModel,
    ) -> None:
        stream_event = self._get_stream_event(event)
        if stream_event is None:
            raise ValueError(f"Unsupported event type: {event}")
        
        fields = {
            "event" : stream_event.value,
            "payload" : payload.model_dump_json(),
        }
        try:
            message_id = await self._redis_stream.add(
                CONVERSATION_STREAM_KEY,
                fields,
            )
            logger.info(
                "Published conversation event to Redis stream",
                stream_event=stream_event.value,
                message_id=message_id,
            )

        except Exception:
            logger.exception(
                "Failed to publish conversation event to Redis stream",
                event=stream_event.value,
            )
            raise
            