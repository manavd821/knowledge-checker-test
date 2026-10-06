"use client";
import { Loader2, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConnectionStatus } from "@/react/live-session/hooks/use-connection-status";
import { RealtimeStatus } from "@/store/types";

const CONNECTION_LABEL: Record<RealtimeStatus, string> = {
    connecting: "Connecting",
    connected: "Connected",
    reconnecting: "Reconnecting",
    disconnected: "Disconnected",
    failed: "Connection failed",
};

/**
 * Room transport status. A projection of the ConnectionStore, the component
 * never reads the LiveKit room to find this out.
 */
export function ConnectionStatus({ className }: { className?: string }) {
    const { status } = useConnectionStatus();

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 text-xs text-muted-foreground",
                className,
            )}
        >
            {status === "connected" ? (
                <Wifi className="size-4 text-emerald-600"/>
            ) : status === "connecting" ||
                status === "reconnecting" ? (
                <Loader2 className="size-4 animate-spin"/>
            ) : (
                <WifiOff className="size-4 text-destructive"/>
            )}
            {CONNECTION_LABEL[status]}
        </span>
    );
}
