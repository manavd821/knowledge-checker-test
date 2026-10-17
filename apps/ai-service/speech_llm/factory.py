from functools import lru_cache

from execution_profile.enums import ExecutionProfile
from speech_llm.enums import SpeechTasks
from speech_llm.models import (
    STTConfig,
    TTSConfig,
    STTModel,
    STTModelProvider,
    TTSModel,
    TTSModelProvider,
)
from speech_llm.resolver import SpeechResolver
from speech_llm.stt.factory import STTFactory
from speech_llm.stt.provider_registry import STTProviderRegistry
from speech_llm.tts.factory import TTSFactory
from speech_llm.tts.provider_registry import TTSProviderRegistry

@lru_cache
def get_speech_resolver() -> SpeechResolver:
    resolver = SpeechResolver()

    # ---------------------------------------------------------
    # LIVE STT
    # ---------------------------------------------------------

    resolver.register_stt(
        SpeechTasks.LIVE_STT,
        ExecutionProfile.LOW_LATENCY,
        STTConfig(
            stt_model_provider=STTModelProvider.DEEPGRAM,
            stt_model=STTModel.DEEPGRAM_FLUX_GENERAL_EN,
        ),
    )

    resolver.register_stt(
        SpeechTasks.LIVE_STT,
        ExecutionProfile.HIGH_QUALITY,
        STTConfig(
            stt_model_provider=STTModelProvider.DEEPGRAM,
            stt_model=STTModel.DEEPGRAM_FLUX_GENERAL_EN,
        ),
    )

    resolver.register_stt(
        SpeechTasks.LIVE_STT,
        ExecutionProfile.LOW_COST,
        STTConfig(
            stt_model_provider=STTModelProvider.DEEPGRAM,
            stt_model=STTModel.DEEPGRAM_FLUX_GENERAL_EN,
        ),
    )

    resolver.register_stt(
        SpeechTasks.LIVE_STT,
        ExecutionProfile.BALANCED,
        STTConfig(
            stt_model_provider=STTModelProvider.DEEPGRAM,
            stt_model=STTModel.DEEPGRAM_FLUX_GENERAL_EN,
        ),
    )

    # ---------------------------------------------------------
    # POSTPROCESS STT
    # ---------------------------------------------------------

    resolver.register_stt(
        SpeechTasks.POSTPROCESS_STT,
        ExecutionProfile.LOW_LATENCY,
        STTConfig(
            stt_model_provider=STTModelProvider.DEEPGRAM,
            stt_model=STTModel.DEEPGRAM_NOVA_3,
        ),
    )

    resolver.register_stt(
        SpeechTasks.POSTPROCESS_STT,
        ExecutionProfile.HIGH_QUALITY,
        STTConfig(
            stt_model_provider=STTModelProvider.ASSEMBLY_AI,
            stt_model=STTModel.ASSEMBLY_AI_UNIVERSAL_3_PRO,
        ),
    )

    resolver.register_stt(
        SpeechTasks.POSTPROCESS_STT,
        ExecutionProfile.LOW_COST,
        STTConfig(
            stt_model_provider=STTModelProvider.DEEPGRAM,
            stt_model=STTModel.DEEPGRAM_NOVA_3,
        ),
    )

    resolver.register_stt(
        SpeechTasks.POSTPROCESS_STT,
        ExecutionProfile.BALANCED,
        STTConfig(
            stt_model_provider=STTModelProvider.DEEPGRAM,
            stt_model=STTModel.DEEPGRAM_NOVA_3,
        ),
    )

    # ---------------------------------------------------------
    # LIVE TTS
    # ---------------------------------------------------------

    resolver.register_tts(
        SpeechTasks.LIVE_TTS,
        ExecutionProfile.LOW_LATENCY,
        TTSConfig(
            tts_model_provider=TTSModelProvider.CARTESIA,
            tts_model=TTSModel.CARTESIA_SONIC_3_5,
        ),
    )

    resolver.register_tts(
        SpeechTasks.LIVE_TTS,
        ExecutionProfile.HIGH_QUALITY,
        TTSConfig(
            tts_model_provider=TTSModelProvider.ELEVEN_LABS,
            tts_model=TTSModel.ELEVENLABS_V3,
        ),
    )

    resolver.register_tts(
        SpeechTasks.LIVE_TTS,
        ExecutionProfile.LOW_COST,
        TTSConfig(
            tts_model_provider=TTSModelProvider.CARTESIA,
            tts_model=TTSModel.CARTESIA_SONIC_3,
        ),
    )

    resolver.register_tts(
        SpeechTasks.LIVE_TTS,
        ExecutionProfile.BALANCED,
        TTSConfig(
            tts_model_provider=TTSModelProvider.CARTESIA,
            tts_model=TTSModel.CARTESIA_SONIC_3_5,
        ),
    )

    return resolver


def get_stt_factory() -> STTFactory:
    return STTFactory(
        get_speech_resolver(),
        STTProviderRegistry(),
    )


def get_tts_factory() -> TTSFactory:
    return TTSFactory(
        get_speech_resolver(),
        TTSProviderRegistry(),
    )