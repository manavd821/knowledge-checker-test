from langchain_core.prompts import ChatPromptTemplate

from llm.enums import Tasks
from prompts.context_summary.human import CONTEXT_SUMMARY_HUMAN
from prompts.context_summary.system import CONTEXT_SUMMARY_SYSTEM
from prompts.turn_evaluation.human import TURN_EVALUATION_HUMAN
from prompts.turn_evaluation.system import TURN_EVALUATION_SYSTEM
from prompts.question_generator.human import QUESTION_GENERATOR_HUMAN
from prompts.question_generator.system import QUESTION_GENERATOR_SYSTEM
from prompts.hint_generator.human import HINT_GENERATION_HUMAN
from prompts.hint_generator.system import HINT_GENERATION_SYSTEM
from prompts.session_brief.human import SESSION_BRIEF_HUMAN
from prompts.session_brief.system import SESSION_BRIEF_SYSTEM


PROMPT_REGISTRY : dict[Tasks, ChatPromptTemplate] = {
    Tasks.CONTEXT_SUMMARY : ChatPromptTemplate.from_messages([
        CONTEXT_SUMMARY_SYSTEM,
        CONTEXT_SUMMARY_HUMAN,
    ]),
    Tasks.TURN_EVALUATION : ChatPromptTemplate.from_messages([
        TURN_EVALUATION_SYSTEM,
        TURN_EVALUATION_HUMAN,
    ]),
    Tasks.QUESTION_GEN : ChatPromptTemplate.from_messages([
        QUESTION_GENERATOR_SYSTEM,
        QUESTION_GENERATOR_HUMAN,
    ]),
    Tasks.HINT_GEN : ChatPromptTemplate.from_messages([
        HINT_GENERATION_SYSTEM,
        HINT_GENERATION_HUMAN,
    ]),
    Tasks.SESSION_BRIEF : ChatPromptTemplate.from_messages([
        SESSION_BRIEF_SYSTEM,
        SESSION_BRIEF_HUMAN,
    ]),
}

def get_prompt(task : Tasks) -> ChatPromptTemplate:
    prompt = PROMPT_REGISTRY.get(task, None)
    if prompt is None:
        raise ValueError(f"No prompt registered for task: {task}")
    return prompt