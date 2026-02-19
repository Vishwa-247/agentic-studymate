#!/usr/bin/env python3
"""
Oboe-Style Course Generation Service
====================================
Fast parallel AI course generation using Gemini, ElevenLabs, and Brave APIs.
Generates complete courses in ~40 seconds with audio, articles, quizzes, and games.
"""

import asyncio
import json
import logging
import os
import re
from collections import deque
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

from dotenv import load_dotenv

# Load environment variables from backend root
backend_root = Path(__file__).parent.parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

import httpx
import uvicorn
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Course Generation Service - Oboe Style", version="2.0.0")

# CORS
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000",
    ).split(",")
    if o.strip()
]
ALLOWED_ORIGIN_REGEX = os.getenv("ALLOWED_ORIGIN_REGEX", r"^https://.*\\.lovable\\.app$")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth (used by API gateway)
security = HTTPBearer(auto_error=False)
JWT_SECRET = os.getenv("JWT_SECRET")  # API gateway token
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")  # Supabase JWT secret (optional)

def verify_request_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Verify caller identity from Bearer token.

    Accepts either:
    - API Gateway HS256 token (JWT_SECRET)
    - Supabase HS256 token (SUPABASE_JWT_SECRET)

    Returns the authenticated user_id.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    token = credentials.credentials

    # 1) Try gateway token
    if JWT_SECRET:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            user_id = payload.get("uid") or payload.get("sub")
            if user_id:
                return str(user_id)
        except JWTError:
            pass

    # 2) Try Supabase token
    if SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_aud": True},
            )
            user_id = payload.get("sub")
            if user_id:
                return str(user_id)
        except JWTError:
            pass

    raise HTTPException(status_code=401, detail="Invalid token")

# ============================================
# API Keys - Dedicated pools per service type
# ============================================

# Chapter Generation (10 keys - 1 per chapter for parallel generation)
CHAPTER_KEYS = [os.getenv(f"GEMINI_CHAPTER_KEY_{i}") for i in range(1, 11)]
CHAPTER_KEYS = [k for k in CHAPTER_KEYS if k]

# Quiz Generation (1 key dedicated)
QUIZ_KEYS = [os.getenv("GEMINI_QUIZ_KEY")]
QUIZ_KEYS = [k for k in QUIZ_KEYS if k]

# Flashcard Generation (1 key dedicated)
FLASHCARD_KEYS = [os.getenv("GEMINI_FLASHCARD_KEY")]
FLASHCARD_KEYS = [k for k in FLASHCARD_KEYS if k]

# Word Game Generation (1 key dedicated)
GAME_KEYS = [os.getenv("GEMINI_GAME_KEY")]
GAME_KEYS = [k for k in GAME_KEYS if k]

# Article Generation (1 key dedicated)
ARTICLE_KEYS = [os.getenv("GEMINI_ARTICLE_KEY")]
ARTICLE_KEYS = [k for k in ARTICLE_KEYS if k]

# Groq API Keys for Audio Script Generation (3 keys - faster than Gemini)
GROQ_KEYS = [os.getenv(f"GROQ_API_KEY_{i}") for i in range(1, 4)]
GROQ_KEYS = [k for k in GROQ_KEYS if k]

# Fallback to old keys if new ones not configured
GEMINI_API_KEYS = [
    os.getenv("GEMINI_API_KEY_1") or os.getenv("GEMINI_API_KEY"),
    os.getenv("GEMINI_API_KEY_2"),
    os.getenv("GEMINI_API_KEY_3"),
]
GEMINI_API_KEYS = [k for k in GEMINI_API_KEYS if k]

# Use fallback if no dedicated keys
if not CHAPTER_KEYS:
    CHAPTER_KEYS = GEMINI_API_KEYS
if not QUIZ_KEYS:
    QUIZ_KEYS = GEMINI_API_KEYS
if not FLASHCARD_KEYS:
    FLASHCARD_KEYS = GEMINI_API_KEYS
if not GAME_KEYS:
    GAME_KEYS = GEMINI_API_KEYS
if not ARTICLE_KEYS:
    ARTICLE_KEYS = GEMINI_API_KEYS

# Create separate queues for each service type
chapter_queue = deque(CHAPTER_KEYS) if CHAPTER_KEYS else deque()
quiz_queue = deque(QUIZ_KEYS) if QUIZ_KEYS else deque()
flashcard_queue = deque(FLASHCARD_KEYS) if FLASHCARD_KEYS else deque()
game_queue = deque(GAME_KEYS) if GAME_KEYS else deque()
article_queue = deque(ARTICLE_KEYS) if ARTICLE_KEYS else deque()
groq_queue = deque(GROQ_KEYS) if GROQ_KEYS else deque()

def get_key_for_service(service: str) -> str:
    """Get next API key for specific service using round-robin"""
    queues = {
        "chapter": chapter_queue,
        "quiz": quiz_queue,
        "flashcard": flashcard_queue,
        "game": game_queue,
        "article": article_queue,
        "groq": groq_queue
    }
    queue = queues.get(service, chapter_queue)
    if not queue:
        raise Exception(f"No API keys configured for {service}")
    key = queue[0]
    queue.rotate(-1)  # Move to back of queue
    return key

# Concurrency control per service type
CHAPTER_SEMAPHORE = asyncio.Semaphore(3)  # 3 concurrent chapter generations
QUIZ_SEMAPHORE = asyncio.Semaphore(2)
FLASHCARD_SEMAPHORE = asyncio.Semaphore(2)
GAME_SEMAPHORE = asyncio.Semaphore(1)
ARTICLE_SEMAPHORE = asyncio.Semaphore(1)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
BRAVE_API_KEY = os.getenv("BRAVE_SEARCH_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

async def call_gemini_with_retry(prompt: str, service: str = "chapter", max_retries: int = 5) -> dict:
    """Call Gemini with retry and service-specific rate limiting"""
    # Select semaphore based on service
    semaphores = {
        "chapter": CHAPTER_SEMAPHORE,
        "quiz": QUIZ_SEMAPHORE,
        "flashcard": FLASHCARD_SEMAPHORE,
        "game": GAME_SEMAPHORE,
        "article": ARTICLE_SEMAPHORE
    }
    semaphore = semaphores.get(service, CHAPTER_SEMAPHORE)
    
    async with semaphore:  # Limit concurrent calls per service
        for attempt in range(max_retries):
            try:
                # Progressive delay based on attempt
                await asyncio.sleep(0.3 * (attempt + 1))
                
                api_key = get_key_for_service(service)
                
                async with httpx.AsyncClient(timeout=45.0) as client:  # Increased timeout
                    response = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={api_key}",
                        json={
                            "contents": [{
                                "parts": [{"text": prompt}]
                            }]
                        }
                    )
                    
                    if response.status_code == 429:
                        if attempt < max_retries - 1:
                            wait = 2 ** attempt
                            logger.warning(f"⏳ [{service}] Rate limited, retrying in {wait}s...")
                            await asyncio.sleep(wait)
                            continue
                        else:
                            # Last attempt - try fallback to general key pool
                            logger.warning(f"⚠️ [{service}] All service keys rate limited, falling back to general key pool")
                            fallback_key = get_key_for_service("chapter")  # Use chapter pool as fallback
                            response = await client.post(
                                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={fallback_key}",
                                json={
                                    "contents": [{
                                        "parts": [{"text": prompt}]
                                    }]
                                }
                            )
                            if response.status_code == 429:
                                raise HTTPException(status_code=429, detail=f"Gemini API rate limit exceeded for {service} (even with fallback)")
                    
                    response.raise_for_status()
                    logger.info(f"✅ [{service}] API call successful")
                    return response.json()
                    
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < max_retries - 1:
                    logger.warning(f"⚠️ [{service}] HTTP 429 error, retrying... (attempt {attempt+1}/{max_retries})")
                    continue
                logger.error(f"💥 [{service}] HTTP Error {e.response.status_code}: {e.response.text[:200]}")
                raise
            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(f"⚠️ [{service}] Attempt {attempt+1} failed, retrying...")
                    continue
                logger.error(f"💥 [{service}] Failed after {max_retries} attempts: {e}")
                raise
    
    raise Exception(f"Max retries exceeded for {service}")

async def call_groq_with_retry(prompt: str, max_retries: int = 3) -> dict:
    """Call Groq API with retry (faster than Gemini for text generation)"""
    for attempt in range(max_retries):
        try:
            await asyncio.sleep(0.5 * (attempt + 1))
            api_key = get_key_for_service("groq")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7
                    }
                )
                
                if response.status_code == 429 and attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    logger.warning(f"⏳ [groq] Rate limited, retrying in {2 ** attempt}s...")
                    continue
                
                response.raise_for_status()
                logger.info(f"✅ [groq] API call successful")
                return response.json()
                
        except Exception as e:
            if attempt == max_retries - 1:
                logger.error(f"💥 [groq] Failed after {max_retries} attempts: {e}")
                raise
            logger.warning(f"⚠️ [groq] Attempt {attempt+1} failed, retrying...")
    
    raise Exception("Groq API max retries exceeded")

# Models
class CourseGenerationRequest(BaseModel):
    topic: str
    userId: str


class RAGIngestRequest(BaseModel):
    text: str
    source: str = "uploaded"


class RAGQueryRequest(BaseModel):
    question: str
    top_k: int = 5


# ── RAG Engine (adapted from agentic_rag) ─────────────────────────
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "shared"))
try:
    from rag import get_rag_engine
    _RAG_AVAILABLE = True
except ImportError:
    _RAG_AVAILABLE = False
    logger.warning("RAG module not available")


@app.post("/rag/ingest")
async def rag_ingest(req: RAGIngestRequest, user_id: str = Depends(verify_request_user_id)):
    """Ingest text into RAG engine for enhanced course generation."""
    if not _RAG_AVAILABLE:
        raise HTTPException(status_code=501, detail="RAG not available")
    engine = get_rag_engine()
    count = await engine.ingest_text(req.text, source=req.source)
    return {"chunks_added": count, "total_documents": engine.document_count}


@app.post("/rag/query")
async def rag_query(req: RAGQueryRequest, user_id: str = Depends(verify_request_user_id)):
    """Query RAG engine with a question (retrieves context + generates answer)."""
    if not _RAG_AVAILABLE:
        raise HTTPException(status_code=501, detail="RAG not available")
    engine = get_rag_engine()
    if engine.document_count == 0:
        return {"answer": "No documents ingested yet. Upload content first.", "sources": []}
    answer = await engine.query(req.question, top_k=req.top_k)
    results = await engine.search(req.question, top_k=req.top_k)
    return {
        "answer": answer,
        "sources": [{"text": r["document"][:200], "score": r["score"], "source": r["metadata"].get("source")} for r in results],
    }


@app.get("/rag/status")
async def rag_status():
    """Check RAG engine status."""
    if not _RAG_AVAILABLE:
        return {"available": False}
    engine = get_rag_engine()
    return {"available": True, "document_count": engine.document_count}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "course-generation",
        "has_gemini": len(GEMINI_API_KEYS) > 0,
        "gemini_key_count": len(GEMINI_API_KEYS),
        "chapter_keys": len(CHAPTER_KEYS),
        "quiz_keys": len(QUIZ_KEYS),
        "flashcard_keys": len(FLASHCARD_KEYS),
        "game_keys": len(GAME_KEYS),
        "article_keys": len(ARTICLE_KEYS),
        "groq_keys": len(GROQ_KEYS),
        "has_elevenlabs": bool(ELEVENLABS_API_KEY),
        "has_brave": bool(BRAVE_API_KEY)
    }

@app.post("/generate-course-parallel")
async def generate_course_parallel(
    request: CourseGenerationRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(verify_request_user_id),
):
    """Generate course with parallel AI agents"""

    if not GEMINI_API_KEYS:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    try:
        logger.info(f"🚀 Starting course generation: {request.topic} (user={user_id})")

        # Create course in database (ignore request.userId; trust token)
        course_id = await create_course(request.topic, user_id)
        job_id = await create_generation_job(course_id, user_id)

        logger.info(f"✅ Course created: {course_id}, Job: {job_id}")

        # Start background generation
        background_tasks.add_task(
            generate_in_parallel,
            course_id,
            request.topic,
            user_id,
        )

        return {
            "success": True,
            "courseId": course_id,
            "jobId": job_id,
            "estimatedTime": 40,
        }

    except Exception as e:
        logger.error(f"💥 Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------
# CRUD/Read Endpoints (REST)
# -------------------------

async def _fetch_course(course_id: str) -> dict:
    """Fetch a single course row from Supabase using the service key."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{SUPABASE_URL}/rest/v1/courses",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            },
            params={
                "id": f"eq.{course_id}",
                "select": "*",
                "limit": "1",
            },
        )
        r.raise_for_status()
        data = r.json()
        return data[0] if data else {}

async def _require_course_owner(course_id: str, user_id: str) -> dict:
    course = await _fetch_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if str(course.get("user_id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    return course


@app.get("/courses")
async def list_user_courses(user_id: str = Depends(verify_request_user_id)):
    """Return all courses for the authenticated user (newest first)."""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{SUPABASE_URL}/rest/v1/courses",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                },
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "*",
                    "order": "created_at.desc",
                },
            )
            r.raise_for_status()
            return r.json()
    except Exception as e:
        logger.error(f"Error listing courses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/courses/{course_id}")
async def get_course(course_id: str, user_id: str = Depends(verify_request_user_id)):
    """Return a single course by id (owner-only)."""
    try:
        course = await _require_course_owner(course_id, user_id)
        return course
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting course: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/courses/{course_id}/content")
async def get_course_content(course_id: str, user_id: str = Depends(verify_request_user_id)):
    """Return all course content for a given course id (owner-only)."""
    try:
        await _require_course_owner(course_id, user_id)

        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        }
        async with httpx.AsyncClient() as client:
            chapters_task = client.get(
                f"{SUPABASE_URL}/rest/v1/course_chapters",
                headers=headers,
                params={"course_id": f"eq.{course_id}", "select": "*", "order": "order_index.asc"},
            )
            flashcards_task = client.get(
                f"{SUPABASE_URL}/rest/v1/course_flashcards",
                headers=headers,
                params={"course_id": f"eq.{course_id}", "select": "*"},
            )
            mcqs_task = client.get(
                f"{SUPABASE_URL}/rest/v1/course_mcqs",
                headers=headers,
                params={"course_id": f"eq.{course_id}", "select": "*"},
            )

            chapters_r, flashcards_r, mcqs_r = await asyncio.gather(
                chapters_task, flashcards_task, mcqs_task
            )

            return {
                "chapters": chapters_r.json(),
                "flashcards": flashcards_r.json(),
                "mcqs": mcqs_r.json(),
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting course content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/courses/{course_id}")
async def delete_course(course_id: str, user_id: str = Depends(verify_request_user_id)):
    """Delete course and all related content (owner-only)."""
    try:
        await _require_course_owner(course_id, user_id)

        logger.info(f"🗑️  Deleting course: {course_id} (user={user_id})")
        headers = {
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        }

        async with httpx.AsyncClient() as client:
            # Try to delete related content first (in case cascade isn't configured)
            related_tables = [
                "course_chapters",
                "course_flashcards",
                "course_mcqs",
                "course_articles",
                "course_word_games",
                "course_audio",
                "course_resources",
                "course_suggestions",
                "course_generation_jobs",
            ]

            for table in related_tables:
                try:
                    await client.delete(
                        f"{SUPABASE_URL}/rest/v1/{table}",
                        headers=headers,
                        params={"course_id": f"eq.{course_id}"},
                    )
                except Exception as e:
                    logger.debug(f"Could not delete from {table}: {e} (may not exist)")

            # Now delete the course itself
            response = await client.delete(
                f"{SUPABASE_URL}/rest/v1/courses",
                headers=headers,
                params={"id": f"eq.{course_id}"},
            )

            if response.status_code == 204:
                logger.info(f"✅ Course {course_id} deleted successfully")
                return {"success": True, "message": "Course deleted successfully"}
            if response.status_code == 404:
                logger.warning(f"⚠️ Course {course_id} not found")
                return {"success": False, "message": "Course not found"}

            logger.error(f"❌ Failed to delete course: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail="Failed to delete course")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"💥 Error deleting course: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))

async def create_course(topic: str, user_id: str) -> str:
    """Create course record in Supabase"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/courses",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            json={
                "user_id": user_id,
                "title": topic,
                "purpose": "practice",
                "difficulty": "intermediate",
                "status": "generating",
                "summary": f"AI-generated course on {topic}",
                "is_oboe_style": True
            }
        )
        
        if response.status_code not in [200, 201]:
            raise Exception(f"Failed to create course: {response.text}")
        
        data = response.json()
        return data[0]["id"] if isinstance(data, list) else data["id"]

async def create_generation_job(course_id: str, user_id: str) -> str:
    """Create generation job"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SUPABASE_URL}/rest/v1/course_generation_jobs",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            },
            json={
                "user_id": user_id,
                "course_id": course_id,
                "status": "processing",
                "job_type": "course_creation",
                "current_step": "Starting parallel generation",
                "progress_percentage": 5
            }
        )
        
        data = response.json()
        return data[0]["id"] if isinstance(data, list) else data["id"]

async def generate_in_parallel(course_id: str, topic: str, user_id: str):
    """Main parallel generation orchestrator"""
    start_time = datetime.now()
    
    try:
        # Update progress
        await update_progress(course_id, 10, "📚 Learn by Reading - Generating course structure...")
        
        # STEP 1: Generate outline
        outline = await generate_outline(topic)
        chapter_count = len(outline['chapters'])
        logger.info(f"✅ Outline generated with {chapter_count} chapters")
        await update_progress(course_id, 15, f"📚 Learn by Reading - Generated {chapter_count} chapters outline")
        
        await update_progress(course_id, 20, "📚 Learn by Reading - Creating chapter content...")
        
        # STEP 2: Parallel generation with better error handling
        results = await asyncio.gather(
            generate_chapters(course_id, topic, outline),
            generate_flashcards(course_id, topic),
            generate_mcqs(course_id, topic),
            generate_articles(course_id, topic),
            generate_word_games(course_id, topic),
            generate_audio_scripts(topic, outline),
            return_exceptions=True
        )
        
        # Handle exceptions gracefully
        chapters = results[0] if not isinstance(results[0], Exception) else []
        flashcards = results[1] if not isinstance(results[1], Exception) else []
        mcqs = results[2] if not isinstance(results[2], Exception) else []
        articles = results[3] if not isinstance(results[3], Exception) else {}
        word_games = results[4] if not isinstance(results[4], Exception) else []
        audio_scripts = results[5] if not isinstance(results[5], Exception) else {}
        
        # Log any exceptions
        service_names = ["chapters", "flashcards", "mcqs", "articles", "word_games", "audio_scripts"]
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"⚠️ {service_names[i]} generation failed: {result}")
        
        # Detailed progress update
        chapter_count = len(chapters) if chapters else 0
        flashcard_count = len(flashcards) if flashcards else 0
        mcq_count = len(mcqs) if mcqs else 0
        await update_progress(
            course_id, 
            50, 
            f"📚 Learn by Reading - Created {chapter_count} chapters\n🎮 Learn by Interacting - {mcq_count} quizzes, {flashcard_count} flashcards"
        )
        
        logger.info("✅ Content generation completed (some may have failed gracefully)")
        
        await update_progress(course_id, 60, "🎧 Learn by Listening - Creating audio scripts...")
        
        # STEP 3: Store audio scripts in database (always, even if TTS fails)
        audio_success = False
        if audio_scripts:
            # Always store scripts in database for browser TTS fallback
            audio_records = []
            if audio_scripts.get("short"):
                audio_records.append({
                    "course_id": course_id,
                    "audio_type": "short_podcast",
                    "script": audio_scripts.get("short", ""),
                    "script_text": audio_scripts.get("short", ""),  # Legacy field
                    "audio_url": None,  # Browser will use speechSynthesis API
                    "duration_seconds": 300,
                })
            if audio_scripts.get("long"):
                audio_records.append({
                    "course_id": course_id,
                    "audio_type": "full_lecture",
                    "script": audio_scripts.get("long", ""),
                    "script_text": audio_scripts.get("long", ""),  # Legacy field
                    "audio_url": None,  # Browser will use speechSynthesis API
                    "duration_seconds": 1200,
                })
            
            if audio_records:
                await insert_to_supabase("course_audio", audio_records)
                logger.info("✅ Audio scripts stored in database")
                await update_progress(course_id, 70, "🎧 Learn by Listening - Audio scripts ready for playback")
            
            # Try to generate TTS if API key available
            if ELEVENLABS_API_KEY:
                results = await asyncio.gather(
                    generate_tts(course_id, audio_scripts.get("short", ""), "short_podcast"),
                    generate_tts(course_id, audio_scripts.get("long", ""), "full_lecture"),
                    return_exceptions=True
                )
                # Check if any TTS generation succeeded (returned True)
                audio_success = any(result is True for result in results)
                
                # Also verify by checking if audio was actually created in database
                if not audio_success:
                    try:
                        async with httpx.AsyncClient() as client:
                            check_response = await client.get(
                                f"{SUPABASE_URL}/rest/v1/course_audio?course_id=eq.{course_id}&audio_url=not.is.null",
                                headers={
                                    "apikey": SUPABASE_SERVICE_KEY,
                                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                                }
                            )
                            if check_response.status_code == 200:
                                audio_data = check_response.json()
                                audio_success = len(audio_data) > 0
                    except Exception as e:
                        logger.debug(f"Could not verify audio in database: {e}")
                
                if audio_success:
                    await update_course_field(course_id, {"audio_generated": True})
                    logger.info("✅ Audio generation completed successfully")
                else:
                    logger.warning("⚠️ Audio generation failed - scripts stored for browser TTS fallback")
            else:
                logger.info("ℹ️ ElevenLabs API key not configured - scripts stored for browser TTS")
        
        await update_progress(course_id, 80, "🎮 Learn by Interacting - Finding resources...")
        
        # STEP 4: Find resources if Brave key available
        if BRAVE_API_KEY:
            await find_resources(course_id, topic)
        
        await update_progress(course_id, 90, "🎮 Learn by Interacting - Generating practice exercises...")
        
        # STEP 5: Generate suggestions
        await generate_suggestions(course_id, topic)
        
        # STEP 6: Finalize
        duration = int((datetime.now() - start_time).total_seconds())
        
        # Calculate estimated completion time based on chapter count
        chapter_count = len(outline.get("chapters", []))
        estimated_minutes = chapter_count * 15  # 15 minutes per chapter
        
        await update_course_field(course_id, {
            "status": "published",
            "generation_duration_seconds": duration,
            "articles_generated": True,
            "games_generated": True,
            "completion_time_estimate": estimated_minutes  # Estimated reading time in minutes
        })
        
        await finalize_job(course_id, duration)
        
        logger.info(f"✅ Course {course_id} generated in {duration}s")
        
    except Exception as e:
        logger.error(f"💥 Generation error: {e}")
        await mark_job_failed(course_id, str(e))

async def generate_outline(topic: str) -> dict:
    """Generate course outline - 5-7 chapters based on complexity"""
    prompt = f"""Create a detailed course outline for: "{topic}"

Generate 5-7 chapters based on topic complexity:
- Chapter 1: Introduction & Fundamentals (basic)
- Chapter 2: Core Concepts (intermediate)
- Chapter 3: Practical Applications (intermediate)
- Chapter 4: Advanced Techniques (advanced)
- Chapter 5: Real-world Projects (advanced)
- Chapter 6 (optional): Best Practices & Optimization (expert)
- Chapter 7 (optional): Future Trends & Next Steps (expert)

Return JSON:
{{
  "chapters": [
    {{
      "title": "string",
      "level": "basic|intermediate|advanced|expert",
      "objectives": ["obj1", "obj2", "obj3"],
      "keyConcepts": ["concept1", "concept2", "concept3"],
      "estimatedMinutes": 15
    }}
  ]
}}

Generate at least 5 chapters, up to 7 if the topic is complex. Return ONLY valid JSON."""
    
    data = await call_gemini_with_retry(prompt, service="chapter")
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    
    # Extract JSON
    json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL) or re.search(r'\{.*\}', text, re.DOTALL)
    if json_match:
        outline = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
        
        # Ensure minimum 5 chapters
        if len(outline.get('chapters', [])) < 5:
            logger.warning(f"Only {len(outline['chapters'])} chapters generated, requesting more...")
            # Retry with explicit requirement
            retry_prompt = f"""Create a course outline for: "{topic}" with EXACTLY 5-7 chapters. Return JSON: {{"chapters": [{{"title": "string", "level": "basic|intermediate|advanced|expert", "objectives": ["obj1"], "keyConcepts": ["concept1"], "estimatedMinutes": 15}}]}}"""
            retry_data = await call_gemini_with_retry(retry_prompt, service="chapter")
            retry_text = retry_data["candidates"][0]["content"]["parts"][0]["text"]
            retry_match = re.search(r'```json\n(.*?)\n```', retry_text, re.DOTALL) or re.search(r'\{.*\}', retry_text, re.DOTALL)
            if retry_match:
                outline = json.loads(retry_match.group(1) if retry_match.lastindex else retry_match.group(0))
        
        return outline
    
    return json.loads(text)

async def generate_chapters(course_id: str, topic: str, outline: dict) -> list:
    """Generate chapter content in HTML format with code examples, tables"""
    chapters = []
    
    for i, chapter in enumerate(outline["chapters"]):
        level = chapter.get('level', 'intermediate')
        
        prompt = f"""Write comprehensive chapter content for: {chapter['title']}

Topic: {topic}
Level: {level}

REQUIREMENTS (1500-2000 words minimum):
1. Start with introduction (2-3 paragraphs in <p> tags, NO heading)
2. 4-5 main sections with <h2>Subheading</h2> headings
3. Each section: 300-400 words with detailed explanations
4. Include 3-5 detailed code examples (10-20 lines each) in <pre><code>code blocks</code></pre>
5. Add real-world examples and use cases
6. Include best practices and common pitfalls
7. One comparison table using <table><tr><th>Header</th></tr><tr><td>Data</td></tr></table> if applicable
8. End with summary section (<h2>Summary</h2>) with key takeaways

OUTPUT FORMAT: Pure HTML only. Use these tags:
- <h2>Subheading</h2> (for main sections)
- <h3>Sub-subheading</h3> (for subsections if needed)
- <p>Paragraph text</p>
- <strong>Bold text</strong>
- <em>Italic text</em>
- <ul><li>List item</li></ul>
- <pre><code># Multi-line code blocks
def example():
    pass
</code></pre>
- <code>inline code</code> (for single words/phrases)
- <table><tr><th>Header</th></tr><tr><td>Data</td></tr></table>

DO NOT:
- Repeat the chapter title as a heading (it's already shown)
- Use markdown syntax (**text**, ##, ```, *)
- Include any text outside HTML tags
- Add speaker labels or meta-text

Return ONLY HTML, no markdown. Make it comprehensive and detailed."""

        data = await call_gemini_with_retry(prompt, service="chapter")
        content = data["candidates"][0]["content"]["parts"][0]["text"]
        
        # Clean any remaining markdown artifacts
        content = content.replace('```html', '').replace('```', '').replace('**', '').strip()
        # Remove any markdown headers if present
        content = re.sub(r'^#+\s+', '', content, flags=re.MULTILINE)
        
        # Remove chapter title if it appears in content (repeated heading fix)
        title_lower = chapter['title'].lower()
        # Remove first <h1> or <h2> that matches chapter title exactly
        content = re.sub(
            rf'<h[12][^>]*>\s*{re.escape(chapter["title"])}\s*</h[12]>',
            '',
            content,
            count=1,
            flags=re.IGNORECASE
        )
        # Also remove if title appears as plain text at the start
        if content.lower().startswith(title_lower):
            content = re.sub(
                rf'^{re.escape(chapter["title"])}\s*\n+',
                '',
                content,
                count=1,
                flags=re.IGNORECASE | re.MULTILINE
            )
        
        chapters.append({
            "course_id": course_id,
            "title": chapter["title"],
            "content": content,  # Now pure HTML
            "order_number": i + 1,
            "estimated_reading_time": chapter.get("estimatedMinutes", 10)
        })
    
    # Insert chapters
    await insert_to_supabase("course_chapters", chapters)
    return chapters

async def generate_flashcards(course_id: str, topic: str) -> list:
    """Generate flashcards"""
    prompt = f"Generate 10 flashcards for: {topic}. Format as JSON: [{{'question': 'string', 'answer': 'string'}}]"
    data = await call_gemini_with_retry(prompt, service="flashcard")
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    
    json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL) or re.search(r'\[.*\]', text, re.DOTALL)
    flashcards_data = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
    
    flashcards = [
        {"course_id": course_id, "question": f["question"], "answer": f["answer"], "difficulty": "medium"}
        for f in flashcards_data
    ]
    
    await insert_to_supabase("course_flashcards", flashcards)
    return flashcards

async def generate_mcqs(course_id: str, topic: str) -> list:
    """Generate MCQs"""
    prompt = f"Generate 10 MCQs for: {topic}. Format as JSON: [{{'question': 'string', 'options': ['A', 'B', 'C', 'D'], 'correct': 'A', 'explanation': 'string'}}]"
    data = await call_gemini_with_retry(prompt, service="quiz")
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    
    json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL) or re.search(r'\[.*\]', text, re.DOTALL)
    mcqs_data = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
    
    mcqs = [
        {
            "course_id": course_id,
            "question": m["question"],
            "options": m["options"],
            "correct_answer": m["correct"],
            "explanation": m["explanation"],
            "difficulty": "medium"
        }
        for m in mcqs_data
    ]
    
    await insert_to_supabase("course_mcqs", mcqs)
    return mcqs

async def generate_articles(course_id: str, topic: str) -> dict:
    """Generate articles in HTML format"""
    # Deep dive - HTML format
    deep_dive_prompt = f"""Write an 800-1000 word deep-dive article on: {topic}

Use ONLY HTML tags: <h2>, <p>, <strong>, <em>, <ul>, <li>, <code>, <table>
No markdown syntax allowed.
Include 2-3 code examples in <code> tags."""
    
    deep_dive_data = await call_gemini_with_retry(deep_dive_prompt, service="article")
    deep_dive = deep_dive_data["candidates"][0]["content"]["parts"][0]["text"].strip()
    # Clean markdown artifacts
    deep_dive = deep_dive.replace('```html', '').replace('```', '').replace('**', '').strip()
    
    # Key takeaways - HTML format
    takeaways_prompt = f"""Summarize key takeaways for: {topic} in 5-7 bullet points. Use HTML: <ul><li>Point 1</li><li>Point 2</li></ul>"""
    takeaways_data = await call_gemini_with_retry(takeaways_prompt, service="article")
    takeaways = takeaways_data["candidates"][0]["content"]["parts"][0]["text"].strip()
    takeaways = takeaways.replace('```html', '').replace('```', '').replace('**', '').strip()
    
    # FAQ
    faq_prompt = f"Generate 8-10 FAQ for: {topic}. Format as JSON: [{{'question': 'string', 'answer': 'string'}}]"
    faq_data = await call_gemini_with_retry(faq_prompt, service="article")
    faq_text = faq_data["candidates"][0]["content"]["parts"][0]["text"]
    
    json_match = re.search(r'```json\n(.*?)\n```', faq_text, re.DOTALL) or re.search(r'\[.*\]', faq_text, re.DOTALL)
    faq = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
    
    articles = [
        {"course_id": course_id, "article_type": "deep_dive", "title": f"Deep Dive: {topic}", "content": deep_dive, "reading_time_minutes": 10},
        {"course_id": course_id, "article_type": "key_takeaways", "title": f"Key Takeaways: {topic}", "content": takeaways, "reading_time_minutes": 3},
        {"course_id": course_id, "article_type": "faq", "title": f"FAQ: {topic}", "content": json.dumps(faq), "reading_time_minutes": 5}
    ]
    
    await insert_to_supabase("course_articles", articles)
    return {"deep_dive": deep_dive, "takeaways": takeaways, "faq": faq}

async def generate_word_games(course_id: str, topic: str) -> list:
    """Generate word games - skip if table doesn't exist"""
    try:
        prompt = f"Generate 15 vocabulary words for: {topic}. Format as JSON: [{{'word': 'string', 'correct': 'string', 'incorrect': ['string', 'string', 'string']}}]"
        data = await call_gemini_with_retry(prompt, service="game")
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        
        json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL) or re.search(r'\[.*\]', text, re.DOTALL)
        words_data = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
        
        words = [
            {"course_id": course_id, "word": w["word"], "definition": w["correct"], "incorrect_options": w["incorrect"], "difficulty": "medium"}
            for w in words_data
        ]
        
        await insert_to_supabase("course_word_games", words)
        return words
    except Exception as e:
        logger.warning(f"Word games table not found or error occurred, skipping: {e}")
        return []  # Return empty list instead of failing

async def generate_audio_scripts(topic: str, outline: dict) -> dict:
    """Generate audio scripts using Groq (faster than Gemini)"""
    try:
        # Short script - use Groq if available, fallback to Gemini
        short_prompt = f"Write 5-minute conversational podcast script introducing: {topic}. ~700 words. No speaker labels."
        if GROQ_KEYS:
            short_data = await call_groq_with_retry(short_prompt)
            short_script = short_data["choices"][0]["message"]["content"]
        else:
            short_data = await call_gemini_with_retry(short_prompt, service="chapter")
            short_script = short_data["candidates"][0]["content"]["parts"][0]["text"]
        
        # Long script
        long_prompt = f"Write 20-minute educational lecture on: {topic}. ~3000 words. No speaker labels."
        if GROQ_KEYS:
            long_data = await call_groq_with_retry(long_prompt)
            long_script = long_data["choices"][0]["message"]["content"]
        else:
            long_data = await call_gemini_with_retry(long_prompt, service="chapter")
            long_script = long_data["candidates"][0]["content"]["parts"][0]["text"]
        
        return {"short": short_script, "long": long_script}
    except Exception as e:
        logger.warning(f"Audio script generation failed, using fallback: {e}")
        # Fallback to simple scripts
        return {
            "short": f"Welcome to this podcast about {topic}. Today we'll explore the fundamentals and key concepts.",
            "long": f"In this comprehensive lecture on {topic}, we'll cover everything from basics to advanced techniques."
        }

async def generate_tts(course_id: str, script: str, audio_type: str):
    """Generate TTS audio"""
    if not ELEVENLABS_API_KEY:
        logger.info("ElevenLabs API key not configured, skipping TTS")
        return
    
    if not script or len(script.strip()) < 50:
        logger.warning("Script too short for TTS")
        return
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                "https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x",
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "text": script[:5000],
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                }
            )
            
            if response.status_code == 401:
                error_detail = ""
                try:
                    error_json = response.json()
                    error_detail = error_json.get("detail", {}).get("message", "") or str(error_json)
                except:
                    error_detail = response.text[:200] if hasattr(response, 'text') else ""
                
                if "abuse" in error_detail.lower() or "free tier" in error_detail.lower():
                    logger.warning(f"ElevenLabs abuse detection triggered: {error_detail[:150]}")
                else:
                    logger.error(f"Invalid ElevenLabs API key (401): {error_detail[:150]}")
                return False
            
            if response.status_code == 200:
                audio_data = response.content
                # Store in Supabase storage (simplified - you'd upload to storage bucket)
                audio_url = f"https://storage.example.com/{course_id}/{audio_type}.mp3"
                
                # Update existing record with audio_url if it exists, otherwise create new one
                try:
                    async with httpx.AsyncClient() as client:
                        check_response = await client.get(
                            f"{SUPABASE_URL}/rest/v1/course_audio?course_id=eq.{course_id}&audio_type=eq.{audio_type}",
                            headers={
                                "apikey": SUPABASE_SERVICE_KEY,
                                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                            }
                        )
                        if check_response.status_code == 200:
                            existing = check_response.json()
                            if existing and len(existing) > 0:
                                # Update existing record with audio_url
                                update_response = await client.patch(
                                    f"{SUPABASE_URL}/rest/v1/course_audio?id=eq.{existing[0]['id']}",
                                    headers={
                                        "apikey": SUPABASE_SERVICE_KEY,
                                        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                                        "Content-Type": "application/json",
                                        "Prefer": "return=representation"
                                    },
                                    json={
                                        "audio_url": audio_url,
                                        "voice_used": "Aria"
                                    }
                                )
                                if update_response.status_code in [200, 204]:
                                    logger.info(f"✅ Updated {audio_type} with audio URL")
                                    return True
                except Exception as e:
                    logger.debug(f"Could not check/update existing record: {e}")
                
                # If no existing record, create new one
                await insert_to_supabase("course_audio", [{
                    "course_id": course_id,
                    "audio_type": audio_type,
                    "audio_url": audio_url,
                    "script_text": script,
                    "duration_seconds": 300 if audio_type == "short_podcast" else 1200,
                    "voice_used": "Aria"
                }])
                
                logger.info(f"✅ Generated {audio_type} audio")
                return True  # Return True to indicate success
            else:
                error_msg = response.text[:200] if hasattr(response, 'text') else str(response.status_code)
                logger.warning(f"TTS generation failed with status {response.status_code}: {error_msg}")
                return False  # Return False to indicate failure
    except Exception as e:
        logger.error(f"TTS error: {e}")

async def find_resources(course_id: str, topic: str):
    """Find resources using Brave"""
    if not BRAVE_API_KEY:
        return
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.search.brave.com/res/v1/web/search?q={topic}+tutorial+documentation",
                headers={"X-Subscription-Token": BRAVE_API_KEY}
            )
            
            data = response.json()
            results = data.get("web", {}).get("results", [])
            
            resources = [
                {
                    "course_id": course_id,
                    "title": r["title"],
                    "type": "article",
                    "url": r["url"],
                    "description": r.get("description", ""),
                    "provider": r["url"].split("/")[2]
                }
                for r in results[:5]
            ]
            
            if resources:
                await insert_to_supabase("course_resources", resources)
    except Exception as e:
        logger.error(f"Resource finding error: {e}")

async def generate_suggestions(course_id: str, topic: str):
    """Generate continue learning suggestions"""
    try:
        prompt = f"Suggest 5 related topics after learning {topic}. Format as JSON: [{{'topic': 'string', 'description': 'string'}}]"
        data = await call_gemini_with_retry(prompt, service="article")
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        
        json_match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL) or re.search(r'\[.*\]', text, re.DOTALL)
        suggestions_data = json.loads(json_match.group(1) if json_match.lastindex else json_match.group(0))
        
        suggestions = [
            {"course_id": course_id, "suggestion_topic": s["topic"], "suggestion_description": s["description"], "relevance_score": 5 - i}
            for i, s in enumerate(suggestions_data)
        ]
        
        await insert_to_supabase("course_suggestions", suggestions)
    except Exception as e:
        logger.warning(f"Suggestions generation failed, skipping: {e}")

# Utility functions
async def insert_to_supabase(table: str, data: list):
    """Insert data to Supabase"""
    if not data:
        return
    
    async with httpx.AsyncClient() as client:
        await client.post(
            f"{SUPABASE_URL}/rest/v1/{table}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json=data
        )

async def update_progress(course_id: str, percent: int, step: str):
    """Update job progress"""
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/course_generation_jobs?course_id=eq.{course_id}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json={"progress_percentage": percent, "current_step": step}
        )

async def update_course_field(course_id: str, fields: dict):
    """Update course fields"""
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/courses?id=eq.{course_id}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json=fields
        )

async def finalize_job(course_id: str, duration: int):
    """Finalize generation job"""
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/course_generation_jobs?course_id=eq.{course_id}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "status": "completed",
                "progress_percentage": 100,
                "current_step": "Course ready!",
                "completed_at": datetime.utcnow().isoformat()
            }
        )

async def mark_job_failed(course_id: str, error: str):
    """Mark job as failed"""
    async with httpx.AsyncClient() as client:
        await client.patch(
            f"{SUPABASE_URL}/rest/v1/course_generation_jobs?course_id=eq.{course_id}",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "status": "failed",
                "error_message": error,
                "completed_at": datetime.utcnow().isoformat()
            }
        )

if __name__ == "__main__":
    port = int(os.getenv("SERVICE_PORT", "8008"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
