import { IAIClient } from "@/ai/ai-client";
import { ExternalServiceError } from "@/exceptions/ExternalServiceError";
import { GenerateSessionBriefRequest } from "@/ai/dto/generate-session-brief.request";
import {
    GenerateSessionBriefResponse,
    GenerateSessionBriefResponseSchema,
} from "@/ai/dto/generate-session-brief.response";


export class FastAPIAIClient implements IAIClient{
    constructor(
        private readonly base_url: string,
        private readonly service_secret: string,
    ){}

    async generate_session_brief(
        data : GenerateSessionBriefRequest,
    ): Promise<GenerateSessionBriefResponse> {
        let res: Response;
        try {
            res = await fetch(`${this.base_url}/session-brief`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-AI-Service-Secret": this.service_secret,
                },
                body: JSON.stringify(data),
            });
        } catch (error) {
            throw new ExternalServiceError(
                "AI service is unreachable",
                "ai-service",
                "generate_session_brief",
                error,
            );
        }

        if (!res.ok) {
            throw new ExternalServiceError(
                "AI service failed to generate the session brief",
                "ai-service",
                "generate_session_brief",
                { status: res.status },
            );
        }

        const json = await res.json();
        return GenerateSessionBriefResponseSchema.parse(json);
    }
}
