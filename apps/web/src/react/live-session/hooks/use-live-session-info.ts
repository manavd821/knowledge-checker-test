"use client";

import { useContext, useSyncExternalStore } from "react";
import { ManagerContext } from "@/react/live-session/context/interview-session-provider";
import { LiveSessionInfo } from "@/modules";
import { live_session_store } from "@/store/factory";

/**
 * Backend authoritative session info for the open session.
 * Seeded on join and refreshed after every lifecycle mutation, so the header,
 * the session controls and the timer all observe the same snapshot.
 */
export function useLiveSessionInfo() : LiveSessionInfo{
    const ctx = useContext(ManagerContext);
    if(!ctx){
        throw new Error(
            "useLiveSessionInfo must be used inside ManagerProvider"
        );
    }
    return useSyncExternalStore(
        live_session_store.subscribe,
        live_session_store.getSnapShot,
        live_session_store.getSnapShot,
    ) as LiveSessionInfo;
}