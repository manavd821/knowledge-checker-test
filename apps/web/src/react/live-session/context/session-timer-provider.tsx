"use client";
import React, { createContext, useEffect, useState } from "react";
import { SessionTimer } from "@/interview-session/interview-session-types";
import { useLiveSessionInfo } from "@/react/live-session/hooks/use-live-session-info";

export const SessionTimerContext = createContext<SessionTimer>({
    elapsed_seconds: 0,
    remaining_seconds: 0,
});

/**
 * The timer is derived, never persisted by the UI.
 *
 *  active    -> actual_duration_sec + time elapsed since active_since
 *  otherwise -> actual_duration_sec
 *
 * The backend stays authoritative: `actual_duration_sec` and `active_since` are
 * re-read from the session API after every pause / resume, so the UI never
 * writes duration back to the database.
 */
export const SessionTimerProvider = ({ children } : { 
    children: React.ReactNode,
}) => {
    const { 
        actual_duration_sec,
        active_since,
        duration_minutes,
        status,
    } = useLiveSessionInfo();

    const is_running = status === "active" && !!active_since;
    // ticking only while the session is running keeps a paused session frozen
    const [now, set_now] = useState<number>(() => Date.now());

    useEffect(() => {
        if(!is_running){
            return;
        }
        const id = setInterval(
            () => set_now(Date.now()),
            1000,
        );
        return () => clearInterval(id);
    },[is_running]);

    const accumulated = actual_duration_sec ?? 0;
    const elapsed_seconds = is_running
        // `now` can lag one tick behind right after a resume, hence the clamp
        ? accumulated + Math.max(
            0,
            Math.floor(
                (now - new Date(active_since!).getTime()) / 1000
            ),
        )
        : accumulated;

    return (
        <SessionTimerContext value={{
            elapsed_seconds,
            remaining_seconds: duration_minutes * 60 - elapsed_seconds,
        }}>
            { children }
        </SessionTimerContext>
    )
}