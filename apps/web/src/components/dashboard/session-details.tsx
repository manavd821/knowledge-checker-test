"use client";
import { ArrowLeft, Bot, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSessionDetails } from "@/react/sessions/hooks/use-session-details";
import {
    DIFFICULTY_META,
    DOMAIN_META,
    ROLE_LEVEL_META,
    SESSION_TYPE_META,
    TOPIC_TYPE_META,
} from "@/react/session-form/sessions.meta";

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
 * Completed-session results. This page only reads persisted data (session,
 * turns, evaluations, AI insights) through the session details query - it
 * never calls the AI service or calculates scores in React.
 */
export function SessionDetailsPage({ session_id }: { session_id: string }){
    const router = useRouter();
    const {
        data,
        isPending,
        isError,
        isFetching,
        refetch,
    } = useSessionDetails(session_id);

    if (isPending) {
        return (
            <div className="flex min-h-dvh items-center justify-center px-6 text-sm text-muted-foreground">
                Loading session...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-base font-medium">
                    Unable to load session results.
                </p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isFetching}
                >
                    Retry
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.replace("/dashboard")}
                >
                    <ArrowLeft />
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    const { session, turns, evaluation_summary } = data;

    const overall_score =
        evaluation_summary?.overall_score ?? session.overall_score;
    const ai_insight = evaluation_summary?.detailed_feedback;
    const domain_label =
        session.domain === "custom" && session.custom_domain
            ? session.custom_domain
            : DOMAIN_META[session.domain].label;

    const summary_rows: Array<{ label: string; value: string }> = [
        {
            label: "Type",
            value: SESSION_TYPE_META[session.session_type].label,
        },
        {
            label: "Difficulty",
            value: DIFFICULTY_META[session.difficulty].label,
        },
        {
            label: "Domain",
            value: domain_label,
        },
        {
            label: "Role level",
            value: ROLE_LEVEL_META[session.role_level].label,
        },
        {
            label: "Duration",
            value: format_duration(
                session.actual_duration_sec,
                session.duration_minutes,
            ),
        },
        {
            label: "Date",
            value: format_date(session.created_at),
        },
    ];
    if (typeof overall_score === "number") {
        summary_rows.push({
            label: "Overall score",
            value: `${overall_score}/10`,
        });
    }

    return (
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">
            <Button
                variant="ghost"
                size="sm"
                className="-ml-2 text-muted-foreground"
                onClick={() => router.replace("/dashboard")}
            >
                <ArrowLeft />
                Back to Dashboard
            </Button>

            <div className="mt-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Session Summary
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                    {TOPIC_TYPE_META[session.topic_type].label}
                </h1>
                <p className="break-words text-sm text-muted-foreground">{domain_label}</p>
            </div>

            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {summary_rows.map((row) => (
                    <div
                        key={row.label}
                        className="flex items-center justify-between gap-4 border-b py-2 text-sm"
                    >
                        <dt className="text-muted-foreground">{row.label}</dt>
                        <dd className="break-words text-right font-medium">{row.value}</dd>
                    </div>
                ))}
            </dl>

            {ai_insight && (
                <>
                    <Separator className="my-6" />
                    <section>
                        <h2 className="text-lg font-semibold">AI Insight</h2>
                        <p className="mt-2 break-words rounded-lg border bg-card p-4 text-sm leading-relaxed">
                            {ai_insight}
                        </p>
                    </section>
                </>
            )}

            <Separator className="my-6" />

            <section data-testid="session-turns">
                <h2 className="text-lg font-semibold">Session Turns</h2>
                <div className="mt-4 flex flex-col gap-3">
                    {turns.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            No conversation turns recorded for this session.
                        </p>
                    )}
                    {turns.map((turn) => {
                        const is_interviewer =
                            turn.speaker === "interviewer";
                        const speaker_label = is_interviewer
                            ? session.session_type === "ai_session"
                                ? "AI Interviewer"
                                : "Interviewer"
                            : "Candidate";
                        return (
                            <div
                                key={turn.turn_id}
                                data-testid="session-turn"
                                className="rounded-lg border bg-card p-4"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                                        {is_interviewer ? (
                                            <Bot className="size-3.5" />
                                        ) : (
                                            <UserRound className="size-3.5" />
                                        )}
                                    </span>
                                    <p className="text-sm font-medium">
                                        {speaker_label}
                                    </p>
                                </div>

                                <p className="mt-2 break-words text-sm leading-relaxed">
                                    {turn.content}
                                </p>

                                {(turn.evaluation_score !== null ||
                                    turn.evaluation_feedback) && (
                                    <div className="mt-3 space-y-1 border-t pt-2 text-xs">
                                        {turn.evaluation_score !== null && (
                                            <p className="text-muted-foreground">
                                                Evaluation Score:{" "}
                                                <span className={cn("font-medium text-foreground")}>
                                                    {turn.evaluation_score}/10
                                                </span>
                                            </p>
                                        )}
                                        {turn.evaluation_feedback && (
                                            <p className="text-muted-foreground">
                                                AI Insight:{" "}
                                                {turn.evaluation_feedback}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}