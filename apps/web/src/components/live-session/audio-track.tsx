"use client";
import { useEffect, useRef } from "react";
import { useSessionManager } from "@/react/live-session/hooks/use-session-manager";
import { useConnectionStatus } from "@/react/live-session/hooks/use-connection-status";

/**
 * Plays a remote participant's audio track.
 *
 * The browser only allows audio to start after the document has been interacted
 * with, so the first `play()` may be rejected. When that happens the connection
 * store is flagged and every mounted audio element retries as soon as the user
 * unlocks playback through `sessionManager.startAudio()`.
 */
export const AudioTrack = ({
    track,
}: {
    track?: MediaStreamTrack;
}) => {
    const manager = useSessionManager();
    const { playback_nonce } = useConnectionStatus();
    const ref = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const element = ref.current;

        if (!track || !element) {
            return;
        }

        const stream = new MediaStream([track]);

        element.srcObject = stream;

        let cancelled = false;
        element.play()
            .then(() => {
                if(!cancelled){
                    manager.report_audio_playback_blocked(false);
                }
            })
            .catch(() => {
                if(!cancelled){
                    manager.report_audio_playback_blocked(true);
                }
            });

        return () => {
            cancelled = true;
            element.srcObject = null;
        };
    }, [track, playback_nonce, manager]);

    if(!track){
        return null;
    }

    return <audio ref={ref} autoPlay/>;
};