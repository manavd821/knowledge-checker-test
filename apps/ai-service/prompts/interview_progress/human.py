from langchain_core.prompts import HumanMessagePromptTemplate

INTERVIEW_PROGRESS_HUMAN = HumanMessagePromptTemplate.from_template(
    """
Interview Configuration

Interview Type:
{topic_type}

Domain:
{domain}

Session Brief:
{session_brief}

Interview Plan:
{interview_plan}

Current Interview Progress:
{runtime_context}

Current Question:
{question}

Candidate Answer:
{answer}

Last Evaluation Score:
{evaluation_score}

Last Evaluation Feedback:
{evaluation_feedback}

Update the interview progress record.
"""
)
