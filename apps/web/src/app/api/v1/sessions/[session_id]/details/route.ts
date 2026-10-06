import { withRequestContextAndErrorHandling } from "@/lib/api/wrap-routes";
import { NextRequest, NextResponse } from "next/server";
import { SessionDetailsSchema } from "@/modules";
import { createServices } from "@/modules/factory";
import { db } from "@/db/client";
import { getRequestContext } from "@/lib/logging/request-contexts";
import { ConfigurationError } from "@/exceptions/ConfigurationError";
import { GetSessionDetailsSuccess } from "@/shared/dto/sessions/session-details.dto";
import get_logger from "@/lib/logging/logger-factory";

/**
 * Results for one session: summary, turns in conversation order and the
 * persisted session-level evaluation / AI insight when one exists.
 *
 * Ownership is enforced in the service against the authenticated Clerk user
 * id (from the request context, never a client-supplied value): the creator
 * always may read it, anyone else must be a participant of the session.
 */
export const GET = withRequestContextAndErrorHandling(async (
    req : NextRequest,
    { params } : { params : Promise<{ session_id : string }> },
) => {
    const logger = get_logger();
    const { session_id } = await params;
    const user_id = getRequestContext()?.user_id ?? "";

    const session_service = createServices(db).sessions;
    const {
        session,
        turns,
        evaluation_summary,
    } = await session_service.get_session_details(session_id, user_id);

    const data = {
        session: {
            session_id: session.session_id,
            session_type: session.session_type,
            topic_type: session.topic_type,
            role_level: session.role_level,
            difficulty: session.difficulty,
            domain: session.domain,
            custom_domain: session.custom_domain,
            duration_minutes: session.duration_minutes,
            status: session.status,
            overall_score: session.overall_score,
            total_turns: session.total_turns,
            scheduled_at: session.scheduled_at.toISOString(),
            started_at: session.started_at?.toISOString() ?? null,
            ended_at: session.ended_at?.toISOString() ?? null,
            actual_duration_sec: session.actual_duration_sec,
            created_at: session.created_at.toISOString(),
        },
        turns: turns.map((t) => ({
            turn_id: t.turn_id,
            turn_number: t.turn_number,
            speaker: t.speaker,
            content: t.content,
            content_type: t.content_type,
            evaluation_score: t.evaluation_score,
            evaluation_feedback: t.evaluation_feedback,
            evaluation_rubric: t.evaluation_rubric,
            difficulty_applied: t.difficulty_applied,
            created_at: t.created_at.toISOString(),
        })),
        evaluation_summary: evaluation_summary
            ? {
                evaluation_summary_id: evaluation_summary.evaluation_summary_id,
                overall_score: evaluation_summary.overall_score,
                strength_areas: evaluation_summary.strength_areas,
                weak_areas: evaluation_summary.weak_areas,
                progression_notes: evaluation_summary.progression_notes,
                detailed_feedback: evaluation_summary.detailed_feedback,
                recommendations: evaluation_summary.recommendations,
                created_at: evaluation_summary.created_at.toISOString(),
            }
            : null,
    };

    const parsed = SessionDetailsSchema.safeParse(data);
    if (!parsed.success) {
        logger.error(
            "Failed to serialize session details",
            {session_id, issues: parsed.error.issues},
        );
        throw new ConfigurationError(
            "Failed to serialize session details",
            {issues: parsed.error.issues},
        );
    }

    logger.info("Session details fetched", {
        session_id,
        user_id,
        turns: parsed.data.turns.length,
        has_evaluation_summary: parsed.data.evaluation_summary !== null,
    });

    const res = {
        success: true,
        data: parsed.data,
    } satisfies GetSessionDetailsSuccess;

    return NextResponse.json(res, { status: 200 });
});