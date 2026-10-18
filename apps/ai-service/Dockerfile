# syntax=docker/dockerfile:1

# Single image for every ai-service process (fastapi, stream worker, livekit
# worker). They share the exact same dependency set, so the process is chosen at
# run time with `command` in docker-compose.yml instead of by building three
# near-identical images.

# ---------------------------------------------------------------------------
# builder: resolve dependencies from the lockfile into a virtualenv
# ---------------------------------------------------------------------------
FROM python:3.13-slim-bookworm AS builder

# uv ships the locked, reproducible installer; the official image keeps it out
# of the runtime layer.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    UV_PYTHON_DOWNLOADS=never \
    UV_PYTHON=/usr/local/bin/python3.13 \
    UV_PROJECT_ENVIRONMENT=/app/.venv

WORKDIR /app

# Dependencies are installed on their own layer so that application edits do not
# invalidate the (expensive) dependency install. `--no-install-project` is used
# because the service is run from source, not installed as a package.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# ---------------------------------------------------------------------------
# runtime: copy the virtualenv and the source, run as a non-root user
# ---------------------------------------------------------------------------
FROM python:3.13-slim-bookworm AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOME=/home/app \
    PATH="/app/.venv/bin:$PATH"

RUN useradd --create-home --uid 1001 app

WORKDIR /app

# Both stages use the same base image, so the interpreter baked into the venv
# (/usr/local/bin/python3.13) is identical and the copy stays relocatable.
COPY --from=builder --chown=app:app /app/.venv /app/.venv
COPY --chown=app:app . .

USER app

# Only the fastapi process listens on a port; the workers are outbound-only.
EXPOSE 8000

# Default to the HTTP API. docker-compose.yml overrides this for the workers.
CMD ["uvicorn", "fastapi_app.main:app", "--host", "0.0.0.0", "--port", "8000"]
