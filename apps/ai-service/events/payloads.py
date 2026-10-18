from collections import deque
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from models.enums import ContentType, Difficulty, Speaker
from models.interview_runtime_context import InterviewRuntimeContext

class CandidateTurnCompleted(BaseModel):
    model_config = ConfigDict(
        use_enum_values=True,
    )

    session_id: UUID
    participant_id: UUID
    turn_id: UUID
    
    speaker: Speaker = Speaker.CANDIDATE
    content: str
    content_type: ContentType = ContentType.ANSWER
    
    user_audio_duration_sec: float | None = None

class InterviewerTurnCompleted(BaseModel):
    model_config = ConfigDict(
        use_enum_values=True,
    )
    
    session_id: UUID
    participant_id: UUID
    turn_id: UUID

    speaker: Speaker = Speaker.INTERVIEWER
    content: str
    content_type: ContentType = ContentType.QUESTION

    tokens_used: int | None = None

class CandidateTurnUpdated(BaseModel):
    session_id: UUID
    turn_id: UUID

    evaluation_score: float | None = None
    evaluation_feedback: str | None = None
    evaluation_rubric: dict | None = None
    
class RuntimeContextUpdated(BaseModel):
    session_id: UUID

    fundamental_phase: bool
    current_difficulty: Difficulty

    previous_score: float | None
    overall_score: float | None

    current_question: str | None
    questions_asked: int

    active_context: str | None
    context_tokens: int

    interview_runtime_context: InterviewRuntimeContext | None = None

    version: int

class InterviewerResponseReady(BaseModel):
    session_id: UUID
    response: str
    
class SessionPausedPayload(BaseModel):
    session_id: UUID
    reason: str
