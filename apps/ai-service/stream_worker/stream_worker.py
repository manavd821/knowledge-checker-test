import structlog

from lib.redis.stream.base import IRedisStream
from stream_worker.stream_event_router import StreamEventRouter
from stream_worker.stream_events import StreamEvent
from stream_worker.stream_event_registry import StreamEventRegistry

logger = structlog.get_logger(__name__)

class RedisStreamWorker:
    def __init__(
        self,
        stream: IRedisStream,
        router: StreamEventRouter,
        stream_key: str,
        group: str,
        consumer: str,
    ) -> None:
        self._stream = stream
        self._router = router
        self._stream_key = stream_key
        self._group = group
        self._consumer = consumer

        self._running = True

    async def start(self) -> None:
        await self._stream.ensure_group(
            key=self._stream_key,
            group=self._group,
        )
        logger.info(
            "Starting Redis stream worker",
            extra={
                "stream": self._stream_key,
                "group": self._group,
                "consumer": self._consumer,
            },
        )
        
        await self.run()
        
    async def run(self):
        while self._running:
            
            messages = await self._stream.read_group(
                key=self._stream_key,
                group=self._group,
                consumer=self._consumer,
            )
            
            for _, entries in messages:
                for message_id, fields in entries:
                    await self._process_message(
                        message_id=message_id,
                        fields=fields,
                    )
    
    async def _process_message(
        self,
        message_id: str,
        fields: dict,
    ):
        try:
            event = StreamEvent(fields["event"])
            payload = StreamEventRegistry.deserialize_payload(
                event=event,
                raw_payload=fields["payload"],
            )
            
            await self._router.handle_together(
                event,
                payload,
            )
            
            await self._stream.ack(
                self._stream_key,
                self._group,
                message_id,
            )
        except Exception:
            logger.exception(
                "Failed to process stream message",
                extra={
                    "stream": self._stream_key,
                    "message_id": message_id,
                },
            )