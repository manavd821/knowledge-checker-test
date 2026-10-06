"use client";

import { InterviewSessionManager } from "@/interview-session/interview-session-manager";
import { InterviewIntialization } from "@/interview-session/interview-session-types";
import { useQuery, UseQueryResult } from "@tanstack/react-query";

export const useInterviewIntialization = (
    session_id: string, 
    manager: InterviewSessionManager,
) : UseQueryResult<InterviewIntialization> => {

    return useQuery({
        queryKey: ["interview-init", session_id],
        enabled: !!session_id,
        queryFn : async () => {
            return await manager.join(session_id);
        },
        // joining has side effects (a session connection row is created), a
        // silent retry would create several of them
        retry: false,
        staleTime: Infinity,
    })
}