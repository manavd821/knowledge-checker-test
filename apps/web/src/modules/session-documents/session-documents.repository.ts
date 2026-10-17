import { DB } from "@/db/types";
import { session_documents } from "@/modules/session-documents/session-documents.table";
import { type NewDocument, type SelectDocument } from "@/modules/session-documents/session-documents.types";
import { DatabaseBoundary } from "@/modules/database-boundary";
import { eq } from "drizzle-orm";


export class SessionDocumentRepository{
    constructor(private readonly database : DB){}

    @DatabaseBoundary("create session document")
    async create(data : NewDocument) : Promise<string>{
        const [ dbData ] = await this.database
        .insert(session_documents)
        .values(data)
        .returning()
        ;
        return dbData.session_document_id;
    }

    @DatabaseBoundary("get session documents by session")
    async get_by_session_id(session_id: string) : Promise<SelectDocument[]>{
        return await this.database
            .select()
            .from(session_documents)
            .where(eq(session_documents.session_id, session_id));
    }
}