// must come first: gives the app logger a LOG_LEVEL before it is imported
import "@/test/setup-env";

import test from "node:test";
import assert from "node:assert/strict";

import { SessionService } from "@/modules/sessions/sessions.service";
import { SessionRepository } from "@/modules/sessions/sessions.repository";
import { SessionDocumentRepository } from "@/modules/session-documents/session-documents.repository";
import { TurnsRepository } from "@/modules/turns/turns.repository";
import { EvaluationSummariesRepository } from "@/modules/evaluation-summaries/evaluation-summaries.repository";
import { SessionParticipantsService } from "@/modules/session-participants/session-participants.service";
import { DocumentExtractionService } from "@/document/document-extraction.service";
import { IAIClient } from "@/ai/ai-client";
import { GenerateSessionBriefRequest } from "@/ai/dto/generate-session-brief.request";
import { GenerateSessionBriefResponse } from "@/ai/dto/generate-session-brief.response";
import { GenerateInterviewPlanRequest } from "@/ai/dto/generate-interview-plan.request";
import { GenerateInterviewPlanResponse } from "@/ai/dto/generate-interview-plan.response";
import { IObjectStorage } from "@/storage/object-storage";
import { CreateSessionRoute, SelectDocument, SelectSession, Status } from "@/modules";
import { MAX_BRIEF_DOCUMENT_CHARS } from "@/shared/enums";

/**
 * Focused unit tests for the session lifecycle compare-and-set rules.
 *
 * The database is replaced by an in-memory double that records every
 * conditional update, so the tests pin down exactly *which* statuses a
 * transition may overwrite. That is the whole point of the change: a late
 * pause / resume / LiveKit webhook must never overwrite a `completed` row.
 *
 * Run with: `npx tsx --test src/modules/sessions/sessions.service.test.ts`
 */

const fixed_now = new Date("2026-01-01T00:00:00.000Z");

const base_session = (
    overrides: Partial<SelectSession> = {},
): SelectSession => ({
    session_id: "11111111-1111-1111-1111-111111111111",
    created_by: "user_1",
    status: "active",
    session_type: "ai_session",
    topic_type: "mock_interview",
    role_level: "intermediate",
    difficulty: "medium",
    domain: "swe",
    custom_domain: null,
    duration_minutes: 30,
    ai_strictness: "balanced",
    realtime_transcript: true,
    ai_hints_enabled: false,
    camera_required: false,
    custom_instructions: null,
    session_brief: null,
    session_brief_tokens: null,
    interview_plan: null,
    scheduled_at: fixed_now,
    started_at: fixed_now,
    ended_at: null,
    active_since: fixed_now,
    actual_duration_sec: 0,
    overall_score: null,
    total_turns: 0,
    questions_asked: 0,
    created_at: fixed_now,
    updated_at: fixed_now,
    ...overrides,
});

type CasCall = {
    allowed: Status[];
    update: Partial<SelectSession>;
};

const harness = (options: {
    session: SelectSession;
    latest?: SelectSession;
    cas_result?: SelectSession | undefined;
}) => {
    const cas_calls: CasCall[] = [];
    let get_calls = 0;

    const session_repo = {
        get_by_session_id: async () => {
            get_calls += 1;
            // first read is the pre-check, later reads observe a racing
            // writer's row
            return get_calls === 1
                ? options.session
                : (options.latest ?? options.session);
        },
        update_if_status: async (
            _session_id: string,
            allowed: Status[],
            update: Partial<SelectSession>,
        ) => {
            cas_calls.push({ allowed, update });
            return options.cas_result;
        },
    };

    const participant_service = {
        get_participant_by_user_and_session: async () => ({
            role: "candidate",
        }),
    };

    const service = new SessionService(
        session_repo as unknown as SessionRepository,
        {} as unknown as SessionDocumentRepository,
        {} as unknown as IAIClient,
        {} as unknown as DocumentExtractionService,
        {} as unknown as IObjectStorage,
        participant_service as unknown as SessionParticipantsService,
        {} as unknown as TurnsRepository,
        {} as unknown as EvaluationSummariesRepository,
    );

    return { service, cas_calls };
};

test("endSession completes an active session and folds the running duration", async () => {
    const active_since = new Date(Date.now() - 30_000);
    const session = base_session({
        status: "active",
        active_since,
        actual_duration_sec: 120,
    });
    const completed = base_session({ status: "completed" });
    const { service, cas_calls } = harness({ session, cas_result: completed });

    const result = await service.endSession(
        session.session_id,
        session.created_by,
    );

    assert.equal(result.status, "completed");
    assert.equal(cas_calls.length, 1);
    assert.deepEqual(cas_calls[0].allowed, ["active", "pause"]);
    assert.equal(cas_calls[0].update.status, "completed");
    assert.equal(cas_calls[0].update.active_since, null);
    assert.ok(cas_calls[0].update.ended_at instanceof Date);

    const expected =
        120 + Math.floor((Date.now() - active_since.getTime()) / 1000);
    assert.ok(
        Math.abs(
            (cas_calls[0].update.actual_duration_sec as number) - expected,
        ) <= 1,
    );
});

test("endSession completes a paused session without changing the accumulated duration", async () => {
    const session = base_session({
        status: "pause",
        active_since: null,
        actual_duration_sec: 300,
    });
    const completed = base_session({ status: "completed" });
    const { service, cas_calls } = harness({ session, cas_result: completed });

    const result = await service.endSession(
        session.session_id,
        session.created_by,
    );

    assert.equal(result.status, "completed");
    assert.equal(cas_calls.length, 1);
    assert.equal(cas_calls[0].update.actual_duration_sec, 300);
    assert.equal(cas_calls[0].update.active_since, null);
});

test("endSession is an idempotent no-op on an already completed session", async () => {
    const session = base_session({ status: "completed", ended_at: fixed_now });
    const { service, cas_calls } = harness({ session });

    const result = await service.endSession(
        session.session_id,
        session.created_by,
    );

    assert.equal(result.status, "completed");
    assert.equal(cas_calls.length, 0);
});

test("endSession refuses a session that is only ready", async () => {
    const session = base_session({ status: "ready", active_since: null });
    const { service, cas_calls } = harness({ session });

    await assert.rejects(
        () => service.endSession(session.session_id, session.created_by),
        /Cannot end a session with status 'ready'/,
    );
    assert.equal(cas_calls.length, 0);
});

test("endSession reports the completed row when a racing writer already completed it", async () => {
    const session = base_session({ status: "active" });
    const latest = base_session({ status: "completed" });
    const { service, cas_calls } = harness({
        session,
        latest,
        cas_result: undefined,
    });

    const result = await service.endSession(
        session.session_id,
        session.created_by,
    );

    assert.equal(result.status, "completed");
    assert.equal(cas_calls.length, 1);
});

test("endSession conflicts when the status changed but is not completed", async () => {
    const session = base_session({ status: "active" });
    const latest = base_session({ status: "active" });
    const { service } = harness({ session, latest, cas_result: undefined });

    await assert.rejects(
        () => service.endSession(session.session_id, session.created_by),
        /Cannot end a session with status 'active'/,
    );
});

test("pauseSession only overwrites an active session", async () => {
    const active_since = new Date(Date.now() - 10_000);
    const session = base_session({
        status: "active",
        active_since,
        actual_duration_sec: 60,
    });
    const paused = base_session({ status: "pause" });
    const { service, cas_calls } = harness({ session, cas_result: paused });

    await service.pauseSession(session.session_id, session.created_by);

    assert.equal(cas_calls.length, 1);
    assert.deepEqual(cas_calls[0].allowed, ["active"]);
    assert.equal(cas_calls[0].update.status, "pause");
});

test("pauseSession refuses an already completed session", async () => {
    const session = base_session({ status: "completed" });
    const { service, cas_calls } = harness({ session });

    await assert.rejects(
        () => service.pauseSession(session.session_id, session.created_by),
        /Session is not active/,
    );
    assert.equal(cas_calls.length, 0);
});

test("resumeSession transitions pause -> active with a CAS on pause only", async () => {
    const session = base_session({ status: "pause", active_since: null });
    const resumed = base_session({ status: "active" });
    const { service, cas_calls } = harness({ session, cas_result: resumed });

    await service.resumeSession(session.session_id, session.created_by);

    assert.equal(cas_calls.length, 1);
    assert.deepEqual(cas_calls[0].allowed, ["pause"]);
    assert.equal(cas_calls[0].update.status, "active");
    assert.ok(cas_calls[0].update.active_since instanceof Date);
});

test("resumeSession can never reactivate a completed session", async () => {
    const session = base_session({ status: "completed" });
    const { service, cas_calls } = harness({ session });

    await assert.rejects(
        () => service.resumeSession(session.session_id, session.created_by),
        /Session is not paused/,
    );
    assert.equal(cas_calls.length, 0);
});

test("pause_session_if_active is a no-op on a completed session", async () => {
    const session = base_session({ status: "completed" });
    const { service, cas_calls } = harness({ session });

    await service.pause_session_if_active(session.session_id, new Date());

    assert.equal(cas_calls.length, 0);
});

test("pause_session_if_active is a no-op when the session no longer exists", async () => {
    const { service } = deletion_harness({ session: undefined });

    // resolves without throwing: a late participant_left webhook for a deleted
    // session must never surface a NotFound error.
    await service.pause_session_if_active("deleted", new Date());
});

test("pause_session_if_active pauses an active session with a CAS on active only", async () => {
    const active_since = new Date(Date.now() - 10_000);
    const session = base_session({
        status: "active",
        active_since,
        actual_duration_sec: 60,
    });
    const paused = base_session({ status: "pause" });
    const { service, cas_calls } = harness({ session, cas_result: paused });

    await service.pause_session_if_active(session.session_id, new Date());

    assert.equal(cas_calls.length, 1);
    assert.deepEqual(cas_calls[0].allowed, ["active"]);
    assert.equal(cas_calls[0].update.status, "pause");
});

test("mark_session_active_and_started_at cannot reactivate a completed session", async () => {
    const session = base_session({
        status: "completed",
        active_since: null,
        started_at: null,
    });
    const { service, cas_calls } = harness({
        session,
        cas_result: undefined,
    });

    // pass the stale snapshot directly: simulating the join flow having read
    // the session before it was completed
    const stale = base_session({ status: "pause", active_since: null });
    await assert.rejects(
        () =>
            service.mark_session_active_and_started_at(
                stale.session_id,
                stale,
            ),
        /Cannot activate a session with status 'pause'/,
    );
    assert.equal(cas_calls.length, 1);
    assert.deepEqual(cas_calls[0].allowed, ["preparing", "ready", "pause"]);
});

/**
 * Deletion replaces the whole dependency graph of the service with doubles:
 * the repository, the document lookup and the object store are the only
 * collaborators deleteSession touches.
 */
const deletion_harness = (options: {
    session: SelectSession | undefined;
    documents?: { storage_url: string }[];
}) => {
    const deleted_objects: string[] = [];
    const state = {
        delete_called: 0,
        deleted_session_id: undefined as string | undefined,
    };

    const service = new SessionService(
        {
            get_by_session_id: async () => options.session,
            delete: async (session_id: string) => {
                state.delete_called += 1;
                state.deleted_session_id = session_id;
                return options.session;
            },
        } as unknown as SessionRepository,
        {
            get_by_session_id: async () =>
                (options.documents ?? []) as unknown as SelectDocument[],
        } as unknown as SessionDocumentRepository,
        {} as unknown as IAIClient,
        {} as unknown as DocumentExtractionService,
        {
            delete: async (key: string) => {
                deleted_objects.push(key);
            },
        } as unknown as IObjectStorage,
        {} as unknown as SessionParticipantsService,
        {} as unknown as TurnsRepository,
        {} as unknown as EvaluationSummariesRepository,
    );

    return { service, deleted_objects, state };
};

test("deleteSession removes an owned non-active session and purges its stored documents", async () => {
    const session = base_session({ status: "completed" });
    const { service, deleted_objects, state } = deletion_harness({
        session,
        documents: [
            { storage_url: "bucket/key-1" },
            { storage_url: "bucket/key-2" },
        ],
    });

    const result = await service.deleteSession(
        session.session_id,
        session.created_by,
    );

    assert.equal(result.session_id, session.session_id);
    assert.equal(state.delete_called, 1);
    assert.equal(state.deleted_session_id, session.session_id);
    assert.deepEqual(deleted_objects, ["bucket/key-1", "bucket/key-2"]);
});

test("deleteSession refuses a user who is not the creator", async () => {
    const session = base_session({ status: "completed" });
    const { service, deleted_objects, state } = deletion_harness({ session });

    await assert.rejects(
        () => service.deleteSession(session.session_id, "someone_else"),
        /Only the session owner can delete this session/,
    );
    assert.equal(state.delete_called, 0);
    assert.deepEqual(deleted_objects, []);
});

test("deleteSession refuses an active session", async () => {
    const session = base_session({ status: "active" });
    const { service, state } = deletion_harness({ session });

    await assert.rejects(
        () => service.deleteSession(session.session_id, session.created_by),
        /Cannot delete an active session/,
    );
    assert.equal(state.delete_called, 0);
});

test("deleteSession reports a missing session", async () => {
    const { service, state } = deletion_harness({ session: undefined });

    await assert.rejects(
        () => service.deleteSession("missing", "user_1"),
        /Session not found/,
    );
    assert.equal(state.delete_called, 0);
});

const create_data: CreateSessionRoute = {
    session_type: "ai_session",
    participants: [
        {
            user_id: "user_1",
            email: "candidate@example.com",
            first_name: null,
            last_name: null,
            image_url: null,
            role: "candidate",
        },
    ],
    topic_type: "technical",
    role_level: "intermediate",
    difficulty: "medium",
    domain: "swe",
    custom_domain: null,
    duration_minutes: 30,
    ai_strictness: "balanced",
    realtime_transcript: true,
    ai_hints_enabled: false,
    camera_required: false,
    session_documents: [],
};

const default_plan: GenerateInterviewPlanResponse = {
    interviewPlan: {
        topics: [
            {
                topic: "Core concepts",
                objectives: ["Explain the fundamentals"],
                priority: "high",
                expected_depth: "practical",
            },
        ],
    },
    tokenCount: 7,
};

const create_harness = (options: {
    brief?: GenerateSessionBriefResponse;
    brief_error?: Error;
    plan?: GenerateInterviewPlanResponse;
    plan_error?: Error;
    documents?: { name: string; key: string; extracted_text: string }[];
}) => {
    const updates: {
        session_id: string;
        update: Partial<SelectSession>;
    }[] = [];
    let brief_request: GenerateSessionBriefRequest | undefined;
    let plan_request: GenerateInterviewPlanRequest | undefined;

    const document_for = (file: File) =>
        options.documents?.find((doc) => doc.name === file.name);

    const service = new SessionService(
        {
            create: async () => "session-1",
            update: async (
                session_id: string,
                update: Partial<SelectSession>,
            ) => {
                updates.push({ session_id, update });
            },
            update_status: async () => undefined,
        } as unknown as SessionRepository,
        {
            create: async () => ({}),
        } as unknown as SessionDocumentRepository,
        {
            generate_session_brief: async (data: GenerateSessionBriefRequest) => {
                brief_request = data;
                if (options.brief_error) {
                    throw options.brief_error;
                }
                return options.brief!;
            },
            generate_interview_plan: async (data: GenerateInterviewPlanRequest) => {
                plan_request = data;
                if (options.plan_error) {
                    throw options.plan_error;
                }
                return options.plan ?? default_plan;
            },
        } as unknown as IAIClient,
        {
            extract: async (file: File) =>
                document_for(file)?.extracted_text ?? "",
        } as unknown as DocumentExtractionService,
        {
            store: async (file: File) => ({
                key: document_for(file)?.key ?? "bucket/key",
                name: file.name,
                contentType: "application/pdf",
                size: file.size,
            }),
        } as unknown as IObjectStorage,
        {
            create_multiple_participants: async () => ["participant-1"],
        } as unknown as SessionParticipantsService,
        {} as unknown as TurnsRepository,
        {} as unknown as EvaluationSummariesRepository,
    );

    return {
        service,
        updates,
        get_brief_request: () => brief_request,
        get_plan_request: () => plan_request,
    };
};

test("createSession persists the AI-generated brief exactly once", async () => {
    const { service, updates } = create_harness({
        brief: { sessionBrief: "Focused technical interview.", tokenCount: 42 },
    });

    const session_id = await service.createSession("user_1", create_data);

    assert.equal(session_id, "session-1");
    const brief_updates = updates.filter((u) => "session_brief" in u.update);
    assert.equal(brief_updates.length, 1);
    assert.equal(brief_updates[0].update.session_brief, "Focused technical interview.");
    assert.equal(brief_updates[0].update.session_brief_tokens, 42);
});

test("createSession still succeeds and stores no brief when generation fails", async () => {
    const { service, updates } = create_harness({
        brief_error: new Error("ai service unavailable"),
    });

    const session_id = await service.createSession("user_1", create_data);

    assert.equal(session_id, "session-1");
    assert.equal(updates.some((u) => "session_brief" in u.update), false);
});

test("createSession persists the AI-generated interview plan exactly once", async () => {
    const plan: GenerateInterviewPlanResponse = {
        interviewPlan: {
            topics: [
                {
                    topic: "Distributed systems",
                    objectives: ["Reason about consistency"],
                    priority: "high",
                    expected_depth: "advanced",
                },
            ],
        },
        tokenCount: 31,
    };
    const { service, updates } = create_harness({
        brief: { sessionBrief: "Focused technical interview.", tokenCount: 42 },
        plan,
    });

    await service.createSession("user_1", create_data);

    const plan_updates = updates.filter((u) => "interview_plan" in u.update);
    assert.equal(plan_updates.length, 1);
    assert.deepEqual(plan_updates[0].update.interview_plan, plan.interviewPlan);
});

test("createSession stores no plan and still succeeds when plan generation fails", async () => {
    const { service, updates } = create_harness({
        brief: { sessionBrief: "brief", tokenCount: 1 },
        plan_error: new Error("ai service unavailable"),
    });

    const session_id = await service.createSession("user_1", create_data);

    assert.equal(session_id, "session-1");
    assert.equal(updates.some((u) => "interview_plan" in u.update), false);
});

test("createSession feeds the generated brief to plan generation", async () => {
    const { service, get_plan_request } = create_harness({
        brief: { sessionBrief: "Focused technical interview.", tokenCount: 42 },
    });

    await service.createSession("user_1", create_data);

    const request = get_plan_request()!;
    assert.equal(request.session_brief, "Focused technical interview.");
    assert.equal(request.topic_type, "technical");
    assert.equal(request.role_level, "intermediate");
    assert.equal(request.difficulty, "medium");
    assert.equal(request.domain, "swe");
    assert.equal(request.ai_strictness, "balanced");
});

test("createSession does not feed a brief to plan generation when the brief failed", async () => {
    const { service, get_plan_request } = create_harness({
        brief_error: new Error("ai service unavailable"),
    });

    await service.createSession("user_1", create_data);

    assert.equal(get_plan_request()!.session_brief, undefined);
});

test("createSession sends the whole session configuration to brief generation", async () => {
    const { service, get_brief_request } = create_harness({
        brief: { sessionBrief: "brief", tokenCount: 1 },
    });

    await service.createSession("user_1", create_data);

    assert.deepEqual(get_brief_request(), {
        topic_type: "technical",
        role_level: "intermediate",
        difficulty: "medium",
        domain: "swe",
        custom_domain: undefined,
        ai_strictness: "balanced",
        custom_instructions: undefined,
        document_text: undefined,
    });
});

test("createSession forwards custom_domain and custom_instructions when set", async () => {
    const { service, get_brief_request } = create_harness({
        brief: { sessionBrief: "brief", tokenCount: 1 },
    });

    await service.createSession("user_1", {
        ...create_data,
        domain: "custom",
        custom_domain: "platform engineering",
        custom_instructions: "focus on distributed systems",
    });

    const request = get_brief_request()!;
    assert.equal(request.domain, "custom");
    assert.equal(request.custom_domain, "platform engineering");
    assert.equal(request.custom_instructions, "focus on distributed systems");
});

test("createSession omits document_text when no documents are attached", async () => {
    const { service, get_brief_request } = create_harness({
        brief: { sessionBrief: "brief", tokenCount: 1 },
    });

    await service.createSession("user_1", create_data);

    assert.equal(get_brief_request()!.document_text, undefined);
});

test("createSession passes extracted document text with clear document boundaries", async () => {
    const documents = [
        { name: "design.pdf", key: "bucket/design", extracted_text: "Kafka partitions." },
        { name: "notes.md", key: "bucket/notes", extracted_text: "Consumer groups." },
    ];
    const { service, get_brief_request } = create_harness({
        brief: { sessionBrief: "brief", tokenCount: 1 },
        documents,
    });

    await service.createSession("user_1", {
        ...create_data,
        session_documents: [
            new File(["design"], "design.pdf", { type: "application/pdf" }),
            new File(["notes"], "notes.md", { type: "text/markdown" }),
        ],
    });

    assert.equal(
        get_brief_request()!.document_text,
        "--- design.pdf ---\nKafka partitions.\n\n--- notes.md ---\nConsumer groups.",
    );
});

test("createSession marks truncated document text instead of cutting it silently", async () => {
    const long_text = "x".repeat(MAX_BRIEF_DOCUMENT_CHARS + 500);
    const { service, get_brief_request } = create_harness({
        brief: { sessionBrief: "brief", tokenCount: 1 },
        documents: [{ name: "big.txt", key: "bucket/big", extracted_text: long_text }],
    });

    await service.createSession("user_1", {
        ...create_data,
        session_documents: [
            new File(["big"], "big.txt", { type: "text/plain" }),
        ],
    });

    const document_text = get_brief_request()!.document_text!;
    assert.ok(document_text.length < long_text.length);
    assert.ok(
        document_text.endsWith(
            `[document text truncated at ${MAX_BRIEF_DOCUMENT_CHARS} characters]`,
        ),
    );
});
