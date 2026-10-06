"use client";
import { createInterviewSession } from "@/interview-session/factory";
import { InterviewSessionManager } from "@/interview-session/interview-session-manager";
import { ConnectionState } from "@/interview-session/interview-session-types";
import React, { 
    createContext, 
    useState,
} from "react";
import { useInterviewIntialization } from "@/react/live-session/hooks/use-interview-initialization";
import { LiveSessionInfo } from "@/modules";

export type ManagerProvider = {
    manager: InterviewSessionManager,
    session_id: string,
    connection_state: ConnectionState,
    live_session_info: LiveSessionInfo,
}

export const ManagerContext = createContext< ManagerProvider | null>(null);

export const ManagerProvider = ({ session_id, children } : {
    session_id: string,
    children : React.ReactNode,
}) => {
    // one manager per mounted session, it owns the provider and the stores
    const [manager] = useState<InterviewSessionManager>(
        () => createInterviewSession(),
    );
    const {
        data,
        isPending,
        isError,
        error,
    } = useInterviewIntialization(
        session_id,
        manager,
    )
    if(isPending){
        return (
            <div
            className="flex h-screen items-center justify-center text-sm text-muted-foreground"
            >
                Connecting to the session...
            </div>
        )
    }
    if(isError){
        return (
            <div
            className="flex h-screen flex-col items-center justify-center gap-2 px-6 text-center"
            >
                <p className="text-base font-medium">
                    Could not join this session
                </p>
                <p
                className="text-sm text-muted-foreground"
                >
                    {error instanceof Error
                        ? error.message
                        : "Something went wrong while joining."}
                </p>
            </div>
        )
    }
    const {
        connection_state,
        live_session_info,
    } = data;
    return (
        <ManagerContext value={{
            session_id,
            manager,
            connection_state,
            live_session_info,
        }}>
            {children}
        </ManagerContext>
    )
}