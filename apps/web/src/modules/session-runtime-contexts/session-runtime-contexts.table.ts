import {
    pgTable,
    uuid,
    integer, 
    text,
    timestamp,
    boolean,
    real,
    jsonb,
} from "drizzle-orm/pg-core";
import { sessions } from "@/modules/sessions/sessions.table";
import type { InterviewRuntimeContext } from "@/modules/session-runtime-contexts/session-runtime-contexts.types";

export const sessionRuntimeContext = pgTable(
    "session_runtime_context",
    {
        session_runtime_context_id: uuid().primaryKey().defaultRandom(),

        session_id: uuid()
            .notNull()
            .unique()
            .references(() => sessions.session_id),

        turn_number: integer()
            .notNull(),

        questions_asked: integer()
            .notNull(),

        fundamental_phase: boolean()
            .notNull(),

        current_difficulty: text()
            .notNull(),
        current_question: text(),

        previous_score: real(),

        overall_score: real(),

        active_context: text()
            .notNull(),

        context_tokens: integer()
            .notNull(),

        interview_runtime_context: jsonb()
            .$type<InterviewRuntimeContext>(),

        version: integer()
            .notNull(),

        created_at: timestamp( {
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),

        updated_at: timestamp({
            withTimezone: true,
        })
            .defaultNow()
            .notNull(),
    },
);