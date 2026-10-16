from fastapi import FastAPI

from exceptions.AppError import AppError
from fastapi_app.error_handler import (
    app_error_handler,
    unhandled_exception_handler,
)


def add_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
