from abc import ABC, abstractmethod
from pydantic import BaseModel

from events.enums import HandlerPolicy, LiveSessionEvent


class IEventHandler(ABC):
    
    @property
    @abstractmethod
    def policy(self) -> HandlerPolicy:
        raise NotImplementedError

    @abstractmethod
    async def handle(
        self,
        event: LiveSessionEvent,
        payload: BaseModel,
    ) -> None:
        raise NotImplementedError

    async def drain(self) -> None:
        """
        Wait for every background task this handler started.

        Called by the application shutdown path AFTER new events have
        stopped and BEFORE shared clients / the event loop executor are
        closed. Handlers that spawn background work must override this.
        """
        return None