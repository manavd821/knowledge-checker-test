import { DB } from "@/db/types";
import { CreateSessionParticipants, SelectSessionParticipants } from "@/modules/session-participants/session-participants.types";
import { session_participants } from "@/modules/session-participants/session-participants.table";
import { DatabaseBoundary } from "../database-boundary";
import { and, eq, sql } from "drizzle-orm";
import { NotFoundError } from "@/exceptions/NotFoundError";


export class SessionParticipantsRepository{
    constructor(
        private readonly db: DB,
    ){}

    @DatabaseBoundary("create session_participants")
    async create(
        data: CreateSessionParticipants[]
    ) : Promise<string[]>{
        const rows = await this.db
                .insert(session_participants)
                .values(data)
                .returning()
        
        return rows.map(p => p.participant_id);
    }

    @DatabaseBoundary("get session_participants by participant_id")
    async get(
        participant_id: string
    ) : Promise<SelectSessionParticipants | undefined>{
        const [ data ] = await this.db
                .select()
                .from(session_participants)
                .where(eq(session_participants.participant_id, participant_id));
        return data;
    }

    @DatabaseBoundary("get session_participants by user_id and session_id")
    async get_by_ids(
        user_id: string,
        session_id: string,
    ) : Promise<SelectSessionParticipants | undefined>{
        const [ data ] = await this.db
                .select()
                .from(session_participants)
                .where(
                    and(
                        eq(session_participants.user_id, user_id),
                        eq(session_participants.session_id, session_id),
                    )
                );
        return data;
    }

    @DatabaseBoundary("update session_participants")
    async update(
        participant_id: string,
        update: Partial<SelectSessionParticipants>,
    ){
        // completed_duration_sec accumulates across connections, it is never
        // overwritten with the latest connection's duration
        const set = typeof update.completed_duration_sec === "number"
            ? {
                ...update,
                completed_duration_sec: sql<number>`
                    ${session_participants.completed_duration_sec} + ${update.completed_duration_sec}
                `,
            }
            : { ...update };
        await this.db
            .update(session_participants)
            .set(set)
            .where(eq(
                session_participants.participant_id, participant_id
            ));
    }
    
}