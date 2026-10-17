// must come first: gives the app logger a LOG_LEVEL before it is imported
import "@/test/setup-env";

import test from "node:test";
import assert from "node:assert/strict";

import { FastAPIAIClient } from "@/ai/fastapi-ai-client";
import { GenerateSessionBriefRequest } from "@/ai/dto/generate-session-brief.request";
import { ExternalServiceError } from "@/exceptions/ExternalServiceError";

/**
 * The BFF talks to the AI service through the shared IAIClient. These tests
 * pin down the wire contract: the full brief request in the body, the
 * shared-secret in the header (never in the body), and safe failure mapping.
 */

const request: GenerateSessionBriefRequest = {
    topic_type: "technical",
    role_level: "senior",
    difficulty: "hard",
    domain: "swe",
    custom_domain: "platform engineering",
    ai_strictness: "strict",
    custom_instructions: "focus on distributed systems",
    document_text: "--- design.pdf ---\nKafka partitions.",
};

const stub_fetch = (response: Response) => {
    const calls: { url: string; init: RequestInit }[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return response;
    }) as typeof fetch;

    return {
        calls,
        restore: () => {
            globalThis.fetch = original;
        },
    };
};

test("generate_session_brief posts the request with the shared-secret header", async () => {
    const { calls, restore } = stub_fetch(
        new Response(
            JSON.stringify({ sessionBrief: "brief", tokenCount: 7 }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );

    try {
        const client = new FastAPIAIClient(
            "https://ai.example.test",
            "top-secret",
        );
        const result = await client.generate_session_brief(request);

        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, "https://ai.example.test/session-brief");
        assert.equal(calls[0].init.method, "POST");

        const headers = calls[0].init.headers as Record<string, string>;
        assert.equal(headers["Content-Type"], "application/json");
        assert.equal(headers["X-AI-Service-Secret"], "top-secret");

        assert.deepEqual(JSON.parse(calls[0].init.body as string), request);
        assert.deepEqual(result, { sessionBrief: "brief", tokenCount: 7 });
    } finally {
        restore();
    }
});

test("generate_session_brief never puts the secret in the request body", async () => {
    const { calls, restore } = stub_fetch(
        new Response(
            JSON.stringify({ sessionBrief: "brief", tokenCount: 7 }),
            { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );

    try {
        const client = new FastAPIAIClient(
            "https://ai.example.test",
            "top-secret",
        );
        await client.generate_session_brief(request);

        assert.equal((calls[0].init.body as string).includes("top-secret"), false);
    } finally {
        restore();
    }
});

test("generate_session_brief maps a non-OK AI service response to an external service error", async () => {
    const { restore } = stub_fetch(new Response("nope", { status: 502 }));

    try {
        const client = new FastAPIAIClient(
            "https://ai.example.test",
            "top-secret",
        );

        await assert.rejects(
            () => client.generate_session_brief(request),
            (error: unknown) =>
                error instanceof ExternalServiceError &&
                error.status_code === 503,
        );
    } finally {
        restore();
    }
});

test("generate_session_brief rejects a response that does not match the response schema", async () => {
    const { restore } = stub_fetch(
        new Response(JSON.stringify({ unexpected: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        }),
    );

    try {
        const client = new FastAPIAIClient(
            "https://ai.example.test",
            "top-secret",
        );

        await assert.rejects(() => client.generate_session_brief(request));
    } finally {
        restore();
    }
});
