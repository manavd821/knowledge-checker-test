import { GenerateSessionBriefRequest } from "@/ai/dto/generate-session-brief.request";
import { GenerateSessionBriefResponse } from "@/ai/dto/generate-session-brief.response";
import { GenerateInterviewPlanRequest } from "@/ai/dto/generate-interview-plan.request";
import { GenerateInterviewPlanResponse } from "@/ai/dto/generate-interview-plan.response";

export interface IAIClient{
    generate_session_brief(data : GenerateSessionBriefRequest) : Promise<GenerateSessionBriefResponse>
    generate_interview_plan(data : GenerateInterviewPlanRequest) : Promise<GenerateInterviewPlanResponse>
}