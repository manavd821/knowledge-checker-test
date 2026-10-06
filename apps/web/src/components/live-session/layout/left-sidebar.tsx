"use client";
import { LeftContent } from "@/components/live-session/left-section/left-content";
import { LeftHeader } from "@/components/live-session/left-section/left-header";

/**
 * Left session sidebar (plain flex column, not positioned, never overlaps the
 * header): session identity, session information, progress, participants and
 * connection status. It scrolls on its own.
 */
export function LeftSidebar(){
    return (
        <aside
        data-testid="left-sidebar"
        className="flex w-72 shrink-0 flex-col overflow-y-auto border-r bg-sidebar text-sidebar-foreground"
        >
            <LeftHeader/>
            <LeftContent/>
        </aside>
    );
}
