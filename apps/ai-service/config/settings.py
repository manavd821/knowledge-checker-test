from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import structlog


load_dotenv()

logger = structlog.get_logger(__name__)

class Settings(BaseSettings):
    DATABASE_URL : str
    UPSTASH_REDIS_REST_URL: str
    UPSTASH_REDIS_REST_TOKEN: str
    UPSTASH_REDIS_URL: str
    
    REDIS_URL : str
    GRAPH_REDIS_TTL_MINUTES: int
    
    DEEPGRAM_API_KEY : str
    LIVEKIT_URL : str
    LIVEKIT_API_KEY: str
    LIVEKIT_API_SECRET : str
    LIVEKIT_AGENT_NAME : str
    CARTESIA_API_KEY: str
    GOOGLE_API_KEY : str
    
    LANGCHAIN_API_KEY : str
    LANGCHAIN_TRACING_V2 : bool
    LANGCHAIN_PROJECT : str
    
    THRESHOLD_SUMMARIZE: int
    FUNDAMENTAL_PHASE_COUNT: int

    AI_SERVICE_SHARED_SECRET: str
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

@lru_cache
def get_settings() -> Settings : 
    try:
        logger.info("loading environment variables...")
        settings = Settings() # type: ignore
        logger.info("environment variable loaded succesfully")
        return settings
    except Exception as e:
        print("Failed to load environment variables: ", e)
        raise
