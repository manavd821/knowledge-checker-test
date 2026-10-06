"use client";
import { Separator } from "@/components/ui/separator";
import { ConnectionStatus } from "@/components/live-session/connection-status";
import { ParticipantsList } from "@/components/live-session/left-section/participants-list";
import { ProgressBar } from "@/components/live-session/left-section/progress-bar";
import { SessionMetaCard } from "@/components/live-session/left-section/session-meta-card";
import { useLiveSessionInfo } from "@/react/live-session/hooks/use-live-session-info";
import {
    AI_STRICTNESS_META,
    DIFFICULTY_META,
    DOMAIN_META,
    ROLE_LEVEL_META,
    SESSION_TYPE_META,
} from "@/react/session-form/sessions.meta";

function SectionLabel({ children } : { children: React.ReactNode }){
    return (
        <p className="text-xs font-medium text-muted-foreground">
            {children}
        </p>
    );
}

/**
 * Body of the left sidebar: session information, progress (the one existing
 * timer) and the connection status. Participants are rendered by
 * `ParticipantsList`. Everything is read from the existing stores.
 */
export function LeftContent(){
    const session = useLiveSessionInfo();

    const domain_label =
        session.domain === "custom" && session.custom_domain
            ? session.custom_domain
            : DOMAIN_META[session.domain].label;

    return (
        <div className="flex flex-col gap-4 p-4">
            <section className="flex flex-col gap-2">
                <SectionLabel>SESSION INFORMATION</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                    <SessionMetaCard
                    title="Type"
                    label={SESSION_TYPE_META[session.session_type].label}
                    />
                    <SessionMetaCard
                    title="Difficulty"
                    label={DIFFICULTY_META[session.difficulty].label}
                    />
                    <SessionMetaCard
                    title="Domain"
                    label={domain_label}
                    />
                    <SessionMetaCard
                    title="Level"
                    label={ROLE_LEVEL_META[session.role_level].label}
                    />
                    <SessionMetaCard
                    title="Strictness"
                    label={AI_STRICTNESS_META[session.ai_strictness].label}
                    />
                    <SessionMetaCard
                    title="Duration"
                    label={`${session.duration_minutes} minutes`}
                    />
                </div>
            </section>

            <section className="flex flex-col gap-2">
                <SectionLabel>PROGRESS</SectionLabel>
                <ProgressBar/>
            </section>

            <Separator/>

            <ParticipantsList/>

            <Separator/>

            <section className="flex flex-col gap-2">
                <SectionLabel>CONNECTION</SectionLabel>
                <ConnectionStatus/>
            </section>
        </div>
    )
}
