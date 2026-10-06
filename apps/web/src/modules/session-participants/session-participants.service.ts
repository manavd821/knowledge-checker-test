import { ForbiddenError } from "@/exceptions/ForbiddenError";
import get_logger from "@/lib/logging/logger-factory";
import { SessionParticipantsRepository } from "@/modules/session-participants/session-participants.repository";
import { CreateSessionParticipants, MarkParticipantJoined, SelectSessionParticipants } from "@/modules/session-participants/session-participants.types";

const logger = get_logger();
export class SessionParticipantsService{
    constructor(
        private readonly session_participants_repo: SessionParticipantsRepository
    ){}

    async create_session_participant(
        data: CreateSessionParticipants,
    ) : Promise<string>{
        const [ id ] =  await this.session_participants_repo.create([data]);
        return id;
    }
    async get_participant_by_user_and_session(
        user_id: string,
        session_id: string,
    ){
        const participant =
            await this.session_participants_repo
                .get_by_ids(user_id, session_id);

        if (!participant) {
            throw new ForbiddenError(
                "User is not a participant of this session",
                session_id,
            );
        }

        return participant;

    }
    async mark_participant_joined(
        user_id: string,
        session_id: string,
    ) : Promise<MarkParticipantJoined>{
        // Get Session Participant
        const participant = await this.get_participant_by_user_and_session(
            user_id,
            session_id
        );
        
        const now = new Date();
        // Set first_joined_at (once)
        if(!participant.first_joined_at){ 
            logger.info("Marking participant first_joined_at", {user_id, session_id});
            const update = {
                first_joined_at: now
            };
            await this.session_participants_repo
                    .update(participant.participant_id, update);
            logger.info(
                "Participant marked as joined successfully", 
                {participant_id: participant.participant_id, session_id, user_id, now}
            );
        }
        return {
            participant,
            now,
        }
    }

    async update_completed_duration_sec(
        participant_id: string,
        completed_duration_sec : number
    ){
        await this.session_participants_repo.update(participant_id, {
            completed_duration_sec,
        })
    }

    /**
     * Records that the participant left the session. The connection itself is
     * tracked separately by SessionConnectionsService, this only owns the
     * participant level bookkeeping.
     */
    async mark_participant_left(
        participant_id: string,
        duration_sec: number,
        left_at: Date = new Date(),
    ){
        await this.session_participants_repo.update(participant_id, {
            left_session_at: left_at,
            completed_duration_sec: duration_sec,
        });
    }

    async create_multiple_participants(
        data: CreateSessionParticipants[],
    ) : Promise<string[]>{
        return await this.session_participants_repo.create(data);
    }
}