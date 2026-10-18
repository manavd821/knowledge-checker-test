from langchain_core.prompts import HumanMessagePromptTemplate

QUESTION_GENERATOR_HUMAN = HumanMessagePromptTemplate.from_template(
    """
Interview Configuration

Interview Type:
{topic_type}

Domain:
{domain}

Difficulty:
{current_difficulty}

AI Strictness:
{ai_strictness}

Fundamental Phase:
{fundamental_phase}

Session Brief:
{session_brief}

Custom Instructions:
{custom_instructions}

Interview Plan:
{interview_plan}

Interview Progress:
{interview_runtime_context}

Scores

Current Overall Score:
{overall_score}

Previous Answer Score:
{previous_score}

Conversation Context:
{active_context}

Generate the next interview question.
"""
)