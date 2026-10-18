from collections import deque
from uuid import UUID

from pydantic import BaseModel, Field

from events.payloads import CandidateTurnCompleted
from models.enums import Difficulty
from models.interview_runtime_context import InterviewRuntimeContext


class SessionExecutionState(BaseModel):
    queue: deque[CandidateTurnCompleted] = Field(
        default_factory=deque
    )
    running: bool = False
    
class SessionRuntimeContextUpdate(BaseModel):
    fundamental_phase: bool
    current_difficulty: Difficulty

    previous_score: float | None
    overall_score: float | None

    current_question: str | None
    questions_asked: int

    interview_runtime_context: InterviewRuntimeContext | None = None

    version: int

class SessionContextUpdate(BaseModel):
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
    
class MergeCandidateTurn(BaseModel):
    session_id: UUID
    participant_id: UUID
    
    turn_id: list[UUID]
    
    transcript: str
    transcript_tokens: int
    
    evaluation_turn_id: UUID