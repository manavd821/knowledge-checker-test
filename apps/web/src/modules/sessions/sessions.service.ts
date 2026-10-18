import { SessionRepository } from "@/modules/sessions/sessions.repository";
import { SessionDocumentRepository } from "@/modules/session-documents/session-documents.repository";
import { TurnsRepository } from "@/modules/turns/turns.repository";
import { EvaluationSummariesRepository } from "@/modules/evaluation-summaries/evaluation-summaries.repository";
import { CreateSession, CreateSessionParticipants, CreateSessionRoute, CreateSessionSchema, NewSession, SelectSession, Status } from "@/modules";
import { IAIClient } from "@/ai/ai-client";
import { GenerateSessionBriefRequest } from "@/ai/dto/generate-session-brief.request";
import { GenerateInterviewPlanRequest } from "@/ai/dto/generate-interview-plan.request";
import { DocumentExtractionService } from "@/document/document-extraction.service";
import { IObjectStorage } from "@/storage/object-storage";
import { StoredObject } from "@/storage/types/stored-object";
import { MimeType, NewDocument } from "@/modules/session-documents/session-documents.types";
import { MIME_TO_FILE_TYPE } from "@/react/session-form/sessions.meta";
import get_logger from "@/lib/logging/logger-factory";
import { NotFoundError } from "@/exceptions/NotFoundError";
import { ForbiddenError } from "@/exceptions/ForbiddenError";
import { ConflictError } from "@/exceptions/ConflictError";
import { SessionParticipantsService } from "@/modules/session-participants/session-participants.service";
import { ARRAY_FIELD, MAX_BRIEF_DOCUMENT_CHARS } from "@/shared/enums";
import { ConfigurationError } from "@/exceptions/ConfigurationError";

const logger = get_logger()
export class SessionService{
    constructor(
        private readonly session_repo : SessionRepository,
        private readonly session_doc_repo : SessionDocumentRepository,
        private readonly ai_client: IAIClient,
        private readonly doc_extract_service: DocumentExtractionService,
        private readonly object_store: IObjectStorage,
        private readonly session_participant_service: SessionParticipantsService,
        private readonly turns_repo: TurnsRepository,
        private readonly evaluation_summary_repo: EvaluationSummariesRepository,
    ){}
    parseFormData(formData: FormData) {
        const data : Record<string , FormDataEntryValue | FormDataEntryValue[]> = {};
        for(const key of new Set(formData.keys())){
            const rawvalues = formData.getAll(key);

            const parsedValues = rawvalues.map(val => {
                if(typeof val === "string"){
                    try {
                        return JSON.parse(val); // for participant object
                    } catch {
                        return val; // plain string fallback
                    }
                }
                return val; // file as it is
            })
            if(ARRAY_FIELD.has(key)){
                data[key] = parsedValues;
            }
            else{
                data[key] = parsedValues.length === 1 ? parsedValues[0] : parsedValues;
            }
        }
        ARRAY_FIELD.forEach(arrayKey => {
            if(!(arrayKey in data)) {
                data[arrayKey] = [];
            }
        });
        return data;
    }
    async createSession(
        user_id: string,
        data : CreateSessionRoute,
    ) : Promise<string>{
        const session_data : NewSession = {
            ...CreateSessionSchema.parse({
            ...data,
        }),
        created_by: user_id,
        status: "preparing",
        scheduled_at: data.scheduled_at
            ? new Date(data.scheduled_at)
            : new Date()
        }
        // create session
        const session_id = await this.session_repo.create(session_data);
        logger.info("Session created succefully", {session_id});

        let document_text : string | undefined;

        // add session documents
        if(data.session_documents && data.session_documents.length){
            // store docs in object storage and extract text
            const results = await Promise.all(
                data.session_documents.map(async file => {
                    const [ stored_object, extracted_text ] = await Promise.all([
                        this.object_store.store(file),
                        this.doc_extract_service.extract(file)
                    ]);
                    return { stored_object, extracted_text }
                })
            );
            logger.info("docs are stored in bucket succefully",{session_id});
            const doc_ids = Promise.all(
                results.map(async ({ stored_object,extracted_text }) => {
                    const doc_data : NewDocument = {
                        session_id: session_id,
                        file_name : stored_object.name,
                        file_type : MIME_TO_FILE_TYPE[stored_object.contentType as MimeType],
                        storage_url: stored_object.key,
                        extracted_text: extracted_text,
                    }
                    return await this.session_doc_repo.create(doc_data);
                })
            )
            logger.info("session document are stored succefully",{session_id});

            document_text = this.build_document_text(results);
        }

        // generate and store the session brief once, from the configuration and
        // the already-extracted document text available at creation time
        const session_brief = await this.generate_and_store_session_brief(session_id, {
            topic_type: data.topic_type,
            role_level: data.role_level,
            difficulty: data.difficulty,
            domain: data.domain,
            custom_domain: data.custom_domain ?? undefined,
            ai_strictness: data.ai_strictness,
            custom_instructions: data.custom_instructions,
            document_text: document_text,
        });

        // the plan reuses the brief as coverage context, so it is generated
        // after the brief and stored once on the session row
        await this.generate_and_store_interview_plan(session_id, {
            topic_type: data.topic_type,
            role_level: data.role_level,
            difficulty: data.difficulty,
            domain: data.domain,
            custom_domain: data.custom_domain ?? undefined,
            ai_strictness: data.ai_strictness,
            custom_instructions: data.custom_instructions,
            document_text: document_text,
            session_brief: session_brief,
        });

        // add participants
        const participants : CreateSessionParticipants[] = 
            data.participants.map(p => ({
                session_id,
                user_id: p.user_id,
                role: p.role,
            }));
        const participant_ids = await this.session_participant_service
                .create_multiple_participants(participants);
        logger.info(
            "Session Participants are added",
            {num_of_participants_added: participant_ids.length},
        )
        await this.update_session_status(session_id, "ready");
        return session_id;
    }

    /**
     * Combines the extracted text of every uploaded document into a single
     * payload for brief generation, keeping a clear label per document so the
     * model knows which content came from which file. The combined text is
     * capped by MAX_BRIEF_DOCUMENT_CHARS; when the cap is hit the cut-off is
     * stated explicitly instead of dropping content silently.
     */
    private build_document_text(
        documents: { stored_object: StoredObject; extracted_text: string }[],
    ): string{
        const combined = documents
            .map(({ stored_object, extracted_text }) =>
                `--- ${stored_object.name} ---\n${extracted_text}`
            )
            .join("\n\n");

        if(combined.length <= MAX_BRIEF_DOCUMENT_CHARS){
            return combined;
        }

        return (
            combined.slice(0, MAX_BRIEF_DOCUMENT_CHARS) +
            `\n\n[document text truncated at ${MAX_BRIEF_DOCUMENT_CHARS} characters]`
        );
    }

    /**
     * Generates the AI session brief once, at creation, and stores it on the
     * session row. Returns the generated brief text so the interview plan can
     * reuse it as coverage context.
     *
     * Persistence is best-effort on purpose: the brief is an enhancement, and a
     * failed AI call must never roll back or block an otherwise valid session.
     * Nothing is written when generation fails (no fabricated brief), and the
     * brief is only ever written here, so it cannot be persisted twice.
     */
    private async generate_and_store_session_brief(
        session_id: string,
        data: GenerateSessionBriefRequest,
    ): Promise<string | undefined>{
        try {
            const brief = await this.ai_client.generate_session_brief(data);
            await this.session_repo.update(session_id, {
                session_brief: brief.sessionBrief,
                session_brief_tokens: brief.tokenCount,
            });
            logger.info("Session brief stored", { session_id });
            return brief.sessionBrief;
        } catch (error) {
            logger.error("Failed to generate session brief", {
                session_id,
                error,
            });
            return undefined;
        }
    }

    /**
     * Generates the interview plan once, at creation, and stores it on the
     * session row. The plan is the persistent coverage strategy for the
     * session; progress against it lives in the runtime context instead.
     *
     * Persistence is best-effort on purpose: a failed AI call must never roll
     * back or block an otherwise valid session. Nothing is written when
     * generation fails (no fabricated plan), and the plan is only ever written
     * here, so it cannot be persisted twice.
     */
    private async generate_and_store_interview_plan(
        session_id: string,
        data: GenerateInterviewPlanRequest,
    ): Promise<void>{
        try {
            const plan = await this.ai_client.generate_interview_plan(data);
            await this.session_repo.update(session_id, {
                interview_plan: plan.interviewPlan,
            });
            logger.info("Interview plan stored", { session_id });
        } catch (error) {
            logger.error("Failed to generate interview plan", {
                session_id,
                error,
            });
        }
    }

    async pauseSession(
        session_id: string,
        user_id: string,
    ){
        const {
            session,
            participant,
        } = await this.assert_can_control_session(
            session_id,
            user_id
        );
        
        if (session.status !== "active") {
            throw new ForbiddenError(
                "Session is not active",
                session_id,
            );
        }
        if (!session.active_since) {
            throw new ConfigurationError(
                "Active session does not have active_since",
                {
                    session_id,
                },
            );
        }

        const now = new Date();
        const elapsedSeconds = Math.floor(
            (now.getTime() - session.active_since!.getTime()) / 1000
        );
        // Compare-and-set on `active`: a concurrent completion must win, so a
        // stale pause can never resurrect a completed session.
        const updated = await this.session_repo.update_if_status(
            session_id,
            ["active"],
            {
                status: "pause",
                actual_duration_sec:
                    (session.actual_duration_sec ?? 0) + elapsedSeconds,
                active_since: null,
            },
        );
        if (!updated) {
            throw new ConflictError(
                "Session is not active",
                "session",
                "session status changed while pausing.",
            );
        }
    }
    async resumeSession(
        session_id: string,
        user_id: string,
    ){
        const {
            session,
            participant,
        } = await this.assert_can_control_session(
            session_id,
            user_id
        );

        if (session.status !== "pause") {
            throw new ForbiddenError(
                "Session is not paused",
                session_id,
            );
        }

        const now = new Date();

        // Compare-and-set on `pause`: `completed` is terminal, so a stale
        // resume can neither complete nor reactivate it.
        const updated = await this.session_repo.update_if_status(
            session_id,
            ["pause"],
            {
                status: "active",
                active_since: now,
            },
        );
        if (!updated) {
            throw new ConflictError(
                "Session is not paused",
                "session",
                "session status changed while resuming.",
            );
        }
    }

    /**
     * Terminally completes a session.
     *
     * `active -> completed` and `pause -> completed` are both allowed: for an
     * active session the still-running `active_since` slice is folded into the
     * accumulated `actual_duration_sec` first, so the final recorded duration
     * is never under-counted. The transition is a compare-and-set on
     * `["active", "pause"]`, which makes `completed` terminal: a late pause /
     * resume / LiveKit webhook that read an older status cannot overwrite it,
     * and ending an already-completed session is an idempotent success.
     */
    async endSession(
        session_id: string,
        user_id: string,
    ): Promise<SelectSession>{
        const {
            session,
        } = await this.assert_can_control_session(
            session_id,
            user_id
        );

        // completed is terminal: ending again is an idempotent success that
        // reports the authoritative persisted row, never an error.
        if (session.status === "completed") {
            return session;
        }

        if (session.status !== "active" && session.status !== "pause") {
            throw new ConflictError(
                `Cannot end a session with status '${session.status}'`,
                "session",
                `session status must be active or pause to be completed.`,
            );
        }

        const now = new Date();

        // only an active session holds unaccounted time in `active_since`
        let actual_duration_sec = session.actual_duration_sec ?? 0;
        if (session.status === "active" && session.active_since) {
            const elapsedSeconds = Math.floor(
                (now.getTime() - session.active_since.getTime()) / 1000
            );
            actual_duration_sec = actual_duration_sec + elapsedSeconds;
        }

        const updated = await this.session_repo.update_if_status(
            session_id,
            ["active", "pause"],
            {
                status: "completed",
                active_since: null,
                ended_at: now,
                actual_duration_sec,
            },
        );

        if (updated) {
            logger.info("Session completed", {
                session_id,
                user_id,
                actual_duration_sec,
            });
            return updated;
        }

        // CAS miss: a concurrent transition won the race. If it completed the
        // session that is exactly the terminal state we wanted, so report it;
        // otherwise surface the conflict instead of silently retrying.
        const latest = await this.session_repo.get_by_session_id(session_id);
        if (latest?.status === "completed") {
            return latest;
        }
        throw new ConflictError(
            `Cannot end a session with status '${latest?.status ?? "unknown"}'`,
            "session",
            `session status changed while completing.`,
        );
    }

    /**
     * Permanently removes a session and everything it owns.
     *
     * Only the creator may delete: participating in someone else's session
     * never grants destructive rights. A live (`active`) session is refused so
     * a running LiveKit agent / participant is never left orphaned - it must be
     * ended first. Dependent rows cascade with the session row (see
     * SessionRepository.delete for the one exception), and the stored documents
     * are purged from the object store using the keys persisted at upload time.
     */
    async deleteSession(
        session_id: string,
        user_id: string,
    ): Promise<SelectSession>{
        const session = await this.session_repo.get_by_session_id(session_id);
        if (!session) {
            throw new NotFoundError("Session not found", session_id, "session");
        }

        if (session.created_by !== user_id) {
            throw new ForbiddenError(
                "Only the session owner can delete this session",
                session_id,
            );
        }

        if (session.status === "active") {
            throw new ConflictError(
                "Cannot delete an active session",
                "session",
                "end the session before deleting it.",
            );
        }

        // Read the stored keys before the cascade removes the document rows:
        // the object store is only ever addressed by keys we actually saved.
        const documents = await this.session_doc_repo.get_by_session_id(session_id);

        const deleted = await this.session_repo.delete(session_id);
        if (!deleted) {
            throw new NotFoundError("Session not found", session_id, "session");
        }

        await Promise.all(
            documents.map((document) =>
                this.object_store.delete(document.storage_url)
            ),
        );

        logger.info("Session deleted", {
            session_id,
            user_id,
            documents: documents.length,
        });

        return deleted;
    }

    async update_session_status(session_id : string, status: Status) : Promise<void>{
        await this.session_repo.update_status(session_id, status);
    }

    async validate_session(session_id: string) : Promise<SelectSession>{
        logger.info("Validating session", {session_id,});
        const dbData = await this.session_repo.get_by_session_id(session_id);
        if(!dbData){
            // throw new Error("SessionNotFound: Session not found");
            throw new NotFoundError("Session not found",session_id, "session");
        }
        
        if(
            dbData.status !== "ready" 
            && dbData.status !== "active"
            && dbData.status !== "pause"
        ){
            // throw new Error(`InvalidSessionStateError: Cannot join a session with status '${dbData.status}'`);
            throw new ConflictError(
                `Cannot join a session with status '${dbData.status}'`, 
                "session",
                `session status can't be ${dbData.status}.`
            )
        }
        logger.info("Session validated successfully", {session_id,});
        return dbData;
    }
    async mark_session_active_and_started_at(
        session_id : string, 
        session_data? : SelectSession
    ) : Promise<boolean>{
        let become_active = false;
        if(!session_data){
            session_data = await this.session_repo.get_by_session_id(session_id);
            if(!session_data) throw new NotFoundError("Session not found",session_id, "session");
            logger.info("Session data fetched from db", {session_id, session_data});
        }
        const now = new Date();
        if(session_data.status != "active"){
            // Compare-and-set so a join can never reactivate a session that
            // reached a terminal state (`completed`) between the validation
            // read and this write.
            const activated = await this.session_repo.update_if_status(
                session_id,
                ["preparing", "ready", "pause"],
                { status: "active" },
            );
            if(!activated){
                throw new ConflictError(
                    `Cannot activate a session with status '${session_data.status}'`,
                    "session",
                    `session status must not be completed to become active.`,
                );
            }
            session_data.status = "active";
            become_active = true;
            logger.info("Session status updated to active", {session_id});
        }
        if(!session_data.started_at){
            const started_at = await this.session_repo.mark_session_started_at(session_id, now);
            session_data.started_at = now;
            logger.info(
                "Session started_at marked successfully",
                {started_at}
            )
        }
        if(!session_data.active_since){
            await this.session_repo.update(session_id, {
                active_since: now,
            })
            session_data.active_since = now;
            logger.info(
                "Session active_since marked successfully",
                {active_since: session_data.active_since}
            );
        }
        return become_active;
    }
    async get_session(session_id: string) : Promise<SelectSession | undefined>{
        const session = await this.session_repo.get_by_session_id(session_id);
        logger.info("Session fetched from db", {session_id, session});
        return session;
    }

    async pause_session_if_active(
        session_id: string,
        now: Date,
    ){
        const session = await this.session_repo.get_by_session_id(session_id);
        // A late participant_left webhook arriving after the session was
        // deleted must be a no-op: there is nothing left to pause.
        if (!session) {
            return;
        }
        if (session.status !== "active") {
            return;
        }
        if (!session.active_since) {
            throw new ConfigurationError(
                "Active session does not have active_since",
                { session_id },
            );
        }
        const elapsedSeconds = Math.floor(
            (now.getTime() -
                session.active_since.getTime()) / 1000,
        );
        // Compare-and-set and deliberately ignore the result: a late
        // participant_left webhook arriving after the session was completed
        // must be a no-op, never flip `completed` back to `pause`.
        await this.session_repo.update_if_status(
            session_id,
            ["active"],
            {
                status: "pause",
                actual_duration_sec:
                    (session.actual_duration_sec ?? 0) +
                    elapsedSeconds,
                active_since: null,
            },
        );
    }

    async assert_can_control_session(
        session_id: string,
        user_id: string,
    ){
        const session =
            await this.session_repo.get_by_session_id(session_id);

        if (!session) {
            throw new NotFoundError(
                "Session not found",
                session_id,
                "session",
            );
        }

        const participant =
            await this.session_participant_service
                .get_participant_by_user_and_session(
                    user_id,
                    session_id,
                );
        
        const allowed = (
            session.session_type === "ai_session"
                ? participant.role === "candidate"
                : participant.role === "interviewer"
        );
        // requester must be interviewer
        if (!allowed) {
            throw new ForbiddenError(
                "User is not allowed to control this session",
                session_id,
            );
        }
        return { session, participant }
    }

    /**
     * Lean history for the dashboard: every session the user created or
     * participates in, newest first. Heavy payloads (turns, evaluations,
     * insights) never travel here.
     */
    async list_sessions_for_user(user_id: string){
        const sessions = await this.session_repo.list_by_user(user_id);
        if (sessions.length === 0) {
            return [];
        }
        // One aggregated read, no N+1: the persisted session-level evaluation
        // (overall score + detailed feedback) is merged onto the lean history
        // projection so the dashboard can show real results, never fabricated
        // ones.
        const summaries = await this.evaluation_summary_repo
            .get_by_session_ids(sessions.map((s) => s.session_id));
        const summary_by_session_id = new Map(
            summaries.map((summary) => [
                summary.session_id,
                summary,
            ]),
        );
        return sessions.map((session) => {
            const summary = summary_by_session_id.get(session.session_id);
            return {
                ...session,
                evaluation_overall_score: summary?.overall_score ?? null,
                evaluation_feedback: summary?.detailed_feedback ?? null,
            };
        });
    }

    /**
     * One session's results: the session itself, its turns in conversation
     * order and the persisted evaluation summary when one exists.
     *
     * Ownership is enforced here against the authenticated user id (never a
     * client-supplied value): the creator always may read it, anyone else
     * must be a participant of the session.
     */
    async get_session_details(
        session_id: string,
        user_id: string,
    ){
        const session =
            await this.session_repo.get_by_session_id(session_id);
        if (!session) {
            throw new NotFoundError(
                "Session not found",
                session_id,
                "session",
            );
        }

        if (session.created_by !== user_id) {
            await this.session_participant_service
                .get_participant_by_user_and_session(
                    user_id,
                    session_id,
                );
        }

        const [ turns, evaluation_summary ] = await Promise.all([
            this.turns_repo.get_by_session_id(session_id),
            this.evaluation_summary_repo.get_by_session_id(session_id),
        ]);

        return {
            session,
            turns,
            evaluation_summary,
        };
    }
}