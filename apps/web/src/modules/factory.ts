import { UserRepository } from "@/modules/users/users.repository";
import { SessionRepository } from "@/modules/sessions/sessions.repository";
import type { DB } from "@/db/types";
import { SessionService } from "@/modules/sessions/sessions.service";
import { SessionDocumentRepository } from "@/modules/session-documents/session-documents.repository";
import { TurnsRepository } from "@/modules/turns/turns.repository";
import { EvaluationSummariesRepository } from "@/modules/evaluation-summaries/evaluation-summaries.repository";
import { get_ai_client } from "@/ai/factory";
import { get_document_extraction_service } from "@/document/factory";
import { get_object_storage } from "@/storage/factory";
import { UserService } from "@/modules/users/users.service";
import { SessionParticipantsRepository } from "@/modules/session-participants/session-participants.repository";
import { SessionParticipantsService } from "@/modules/session-participants/session-participants.service";
import { SessionConnectionsRepository } from "@/modules/session-connections/session-connections.repository";
import { SessionConnectionsService } from "@/modules/session-connections/session-connections.service";

export function createRepositories(db : DB){
    return {
        users : new UserRepository(db),
        sessions : new SessionRepository(db),
        session_docs : new SessionDocumentRepository(db),
        session_participants : new SessionParticipantsRepository(db),
        session_connections: new SessionConnectionsRepository(db),
        turns: new TurnsRepository(db),
        evaluation_summaries: new EvaluationSummariesRepository(db),
    }
}
export function createServices(db : DB){
    const { 
        users, 
        sessions,
        session_docs,
        session_participants,
        session_connections,
        turns,
        evaluation_summaries,
    } = createRepositories(db);

    const ai_client = get_ai_client();
    const doc_extract_service = get_document_extraction_service();
    const object_storage = get_object_storage("appwrite");
    const session_participants_service = new SessionParticipantsService(
        session_participants,
    );
    const session_connections_service = new SessionConnectionsService(
        session_connections,
    );
    return {
        users : new UserService(
            users
        ),
        sessions: new SessionService(
            sessions,
            session_docs,
            ai_client,
            doc_extract_service,
            object_storage,
            session_participants_service,
            turns,
            evaluation_summaries,
        ),
        session_participants : session_participants_service,
        session_connections : session_connections_service,
    }
}