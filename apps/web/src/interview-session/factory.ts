import { InterviewSessionManager } from "@/interview-session/interview-session-manager";
import { get_realtime_provider } from "@/rtc/provider/factory";
import { get_message_router } from "@/messaging/factory";
import { participant_store, transcript_store } from "@/store/factory";
import {
    connection_store,
    live_session_store,
} from "@/store/factory";
import { get_connection_service } from "@/connection/factory";
import { get_provider_event_router } from "@/rtc/events/factory";
import { get_frontend_service } from "@/frontend/factory";


export const createInterviewSession = () => {
    const rtc_provider = get_realtime_provider();
    const message_router = get_message_router();
    const connection_service = get_connection_service();
    
    const provider_event_router = get_provider_event_router(
        rtc_provider,
    );
    const frontend_services = get_frontend_service();

    return new InterviewSessionManager(
        rtc_provider,
        message_router,
        transcript_store,
        participant_store,
        connection_service,
        frontend_services.sessions,
        frontend_services.users,
        provider_event_router,
        connection_store,
        live_session_store,
    );
    
}