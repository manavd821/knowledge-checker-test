import structlog
import logging
from structlog.typing import Processor
from shared.types import LogLevel

def configure_logging(
    *, 
    log_level : LogLevel = "INFO",
    json_log : bool = True,
):
    level = getattr(logging, log_level.upper(), logging.INFO)
    
    shared_processor : list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
        structlog.processors.format_exc_info,
        structlog.processors.ExceptionPrettyPrinter(),
        
        structlog.processors.JSONRenderer() if json_log 
        else structlog.dev.ConsoleRenderer(),
        
    ]
    logging.basicConfig(
        level=level,
        format="%(message)s",
    )
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    structlog.configure(
        processors=shared_processor,
        wrapper_class=structlog.make_filtering_bound_logger(level),
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True
    )
