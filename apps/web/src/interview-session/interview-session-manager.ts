import { ConnectionService } from "@/connection/connection-service";
import { MessageRouter } from "@/messaging/message-router";
import { IRealTimeProvider } from "@/rtc/provider/realtime-provider";
import { ParticipantStore } from "@/store/participant-store";
import { TranscriptStore } from "@/store/transcript-store";
import { ConnectionStore } from "@/store/connection-store";
import { LiveSessionStore } from "@/store/live-session-store";
import { SessionService } from "@/frontend/services/sessions.service";
import { UserService } from "@/frontend/services/users.service";
import { GetUser } from "@/shared/dto/users/get-user.dto";
import { LiveSessionInfo, LiveSessionInfoSchema } from "@/modules";
import { ConnectionState } from "@/interview-session/interview-session-types";
import { ConnectionStateSchema } from "@/interview-session/interview-session-schema";
import { ProviderEventRouter } from "@/rtc/events/provider-event-router";
import { handleParticipantJoin } from "@/rtc/events/handlers/participant-joined";
import { handleParticipantLeave } from "@/rtc/events/handlers/participant-leaved";
import { handleParticipantUpdated } from "@/rtc/events/handlers/participant-updated";
import { handleTrackSubscribed } from "@/rtc/events/handlers/track-subscribed";
import { handleTrackUnsubscribed } from "@/rtc/events/handlers/track-unsubscribed";

/**
 * Turns a rejected media request into something the user can act on.
 * `NotAllowedError` is the browser refusing microphone / camera permission.
 */
const to_media_error_message = (error: unknown) => {
    const name = (error as { name?: string })?.name;
    if(name === "NotAllowedError" || name === "PermissionDeniedError"){
        return "Permission denied. Allow microphone / camera access in your browser and try again.";
    }
    if(name === "NotFoundError"){
        return "No microphone or camera was found on this device.";
    }
    if(name === "NotReadableError"){
        return "Your microphone or camera is already in use by another application.";
    }
    return error instanceof Error
        ? error.message
        : "Could not access your media devices.";
};

export class InterviewSessionManager{
    constructor(
        private readonly realtime_provider: IRealTimeProvider,
        private readonly message_router: MessageRouter,
        private readonly transcript_store: TranscriptStore,
        private readonly _participant_store: ParticipantStore,
        private readonly connection_service: ConnectionService,
        private readonly session_service: SessionService,
        private readonly user_service: UserService,
        private readonly provider_event_router: ProviderEventRouter,
        private readonly connection_store: ConnectionStore,
        private readonly live_session_store: LiveSessionStore,
    ){
        this.registerProviderEvents();
    }

    registerProviderEvents(){
        // livekit events related to participants
        this.provider_event_router.register(
            "participantJoined", 
            payload => handleParticipantJoin(
                payload,
                this._participant_store,
            )
        );
        this.provider_event_router.register(
            "participantLeft", 
            payload => handleParticipantLeave(
                payload,
                this._participant_store,
            )
        );
        this.provider_event_router.register(
            "participantUpdated",
            payload => handleParticipantUpdated(
                payload,
                this._participant_store,
            )
        );
        this.provider_event_router.register(
            "trackSubscribed", 
            payload => handleTrackSubscribed(
                payload,
                this._participant_store,
            )
        );
        this.provider_event_router.register(
            "trackUnsubscribed", 
            payload => handleTrackUnsubscribed(
                payload,
                this._participant_store,
            )
        );
        // transport lifecycle -> connection store -> useConnectionStatus()
        this.provider_event_router.register(
            "connected",
            () => {
                this.connection_store.set_status("connected");
            }
        );
        this.provider_event_router.register(
            "disconnected",
            () => {
                this.connection_store.set_status("disconnected");
            }
        );
        this.provider_event_router.register(
            "reconnecting",
            () => {
                this.connection_store.set_status("reconnecting");
            }
        );
        this.provider_event_router.register(
            "reconnected",
            () => {
                this.connection_store.set_status("connected");
            }
        );
        this.provider_event_router.register(
            "audioPlaybackBlocked",
            () => {
                this.connection_store.set_audio_playback_blocked(true);
            }
        );
        // route to MessageRouter
        this.realtime_provider.on(
            "dataReceived",
            payload => {
                try {
                    this.message_router.handle(
                        payload.message
                    )
                } catch(error){
                    // a single malformed / unsupported data channel message must
                    // never take down the realtime event pipeline
                    console.error(
                        "Failed to handle data channel message",
                        {error}
                    );
                }
            }
        )
    }
    get participant_store() : ParticipantStore{
        return this._participant_store;
    }   

    async join(session_id: string) : Promise<{
        connection_state: ConnectionState,
        live_session_info: LiveSessionInfo,
    }>{
        this.connection_store.set_status("connecting");
        this.connection_store.set_error(null);
        try{
            const data = await this.session_service.get_connection_info(session_id)
            const { 
                token, 
                ws_url, 
            } = data;

            const room_name = await this.realtime_provider.connect({
                token,
                ws_url,
            });
            // cache connection state and live session info
            const connection_state = ConnectionStateSchema.parse({
                ...data,
                room_name,
            });
            this.session_service.set_connection_state(session_id, connection_state);
            const live_session_info = LiveSessionInfoSchema.parse(data);
            this.session_service.set_live_session_info(session_id, live_session_info);
            this.live_session_store.set_live_session_info(live_session_info);
            return {
                connection_state,
                live_session_info,
            };
        } catch(error){
            this.connection_store.set_status("failed");
            this.connection_store.set_error(
                error instanceof Error
                    ? error.message
                    : "Could not join the session."
            );
            throw error;
        }
    }

    async leave(connection_id: string){
        this.connection_store.set_status("disconnected");
        try{
            await this.session_service.leave_session(connection_id);
        } catch(error){
            // leaving is best effort, the LiveKit webhook remains the source of
            // truth for the connection bookkeeping
            console.warn("Leave request failed", {error});
        }
        await this.realtime_provider.disconnect();
    }

    /**
     * Closes the room without a session connection record, used when the client
     * never got as far as creating one.
     */
    async disconnect(){
        this.connection_store.set_status("disconnected");
        await this.realtime_provider.disconnect();
    }

    async pause(session_id: string): Promise<LiveSessionInfo>{
        await this.session_service.pause_session(session_id);
        // the backend owns the duration accounting, re-read it so the timer
        // reflects the accumulated time and the cleared `active_since`
        const live_session_info =
            await this.session_service.refresh_live_session_info(session_id);
        this.live_session_store.set_live_session_info(live_session_info);
        return live_session_info;
    }

    async resume(session_id: string): Promise<LiveSessionInfo>{
        await this.session_service.resume_session(session_id);
        const live_session_info =
            await this.session_service.refresh_live_session_info(session_id);
        this.live_session_store.set_live_session_info(live_session_info);
        return live_session_info;
    }
    async get_user(user_id: string) : Promise<GetUser>{
        const user = await this.user_service.get_user(user_id);
        if(!user){
            throw new Error(`User  not found`)
        }
        return user;
    }
    
    async get_user_and_session_info(user_id: string, session_id: string) : Promise<{
        user: GetUser,
        session: LiveSessionInfo,
    }>{
        const [ user, session ] = await Promise.all([
            this.user_service.get_user(user_id),
            this.session_service.get_live_session_info(session_id),
        ]);
        if(!user){
            throw new Error(`User  not found`,)
        }
        if(!session){
            throw new Error(`Session not found`,)
        }
        return {
            user, 
            session,
        }
    }

    async enableCamera() {
        await this.run_media_action(() => this.realtime_provider.enableCamera());
    }

    async disableCamera() {
        await this.run_media_action(() => this.realtime_provider.disableCamera());
    }

    async enableMicrophone() {
        await this.run_media_action(() => this.realtime_provider.enableMicrophone());
    }

    async disableMicrophone() {
        await this.run_media_action(() => this.realtime_provider.disableMicrophone());
    }

    /**
     * Unlocks the browser's audio output. Must be triggered by a user gesture
     * and is unrelated to enabling the local microphone.
     */
    async startAudio() {
        try{
            await this.realtime_provider.startAudio();
            this.connection_store.unlock_audio_playback();
        } catch(error){
            console.error("Failed to start audio playback", {error});
            this.connection_store.set_audio_playback_blocked(true);
        }
    }

    /**
     * Called by the audio element when the browser refuses to start playback.
     */
    report_audio_playback_blocked(blocked: boolean){
        this.connection_store.set_audio_playback_blocked(blocked);
    }

    clear_error(){
        this.connection_store.set_error(null);
    }

    private async run_media_action(action: () => Promise<void>){
        try{
            await action();
            this.connection_store.set_error(null);
        } catch(error){
            console.error("Media action failed", {error});
            this.connection_store.set_error(
                to_media_error_message(error)
            );
            throw error;
        }
    }
}