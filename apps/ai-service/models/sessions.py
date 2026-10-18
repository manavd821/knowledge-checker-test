from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from models.enums import (
    STATUS,
    SessionType,
    TopicType,
    RoleLevel,
    Difficulty,
    Domain,
    AI_STRICTNESS,
)
from models.session_runtime_context import SessionRuntimeContextBase
from models.interview_plan import InterviewPlan
class SessionCreate(BaseModel):
    created_by: str

    session_type: SessionType
    topic_type: TopicType
    role_level: RoleLevel
    difficulty: Difficulty
    domain: Domain

    custom_domain: str | None = None

    duration_minutes: Literal[15, 20, 30, 45, 60, 90, 120]

    ai_strictness: AI_STRICTNESS

    realtime_transcript: bool = True
    ai_hints_enabled: bool = False
    camera_required: bool = False

    custom_instructions: str | None = None

    scheduled_at: datetime

class SelectSession(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # session_id: str
    created_by: str

    status: STATUS

    session_type: SessionType
    topic_type: TopicType
    role_level: RoleLevel
    difficulty: Difficulty
    domain: Domain

    custom_domain: str | None

    duration_minutes: int

    ai_strictness: AI_STRICTNESS

    realtime_transcript: bool
    ai_hints_enabled: bool
    camera_required: bool

    custom_instructions: str | None

    session_brief: str | None
    session_brief_tokens: int | None

    interview_plan: InterviewPlan | None = None

    scheduled_at: datetime
    started_at: datetime | None
    ended_at: datetime | None

    actual_duration_sec: int | None

    overall_score: float | None

    total_turns: int | None
    questions_asked: int | None

    created_at: datetime
    updated_at: datetime

class SessionContext(BaseModel):
    
    model_config = ConfigDict(from_attributes=True)
    
    session: SelectSession
    runtime: SessionRuntimeContextBase

class SessionRuntimeContextUpdate(BaseModel):
    fundamental_phase: bool
    current_difficulty: Difficulty
    previous_score: float | None
    overall_score: float | None
    active_context: str | None
    context_tokens: int