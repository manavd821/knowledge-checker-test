import { DB } from "@/db/types";
import { evaluation_summaries } from "@/modules/evaluation-summaries/evaluation-summaries.table";
import { eq } from "drizzle-orm";
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
}