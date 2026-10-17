import { SessionDocumentSchema } from "@/modules/session-documents/session-documents.schema";
import { z } from "zod";
import { MIME_TO_FILE_TYPE } from "@/react/session-form/sessions.meta";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { session_documents } from "@/modules/session-documents/session-documents.table";

export type NewDocument = InferInsertModel<typeof session_documents>;
export type SelectDocument = InferSelectModel<typeof session_documents>;
export type SessionDocument = z.infer<typeof SessionDocumentSchema>

export type MimeType = keyof typeof MIME_TO_FILE_TYPE;
export type FileType = typeof MIME_TO_FILE_TYPE[MimeType];