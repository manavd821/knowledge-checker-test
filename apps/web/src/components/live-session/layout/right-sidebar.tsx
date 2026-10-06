"use client";
import { RightContent } from "@/components/live-session/right-section/right-content";

/**
 * Right sidebar: the live transcript only (plain flex column, never overlaps
 * the header). The list inside scrolls on its own.
 *
 * Permanent column from `lg` up; below `lg` it is hidden and the same
 * transcript is reachable through the `SessionPanels` sheet in the header.
 */
export function RightSidebar(){
    return (
        <aside
        data-testid="right-sidebar"
        className="hidden w-96 shrink-0 flex-col overflow-hidden border-l bg-background lg:flex"
        >
            <RightContent/>
        </aside>
    );
}
