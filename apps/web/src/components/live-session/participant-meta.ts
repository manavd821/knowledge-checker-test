"use client";

import { useContext } from "react";
import { UserContext } from "@/react/users/context/user-provider";
import {
    ParticipantRole,
    ParticipantState,
    ParticipantVM,
} from "@/store/types";

export const PARTICIPANT_ROLE_LABEL: Record<ParticipantRole, string> = {
    candidate: "Candidate",
    interviewer: "Interviewer",
    ai: "AI Interviewer",
    observer: "Observer",
};

export const is_ai = (participant: ParticipantVM) => participant.role === "ai";

/**
 * Whether an AI participant is currently in the room. The AI joins as a
 * LiveKit agent participant, its presence in the ParticipantStore *is* the
 * AI state, there is no separate AI state system.
 */
export const has_ai_participant = ({ local, remote }: ParticipantState) =>
    local?.role === "ai" ||
    [...remote.values()].some(participant => participant.role === "ai");

/**
 * The LiveKit identity of a participant is the session participant id (a
 * uuid), so it is shown shortened with the full value in the tooltip. The
 * local participant shows the signed in user's name instead.
 */
const short_identity = (identity: string) => identity.slice(0, 8);

/**
 * Display name for a participant card / list row. Presentation only, the
 * value is derived from the store VM plus the existing user context.
 */
export const useParticipantName = (
    participant: ParticipantVM,
    isLocal: boolean,
): string => {
    // the signed in user, `null` while it is not loaded. Reading the context
    // directly keeps a card from throwing when no user is attached.
    const user = useContext(UserContext);

    if (is_ai(participant)) {
        return PARTICIPANT_ROLE_LABEL.ai;
    }

    if (!isLocal) {
        return short_identity(participant.identity);
    }

    const name = [user?.first_name, user?.last_name]
        .filter(Boolean)
        .join(" ");

    return name || short_identity(participant.identity);
};
