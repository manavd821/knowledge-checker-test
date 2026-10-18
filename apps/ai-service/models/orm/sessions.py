from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Boolean,
    DateTime,
    Index,
    Integer,
    Text,
    Float,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from models.orm.base import Base, pg_value_enum

from models.enums import (
    STATUS,
    SessionType,
    TopicType,
    RoleLevel,
    Difficulty,
    Domain,
    AI_STRICTNESS,
)

class Session(Base):
    __tablename__ = "sessions"

    session_id: Mapped[UUID] = mapped_column(
        primary_key=True,
        server_default="gen_random_uuid()",
    )

    created_by: Mapped[str] = mapped_column(
        Text,
        ForeignKey(
            "users.user_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    status: Mapped[STATUS] = mapped_column(
        pg_value_enum(
            STATUS,
            pg_name="status",
        ),
        nullable=False,
        server_default=STATUS.PREPARING.value,
    )

    session_type: Mapped[SessionType] = mapped_column(
        pg_value_enum(
            SessionType,
            pg_name="session_type",
        ),
        nullable=False,
    )

    topic_type: Mapped[TopicType] = mapped_column(
        pg_value_enum(
            TopicType,
            pg_name="topic_type",
        ),
        nullable=False,
    )

    role_level: Mapped[RoleLevel] = mapped_column(
        pg_value_enum(
            RoleLevel,
            pg_name="role_level",
        ),
        nullable=False,
    )

    difficulty: Mapped[Difficulty] = mapped_column(
        pg_value_enum(
            Difficulty,
            pg_name="difficulty",
        ),
        nullable=False,
    )

    domain: Mapped[Domain] = mapped_column(
        pg_value_enum(
            Domain,
            pg_name="domain",
        ),
        nullable=False,
    )

    custom_domain: Mapped[str | None] = mapped_column(
        Text,
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    ai_strictness: Mapped[AI_STRICTNESS] = mapped_column(
        pg_value_enum(
            AI_STRICTNESS,
            pg_name="ai_strictness",
        ),
        nullable=False,
    )

    realtime_transcript: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="true",
    )

    ai_hints_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    camera_required: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default="false",
    )

    custom_instructions: Mapped[str | None] = mapped_column(
        Text,
    )

    session_brief: Mapped[str | None] = mapped_column(
        Text,
    )

    session_brief_tokens: Mapped[int | None] = mapped_column(
        Integer,
    )

    interview_plan: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )

    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )

    actual_duration_sec: Mapped[int | None] = mapped_column(
        Integer,
    )

    overall_score: Mapped[float | None] = mapped_column(
        Float,
    )

    total_turns: Mapped[int | None] = mapped_column(
        Integer,
        server_default="0",
    )

    questions_asked: Mapped[int | None] = mapped_column(
        Integer,
        server_default="0",
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

    __table_args__ = (
        Index(
            "sessions_user_id_idx",
            "created_by",
        ),
        Index(
            "session_status_idx",
            "status",
        ),
    )