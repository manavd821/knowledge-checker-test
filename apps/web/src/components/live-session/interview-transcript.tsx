"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, GraduationCap, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranscript } from "@/react/live-session/hooks/use-transcript";
import { useParticipants } from "@/react/live-session/hooks/use-participants";
import { cn } from "@/lib/utils";
import { ParticipantRole } from "@/store/types";

const SPEAKER_META: Record<
    ParticipantRole,
    { label: string; Icon: typeof Bot; className: string }
> = {
    candidate: {
        label: "Candidate",
        Icon: GraduationCap,
        className: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    },
    interviewer: {
        label: "Interviewer",
        Icon: User,
        className: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
    },
    ai: {
        label: "AI Interviewer",
        Icon: Bot,
        className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    },
    observer: {
        label: "Observer",
        Icon: User,
        className: "bg-muted text-muted-foreground",
    },
};

const format_timestamp = (timestamp: Date) =>
    timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

/**
 * Live transcript of the session.
 *
 * Reads the TranscriptStore through `useTranscript()` (updates arrive over the
 * LiveKit data channel), scrolls to the newest entry and offers a local text
 * filter over that same snapshot. No polling, no duplicate transcript state.
 */
export function InterviewTranscript() {
    const transcript = useTranscript();
    const participants = useParticipants();
    const local_role = participants.local?.role;

    const [query, set_query] = useState("");
    const end_ref = useRef<HTMLDivElement>(null);

    const search = query.trim().toLowerCase();
    const entries = useMemo(
        () => search
            ? transcript.filter(entry =>
                entry.text.toLowerCase().includes(search),
            )
            : transcript,
        [transcript, search],
    );

    useEffect(() => {
        end_ref.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [entries.length]);

    return (
        <section
        data-testid="live-transcript"
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card"
        >
            <header className="flex flex-col gap-2 border-b p-3">
                <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-medium">Live Transcript</h2>
                    <span className="text-xs text-muted-foreground">
                        {transcript.length}{" "}
                        {transcript.length === 1 ? "entry" : "entries"}
                    </span>
                </div>

                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                    value={query}
                    onChange={event => set_query(event.target.value)}
                    placeholder="Search transcript..."
                    aria-label="Search transcript"
                    className="h-8 pl-8 text-sm"
                    />
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
                {transcript.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Nothing has been said yet.
                    </p>
                ) : entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No transcript entries match your search.
                    </p>
                ) : (
                    <ol className="flex flex-col gap-3">
                        {entries.map((entry) => {
                            const meta =
                                SPEAKER_META[entry.speaker] ??
                                SPEAKER_META.observer;
                            const { Icon } = meta;
                            // the role comes from the normalized entry, the
                            // local speaker's own role is simply shown as "You"
                            const speaker_label =
                                local_role !== "ai" &&
                                entry.speaker === local_role
                                    ? "You"
                                    : meta.label;
                            return (
                                <li
                                key={entry.id}
                                className="flex flex-col gap-1"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                        className={cn(
                                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
                                            meta.className,
                                        )}
                                        >
                                            <Icon className="size-3"/>
                                            {speaker_label}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {format_timestamp(
                                                entry.timestamp,
                                            )}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed">
                                        {entry.text}
                                    </p>
                                </li>
                            );
                        })}
                        <div ref={end_ref}/>
                    </ol>
                )}
            </div>
        </section>
    );
}
