"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { get_frontend_service } from "@/frontend/factory";

/**
 * Dashboard deletion of a session the authenticated user owns. The backend
 * enforces ownership and refuses to delete an active session, so the mutation
 * only needs to call it and then drop the stale dashboard history.
 */
export const useDeleteSession = () => {
    const query_client = useQueryClient();
    const session_service = get_frontend_service().sessions;

    return useMutation({
        mutationFn: async (session_id: string) => {
            await session_service.delete_session(session_id);
        },
        onSuccess: async () => {
            await query_client.invalidateQueries({ queryKey: ["sessions"] });
        },
    });
};
