import {
    pgTable,
    uuid,
    integer, 
    text,
    boolean,
    timestamp,
    real,
    index,
    jsonb,
} from "drizzle-orm/pg-core";
import { users } from "@/modules/users/users.table";
import {
    statusEnum,
    sessionTypeEnum,
    topicTypeEnum,
    roleLevelEnum,
    difficultyEnum,
    domainEnum,
    aiStrictnessEnum,
} from "@/db/enums";
import type { InterviewPlan } from "@/modules/sessions/interview-plan.schema";

export const sessions = pgTable("sessions",
{
    session_id : uuid()
        .primaryKey()
        .defaultRandom(),
    created_by : text()
        .references(() => users.user_id, {onDelete : 'cascade'})
        .notNull(),
    status : statusEnum().notNull().default("preparing"),

    session_type : sessionTypeEnum().notNull(),
    topic_type : topicTypeEnum().notNull(),
    role_level : roleLevelEnum().notNull(),
    difficulty : difficultyEnum().notNull(),
    domain : domainEnum().notNull(),
    custom_domain : text(),
    duration_minutes : integer().notNull(),
    ai_strictness : aiStrictnessEnum().notNull(),
    realtime_transcript : boolean()
    .notNull()
    .default(true),
    ai_hints_enabled : boolean()
    .notNull()
    .default(false),
    camera_required : boolean()
    .notNull()
    .default(false),
    custom_instructions : text(),

    session_brief : text(),
    session_brief_tokens : integer(),

    interview_plan : jsonb().$type<InterviewPlan>(),

    scheduled_at : timestamp({
        withTimezone : true
    }).notNull(),
    started_at : timestamp({
        withTimezone : true
    }),
    ended_at : timestamp({
        withTimezone : true
    }),
    active_since: timestamp({
        withTimezone: true 
    }),
    actual_duration_sec : integer(),

    overall_score : real(),
    total_turns : integer().default(0),
    questions_asked : integer().default(0),

    created_at : timestamp({
        withTimezone : true
    })
    .defaultNow()
    .notNull(),

    updated_at : timestamp({
        withTimezone : true
    })
    .defaultNow()
    .notNull(),
},
    (table) => [
        index("sessions_user_id_idx")
        .on(table.created_by),
        
        index("session_status_idx")
        .on(table.status),
    ]
);