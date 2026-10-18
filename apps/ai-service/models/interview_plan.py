from typing import Literal

from pydantic import BaseModel, Field

PRIORITY = Literal["low", "medium", "high"]
EXPECTED_DEPTH = Literal["foundational", "practical", "advanced"]


class InterviewPlanTopic(BaseModel):
    topic: str = Field(
        description="A subject the interview intends to cover.",
    )
    objectives: list[str] = Field(
        description="Concepts or objectives that should be explored within this topic.",
    )
    priority: PRIORITY = Field(
        description="Relative importance of this topic for the session.",
    )
    expected_depth: EXPECTED_DEPTH = Field(
        description="How deep the interview should go on this topic.",
    )


class InterviewPlan(BaseModel):
    topics: list[InterviewPlanTopic] = Field(
        description="Topics to cover, ordered by the intended coverage progression.",
    )
