from typing import Literal

from pydantic import BaseModel

from execution_profile.enums import ExecutionProfile
from speech_llm.enums import (
    STTModelProvider,
    STTModel,
    TTSModelProvider,
    TTSModel,
)

class STTConfig(BaseModel):
    stt_model_provider: STTModelProvider
    stt_model: STTModel
    language: Literal["en"] = "en"
    
class TTSConfig(BaseModel):
    tts_model_provider: TTSModelProvider
    tts_model: TTSModel
    language: Literal["en"] = "en"