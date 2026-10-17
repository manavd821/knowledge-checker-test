import { FastAPIAIClient } from "@/ai/fastapi-ai-client";
import { env } from "@/config/env";

export function get_ai_client(){
    return new FastAPIAIClient(
        env.AI_SERVICE_BASE_URL,
        env.AI_SERVICE_SHARED_SECRET,
    );
}
