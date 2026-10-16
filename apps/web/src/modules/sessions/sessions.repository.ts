import { DB } from "@/db/types";
import { sessions } from "@/modules/sessions/sessions.table";
import { session_participants } from "@/modules/session-participants/session-participants.table";
import { eq, desc, or, inArray, and } from "drizzle-orm";
import get_logger from "@/lib/logging/logger-factory";
import type { NewSession, SelectSession, Status } from "@/modules/sessions/sessions.types";
import { DatabaseBoundary } from "@/modules/database-boundary";

const logger = get_logger();

export class SessionRepository{
    constructor(private readonly database : DB){}

    @DatabaseBoundary("get session")
    async get_by_session_id(session_id : string): Promise<SelectSession | undefined> {
        const data = await this.database
                .select()
                .from(sessions)
                .where(eq(sessions.session_id, session_id))
        
        return data[0];
    }
    @DatabaseBoundary("create session")
    async create(data : NewSession): Promise<string>{
        const dbData = await this.database
        .insert(sessions)
        .values(data)
        .returning();
        return dbData[0].session_id;
    }
    @DatabaseBoundary("update session status")
    async update_status(
            session_id: string, 
            status : NewSession["status"],
        ){
        await this.database
            .update(sessions)
            .set({status})
            .where(eq(sessions.session_id, session_id));
    }
    @DatabaseBoundary("update session started at")
    async mark_session_started_at(session_id: string, now?: Date){
        // const now = new Date();
        
        await this.database
        .update(sessions)
        .set({started_at : now ?? new Date()})
        .where(eq(sessions.session_id, session_id));
        
        return now;
    }
    @DatabaseBoundary("update session")
    async update(
        session_id: string,
        update : Partial<SelectSession>,
    ){
        await this.database
        .update(sessions)
        .set(update)
        .where(eq(sessions.session_id, session_id));
    }

    /**
     * Conditional (compare-and-set) status update used by every lifecycle
     * transition. The current status is re-checked inside the same statement,
     * so a stale pause / resume / LiveKit webhook can never overwrite a
     * completed session and two concurrent transitions cannot both apply.
     * Returns the updated row, or undefined when the status was not one of
     * `allowed_statuses` at write time.
     */
    @DatabaseBoundary("update session status conditionally")
    async update_if_status(
        session_id: string,
        allowed_statuses: Status[],
        update : Partial<SelectSession>,
    ): Promise<SelectSession | undefined>{
        const data = await this.database
        .update(sessions)
        .set(update)
        .where(
            and(
                eq(sessions.session_id, session_id),
                inArray(sessions.status, allowed_statuses),
            )
        )
        .returning();
        return data[0];
    }

    /**
     * Every session the user is part of: the ones they created plus the ones
     * they participate in. Newest first. Only the lean history projection is
     * returned - turns / evaluation / insight payloads stay on the per-session
     * details query.
     */
    @DatabaseBoundary("list sessions by user")
    async list_by_user(user_id: string){
        const participant_session_ids = this.database
            .select({
                session_id: session_participants.session_id,
            })
            .from(session_participants)
            .where(eq(session_participants.user_id, user_id));

        const data = await this.database
            .select({
                session_id: sessions.session_id,
                session_type: sessions.session_type,
                topic_type: sessions.topic_type,
                role_level: sessions.role_level,
                difficulty: sessions.difficulty,
                domain: sessions.domain,
                custom_domain: sessions.custom_domain,
                duration_minutes: sessions.duration_minutes,
                status: sessions.status,
                overall_score: sessions.overall_score,
                total_turns: sessions.total_turns,
                scheduled_at: sessions.scheduled_at,
                started_at: sessions.started_at,
                ended_at: sessions.ended_at,
                actual_duration_sec: sessions.actual_duration_sec,
                created_at: sessions.created_at,
            })
            .from(sessions)
            .where(
                or(
                    eq(sessions.created_by, user_id),
                    inArray(sessions.session_id, participant_session_ids),
                )
            )
            .orderBy(desc(sessions.created_at));
        return data;
    }
}