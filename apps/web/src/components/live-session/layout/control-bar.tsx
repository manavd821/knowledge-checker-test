"use client";
import { Separator } from "@/components/ui/separator";
import { MediaControls } from "@/components/live-session/media-controls";
import { SessionControls } from "@/components/live-session/session-controls";

/**
 * Full width bottom control bar: microphone / camera / audio playback on the
 * left of the divider, session control (pause / resume / end) on the right.
 * It is a direct child of the layout root, so it is always visible.
 *
 * The inner groups wrap, so on narrow screens the controls stack onto extra
 * rows instead of ever overflowing horizontally.
 */
export function ControlBar() {
    return (
        <footer
        data-testid="control-bar"
        className="flex min-h-20 shrink-0 items-center justify-center border-t bg-background px-3 py-2 sm:px-4"
        >
            <div className="flex max-w-5xl flex-wrap items-center justify-center gap-2 sm:gap-3">
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
