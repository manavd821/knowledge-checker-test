import { db } from "@/db/client";
import get_logger from "@/lib/logging/logger-factory";
import { createServices } from "@/modules/factory";
import { ProvisionerWebhookEvents } from "@/rtc/webhook-events/provisioner-webhook-events";

const logger = get_logger();

export const handleParticipantLeft = async (
    payload: ProvisionerWebhookEvents["participant_left"]
) => {
    const { 
        connection_id,
        session_id,
    } = payload;
    await db.transaction(async (tx) => {
                const {
                    session_connections: session_connections_service,
                    session_participants: session_participants_service,
                    sessions: session_service,
                } = createServices(tx);
                // A deleted session cascades its connections away, so a late
                // participant_left must be ignored instead of resurrecting or
                // erroring on a session that no longer exists.
                const session_connection =
                    await session_connections_service.find_connection(connection_id);
                if (!session_connection || session_connection.left_at) {
                    logger.info(
                        "participant_left ignored: connection already closed",
                        { connection_id, session_id },
                    );
                    return;
                }

                // calculate connection's duration
                const now = new Date();
                const elapsedMs = now.getTime() - session_connection.joined_at.getTime();
                const elapsedSeconds = Math.floor(elapsedMs / 1000);
                
                // mark connection as left
                await session_connections_service.mark_connection_left(
                    connection_id,
                    elapsedSeconds,
                    now,
                );
                // update participant's accumulated connection time
                await session_participants_service.update_completed_duration_sec(
                    session_connection.participant_id,
                    elapsedSeconds,
                )
                // check whether anyone is still connected
                const has_active_connections =
                    await session_connections_service.has_active_connections(
                        session_id,
                    );
                // if no active connection, pause the session
                if(!has_active_connections){
                    await session_service.pause_session_if_active(
                        session_id,
                        now,
                    );
                }
            });
}