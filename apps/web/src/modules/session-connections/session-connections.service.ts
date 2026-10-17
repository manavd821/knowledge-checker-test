import { ForbiddenError } from "@/exceptions/ForbiddenError";
import { NotFoundError } from "@/exceptions/NotFoundError";
import { SessionConnectionsRepository } from "@/modules/session-connections/session-connections.repository";
import { CreateSessionConnection, SelectSessionConnection } from "@/modules/session-connections/session-connections.types";

export class SessionConnectionsService{
    constructor(
        private readonly session_connection_repo: SessionConnectionsRepository
    ){}
    
    async create_session_connection(
        data: CreateSessionConnection,
    ) : Promise<string>{
        return await this.session_connection_repo.create(data)
    }

    /**
     * Non-throwing lookup used by the LiveKit webhook: a connection that is
     * already gone (its session was deleted, cascading the connection away)
     * must be a no-op, never an error.
     */
    async find_connection(
        connection_id: string,
    ) : Promise<SelectSessionConnection | undefined>{
        return await this.session_connection_repo.get(connection_id);
    }

    async validate_connection(
        connection_id: string,
    ) : Promise<SelectSessionConnection>{
        const data = await this.session_connection_repo.get(connection_id);
        if(!data){
            throw new NotFoundError(
                "Session Connection not found",
                connection_id,
                "session_connections",
            )
        }
        if(data.left_at){ // left_at is not null
            throw new ForbiddenError(
                "Invalid Session Connection: User has already left the session",
                connection_id,
                {
                    cause: `left_at should be null, but got ${data.left_at}`,
                }
            )
        }
        return data;
    }

    async mark_connection_left(
        connection_id: string,
        duration_sec: number,
        left_at: Date,
    ){

        await this.session_connection_repo
                .update(connection_id, {
                    left_at ,
                    duration_sec,
                });
    }

    async has_active_connections(
        session_id: string,
    ): Promise<boolean> {
        const connection =
            await this.session_connection_repo
                .get_active_connection_by_session_id(session_id);

        return connection.length > 0;
    }
}