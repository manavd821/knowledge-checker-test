from functools import lru_cache

from events.bus import EventBus
from events.enums import LiveSessionEvent
from events.handlers.interviewer_response_ready import InterviewerResponseReadyHandler
from events.handlers.session_processor import SessionProcessor
from events.handlers.conversation_event_publisher import ConversationEventPublisher
from events.registry import EventRegistry
from graph.dependencies import get_graph_runtime, get_graph_selector
from lib.redis.factory import get_stream_redis_cloud
from services.factory import get_session_context_store, get_session_runtime_ctx_service
from events.event_publisher import EventPublisher

def get_event_registry() -> EventRegistry:
    return EventRegistry()


# Strong reference to the built bus so the shutdown path never has to
# (re)build it just to drain it. None until get_event_bus() is first used.
_built_event_bus: EventBus | None = None


@lru_cache
def get_event_bus():
    global _built_event_bus

    bus = EventBus(get_event_registry())

    stream = get_stream_redis_cloud()
    conversation_event_publisher = ConversationEventPublisher(stream)
    
    event_publisher = EventPublisher(bus)

    session_processor = SessionProcessor(
        graph_selector=get_graph_selector(),
        graph_runtime=get_graph_runtime(),
        session_ctx_store=get_session_context_store(),
        event_publisher=event_publisher,
        session_runtime_ctx_service=get_session_runtime_ctx_service(),
    )
    interview_response_ready = InterviewerResponseReadyHandler()
    
    bus.subscribe(
        LiveSessionEvent.CANDIDATE_TURN_COMPLETED,
        [
            conversation_event_publisher,
            session_processor,
        ],
    )
    bus.subscribe(
        LiveSessionEvent.INTERVIEWER_TURN_COMPLETED,
        conversation_event_publisher,
    )
    bus.subscribe(
        LiveSessionEvent.CANDIDATE_TURN_UPDATE,
        [
            conversation_event_publisher,
        ]
    )
    
    bus.subscribe(
        LiveSessionEvent.INTERVIEWER_RESPONSE_READY,
        interview_response_ready,
    )
    bus.subscribe(
        LiveSessionEvent.RUNTIME_CONTEXT_UPDATED,
        conversation_event_publisher,
    )

    _built_event_bus = bus
    return bus

def get_event_publisher():
    bus = get_event_bus()
    return EventPublisher(bus)


async def shutdown_event_bus() -> None:
    """
    Application shutdown hook.

    Waits for the background tasks of every handler (SessionProcessor's
    graph executions) so shared clients and the event loop executor are
    never closed while they are still running. Safe to call when the bus
    was never built in this process.
    """
    bus = _built_event_bus
    if bus is None:
        return

    await bus.shutdown()