"""
DSA Service - Supabase (PostgreSQL) Edition
============================================
Progress tracking, analytics, favorites, AI feedback, and chatbot
for the DSA practice module. Uses asyncpg to connect to Supabase.
"""

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import json
import csv
import io
import os
import re
import httpx
import asyncpg
from contextlib import asynccontextmanager
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq
from jose import JWTError, jwt

# Load environment variables from backend root
backend_root = Path(__file__).parent.parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

# Supabase / Postgres
DB_URL = os.getenv("SUPABASE_DB_URL", "")

# Supabase REST (used only for feedback history via REST API)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# AI
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ================================================================
#  Pydantic Models
# ================================================================

class DSAProgress(BaseModel):
    user_id: str
    topic_id: str
    problem_name: str
    completed: bool
    completed_at: Optional[datetime] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None


class DSAFilters(BaseModel):
    difficulty: List[str] = []
    category: List[str] = []
    companies: List[str] = []
    search_query: Optional[str] = None


class DSAUserPreferences(BaseModel):
    user_id: str
    filters: DSAFilters
    favorites: List[str] = []
    last_visited: List[str] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DSAAnalytics(BaseModel):
    user_id: str
    total_problems: int = 0
    solved_problems: int = 0
    difficulty: Dict[str, int] = {}
    category: Dict[str, int] = {}
    streak_days: int = 0
    last_activity: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class FeedbackRequest(BaseModel):
    feedback_id: str
    user_id: str
    problem_name: str
    difficulty: str
    category: str
    rating: int
    time_spent: Optional[int] = None
    struggled_areas: List[str] = []
    detailed_feedback: Optional[str] = ""


class ChatbotRequest(BaseModel):
    query: str
    user_id: str
    context: str = "dsa_practice"
    user_level: str = "intermediate"
    feedback_history: List[Dict] = []


class ChatbotResponse(BaseModel):
    response: str
    source: str
    suggestions: Optional[List[Dict]] = None


class AISuggestions(BaseModel):
    approach_suggestions: List[str]
    key_concepts: List[str]
    similar_problems: List[str]
    learning_resources: List[Dict[str, str]]
    overall_advice: str


# ================================================================
#  App + Lifespan (asyncpg pool)
# ================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("DSA Service starting up...")
    if DB_URL:
        try:
            app.state.pool = await asyncpg.create_pool(
                dsn=DB_URL, min_size=2, max_size=10,
                command_timeout=30, statement_cache_size=0,
            )
            print("  DSA Service DB pool created (Supabase PostgreSQL)")
        except Exception as e:
            print(f"  DB pool failed: {e}")
            app.state.pool = None
    else:
        print("  SUPABASE_DB_URL not set - DSA service will run in degraded mode")
        app.state.pool = None
    yield
    if getattr(app.state, "pool", None):
        await app.state.pool.close()
    print("DSA Service shutting down...")


app = FastAPI(
    title="DSA Service",
    description="Service for managing DSA progress, filters, and analytics (Supabase edition)",
    version="2.1.0",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    if o.strip()
]
ALLOWED_ORIGIN_REGEX = os.getenv("ALLOWED_ORIGIN_REGEX", r"^https://.*\.lovable\.app$")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -- Auth --------------------------------------------------------
security = HTTPBearer(auto_error=False)
JWT_SECRET = os.getenv("JWT_SECRET")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")


def verify_request_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = credentials.credentials
    if JWT_SECRET:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            uid = payload.get("uid") or payload.get("sub")
            if uid:
                return str(uid)
        except JWTError:
            pass
    if SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"],
                                 audience="authenticated", options={"verify_aud": True})
            uid = payload.get("sub")
            if uid:
                return str(uid)
        except JWTError:
            pass
    raise HTTPException(status_code=401, detail="Invalid token")


def _pool():
    """Get the asyncpg pool or raise 503."""
    pool = getattr(app.state, "pool", None)
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    return pool


# ================================================================
#  DB Helpers
# ================================================================

async def update_analytics(pool, user_id: str):
    """Recompute analytics from the progress table."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT completed, difficulty, category FROM public.dsa_progress WHERE user_id = $1",
            user_id,
        )
    total = len(rows)
    solved = sum(1 for r in rows if r["completed"])
    diff_stats = {}
    cat_stats = {}
    for r in rows:
        if r["completed"]:
            d = r["difficulty"] or "Unknown"
            c = r["category"] or "Unknown"
            diff_stats[d] = diff_stats.get(d, 0) + 1
            cat_stats[c] = cat_stats.get(c, 0) + 1
    streak = await calculate_streak(pool, user_id)
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO public.dsa_analytics (user_id, total_problems, solved_problems,
                difficulty_stats, category_stats, streak_days, last_activity)
            VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                total_problems   = EXCLUDED.total_problems,
                solved_problems  = EXCLUDED.solved_problems,
                difficulty_stats = EXCLUDED.difficulty_stats,
                category_stats   = EXCLUDED.category_stats,
                streak_days      = EXCLUDED.streak_days,
                last_activity    = NOW()
        """, user_id, total, solved,
            json.dumps(diff_stats), json.dumps(cat_stats), streak)


async def calculate_streak(pool, user_id: str) -> int:
    """Count consecutive days with at least one completion."""
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT DISTINCT DATE(completed_at) AS d
            FROM public.dsa_progress
            WHERE user_id = $1 AND completed = TRUE AND completed_at IS NOT NULL
            ORDER BY d DESC
        """, user_id)
    if not rows:
        return 0
    streak = 0
    expected = datetime.now(timezone.utc).date()
    for row in rows:
        if row["d"] == expected:
            streak += 1
            expected -= timedelta(days=1)
        elif row["d"] < expected:
            break
    return streak


# ================================================================
#  Feedback / AI Helpers (Supabase REST + Groq)
# ================================================================

async def get_user_feedback_history(user_id: str, limit: int = 5):
    if not (SUPABASE_URL and SUPABASE_SERVICE_KEY):
        return []
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/dsa_feedbacks",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                },
                params={
                    "user_id": f"eq.{user_id}",
                    "order": "created_at.desc",
                    "limit": str(limit),
                    "select": "problem_name,difficulty,rating,struggled_areas,ai_suggestions",
                },
            )
            return resp.json() if resp.status_code == 200 else []
    except Exception as e:
        print(f"Error fetching feedback history: {e}")
        return []


async def update_feedback_suggestions(feedback_id: str, suggestions: AISuggestions):
    if not (SUPABASE_URL and SUPABASE_SERVICE_KEY):
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/dsa_feedbacks",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                },
                params={"id": f"eq.{feedback_id}"},
                json={
                    "ai_suggestions": suggestions.dict(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                },
            )
    except Exception as e:
        print(f"Error updating feedback suggestions: {e}")


async def generate_enhanced_ai_suggestions(feedback: FeedbackRequest) -> AISuggestions:
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    struggled_areas_text = ", ".join(feedback.struggled_areas) if feedback.struggled_areas else "None specified"
    time_info = f" (spent {feedback.time_spent} minutes)" if feedback.time_spent else ""
    prompt = f"""You are an expert DSA mentor analyzing a student's feedback.

PROBLEM DETAILS:
- Problem: {feedback.problem_name}
- Difficulty: {feedback.difficulty}
- Category: {feedback.category}
- Rating: {feedback.rating}/5 stars{time_info}
- Struggled With: {struggled_areas_text}
- Additional Feedback: {feedback.detailed_feedback or "None"}

Based on this SPECIFIC feedback, provide PERSONALIZED suggestions.
Return valid JSON only in this exact format:
{{
  "approach_suggestions": ["strategy1", "strategy2", "strategy3"],
  "key_concepts": ["concept1", "concept2", "concept3"],
  "similar_problems": ["problem1", "problem2", "problem3"],
  "learning_resources": [
    {{"type": "video", "title": "Title", "description": "Description", "url": "https://..."}},
    {{"type": "article", "title": "Title", "description": "Description", "url": "https://..."}}
  ],
  "overall_advice": "Encouraging advice specific to their situation"
}}"""
    try:
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert DSA mentor. Always respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=2000,
        )
        text = response.choices[0].message.content.strip()
        if text.startswith("```json"):
            text = text.replace("```json", "").replace("```", "")
        elif text.startswith("```"):
            text = text.replace("```", "")
        text = text.strip()
        if not text:
            raise Exception("Empty response from Groq")
        data = json.loads(text)
        return AISuggestions(
            approach_suggestions=data.get("approach_suggestions", []),
            key_concepts=data.get("key_concepts", []),
            similar_problems=data.get("similar_problems", []),
            learning_resources=data.get("learning_resources", []),
            overall_advice=data.get("overall_advice", ""),
        )
    except Exception as e:
        print(f"Enhanced AI suggestions generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI suggestions generation failed: {str(e)}")


async def generate_contextual_chatbot_response(query: str, user_id: str, feedback_history):
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API key not configured")
    common_struggles = {}
    low_rated = []
    recent_cats = []
    for fb in feedback_history:
        for area in fb.get("struggled_areas", []):
            common_struggles[area] = common_struggles.get(area, 0) + 1
        if fb.get("rating", 5) <= 2:
            low_rated.append(fb.get("problem_name", ""))
        if fb.get("category"):
            recent_cats.append(fb["category"])
    parts = []
    if common_struggles:
        top = sorted(common_struggles.items(), key=lambda x: x[1], reverse=True)[:3]
        parts.append(f"Recent struggles: {', '.join(s[0] for s in top)}")
    if low_rated:
        parts.append(f"Challenging problems: {', '.join(low_rated[:3])}")
    if recent_cats:
        parts.append(f"Recent focus areas: {', '.join(list(set(recent_cats))[:3])}")
    ctx = ". ".join(parts) if parts else "No recent feedback history"
    system_prompt = f"""You are an expert DSA tutor and mentor.

STUDENT CONTEXT:
{ctx}

INSTRUCTIONS:
- Keep responses under 150 words
- Use bullet points, not long paragraphs
- Provide concise, actionable advice
- Be encouraging but brief"""
    try:
        resp = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=400,
        )
        return ChatbotResponse(response=resp.choices[0].message.content.strip(), source="contextual_ai")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot response generation failed: {str(e)}")


# ================================================================
#  ROUTES - Health
# ================================================================

@app.get("/health")
async def health_check():
    db_ok = getattr(app.state, "pool", None) is not None
    return {
        "status": "healthy" if db_ok else "degraded",
        "service": "dsa-unified-service",
        "version": "2.1.0",
        "database": "connected" if db_ok else "disconnected",
        "features": ["progress_tracking", "analytics", "favorites", "ai_feedback", "contextual_chatbot"],
        "groq_configured": groq_client is not None,
    }


# ================================================================
#  ROUTES - Progress
# ================================================================

@app.post("/progress")
async def post_progress(progress: DSAProgress, user_id: str = Depends(verify_request_user_id)):
    if str(progress.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    pool = _pool()
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO public.dsa_progress (user_id, topic_id, problem_name, completed, completed_at, difficulty, category)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id, topic_id, problem_name) DO UPDATE SET
                completed    = EXCLUDED.completed,
                completed_at = EXCLUDED.completed_at,
                difficulty   = EXCLUDED.difficulty,
                category     = EXCLUDED.category
        """, progress.user_id, progress.topic_id, progress.problem_name,
            progress.completed, progress.completed_at or now,
            progress.difficulty, progress.category)
    await update_analytics(pool, progress.user_id)
    return progress.dict()


@app.get("/progress/{user_id}")
async def get_progress(user_id: str, authed_user_id: str = Depends(verify_request_user_id)):
    if str(user_id) != str(authed_user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    pool = _pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM public.dsa_progress WHERE user_id = $1", user_id)
    result = []
    for r in rows:
        d = dict(r)
        d["id"] = str(d.get("id", ""))
        result.append(d)
    return result


@app.get("/progress/{user_id}/{topic_id}")
async def get_topic_progress(user_id: str, topic_id: str):
    pool = _pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM public.dsa_progress WHERE user_id = $1 AND topic_id = $2",
            user_id, topic_id)
    result = []
    for r in rows:
        d = dict(r)
        d["id"] = str(d.get("id", ""))
        result.append(d)
    return result


@app.post("/progress/bulk")
async def bulk_update_progress(progress_items: List[DSAProgress]):
    pool = _pool()
    now = datetime.now(timezone.utc)
    user_ids = set()
    async with pool.acquire() as conn:
        for p in progress_items:
            user_ids.add(p.user_id)
            await conn.execute("""
                INSERT INTO public.dsa_progress (user_id, topic_id, problem_name, completed, completed_at, difficulty, category)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (user_id, topic_id, problem_name) DO UPDATE SET
                    completed    = EXCLUDED.completed,
                    completed_at = EXCLUDED.completed_at,
                    difficulty   = EXCLUDED.difficulty,
                    category     = EXCLUDED.category
            """, p.user_id, p.topic_id, p.problem_name,
                p.completed, p.completed_at or now,
                p.difficulty, p.category)
    for uid in user_ids:
        await update_analytics(pool, uid)
    return {"updated": len(progress_items)}


# ================================================================
#  ROUTES - Filters / Preferences
# ================================================================

@app.post("/filters")
async def save_filters(user_id: str, filters: DSAFilters):
    pool = _pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO public.dsa_preferences (user_id, filters)
            VALUES ($1, $2::jsonb)
            ON CONFLICT (user_id) DO UPDATE SET filters = EXCLUDED.filters
        """, user_id, json.dumps(filters.dict()))
    return {"message": "Filters saved successfully"}


@app.get("/filters/{user_id}")
async def get_filters(user_id: str):
    pool = _pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT filters FROM public.dsa_preferences WHERE user_id = $1", user_id)
    if row and row["filters"]:
        f = row["filters"]
        return json.loads(f) if isinstance(f, str) else f
    return None


@app.post("/preferences")
async def save_preferences(preferences: DSAUserPreferences):
    pool = _pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO public.dsa_preferences (user_id, filters, favorites, last_visited)
            VALUES ($1, $2::jsonb, $3, $4)
            ON CONFLICT (user_id) DO UPDATE SET
                filters      = EXCLUDED.filters,
                favorites    = EXCLUDED.favorites,
                last_visited = EXCLUDED.last_visited
        """, preferences.user_id, json.dumps(preferences.filters.dict()),
            preferences.favorites, preferences.last_visited)
    return {"message": "Preferences saved successfully"}


@app.get("/preferences/{user_id}")
async def get_preferences(user_id: str):
    pool = _pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM public.dsa_preferences WHERE user_id = $1", user_id)
    if row:
        result = dict(row)
        result["id"] = str(result["id"])
        if isinstance(result.get("filters"), str):
            result["filters"] = json.loads(result["filters"])
        return result
    return None


# ================================================================
#  ROUTES - Favorites
# ================================================================

@app.post("/favorites")
async def add_to_favorites(user_id: str, item_id: str):
    pool = _pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO public.dsa_preferences (user_id, favorites)
            VALUES ($1, ARRAY[$2])
            ON CONFLICT (user_id) DO UPDATE SET
                favorites = array_append(
                    array_remove(dsa_preferences.favorites, $2), $2
                )
        """, user_id, item_id)
    return {"message": "Added to favorites"}


@app.delete("/favorites/{user_id}/{item_id}")
async def remove_from_favorites(user_id: str, item_id: str):
    pool = _pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            UPDATE public.dsa_preferences
            SET favorites = array_remove(favorites, $2)
            WHERE user_id = $1
        """, user_id, item_id)
    return {"message": "Removed from favorites"}


@app.get("/favorites/{user_id}")
async def get_favorites(user_id: str):
    pool = _pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT favorites FROM public.dsa_preferences WHERE user_id = $1", user_id)
    if row and row["favorites"]:
        return row["favorites"]
    return []


# ================================================================
#  ROUTES - Analytics
# ================================================================

@app.get("/analytics/{user_id}")
async def get_analytics(user_id: str):
    pool = _pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM public.dsa_analytics WHERE user_id = $1", user_id)
    if row:
        result = dict(row)
        result["id"] = str(result["id"])
        result["difficulty"] = result.pop("difficulty_stats", {})
        result["category"] = result.pop("category_stats", {})
        if isinstance(result["difficulty"], str):
            result["difficulty"] = json.loads(result["difficulty"])
        if isinstance(result["category"], str):
            result["category"] = json.loads(result["category"])
        return result
    return {
        "user_id": user_id,
        "total_problems": 0, "solved_problems": 0,
        "difficulty": {}, "category": {},
        "streak_days": 0, "last_activity": None,
    }


# ================================================================
#  ROUTES - Export / Import
# ================================================================

@app.get("/export/{user_id}")
async def export_progress(user_id: str):
    pool = _pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT topic_id, problem_name, completed, completed_at, difficulty, category "
            "FROM public.dsa_progress WHERE user_id = $1", user_id)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["topic_id", "problem_name", "completed", "completed_at", "difficulty", "category"])
    for r in rows:
        writer.writerow([r["topic_id"], r["problem_name"], r["completed"],
                         r["completed_at"] or "", r["difficulty"] or "", r["category"] or ""])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=dsa_progress_{user_id}.csv"},
    )


@app.post("/import")
async def import_progress(user_id: str = Form(...), file: UploadFile = File(...)):
    pool = _pool()
    content = await file.read()
    csv_data = csv.DictReader(io.StringIO(content.decode()))
    imported = 0
    errors = []
    async with pool.acquire() as conn:
        for row in csv_data:
            try:
                completed_at = (datetime.fromisoformat(row["completed_at"])
                                if row.get("completed_at") else None)
                await conn.execute("""
                    INSERT INTO public.dsa_progress
                        (user_id, topic_id, problem_name, completed, completed_at, difficulty, category)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (user_id, topic_id, problem_name) DO UPDATE SET
                        completed = EXCLUDED.completed, completed_at = EXCLUDED.completed_at,
                        difficulty = EXCLUDED.difficulty, category = EXCLUDED.category
                """, user_id, row.get("topic_id", ""), row.get("problem_name", ""),
                    row.get("completed", "").lower() == "true",
                    completed_at, row.get("difficulty", ""), row.get("category", ""))
                imported += 1
            except Exception as e:
                errors.append(f"Row {imported + 1}: {str(e)}")
    await update_analytics(pool, user_id)
    return {"imported": imported, "errors": errors}


# ================================================================
#  ROUTES - Feedback & AI Chatbot
# ================================================================

@app.post("/feedback/generate-suggestions")
async def generate_suggestions_endpoint(feedback: FeedbackRequest, user_id: str = Depends(verify_request_user_id)):
    if str(feedback.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    print(f"AI SUGGESTIONS - Problem: {feedback.problem_name}, Rating: {feedback.rating}/5")
    suggestions = await generate_enhanced_ai_suggestions(feedback)
    await update_feedback_suggestions(feedback.feedback_id, suggestions)
    return {"success": True, "message": "AI suggestions generated successfully", "suggestions": suggestions.dict()}


@app.post("/feedback/chatbot-response")
async def chatbot_response_endpoint(request: ChatbotRequest):
    query_lower = request.query.lower()
    feedback_keywords = ["feedback", "progress", "history", "review", "analyze", "problems solved"]
    is_feedback_query = any(kw in query_lower for kw in feedback_keywords)
    feedback_selection = None
    m = re.search(r"\b(\d+)\b", request.query)
    if m:
        feedback_selection = int(m.group(1))

    feedback_history = await get_user_feedback_history(request.user_id)
    count = len(feedback_history)

    # Selected specific feedback
    if feedback_selection and feedback_selection <= count:
        fb = feedback_history[feedback_selection - 1]
        text = (
            f"Analyzing Feedback #{feedback_selection}\n\n"
            f"**Problem:** {fb.get('problem_name', 'Unknown')}\n"
            f"**Difficulty:** {fb.get('difficulty', 'Unknown')}\n"
            f"**Rating:** {fb.get('rating', 0)}/5\n\n"
        )
        ai = fb.get("ai_suggestions")
        if ai:
            text += "**Suggested Approaches:**\n"
            for s in (ai.get("approach_suggestions") or [])[:3]:
                text += f"- {s}\n"
            text += "\n**Recommended Next Steps:**\n"
            for p in (ai.get("similar_problems") or [])[:3]:
                text += f"- {p}\n"
        return {"response": text, "source": "feedback_analysis", "suggestions": [], "feedbackCount": count}

    # Listing feedbacks
    if is_feedback_query:
        if count == 0:
            return {"response": "No feedback yet!", "source": "feedback_info", "suggestions": [], "feedbackCount": 0}
        text = f"**You have {count} feedback(s):**\n\n"
        for i, fb in enumerate(feedback_history[:10], 1):
            d = fb.get("difficulty", "")
            emoji = "Easy" if d == "Easy" else ("Medium" if d == "Medium" else "Hard")
            text += f"{i}. [{emoji}] **{fb.get('problem_name')}** ({fb.get('rating')}/5)\n"
        text += f"\nReply with a number (1-{min(count, 10)}) to analyze in detail!"
        return {"response": text, "source": "feedback_list",
                "suggestions": [f"Analyze feedback #{i+1}" for i in range(min(3, count))],
                "feedbackCount": count}

    # General query
    resp = await generate_contextual_chatbot_response(request.query, request.user_id, [])
    if count > 0:
        resp.response += f"\n\nTip: You have {count} feedback(s). Ask me about them!"
    return resp


@app.get("/feedback/history/{user_id}")
async def get_feedback_history(user_id: str, limit: int = 10):
    history = await get_user_feedback_history(user_id, limit)
    return {"success": True, "feedbacks": history}


@app.post("/feedback/youtube-recommendations")
async def get_youtube_recommendations(request: dict):
    problem_name = request.get("problemName", "Unknown")
    difficulty = request.get("difficulty", "Unknown")
    category = request.get("category", "Unknown")
    youtube_api_key = os.getenv("YOUTUBE_API_KEY")
    if not youtube_api_key:
        return {"success": True, "videos": [], "message": "YouTube API key not configured"}
    search_query = f"{category} {problem_name} {difficulty} tutorial solution"
    try:
        from googleapiclient.discovery import build
        youtube = build("youtube", "v3", developerKey=youtube_api_key)
        search_resp = youtube.search().list(
            q=search_query, part="id,snippet", maxResults=5,
            type="video", order="relevance", videoDuration="medium",
        ).execute()
        recs = []
        for item in search_resp.get("items", []):
            vid_id = item["id"]["videoId"]
            snip = item["snippet"]
            vid_resp = youtube.videos().list(part="contentDetails,statistics", id=vid_id).execute()
            duration, views = "N/A", 0
            if vid_resp["items"]:
                duration = vid_resp["items"][0]["contentDetails"]["duration"]
                views = int(vid_resp["items"][0]["statistics"].get("viewCount", 0))
            recs.append({
                "title": snip["title"], "description": snip["description"][:150] + "...",
                "url": f"https://www.youtube.com/watch?v={vid_id}",
                "thumbnail": snip["thumbnails"]["high"]["url"],
                "duration": duration, "views": views,
                "channelTitle": snip["channelTitle"], "relevanceScore": 0.9,
            })
        return {"success": True, "videos": recs, "count": len(recs)}
    except Exception as e:
        return {"success": False, "videos": [], "error": str(e)}


# ================================================================
#  RUN
# ================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
