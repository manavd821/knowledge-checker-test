"use client";
import { Bot, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { UserAvtar } from "@/components/live-session/left-section/user-avtar";
import {
    PARTICIPANT_ROLE_LABEL,
    is_ai,
    useParticipantName,
} from "@/components/live-session/participant-meta";
import { cn } from "@/lib/utils";
import { useParticipants } from "@/react/live-session/hooks/use-participants";
import { ParticipantVM } from "@/store/types";

/**
 * One row of the participants list in the left sidebar. Pure presentation of
 * a `ParticipantVM`, it never touches the realtime provider.
 */
function ParticipantRow({
    participant,
    isLocal = false,
}: {
    participant: ParticipantVM;
    isLocal?: boolean;
}) {
    const name = useParticipantName(participant, isLocal);

    return (
        <li
        data-testid="participant-row"
        className="flex items-center gap-2 rounded-lg border p-2"
        >
            {is_ai(participant) ? (
                <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-muted"
                aria-hidden
                >
                    <Bot className="size-5 text-muted-foreground"/>
                </span>
            ) : (
                <UserAvtar name={name}/>
            )}

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                    {name}
                    {isLocal ? " (you)" : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {is_ai(participant)
                        // the row only exists while the agent is in the room,
                        // its presence in the store IS the ready state
                        ? `${PARTICIPANT_ROLE_LABEL[participant.role]} · Ready`
                        : PARTICIPANT_ROLE_LABEL[participant.role] ?? participant.role}
                </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
                {participant.speaking ? (
                    <span
                    title="Speaking"
                    className="size-2 rounded-full bg-emerald-500"
                    />
                ) : null}

                <span
                title={participant.micEnabled ? "Microphone on" : "Microphone off"}
                className={cn(
                    participant.micEnabled
                        ? "text-emerald-600"
                        : "text-muted-foreground",
                )}
                >
                    {participant.micEnabled
                        ? <Mic className="size-4"/>
                        : <MicOff className="size-4"/>}
                </span>

                {/* the AI never publishes a camera, a "camera off" icon would
                    suggest something the participant could turn on */}
                {is_ai(participant) ? null : (
                    <span
                    title={participant.cameraEnabled ? "Camera on" : "Camera off"}
                    className={cn(
                        participant.cameraEnabled
                            ? "text-emerald-600"
                            : "text-muted-foreground",
                    )}
                    >
                        {participant.cameraEnabled
                            ? <Video className="size-4"/>
                            : <VideoOff className="size-4"/>}
                    </span>
                )}
            </div>
        </li>
    );
}

/**
 * All participants of the session (local, remote humans and the AI) read from
 * the ParticipantStore through `useParticipants()`.
 */
export function ParticipantsList() {
    const participants = useParticipants();
    const remote = [...participants.remote.values()];
    const total = remote.length + (participants.local ? 1 : 0);

    return (
        <section className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">
                PARTICIPANTS ({total})
            </p>

            {total === 0 ? (
                <p className="text-xs text-muted-foreground">
                    Waiting for participants to join...
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {participants.local ? (
                        <ParticipantRow
                        participant={participants.local}
                        isLocal
                        />
                    ) : null}
                    {remote.map(participant => (
                        <ParticipantRow
                        key={participant.id}
                        participant={participant}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}
