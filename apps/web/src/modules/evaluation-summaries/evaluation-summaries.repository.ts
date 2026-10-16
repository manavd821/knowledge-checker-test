import { DB } from "@/db/types";
import { evaluation_summaries } from "@/modules/evaluation-summaries/evaluation-summaries.table";
import { eq, inArray } from "drizzle-orm";
import { DatabaseBoundary } from "@/modules/database-boundary";

export class EvaluationSummariesRepository{
    constructor(private readonly database : DB){}

    /**
     * The persisted session-level evaluation summary (overall score and AI
     * insight) for one session. At most one summary exists per session.
     */
    @DatabaseBoundary("get evaluation summary by session id")
    async get_by_session_id(session_id : string){
        const [ data ] = await this.database
            .select()
            .from(evaluation_summaries)
            .where(eq(evaluation_summaries.session_id, session_id));
        return data;
    }

    /**
     * Same projection for many sessions at once, so the dashboard history can
     * show the persisted overall score / feedback without an N+1 query.
     */
    @DatabaseBoundary("get evaluation summaries by session ids")
    async get_by_session_ids(session_ids : string[]){
        if(session_ids.length === 0){
            return [];
        }
        return await this.database
            .select()
            .from(evaluation_summaries)
            .where(inArray(evaluation_summaries.session_id, session_ids));
    }
}