from pydantic import BaseModel, ConfigDict
from execution_profile.enums import ExecutionProfile
from fastapi_app.bootstrap.app_factory import create_app
from llm.factory import get_llm_gateway
from models.enums import AI_STRICTNESS, Difficulty
from models.enums import (
    TopicType,
    Difficulty,
    AI_STRICTNESS,
)
from services.evaluation_service import EvaluationService
from services.question_service import QuestionService

app = create_app()

@app.get('/')
async def home():
    return "hello"

@app.get('/health')
async def health():
    return {"status": "ok"}
class Evaluation(BaseModel):
    model_config = ConfigDict(
        use_enum_values=True,
    )
    
    topic_type : TopicType
    difficulty : Difficulty
    ai_strictness : AI_STRICTNESS
    question : str
    answer : str
    active_context : str


class Question(BaseModel):
    topic_type : TopicType | None
    domain : str | None
    current_difficulty : Difficulty | None
    ai_strictness : AI_STRICTNESS | None
    fundamental_phase : bool
    session_brief : str | None
    custom_instructions : str | None
    overall_score : float | None
    previous_score : float | None
    active_context : str
    
@app.post('/test2')
async def test_question_generator(
    question : Question,
    ):
    llm_gateway = get_llm_gateway(ExecutionProfile.BALANCED)
    question_service = QuestionService(llm_gateway)
    res = await question_service.generate_question(**question.model_dump())
    print(type(res))
    print(res)
    return res