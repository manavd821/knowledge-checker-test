from langchain_core.prompts import HumanMessagePromptTemplate

INTERVIEW_PLAN_HUMAN = HumanMessagePromptTemplate.from_template(
    """
Interview Configuration

Interview Type:
{topic_type}

Role Level:
{role_level}

Difficulty:
{difficulty}

Domain:
{domain}

Custom Domain:
{custom_domain}

AI Strictness:
{ai_strictness}

Custom Instructions:
{custom_instructions}

Session Brief:
{session_brief}

Extracted Document Content:
{document_text}

Design the interview plan.
"""
)
