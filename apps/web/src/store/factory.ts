import { ConnectionStore } from "@/store/connection-store";
import { LiveSessionStore } from "@/store/live-session-store";
import { ParticipantStore } from "@/store/participant-store";
import { TranscriptStore } from "@/store/transcript-store";

export const transcript_store = new TranscriptStore();

export const participant_store = new ParticipantStore();

export const connection_store = new ConnectionStore();

export const live_session_store = new LiveSessionStore();