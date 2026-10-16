from pydantic import BaseModel
import structlog
from events.payloads import RuntimeContextUpdated
from services.session_runtime_context import SessionRuntimeContextService
from stream_worker.handlers.base import IStreamEventHandler

logger = structlog.get_logger(__name__)
class UpdateRuntimeContextHandler(IStreamEventHandler):
    
    def __init__(
        self,
        runtime_context_service: SessionRuntimeContextService             
    ) -> None:
        self._runtime_context_service = runtime_context_service
    
    async def handle(self, payload: BaseModel) -> None:
        if not isinstance(payload, RuntimeContextUpdated):
            raise ValueError(f"Invalid payload type for CreateTurnHandler: {type(payload)}")
        
        try:
            await self._runtime_context_service.update_ctx_persistently(
                payload.session_id,
                payload,
            )
            logger.info(f"Runtime context updated for session_id: {payload.session_id}")
        
        except Exception as e:
            logger.error(f"Error updating runtime context for session_id: {payload.session_id}. Error: {str(e)}")
            raise