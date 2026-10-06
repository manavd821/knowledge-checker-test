"use client";
import { ControlBar } from "@/components/live-session/layout/control-bar";
import { LeftSidebar } from "@/components/live-session/layout/left-sidebar";
import { RightSidebar } from "@/components/live-session/layout/right-sidebar";
import { WorkSpace } from "@/components/live-session/layout/workspace";
import { SessionHeader } from "@/components/live-session/session-header";

/**
 * Full viewport live session screen:
 *
 *   header        (full width, never hidden)
 *   body          left sidebar | video workspace | transcript sidebar
 *   control bar   (full width, always visible)
 *
 * The root owns the viewport (`h-screen overflow-hidden`), every region has its
 * own min-h-0 / overflow handling, so the page itself never scrolls and nothing
 * is ever positioned underneath a sidebar.
 */
export function SessionLayout() {

    return (
        <div
        data-testid="session-layout"
        className="flex h-screen flex-col overflow-hidden"
        >
            <SessionHeader/>

            <div className="flex min-h-0 flex-1">
                <LeftSidebar/>

                <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <WorkSpace/>
                </main>

                <RightSidebar/>
            </div>

            <ControlBar/>
        </div>
    );
}
