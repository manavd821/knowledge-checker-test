from pydantic import BaseModel
import structlog
from models.turns import CreateTurn
from stream_worker.handlers.base import IStreamEventHandler
from stream_worker.payloads import CreateTurnEventPayload
from services.turn_service import TurnService

logger = structlog.get_logger(__name__)
class CreateTurnHandler(IStreamEventHandler):
    
    def __init__(
        self,
        turn_service: TurnService             
    ) -> None:
        self._turn_service = turn_service
    
    async def handle(self, payload: BaseModel) -> None:
        if not isinstance(payload, CreateTurnEventPayload):
            raise ValueError(f"Invalid payload type for CreateTurnHandler: {type(payload)}")
        
        try:
            
            turn = await self._turn_service.create_turn(
                session_id=payload.session_id,
                turn=CreateTurn.model_validate(
                    payload.model_dump()
                ),
            )
            logger.info(f"Turn created successfully: {turn.turn_id}")
        
        except Exception as e:
            logger.error(f"Error creating turn: {e}", error = e)
            raise