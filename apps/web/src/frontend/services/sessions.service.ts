import { ConnectionService } from "@/connection/connection-service";
import { LiveSessionInfo, SessionDetails, SessionSummary } from "@/modules";
import { SessionCacheService } from "@/frontend/cache/session-cache.service";
import { ConfigurationError } from "@/exceptions/ConfigurationError";
import { ConnectionState } from "@/interview-session/interview-session-types";
import { CreateConnection } from "@/shared/dto/sessions/create-connection.dto";
import { GetSearchUsers } from "@/shared/dto/users/search-user.dto";
import { ARRAY_FIELD } from "@/shared/enums";
import { SessionForm } from "@/react/session-form/session-form.types";
import { PauseSession } from "@/shared/dto/sessions/pause-session.dto";
import { ResumeSession } from "@/shared/dto/sessions/resume-session.dto";
import { EndSession } from "@/shared/dto/sessions/end-session.dto";

export class SessionService{
    constructor(
        private readonly session_cache : SessionCacheService,
        private readonly connection_service : ConnectionService,  
    ){}

    async get_live_session_info(session_id: string) : Promise<LiveSessionInfo | null>{
        let data = this.session_cache.get_live_session_info(session_id);
        
        if(!data){
            // cache miss
            const res = await this.connection_service.get_session(session_id);
            if(!res.success){
                console.error({res});
                switch(res.code){
                    // case "ALREADY_EXISTS":
                        // 
                }
                return null;
            }
            data = res.data; 
            this.set_live_session_info(session_id, data);
        }
        return data;
    }
    set_live_session_info(session_id: string, data: LiveSessionInfo){
        this.session_cache.set_live_session_info(session_id, data);
    }
    /**
     * Re-reads the session from the backend and replaces the cache entry.
     * Used after a lifecycle mutation (pause / resume) so the client timer keeps
     * following the authoritative `actual_duration_sec` / `active_since` values
     * instead of guessing them locally.
     */
    async refresh_live_session_info(session_id: string): Promise<LiveSessionInfo>{
        const res = await this.connection_service.get_session(session_id);
        if(!res.success){
            throw new Error(res.message, {
                cause: {
                    ...res,
                },
            });
        }
        this.set_live_session_info(session_id, res.data);
        return res.data;
    }
    async create_session(data: SessionForm) : Promise<string>{
        // convert into form data
        const formData = new FormData();
        // console.log(Object.entries(data));

        Object.entries(data).forEach(([key, val]) => {
            if(ARRAY_FIELD.has(key)){
                const arrayValues = Array.isArray(val) ? val : [];
                arrayValues.forEach(item => {
                    if(item === undefined || item === null) return;

                    if(item instanceof File){
                        formData.append(key, item);
                    } else if(typeof item === "object"){
                        // for participant object
                        formData.append(key, JSON.stringify(item));
                    } else {
                        formData.append(key, String(item));
                    }
                })
            } else if(key === "scheduled_at"){
                if(val instanceof Date){
                    formData.append("scheduled_at", val.toISOString());
                }
            } else if(val !== undefined && val !== null){
                formData.append(key, String(val));
            }
        });
        // create session in db
        const res = await this.connection_service.create_session(formData);
        if(!res.success){
            console.error({res});
            switch(res.code){
                //
            }
            throw new ConfigurationError(
                "Failed to create session in db",
                {res}
            )
        }
        // no cache needed as you need fields like started_at which is updated only when user joins session.
        // so no need to cache session data at creation. During live session, fetch session with all the updated fields 
        // cache the data
        const { 
            session_id ,
            status,
        } = res.data;
        return session_id;
    }

    async pause_session(session_id: string): Promise<PauseSession> {
        const res = await this.connection_service.pause_session(session_id);
        if(!res.success){
            throw new Error(res.message, {
                cause: {
                    ...res,
                },
            });
        }
        return res.data;
    }
    async resume_session(session_id: string): Promise<ResumeSession>{
        const res = await this.connection_service.resume_session(session_id);

        if (!res.success) {
            throw new Error(res.message, {
                cause: {
                    ...res,
                },
            });
        }

        return res.data;
    }
    async end_session(session_id: string): Promise<EndSession> {
        const res = await this.connection_service.end_session(session_id);
        if(!res.success){
            throw new Error(res.message, {
                cause: {
                    ...res,
                },
            });
        }
        return res.data;
    }
    async list_sessions(): Promise<SessionSummary[]>{
        const res = await this.connection_service.list_sessions();

        if (!res.success) {
            throw new Error(res.message, {
                cause: {
                    ...res,
                },
            });
        }

        return res.data;
    }
    async get_session_details(
        session_id: string,
    ): Promise<SessionDetails>{
        const res = await this.connection_service
            .get_session_details(session_id);

        if (!res.success) {
            throw new Error(res.message, {
                cause: {
                    ...res,
                },
            });
        }

        return res.data;
    }
    async get_connection_info(session_id: string) : Promise<CreateConnection>{
        // no caching of connection info
        const res = await this.connection_service.create_connection(session_id);
        if(!res.success){
            switch(res.code){
                // case ""
            }
            throw new Error(res.message, {cause : {
                ...res
            }});
        }
        return res.data;
    }

    async get_connection_state(session_id: string): Promise<ConnectionState>{
        let connection_state = this.session_cache.get_connection_state(session_id);
        if(!connection_state){
            console.log("cache miss: get_connection_state");
            const res = await this.get_connection_info(session_id);
            connection_state = {
                session_id,
                participant_id: res.participant_id,
                connection_id: res.connection_id,
                token: res.token,
                ws_url: res.ws_url,
                room_name: session_id
            }
            this.session_cache.set_connection_state(session_id, connection_state);
        }
        return connection_state;
    }
    set_connection_state(session_id: string, data: ConnectionState){
        this.session_cache.set_connection_state(session_id, data);
    }
    
    async leave_session(connection_id: string){
        // navigator.sendBeacon(
        //     `/api/v1/session-connections/${connection_id}/leave`
        // );
        await this.connection_service.leave_session(connection_id);
    }

    async search_user(text: string): Promise<GetSearchUsers>{
        const res = await this.connection_service.search_user(text);
        if(!res.success){
            switch(res.code){
                //
            }
            throw new Error(
                res.message,
                {cause : {...res}}
            )
        }
        return res.data;
    }
    update_live_session_cache(
        session_id : string,
        update: Partial<LiveSessionInfo>
    ){
        let live_session_info = this.session_cache.get_live_session_info(session_id);
        if(live_session_info){
            this.set_live_session_info(session_id, {
                ...live_session_info,
                ...update,
            });
        }
    }
}