/**
 * Transport level status of the realtime (LiveKit) room.
 * Mirrors only what the UI needs to render, never LiveKit internals.
 */
export type RealtimeStatus =
    | "connecting"
    | "connected"
    | "reconnecting"
    | "disconnected"
    | "failed";

export type ConnectionStoreState = {
    status: RealtimeStatus;
    /**
     * true when the browser refused to play remote audio because there was no
     * user gesture yet. Resolved by `InterviewSessionManager.startAudio()`.
     */
    audio_playback_blocked: boolean;
    /**
     * Bumped every time the user explicitly unlocks audio playback. Audio
     * elements re-attempt `play()` whenever it changes, because a document
     * that has been interacted with is allowed to autoplay.
     */
    playback_nonce: number;
    /**
     * Last media/permission error surfaced to the UI.
     */
    error: string | null;
};