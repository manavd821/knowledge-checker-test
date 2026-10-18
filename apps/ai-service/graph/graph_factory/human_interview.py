from typing import Literal
from langgraph.graph import (
    END, 
    START, 
    StateGraph,
)
from execution_profile.enums import ExecutionProfile
from graph.graph_factory.base import IGraphFactory
from models.graph_state import InterviewGraphState
from llm.factory import get_llm_gateway

from graph.nodes.context_summarizer import ContextSummerizerNode
from graph.nodes.difficulty_resolver import DifficultyResolverNode
from graph.nodes.question_generator import QuestionGeneratorNode
from graph.nodes.response_assembler import ResponseAssemblerNode
from graph.nodes.transcript_analyzer import TranscriptAnalyzerNode
from graph.nodes.evaluator import EvalutorNode
from graph.nodes.interview_progress_updater import InterviewProgressUpdaterNode

from services.context_service import ContextService
from services.difficulty_service import DifficultyService
from services.evaluation_service import EvaluationService
from services.interview_progress_service import InterviewProgressService
from langgraph.graph.state import CompiledStateGraph
from services.question_service import QuestionService
from services.token_service import TokenService

class HumanInterviewGraphFactory(IGraphFactory):
        
    def _route_context_summerization(
        self,
        state : InterviewGraphState
    ) -> Literal["context_summarizer_node", "evaluation_node"]:
        return (
            "context_summarizer_node" 
            if state.needs_summarization 
            else "evaluation_node"
        )

    def create(
        self,
        profile: ExecutionProfile,   
    ) -> CompiledStateGraph[InterviewGraphState]:
        llm_gateway = get_llm_gateway(profile)
        
        # services
        evaluation_service = EvaluationService(llm_gateway)
        question_service = QuestionService(llm_gateway)
        token_service = TokenService(llm_gateway)
        context_service = ContextService(llm_gateway)
        difficulty_service = DifficultyService()
        interview_progress_service = InterviewProgressService(llm_gateway)
        
        # nodes
        transcript_node = TranscriptAnalyzerNode(
            token_service,
            context_service,
        )
        context_summarizer_node = ContextSummerizerNode(
            context_service,
            token_service,
        )
        evaluation_node = EvalutorNode(
            evaluation_service,
            token_service,
        )
        interview_progress_updater_node = InterviewProgressUpdaterNode(
            interview_progress_service,
        )
        difficulty_resolver_node = DifficultyResolverNode(difficulty_service)
        question_node = QuestionGeneratorNode(
            question_service,
        )
        response_assembler_node = ResponseAssemblerNode()

        # graph builder
        builder = StateGraph(InterviewGraphState)
        
        # add nodes
        builder.add_node(
            "transcript_node",
            transcript_node
        )
        builder.add_node(
            "context_summarizer_node",
            context_summarizer_node
        )
        builder.add_node(
            "difficulty_resolver_node",
            difficulty_resolver_node
        )
        builder.add_node(
            "question_node",
            question_node
        )
        builder.add_node(
            "evaluation_node",
            evaluation_node
        )
        builder.add_node(
            "interview_progress_updater_node",
            interview_progress_updater_node
        )
        builder.add_node(
            "response_assembler_node",
            response_assembler_node
        )
        
        #  add edges
        builder.add_edge(
            START,
            "transcript_node",  
        )
        builder.add_conditional_edges(
            "transcript_node",
            self._route_context_summerization
        )
        builder.add_edge(
            "context_summarizer_node",
            "evaluation_node",
        )
        builder.add_edge(
            "evaluation_node",
            "interview_progress_updater_node",
        )
        builder.add_edge(
            "interview_progress_updater_node",
            "difficulty_resolver_node",
        )
        builder.add_edge(
            "difficulty_resolver_node",
            "question_node",
        )
        builder.add_edge(
            "question_node",
            "response_assembler_node",
        )
        builder.add_edge(
            "response_assembler_node",
            END,
        )
        
        return builder.compile()