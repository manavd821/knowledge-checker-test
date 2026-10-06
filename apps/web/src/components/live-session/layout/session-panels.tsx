"use client";
import { useState } from "react";
import { ClipboardList, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { LeftHeader } from "@/components/live-session/left-section/left-header";
import { LeftContent } from "@/components/live-session/left-section/left-content";
import { InterviewTranscript } from "@/components/live-session/interview-transcript";

/**
 * Tablet / mobile access to the two desktop side columns.
 *
 * From `lg` up the layout keeps its permanent 3 column shape (session info on
 * the left, transcript on the right). Below `lg` those columns are removed so
 * the video workspace can use the full width, and these sheets render the
 * exact same existing panels instead: the sheet body is `LeftHeader` +
 * `LeftContent` (session / progress / participants) and
 * `InterviewTranscript`, all of which still read from the same stores, so
 * there is no duplicate state.
 *
 * The `pt-14` on the sheet content clears the built in close button
 * (`top-4` + `size-8`), so the panels never render underneath it. Each body
 * scrolls internally, the sheet itself never scrolls.
 */
export function SessionPanels() {
    const [session_open, set_session_open] = useState(false);
    const [transcript_open, set_transcript_open] = useState(false);

    return (
        <div
        data-testid="session-panels"
        className="flex items-center gap-2 lg:hidden"
        >
            <Sheet open={session_open} onOpenChange={set_session_open}>
                <SheetTrigger asChild>
                    <Button
                    size="sm"
                    variant="secondary"
                    title="Session details and participants"
                    >
                        <ClipboardList/>
                        Session
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="pt-14">
                    <SheetTitle className="sr-only">
                        Session details
                    </SheetTitle>
                    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                        <LeftHeader/>
                        <LeftContent/>
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={transcript_open} onOpenChange={set_transcript_open}>
                <SheetTrigger asChild>
                    <Button
                    size="sm"
                    variant="secondary"
                    title="Live transcript"
                    >
                        <FileText/>
                        Transcript
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="pt-14">
                    <SheetTitle className="sr-only">
                        Live transcript
                    </SheetTitle>
                    <div className="flex min-h-0 flex-1 flex-col p-4">
                        <InterviewTranscript/>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
