"use client";
import { Separator } from "@/components/ui/separator";
import { MediaControls } from "@/components/live-session/media-controls";
import { SessionControls } from "@/components/live-session/session-controls";

/**
 * Full width bottom control bar: microphone / camera / audio playback on the
 * left of the divider, session control (pause / resume / leave) on the right.
 * It is a direct child of the layout root, so it is always visible.
 */
export function ControlBar() {
    return (
        <footer
        data-testid="control-bar"
        className="flex min-h-20 shrink-0 items-center justify-center border-t bg-background px-4 py-2"
        >
            <div className="flex max-w-5xl flex-wrap items-center justify-center gap-3">
                <MediaControls/>
                <Separator
                orientation="vertical"
                className="hidden h-8 sm:block"
                />
                <SessionControls/>
            </div>
        </footer>
    );
}
