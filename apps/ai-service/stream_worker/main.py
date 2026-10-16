import asyncio

import structlog

from lib.logging.logging import configure_logging
from lib.redis.client import close_redis_client, get_redis_client
from stream_worker.factory import get_redis_worker

async def main():
    configure_logging()
    logger = structlog.get_logger(__name__)
    redis_client = get_redis_client()

    try:
        worker = get_redis_worker(redis_client)
        
        await worker.start()
    
    except KeyboardInterrupt as e:
        logger.warn("Stopping the redis stream...")
        
    except Exception:
        raise
    finally:
        await close_redis_client(redis_client)
        
        

if __name__ == "__main__":
    asyncio.run(main())