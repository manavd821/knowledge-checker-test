import { NextRequest, NextResponse } from "next/server";

import { createServices } from "@/modules/factory";
import { db } from "@/db/client";
import { getRequestContext } from "@/lib/logging/request-contexts";
import get_logger from "@/lib/logging/logger-factory";

import {
    EndSessionSuccess,
} from "@/shared/dto/sessions/end-session.dto";
import { withRequestContextAndErrorHandling } from "@/lib/api/wrap-routes";

/**
 * Terminally completes a session (`active` / `pause` -> `completed`) and
 * folds any still-running duration into `actual_duration_sec`. Ownership is
 * enforced in the service against the authenticated user id. The status that
 * is returned is the authoritative value read back from the persisted row,
 * never an assumption made by the caller.
 */
export const POST = withRequestContextAndErrorHandling(async (
        req: NextRequest,
        { params }: { params: Promise<{ session_id: string }>; },
    ) => {
        const logger = get_logger();

        const { session_id } = await params;
        const user_id = getRequestContext()?.user_id ?? "";

        const session = await db.transaction(async (tx) => {
            const {
                sessions: session_service,
            } = createServices(tx);

            // end the session
            return await session_service.endSession(session_id, user_id);
        });

        logger.info("Session ended", {
            session_id,
            user_id,
            status: session.status,
        });

        const result = {
            success: true,
            data: {
                session_id: session.session_id,
                status: session.status,
            },
        } satisfies EndSessionSuccess;

        return NextResponse.json(result, {
            status: 200,
        });
    },
);
