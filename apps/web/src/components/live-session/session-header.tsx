"use client";
import { Bot } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ConnectionStatus } from "@/components/live-session/connection-status";
import { LeaveButton } from "@/components/live-session/leave-button";
import { SessionPanels } from "@/components/live-session/layout/session-panels";
import { has_ai_participant } from "@/components/live-session/participant-meta";
import { cn } from "@/lib/utils";
import { useLiveSessionInfo } from "@/react/live-session/hooks/use-live-session-info";
import { useParticipants } from "@/react/live-session/hooks/use-participants";
import { useSessionTimer } from "@/react/live-session/hooks/use-session-timer";
import { DOMAIN_META, TOPIC_TYPE_META } from "@/react/session-form/sessions.meta";
import { Status } from "@/modules";

const format_duration = (total_seconds: number) => {
    const safe = Math.max(0, Math.floor(total_seconds));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    return [hours, minutes, seconds]
        .map(part => String(part).padStart(2, "0"))
        .join(":");
};

const STATUS_VARIANT: Record<
    Status,
    { label: string; className: string }
> = {
    preparing: {
        label: "PREPARING",
        className: "bg-muted text-muted-foreground",
    },
    ready: {
        label: "READY",
        className: "bg-muted text-muted-foreground",
    },
    active: {
        label: "ACTIVE",
        className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    },
    pause: {
        label: "PAUSED",
        className: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    },
    completed: {
        label: "COMPLETED",
        className: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    },
    failed: {
        label: "FAILED",
        className: "bg-destructive/10 text-destructive",
    },
};

/**
 * Full width application header of the live session. It is a direct child of
 * the layout root, so it is never covered by a sidebar and never scrolls away.
 *
 * Everything shown here is existing state: brand + session identity on the
 * left, then the authoritative timer, the session status, the AI status
 * (derived from the AI participant's presence), the connection status and the
 * leave action on the right.
 *
 * Responsive behaviour: the header wraps instead of ever overflowing, the
 * brand / session identity collapse below `md` (the same information is in
 * the Session sheet) and the `SessionPanels` sheet triggers only show below
 * `lg`, where the permanent side columns are hidden. The timer, the status
 * badges, the connection status and the leave action are always rendered.
 */
export function SessionHeader() {
    const session = useLiveSessionInfo();
    const participants = useParticipants();
    const { elapsed_seconds } = useSessionTimer();

    const {
        topic_type,
        domain,
        custom_domain,
    } = session;
    const status_meta = STATUS_VARIANT[session.status]
        ?? STATUS_VARIANT.ready;
    const domain_label =
        domain === "custom" && custom_domain
            ? custom_domain
            : DOMAIN_META[domain].label;

    const ai_present = has_ai_participant(participants);
    const show_ai_status =
        session.session_type === "ai_session" &&
        (ai_present || session.status === "active");

    return (
        <header
        data-testid="session-header"
        className="flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-background px-4 py-2"
        >
            <div className="flex min-w-0 items-center gap-3">
                <span className="hidden shrink-0 text-sm font-semibold tracking-tight md:inline">
                    Knowledge Checker
                </span>
                <Separator orientation="vertical" className="hidden h-6 md:block"/>
                <div className="hidden min-w-0 md:block">
                    <p className="truncate text-sm font-medium">
                        {TOPIC_TYPE_META[topic_type].label}
                        <span className="text-muted-foreground">
                            {" · "}
                            {domain_label}
                        </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                        Session
                        <span
                        className="ml-1 font-mono"
                        title={`Session id ${session.session_id}`}
                        >
                            #{session.session_id.slice(0, 8)}
                        </span>
                    </p>
                </div>

                {/*
                    below lg the two side columns are gone, so their content
                    is offered through these sheets instead
                */}
                <SessionPanels/>
            </div>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                <span
                data-testid="session-timer"
                className="font-mono text-sm tabular-nums"
                >
                    {format_duration(elapsed_seconds)}
                    <span className="text-muted-foreground">
                        {" / "}{session.duration_minutes}:00
                    </span>
                </span>

                <span
                className={cn(
                    "inline-flex h-5 items-center rounded-full px-2 text-xs font-medium",
                    status_meta.className,
                )}
                >
                    {status_meta.label}
                </span>

                {show_ai_status ? (
                    <span
                    data-testid="ai-status"
                    className={cn(
                        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-xs font-medium",
                        ai_present
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground",
                    )}
                    >
                        <Bot className="size-3"/>
                        {ai_present ? "AI Ready" : "AI joining"}
                    </span>
                ) : null}

                <span data-testid="connection-status">
                    <ConnectionStatus/>
                </span>

                <LeaveButton/>
            </div>
        </header>
    );
}
