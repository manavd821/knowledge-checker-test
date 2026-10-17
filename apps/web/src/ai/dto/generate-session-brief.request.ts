import { 
    TopicType, 
    RoleLevel,
    Difficulty,
    Domain,
    CustomDomain,
    AIStrictness,
    CustomInstructions,
} from "@/modules";

export interface GenerateSessionBriefRequest {
    topic_type : TopicType;
    role_level : RoleLevel;
    difficulty: Difficulty;
    domain: Domain;
    custom_domain?: CustomDomain;
    ai_strictness: AIStrictness;
    custom_instructions?: CustomInstructions;
    document_text?: string;
}
