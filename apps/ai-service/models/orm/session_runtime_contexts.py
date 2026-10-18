from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from models.orm.base import Base


class SessionRuntimeContext(Base):
    __tablename__ = "session_runtime_context"

    session_runtime_context_id: Mapped[UUID] = mapped_column(
        primary_key=True,
        server_default="gen_random_uuid()",
    )

    session_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "sessions.session_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    turn_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    questions_asked: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    fundamental_phase: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )

    current_difficulty: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    current_question: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )

    previous_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    overall_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    active_context: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    context_tokens: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    interview_runtime_context: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default="now()",
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default="now()",
    )