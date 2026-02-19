"""
StudyMate API Gateway — Consolidated Edition
=============================================
All traffic flows through here.  Thin services (evaluator, orchestrator,
job-search) are embedded directly; heavier services (interview-coach,
resume-analyzer, profile-service, course-generation) are still proxied.

Ports removed (merged here):
  8010 evaluator     → POST /api/evaluate
  8011 orchestrator  → GET  /api/next  +  /api/state  +  /api/memory/*
  8013 job-search    → POST /api/job-search/search-and-match

Ports still proxied:
  8002 interview-coach
  8003 resume-analyzer
  8004 dsa-service
  8006 profile-service
  8008 course-generation
"""

import asyncio
import json
import logging
import os
import re
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import asyncpg
import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

# ── Load .env from backend root ────────────────────────────────────
backend_root = Path(__file__).parent.parent
import sys
sys.path.insert(0, str(backend_root))
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Orchestrator v2 Engine ─────────────────────────────────────────
from orchestrator.config import MODULES as ORCH_MODULES, load_config as orch_load_config
from orchestrator.engine import DecisionEngine
from orchestrator.models import SkillScores, UserState, Decision
from orchestrator.state_manager import StateManager
from orchestrator.circuit_breaker import CircuitBreakerRegistry
from orchestrator.service_registry import ServiceRegistry
from orchestrator.metrics import MetricsCollector as OrchMetrics
try:
    from shared.memory import create_user_memory
    HAS_MEMORY = True
except ImportError:
    HAS_MEMORY = False

# ══════════════════════════════════════════════════════════════════
#  EMBEDDED MODULES — evaluator / orchestrator / job-search
# ══════════════════════════════════════════════════════════════════

# ── Evaluator: prompts ─────────────────────────────────────────────
SCORING_PROMPT_TEMPLATE = """You are evaluating a user's answer to a technical reasoning question.
Your job is to judge the user's thinking quality, not correctness.

Question:
{question}

User Answer:
{answer}

Evaluate the answer across the following five dimensions.
Each score must be between 0.0 and 1.0 with two decimals.

1. clarity – clear, structured communication
2. tradeoffs – awareness of alternatives and consequences
3. adaptability – ability to adjust when conditions change
4. failure_awareness – considers edge cases and failure modes
5. dsa_predict – algorithm reasoning (null if irrelevant)

Output JSON only. No explanation.

{{"clarity": 0.00, "tradeoffs": 0.00, "adaptability": 0.00, "failure_awareness": 0.00, "dsa_predict": null}}"""

SCORE_FIELDS = ["clarity", "tradeoffs", "adaptability", "failure_awareness", "dsa_predict"]


def _build_scoring_prompt(question: str, answer: str) -> str:
    return SCORING_PROMPT_TEMPLATE.format(question=question, answer=answer)


def _extract_json_block(text: str) -> Optional[str]:
    for pattern in [r'\{[^{}]*"clarity"[^{}]*\}', r'\{[\s\S]*?\}']:
        m = re.search(pattern, text, re.DOTALL)
        if m:
            return m.group(0)
    return None


def _parse_scores(content: str) -> Dict[str, Optional[float]]:
    scores: Dict[str, Optional[float]] = {f: None for f in SCORE_FIELDS}
    for raw in [content.strip(), _extract_json_block(content) or ""]:
        try:
            data = json.loads(raw)
            for f in SCORE_FIELDS:
                if f in data and data[f] is not None:
                    scores[f] = float(data[f])
            return scores
        except (json.JSONDecodeError, ValueError):
            continue
    return scores


# ── Evaluator: LLM calls ──────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


async def _llm_score(question: str, answer: str) -> Dict[str, Optional[float]]:
    """Score an answer via Groq LLM."""
    if not GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set — returning null scores")
        return {f: None for f in SCORE_FIELDS}
    prompt = _build_scoring_prompt(question, answer)
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
                json={"model": GROQ_MODEL, "messages": [{"role": "user", "content": prompt}],
                      "temperature": 0.1, "max_tokens": 500},
            )
            if resp.status_code != 200:
                logger.error(f"Groq error {resp.status_code}: {resp.text[:200]}")
                return {f: None for f in SCORE_FIELDS}
            content = resp.json()["choices"][0]["message"]["content"]
            return _parse_scores(content)
    except Exception as e:
        logger.error(f"LLM scoring failed: {e}")
        return {f: None for f in SCORE_FIELDS}


# ── Evaluator: DB helpers ─────────────────────────────────────────

async def _save_interaction(pool: asyncpg.Pool, user_id: str, module: str,
                            question: str, answer: str) -> bool:
    try:
        async with pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO public.interactions (user_id, module, step_type, question, user_answer)
                VALUES ($1, $2, 'core', $3, $4)
            """, user_id, module, question, answer)
        return True
    except Exception as e:
        logger.error(f"save_interaction failed: {e}")
        return False


async def _save_scores(pool: asyncpg.Pool, user_id: str, module: str,
                       scores: dict) -> bool:
    try:
        async with pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO public.scores
                    (user_id, module, clarity, tradeoffs, adaptability, failure_awareness, dsa_predict)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """, user_id, module,
                scores.get("clarity"), scores.get("tradeoffs"),
                scores.get("adaptability"), scores.get("failure_awareness"),
                scores.get("dsa_predict"))
        return True
    except Exception as e:
        logger.error(f"save_scores failed: {e}")
        return False


async def _update_user_state_agg(pool: asyncpg.Pool, user_id: str) -> bool:
    try:
        async with pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO public.user_state (user_id) VALUES ($1)
                ON CONFLICT (user_id) DO NOTHING
            """, user_id)
            await conn.execute("""
                UPDATE public.user_state us SET
                    clarity_avg          = COALESCE(sub.c, us.clarity_avg),
                    tradeoff_avg         = COALESCE(sub.t, us.tradeoff_avg),
                    adaptability_avg     = COALESCE(sub.a, us.adaptability_avg),
                    failure_awareness_avg= COALESCE(sub.f, us.failure_awareness_avg),
                    dsa_predict_skill    = COALESCE(sub.d, us.dsa_predict_skill),
                    last_update          = NOW()
                FROM (
                    SELECT user_id,
                           AVG(clarity) c, AVG(tradeoffs) t, AVG(adaptability) a,
                           AVG(failure_awareness) f, AVG(dsa_predict) d
                    FROM public.scores WHERE user_id = $1 GROUP BY user_id
                ) sub
                WHERE us.user_id = sub.user_id
            """, user_id)
        return True
    except Exception as e:
        logger.error(f"update_user_state failed: {e}")
        return False


# ── Orchestrator v2: production engine (replaces old inline rules) ──
# The old _decide() threshold rules are now in orchestrator/engine.py
# as a weighted multi-signal decision engine with:
#   - 5-signal scoring (weakness severity, rate of change, recency,
#     goal alignment, pattern signal)
#   - Circuit breakers per downstream service
#   - Diversity filter to prevent repeat recommendations
#   - Full decision audit trail with explainability
#   - Service health awareness
WEAKNESS_THRESHOLD = 0.4  # kept for backward compat references
MODULE_DESCRIPTIONS = {m: d.description for m, d in ORCH_MODULES.items()}


async def _generate_llm_reason_v2(
    decision: Decision,
    target_role: str = None,
    primary_focus: str = None,
) -> str:
    """LLM reasoning via the production orchestrator engine (Decision 2 pattern)."""
    if not GROQ_API_KEY:
        return decision.rule_reason

    scores_str = ", ".join(f"{k}: {v:.2f}" for k, v in (decision.scores or {}).items())
    context = f"Scores: {scores_str}"
    if target_role:
        context += f"\nTarget role: {target_role}"
    if primary_focus:
        context += f"\nPrimary focus: {primary_focus}"

    prompt = f"""You are a career coach for a student using StudyMate, an AI learning platform.
The orchestrator chose "{decision.next_module}" (confidence: {decision.confidence:.0%}).
Rule reason: {decision.rule_reason}
Decision depth: {decision.depth.value}
{context}

Write 2 concise sentences:
1) What specific pattern you noticed in their data
2) Why this module will help them improve

Be specific, encouraging, and mention their target role if available.
No preamble, no bullet points — just the 2 sentences."""

    try:
        resp_text = await _llm_call_with_fallback(
            [{"role": "user", "content": prompt}],
            temperature=0.3,
            json_mode=False,
        )
        if resp_text:
            return resp_text
    except Exception as e:
        logger.warning(f"LLM reasoning failed: {e}")

    return decision.rule_reason


# ══════════════════════════════════════════════════════════════════
#  FastAPI App — Lifespan (DB pool)
# ══════════════════════════════════════════════════════════════════

DB_URL = os.getenv("SUPABASE_DB_URL", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Database pool
    if DB_URL:
        try:
            app.state.pool = await asyncpg.create_pool(
                dsn=DB_URL, min_size=2, max_size=10,
                command_timeout=30, statement_cache_size=0,
            )
            logger.info("✅ Gateway DB pool created")
        except Exception as e:
            logger.error(f"❌ DB pool failed: {e}")
            app.state.pool = None
    else:
        logger.warning("⚠️  SUPABASE_DB_URL not set — evaluator/orchestrator will be degraded")
        app.state.pool = None

    # 2. Orchestrator v2 subsystems
    orch_config = orch_load_config()
    app.state.orch_engine = DecisionEngine(orch_config)
    app.state.orch_cb = CircuitBreakerRegistry(
        failure_threshold=orch_config.cb_failure_threshold,
        recovery_timeout_s=orch_config.cb_recovery_timeout_s,
        half_open_max_calls=orch_config.cb_half_open_max_calls,
    )
    app.state.orch_registry = ServiceRegistry(orch_config, app.state.orch_cb)
    await app.state.orch_registry.start_monitoring()
    app.state.orch_metrics = OrchMetrics(buffer_size=orch_config.metrics_buffer_size)
    app.state.orch_state_mgr = StateManager(app.state.pool) if app.state.pool else None
    logger.info(
        "✅ Orchestrator v2 engine ready "
        f"(weighted multi-signal, {orch_config.cb_failure_threshold}-fail circuit breaker)"
    )

    yield

    # Shutdown
    await app.state.orch_registry.stop_monitoring()
    if getattr(app.state, "pool", None):
        await app.state.pool.close()


app = FastAPI(
    title="StudyMate API Gateway — Consolidated",
    version="3.0.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
_CORS_ALLOW_ALL = _raw_origins.strip() == "*"
if _CORS_ALLOW_ALL:
    ALLOWED_ORIGINS = ["*"]
else:
    ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]
ALLOWED_ORIGIN_REGEX = os.getenv("ALLOWED_ORIGIN_REGEX", r"^https://.*\.lovable\.app$")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=None if _CORS_ALLOW_ALL else ALLOWED_ORIGIN_REGEX,
    allow_credentials=not _CORS_ALLOW_ALL,  # credentials + '*' is invalid per spec
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request logging ───────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = datetime.now()
    path = request.url.path
    method = request.method
    try:
        response = await call_next(request)
        dt = (datetime.now() - start).total_seconds()
        logger.info(f"{method} {path} -> {response.status_code} ({dt:.2f}s)")
        return response
    except Exception as e:
        logger.error(f"{method} {path} ERROR: {e}")
        raise


# ══════════════════════════════════════════════════════════════════
#  Service Registry (only proxied services remain)
# ══════════════════════════════════════════════════════════════════

AGENT_SERVICES = {
    "interview-coach":   os.getenv("INTERVIEW_COACH_URL",   "http://127.0.0.1:8002"),
    "resume-analyzer":   os.getenv("RESUME_ANALYZER_URL",   "http://127.0.0.1:8003"),
    "dsa-service":       os.getenv("DSA_SERVICE_URL",       "http://127.0.0.1:8004"),
    "profile-service":   os.getenv("PROFILE_SERVICE_URL",   "http://127.0.0.1:8006"),
    "course-generation": os.getenv("COURSE_GENERATION_URL", "http://127.0.0.1:8008"),
    "project-studio":   os.getenv("PROJECT_STUDIO_URL",    "http://127.0.0.1:8012"),
}


# ── Auth / JWT ─────────────────────────────────────────────────────
security = HTTPBearer(auto_error=False)
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")  # from Supabase Dashboard → Settings → API → JWT Secret


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=24))
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify a bearer token. Tries Supabase JWT first, then falls back to legacy gateway JWT."""
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = credentials.credentials

    # 1. Try Supabase JWT (primary auth path)
    if SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
            user_id: str = payload.get("sub")
            if user_id:
                return user_id
        except JWTError:
            pass  # fall through to legacy

    # 2. Fallback: legacy gateway JWT (backward compatibility)
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("uid") or payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def resolve_user_uuid_by_email(email: str) -> Optional[str]:
    if not (SUPABASE_URL and SUPABASE_SERVICE_KEY):
        return None
    try:
        url = f"{SUPABASE_URL}/auth/v1/admin/users"
        headers = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers, params={"email": email})
            if resp.status_code != 200:
                return None
            data = resp.json()
            users = data.get("users") if isinstance(data, dict) else data
            if isinstance(users, list) and users:
                return users[0].get("id")
    except Exception:
        pass
    return None


# ── Forwarding helper ─────────────────────────────────────────────
async def forward_to_agent(agent_name: str, path: str, method: str = "GET",
                           data: dict = None, headers: dict = None):
    if agent_name not in AGENT_SERVICES:
        raise HTTPException(status_code=404, detail=f"Service '{agent_name}' not found")
    url = f"{AGENT_SERVICES[agent_name]}{path}"
    fwd = headers or {}
    async with httpx.AsyncClient(timeout=60.0) as client:
        if method == "GET":
            r = await client.get(url, headers=fwd)
        elif method == "POST":
            r = await client.post(url, json=data, headers=fwd)
        elif method == "PUT":
            r = await client.put(url, json=data, headers=fwd)
        elif method == "DELETE":
            r = await client.delete(url, headers=fwd)
        else:
            raise HTTPException(status_code=405)
    return JSONResponse(content=r.json(), status_code=r.status_code)


# ── CORS preflight helper ─────────────────────────────────────────
def _is_origin_allowed(origin: str) -> bool:
    if not origin:
        return False
    if _CORS_ALLOW_ALL:
        return True
    if origin in ALLOWED_ORIGINS:
        return True
    try:
        return re.match(ALLOWED_ORIGIN_REGEX, origin) is not None
    except re.error:
        return False


def _preflight_headers(request: Request, methods: str) -> dict:
    origin = request.headers.get("origin", "")
    h = {
        "Access-Control-Allow-Methods": methods,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
    if _CORS_ALLOW_ALL:
        h["Access-Control-Allow-Origin"] = "*"
    elif _is_origin_allowed(origin):
        h["Access-Control-Allow-Origin"] = origin
        h["Access-Control-Allow-Credentials"] = "true"
        h["Vary"] = "Origin"
    return h


@app.options("/{full_path:path}")
async def options_any(full_path: str, request: Request):
    return Response(content="OK", status_code=200,
                    headers=_preflight_headers(request, "GET, POST, PUT, DELETE, OPTIONS"))


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Health & Root
# ══════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "message": "StudyMate API Gateway — Consolidated",
        "version": "3.0.0",
        "services": list(AGENT_SERVICES.keys()),
        "embedded": ["evaluator", "orchestrator", "job-search"],
    }


@app.get("/health")
async def health_check():
    """Health check with parallel service polling (2s timeout per service)."""
    
    async def check_service(name: str, url: str) -> tuple:
        """Check a single service health in parallel."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                r = await client.get(f"{url}/health")
                return (name, {"status": "healthy" if r.status_code == 200 else "unhealthy",
                              "response_code": r.status_code})
        except Exception as e:
            return (name, {"status": "unhealthy", "error": str(e)[:100]})
    
    # Parallel health checks for all agent services
    checks = [check_service(name, url) for name, url in AGENT_SERVICES.items()]
    results = await asyncio.gather(*checks, return_exceptions=True)
    
    service_health = {}
    for result in results:
        if isinstance(result, tuple):
            name, health_data = result
            service_health[name] = health_data
        else:
            # Handle exception from gather
            service_health["unknown"] = {"status": "error", "error": str(result)[:100]}

    # Embedded services health
    db_ok = getattr(app.state, "pool", None) is not None
    service_health["evaluator"] = {"status": "healthy" if db_ok else "degraded", "embedded": True}
    service_health["orchestrator"] = {
        "status": "healthy" if db_ok else "degraded",
        "embedded": True,
        "version": "2.0.0",
        "engine": "weighted-multi-signal",
        "metrics": app.state.orch_metrics.health_summary(),
        "circuit_breakers": app.state.orch_cb.all_status(),
    }
    service_health["job-search"] = {"status": "healthy", "embedded": True}

    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat(),
            "services": service_health, "database": "connected" if db_ok else "disconnected"}


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Auth
# ══════════════════════════════════════════════════════════════════

@app.post("/auth/signin")
async def sign_in(credentials: dict):
    """Legacy gateway sign-in. Now validates Supabase token if provided."""
    # If a supabase_token is provided, validate it and return user info
    supabase_token = credentials.get("supabase_token")
    if supabase_token and SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                supabase_token, SUPABASE_JWT_SECRET,
                algorithms=["HS256"], audience="authenticated",
            )
            uid = payload.get("sub")
            email = payload.get("email", "")
            access_token = create_access_token(data={"sub": email, "uid": uid})
            return {"access_token": access_token, "token_type": "bearer",
                    "user": {"id": uid, "email": email, "name": email.split("@")[0].title()}}
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid Supabase token")

    # Legacy email/password path (kept for backward compatibility)
    email = credentials.get("email")
    password = credentials.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password (or supabase_token) required")
    uid = await resolve_user_uuid_by_email(email)
    if not uid:
        raise HTTPException(status_code=401, detail="User not found")
    token_payload = {"sub": email, "uid": uid}
    access_token = create_access_token(data=token_payload)
    return {"access_token": access_token, "token_type": "bearer",
            "user": {"id": uid, "email": email, "name": email.split("@")[0].title()}}


@app.post("/auth/signup")
async def sign_up(user_data: dict):
    """Legacy sign-up. Users should sign up via Supabase Auth directly."""
    raise HTTPException(
        status_code=410,
        detail="Direct gateway sign-up is disabled. Please sign up via the app (Supabase Auth).",
    )


@app.post("/auth/signout")
async def sign_out(user_id: str = Depends(verify_token)):
    return {"message": "Signed out successfully"}


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Courses (proxied -> 8008)
# ══════════════════════════════════════════════════════════════════

@app.post("/courses/generate")
async def generate_course(course_data: dict, user_id: str = Depends(verify_token)):
    course_data["user_id"] = user_id
    return await forward_to_agent("course-generation", "/generate", "POST", course_data)


@app.post("/courses/generate-parallel")
async def generate_course_parallel(course_data: dict, request: Request, user_id: str = Depends(verify_token)):
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("course-generation", "/generate-course-parallel", "POST", course_data, headers)


@app.get("/courses")
async def get_courses(request: Request, user_id: str = Depends(verify_token)):
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("course-generation", "/courses", "GET", headers=headers)


@app.get("/courses/{course_id}")
async def get_course(course_id: str, request: Request, user_id: str = Depends(verify_token)):
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("course-generation", f"/courses/{course_id}", "GET", headers=headers)


@app.get("/courses/{course_id}/content")
async def get_course_content(course_id: str, request: Request, user_id: str = Depends(verify_token)):
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("course-generation", f"/courses/{course_id}/content", "GET", headers=headers)


@app.delete("/courses/{course_id}")
async def delete_course(course_id: str, request: Request, user_id: str = Depends(verify_token)):
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("course-generation", f"/courses/{course_id}", "DELETE", headers=headers)


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Interviews (proxied -> 8002)
# ══════════════════════════════════════════════════════════════════

@app.post("/interviews/start")
async def start_interview(interview_data: dict, request: Request, user_id: str = Depends(verify_token)):
    interview_data["user_id"] = user_id
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("interview-coach", "/start", "POST", interview_data, headers)


@app.get("/interviews")
async def get_interviews(request: Request, user_id: str = Depends(verify_token)):
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("interview-coach", f"/interviews?user_id={user_id}", "GET", headers=headers)


@app.get("/interviews/{interview_id}")
async def get_interview(interview_id: str, request: Request, user_id: str = Depends(verify_token)):
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("interview-coach", f"/interviews/{interview_id}", "GET", headers=headers)


@app.post("/interviews/{interview_id}/analyze")
async def analyze_interview(interview_id: str, analysis_data: dict, user_id: str = Depends(verify_token)):
    return await forward_to_agent("interview-coach", f"/interviews/{interview_id}/analyze", "POST", analysis_data)


@app.post("/interviews/technical/generate")
async def generate_technical(interview_data: dict, user_id: str = Depends(verify_token)):
    interview_data["user_id"] = user_id
    return await forward_to_agent("interview-coach", "/generate-technical", "POST", interview_data)


@app.post("/interviews/{interview_id}/answer")
async def submit_interview_answer(interview_id: str, request: Request,
                                  user_id: str = Depends(verify_token),
                                  audio: UploadFile | None = File(None),
                                  question_id: str | None = Form(None)):
    try:
        target = f"{AGENT_SERVICES['interview-coach']}/interviews/{interview_id}/answer"
        auth = request.headers.get("Authorization")
        headers = {"Authorization": auth} if auth else {}
        async with httpx.AsyncClient(timeout=60.0) as client:
            if audio is not None:
                files = {"audio": (audio.filename, await audio.read(),
                                   audio.content_type or "application/octet-stream")}
                data = {}
                if question_id is not None:
                    data["question_id"] = question_id
                try:
                    form_data = await request.form()
                    facial_data_str = form_data.get("facial_data")
                    if facial_data_str:
                        data["facial_data"] = facial_data_str
                except Exception:
                    pass
                resp = await client.post(target, headers=headers, files=files, data=data)
            else:
                payload = {"question_id": question_id or "0", "answer": ""}
                resp = await client.post(target, headers=headers, json=payload)
        return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/interviews/generate-aptitude")
async def generate_aptitude(interview_data: dict, user_id: str = Depends(verify_token)):
    interview_data["user_id"] = user_id
    return await forward_to_agent("interview-coach", "/generate-aptitude", "POST", interview_data)


@app.post("/interviews/generate-hr")
async def generate_hr(interview_data: dict, user_id: str = Depends(verify_token)):
    interview_data["user_id"] = user_id
    return await forward_to_agent("interview-coach", "/generate-hr", "POST", interview_data)


# ── Interview Journey (Milestone 2) ───────────────────────────────

@app.post("/api/interview/start")
async def api_interview_start(payload: dict, request: Request, user_id: str = Depends(verify_token)):
    payload["user_id"] = user_id
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("interview-coach", "/api/interview/start", "POST", payload, headers)


@app.post("/api/interview/step")
async def api_interview_step(payload: dict, request: Request, user_id: str = Depends(verify_token)):
    payload["user_id"] = user_id
    auth = request.headers.get("Authorization")
    headers = {"Authorization": auth} if auth else {}
    return await forward_to_agent("interview-coach", "/api/interview/step", "POST", payload, headers)


# ── Voice Interview (adapted from real-time-voicebot) ─────────────

@app.post("/api/interview/voice/start")
async def voice_interview_start(payload: dict, user_id: str = Depends(verify_token)):
    """Start a voice interview session."""
    payload["user_id"] = user_id
    return await forward_to_agent("interview-coach", "/voice/start", "POST", payload)


@app.post("/api/interview/voice/respond")
async def voice_interview_respond(payload: dict, user_id: str = Depends(verify_token)):
    """Send transcript, get AI response."""
    return await forward_to_agent("interview-coach", "/voice/respond", "POST", payload)


@app.post("/api/interview/voice/tts")
async def voice_interview_tts(payload: dict, user_id: str = Depends(verify_token)):
    """Generate TTS audio for response text."""
    url = AGENT_SERVICES["interview-coach"] + "/voice/tts"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            from starlette.responses import Response
            return Response(content=resp.content, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/interview/voice/history/{session_id}")
async def voice_interview_history(session_id: str, user_id: str = Depends(verify_token)):
    """Get voice session conversation history."""
    return await forward_to_agent("interview-coach", f"/voice/history/{session_id}", "GET")


# ── Facial Analysis (proxied -> interview-coach /analysis/*) ──────

@app.post("/interviews/analyze-frame")
async def analyze_frame(payload: dict):
    return await forward_to_agent("interview-coach", "/analysis/analyze-frame", "POST", payload)


@app.post("/interviews/analysis/start-session")
async def start_analysis_session(payload: dict, user_id: str = Depends(verify_token)):
    payload.setdefault("user_id", user_id)
    return await forward_to_agent("interview-coach", "/analysis/start-session", "POST", payload)


@app.post("/interviews/analysis/mark-question")
async def mark_analysis_question(payload: dict, user_id: str = Depends(verify_token)):
    return await forward_to_agent("interview-coach", "/analysis/mark-question", "POST", payload)


@app.post("/interviews/analysis/end-session")
async def end_analysis_session(payload: dict, user_id: str = Depends(verify_token)):
    return await forward_to_agent("interview-coach", "/analysis/end-session", "POST", payload)


@app.get("/interviews/analysis/sessions")
async def list_analysis_sessions(user_id: str = Depends(verify_token)):
    return await forward_to_agent("interview-coach", "/analysis/sessions", "GET")


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Resume (proxied -> 8003)
# ══════════════════════════════════════════════════════════════════

@app.post("/resume/analyze")
async def analyze_resume(resume: UploadFile = File(...), job_role: str = Form(...),
                         job_description: str = Form(""), user_id: Optional[str] = Form(None)):
    async with httpx.AsyncClient(timeout=300.0) as client:
        files = {"resume": (resume.filename, await resume.read(), resume.content_type)}
        data = {"job_role": job_role, "job_description": job_description, "user_id": user_id or ""}
        r = await client.post(f"{AGENT_SERVICES['resume-analyzer']}/analyze-resume", files=files, data=data)
        return JSONResponse(content=r.json(), status_code=r.status_code)


@app.get("/resume/analysis-history/{user_id}")
async def get_resume_analysis_history(user_id: str):
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{AGENT_SERVICES['resume-analyzer']}/analysis-history/{user_id}")
        return r.json()


@app.get("/resume/analysis/{analysis_id}/full")
async def get_resume_analysis_full(analysis_id: str):
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{AGENT_SERVICES['resume-analyzer']}/analysis/{analysis_id}/full")
        return JSONResponse(content=r.json(), status_code=r.status_code)


@app.post("/resume/suggest-roles")
async def suggest_roles(resume_text: str = Form(...)):
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(f"{AGENT_SERVICES['resume-analyzer']}/suggest-roles", data={"resume_text": resume_text})
        return JSONResponse(content=r.json(), status_code=r.status_code)


@app.get("/resume/analysis/{analysis_id}")
async def get_resume_analysis_details(analysis_id: str):
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{AGENT_SERVICES['resume-analyzer']}/analysis/{analysis_id}")
        return r.json()


@app.get("/resume/user-resumes/{user_id}")
async def get_user_resumes(user_id: str):
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{AGENT_SERVICES['resume-analyzer']}/user-resumes/{user_id}")
        return r.json()


@app.post("/resume/extract-profile")
async def extract_profile_data(resume: UploadFile = File(...), user_id: str = Form(...)):
    async with httpx.AsyncClient(timeout=60.0) as client:
        files = {"resume": (resume.filename, await resume.read(), resume.content_type)}
        data = {"user_id": user_id}
        r = await client.post(f"{AGENT_SERVICES['resume-analyzer']}/extract-profile-data", files=files, data=data)
        return r.json()


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Profile (proxied -> 8006)
# ══════════════════════════════════════════════════════════════════

@app.post("/api/profile/extract-profile")
async def extract_profile(resume: UploadFile = File(...), user_id: str = Form(...),
                          user_id_verified: str = Depends(verify_token)):
    async with httpx.AsyncClient(timeout=60.0) as client:
        files = {"resume": (resume.filename, await resume.read(), resume.content_type)}
        data = {"user_id": user_id}
        r = await client.post(f"{AGENT_SERVICES['profile-service']}/extract-profile", files=files, data=data)
        return r.json()


@app.get("/api/profile/{user_id}")
async def get_profile(user_id: str, user_id_verified: str = Depends(verify_token)):
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{AGENT_SERVICES['profile-service']}/profile/{user_id}")
        return r.json()


@app.put("/api/profile/{user_id}")
async def update_profile(user_id: str, profile_data: dict, user_id_verified: str = Depends(verify_token)):
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.put(f"{AGENT_SERVICES['profile-service']}/profile/{user_id}", json=profile_data)
        return r.json()


@app.post("/api/profile/{user_id}/apply-extraction")
async def apply_extraction(user_id: str, extraction_data: dict, user_id_verified: str = Depends(verify_token)):
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{AGENT_SERVICES['profile-service']}/profile/{user_id}/apply-extraction",
            json=extraction_data,
        )
        return r.json()


@app.get("/resume/profile-resumes/{user_id}")
async def get_profile_resumes(user_id: str):
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{AGENT_SERVICES['resume-analyzer']}/profile-resumes/{user_id}")
        return r.json()


# ══════════════════════════════════════════════════════════════════
#  ROUTES — DSA (proxied -> 8004)
# ══════════════════════════════════════════════════════════════════

@app.get("/api/dsa/{path:path}")
async def dsa_get(path: str, request: Request, user_id: str = Depends(verify_token)):
    """Proxy all DSA GET requests."""
    qs = str(request.query_params)
    target = f"/{path}" + (f"?{qs}" if qs else "")
    return await forward_to_agent("dsa-service", target, "GET")


@app.post("/api/dsa/{path:path}")
async def dsa_post(path: str, request: Request, user_id: str = Depends(verify_token)):
    """Proxy all DSA POST requests."""
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    return await forward_to_agent("dsa-service", f"/{path}", "POST", payload)


@app.delete("/api/dsa/{path:path}")
async def dsa_delete(path: str, request: Request, user_id: str = Depends(verify_token)):
    """Proxy all DSA DELETE requests."""
    return await forward_to_agent("dsa-service", f"/{path}", "DELETE")


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Evaluator (EMBEDDED — no separate service needed)
# ══════════════════════════════════════════════════════════════════

class EvaluationRequest(BaseModel):
    user_id: str
    module: str
    question: str
    answer: str


@app.post("/api/evaluate")
async def api_evaluate(req: EvaluationRequest):
    """Score an answer via LLM, persist to DB, update user_state."""
    pool = getattr(app.state, "pool", None)
    if not pool:
        logger.warning("No DB pool — evaluate returning ok without persistence")
        return {"status": "ok"}

    await _save_interaction(pool, req.user_id, req.module, req.question, req.answer)
    scores = await _llm_score(req.question, req.answer)
    logger.info(f"Scores for {req.user_id}: {scores}")
    await _save_scores(pool, req.user_id, req.module, scores)
    await _update_user_state_agg(pool, req.user_id)
    return {"status": "ok", "scores": scores}


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Orchestrator (EMBEDDED — no separate service needed)
# ══════════════════════════════════════════════════════════════════

@app.get("/api/next")
async def api_next(user_id: str):
    """
    Get next recommended module (Orchestrator v2 — weighted multi-signal engine).

    Pipeline:
    1. Fetch full user state (scores + onboarding + history)
    2. Fetch memory context (patterns, stats)
    3. Check service health → build availability map
    4. Run weighted multi-signal decision engine
    5. LLM reasoning (rules pick WHAT, LLM explains WHY)
    6. Persist decision + update user_state
    7. Return result with explainability
    """
    import time as _time
    start = _time.monotonic()

    engine: DecisionEngine = app.state.orch_engine
    registry: ServiceRegistry = app.state.orch_registry
    orch_metrics: OrchMetrics = app.state.orch_metrics
    state_mgr: StateManager = app.state.orch_state_mgr

    if not state_mgr:
        return {"next_module": "project_studio", "reason": "No DB — defaulting",
                "description": MODULE_DESCRIPTIONS.get("project_studio", ""), "memory_context": "",
                "weakness_trigger": None, "scores": None, "confidence": 0.5, "depth": "normal"}

    try:
        # Step 1: Full user state
        user_state = await state_mgr.get_user_state(user_id)
        logger.info(
            f"User {user_id}: clarity={user_state.scores.clarity_avg:.2f}, "
            f"tradeoffs={user_state.scores.tradeoff_avg:.2f}, "
            f"adaptability={user_state.scores.adaptability_avg:.2f}, "
            f"failure={user_state.scores.failure_awareness_avg:.2f}, "
            f"dsa={user_state.scores.dsa_predict_skill:.2f}"
        )

        # Step 2: Memory context
        memory_context = {}
        if HAS_MEMORY and app.state.pool:
            try:
                memory = create_user_memory(user_id, app.state.pool)
                memory_context = await memory.get_orchestrator_context()
            except Exception as e:
                logger.warning(f"Memory context fetch failed: {e}")

        # Step 3: Service health map
        service_health = {name: registry.is_healthy(name) for name in ORCH_MODULES}

        # Step 4: Run decision engine
        decision = engine.decide(user_state, memory_context, service_health)

        # Step 5: LLM reasoning
        decision.reason = await _generate_llm_reason_v2(
            decision,
            target_role=user_state.target_role,
            primary_focus=user_state.primary_focus,
        )

        # Step 6: Persist + update
        decision_id = await state_mgr.record_decision(user_id, decision)
        decision.decision_id = decision_id
        await state_mgr.update_next_module(user_id, decision.next_module)

        # Step 7: Record metrics
        elapsed_ms = (_time.monotonic() - start) * 1000
        orch_metrics.record_decision(
            user_id=user_id, module=decision.next_module,
            depth=decision.depth.value, latency_ms=elapsed_ms,
            confidence=decision.confidence,
        )

        memory_str = memory_context.get("weakness_summary", "")
        if isinstance(memory_str, dict):
            memory_str = str(memory_str)

        logger.info(
            f"Decision for {user_id}: {decision.next_module} "
            f"(depth={decision.depth.value}, confidence={decision.confidence:.2f}, "
            f"latency={elapsed_ms:.0f}ms)"
        )

        return {
            "next_module": decision.next_module,
            "reason": decision.reason,
            "description": decision.description,
            "memory_context": memory_str,
            "weakness_trigger": decision.weakness_trigger,
            "scores": decision.scores,
            "confidence": decision.confidence,
            "depth": decision.depth.value,
            "decision_id": decision.decision_id,
        }

    except Exception as e:
        logger.error(f"Decision pipeline failed for {user_id}: {e}", exc_info=True)
        orch_metrics.record_error("decision_pipeline")
        return {
            "next_module": "project_studio",
            "reason": "Something went wrong — defaulting to Project Studio.",
            "description": MODULE_DESCRIPTIONS.get("project_studio", ""),
            "memory_context": "", "weakness_trigger": None, "scores": None,
            "confidence": 0.3, "depth": "normal",
        }


@app.get("/api/state/{user_id}")
async def api_get_state(user_id: str):
    """Get current user state with context (Orchestrator v2)."""
    state_mgr: StateManager = app.state.orch_state_mgr
    if not state_mgr:
        raise HTTPException(status_code=503, detail="Database not available")
    state = await state_mgr.get_user_state(user_id)
    depth = app.state.orch_engine._determine_depth(state)
    return {
        "user_id": user_id,
        "clarity_avg": state.scores.clarity_avg,
        "tradeoff_avg": state.scores.tradeoff_avg,
        "adaptability_avg": state.scores.adaptability_avg,
        "failure_awareness_avg": state.scores.failure_awareness_avg,
        "dsa_predict_skill": state.scores.dsa_predict_skill,
        "next_module": state.next_module,
        "target_role": state.target_role,
        "recent_modules": state.recent_modules[:5],
        "depth": depth.value,
    }


@app.get("/api/orchestrator/decisions")
async def api_get_decisions(user_id: str):
    """Get recent orchestrator decision log (audit trail)."""
    state_mgr: StateManager = app.state.orch_state_mgr
    if not state_mgr:
        raise HTTPException(status_code=503, detail="Database not available")
    decisions = await state_mgr.get_decision_history(user_id, limit=8)
    return decisions


@app.get("/api/orchestrator/metrics")
async def api_orch_metrics():
    """Orchestrator metrics dashboard."""
    orch_metrics: OrchMetrics = app.state.orch_metrics
    return orch_metrics.summary()


@app.get("/api/orchestrator/circuit-breakers")
async def api_orch_circuit_breakers():
    """Circuit breaker status for all downstream services."""
    cb: CircuitBreakerRegistry = app.state.orch_cb
    return cb.all_status()


@app.get("/api/orchestrator/services")
async def api_orch_services():
    """Service registry with health status and latency."""
    registry: ServiceRegistry = app.state.orch_registry
    return registry.all_status()


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Job Search Agent (EMBEDDED — multi-source aggregation)
# ══════════════════════════════════════════════════════════════════

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "")
BRAVE_SEARCH_API_KEY = os.getenv("BRAVE_SEARCH_API_KEY", "")

# ── AI Key Rotation Pool ──────────────────────────────────────
# Auto-collects ALL available Groq + Gemini keys for round-robin use.
# On each LLM call: try next Groq key → if rate-limited, rotate →
# if all Groq exhausted, fall back to Gemini keys.
import itertools

def _collect_groq_keys() -> list[str]:
    keys = []
    if k := os.getenv("GROQ_API_KEY", ""):
        keys.append(k)
    for suffix in ["TECHNICAL", "APTITUDE", "HR"]:
        if k := os.getenv(f"GROQ_API_KEY_{suffix}", ""):
            keys.append(k)
    for i in range(1, 20):
        if k := os.getenv(f"GROQ_API_KEY_{i}", ""):
            keys.append(k)
    return list(dict.fromkeys(keys))  # Deduplicate, preserve order

def _collect_gemini_keys() -> list[str]:
    """Collect Gemini keys — skip GEMINI_API_KEY_1..3 (403), GAME/ARTICLE (expired)."""
    keys = []
    # Chapter keys (all 10 valid)
    for i in range(1, 20):
        if k := os.getenv(f"GEMINI_CHAPTER_KEY_{i}", ""):
            keys.append(k)
    # Service keys (only the working ones)
    for suffix in ["QUIZ", "FLASHCARD"]:
        if k := os.getenv(f"GEMINI_{suffix}_KEY", ""):
            keys.append(k)
    return list(dict.fromkeys(keys))

GROQ_KEY_POOL = _collect_groq_keys()
GEMINI_KEY_POOL = _collect_gemini_keys()
_groq_key_cycle = itertools.cycle(GROQ_KEY_POOL) if GROQ_KEY_POOL else None
_gemini_key_cycle = itertools.cycle(GEMINI_KEY_POOL) if GEMINI_KEY_POOL else None

logger.info(f"🔑 AI Key Pool: {len(GROQ_KEY_POOL)} Groq keys, {len(GEMINI_KEY_POOL)} Gemini keys")


def _next_groq_key() -> str:
    return next(_groq_key_cycle) if _groq_key_cycle else GROQ_API_KEY

def _next_gemini_key() -> str:
    return next(_gemini_key_cycle) if _gemini_key_cycle else ""


async def _llm_call_with_fallback(messages: list[dict], temperature: float = 0.1, json_mode: bool = True) -> str:
    """
    Try Groq first (rotating keys), fall back to Gemini if all Groq keys fail.
    Returns the raw response text.
    Set json_mode=False for plain-text responses (e.g. reasoning summaries).
    """
    # ── Try up to 3 different Groq keys ──
    groq_attempts = min(len(GROQ_KEY_POOL), 3) if GROQ_KEY_POOL else 0
    for attempt in range(groq_attempts):
        key = _next_groq_key()
        try:
            from groq import Groq
            client = Groq(api_key=key)
            kwargs = dict(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=temperature,
            )
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            completion = client.chat.completions.create(**kwargs)
            logger.info(f"✅ Groq succeeded (key ...{key[-6:]}, attempt {attempt+1})")
            return completion.choices[0].message.content
        except Exception as e:
            err = str(e).lower()
            if "rate_limit" in err or "429" in err or "quota" in err:
                logger.warning(f"⚡ Groq rate-limited (key ...{key[-6:]}), rotating...")
                continue
            logger.error(f"Groq error (key ...{key[-6:]}): {e}")
            continue

    # ── Fallback: Gemini 2.0 Flash (free 15 RPM per key) ──
    gemini_attempts = min(len(GEMINI_KEY_POOL), 3) if GEMINI_KEY_POOL else 0
    for attempt in range(gemini_attempts):
        key = _next_gemini_key()
        try:
            async with httpx.AsyncClient(timeout=60.0) as hclient:
                parts = [{"text": m.get("content", "")} for m in messages]
                gen_config = {"temperature": temperature}
                if json_mode:
                    gen_config["responseMimeType"] = "application/json"
                resp = await hclient.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}",
                    json={
                        "contents": [{"parts": parts}],
                        "generationConfig": gen_config,
                    },
                )
                if resp.status_code == 429:
                    logger.warning(f"⚡ Gemini rate-limited (key ...{key[-6:]}), rotating...")
                    continue
                if resp.status_code != 200:
                    logger.warning(f"Gemini returned {resp.status_code}: {resp.text[:100]}")
                    continue
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                logger.info(f"✅ Gemini fallback succeeded (key ...{key[-6:]})")
                return text
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            continue

    raise Exception("All AI providers exhausted (Groq + Gemini). Try again shortly.")


class JobSearchRequest(BaseModel):
    query: str
    resume_text: Optional[str] = None
    limit: int = 10
    freshness: str = "pd"  # pd = past day, pw = past week, pm = past month


# ────────────────────────────────────────────────────────────
#  Brave Search — structured results with freshness filtering
# ────────────────────────────────────────────────────────────
async def brave_search_jobs(query: str, limit: int = 10, freshness: str = "pd") -> list:
    """Search Brave for job listings. Returns list of {title, url, description, age}."""
    if not BRAVE_SEARCH_API_KEY:
        return []
    results = []
    # Multiple queries for broader coverage
    queries = [
        f"{query} jobs hiring",
        f"{query} openings apply",
        f"site:linkedin.com/jobs {query}",
    ]
    async with httpx.AsyncClient(timeout=15.0) as client:
        for i, q in enumerate(queries):
            if i > 0:
                await asyncio.sleep(0.5)  # Small delay to avoid 429 rate-limit
            try:
                resp = await client.get(
                    "https://api.search.brave.com/res/v1/web/search",
                    params={"q": q, "count": limit, "freshness": freshness, "text_decorations": False},
                    headers={"X-Subscription-Token": BRAVE_SEARCH_API_KEY, "Accept": "application/json"},
                )
                if resp.status_code == 429:
                    logger.warning(f"Brave rate-limited on '{q}', skipping")
                    continue
                if resp.status_code != 200:
                    logger.warning(f"Brave search returned {resp.status_code} for '{q}'")
                    continue
                data = resp.json()
                for r in data.get("web", {}).get("results", []):
                    results.append({
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "description": r.get("description", ""),
                        "age": r.get("age", ""),
                        "source": "brave",
                    })
            except Exception as e:
                logger.warning(f"Brave search error for '{q}': {e}")
                continue
    return results


# ────────────────────────────────────────────────────────────
#  Firecrawl — scrape full job descriptions from URLs
# ────────────────────────────────────────────────────────────
# Domains Firecrawl cannot scrape (blocked / unsupported)
BLOCKED_SCRAPE_DOMAINS = {"linkedin.com", "facebook.com", "twitter.com", "x.com"}


async def scrape_job_details(urls: list[str]) -> dict[str, str]:
    """Scrape job page content concurrently. Returns {url: markdown_content}."""
    if not FIRECRAWL_API_KEY:
        return {}
    try:
        from firecrawl import FirecrawlApp
        firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
    except ImportError:
        return {}

    # Filter out blocked domains
    scrapable = [
        u for u in urls[:10]
        if not any(d in u.lower() for d in BLOCKED_SCRAPE_DOMAINS)
    ]
    skipped = len(urls[:10]) - len(scrapable)
    if skipped:
        logger.info(f"⏭️ Skipped {skipped} unsupported URLs (LinkedIn, etc.)")

    def _scrape_one(url: str) -> tuple[str, str]:
        """Synchronous scrape — will be run in thread pool."""
        try:
            result = firecrawl.scrape(url, formats=["markdown"])
            if isinstance(result, dict):
                content = result.get("markdown", "") or result.get("content", "")
            else:
                content = getattr(result, "markdown", "") or getattr(result, "content", "")
            return (url, content[:3000] if content else "")
        except Exception as e:
            logger.warning(f"Scrape failed for {url}: {e}")
            return (url, "")

    # Run scrapes concurrently in thread pool (Firecrawl SDK is sync)
    loop = asyncio.get_event_loop()
    tasks = [loop.run_in_executor(None, _scrape_one, u) for u in scrapable[:6]]
    results = await asyncio.gather(*tasks)

    return {url: content for url, content in results if content}


# ────────────────────────────────────────────────────────────
#  Deduplicate & filter job results
# ────────────────────────────────────────────────────────────
def deduplicate_jobs(results: list) -> list:
    """Remove duplicates by URL domain+path, prefer job board sources."""
    seen_urls = set()
    unique = []
    # Job boards get priority
    job_board_domains = {"linkedin.com", "indeed.com", "glassdoor.com", "wellfound.com",
                         "naukri.com", "monster.com", "dice.com", "ziprecruiter.com",
                         "lever.co", "greenhouse.io", "workday.com", "careers"}
    
    def domain_priority(url: str) -> int:
        return 0 if any(d in url.lower() for d in job_board_domains) else 1

    # Sort: job boards first
    results.sort(key=lambda r: domain_priority(r.get("url", "")))

    for r in results:
        url = r.get("url", "").split("?")[0].rstrip("/").lower()
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique.append(r)
    return unique


# ────────────────────────────────────────────────────────────
#  Groq batch matching — multi-dimensional scoring
# ────────────────────────────────────────────────────────────
async def batch_match_jobs(jobs: list, resume_text: str, job_role: str) -> list:
    """Score all jobs against resume using key rotation + Gemini fallback."""

    # Build job summaries for batch
    job_summaries = []
    for i, job in enumerate(jobs):
        desc = job.get("full_description") or job.get("description", "")
        job_summaries.append(f"[JOB_{i}]\nTitle: {job.get('title', 'Unknown')}\nURL: {job.get('url', '')}\nDescription: {str(desc)[:800]}")

    all_jobs_text = "\n\n".join(job_summaries)

    prompt = f"""You are a senior technical recruiter. Analyze how well this candidate matches each job listing.

CANDIDATE RESUME:
{resume_text[:3000]}

TARGET ROLE: {job_role}

JOB LISTINGS:
{all_jobs_text}

For EACH job (JOB_0, JOB_1, etc.), provide a structured analysis.

Return JSON:
{{
  "matches": [
    {{
      "job_index": 0,
      "company": "inferred company name",
      "location": "inferred location or Remote",
      "experience_level": "Entry/Mid/Senior/Lead",
      "salary_estimate": "estimated range or Unknown",
      "overall_score": 0-100,
      "skills_match": 0-100,
      "experience_match": 0-100,
      "matching_skills": ["skill1", "skill2"],
      "missing_skills": ["skill1", "skill2"],
      "reasoning": "2-3 sentence analysis",
      "gap_analysis": "What the candidate needs to qualify"
    }}
  ]
}}

Be STRICT with scoring:
- 80-100: Excellent fit, most requirements met
- 60-79: Good fit, some gaps
- 40-59: Partial fit, significant gaps  
- 0-39: Poor fit, wrong domain/experience level
"""

    try:
        messages = [
            {"role": "system", "content": "You are a technical recruiter AI. Respond with JSON only. Be strict and honest in scoring."},
            {"role": "user", "content": prompt}
        ]
        # Uses key rotation pool + Gemini fallback automatically
        raw_text = await _llm_call_with_fallback(messages, temperature=0.1)
        analysis = json.loads(raw_text)
        return analysis.get("matches", [])
    except Exception as e:
        logger.error(f"Batch match error: {e}")
        return []


# ────────────────────────────────────────────────────────────
#  Main endpoint
# ────────────────────────────────────────────────────────────
@app.post("/api/job-search/search-and-match")
async def job_search_and_match(request: JobSearchRequest, user_id: str = Depends(verify_token)):
    """Multi-source job search with intelligent resume matching."""
    if not BRAVE_SEARCH_API_KEY and not FIRECRAWL_API_KEY:
        raise HTTPException(status_code=500, detail="No search API keys configured (need BRAVE_SEARCH_API_KEY or FIRECRAWL_API_KEY)")
    if not GROQ_KEY_POOL and not GEMINI_KEY_POOL:
        raise HTTPException(status_code=500, detail="No AI API keys configured (need GROQ_API_KEY or GEMINI_API_KEY)")

    job_role = request.query.replace(" jobs", "").strip()
    logger.info(f"🔍 Job search: '{job_role}' | freshness={request.freshness} | limit={request.limit}")

    try:
        # ── Step 1: Multi-source search ──
        raw_results = await brave_search_jobs(job_role, limit=request.limit, freshness=request.freshness)
        logger.info(f"📡 Brave returned {len(raw_results)} results")

        # Fallback to Firecrawl search if Brave returns nothing
        if len(raw_results) < 3 and FIRECRAWL_API_KEY:
            try:
                from firecrawl import FirecrawlApp
                firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY)
                fc_results = firecrawl.search(query=f"{job_role} jobs hiring", limit=request.limit)
                if isinstance(fc_results, list):
                    for r in fc_results:
                        raw_results.append({
                            "title": getattr(r, "title", "") if not isinstance(r, dict) else r.get("title", ""),
                            "url": getattr(r, "url", "") if not isinstance(r, dict) else r.get("url", ""),
                            "description": getattr(r, "description", "") or getattr(r, "markdown", "") if not isinstance(r, dict) else r.get("description", "") or r.get("markdown", ""),
                            "age": "", "source": "firecrawl",
                        })
                logger.info(f"🔥 Firecrawl fallback added {len(fc_results) if isinstance(fc_results, list) else 0} results")
            except Exception as e:
                logger.warning(f"Firecrawl fallback failed: {e}")

        if not raw_results:
            return {"matches": [], "sources_used": [], "total_found": 0}

        # ── Step 2: Deduplicate ──
        unique_results = deduplicate_jobs(raw_results)[:request.limit]
        logger.info(f"🧹 After dedup: {len(unique_results)} unique jobs")

        # ── Step 3: Scrape top URLs for full JDs ──
        urls_to_scrape = [r["url"] for r in unique_results if r.get("url")]
        scraped = await scrape_job_details(urls_to_scrape)
        logger.info(f"📄 Scraped {len(scraped)} full job descriptions")

        # Merge scraped content back
        for result in unique_results:
            url = result.get("url", "")
            if url in scraped:
                result["full_description"] = scraped[url]

        # ── Step 4: AI matching ──
        if not request.resume_text:
            # No resume — return unscored results
            return {
                "matches": [
                    {
                        "title": r.get("title", "Unknown"),
                        "company": "Unknown",
                        "url": r.get("url", "#"),
                        "overall_score": 0,
                        "skills_match": 0,
                        "experience_match": 0,
                        "matching_skills": [],
                        "missing_skills": [],
                        "reasoning": "No resume provided for matching.",
                        "gap_analysis": "",
                        "location": "",
                        "experience_level": "",
                        "salary_estimate": "",
                        "posted_age": r.get("age", ""),
                        "source": r.get("source", ""),
                    }
                    for r in unique_results
                ],
                "sources_used": list(set(r.get("source", "") for r in unique_results)),
                "total_found": len(unique_results),
            }

        scored_jobs = await batch_match_jobs(unique_results, request.resume_text, job_role)
        logger.info(f"🎯 AI scored {len(scored_jobs)} jobs")

        # ── Step 5: Merge scores with source data ──
        final_matches = []
        for scored in scored_jobs:
            idx = scored.get("job_index", -1)
            if 0 <= idx < len(unique_results):
                source = unique_results[idx]
                final_matches.append({
                    "title": source.get("title", scored.get("company", "Unknown Role")),
                    "company": scored.get("company", "Unknown"),
                    "url": source.get("url", "#"),
                    "overall_score": scored.get("overall_score", 0),
                    "skills_match": scored.get("skills_match", 0),
                    "experience_match": scored.get("experience_match", 0),
                    "matching_skills": scored.get("matching_skills", []),
                    "missing_skills": scored.get("missing_skills", []),
                    "reasoning": scored.get("reasoning", ""),
                    "gap_analysis": scored.get("gap_analysis", ""),
                    "location": scored.get("location", ""),
                    "experience_level": scored.get("experience_level", ""),
                    "salary_estimate": scored.get("salary_estimate", ""),
                    "posted_age": source.get("age", ""),
                    "source": source.get("source", ""),
                })

        # Sort by overall score
        final_matches.sort(key=lambda x: x["overall_score"], reverse=True)

        logger.info(f"✅ Returning {len(final_matches)} matched jobs")
        return {
            "matches": final_matches,
            "sources_used": list(set(r.get("source", "") for r in unique_results)),
            "total_found": len(unique_results),
        }

    except Exception as e:
        logger.error(f"Job search agent error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Project Studio (proxy to 8012)
# ══════════════════════════════════════════════════════════════════

class ProjectStudioDocInput(BaseModel):
    filename: str
    content: str


class ProjectStudioRequest(BaseModel):
    user_id: str
    description: str
    context: Optional[str] = ""
    documents: Optional[list[ProjectStudioDocInput]] = []


@app.post("/api/project-studio/analyze")
async def project_studio_analyze(req: ProjectStudioRequest, user_id: str = Depends(verify_token)):
    """Full 6-agent pipeline analysis (waits for completion)."""
    docs = [d.model_dump() for d in req.documents] if req.documents else []
    payload = {"user_id": user_id, "description": req.description, "context": req.context, "documents": docs}
    return await forward_to_agent("project-studio", "/analyze", "POST", payload)


@app.post("/api/project-studio/analyze/stream")
async def project_studio_stream(req: ProjectStudioRequest, user_id: str = Depends(verify_token)):
    """SSE streaming of 7-agent pipeline progress."""
    url = AGENT_SERVICES["project-studio"] + "/analyze/stream"
    docs = [d.model_dump() for d in req.documents] if req.documents else []
    payload = {"user_id": user_id, "description": req.description, "context": req.context, "documents": docs}
    try:
        client = httpx.AsyncClient(timeout=120.0)
        upstream = await client.send(
            client.build_request("POST", url, json=payload),
            stream=True,
        )
        async def relay():
            try:
                async for chunk in upstream.aiter_text():
                    yield chunk
            finally:
                await upstream.aclose()
                await client.aclose()

        from starlette.responses import StreamingResponse as StarletteStream
        return StarletteStream(relay(), media_type="text/event-stream",
                               headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
    except Exception as e:
        logger.error(f"Project Studio stream error: {e}")
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/project-studio/session/{session_id}")
async def project_studio_session(session_id: str, user_id: str = Depends(verify_token)):
    """Get pipeline session status."""
    return await forward_to_agent("project-studio", f"/session/{session_id}", "GET")


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Context Engine (user memory + weakness context)
# ══════════════════════════════════════════════════════════════════

@app.get("/api/context/{user_id}")
async def get_user_context(user_id: str, token_user: str = Depends(verify_token)):
    """Get assembled context for a user (memory + patterns + stats).
    Inspired by context-engineering-pipeline pattern."""
    pool = getattr(app.state, "pool", None)
    if not pool:
        return {"context": "Memory system unavailable", "events": [], "patterns": [], "stats": {}}

    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
    from memory import create_user_memory

    mem = create_user_memory(user_id, pool=pool)
    ctx = await mem.get_orchestrator_context()

    # Token-budget-aware summary (inspired by context-engineering-pipeline)
    weakness_text = ctx.get("weakness_summary", "")
    recent = ctx.get("recent_events", [])
    patterns = ctx.get("patterns", [])
    stats = ctx.get("stats", {})

    # Build assembled prompt for LLM consumption
    assembled = f"""=== USER CONTEXT ===
User ID: {user_id}

--- Weakness Summary ---
{weakness_text}

--- Recent Activity ({len(recent)} events) ---
"""
    for ev in recent[:10]:
        assembled += f"- [{ev.get('module','?')}] {ev.get('observation','')[:120]}\n"

    assembled += f"\n--- Detected Patterns ({len(patterns)}) ---\n"
    for p in patterns[:5]:
        assembled += f"- {p.get('pattern_type','?')}: {p.get('description','')} (confidence: {p.get('confidence',0):.1%})\n"

    return {
        "assembled_context": assembled,
        "weakness_summary": weakness_text,
        "recent_events": recent,
        "patterns": patterns,
        "stats": stats,
    }


# ══════════════════════════════════════════════════════════════════
#  RUN
# ══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

