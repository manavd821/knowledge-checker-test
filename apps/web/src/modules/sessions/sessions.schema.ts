import { z } from "zod";
import { SessionDocumentSchema } from "@/modules/session-documents/session-documents.schema";
import { 
    AI_STRICTNESS,
    CONTENT_TYPE,
    DIFFICULTY,
    DOMAIN,
    ROLE_LEVEL,
    SESSION_DURATIONS,
    SESSION_TYPE,
    SPEAKER,
    STATUS,
    TOPIC_TYPE,
} from "@/db/enums";
import {  SearchUserSchema } from "@/shared/dto/users/search-user.dto";
import { MAX_DOCUMENT_SIZE, MAX_DOCUMENTS, MAX_PARTICIPANTS } from "@/shared/enums";
import { MIME_TO_FILE_TYPE } from "@/react/session-form/sessions.meta";

export const FORMFIELDROLE = [
    "interviewer",
    "candidate",
] as const;
export const FormFieldRoleSchema = z.enum(FORMFIELDROLE)

export const FormParticipantSchema = SearchUserSchema
        .extend({
            role: FormFieldRoleSchema,
        });
export const SessionBaseSchema = z.object({
    session_type : z.enum(SESSION_TYPE, "session type is needed"),
    participants: z.array(FormParticipantSchema) 
        .min(1, `At least one participant is required.`)
        .max(MAX_PARTICIPANTS,`maximum ${MAX_PARTICIPANTS} participant can join`)
        ,
    topic_type :  z.enum(TOPIC_TYPE, "Topic type is needed"),
    role_level : z.enum(ROLE_LEVEL),
    difficulty : z.enum(DIFFICULTY),
    domain : z.enum(DOMAIN),
    custom_domain : z.string().max(50, "maximum 50 character allowed").optional().nullable(),
    duration_minutes : z.coerce.number().refine(
        (v) : v is typeof SESSION_DURATIONS[number] => 
            SESSION_DURATIONS.includes(v as any),
        {
            error: "Invalid session duration",
        }
    ),
    ai_strictness : z.enum(AI_STRICTNESS),
    realtime_transcript : z.union([
        z.boolean(),
        z.stringbool(),
    ]),
    ai_hints_enabled : z.union([
        z.boolean(),
        z.stringbool(),
    ]),
    camera_required : z.union([
        z.boolean(),
        z.stringbool(),
    ]),
    
    custom_instructions : z.string().max(300, "maximum 300 character allowed").optional(),
    session_documents : z.array(SessionDocumentSchema).max(MAX_DOCUMENTS,
        {error: `max ${MAX_DOCUMENTS} documents are allowed`}
    ).default([]),
})
;
export const CreateSessionRouteShema = 
    SessionBaseSchema
    .extend({
        scheduled_at : z.iso.datetime().optional(),
    });

export const CreateSessionSchema =
    CreateSessionRouteShema
    ;
export const SessionFormObject =
    SessionBaseSchema.extend({
        scheduled_at : z.date().optional(),
    });
export const SessionFormSchema = 
    SessionFormObject
    .superRefine((data, ctx) => {
        const {
            participants, 
            session_type,
            domain,
            session_documents,
            custom_domain
        } = data;
        if(session_type === "ai_session" && participants.length !== 1){
            ctx.addIssue({
                code:"custom",
                path: ["participants"],
                message: `AI session must have exactly one participant`,
            });
        }
        if(session_type === "human_session" && participants.length <= 1){
            ctx.addIssue({
                code:"custom",
                path:["participants"],
                message:`Human session must have at least two participants`
            })
        }
        const candidateCount = participants.filter(p => p.role === "candidate").length;
        if(candidateCount !== 1){
            ctx.addIssue({
                code:"custom",
                path: ["participants"],
                message: `There must be exactly one candidate`,
            });
        }
        const ids = new Set(participants.map(p => p.user_id));
        if(ids.size !== participants.length){
            ctx.addIssue({
                code:"custom",
                path: ["participants"],
                message: `Participant already added`,
            });
        }
        if(domain === "custom" && !custom_domain?.trim()){
            ctx.addIssue({
                code:"custom",
                path: ["custom_domain"],
                message: `Custom domain is required`,
            });
        }
        const doc_names = new Set<string>();
        session_documents.forEach((doc, index) => {
            // check duplicate file
            if(doc_names.has(doc.name)){
                ctx.addIssue({
                    code: "custom",
                    path: ["session_documents", index, "name"],
                    message: `File '${doc.name}' is a duplicate`,
                });
            }
            doc_names.add(doc.name);
            // check meme type
            if(!(doc.type in MIME_TO_FILE_TYPE)){
                ctx.addIssue({
                    code: "custom",
                    path: ["session_documents"],
                    message: `Invalid file type '${doc.type}'. Only PDF, DOCX, TXT, and Markdown (.md) files are supported`,
                });
            }
            // size validation
            if(doc.size > MAX_DOCUMENT_SIZE){
                ctx.addIssue({
                    code: "custom",
                    path: ["session_documents"],
                    message: `File '${doc.name}' is too large. Max size is 5MB`,
                });
            }
        });
    })
    ;
    

export const SessionFormStep1Schema = 
    SessionFormObject.pick({
        session_type : true,
        participants: true,
        topic_type :  true,
        domain : true,
        custom_domain: true,
        role_level : true,
        difficulty : true,
    })
    .superRefine((data, ctx) => {
        const { participants, session_type } = data;
        if(participants.length === 0){
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "At least one participant is required.",
            });
        }
        if(participants.length > MAX_PARTICIPANTS){
            ctx.addIssue({
                code:"custom",
                path: ["participants"],
                message: `maximum ${MAX_PARTICIPANTS} participant can join`,
            });
        }
        if(session_type === "ai_session" && participants.length !== 1){
            ctx.addIssue({
                code:"custom",
                path: ["participants"],
                message: `AI sessions must have exactly one participant`,
            });
        }
        const candidateCount = participants.filter(p => p.role === "candidate").length;
        if(candidateCount !== 1){
            ctx.addIssue({
                code:"custom",
                path: ["participants"],
                message: `There must be exactly one candidate`,
            });
        }
        const ids = new Set(participants.map(p => p.user_id));
        if(ids.size !== participants.length){
            ctx.addIssue({
                code:"custom",
                path: ["participants"],
                message: `Participant already added`,
            });
        }
        if(data.domain === "custom" && !data.custom_domain?.trim()){
            ctx.addIssue({
                code:"custom",
                path: ["custom_domain"],
                message: `Custom domain is required`,
            });
        }
    })
    ;

export const SessionFormStep2Schema = 
    SessionFormObject.pick({
        duration_minutes : true,
        ai_strictness : true,
        realtime_transcript : true,
        ai_hints_enabled : true,
        camera_required : true,
        scheduled_at : true,
    })

export const SessionFormStep3Schema = 
    SessionFormObject.pick({
        custom_instructions : true,
        session_documents : true,
    });

export const LiveSessionInfoSchema = 
    SessionFormObject .pick({
        session_type : true,
        topic_type: true,
        role_level : true,
        difficulty : true,
        domain: true,
        custom_domain: true,
        duration_minutes: true,
        ai_strictness : true,
        realtime_transcript: true,
        ai_hints_enabled: true,
        camera_required : true,
    }).extend({
        actual_duration_sec : z.number().nullable(),
        completed_duration_sec: z.number().gte(0).default(0),
        scheduled_at: z.iso.datetime().optional(),
        session_id: z.string(),
        status : z.enum(STATUS),
        active_since: z.iso.datetime().optional().nullable(),
        started_at : z.iso.datetime().optional(),
        ended_at : z.iso.datetime().optional(),
        joined_at: z.iso.datetime().optional(),
    });

/**
 * Lean projection of one session for the dashboard history + the results
 * page. Heavy data (turns, evaluations, insights) never travels in this
 * shape; it belongs to the per-session details query.
 */
export const SessionSummarySchema = z.object({
    session_id: z.uuid(),
    session_type: z.enum(SESSION_TYPE),
    topic_type: z.enum(TOPIC_TYPE),
    role_level: z.enum(ROLE_LEVEL),
    difficulty: z.enum(DIFFICULTY),
    domain: z.enum(DOMAIN),
    custom_domain: z.string().nullable(),
    duration_minutes: z.number(),
    status: z.enum(STATUS),
    overall_score: z.number().nullable(),
    // Persisted session-level evaluation merged from `evaluation_summaries`
    // (never computed in the client). Null until a summary exists.
    evaluation_overall_score: z.number().nullable(),
    evaluation_feedback: z.string().nullable(),
    total_turns: z.number().nullable(),
    scheduled_at: z.iso.datetime(),
    started_at: z.iso.datetime().nullable(),
    ended_at: z.iso.datetime().nullable(),
    actual_duration_sec: z.number().nullable(),
    created_at: z.iso.datetime(),
});

export const SessionTurnSchema = z.object({
    turn_id: z.uuid(),
    turn_number: z.number(),
    speaker: z.enum(SPEAKER),
    content: z.string(),
    content_type: z.enum(CONTENT_TYPE),
    evaluation_score: z.number().nullable(),
    evaluation_feedback: z.string().nullable(),
    // rubric dimensions differ per question type (technical/behavioral/debate/
    // general) and are always 0-10 floats; the AI service stores them as a
    // plain dict, so validate the shape instead of hardcoding one variant.
    evaluation_rubric: z.record(z.string(), z.number()).nullable(),
    difficulty_applied: z.enum(DIFFICULTY).nullable(),
    created_at: z.iso.datetime(),
});

export const EvaluationSummarySchema = z.object({
    evaluation_summary_id: z.uuid(),
    overall_score: z.number(),
    strength_areas: z.array(z.object({
        topic: z.string(),
        score: z.number(),
        evidence: z.string(),
    })).nullable(),
    weak_areas: z.array(z.object({
        topic: z.string(),
        score: z.number(),
        severity: z.enum(["low", "medium", "high"]),
        evidence: z.string(),
    })).nullable(),
    progression_notes: z.string().nullable(),
    detailed_feedback: z.string().nullable(),
    recommendations: z.array(z.object({
        topic: z.string(),
        priority: z.enum(["low", "medium", "high"]),
        reason: z.string(),
        action_items: z.array(z.string()),
    })).nullable(),
    created_at: z.iso.datetime(),
});

export const SessionDetailsSchema = z.object({
    session: SessionSummarySchema,
    turns: z.array(SessionTurnSchema),
    evaluation_summary: EvaluationSummarySchema.nullable(),
});
