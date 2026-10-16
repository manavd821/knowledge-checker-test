import uuid

import structlog
from fastapi import Request, Response


async def request_id_middleware(request: Request, call_next) -> Response:
    structlog.contextvars.clear_contextvars()

    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    structlog.contextvars.bind_contextvars(req_id=request_id)

    try:
        response: Response = await call_next(request)
    finally:
        structlog.contextvars.clear_contextvars()

    response.headers["X-Request-ID"] = request_id
    return response
