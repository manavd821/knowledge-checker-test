import { z } from "zod";

export const INTERVIEW_PLAN_PRIORITY = [
    "low",
    "medium",
    "high",
] as const;

export const INTERVIEW_PLAN_DEPTH = [
    "foundational",
    "practical",
    "advanced",
] as const;

export const InterviewPlanTopicSchema = z.object({
    topic: z.string(),
    objectives: z.array(z.string()),
    priority: z.enum(INTERVIEW_PLAN_PRIORITY),
    expected_depth: z.enum(INTERVIEW_PLAN_DEPTH),
});

export const InterviewPlanSchema = z.object({
    topics: z.array(InterviewPlanTopicSchema),
});

export type InterviewPlanPriority = z.infer<typeof InterviewPlanTopicSchema>["priority"];
export type InterviewPlanDepth = z.infer<typeof InterviewPlanTopicSchema>["expected_depth"];
export type InterviewPlanTopic = z.infer<typeof InterviewPlanTopicSchema>;
export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;
