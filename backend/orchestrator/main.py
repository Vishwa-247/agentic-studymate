"""
Orchestrator Service - Main FastAPI Application
Port: 8011

Endpoint: GET /next?user_id=UUID
Returns the next module user should work on based on their weakness scores.
Module names align with frontend OrchestratorCard MODULE_CONFIG.

v2.0: Unified logic — weakness-based rules + LLM reasoning (Decision 2).
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import asyncpg
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sys
from pathlib import Path

# Add parent directory to path for shared imports
backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root))

from state import fetch_user_state, update_next_module
from rules import decide, get_module_description, get_weakness_trigger
from shared.memory import UserMemory, create_user_memory

# Load environment variables
backend_root = Path(__file__).parent.parent
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Database / LLM configuration
DB_URL = os.getenv("SUPABASE_DB_URL", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


# Pydantic Models
class NextModuleResponse(BaseModel):
    next_module: str
    reason: str
    description: str = ""
    memory_context: str = ""
    weakness_trigger: Optional[str] = None
    scores: Optional[dict] = None


class MemoryEventRequest(BaseModel):
    """Request body for recording memory events."""
    event_type: str
    module: str
    observation: str
    metric_name: str | None = None
    metric_value: float | None = None
    tags: list[str] | None = None


class HealthResponse(BaseModel):
    status: str
    service: str
    database: str


class UserStateResponse(BaseModel):
    user_id: str
    clarity_avg: float
    tradeoff_avg: float
    adaptability_avg: float
    failure_awareness_avg: float
    dsa_predict_skill: float
    next_module: str | None


# ── LLM Reasoning (Decision 2: Rules determine WHAT, LLM explains WHY) ──

async def generate_llm_reason(
    pool: asyncpg.Pool,
    user_id: str,
    next_module: str,
    rule_reason: str,
    scores: dict,
) -> str:
    """Call Groq to generate a human-readable explanation."""
    if not GROQ_API_KEY:
        return rule_reason

    # Fetch onboarding context for personalization
    target_role = None
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT target_role, primary_focus FROM user_onboarding WHERE user_id = $1",
                user_id,
            )
            if row:
                target_role = row.get("target_role")
    except Exception:
        pass

    scores_str = ", ".join(f"{k}: {v:.2f}" for k, v in scores.items() if v is not None)
    context = f"Scores: {scores_str}"
    if target_role:
        context += f"\nTarget role: {target_role}"

    prompt = f"""You are a career coach for a student using StudyMate, an AI learning platform.
The orchestrator chose "{next_module}" because: {rule_reason}
{context}

Write 2 concise sentences:
1) What specific pattern you noticed in their data
2) Why this module will help them improve

Be specific, encouraging, and mention their target role if available.
No preamble, no bullet points — just the 2 sentences."""

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 150,
                },
            )
            if resp.status_code == 200:
                content = resp.json()["choices"][0]["message"]["content"].strip()
                if content:
                    return content
    except Exception as e:
        logger.warning(f"LLM reasoning failed: {e}")

    return rule_reason


# Lifespan for connection pool management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage connection pool lifecycle."""
    # Startup
    if not DB_URL:
        logger.error("SUPABASE_DB_URL not set!")
        app.state.pool = None
    else:
        try:
            app.state.pool = await asyncpg.create_pool(
                dsn=DB_URL,
                min_size=2,
                max_size=10,
                command_timeout=30,
                statement_cache_size=0  # For PgBouncer compatibility
            )
            logger.info("✅ Database connection pool created")
        except Exception as e:
            logger.error(f"❌ Failed to create connection pool: {e}")
            app.state.pool = None
    
    yield
    
    # Shutdown
    if app.state.pool:
        await app.state.pool.close()
        logger.info("Database connection pool closed")


# FastAPI App
app = FastAPI(
    title="StudyMate Orchestrator Service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Routes ============

@app.get("/")
async def root():
    return {
        "service": "StudyMate Orchestrator",
        "version": "1.1.0",
        "port": 8011,
        "description": "Deterministic rule-based routing engine with memory",
        "features": ["rules-based routing", "user memory", "pattern detection"]
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    db_status = "connected" if app.state.pool else "disconnected"
    return HealthResponse(
        status="healthy" if app.state.pool else "degraded",
        service="orchestrator",
        database=db_status
    )


@app.get("/next", response_model=NextModuleResponse)
async def get_next_module(user_id: str = Query(..., description="User UUID")):
    """
    Get the next module for a user based on their weakness scores.
    
    Flow:
    1. Fetch user_state (auto-initializes if missing)
    2. Run deterministic rules
    3. LLM generates human-readable explanation (Decision 2)
    4. Update next_module in DB
    5. Return result with scores for transparency
    """
    pool = app.state.pool
    
    if not pool:
        logger.error("Database pool not available")
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Step 1: Fetch user state (auto-initializes for new users)
    state = await fetch_user_state(pool, user_id)
    logger.info(f"Fetched state for {user_id}: clarity={state.get('clarity_avg')}, "
                f"tradeoffs={state.get('tradeoff_avg')}, adaptability={state.get('adaptability_avg')}, "
                f"failure_awareness={state.get('failure_awareness_avg')}")
    
    # Step 2: Run deterministic rules
    next_module, rule_reason = decide(state)
    logger.info(f"Decision for {user_id}: {next_module} ({rule_reason})")
    
    # Step 3: Build scores dict
    scores = {
        "clarity_avg": state.get("clarity_avg", 1.0),
        "tradeoff_avg": state.get("tradeoff_avg", 1.0),
        "adaptability_avg": state.get("adaptability_avg", 1.0),
        "failure_awareness_avg": state.get("failure_awareness_avg", 1.0),
        "dsa_predict_skill": state.get("dsa_predict_skill", 1.0),
    }
    weakness_trigger = get_weakness_trigger(state)
    
    # Step 4: LLM reasoning (Decision 2)
    llm_reason = await generate_llm_reason(pool, user_id, next_module, rule_reason, scores)
    logger.info(f"LLM reason for {user_id}: {llm_reason[:80]}...")
    
    # Step 5: Get memory context
    memory = create_user_memory(user_id, pool)
    memory_context = await memory.get_weakness_summary()
    
    # Step 6: Update next_module in DB
    await update_next_module(pool, user_id, next_module)
    
    return NextModuleResponse(
        next_module=next_module,
        reason=llm_reason,
        description=get_module_description(next_module),
        memory_context=memory_context,
        weakness_trigger=weakness_trigger,
        scores=scores,
    )


@app.get("/state/{user_id}", response_model=UserStateResponse)
async def get_state(user_id: str):
    """
    Get current user state (for debugging/admin).
    """
    pool = app.state.pool
    
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    state = await fetch_user_state(pool, user_id)
    
    return UserStateResponse(
        user_id=user_id,
        clarity_avg=state.get("clarity_avg", 1.0),
        tradeoff_avg=state.get("tradeoff_avg", 1.0),
        adaptability_avg=state.get("adaptability_avg", 1.0),
        failure_awareness_avg=state.get("failure_awareness_avg", 1.0),
        dsa_predict_skill=state.get("dsa_predict_skill", 1.0),
        next_module=state.get("next_module")
    )


# ============ Memory Endpoints (NEW) ============

@app.post("/memory/{user_id}/record")
async def record_memory_event(user_id: str, event: MemoryEventRequest):
    """
    Record a memory event for a user.
    Use this after interviews, course completions, etc.
    """
    pool = app.state.pool
    
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    memory = create_user_memory(user_id, pool)
    event_id = await memory.record_event(
        event_type=event.event_type,
        module=event.module,
        observation=event.observation,
        metric_name=event.metric_name,
        metric_value=event.metric_value,
        tags=event.tags
    )
    
    if not event_id:
        raise HTTPException(status_code=500, detail="Failed to record event")
    
    return {"status": "ok", "event_id": event_id}


@app.get("/memory/{user_id}")
async def get_memory_context(user_id: str):
    """
    Get memory context for a user.
    Returns weakness summary, recent events, and patterns.
    """
    pool = app.state.pool
    
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    memory = create_user_memory(user_id, pool)
    context = await memory.get_orchestrator_context()
    
    return context


@app.get("/memory/{user_id}/summary")
async def get_weakness_summary(user_id: str):
    """
    Get text summary of user weaknesses.
    Useful for LLM context injection.
    """
    pool = app.state.pool
    
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    memory = create_user_memory(user_id, pool)
    summary = await memory.get_weakness_summary()
    
    return {"user_id": user_id, "summary": summary}


@app.post("/memory/{user_id}/update-patterns")
async def trigger_pattern_update(user_id: str):
    """
    Trigger pattern analysis for a user.
    Call this after recording multiple events.
    """
    pool = app.state.pool
    
    if not pool:
        raise HTTPException(status_code=503, detail="Database not available")
    
    memory = create_user_memory(user_id, pool)
    count = await memory.update_patterns()
    
    return {"status": "ok", "patterns_updated": count}


# ============ Run Server ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8011)
