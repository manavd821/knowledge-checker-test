"use client";
import { useLiveSessionInfo } from "@/react/live-session/hooks/use-live-session-info";
import {
    DOMAIN_META,
    TOPIC_TYPE_META,
} from "@/react/session-form/sessions.meta";

/**
 * Top block of the left sidebar: the identity of the open session.
 * (The application header lives in `SessionHeader`, never here.)
 */
export function LeftHeader(){

    const session = useLiveSessionInfo();

    const domain_label =
        session.domain === "custom" && session.custom_domain
            ? session.custom_domain
            : DOMAIN_META[session.domain].label;

    return (
        <div className="flex flex-col gap-1 border-b p-4">
            <p className="text-xs font-medium text-muted-foreground">
                SESSION
            </p>
            <p className="truncate text-sm font-semibold">
                {TOPIC_TYPE_META[session.topic_type].label}
            </p>
            <p className="truncate text-xs text-muted-foreground">
                {domain_label}
            </p>
        </div>
    )
}
