import { db } from "@/db/client";
import { ConfigurationError } from "@/exceptions/ConfigurationError";
import { NotFoundError } from "@/exceptions/NotFoundError";
import { withRequestContextAndErrorHandling } from "@/lib/api/wrap-routes";
import { getRequestContext } from "@/lib/logging/request-contexts";
import get_logger from "@/lib/logging/logger-factory";
import { LiveSessionInfoSchema } from "@/modules";
import { createServices } from "@/modules/factory";
import { DeleteSessionSuccess } from "@/shared/dto/sessions/delete-session.dto";
import { GetSessionSuccess } from "@/shared/dto/sessions/get-session.dto";
import { NextRequest, NextResponse } from "next/server";


export const GET = withRequestContextAndErrorHandling(async (
    req: NextRequest,
    { params } : { params : Promise<{session_id: string}> },
) => {
    const { session_id } = await params;
    const session_service = createServices(db).sessions;
    const data = await session_service.get_session(session_id);
    const logger = get_logger();

    if(!data){
            throw new NotFoundError(
                `Session not found`,
                session_id,
                "session_id",
            );
        }
        logger.info(
            "Session fetched successfully",
            {session_id, session_status: data?.status}
        )
    const zod_res = LiveSessionInfoSchema.safeParse({
        ...data,
        scheduled_at: data.scheduled_at.toISOString(),
        started_at: data.started_at?.toISOString(),
        ended_at: data.ended_at?.toISOString(),
    });
    if(!zod_res.success){
        throw new ConfigurationError(
            "incorrect LiveSessionInfoSchema",
            {issues : zod_res.error.issues},
        )
    }
    const res = {
        success : true,
        data : zod_res.data
    } satisfies GetSessionSuccess;
    return NextResponse.json(res, { status : 200 });
})

export const DELETE = withRequestContextAndErrorHandling(async (
    req: NextRequest,
    { params } : { params : Promise<{session_id: string}> },
) => {
    const { session_id } = await params;
    const user_id = getRequestContext()?.user_id ?? "";
    const logger = get_logger();

    const deleted = await db.transaction(async (tx) => {
        return createServices(tx).sessions.deleteSession(session_id, user_id);
    });

    logger.info("Session deleted successfully", { session_id, user_id });

    const res = {
        success: true,
        data: {
            session_id: deleted.session_id,
        },
    } satisfies DeleteSessionSuccess;

    return NextResponse.json(res, { status: 200 });
})