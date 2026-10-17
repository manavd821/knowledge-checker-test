from speech_llm.models import STTConfig
from speech_llm.stt.provider.stt_provider import ISTTProvider
from livekit.plugins import deepgram
from speech_llm.enums import STTModel
class DeepgramProvider(ISTTProvider):

    def create(self, config: STTConfig):
        model = config.stt_model.value
        if model == STTModel.DEEPGRAM_FLUX_GENERAL_EN.value:
            return deepgram.STTv2(
                model=model,
            )
            
        return deepgram.STT(
            model=config.stt_model.value,
            language="en-US",
        )