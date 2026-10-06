"use client";
import { InterviewTranscript } from "@/components/live-session/interview-transcript";

/**
 * Body of the right sidebar: the live transcript panel only.
 * Entries come from the TranscriptStore over the data channel, there is no
 * local transcript state and no polling.
 */
export function RightContent(){
    return (
        <div className="flex min-h-0 flex-1 flex-col p-4">
            <InterviewTranscript/>
        </div>
    );
}
