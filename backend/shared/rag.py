"""
RAG Module for StudyMate
========================
Adapted from agentic_rag's DocumentSearchTool (ai-engineering-hub).

Provides document ingestion → chunking → embedding → search pipeline.
Uses Groq for generation and a simple in-memory vector store (no external DB needed).

Usage:
    rag = RAGEngine()
    rag.ingest_text("topic content here...", source="react_docs")
    results = rag.search("What is useState?", top_k=5)
    answer = await rag.query("Explain React hooks", context_from_search=results)
"""

import logging
import math
import os
import re
from typing import Any, Dict, List, Optional, Tuple

import httpx

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


# ─────────────── Simple Vector Store (no external DB) ───────────────

def _cosine_similarity(a: List[float], b: List[float]) -> float:
    """Compute cosine similarity between two vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class SimpleVectorStore:
    """In-memory vector store using cosine similarity (like Qdrant in-memory mode)."""

    def __init__(self):
        self.documents: List[str] = []
        self.embeddings: List[List[float]] = []
        self.metadata: List[Dict[str, Any]] = []

    def add(self, documents: List[str], embeddings: List[List[float]], metadata: List[Dict] = None):
        self.documents.extend(documents)
        self.embeddings.extend(embeddings)
        self.metadata.extend(metadata or [{}] * len(documents))

    def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        if not self.embeddings:
            return []

        scored = []
        for i, emb in enumerate(self.embeddings):
            score = _cosine_similarity(query_embedding, emb)
            scored.append((score, i))

        scored.sort(reverse=True)
        results = []
        for score, idx in scored[:top_k]:
            results.append({
                "document": self.documents[idx],
                "score": round(score, 4),
                "metadata": self.metadata[idx],
            })
        return results

    @property
    def size(self) -> int:
        return len(self.documents)


# ─────────────── Chunking (adapted from SemanticChunker) ───────────────

def chunk_text(text: str, chunk_size: int = 512, overlap: int = 64) -> List[str]:
    """
    Split text into overlapping chunks by sentences.
    Simpler than SemanticChunker but works without extra dependencies.
    """
    # Split by sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if not sentences:
        return [text] if text.strip() else []

    chunks = []
    current_chunk: List[str] = []
    current_len = 0

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        words = len(sentence.split())

        if current_len + words > chunk_size and current_chunk:
            chunks.append(" ".join(current_chunk))
            # Keep overlap
            overlap_words = 0
            overlap_start = len(current_chunk)
            for j in range(len(current_chunk) - 1, -1, -1):
                overlap_words += len(current_chunk[j].split())
                if overlap_words >= overlap:
                    overlap_start = j
                    break
            current_chunk = current_chunk[overlap_start:]
            current_len = sum(len(s.split()) for s in current_chunk)

        current_chunk.append(sentence)
        current_len += words

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks


# ─────────────── Embedding via Groq (using LLM as proxy) ───────────────

async def _get_embeddings_via_groq(texts: List[str]) -> List[List[float]]:
    """
    Generate lightweight hash-based embeddings.
    For production, swap with a real embedding model (e.g. sentence-transformers).
    This uses a deterministic hash to create pseudo-embeddings that enable similarity search.
    """
    import hashlib
    embeddings = []
    dim = 128
    for text in texts:
        # Create a deterministic pseudo-embedding from text n-grams
        words = text.lower().split()
        vec = [0.0] * dim
        for i, word in enumerate(words):
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            for d in range(dim):
                vec[d] += ((h >> d) & 1) * 2 - 1  # Map to -1/+1
        # Normalize
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        vec = [v / norm for v in vec]
        embeddings.append(vec)
    return embeddings


# ─────────────── RAG Engine ───────────────

class RAGEngine:
    """
    Document → Chunk → Embed → Search → Generate pipeline.
    Adapted from agentic_rag's DocumentSearchTool + fastest-rag-milvus-groq.
    """

    def __init__(self):
        self.store = SimpleVectorStore()

    async def ingest_text(self, text: str, source: str = "unknown", chunk_size: int = 512) -> int:
        """Ingest raw text: chunk → embed → store. Returns number of chunks added."""
        chunks = chunk_text(text, chunk_size=chunk_size)
        if not chunks:
            return 0

        embeddings = await _get_embeddings_via_groq(chunks)
        metadata = [{"source": source, "chunk_index": i} for i in range(len(chunks))]
        self.store.add(chunks, embeddings, metadata)
        logger.info(f"Ingested {len(chunks)} chunks from '{source}'")
        return len(chunks)

    async def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant chunks by query."""
        query_emb = await _get_embeddings_via_groq([query])
        return self.store.search(query_emb[0], top_k=top_k)

    async def query(self, question: str, top_k: int = 5, system_context: str = "") -> str:
        """Full RAG: search for context → generate answer with LLM."""
        results = await self.search(question, top_k=top_k)
        context_text = "\n---\n".join(r["document"] for r in results)

        system = (
            "You are a knowledgeable assistant. Answer the question using the provided context. "
            "If the context doesn't contain enough information, say so and provide what you can.\n\n"
            f"{system_context}\n\n"
            f"=== RETRIEVED CONTEXT ===\n{context_text}\n=== END CONTEXT ==="
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": question},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 1024,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    @property
    def document_count(self) -> int:
        return self.store.size


# Global RAG engine instance (shared across requests)
_global_rag: Optional[RAGEngine] = None


def get_rag_engine() -> RAGEngine:
    """Get or create the global RAG engine."""
    global _global_rag
    if _global_rag is None:
        _global_rag = RAGEngine()
    return _global_rag
