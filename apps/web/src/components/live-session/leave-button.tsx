"use client";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeaveSession } from "@/react/live-session/hooks/use-leave-session";
import { cn } from "@/lib/utils";

/**
 * The single "leave session" action, rendered both in the header and in the
 * bottom control bar. It calls the existing session manager, it is never an
 * "end session" / "complete session" button.
 */
export function LeaveButton({
    className,
    size = "sm",
}: {
    className?: string;
    size?: "xs" | "sm" | "default";
}) {
    const { leave, pending, error } = useLeaveSession();

    return (
        <span className="inline-flex items-center gap-2">
            <Button
            size={size}
            variant="destructive"
            onClick={leave}
            disabled={pending}
            title="Leave the session (it stays open for others)"
            className={cn(className)}
            >
                {pending
                ? <Loader2 className="animate-spin"/>
                : <LogOut/>}
                Leave
            </Button>
            {error ? (
                <span
                data-testid="leave-error"
                className="text-xs text-destructive"
                >
                    {error}
                </span>
            ) : null}
        </span>
    );
}
