import asyncio
from collections import defaultdict
from pydantic import BaseModel

from events.enums import LiveSessionEvent
from events.handlers.base import IEventHandler
from events.registry import EventRegistry


class EventBus:

    def __init__(
        self,
        event_registry: EventRegistry,
    ):
        self._event_registry = event_registry

        self._handlers: dict[
            LiveSessionEvent,
            set[IEventHandler],
        ] = defaultdict(set)

    def subscribe(
        self,
        event: LiveSessionEvent,
        handlers: IEventHandler | list[IEventHandler],
    ) -> None:
        if isinstance(handlers, list):
            self._handlers[event].update(handlers)
        else:
            self._handlers[event].add(handlers)

    async def publish(
        self,
        event: LiveSessionEvent,
        payload: BaseModel,
    ) -> None:
        payload_type = self._event_registry.get_payload_type(
            event,
        )

        if not isinstance(payload, payload_type):
            raise TypeError(
                f"Invalid payload for event "
                f"{event.value}. "
                f"Expected {payload_type.__name__}, "
                f"got {type(payload).__name__}."
            )

        handlers = self._handlers.get(event, set())

        await asyncio.gather(
            *(handler.handle(event, payload) for handler in handlers)
        )
        
    async def publish_sync(
            self,
            event: LiveSessionEvent,
            payload: BaseModel,
        ) -> None:
            payload_type = self._event_registry.get_payload_type(
                event,
            )
    
            if not isinstance(payload, payload_type):
                raise TypeError(
                    f"Invalid payload for event "
                    f"{event.value}. "
                    f"Expected {payload_type.__name__}, "
                    f"got {type(payload).__name__}."
                )
    
            handlers = self._handlers.get(event, set())
    
            for handler in handlers:
                await handler.handle(event, payload)

    async def shutdown(self) -> None:
        """
        Stop accepting new work and wait for the background tasks of every
        subscribed handler.

        The owner of the event loop must await this before closing shared
        clients or shutting down the loop executor.
        """
        handlers: set[IEventHandler] = set()
        for subscribed in self._handlers.values():
            handlers.update(subscribed)

        if not handlers:
            return

        await asyncio.gather(
            *(handler.drain() for handler in handlers),
        )