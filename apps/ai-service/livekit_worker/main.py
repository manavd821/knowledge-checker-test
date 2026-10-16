import os

from livekit import agents
from livekit.agents import WorkerOptions
import structlog
from config.settings import get_settings
from livekit_worker.entrypoint import entrypoint
from dotenv import load_dotenv


load_dotenv()
logger = structlog.get_logger(__name__)

if __name__ == "__main__":
    settings = get_settings()
    try:
        agents.cli.run_app(
            WorkerOptions(
                entrypoint_fnc=entrypoint,
                ws_url=settings.LIVEKIT_URL,
                api_key=settings.LIVEKIT_API_KEY,
                api_secret=settings.LIVEKIT_API_SECRET,
                agent_name=settings.LIVEKIT_AGENT_NAME,
            )
        )
    except Exception as e:
        logger.error(f"Error: {str(e)}", error = e)