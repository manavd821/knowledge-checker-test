import { DB } from "@/db/types";
import { turns } from "@/modules/turns/turns.table";
import { asc, eq } from "drizzle-orm";
import { DatabaseBoundary } from "@/modules/database-boundary";

export class TurnsRepository{
    constructor(private readonly database : DB){}

    /**
     * All turns of a session in conversation order. `turn_number` is the
     * sequence field written by the AI pipeline; `created_at` breaks ties for
     * turns that share a number across speakers.
     */
    @DatabaseBoundary("get turns by session id")
    async get_by_session_id(session_id : string){
        const data = await this.database
            .select()
            .from(turns)
            .where(eq(turns.session_id, session_id))
            .orderBy(
                asc(turns.turn_number),
                asc(turns.created_at),
            );
        return data;
    }
}