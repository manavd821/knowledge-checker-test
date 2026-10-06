import { ObservableStore } from "@/store/observable-store";
import {
    ConnectionStoreState,
    RealtimeStatus,
} from "@/store/types";

export const initial_connection_state: ConnectionStoreState = {
    status: "connecting",
    audio_playback_blocked: false,
    playback_nonce: 0,
    error: null,
};

/**
 * Holds the realtime connection state that the UI renders.
 * Written by `InterviewSessionManager` from typed provider events,
 * read by React through `useConnectionStatus()`.
 */
export class ConnectionStore extends ObservableStore<ConnectionStoreState>{
    constructor(){
        super({ ...initial_connection_state }, "connection");
    }

    set_status(status: RealtimeStatus){
        this.set(prev => {
            if(prev.status === status){
                return prev;
            }
            return {
                ...prev,
                status,
                // a successful connection clears any stale media error
                error: status === "connected" ? null : prev.error,
            };
        });
    }

    set_audio_playback_blocked(blocked: boolean){
        this.set(prev => {
            if(prev.audio_playback_blocked === blocked){
                return prev;
            }
            return { ...prev, audio_playback_blocked: blocked };
        });
    }

    /**
     * Called after the user performed a gesture to allow remote audio playback.
     * Clearing the flag and bumping the nonce makes every mounted audio element
     * re-run `play()`.
     */
    unlock_audio_playback(){
        this.set(prev => ({
            ...prev,
            audio_playback_blocked: false,
            playback_nonce: prev.playback_nonce + 1,
        }));
    }

    set_error(message: string | null){
        this.set(prev => {
            if(prev.error === message){
                return prev;
            }
            return { ...prev, error: message };
        });
    }

    reset(){
        this.set({ ...initial_connection_state });
    }
}