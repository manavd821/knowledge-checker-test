from typing import Any

import structlog

from models.graph_state import (
    InterviewGraphState,
)
from services.context_service import ContextService
from services.token_service import TokenService

logger = structlog.get_logger(__name__)

class ContextSummerizerNode:
    def __init__(
        self,
        ctx_service: ContextService,
        token_service: TokenService,
    ) -> None:
        self._ctx_service = ctx_service
        self._token_service = token_service
        
    async def __call__(
        self, 
        state: InterviewGraphState
    ) -> dict:
        updated_ctx = await self._ctx_service.summarize_ctx(
            state.context.runtime.active_context
        )
        ctx_tokens = self._token_service.estimate_tokens(updated_ctx)
        
        updated_runtime = state.context.runtime.model_copy(
            update={
                "active_context" : updated_ctx,
                "context_tokens" : ctx_tokens,
            }
        )
        updated_context = state.context.model_copy(
            update={
                "runtime" : updated_runtime
            }
        )
        
        return {
            "context" : updated_context
        }