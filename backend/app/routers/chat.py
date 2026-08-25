"""Chat API endpoints for the RAG-powered assistant."""

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse

from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    IngestRequest,
    IngestResponse,
    RAGStatsResponse,
)
from app.services.rag.pipeline import (
    ask_question,
    ask_question_streaming,
    get_stats,
    ingest_pdf_bytes,
    ingest_text,
)

router = APIRouter(prefix="/chat", tags=["Assistant IA (RAG)"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Ask a question to the AI assistant.

    The assistant uses RAG (Retrieval-Augmented Generation) to answer
    based on ingested documents from ANSD and other statistical sources.
    """
    history = None
    if request.conversation_history:
        history = [{"role": m.role, "content": m.content} for m in request.conversation_history]

    result = ask_question(
        query=request.query,
        conversation_history=history,
    )

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        chunks_used=result["chunks_used"],
    )


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    """Stream a response from the AI assistant.

    Returns a Server-Sent Events (SSE) stream for real-time responses.
    """
    history = None
    if request.conversation_history:
        history = [{"role": m.role, "content": m.content} for m in request.conversation_history]

    def event_generator():
        for chunk in ask_question_streaming(
            query=request.query,
            conversation_history=history,
        ):
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/ingest", response_model=IngestResponse)
async def ingest_text_endpoint(request: IngestRequest):
    """Ingest raw text into the vector store for RAG.

    Use this to add text content that will be searchable by the assistant.
    """
    result = ingest_text(request.text, request.source_name)

    if "error" in result and result["error"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return IngestResponse(**result)


@router.post("/ingest/pdf", response_model=IngestResponse)
async def ingest_pdf_endpoint(
    file: UploadFile = File(...),
    source_name: str = "",
):
    """Ingest a PDF document into the vector store.

    Upload a PDF file (ANSD reports, statistical publications, etc.)
    to make its content searchable by the AI assistant.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(status_code=400, detail="File too large (max 50MB)")

    result = ingest_pdf_bytes(
        pdf_bytes=content,
        filename=file.filename,
        source_name=source_name or file.filename,
    )

    if "error" in result and result["error"]:
        raise HTTPException(status_code=400, detail=result["error"])

    return IngestResponse(**result)


@router.get("/stats", response_model=RAGStatsResponse)
async def rag_stats():
    """Get statistics about the RAG knowledge base."""
    stats = get_stats()
    return RAGStatsResponse(**stats)
