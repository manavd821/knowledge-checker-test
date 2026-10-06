import { get_frontend_service } from "@/frontend/factory";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { SessionDetails } from "@/modules";

/**
 * Results of one session: summary, turns and session-level evaluation /
 * insight. Fetched only when the results page is opened (no N+1 on the
 * dashboard history).
 */
export const useSessionDetails = (
    session_id: string,
): UseQueryResult<SessionDetails> => {
    const session_service = get_frontend_service().sessions;

    return useQuery({
        queryKey: ["session", session_id],
        enabled: !!session_id,
        queryFn: async () => {
            return await session_service.get_session_details(session_id);
        },
    });
}