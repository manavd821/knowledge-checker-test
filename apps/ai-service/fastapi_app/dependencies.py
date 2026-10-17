import secrets

from fastapi import Header

from config.settings import get_settings
from exceptions.ConfigurationError import ConfigurationError
from exceptions.UnauthorizedError import UnauthorizedError

SERVICE_SECRET_HEADER = "X-AI-Service-Secret"


async def verify_service_secret(
    x_ai_service_secret: str | None = Header(
        default=None,
        alias=SERVICE_SECRET_HEADER,
    ),
) -> None:
    """
    Guards internal endpoints against requests from outside the BFF.

    Fails closed: an unconfigured secret is treated as a server misconfiguration
    and rejected, never as "no auth required". The presented value is compared
    in constant time and is never logged.
    """
    expected = get_settings().AI_SERVICE_SHARED_SECRET

    if not expected:
        raise ConfigurationError(
            "AI service shared secret is not configured",
        )

    if x_ai_service_secret is None or not secrets.compare_digest(
        x_ai_service_secret,
        expected,
    ):
        raise UnauthorizedError("Invalid or missing AI service secret")
