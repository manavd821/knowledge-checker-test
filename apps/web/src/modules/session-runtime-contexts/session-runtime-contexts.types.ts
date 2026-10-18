export type CoverageDepth = "none" | "surface" | "working" | "deep";

export interface TopicCoverage {
    topic: string;
    depth: CoverageDepth;
    covered_objectives: string[];
}

export interface InterviewRuntimeContext {
    topic_coverage: TopicCoverage[];
    covered_objectives: string[];
    remaining_objectives: string[];
    recent_topics: string[];
    current_topic: string | null;
    consecutive_follow_ups: number;
    suggested_next_topic: string | null;
}
