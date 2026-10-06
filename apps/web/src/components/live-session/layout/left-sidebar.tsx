"use client";
import { LeftContent } from "@/components/live-session/left-section/left-content";
import { LeftHeader } from "@/components/live-session/left-section/left-header";

/**
 * Left session sidebar (plain flex column, not positioned, never overlaps the
 * header): session identity, session information, progress, participants and
 * connection status. It scrolls on its own.
 *
 * Permanent column from `lg` up; below `lg` it is hidden and the same content
 * is reachable through the `SessionPanels` sheet in the header.
 */
export function LeftSidebar(){
    return (
        <aside
        data-testid="left-sidebar"
        className="hidden w-72 shrink-0 flex-col overflow-y-auto border-r bg-sidebar text-sidebar-foreground lg:flex"
        >
            <LeftHeader/>
            <LeftContent/>
        </aside>
    );
}
