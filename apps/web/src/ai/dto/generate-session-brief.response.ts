import { z } from "zod";

export const GenerateSessionBriefResponseSchema = z.object({
    sessionBrief: z.string(),
    tokenCount: z.number(),
});

export type GenerateSessionBriefResponse =
    z.infer<typeof GenerateSessionBriefResponseSchema>;
