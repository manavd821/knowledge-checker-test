"use client";
import { AlertCircle, Bot, Loader2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ParticipantCard } from "@/components/live-session/participant-card";
import { has_ai_participant } from "@/components/live-session/participant-meta";
import { cn } from "@/lib/utils";
import { useConnectionStatus } from "@/react/live-session/hooks/use-connection-status";
import { useLiveSessionInfo } from "@/react/live-session/hooks/use-live-session-info";
import { useParticipants } from "@/react/live-session/hooks/use-participants";
import { useSessionManager } from "@/react/live-session/hooks/use-session-manager";

/**
 * Grid layout for the participant tiles. One participant gets the whole area,
 * two sit side by side, three or more use a simple responsive grid. No video
 * layout algorithm, the point is that every participant has a large visible
 * tile that actually renders its track.
 */
const grid_classes = (count: number) =>
    count <= 1
        ? "grid-cols-1"
        : count === 2
            ? "grid-cols-1 md:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3";

function ParticipantGrid(){
    const participants = useParticipants();
    const remote = [...participants.remote.values()];
    const total = remote.length + (participants.local ? 1 : 0);

    if(total === 0){
        return (
            <div className="flex min-h-0 flex-1 items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Waiting for participants to join...
                </p>
            </div>
        );
    }

    return (
        <div
        data-testid="participant-grid"
        className={cn(
            "grid min-h-0 w-full flex-1 auto-rows-fr gap-3",
            grid_classes(total),
        )}
        >
            {participants.local ? (
                <ParticipantCard
                key={participants.local.id}
                participant={participants.local}
                isLocal
                />
            ) : null}
            {remote.map(participant => (
                <ParticipantCard
                key={participant.id}
                participant={participant}
                />
            ))}
        </div>
    );
}

/**
 * Center video workspace: connection / media notices on top (scrollable
 * among themselves so they never push the grid out of view) and the participant
 * video grid filling the remaining space. The control bar lives outside of this
 * component, at the bottom of the page.
 */
export function WorkSpace(){
    const manager = useSessionManager();
    const session = useLiveSessionInfo();
    const participants = useParticipants();
    const {
        status,
        error,
        audio_playback_blocked,
    } = useConnectionStatus();

    const ai_expected =
        session.session_type === "ai_session" &&
        session.status === "active";

    const has_notices =
        status === "connecting" ||
        status === "reconnecting" ||
        status === "disconnected" ||
        status === "failed" ||
        !!error ||
        audio_playback_blocked ||
        (ai_expected && !has_ai_participant(participants));

    return (
        <div
        data-testid="workspace"
        className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3 sm:p-4"
        >
            {has_notices ? (
                <div className="flex max-h-40 shrink-0 flex-col gap-2 overflow-y-auto">
                    {status === "connecting" ? (
                        <div
                        className="flex items-center gap-2 rounded-xl border p-3 text-sm text-muted-foreground"
                        >
                            <Loader2 className="size-4 animate-spin"/>
                            Connecting to the LiveKit room...
                        </div>
                    ) : null}

                    {status === "reconnecting" ? (
                        <div
                        className="flex items-center gap-2 rounded-xl border p-3 text-sm text-muted-foreground"
                        >
                            <Loader2 className="size-4 animate-spin"/>
                            Connection lost, trying to reconnect...
                        </div>
                    ) : null}

                    {status === "disconnected" || status === "failed" ? (
                        <div
                        className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm"
                        >
                            <AlertCircle className="size-4 text-destructive"/>
                            You are disconnected from the session.
                        </div>
                    ) : null}

                    {error ? (
                        <div
                        data-testid="media-error"
                        className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm"
                        >
                            <AlertCircle className="size-4 shrink-0 text-destructive"/>
                            <span className="flex-1">{error}</span>
                            <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => manager.clear_error()}
                            >
                                Dismiss
                            </Button>
                        </div>
                    ) : null}

                    {audio_playback_blocked ? (
                        <div
                        data-testid="audio-blocked-notice"
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-sm"
                        >
                            <span className="inline-flex items-center gap-2">
                                <VolumeX className="size-4 text-amber-600"/>
                                Your browser blocked audio playback. Enable audio
                                to hear other participants and the AI.
                            </span>
                            <Button size="sm" onClick={() => manager.startAudio()}>
                                Enable audio
                            </Button>
                        </div>
                    ) : null}

                    {ai_expected && !has_ai_participant(participants) ? (
                        <div
                        data-testid="ai-pending-notice"
                        className="flex items-center gap-2 rounded-xl border p-3 text-sm text-muted-foreground"
                        >
                            <Bot className="size-4"/>
                            Waiting for the AI interviewer to join the room...
                        </div>
                    ) : null}
                </div>
            ) : null}

            <ParticipantGrid/>
        </div>
    );
}
