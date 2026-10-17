import { z } from "zod";
import {
    ApiErrorSchema,
    createSuccessResponseSchema,
} from "@/shared/dto/api-response.dto";

export const DeleteSessionSchema = z.object({
    session_id: z.string(),
});

export const DeleteSessionSuccessSchema =
    createSuccessResponseSchema(DeleteSessionSchema);

export type DeleteSessionSuccess =
    z.infer<typeof DeleteSessionSuccessSchema>;

export const DeleteSessionResponseSchema = z.union([
    ApiErrorSchema,
    DeleteSessionSuccessSchema,
]);

export type DeleteSessionResponse =
    z.infer<typeof DeleteSessionResponseSchema>;

export type DeleteSession =
    z.infer<typeof DeleteSessionSchema>;
