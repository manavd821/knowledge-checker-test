"use client";
import { RightContent } from "@/components/live-session/right-section/right-content";

/**
 * Right sidebar: the live transcript only (plain flex column, never overlaps
 * the header). The list inside scrolls on its own.
 */
export function RightSidebar(){
    return (
        <aside
        data-testid="right-sidebar"
        className="flex w-96 shrink-0 flex-col overflow-hidden border-l bg-background"
        >
            <RightContent/>
        </aside>
    );
}
