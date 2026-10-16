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
import { IObjectStorage } from "@/storage/object-storage";
import { SelectSession, Status } from "@/modules";

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
