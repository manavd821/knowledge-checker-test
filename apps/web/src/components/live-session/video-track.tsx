import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Renders a single `MediaStreamTrack` coming out of the ParticipantStore.
 * This component never touches the LiveKit room, it only receives the track
 * the store already holds.
 */
export const VideoTrack = ({
    track,
    className,
    mirror = false,
    placeholder,
}: {
    track?: MediaStreamTrack;
    className?: string;
    /** self view is mirrored, remote video is not */
    mirror?: boolean;
    placeholder?: ReactNode;
}) => {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const element = ref.current;

        if (!track || !element) {
            return;
        }

        const stream = new MediaStream([track]);

        element.srcObject = stream;
        element.play().catch(() => {
            // video playback can also be gated by the autoplay policy, the audio
            // unlock notice covers the same user gesture
        });

        return () => {
            element.srcObject = null;
        };
    }, [track]);

    if (!track) {
        return (
            <div
                data-testid="video-placeholder"
                className={cn(
                    "flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground",
                    className,
                )}
            >
                {placeholder ?? "Camera off"}
            </div>
        );
    }

    return (
        <video
            ref={ref}
            autoPlay
            playsInline
            // audio is played by AudioTrack, never by the video element
            muted
            className={cn(
                "h-full w-full object-cover",
                mirror && "-scale-x-100",
                className,
            )}
        />
    );
};