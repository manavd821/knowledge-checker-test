from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    create_async_engine, 
    async_sessionmaker,
    AsyncEngine,
    AsyncSession,
)
from contextlib import asynccontextmanager

import structlog

logger = structlog.get_logger(__name__)

class Database:
    """Holds the Neon Postgresql connection. One instance for the app"""
    def __init__(
        self, 
        connection_string : str,
        pool_size : int = 10,
        max_overflow : int = 5,
        pool_timeout : int = 30,
        pool_pre_ping : bool = True,
        connect_args : dict = {"ssl" : "require"},
    ) -> None:
        self._engine : AsyncEngine = create_async_engine(
            connection_string,
            pool_size = pool_size, # Keeps up to 10 connections open persistently
            max_overflow = max_overflow, # Allows up to 5 extra temporary connections
            pool_timeout = pool_timeout, # Seconds to wait for a free connection before throwing an error
            pool_pre_ping=pool_pre_ping,
            connect_args = connect_args
        )
        # self._engine = create_async_engine(
        #     connection_string,
        #     poolclass=NullPool,
        #     connect_args=connect_args,
        # )
        # sessionmaker is a FACTORY — build it once, call it many times to get sessions
        self._session_factory = async_sessionmaker(
            self._engine,
            expire_on_commit=False,
        )
        logger.info("DB connection pool created")
    
    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Returns a NEW session each call. Cheap — does not open a connection yet"""
        async with self._session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            
    async def healthcheck(self):
        try:
            async with self.get_session() as session:
                await session.execute(text("SELECT 1"))
                logger.info("Neon DB is healthy")
        except Exception as e:
            logger.exception(
                "Unable to connect neon DB",
                error_type = type(e).__name__,
                error = e
            )
            return {"status": "unhealthy", "details": str(e)}
    
    

