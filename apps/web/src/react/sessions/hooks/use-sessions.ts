import { get_frontend_service } from "@/frontend/factory";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { SessionSummary } from "@/modules";

/**
 * Dashboard session history. Server state: TanStack Query owns the result,
 * nothing is mirrored into Redux or local component state.
 */
export const useSessions = (): UseQueryResult<SessionSummary[]> => {
    const session_service = get_frontend_service().sessions;

    return useQuery({
        queryKey: ["sessions"],
        queryFn: async () => {
            return await session_service.list_sessions();
        },
    });
}