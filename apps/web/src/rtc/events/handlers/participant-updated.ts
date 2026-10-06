import { RealtimeProviderEvents } from "@/rtc/events/realtime-provider-events";
import { ParticipantStore } from "@/store/participant-store";

/**
 * Mic / camera / speaking state changed for a participant that is already in
 * the store. Only scalar fields are forwarded so the media stream tracks that
 * were attached on subscription are preserved.
 */
export const handleParticipantUpdated = (
    payload: RealtimeProviderEvents["participantUpdated"],
    participant_store: ParticipantStore,
) => {
    const {
        id,
        identity,
        role,
        cameraEnabled,
        micEnabled,
        speaking,
    } = payload.participant;

    const update = {
        identity,
        role,
        cameraEnabled,
        micEnabled,
        speaking,
    };

    if (payload.isLocal) {
        participant_store.update_local_participant(update);
        return;
    }

    participant_store.update_remote_participant(id, update);
};