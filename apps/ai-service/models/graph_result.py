from pydantic import BaseModel
from models.enums import (
    ContentType,
    Difficulty,
)
from models.interview_runtime_context import InterviewRuntimeContext

    
class GraphResult(BaseModel):

    fundamental_phase: bool
    current_difficulty: Difficulty
    
    evaluation_score: float | None = None
    evaluation_feedback: str | None = None
    evaluation_rubric: dict | None = None
    
    previous_score: float | None = None
    overall_score: float | None = None

    next_question: str | None = None
    question_asked: int 
    content_type: ContentType | None = None

    final_response: str | None = None

    needs_summarization: bool | None = None
    active_context: str | None = None # changes on every graph execution
    context_tokens: int

    interview_runtime_context: InterviewRuntimeContext | None = None
    
    runtime_version: int
    