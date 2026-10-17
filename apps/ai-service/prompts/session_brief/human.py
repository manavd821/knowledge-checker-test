from langchain_core.prompts import HumanMessagePromptTemplate

SESSION_BRIEF_HUMAN = HumanMessagePromptTemplate.from_template(
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

Extracted Document Content:
{document_text}

Write the session brief.
"""
)
