from functools import lru_cache

from llm.enums import Tasks
from llm.gateway import LLMGateway
from llm.models import (
    TaskConfig,
    LLMModel,
    LLMModelProvider,
)
from llm.resolver import LLMResolver
from execution_profile.enums import ExecutionProfile

def register_question_generation_config(resolver: LLMResolver):
    resolver.register(
            Tasks.QUESTION_GEN,
            ExecutionProfile.LOW_LATENCY,
            TaskConfig(
                temperature=0.7,
                max_tokens=800,
                llm_provider=LLMModelProvider.GOOGLE_GENAI,
                llm_model=LLMModel.GEMINI_3_1_FLASH_LITE,
            ),
        )
    
    resolver.register(
        Tasks.QUESTION_GEN,
        ExecutionProfile.HIGH_QUALITY,
        TaskConfig(
            temperature=0.7,
            max_tokens=1200,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_2_5_PRO,
        ),
    )

    resolver.register(
        Tasks.QUESTION_GEN,
        ExecutionProfile.LOW_COST,
        TaskConfig(
            temperature=0.7,
            max_tokens=800,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_1_FLASH_LITE,
        ),
    )

    resolver.register(
        Tasks.QUESTION_GEN,
        ExecutionProfile.BALANCED,
        TaskConfig(
            temperature=0.7,
            max_tokens=1000,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_5_FLASH_LITE,
        ),
    )

def register_turn_evaluation_config(resolver: LLMResolver):
    resolver.register(
            Tasks.TURN_EVALUATION,
            ExecutionProfile.LOW_LATENCY,
            TaskConfig(
                temperature=0.1,
                max_tokens=1000,
                llm_provider=LLMModelProvider.GOOGLE_GENAI,
                llm_model=LLMModel.GEMINI_3_1_FLASH_LITE,
            ),
        )
    
    resolver.register(
        Tasks.TURN_EVALUATION,
        ExecutionProfile.HIGH_QUALITY,
        TaskConfig(
            temperature=0.1,
            max_tokens=1500,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_2_5_PRO,
        ),
    )

    resolver.register(
        Tasks.TURN_EVALUATION,
        ExecutionProfile.LOW_COST,
        TaskConfig(
            temperature=0.1,
            max_tokens=900,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_1_FLASH_LITE,
        ),
    )

    resolver.register(
        Tasks.TURN_EVALUATION,
        ExecutionProfile.BALANCED,
        TaskConfig(
            temperature=0.1,
            max_tokens=1200,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_5_FLASH_LITE,
        ),
    )

def register_session_evaluation_config(resolver: LLMResolver):
    resolver.register(
            Tasks.SESSION_EVALUATION,
            ExecutionProfile.LOW_LATENCY,
            TaskConfig(
                temperature=0.1,
                max_tokens=1500,
                llm_provider=LLMModelProvider.GOOGLE_GENAI,
                llm_model=LLMModel.GEMINI_3_1_FLASH_LITE,
            ),
        )
    
    resolver.register(
        Tasks.SESSION_EVALUATION,
        ExecutionProfile.HIGH_QUALITY,
        TaskConfig(
            temperature=0.1,
            max_tokens=2500,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_2_5_PRO,
        ),
    )

    resolver.register(
        Tasks.SESSION_EVALUATION,
        ExecutionProfile.LOW_COST,
        TaskConfig(
            temperature=0.1,
            max_tokens=1500,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_1_FLASH_LITE,
        ),
    )

    resolver.register(
        Tasks.SESSION_EVALUATION,
        ExecutionProfile.BALANCED,
        TaskConfig(
            temperature=0.1,
            max_tokens=2000,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_5_FLASH_LITE,
        ),
    )

def register_hint_generation_config(resolver: LLMResolver):
    resolver.register(
        Tasks.HINT_GEN,
        ExecutionProfile.LOW_LATENCY,
        TaskConfig(
            temperature=0.4,
            max_tokens=300,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_1_FLASH_LITE,
        ),
    )

    resolver.register(
        Tasks.HINT_GEN,
        ExecutionProfile.HIGH_QUALITY,
        TaskConfig(
            temperature=0.4,
            max_tokens=500,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_2_5_PRO,
        ),
    )

    resolver.register(
        Tasks.HINT_GEN,
        ExecutionProfile.LOW_COST,
        TaskConfig(
            temperature=0.4,
            max_tokens=300,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_1_FLASH_LITE,
        ),
    )

    resolver.register(
        Tasks.HINT_GEN,
        ExecutionProfile.BALANCED,
        TaskConfig(
            temperature=0.4,
            max_tokens=400,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_5_FLASH_LITE,
        ),
    )

def register_session_brief_config(resolver: LLMResolver):
    resolver.register(
        Tasks.SESSION_BRIEF,
        ExecutionProfile.LOW_LATENCY,
        TaskConfig(
            temperature=0.6,
            max_tokens=500,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_1_FLASH_LITE,
        ),
    )

    resolver.register(
        Tasks.SESSION_BRIEF,
        ExecutionProfile.HIGH_QUALITY,
        TaskConfig(
            temperature=0.6,
            max_tokens=800,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_2_5_PRO,
        ),
    )

    resolver.register(
        Tasks.SESSION_BRIEF,
        ExecutionProfile.LOW_COST,
        TaskConfig(
            temperature=0.6,
            max_tokens=500,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_1_FLASH_LITE,
        ),
    )

    resolver.register(
        Tasks.SESSION_BRIEF,
        ExecutionProfile.BALANCED,
        TaskConfig(
            temperature=0.6,
            max_tokens=600,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_5_FLASH_LITE,
        ),
    )

def register_context_summary_config(resolver: LLMResolver):
    resolver.register(
        Tasks.CONTEXT_SUMMARY,
        ExecutionProfile.LOW_LATENCY,
        TaskConfig(
            temperature=0.2,
            max_tokens=800,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_1_FLASH_LITE,
        ),
    )

    resolver.register(
        Tasks.CONTEXT_SUMMARY,
        ExecutionProfile.HIGH_QUALITY,
        TaskConfig(
            temperature=0.2,
            max_tokens=1200,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_2_5_PRO,
        ),
    )

    resolver.register(
        Tasks.CONTEXT_SUMMARY,
        ExecutionProfile.LOW_COST,
        TaskConfig(
            temperature=0.2,
            max_tokens=700,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_1_FLASH_LITE,
        ),
    )

    resolver.register(
        Tasks.CONTEXT_SUMMARY,
        ExecutionProfile.BALANCED,
        TaskConfig(
            temperature=0.2,
            max_tokens=1000,
            llm_provider=LLMModelProvider.GOOGLE_GENAI,
            llm_model=LLMModel.GEMINI_3_5_FLASH_LITE,
        ),
    )

@lru_cache
def get_llm_resolver() -> LLMResolver:
    resolver = LLMResolver()

    # ---------------------------------------------------------
    # QUESTION GENERATION
    # ---------------------------------------------------------
    register_question_generation_config(resolver)

    # ---------------------------------------------------------
    # TURN EVALUATION
    # ---------------------------------------------------------
    register_turn_evaluation_config(resolver)
    

    # ---------------------------------------------------------
    # SESSION EVALUATION
    # ---------------------------------------------------------
    register_session_evaluation_config(resolver)
    

    # ---------------------------------------------------------
    # HINT GENERATION
    # ---------------------------------------------------------
    register_hint_generation_config(resolver)

    # ---------------------------------------------------------
    # CONTEXT SUMMARY
    # ---------------------------------------------------------
    register_context_summary_config(resolver)

    # ---------------------------------------------------------
    # SESSION BRIEF
    # ---------------------------------------------------------
    register_session_brief_config(resolver)

    return resolver

def get_llm_gateway(
    profile: ExecutionProfile,    
) -> LLMGateway:
    return LLMGateway(
        get_llm_resolver(),
        profile
    )