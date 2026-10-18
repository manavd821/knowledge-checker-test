from typing import Literal

from pydantic import BaseModel, Field

from models.interview_plan import InterviewPlan

CoverageDepth = Literal["none", "surface", "working", "deep"]

RECENT_TOPIC_LIMIT = 6


class TopicCoverage(BaseModel):
    topic: str
    depth: CoverageDepth = "none"
    covered_objectives: list[str] = Field(default_factory=list)


class InterviewRuntimeContext(BaseModel):
    topic_coverage: list[TopicCoverage] = Field(default_factory=list)

    covered_objectives: list[str] = Field(default_factory=list)
    remaining_objectives: list[str] = Field(default_factory=list)

    recent_topics: list[str] = Field(default_factory=list)

    current_topic: str | None = None
    consecutive_follow_ups: int = 0

    suggested_next_topic: str | None = None

    @classmethod
    def from_plan(
        cls,
        plan: InterviewPlan | None,
    ) -> "InterviewRuntimeContext":
        if plan is None:
            return cls()

        objectives = [
            objective
            for topic in plan.topics
            for objective in topic.objectives
        ]
        return cls(
            topic_coverage=[
                TopicCoverage(topic=topic.topic)
                for topic in plan.topics
            ],
            remaining_objectives=objectives,
            suggested_next_topic=(
                plan.topics[0].topic if plan.topics else None
            ),
        )

    def reconcile(
        self,
        plan: InterviewPlan | None,
    ) -> "InterviewRuntimeContext":
        if plan is None:
            return self

        existing = {
            coverage.topic: coverage
            for coverage in self.topic_coverage
        }
        return self.model_copy(
            update={
                "topic_coverage": [
                    existing.get(topic.topic, TopicCoverage(topic=topic.topic))
                    for topic in plan.topics
                ],
            }
        )

    def bounded(self) -> "InterviewRuntimeContext":
        return self.model_copy(
            update={
                "recent_topics": self.recent_topics[-RECENT_TOPIC_LIMIT:],
            }
        )
