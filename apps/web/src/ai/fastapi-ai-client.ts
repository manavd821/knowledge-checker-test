import { IAIClient } from "@/ai/ai-client";
import { ExternalServiceError } from "@/exceptions/ExternalServiceError";
import { GenerateSessionBriefRequest } from "@/ai/dto/generate-session-brief.request";
import {
    GenerateSessionBriefResponse,
    GenerateSessionBriefResponseSchema,
} from "@/ai/dto/generate-session-brief.response";
import { GenerateInterviewPlanRequest } from "@/ai/dto/generate-interview-plan.request";
import {
    GenerateInterviewPlanResponse,
    GenerateInterviewPlanResponseSchema,
} from "@/ai/dto/generate-interview-plan.response";


export class FastAPIAIClient implements IAIClient{
    constructor(
        private readonly base_url: string,
        private readonly service_secret: string,
    ){}

    private async post(
        path: string,
        operation: string,
        data: unknown,
    ): Promise<Response> {
        try {
            return await fetch(`${this.base_url}${path}`, {
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
                operation,
                error,
            );
        }
    }

    async generate_session_brief(
        data : GenerateSessionBriefRequest,
    ): Promise<GenerateSessionBriefResponse> {
        const res = await this.post(
            "/session-brief",
            "generate_session_brief",
            data,
        );

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

    async generate_interview_plan(
        data : GenerateInterviewPlanRequest,
    ): Promise<GenerateInterviewPlanResponse> {
        const res = await this.post(
            "/interview-plan",
            "generate_interview_plan",
            data,
        );

        if (!res.ok) {
            throw new ExternalServiceError(
                "AI service failed to generate the interview plan",
                "ai-service",
                "generate_interview_plan",
                { status: res.status },
            );
        }

        const json = await res.json();
        return GenerateInterviewPlanResponseSchema.parse(json);
    }
}
