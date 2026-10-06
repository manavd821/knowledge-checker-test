"use client";
import { CalendarDays, Clock, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSessions } from "@/react/sessions/hooks/use-sessions";
import { useResumeSession } from "@/react/sessions/hooks/use-resume-session";
import {
    DIFFICULTY_META,
    DOMAIN_META,
    ROLE_LEVEL_META,
    SESSION_TYPE_META,
    TOPIC_TYPE_META,
} from "@/react/session-form/sessions.meta";
import { SessionSummary, Status } from "@/modules";

const STATUS_LABEL: Record<Status, string> = {
    preparing: "Preparing",
    ready: "Ready",
    active: "Active",
    pause: "Paused",
    completed: "Completed",
    failed: "Failed",
};

const STATUS_BADGE_CLASS: Record<Status, string> = {
    preparing: "bg-muted text-muted-foreground",
    ready: "bg-muted text-muted-foreground",
    active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    pause: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    completed: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    failed: "bg-destructive/10 text-destructive",
};

const format_date = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

const format_duration = (actual_sec: number | null, planned: number) => {
    if (actual_sec && actual_sec > 0) {
        const minutes = Math.max(1, Math.round(actual_sec / 60));
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        return rest ? `${hours}h ${rest}m` : `${hours}h`;
    }
    return `${planned} minutes`;
};

/**
 * Actions are driven by the actual backend status only:
 * - completed → [View Results]
 * - pause (or still active) → [Resume]
 * Nothing is invented for the other states.
 */
function SessionCard({ session }: { session: SessionSummary }){
    const router = useRouter();
    const { mutate, isPending, error } = useResumeSession();

    const can_resume =
        session.status === "pause" || session.status === "active";
    const can_view_results = session.status === "completed";

    const domain_label =
        session.domain === "custom" && session.custom_domain
            ? session.custom_domain
            : DOMAIN_META[session.domain].label;

    const date_label = session.started_at ?? session.created_at;

    return (
        <div
        data-testid="session-card"
        className="rounded-lg border bg-card p-4 text-card-foreground shadow-xs sm:p-5"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-semibold">
                            {TOPIC_TYPE_META[session.topic_type].label}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                            {SESSION_TYPE_META[session.session_type].label}
                        </span>
                    </div>
                    <p className="mt-0.5 break-words text-sm text-muted-foreground">
                        {domain_label}
                        <span className="mx-1">·</span>
                        {DIFFICULTY_META[session.difficulty].label}
                        <span className="mx-1">·</span>
                        {ROLE_LEVEL_META[session.role_level].label}
                    </p>
                </div>

                <span
                className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    STATUS_BADGE_CLASS[session.status],
                )}
                >
                    {STATUS_LABEL[session.status]}
                </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-3.5" />
                    {format_date(date_label)}
                </span>
                <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {format_duration(
                        session.actual_duration_sec,
                        session.duration_minutes,
                    )}
                </span>
                {typeof session.total_turns === "number" && (
                    <span>{session.total_turns} turns</span>
                )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
                {can_resume && (
                    <Button
                        size="sm"
                        onClick={() => mutate(session.session_id)}
                        disabled={isPending}
                    >
                        Resume
                    </Button>
                )}
                {can_view_results && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                            router.push(`/results/${session.session_id}`)
                        }
                    >
                        View Results
                    </Button>
                )}
            </div>

            {error && (
                <p className="mt-2 text-sm text-destructive">
                    {error instanceof Error
                        ? error.message
                        : "Unable to resume the session."}
                </p>
            )}
        </div>
    );
}

function SessionHistoryEmpty({ on_create }: { on_create: () => void }){
    return (
        <div className="mt-4 rounded-lg border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
                No sessions yet.
            </p>
            <Button size="sm" className="mt-3" onClick={on_create}>
                <Plus />
                Create your first session
            </Button>
        </div>
    );
}

function SessionHistoryError({ on_retry }: { on_retry: () => void }){
    return (
        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
            <p className="text-sm font-medium">
                Unable to load sessions.
            </p>
            <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={on_retry}
            >
                Retry
            </Button>
        </div>
    );
}

/**
 * Session history for the dashboard. One TanStack Query for the list - no
 * fetch in effects, no details fetched per card, no copy kept in Redux.
 */
export function SessionHistory(){
    const router = useRouter();
    const {
        data,
        isPending,
        isError,
        isFetching,
        refetch,
    } = useSessions();

    return (
        <section data-testid="session-history" className="w-full">
            <h2 className="text-lg font-semibold">Session History</h2>

            {isPending && (
                <div className="mt-4 flex flex-col gap-3">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                </div>
            )}

            {!isPending && isError && (
                <SessionHistoryError
                    on_retry={() => refetch()}
                />
            )}

            {!isPending && !isError && data && data.length === 0 && (
                <SessionHistoryEmpty
                    on_create={() => router.push("/new-session")}
                />
            )}

            {!isPending && !isError && data && data.length > 0 && (
                <div className="mt-4 flex flex-col gap-3">
                    {data.map((session) => (
                        <SessionCard
                            key={session.session_id}
                            session={session}
                        />
                    ))}
                </div>
            )}

            {isFetching && !isPending && (
                <p className="mt-3 text-xs text-muted-foreground">
                    Refreshing...
                </p>
            )}
        </section>
    );
}