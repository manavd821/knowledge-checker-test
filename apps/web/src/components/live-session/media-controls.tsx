"use client";
import { useState } from "react";
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Volume2,
    VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParticipants } from "@/react/live-session/hooks/use-participants";
import { useSessionManager } from "@/react/live-session/hooks/use-session-manager";
import { useConnectionStatus } from "@/react/live-session/hooks/use-connection-status";

/**
 * Local microphone / camera toggles and the audio playback unlock.
 *
 * Enabling the microphone publishes your mic. Unlocking audio playback lets the
 * browser play *other people's* audio. They are two different things, and both
 * go through the existing InterviewSessionManager / realtime provider.
 */
export function MediaControls() {
    const manager = useSessionManager();
    const participants = useParticipants();
    const { audio_playback_blocked } = useConnectionStatus();
    const [pending, setPending] = useState(false);

    const local = participants.local;
    const mic_enabled = local?.micEnabled ?? false;
    const camera_enabled = local?.cameraEnabled ?? false;

    const run = async (action: () => Promise<void>) => {
        setPending(true);
        try {
            await action();
        } catch {
            // the failure is already surfaced by the connection store
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
            size="sm"
            variant={mic_enabled ? "secondary" : "default"}
            disabled={pending}
            onClick={() => run(
                mic_enabled
                    ? () => manager.disableMicrophone()
                    : () => manager.enableMicrophone(),
            )}
            title={mic_enabled ? "Mute microphone" : "Unmute microphone"}
            >
                {mic_enabled ? <Mic/> : <MicOff/>}
                {mic_enabled ? "Mute" : "Unmute"}
            </Button>

            <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => run(
                camera_enabled
                    ? () => manager.disableCamera()
                    : () => manager.enableCamera(),
            )}
            title={camera_enabled ? "Turn off camera" : "Turn on camera"}
            >
                {camera_enabled ? <Video/> : <VideoOff/>}
                {camera_enabled ? "Turn off camera" : "Turn on camera"}
            </Button>

            {/*
                only offer the unlock while the browser is actually blocking
                playback, otherwise a small status note is shown instead
            */}
            {audio_playback_blocked ? (
                <Button
                size="sm"
                onClick={() => run(() => manager.startAudio())}
                title="Allow the browser to play remote audio (does not enable your microphone)"
                >
                    <VolumeX/>
                    Enable Audio
                </Button>
            ) : (
                <span
                className="inline-flex items-center gap-1 px-1 text-xs text-muted-foreground"
                title="Remote audio is allowed to play"
                >
                    <Volume2 className="size-4"/>
                    Audio on
                </span>
            )}
        </div>
    );
}
