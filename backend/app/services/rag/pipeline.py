"""RAG pipeline using LangChain.

Architecture:
  PDF/Text → LangChain Loader → Text Splitter → HuggingFace Embeddings
  → ChromaDB Vector Store → LangChain Retrieval Chain → Claude LLM
"""

import tempfile
from pathlib import Path

from langchain_anthropic import ChatAnthropic
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
CHROMA_DIR = str(Path(__file__).resolve().parent.parent.parent.parent / "chroma_db")
COLLECTION_NAME = "datalink_documents"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

SYSTEM_PROMPT = """Tu es DATA LINK Assistant, un expert en données statistiques du Sénégal.

Tu assistes les utilisateurs dans la compréhension et l'analyse des données statistiques
de l'ANSD (Agence Nationale de la Statistique et de la Démographie).

Règles importantes:
1. Réponds UNIQUEMENT à partir des données et du contexte fournis. N'invente JAMAIS de chiffres.
2. Si l'information demandée n'est pas dans les données, dis-le clairement.
3. Cite toujours les sources des données que tu utilises.
4. Utilise un langage simple et accessible à tous.
5. Pour les comparaisons, présente les données de manière claire.
6. Si tu détectes une tendance ou un pattern, mentionne-le.
7. Réponds en français.
"""

# ---------------------------------------------------------------------------
# Lazy singletons
# ---------------------------------------------------------------------------
_embeddings: HuggingFaceEmbeddings | None = None
_vectorstore: Chroma | None = None


def _get_embeddings() -> HuggingFaceEmbeddings:
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    return _embeddings


def _get_vectorstore() -> Chroma:
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=_get_embeddings(),
            persist_directory=CHROMA_DIR,
        )
    return _vectorstore


def _get_splitter() -> RecursiveCharacterTextSplitter:
    return RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )


def _get_llm(temperature: float = 0.3) -> ChatAnthropic:
    api_key = getattr(settings, "ANTHROPIC_API_KEY", "")
    if not api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY must be set in .env file. "
            "Get your key at https://console.anthropic.com/"
        )
    return ChatAnthropic(
        model="claude-sonnet-4-20250514",
        temperature=temperature,
        max_tokens=2048,
        anthropic_api_key=api_key,
    )


# ---------------------------------------------------------------------------
# Ingestion
# ---------------------------------------------------------------------------
def _add_documents(texts: list[str], metadatas: list[dict]) -> int:
    docs = [
        Document(page_content=t, metadata=m)
        for t, m in zip(texts, metadatas)
    ]
    vs = _get_vectorstore()
    vs.add_documents(docs)
    return len(docs)


def ingest_pdf(file_path: str | Path, source_name: str = "") -> dict:
    loader = PyPDFLoader(str(file_path))
    docs = loader.load()

    if not docs:
        return {"error": "No text extracted from PDF", "chunks_ingested": 0}

    source = source_name or str(file_path)
    for doc in docs:
        doc.metadata["source"] = source

    splitter = _get_splitter()
    chunks = splitter.split_documents(docs)

    texts = [c.page_content for c in chunks]
    metadatas = [{**c.metadata, "chunk_index": i} for i, c in enumerate(chunks)]

    count = _add_documents(texts, metadatas)

    total_chars = sum(len(t) for t in texts)
    return {
        "source": source,
        "chunks_ingested": count,
        "total_text_length": total_chars,
    }


def ingest_pdf_bytes(pdf_bytes: bytes, filename: str, source_name: str = "") -> dict:
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(pdf_bytes)
        tmp_path = tmp.name

    try:
        return ingest_pdf(tmp_path, source_name or filename)
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def ingest_text(text: str, source_name: str = "manual_input") -> dict:
    if not text.strip():
        return {"error": "Empty text", "chunks_ingested": 0}

    doc = Document(page_content=text, metadata={"source": source_name})

    splitter = _get_splitter()
    chunks = splitter.split_documents([doc])

    texts = [c.page_content for c in chunks]
    metadatas = [{**c.metadata, "chunk_index": i} for i, c in enumerate(chunks)]

    count = _add_documents(texts, metadatas)

    return {
        "source": source_name,
        "chunks_ingested": count,
        "total_text_length": len(text),
    }


# ---------------------------------------------------------------------------
# Retrieval + Generation
# ---------------------------------------------------------------------------
def ask_question(
    query: str,
    n_context_chunks: int = 5,
    conversation_history: list[dict] | None = None,
) -> dict:
    vs = _get_vectorstore()
    doc_count = vs._collection.count()

    if doc_count == 0:
        return {
            "answer": (
                "Je n'ai pas encore de données indexées pour répondre à cette question. "
                "Veuillez d'abord ingérer des documents PDF ou du texte via l'endpoint /ingest."
            ),
            "sources": [],
            "chunks_used": 0,
        }

    retriever = vs.as_retriever(search_kwargs={"k": n_context_chunks})
    docs = retriever.invoke(query)

    if not docs:
        return {
            "answer": "Aucun document pertinent trouvé pour cette question.",
            "sources": [],
            "chunks_used": 0,
        }

    context_parts = []
    for i, doc in enumerate(docs, 1):
        src = doc.metadata.get("source", "Source inconnue")
        context_parts.append(f"[Document {i}] (Source: {src})\n{doc.page_content}")
    context_text = "\n\n---\n\n".join(context_parts)

    history_text = ""
    if conversation_history:
        recent = conversation_history[-6:]
        history_text = "\n".join(
            f"{'Utilisateur' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
            for m in recent
        )
        history_text = f"\n\nHistorique de conversation:\n{history_text}"

    user_message = (
        f"Voici les données pertinentes:\n\n{context_text}"
        f"{history_text}\n\n---\n\nQuestion: {query}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "{input}"),
    ])

    llm = _get_llm()
    chain = prompt | llm
    response = chain.invoke({"input": user_message})

    sources = list(set(
        doc.metadata.get("source", "Unknown") for doc in docs
    ))

    return {
        "answer": response.content,
        "sources": sources,
        "chunks_used": len(docs),
    }


def ask_question_streaming(
    query: str,
    n_context_chunks: int = 5,
    conversation_history: list[dict] | None = None,
):
    vs = _get_vectorstore()
    doc_count = vs._collection.count()

    if doc_count == 0:
        yield (
            "Je n'ai pas encore de données indexées pour répondre à cette question. "
            "Veuillez d'abord ingérer des documents PDF ou du texte via l'endpoint /ingest."
        )
        return

    retriever = vs.as_retriever(search_kwargs={"k": n_context_chunks})
    docs = retriever.invoke(query)

    if not docs:
        yield "Aucun document pertinent trouvé pour cette question."
        return

    context_parts = []
    for i, doc in enumerate(docs, 1):
        src = doc.metadata.get("source", "Source inconnue")
        context_parts.append(f"[Document {i}] (Source: {src})\n{doc.page_content}")
    context_text = "\n\n---\n\n".join(context_parts)

    history_text = ""
    if conversation_history:
        recent = conversation_history[-6:]
        history_text = "\n".join(
            f"{'Utilisateur' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
            for m in recent
        )
        history_text = f"\n\nHistorique de conversation:\n{history_text}"

    user_message = (
        f"Voici les données pertinentes:\n\n{context_text}"
        f"{history_text}\n\n---\n\nQuestion: {query}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "{input}"),
    ])

    llm = _get_llm(temperature=0.3)
    chain = prompt | llm

    for chunk in chain.stream({"input": user_message}):
        if chunk.content:
            yield chunk.content


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------
def get_stats() -> dict:
    vs = _get_vectorstore()
    return {
        "total_documents": vs._collection.count(),
        "collection_name": COLLECTION_NAME,
    }


def clear_store() -> bool:
    global _vectorstore
    if _vectorstore is not None:
        client = _vectorstore._client
        client.delete_collection(COLLECTION_NAME)
        _vectorstore = None
    return True
