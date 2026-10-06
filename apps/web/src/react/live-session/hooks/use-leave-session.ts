"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConnectionState } from "@/react/live-session/hooks/use-connection-state";
import { useSessionManager } from "@/react/live-session/hooks/use-session-manager";

/**
 * Leave the open session through the existing InterviewSessionManager.
 *
 * Leaving only leaves the room / marks the connection as left. There is no
 * completed-session API, so this never pretends the session finished.
 */
export const useLeaveSession = () => {
    const manager = useSessionManager();
    const { connection_id } = useConnectionState();
    const router = useRouter();

    const [pending, set_pending] = useState(false);
    const [error, set_error] = useState<string | null>(null);

    const leave = async () => {
        set_pending(true);
        set_error(null);
        try {
            if (connection_id) {
                await manager.leave(connection_id);
            } else {
                await manager.disconnect();
            }
            router.replace("/dashboard");
        } catch (err) {
            set_error(
                err instanceof Error
                    ? err.message
                    : "The request failed. Please try again."
            );
        } finally {
            set_pending(false);
        }
    };

    return { leave, pending, error };
};
