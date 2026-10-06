import { LiveSessionInfo } from "@/modules";
import { ObservableStore } from "@/store/observable-store";

/**
 * Authoritative session info for the session that is currently open.
 * Seeded by the join flow and refreshed from the backend after every
 * lifecycle mutation (pause / resume) so the timer stays backend driven.
 */
export class LiveSessionStore extends ObservableStore<LiveSessionInfo | null>{
    constructor(){
        super(null, "live_session");
    }

    set_live_session_info(info: LiveSessionInfo){
        this.set(info);
    }

    update_live_session_info(update: Partial<LiveSessionInfo>){
        this.set(prev => prev ? { ...prev, ...update } : prev);
    }
}