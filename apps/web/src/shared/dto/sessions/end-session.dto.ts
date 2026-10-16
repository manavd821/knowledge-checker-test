import { z } from "zod";
import {
    ApiErrorSchema,
    createSuccessResponseSchema,
} from "@/shared/dto/api-response.dto";
import { STATUS } from "@/db/enums";

export const EndSessionSchema = z.object({
    session_id: z.string(),
    status: z.enum(STATUS),
});

export const EndSessionSuccessSchema =
    createSuccessResponseSchema(EndSessionSchema);

export type EndSessionSuccess =
    z.infer<typeof EndSessionSuccessSchema>;

export const EndSessionResponseSchema = z.union([
    ApiErrorSchema,
    EndSessionSuccessSchema,
]);

export type EndSessionResponse =
    z.infer<typeof EndSessionResponseSchema>;

export type EndSession =
    z.infer<typeof EndSessionSchema>;
