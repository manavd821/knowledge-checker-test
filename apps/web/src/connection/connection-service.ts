import { LiveSessionInfo, LiveSessionInfoSchema } from "@/modules";
import { CreateConnectionResponse, CreateConnectionResponseSchema } from "@/shared/dto/sessions/create-connection.dto";
import { CreateSessionResponse, CreateSessionResponseSchema } from "@/shared/dto/sessions/create-session.dto";
import { GetSessionResponse, GetSessionResponseSchema } from "@/shared/dto/sessions/get-session.dto";
import { PauseSessionResponse, PauseSessionResponseSchema } from "@/shared/dto/sessions/pause-session.dto";
import { ResumeSessionResponse, ResumeSessionResponseSchema } from "@/shared/dto/sessions/resume-session.dto";
import { ListSessionsResponse, ListSessionsResponseSchema } from "@/shared/dto/sessions/list-sessions.dto";
import { GetSessionDetailsResponse, GetSessionDetailsResponseSchema } from "@/shared/dto/sessions/session-details.dto";
import { GetUserResponse, GetUserResponseSchema } from "@/shared/dto/users/get-user.dto";
import { GetSearchUsersResponse, GetSearchUsersResponseSchema } from "@/shared/dto/users/search-user.dto";

export class ConnectionService{
    async create_connection(session_id: string) : Promise<CreateConnectionResponse> {
        const res = await fetch(
            `/api/v1/sessions/${session_id}/token`,
            {
                method: "POST",
            }
        );
        const data = await res.json();
        const z_res = CreateConnectionResponseSchema.parse(data);
        return z_res;
    }
    async pause_session(
        session_id: string
    ): Promise<PauseSessionResponse> {
        const res = await fetch(
            `/api/v1/sessions/${session_id}/pause`,
            {
                method: "POST",
            }
        );

        const data = await res.json();
        const z_res = PauseSessionResponseSchema.parse(data);
        return z_res;
    }
    async resume_session(
        session_id: string
    ): Promise<ResumeSessionResponse> {
        const res = await fetch(
            `/api/v1/sessions/${session_id}/resume`,
            {
                method: "POST",
            }
        );

        const data = await res.json();
        const z_res = ResumeSessionResponseSchema.parse(data);
        return z_res;
    }

    async get_session(session_id: string) : Promise<GetSessionResponse>{
        const res = await fetch(`/api/v1/sessions/${session_id}`);
        const data = await res.json();
        const z_res = GetSessionResponseSchema.parse(data);
        return z_res;
    }
    async list_sessions() : Promise<ListSessionsResponse>{
        const res = await fetch(`/api/v1/sessions`);
        const data = await res.json();
        const z_res = ListSessionsResponseSchema.parse(data);
        return z_res;
    }
    async get_session_details(
        session_id: string,
    ) : Promise<GetSessionDetailsResponse>{
        const res = await fetch(`/api/v1/sessions/${session_id}/details`);
        const data = await res.json();
        const z_res = GetSessionDetailsResponseSchema.parse(data);
        return z_res;
    }
    async create_session(formData: FormData) : Promise<CreateSessionResponse>{
        const res = await fetch("/api/v1/sessions", {
            method: "POST",
            body: formData,
        });
        const data = await res.json();
        const z_res = CreateSessionResponseSchema.parse(data);
        return z_res;
    }
    async get_user(user_id: string) : Promise<GetUserResponse>{
        const res = await fetch(`/api/v1/users/${user_id}`);
        const data = await res.json();
        const z_res = GetUserResponseSchema.parse(data);
        return z_res;
    }
    async leave_session(connection_id: string) : Promise<void>{
        await fetch(
            `/api/v1/session-connections/${connection_id}/leave`,
            {
                method: "POST",
                keepalive: true,
            }
        );
    }
    async search_user(text: string): Promise<GetSearchUsersResponse> {
        const res = await fetch(`/api/v1/users?search=${text}`);
        const data = await res.json();
        const z_res =  GetSearchUsersResponseSchema.parse(data);
        return z_res;
    }
}