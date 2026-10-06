
from livekit.agents import JobProcess

from config.settings import get_settings
from functools import lru_cache

from db.factory import get_database
from events.factory import shutdown_event_bus
from lib.logging.logging import configure_logging
from lib.redis.client import get_redis_client
from lib.redis.factory import get_cache_redis_cloud

def init_infra():
    configure_logging()
    get_settings()
    get_database()
    get_cache_redis_cloud()

async def clean_up():
    # 1. The job's event loop is about to be torn down: wait for any
    #    SessionProcessor background task (LangGraph -> Gemini -> Redis)
    #    that is still running, and stop new work from being spawned.
    await shutdown_event_bus()

    # 2. Only after the background work has finished, release shared
    #    clients so in-flight requests can no longer touch them.
    redis = get_redis_client()
    await redis.aclose() 