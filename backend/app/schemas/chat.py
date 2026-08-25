"""Pydantic schemas for the chat API."""

from pydantic import BaseModel


class ChatMessage(BaseModel):
    """A single chat message."""
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request schema for chat endpoint."""
    query: str
    conversation_history: list[ChatMessage] | None = None


class ChatResponse(BaseModel):
    """Response schema for chat endpoint."""
    answer: str
    sources: list[str]
    chunks_used: int


class IngestRequest(BaseModel):
    """Request schema for text ingestion."""
    text: str
    source_name: str = "manual_input"


class IngestResponse(BaseModel):
    """Response schema for ingestion."""
    source: str
    chunks_ingested: int
    total_text_length: int
    error: str | None = None


class RAGStatsResponse(BaseModel):
    """RAG system statistics."""
    total_documents: int
    collection_name: str
