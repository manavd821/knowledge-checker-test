from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
import structlog

from exceptions.AppError import AppError

logger = structlog.get_logger(__name__)

GENERIC_ERROR = {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "something went wrong. Please try again later",
}

_LOG_LEVELS = {
    "DEBUG": "debug",
    "INFO": "info",
    "WARN": "warning",
    "ERROR": "error",
    "FATAL": "critical",
}


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    log = getattr(logger, _LOG_LEVELS.get(exc.log_level, "error"))
    if exc.status_code >= 500:
        logger.error(
            "http exception",
            status_code=exc.status_code,
            error_type=type(exc).__name__,
        )
        return JSONResponse(GENERIC_ERROR, status_code=exc.status_code)

    log(
            "application error",
            code=str(exc.code),
            status_code=exc.status_code,
            error_type=type(exc).__name__,
        )
    return JSONResponse(
        {"detail": exc.cause},
        status_code=exc.status_code,
        headers=getattr(exc, "headers", None),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.critical(
        "unhandled error",
        error=str(exc),
        error_type=type(exc).__name__,
    )
    return JSONResponse(GENERIC_ERROR, status_code=500)
