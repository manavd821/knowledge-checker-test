"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { get_frontend_service } from "@/frontend/factory";

/**
 * Dashboard resume of a paused (or still active) session.
 *
 * Deliberately no separate "resume backend": the existing join / token flow
 * already supports paused sessions (`validate_session` accepts `pause` and
 * the token handler flips PAUSED → ACTIVE and re-dispatches the agent). So
 * resuming only
 *
 *   1. re-reads the session through the existing session service (ownership
 *      is enforced server side against the authenticated Clerk user, so a
 *      manipulated session id cannot read/resume another user's session),
 *   2. verifies the session is still resumable,
 *   3. invalidates the stale dashboard history,
 *   4. navigates into the existing Live Session, which performs the actual
 *      join / token flow.
 *
 * On any failure nothing is navigated: the error is reported and the user
 * stays on the dashboard.
 */
export const useResumeSession = () => {
    const router = useRouter();
    const query_client = useQueryClient();
    const session_service = get_frontend_service().sessions;

    return useMutation({
        mutationFn: async (session_id: string) => {
            const details = await session_service
                .get_session_details(session_id);

            const status = details.session.status;
            if (status !== "pause" && status !== "active") {
                throw new Error(
                    status === "completed"
                        ? "This session is already completed."
                        : "This session can no longer be resumed."
                );
            }

            return details;
        },
        onSuccess: async (_details, session_id) => {
            // the resume changes (or is about to change) the session state,
            // drop the stale dashboard copy so returning shows the fresh status
            await query_client.invalidateQueries({ queryKey: ["sessions"] });
            router.replace(`/sessions/${session_id}`);
        },
    });
}