from pydantic import BaseModel, ConfigDict, Field
from fastapi import Depends
from execution_profile.enums import ExecutionProfile
from fastapi_app.bootstrap.app_factory import create_app
from fastapi_app.dependencies import verify_service_secret
from llm.factory import get_llm_gateway
from models.enums import AI_STRICTNESS, Difficulty
from models.enums import (
    Domain,
    TopicType,
    RoleLevel,
    Difficulty,
    AI_STRICTNESS,
)
from models.interview_plan import InterviewPlan
from services.evaluation_service import EvaluationService
from services.interview_plan_service import InterviewPlanService
from services.question_service import QuestionService
from services.session_brief_service import (
    MAX_DOCUMENT_TEXT_CHARS,
    SessionBriefService,
)
from services.token_service import TokenService

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


class SessionBriefRequest(BaseModel):
    model_config = ConfigDict(
        use_enum_values=True,
    )

    topic_type : TopicType
    role_level : RoleLevel
    difficulty : Difficulty
    domain : Domain
    custom_domain : str | None = Field(default=None, max_length=50)
    ai_strictness : AI_STRICTNESS
    custom_instructions : str | None = Field(default=None, max_length=300)
    document_text : str | None = Field(
        default=None,
        max_length=MAX_DOCUMENT_TEXT_CHARS,
    )


class SessionBriefResponse(BaseModel):
    sessionBrief : str
    tokenCount : int


@app.post('/session-brief', response_model=SessionBriefResponse)
async def generate_session_brief(
    payload : SessionBriefRequest,
    _ : None = Depends(verify_service_secret),
) -> SessionBriefResponse:
    llm_gateway = get_llm_gateway(ExecutionProfile.BALANCED)
    brief_service = SessionBriefService(llm_gateway)
    brief = await brief_service.generate_brief(**payload.model_dump())
    token_count = TokenService().estimate_tokens(brief)
    return SessionBriefResponse(
        sessionBrief=brief,
        tokenCount=token_count,
    )


class InterviewPlanRequest(BaseModel):
    model_config = ConfigDict(
        use_enum_values=True,
    )

    topic_type : TopicType
    role_level : RoleLevel
    difficulty : Difficulty
    domain : Domain
    custom_domain : str | None = Field(default=None, max_length=50)
    ai_strictness : AI_STRICTNESS
    custom_instructions : str | None = Field(default=None, max_length=300)
    document_text : str | None = Field(
        default=None,
        max_length=MAX_DOCUMENT_TEXT_CHARS,
    )
    session_brief : str | None = Field(default=None)


class InterviewPlanResponse(BaseModel):
    interviewPlan : InterviewPlan
    tokenCount : int


@app.post('/interview-plan', response_model=InterviewPlanResponse)
async def generate_interview_plan(
    payload : InterviewPlanRequest,
    _ : None = Depends(verify_service_secret),
) -> InterviewPlanResponse:
    llm_gateway = get_llm_gateway(ExecutionProfile.BALANCED)
    plan_service = InterviewPlanService(llm_gateway)
    plan = await plan_service.generate_plan(**payload.model_dump())
    token_count = TokenService().estimate_tokens(plan.model_dump_json())
    return InterviewPlanResponse(
        interviewPlan=plan,
        tokenCount=token_count,
    )