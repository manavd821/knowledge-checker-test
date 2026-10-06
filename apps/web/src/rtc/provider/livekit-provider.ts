import { DataChannelMessage } from "@/messaging/types";
import {
    LocalParticipant,
    LocalTrackPublication,
    Participant,
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
    Room,
    RoomEvent,
    Track,
    TrackPublication,
    VideoPresets,
} from "livekit-client";
import { IRealTimeProvider } from "@/rtc/provider/realtime-provider";
import { SessionConnection } from "@/rtc/provider/types/session-connection";
import { TypedEventEmitter } from "@/rtc/provider/typed-event-emitter";
import { RealtimeProviderEvents } from "@/rtc/events/realtime-provider-events";
import { LocalParticipantVM, ParticipantRole, ParticipantVM } from "@/store/types";

const AI_ROLE: ParticipantRole = "ai";

/**
 * Maps a LiveKit publication source onto the application level track source.
 * Returns null for anything the live session UI does not render.
 *
 * `Track.Source.Unknown` falls back to the publication kind, some publishers
 * (LiveKit agents among them) do not always tag their audio publication with
 * `microphone`, and the AI audio must still reach the UI.
 */
const to_track_source = (
    publication: TrackPublication
): "camera" | "microphone" | null => {
    switch (publication.source) {
        case Track.Source.Camera:
            return "camera";
        case Track.Source.Microphone:
            return "microphone";
        case Track.Source.Unknown:
            if (publication.kind === Track.Kind.Video) {
                return "camera";
            }
            if (publication.kind === Track.Kind.Audio) {
                return "microphone";
            }
            return null;
        default:
            // screen share is not part of the live session UI
            return null;
    }
};

export class LivekitProvider
    extends TypedEventEmitter<RealtimeProviderEvents>
    implements IRealTimeProvider
{
    private readonly room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults : {
            resolution: VideoPresets.h720.resolution,
        },
    });

    private readonly encoder = new TextEncoder();
    private readonly decoder = new TextDecoder();

    constructor(){
        super();
        this.registerRoomEvent();
    }

    /**
     * LiveKit metadata is an opaque string set by whoever issued the token.
     * It must never be able to break participant rendering.
     */
    private parseMetadata(metadata?: string): Record<string, unknown>{
        if(!metadata){
            return {};
        }
        try {
            const parsed = JSON.parse(metadata);
            return parsed && typeof parsed === "object"
                ? parsed as Record<string, unknown>
                : {};
        } catch {
            return {};
        }
    }

    /**
     * The AI agent joins the room as a LiveKit agent participant, it does not
     * carry our role metadata, so the participant kind is the source of truth.
     */
    private resolveRole(participant: Participant): ParticipantRole {
        if(participant.isAgent){
            return AI_ROLE;
        }
        const { role } = this.parseMetadata(participant.metadata);
        return typeof role === "string"
            ? role as ParticipantRole
            : "observer";
    }

    private toParticipantVM(participant: Participant) : ParticipantVM {
        return {
            id: participant.sid,
            identity: participant.identity,
            role: this.resolveRole(participant),
            cameraEnabled: participant.isCameraEnabled,
            micEnabled: participant.isMicrophoneEnabled,
            speaking: participant.isSpeaking,
        }
    }

    private toLocalParticipantVM(
        participant: LocalParticipant,
    ): LocalParticipantVM {
        return {
            ...this.toParticipantVM(participant),
            selectedMicId: "",
            selectedCameraId: "",
        };
    }

    registerRoomEvent(){
        this.room.on(
            RoomEvent.ParticipantConnected,
            this.handleParticipantConnected
        );
        this.room.on(
            RoomEvent.ParticipantDisconnected,
            this.handleParticipantDisconnected,
        );
        this.room.on(
            RoomEvent.DataReceived,
            this.handleDataRecieved,
        );
        this.room.on(
            RoomEvent.TrackSubscribed,
            this.handleTrackSubscribed
        );

        this.room.on(
            RoomEvent.TrackUnsubscribed,
            this.handleTrackUnsubscribed
        );
        // local media has to flow through the same store as remote media so the
        // UI never needs a second, LiveKit specific code path
        this.room.on(
            RoomEvent.LocalTrackPublished,
            this.handleLocalTrackPublished
        );
        this.room.on(
            RoomEvent.LocalTrackUnpublished,
            this.handleLocalTrackUnpublished
        );
        this.room.on(
            RoomEvent.TrackMuted,
            this.handleTrackMuted
        );
        this.room.on(
            RoomEvent.TrackUnmuted,
            this.handleTrackUnmuted
        );
        this.room.on(
            RoomEvent.ActiveSpeakersChanged,
            this.handleActiveSpeakersChanged
        );
        this.room.on(
            RoomEvent.AudioPlaybackStatusChanged,
            this.handlePlaybackBlocked
        );
        this.room.on(
            RoomEvent.Reconnecting,
            this.handleReconnecting
        );
        this.room.on(
            RoomEvent.Reconnected,
            this.handleReconnected
        );
        this.room.on(
            RoomEvent.Disconnected,
            this.handleDisconnected
        );
        this.room.on(
            RoomEvent.MediaDevicesError,
            this.handleMediaDevicesError
        );
    }

    private emitParticipantUpdate(participant: Participant){
        this.emit("participantUpdated", {
            participant: this.toParticipantVM(participant),
            isLocal: participant.isLocal,
        });
    }

    private handleParticipantConnected = (
        participant: RemoteParticipant,
    ) => {
        const participant_vm =
            this.toParticipantVM(participant);

        this.emit("participantJoined", {
            participant: participant_vm,
            isLocal: false,
        });

        // a participant can join with tracks already published, TrackSubscribed
        // only fires for tracks that arrive later
        participant.trackPublications.forEach(publication => {
            if(publication.isSubscribed && publication.track){
                this.handleTrackSubscribed(
                    publication.track as RemoteTrack,
                    publication as RemoteTrackPublication,
                    participant,
                );
            }
        });
    };

    private handleParticipantDisconnected = (
        participant: RemoteParticipant,
    ) => {
        console.log(
            "LIVEKIT: participant disconnected",
            participant.identity
        );

        this.emit("participantLeft", {
            sid: participant.sid,
        });
    };

    private handleDataRecieved = (
        payload: Uint8Array,
        participant?: RemoteParticipant,
    ) => {
        let message: DataChannelMessage;
        try {
            message = JSON.parse(
                this.decoder.decode(payload)
            ) as DataChannelMessage;
        } catch {
            // data packets are not guaranteed to be our JSON protocol
            console.warn(
                "Ignoring non application data packet",
                { sender_id: participant?.identity },
            );
            return;
        }

        this.emit("dataReceived", {
            message,
            sender_id: participant?.identity,
        });
    };

    private handlePlaybackBlocked = () => {
        if (!this.room.canPlaybackAudio) {
            this.emit("audioPlaybackBlocked", undefined); 
        }
    }

    private handleTrackSubscribed = (
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
    ) => {
        const source = to_track_source(publication);

        if (!source) {
            return;
        }

        this.emit("trackSubscribed", {
            participant_id: participant.sid,
            source,
            track: track.mediaStreamTrack,
        });

    }

    private handleTrackUnsubscribed = (
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
    ) => {
        const source = to_track_source(publication);

        if (!source) {
            return;
        }

        this.emit("trackUnsubscribed", {
            participant_id: participant.sid,
            source,
        });
    };

    private handleLocalTrackPublished = (
        publication: LocalTrackPublication,
        participant: LocalParticipant,
    ) => {
        const source = to_track_source(publication);
        const media_track = publication.track?.mediaStreamTrack;
        if(!source || !media_track){
            return;
        }
        // reuses the exact same store writes as remote tracks
        this.emit("trackSubscribed", {
            participant_id: participant.sid,
            source,
            track: media_track,
        });
        this.emitParticipantUpdate(participant);
    };

    private handleLocalTrackUnpublished = (
        publication: LocalTrackPublication,
        participant: LocalParticipant,
    ) => {
        const source = to_track_source(publication);
        if(!source){
            return;
        }
        this.emit("trackUnsubscribed", {
            participant_id: participant.sid,
            source,
        });
        this.emitParticipantUpdate(participant);
    };

    private handleTrackMuted = (
        publication: TrackPublication,
        participant: Participant,
    ) => {
        this.emitParticipantUpdate(participant);
    };

    private handleTrackUnmuted = (
        publication: TrackPublication,
        participant: Participant,
    ) => {
        this.emitParticipantUpdate(participant);
    };

    private handleActiveSpeakersChanged = (speakers: Participant[]) => {
        // only the speakers present in the current list need to be recomputed,
        // everyone who dropped out is reset to speaking: false
        this.room.remoteParticipants.forEach(participant => {
            if(!speakers.includes(participant) && participant.isSpeaking){
                this.emit("participantUpdated", {
                    participant: {
                        ...this.toParticipantVM(participant),
                        speaking: false,
                    },
                    isLocal: false,
                });
            }
        });
        speakers.forEach(speaker => {
            this.emitParticipantUpdate(speaker);
        });
    };

    private handleReconnecting = () => {
        this.emit("reconnecting", undefined);
    };

    private handleReconnected = () => {
        this.emit("reconnected", undefined);
    };

    private handleDisconnected = () => {
        // remote participants are gone with the room, drop them so the UI does
        // not keep rendering cards for participants that already left
        this.room.remoteParticipants.forEach(participant => {
            this.emit("participantLeft", {
                sid: participant.sid,
            });
        });
        this.emit("disconnected", undefined);
    };

    private handleMediaDevicesError = (error: Error) => {
        console.error("LIVEKIT: media devices error", error);
    };

    async connect(connection: SessionConnection): Promise<string>{
        const { 
            token, 
            ws_url,
        } = connection;
        await this.room.connect(
            ws_url,
            token
        );
        this.emit("connected", undefined);
        console.log("Connected to the room: ", this.room.name);
        // emit local participant joined
        this.emit("participantJoined", {
            participant:
                this.toLocalParticipantVM(
                    this.room.localParticipant,
                    
                ),
            isLocal: true,
        });

        // emit event for participants that were already in the room, they never
        // produce a future ParticipantConnected event
        this.room.remoteParticipants.forEach(participant => {
            this.handleParticipantConnected(participant);
        });

        return this.room.name;
    };

    async disconnect(): Promise<void> {
        // RoomEvent.Disconnected is emitted by LiveKit itself and drives the
        // `disconnected` event, so we must not emit it twice
        await this.room.disconnect();
    };

    async enableCamera() : Promise<void>{
        await this.room.localParticipant.setCameraEnabled(true);
        this.emitParticipantUpdate(this.room.localParticipant);
    };

    async disableCamera(): Promise<void> {
        await this.room.localParticipant.setCameraEnabled(false);
        this.emitParticipantUpdate(this.room.localParticipant);
    }

    async enableMicrophone(): Promise<void> {
        await this.room.localParticipant.setMicrophoneEnabled(true);
        this.emitParticipantUpdate(this.room.localParticipant);
    }

    async disableMicrophone(): Promise<void> {
        await this.room.localParticipant.setMicrophoneEnabled(false);
        this.emitParticipantUpdate(this.room.localParticipant);
    }

    async startAudio() {
        await this.room.startAudio();
    }

}