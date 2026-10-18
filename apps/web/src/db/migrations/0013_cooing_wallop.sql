ALTER TABLE "sessions" ADD COLUMN "interview_plan" jsonb;--> statement-breakpoint
ALTER TABLE "session_runtime_context" ADD COLUMN "interview_runtime_context" jsonb;