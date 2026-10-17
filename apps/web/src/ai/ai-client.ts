import { GenerateSessionBriefRequest } from "@/ai/dto/generate-session-brief.request";
import { GenerateSessionBriefResponse } from "@/ai/dto/generate-session-brief.response";

export interface IAIClient{
    generate_session_brief(data : GenerateSessionBriefRequest) : Promise<GenerateSessionBriefResponse>
}