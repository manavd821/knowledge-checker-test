"use client";
import { Bot, Mic, MicOff, Video, VideoOff, Volume2 } from "lucide-react";
import { AudioTrack } from "@/components/live-session/audio-track";
import { VideoTrack } from "@/components/live-session/video-track";
import { UserAvtar } from "@/components/live-session/left-section/user-avtar";
import {
    PARTICIPANT_ROLE_LABEL,
    is_ai,
    useParticipantName,
} from "@/components/live-session/participant-meta";
import { cn } from "@/lib/utils";
import { ParticipantVM } from "@/store/types";

/**
 * Presentation of one participant.
 *
 * It only receives a `ParticipantVM` from the ParticipantStore: video tile
 * (track or avatar placeholder), speaking state, name / role and the mic,
 * camera or audio state. It never talks to the realtime provider and holds no
 * business logic.
 */
export function ParticipantCard({
    participant,
    isLocal = false,
}: {
    participant: ParticipantVM;
    isLocal?: boolean;
}) {
    const {
        identity,
        role,
        cameraEnabled,
        micEnabled,
        speaking,
        videoTrack,
        audioTrack,
    } = participant;

    const display_name = useParticipantName(participant, isLocal);
    const ai = is_ai(participant);
    const role_label = ai ? "AI" : (PARTICIPANT_ROLE_LABEL[role] ?? role);

    return (
        <div
            data-testid="participant-card"
            className={cn(
                "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card transition-colors",
                speaking && "ring-2 ring-emerald-500",
            )}
        >
            {/*
                video tile. When there is no track (camera off / AI) the tile
                shows an avatar placeholder with the participant metadata
                instead of an empty black area.
            */}
            <div className="relative flex min-h-0 flex-1 overflow-hidden bg-muted">
                <VideoTrack
                    track={videoTrack}
                    mirror={isLocal}
                    placeholder={
                        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center">
                            {ai ? (
                                <span
                                aria-hidden
                                className="flex h-16 w-16 items-center justify-center rounded-full border bg-background"
                                >
                                    <Bot className="size-8 text-muted-foreground"/>
                                </span>
                            ) : (
                                <UserAvtar
                                name={display_name}
                                className="h-16 w-16"
                                fallbackClassName="text-lg"
                                />
                            )}

                            <div className="flex flex-col gap-0.5">
                                <p className="text-sm font-medium" title={identity}>
                                    {display_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {role_label}
                                </p>
                            </div>

                            {ai ? (
                                <span
                                className={cn(
                                    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                                    audioTrack
                                        ? "text-emerald-600"
                                        : "text-muted-foreground",
                                )}
                                >
                                    <Volume2 className="size-3.5"/>
                                    {audioTrack ? "Audio" : "No audio yet"}
                                </span>
                            ) : (
                                <span
                                className={cn(
                                    "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                                    micEnabled
                                        ? "text-emerald-600"
                                        : "text-muted-foreground",
                                )}
                                >
                                    {micEnabled
                                        ? <Mic className="size-3.5"/>
                                        : <MicOff className="size-3.5"/>}
                                    {micEnabled ? "Mic on" : "Mic off"}
                                </span>
                            )}
                        </div>
                    }
                />

                {speaking ? (
                    <span
                    className="absolute right-2 top-2 rounded-md bg-emerald-500/90 px-2 py-1 text-xs text-white"
                    >
                        Speaking
                    </span>
                ) : null}
            </div>

            {/*
                info footer only while real video is shown, otherwise the tile
                itself already carries the name / role / mic state.
            */}
            {videoTrack ? (
                <div
                className="flex items-center justify-between gap-2 border-t p-2"
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium" title={identity}>
                                {isLocal ? `${display_name} (you)` : display_name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {PARTICIPANT_ROLE_LABEL[role] ?? role}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                        {ai ? (
                            <span
                            title={audioTrack ? "Audio playing" : "No audio"}
                            className={cn(
                                "rounded-md border p-1.5",
                                audioTrack
                                    ? "text-emerald-600"
                                    : "text-muted-foreground",
                            )}
                            >
                                <Volume2 className="size-4"/>
                            </span>
                        ) : (
                            <>
                                <span
                                title={micEnabled ? "Microphone on" : "Microphone off"}
                                className={cn(
                                    "rounded-md border p-1.5",
                                    micEnabled
                                        ? "text-emerald-600"
                                        : "text-muted-foreground",
                                )}
                                >
                                    {micEnabled
                                        ? <Mic className="size-4"/>
                                        : <MicOff className="size-4"/>}
                                </span>
                                <span
                                title={cameraEnabled ? "Camera on" : "Camera off"}
                                className={cn(
                                    "rounded-md border p-1.5",
                                    cameraEnabled
                                        ? "text-emerald-600"
                                        : "text-muted-foreground",
                                )}
                                >
                                    {cameraEnabled
                                        ? <Video className="size-4"/>
                                        : <VideoOff className="size-4"/>}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            ) : null}

            {/*
                remote audio is rendered by the participant that owns it.
                the local microphone is never played back, that would echo.
            */}
            {!isLocal ? <AudioTrack track={audioTrack}/> : null}
        </div>
    );
}
