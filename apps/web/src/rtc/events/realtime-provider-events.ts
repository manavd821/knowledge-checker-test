import { DataChannelMessage } from "@/messaging/types";
import { ParticipantVM } from "@/store/types";

export interface RealtimeProviderEvents{
    connected : void;

    disconnected: void;

    /** transport is temporarily lost, LiveKit is retrying on its own */
    reconnecting: void;

    /** transport recovered, the room object stays valid */
    reconnected: void;

    participantJoined: {
        participant : ParticipantVM;
        isLocal: boolean;
    }
    participantLeft: {
        sid: string;
    };
    /**
     * Media / identity state of a participant changed without a join or leave.
     * (mic or camera toggled, participant started or stopped speaking)
     */
    participantUpdated: {
        participant: ParticipantVM;
        isLocal: boolean;
    };
    dataReceived: {
        message: DataChannelMessage;
        sender_id?: string;
    };

    trackSubscribed: {
        participant_id: string;
        source: "camera" | "microphone";
        track: MediaStreamTrack;
    };

    trackUnsubscribed: {
        participant_id: string;
        source: "camera" | "microphone";
    };
    audioPlaybackBlocked: undefined;

}