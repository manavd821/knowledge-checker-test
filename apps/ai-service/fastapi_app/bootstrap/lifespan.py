from contextlib import asynccontextmanager
from fastapi import FastAPI
import structlog
from config.settings import get_settings
from lib.logging.logging import configure_logging


@asynccontextmanager 
async def lifespan(app : FastAPI):
    configure_logging()
    get_settings()
    logger = structlog.get_logger(__name__)
    logger.info(f"fastapi service started", service = "knowledge-checker-ai-service")
    yield
    logger.info(f"fastapi service shutting down", service = "knowledge-checker-ai-service")
