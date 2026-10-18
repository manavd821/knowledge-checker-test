import { z } from "zod";
import { InterviewPlanSchema } from "@/modules/sessions/interview-plan.schema";

export const GenerateInterviewPlanResponseSchema = z.object({
    interviewPlan: InterviewPlanSchema,
    tokenCount: z.number(),
});

export type GenerateInterviewPlanResponse =
    z.infer<typeof GenerateInterviewPlanResponseSchema>;
