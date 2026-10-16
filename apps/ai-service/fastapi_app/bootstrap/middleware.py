from fastapi import FastAPI
from fastapi_app.middlewares.logging import request_id_middleware


def register_middleware(app: FastAPI) -> None:
    app.middleware("http")(request_id_middleware)
