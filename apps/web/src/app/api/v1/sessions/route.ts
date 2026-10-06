import { withRequestContextAndErrorHandling } from "@/lib/api/wrap-routes";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { 
    CreateSessionRouteShema,
    SessionSummarySchema,
} from "@/modules";
import { createServices } from "@/modules/factory";
import { db } from "@/db/client";
import { getRequestContext } from "@/lib/logging/request-contexts";
import { ValidationError } from "@/exceptions/ValidationError";
import { ConfigurationError } from "@/exceptions/ConfigurationError";
import { CreateSessionSuccess } from "@/shared/dto/sessions/create-session.dto";
import { ListSessionsSuccess } from "@/shared/dto/sessions/list-sessions.dto";
import get_logger from "@/lib/logging/logger-factory";

export const POST = withRequestContextAndErrorHandling(async (req : NextRequest) => {
    const user_id = getRequestContext()?.user_id!;
    const logger = get_logger();

    const formData = await req.formData();
    const session_service = createServices(db).sessions;
    //parse and validate data
    const data = session_service.parseFormData(formData);
    const result = CreateSessionRouteShema.safeParse(data);

    if(!result.success){
        logger.info(
            "Validation error",
            {issues: result.error.issues},
        )
        throw new ValidationError(
            "request payload Validation failed",
            result.error.issues,
        );
    }
    const session_id = await db.transaction(async tx => {
        const session_service = createServices(tx).sessions;
        return session_service.createSession(
            user_id, 
            result.data
        );
    });
    const res = {
        success: true,
        data : {
            session_id,
            status : "ready",
        }
    } satisfies CreateSessionSuccess;
    return NextResponse.json(res, {status : 201,})
})

/**
 * Session history for the authenticated user: only sessions the caller
 * created or participates in, newest first. Lean projection only.
 */
export const GET = withRequestContextAndErrorHandling(async () => {
    const user_id = getRequestContext()?.user_id ?? "";
    const logger = get_logger();

    const session_service = createServices(db).sessions;
    const sessions = await session_service.list_sessions_for_user(user_id);

    const data = sessions.map((s) => ({
        ...s,
        scheduled_at: s.scheduled_at.toISOString(),
        started_at: s.started_at?.toISOString() ?? null,
        ended_at: s.ended_at?.toISOString() ?? null,
        created_at: s.created_at.toISOString(),
    }));

    const parsed = z.array(SessionSummarySchema).safeParse(data);
    if (!parsed.success) {
        logger.error(
            "Failed to serialize session history",
            {issues: parsed.error.issues},
        );
        throw new ConfigurationError(
            "Failed to serialize session history",
            {issues: parsed.error.issues},
        );
    }

    logger.info("Session history fetched", {
        user_id,
        count: parsed.data.length,
    });

    const res = {
        success: true,
        data: parsed.data,
    } satisfies ListSessionsSuccess;

    return NextResponse.json(res, { status: 200 });
})