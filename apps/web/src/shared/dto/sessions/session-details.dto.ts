import { z } from "zod";
import { SessionDetailsSchema } from "@/modules";
import { ApiErrorSchema, createSuccessResponseSchema } from "@/shared/dto/api-response.dto";

export const GetSessionDetailsSuccessSchema =
    createSuccessResponseSchema(SessionDetailsSchema);

export type GetSessionDetailsSuccess = z.infer<typeof GetSessionDetailsSuccessSchema>;

export const GetSessionDetailsResponseSchema = z.union([
    ApiErrorSchema,
    GetSessionDetailsSuccessSchema,
]);

export type GetSessionDetailsResponse = z.infer<typeof GetSessionDetailsResponseSchema>;