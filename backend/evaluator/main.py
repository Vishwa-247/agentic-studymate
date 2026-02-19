"""
Evaluator Service - Main FastAPI Application
Port: 8010

Endpoint: POST /evaluate
Receives user answers, scores them via LLM, stores to DB, updates user_state.

Execution Flow (in order):
1. INSERT INTO interactions
2. Call LLM → get scores
3. INSERT INTO scores
4. UPDATE user_state (SQL aggregation)
5. Return {"status": "ok"}
"""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import asyncpg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scorer import score
from aggregator import update_user_state

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

# Database configuration
DB_URL = os.getenv("SUPABASE_DB_URL", "")


# Pydantic Models
class EvaluationRequest(BaseModel):
    user_id: str
    module: str
    question: str
    answer: str


class EvaluationResponse(BaseModel):
    status: str = "ok"


class HealthResponse(BaseModel):
    status: str
    service: str
    database: str


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
    title="StudyMate Evaluator Service",
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


# ============ Helper Functions ============

async def save_interaction(
    pool: asyncpg.Pool,
    user_id: str,
    module: str,
    question: str,
    answer: str,
    step_type: str = "core"
) -> bool:
    """Save raw interaction to database."""
    try:
        async with pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO public.interactions 
                (user_id, module, step_type, question, user_answer)
                VALUES ($1, $2, $3, $4, $5)
            """, user_id, module, step_type, question, answer)
            logger.info(f"Saved interaction for user {user_id} in module {module}")
            return True
    except Exception as e:
        logger.error(f"Failed to save interaction: {e}")
        return False


async def save_scores(
    pool: asyncpg.Pool,
    user_id: str,
    module: str,
    scores: dict
) -> bool:
    """Save evaluation scores to database."""
    try:
        async with pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO public.scores 
                (user_id, module, clarity, tradeoffs, adaptability, failure_awareness, dsa_predict)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """, 
                user_id, 
                module,
                scores.get("clarity"),
                scores.get("tradeoffs"),
                scores.get("adaptability"),
                scores.get("failure_awareness"),
                scores.get("dsa_predict")
            )
            logger.info(f"Saved scores for user {user_id}: {scores}")
            return True
    except Exception as e:
        logger.error(f"Failed to save scores: {e}")
        return False


# ============ Routes ============

@app.get("/")
async def root():
    return {
        "service": "StudyMate Evaluator",
        "version": "1.0.0",
        "port": 8010
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    db_status = "connected" if app.state.pool else "disconnected"
    return HealthResponse(
        status="healthy" if app.state.pool else "degraded",
        service="evaluator",
        database=db_status
    )


@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate(req: EvaluationRequest):
    """
    Evaluate a user's answer.
    
    Flow:
    1. Save interaction
    2. Score via LLM
    3. Save scores
    4. Update user_state aggregation
    5. Return {"status": "ok"}
    
    Never blocks frontend - returns "ok" even on internal failures.
    """
    pool = app.state.pool
    
    if not pool:
        logger.error("Database pool not available")
        # Still return ok - don't block frontend
        return EvaluationResponse(status="ok")
    
    # Step 1: Save interaction
    await save_interaction(
        pool, 
        req.user_id, 
        req.module, 
        req.question, 
        req.answer
    )
    
    # Step 2: Score via LLM
    try:
        scores = await score(req.question, req.answer)
        logger.info(f"LLM scores: {scores}")
    except Exception as e:
        logger.error(f"Scoring failed: {e}")
        scores = {
            "clarity": None,
            "tradeoffs": None,
            "adaptability": None,
            "failure_awareness": None,
            "dsa_predict": None
        }
    
    # Step 3: Save scores
    await save_scores(pool, req.user_id, req.module, scores)
    
    # Step 4: Update user_state
    await update_user_state(pool, req.user_id)
    
    # Step 5: Return ok (never fail to frontend)
    return EvaluationResponse(status="ok")


# ============ Run Server ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)
