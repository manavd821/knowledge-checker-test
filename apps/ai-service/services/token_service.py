from langchain_core.messages.utils import count_tokens_approximately
import structlog

from llm.enums import Tasks
from llm.gateway import LLMGateway

logger = structlog.get_logger(__name__)

class TokenService:
    def __init__(
        self,
        llm_gateway: LLMGateway | None = None
    ) -> None:
        self._llm_gateway = llm_gateway
    
    def count_tokens_get_model_for_task(
        self, 
        text : str,
        task: Tasks
    ) -> int:
        """
        expensive call. 
        May do api call and increase latency. Use only if needed
        """
        if not self._llm_gateway:
            return count_tokens_approximately(text)
        llm = self._llm_gateway.get_model(task)
        try:
            count = llm.get_num_tokens(text) # type: ignore
        except NotImplementedError:
            count = count_tokens_approximately(text)
        return count
    
    def estimate_tokens(
        self, 
        text : str | None,
    ) -> int:
        """
        Returns approximate number of tokens using langchain's `count_tokens_approximately` method
        """
        return count_tokens_approximately(
            messages=text,
            chars_per_token=4.0,
            extra_tokens_per_message=3.0,
        ) if text else 0
    
        