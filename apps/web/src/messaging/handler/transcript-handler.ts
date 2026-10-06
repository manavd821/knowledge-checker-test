import { IMessageHandler } from "../message-handler.interface";
import { TranscriptStore } from "@/store/transcript-store";
import { TranscriptPayload } from "@/messaging/types";
import { ParticipantRole } from "@/store/types";

const PARTICIPANT_ROLES: ParticipantRole[] = [
    "candidate",
    "interviewer",
    "ai",
    "observer",
];

/**
 * Normalizes the wire role coming from the AI service into the domain model
 * used by the transcript UI, so the component never sees raw wire values.
 */
const to_participant_role = (role: unknown): ParticipantRole =>
    PARTICIPANT_ROLES.includes(role as ParticipantRole)
        ? role as ParticipantRole
        : "observer";

export class TranscriptHandler
    implements IMessageHandler<TranscriptPayload>
{
    readonly type = "transcript";

    constructor(
        private readonly store: TranscriptStore,
    ) {}

    handle(payload: TranscriptPayload): void {
        const text = payload.transcript?.trim();
        if(!text){
            return;
        }
        this.store.append({
            id: crypto.randomUUID(),
            participantId: payload.participant_id,
            text,
            timestamp: new Date(),
            speaker: to_participant_role(payload.role),
            final: true,
        });
    }
}