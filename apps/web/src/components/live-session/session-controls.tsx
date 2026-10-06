"use client";
import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeaveButton } from "@/components/live-session/leave-button";
import { useLiveSessionInfo } from "@/react/live-session/hooks/use-live-session-info";
import { useParticipants } from "@/react/live-session/hooks/use-participants";
import { useSessionID } from "@/react/live-session/hooks/use-session-id";
import { useSessionManager } from "@/react/live-session/hooks/use-session-manager";

/**
 * Session control part of the bottom control bar: pause / resume plus the
 * shared leave button.
 *
 * The lifecycle itself lives in the backend. The client only calls the
 * existing session APIs through the session manager and re-reads the
 * authoritative session info afterwards. Authorization is unchanged: the
 * backend decides who may control the session, the buttons are only hidden
 * when the local role can never be allowed.
 *
 * There is deliberately no "end session" action: no completed-session API
 * exists, leaving only leaves the session.
 */
export function SessionControls(){
    const manager = useSessionManager();
    const session_id = useSessionID();
    const session = useLiveSessionInfo();
    const participants = useParticipants();

    const [pending, set_pending] = useState(false);
    const [error, set_error] = useState<string | null>(null);

    const { status } = session;
    const local_role = participants.local?.role;
    const can_control = session.session_type === "ai_session"
        ? local_role === "candidate"
        : local_role === "interviewer";

    const run = async (action: () => Promise<unknown>) => {
        set_pending(true);
        set_error(null);
        try {
            await action();
        } catch(err) {
            set_error(
                err instanceof Error
                    ? err.message
                    : "The request failed. Please try again."
            );
        } finally {
            set_pending(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-center gap-2">
            {status === "active" ? (
                <Button
                size="sm"
                variant="secondary"
                onClick={() => run(() => manager.pause(session_id))}
                disabled={pending || !can_control}
                title={
                    can_control
                        ? "Pause the session"
                        : "Only the session host can pause"
                }
                >
                    <Pause/>
                    Pause
                </Button>
            ) : status === "pause" ? (
                <Button
                size="sm"
                variant="secondary"
                onClick={() => run(() => manager.resume(session_id))}
                disabled={pending || !can_control}
                title={
                    can_control
                        ? "Resume the session"
                        : "Only the session host can resume"
                }
                >
                    <Play/>
                    Resume
                </Button>
            ) : (
                <p className="text-xs text-muted-foreground">
                    This session is {status}.
                </p>
            )}

            <LeaveButton/>

            {error ? (
                <p
                data-testid="session-control-error"
                className="w-full text-center text-xs text-destructive"
                >
                    {error}
                </p>
            ) : null}
        </div>
    );
}
