import { z } from "zod";
import { SessionSummarySchema } from "@/modules";
import { ApiErrorSchema, createSuccessResponseSchema } from "@/shared/dto/api-response.dto";

export const ListSessionsSuccessSchema =
    createSuccessResponseSchema(z.array(SessionSummarySchema));

export type ListSessionsSuccess = z.infer<typeof ListSessionsSuccessSchema>;

export const ListSessionsResponseSchema = z.union([
    ApiErrorSchema,
    ListSessionsSuccessSchema,
]);

export type ListSessionsResponse = z.infer<typeof ListSessionsResponseSchema>;