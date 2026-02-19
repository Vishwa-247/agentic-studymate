"""
Orchestrator Service v2.0 — Production-Grade
==============================================
Port: 8011

A production-quality learning path orchestrator built on system design principles:

┌──────────────────────────────────────────────────────────────────────────┐
│                          Orchestrator v2.0                               │
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │ API Layer │──► Decision  │──► State Mgr  │──► Circuit Breakers   │   │
│  │ (FastAPI) │  │ Engine   │  │ (asyncpg)  │  │ (per-service)      │   │
│  └──────────┘  └──────────┘  └────────────┘  └─────────────────────┘   │
│       │             │              │                    │                │
│       ▼             ▼              ▼                    ▼                │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │ Metrics  │  │ LLM      │  │ Memory     │  │ Service Registry    │   │
│  │ Collector│  │ Reasoner │  │ (patterns) │  │ + Health Monitor    │   │
│  └──────────┘  └──────────┘  └────────────┘  └─────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘

Key Design Decisions:
1. Weighted multi-signal decision engine (not simple threshold)
2. Circuit breaker per downstream service (prevent cascading failures)
3. Background health monitoring with latency tracking
4. Full decision audit trail with explainability
5. In-memory metrics (Counter + Histogram) with ring buffer
6. Temporal decay — recent performance matters more
7. Goal-aware routing — adapts to user's target career role
8. Diversity filter — prevents recommending the same module repeatedly
9. LLM reasoning layer — rules pick WHAT, LLM explains WHY (Decision 2 pattern)
10. Legacy-compatible API — same response shape as v1 for frontend compatibility
"""

import json
import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import asyncpg
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# ── Package imports ───────────────────────────────────────────────
import sys
backend_root = Path(__file__).parent.parent
sys.path.insert(0, str(backend_root))

from orchestrator.config import MODULES, EngineConfig, load_config
from orchestrator.models import (
    Decision,
    FeedbackEvent,
    HealthResponse,
    MemoryEventRequest,
    NextModuleResponse,
    UserStateResponse,
)
from orchestrator.engine import DecisionEngine
from orchestrator.state_manager import StateManager
from orchestrator.circuit_breaker import CircuitBreakerRegistry
from orchestrator.service_registry import ServiceRegistry
from orchestrator.metrics import MetricsCollector

# Try to import memory (might not be available in all deployments)
try:
    from shared.memory import UserMemory, create_user_memory
    HAS_MEMORY = True
except ImportError:
    HAS_MEMORY = False

# ── Environment ──────────────────────────────────────────────────
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("orchestrator")

DB_URL = os.getenv("SUPABASE_DB_URL", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


# ══════════════════════════════════════════════════════════════════
#  LIFESPAN — Initialize all subsystems
# ══════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: DB pool → Config → Engine → Circuit Breakers → Registry → Health Monitor
    Shutdown: Stop monitor → Close pool
    """
    config = load_config()
    app.state.config = config

    # 1. Database pool
    if DB_URL:
        try:
            app.state.pool = await asyncpg.create_pool(
                dsn=DB_URL,
                min_size=2,
                max_size=10,
                command_timeout=30,
                statement_cache_size=0,  # PgBouncer compatibility
            )
            logger.info("✅ Database pool created (2–10 connections)")
        except Exception as e:
            logger.error(f"❌ Database pool failed: {e}")
            app.state.pool = None
    else:
        logger.warning("⚠️  SUPABASE_DB_URL not set — running in degraded mode")
        app.state.pool = None

    # 2. Decision engine
    app.state.engine = DecisionEngine(config)
    logger.info("✅ Decision engine initialized (weighted multi-signal)")

    # 3. Circuit breakers
    app.state.circuit_breakers = CircuitBreakerRegistry(
        failure_threshold=config.cb_failure_threshold,
        recovery_timeout_s=config.cb_recovery_timeout_s,
        half_open_max_calls=config.cb_half_open_max_calls,
    )
    logger.info(
        f"✅ Circuit breakers ready (threshold={config.cb_failure_threshold}, "
        f"recovery={config.cb_recovery_timeout_s}s)"
    )

    # 4. Service registry + health monitor
    app.state.registry = ServiceRegistry(config, app.state.circuit_breakers)
    await app.state.registry.start_monitoring()
    logger.info(
        f"✅ Service registry started (interval={config.health_check_interval_s}s)"
    )

    # 5. Metrics collector
    app.state.metrics = MetricsCollector(buffer_size=config.metrics_buffer_size)
    logger.info("✅ Metrics collector ready")

    # 6. State manager
    if app.state.pool:
        app.state.state_mgr = StateManager(app.state.pool)
    else:
        app.state.state_mgr = None

    logger.info("🚀 Orchestrator v2.0 ready on port 8011")

    yield

    # Shutdown
    await app.state.registry.stop_monitoring()
    if app.state.pool:
        await app.state.pool.close()
    logger.info("Orchestrator shut down cleanly")


# ══════════════════════════════════════════════════════════════════
#  FastAPI App
# ══════════════════════════════════════════════════════════════════

app = FastAPI(
    title="StudyMate Orchestrator",
    version="2.0.0",
    description="Production-grade learning path orchestrator with weighted multi-signal routing",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════════════
#  LLM Reasoning (Decision 2 pattern: rules pick WHAT, LLM explains WHY)
# ══════════════════════════════════════════════════════════════════

async def generate_llm_reason(
    decision: Decision,
    target_role: Optional[str] = None,
    primary_focus: Optional[str] = None,
) -> str:
    """Generate a human-readable explanation using Groq LLM."""
    if not GROQ_API_KEY:
        return decision.rule_reason

    scores_str = ", ".join(
        f"{k}: {v:.2f}" for k, v in (decision.scores or {}).items()
    )
    context = f"Scores: {scores_str}"
    if target_role:
        context += f"\nTarget role: {target_role}"
    if primary_focus:
        context += f"\nPrimary focus: {primary_focus}"

    confidence_note = ""
    if decision.confidence < 0.5:
        confidence_note = "\nNote: The engine was not very confident in this choice — multiple modules scored similarly."

    prompt = f"""You are a career coach for a student on StudyMate, an AI learning platform.
The orchestrator chose "{decision.next_module}" (confidence: {decision.confidence:.0%}).
Rule reason: {decision.rule_reason}
Decision depth: {decision.depth.value}
{context}{confidence_note}

Write 2 concise sentences:
1) What specific pattern you noticed in their data
2) Why this module will help them improve

Be specific, encouraging, and mention their target role if available.
No preamble, no bullet points — just the 2 sentences."""

    start = time.monotonic()
    success = False
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
                    "max_tokens": 200,
                },
            )
            if resp.status_code == 200:
                content = resp.json()["choices"][0]["message"]["content"].strip()
                if content:
                    success = True
                    return content
    except Exception as e:
        logger.warning(f"LLM reasoning failed: {e}")
    finally:
        elapsed = (time.monotonic() - start) * 1000
        metrics: MetricsCollector = getattr(app.state, "metrics", None)
        if metrics:
            metrics.record_llm_call(elapsed, success)

    return decision.rule_reason


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Core Orchestrator API
# ══════════════════════════════════════════════════════════════════

@app.get("/")
async def root():
    return {
        "service": "StudyMate Orchestrator",
        "version": "2.0.0",
        "port": 8011,
        "architecture": "weighted-multi-signal",
        "features": [
            "weighted-decision-engine",
            "circuit-breakers",
            "service-health-monitoring",
            "decision-audit-trail",
            "metrics-dashboard",
            "llm-reasoning",
            "goal-aware-routing",
            "diversity-filter",
        ],
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """
    Health check with service status, metrics summary, and circuit breaker state.
    """
    db_ok = app.state.pool is not None
    registry: ServiceRegistry = app.state.registry
    metrics: MetricsCollector = app.state.metrics

    return HealthResponse(
        status="healthy" if db_ok else "degraded",
        database="connected" if db_ok else "disconnected",
        services=registry.all_status(),
        uptime_seconds=metrics.uptime_seconds,
        metrics_summary=metrics.health_summary(),
    )


@app.get("/next", response_model=NextModuleResponse)
async def get_next_module(user_id: str = Query(..., description="User UUID")):
    """
    Core endpoint: Get the next recommended module for a user.

    Pipeline:
    1. Fetch full user state (scores + context + history)
    2. Fetch memory context (patterns, stats)
    3. Check service health → build availability map
    4. Run weighted multi-signal decision engine
    5. Generate LLM reasoning
    6. Persist decision + update user_state
    7. Return result with full explainability
    """
    start = time.monotonic()
    engine: DecisionEngine = app.state.engine
    registry: ServiceRegistry = app.state.registry
    metrics: MetricsCollector = app.state.metrics
    state_mgr: Optional[StateManager] = app.state.state_mgr

    # Fallback if DB is unavailable
    if not state_mgr:
        return NextModuleResponse(
            next_module="project_studio",
            reason="Database unavailable — defaulting to Project Studio.",
            description=MODULES["project_studio"].description,
            depth="normal",
            confidence=0.5,
        )

    try:
        # Step 1: Fetch user state
        user_state = await state_mgr.get_user_state(user_id)
        logger.info(
            f"User {user_id} state: clarity={user_state.scores.clarity_avg:.2f}, "
            f"tradeoffs={user_state.scores.tradeoff_avg:.2f}, "
            f"adaptability={user_state.scores.adaptability_avg:.2f}, "
            f"failure={user_state.scores.failure_awareness_avg:.2f}, "
            f"dsa={user_state.scores.dsa_predict_skill:.2f}"
        )

        # Step 2: Fetch memory context
        memory_context = {}
        if HAS_MEMORY and app.state.pool:
            try:
                memory = create_user_memory(user_id, app.state.pool)
                memory_context = await memory.get_orchestrator_context()
            except Exception as e:
                logger.warning(f"Memory context fetch failed: {e}")

        # Step 3: Build service health map
        service_health = {
            name: registry.is_healthy(name) for name in MODULES
        }

        # Step 4: Run decision engine
        decision = engine.decide(user_state, memory_context, service_health)

        # Step 5: LLM reasoning
        decision.reason = await generate_llm_reason(
            decision,
            target_role=user_state.target_role,
            primary_focus=user_state.primary_focus,
        )

        # Step 6: Persist decision + update state
        decision_id = await state_mgr.record_decision(user_id, decision)
        decision.decision_id = decision_id
        await state_mgr.update_next_module(user_id, decision.next_module)

        # Step 7: Record metrics
        elapsed = (time.monotonic() - start) * 1000
        metrics.record_decision(
            user_id=user_id,
            module=decision.next_module,
            depth=decision.depth.value,
            latency_ms=elapsed,
            confidence=decision.confidence,
        )

        # Build memory context string
        memory_str = memory_context.get("weakness_summary", "")
        if isinstance(memory_str, dict):
            memory_str = str(memory_str)

        logger.info(
            f"Decision for {user_id}: {decision.next_module} "
            f"(depth={decision.depth.value}, confidence={decision.confidence:.2f}, "
            f"latency={elapsed:.0f}ms)"
        )

        return NextModuleResponse(
            next_module=decision.next_module,
            reason=decision.reason,
            description=decision.description,
            memory_context=memory_str,
            weakness_trigger=decision.weakness_trigger,
            scores=decision.scores,
            confidence=decision.confidence,
            depth=decision.depth.value,
            decision_id=decision.decision_id,
        )

    except Exception as e:
        logger.error(f"Decision pipeline failed for {user_id}: {e}", exc_info=True)
        metrics.record_error("decision_pipeline")
        # Graceful degradation — return a safe default
        return NextModuleResponse(
            next_module="project_studio",
            reason="Something went wrong — defaulting to Project Studio while we recover.",
            description=MODULES["project_studio"].description,
            depth="normal",
            confidence=0.3,
        )


# ══════════════════════════════════════════════════════════════════
#  ROUTES — State & History
# ══════════════════════════════════════════════════════════════════

@app.get("/state/{user_id}", response_model=UserStateResponse)
async def get_state(user_id: str):
    """Get current user state with context."""
    state_mgr: Optional[StateManager] = app.state.state_mgr
    if not state_mgr:
        raise HTTPException(503, "Database not available")

    state = await state_mgr.get_user_state(user_id)
    depth = app.state.engine._determine_depth(state)

    return UserStateResponse(
        user_id=user_id,
        clarity_avg=state.scores.clarity_avg,
        tradeoff_avg=state.scores.tradeoff_avg,
        adaptability_avg=state.scores.adaptability_avg,
        failure_awareness_avg=state.scores.failure_awareness_avg,
        dsa_predict_skill=state.scores.dsa_predict_skill,
        next_module=state.next_module,
        target_role=state.target_role,
        recent_modules=state.recent_modules[:5],
        depth=depth.value,
    )


@app.get("/decisions/{user_id}")
async def get_decisions(user_id: str, limit: int = 10):
    """Get recent decision history for a user (audit trail)."""
    state_mgr: Optional[StateManager] = app.state.state_mgr
    if not state_mgr:
        raise HTTPException(503, "Database not available")

    decisions = await state_mgr.get_decision_history(user_id, limit)
    return {"user_id": user_id, "decisions": decisions}


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Memory (User learning memory)
# ══════════════════════════════════════════════════════════════════

@app.post("/memory/{user_id}/record")
async def record_memory_event(user_id: str, event: MemoryEventRequest):
    """Record a memory event (after interview, course, etc.)."""
    if not HAS_MEMORY or not app.state.pool:
        raise HTTPException(503, "Memory system not available")

    memory = create_user_memory(user_id, app.state.pool)
    event_id = await memory.record_event(
        event_type=event.event_type,
        module=event.module,
        observation=event.observation,
        metric_name=event.metric_name,
        metric_value=event.metric_value,
        tags=event.tags,
    )

    if not event_id:
        raise HTTPException(500, "Failed to record event")

    return {"status": "ok", "event_id": event_id}


@app.get("/memory/{user_id}")
async def get_memory_context(user_id: str):
    """Get full memory context for a user."""
    if not HAS_MEMORY or not app.state.pool:
        raise HTTPException(503, "Memory system not available")

    memory = create_user_memory(user_id, app.state.pool)
    return await memory.get_orchestrator_context()


@app.get("/memory/{user_id}/summary")
async def get_weakness_summary(user_id: str):
    """Get weakness summary text (useful for LLM context injection)."""
    if not HAS_MEMORY or not app.state.pool:
        raise HTTPException(503, "Memory system not available")

    memory = create_user_memory(user_id, app.state.pool)
    summary = await memory.get_weakness_summary()
    return {"user_id": user_id, "summary": summary}


@app.post("/memory/{user_id}/update-patterns")
async def trigger_pattern_update(user_id: str):
    """Trigger pattern analysis for a user."""
    if not HAS_MEMORY or not app.state.pool:
        raise HTTPException(503, "Memory system not available")

    memory = create_user_memory(user_id, app.state.pool)
    count = await memory.update_patterns()
    return {"status": "ok", "patterns_updated": count}


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Feedback Loop
# ══════════════════════════════════════════════════════════════════

@app.post("/feedback")
async def record_feedback(event: FeedbackEvent):
    """
    Record feedback from a completed module session.
    Closes the learning loop: user does module → evaluator scores → feedback → re-route.
    """
    metrics: MetricsCollector = app.state.metrics
    metrics.feedback_events.inc(event.module)

    # Record to memory if available
    if HAS_MEMORY and app.state.pool:
        try:
            memory = create_user_memory(event.user_id, app.state.pool)
            await memory.record_event(
                event_type="session_feedback",
                module=event.module,
                observation=f"Session {event.completion_status} "
                            f"(duration={event.session_duration_s}s, "
                            f"satisfaction={event.satisfaction_score})",
                tags=[event.completion_status, event.module],
            )
        except Exception as e:
            logger.warning(f"Failed to record feedback to memory: {e}")

    return {"status": "ok", "module": event.module}


# ══════════════════════════════════════════════════════════════════
#  ROUTES — Observability
# ══════════════════════════════════════════════════════════════════

@app.get("/metrics")
async def get_metrics():
    """Full metrics dashboard (counters, histograms, recent decisions)."""
    metrics: MetricsCollector = app.state.metrics
    return metrics.summary()


@app.get("/circuit-breakers")
async def get_circuit_breakers():
    """Circuit breaker status for all services."""
    cb: CircuitBreakerRegistry = app.state.circuit_breakers
    return cb.all_status()


@app.post("/circuit-breakers/{service}/reset")
async def reset_circuit_breaker(service: str):
    """Manually reset a circuit breaker (admin action)."""
    cb: CircuitBreakerRegistry = app.state.circuit_breakers
    breaker = cb.get(service)
    breaker.reset()
    return {"status": "ok", "service": service, "new_state": breaker.state.value}


@app.get("/services")
async def get_services():
    """Service registry with health status and latency."""
    registry: ServiceRegistry = app.state.registry
    return registry.all_status()


# ══════════════════════════════════════════════════════════════════
#  Run Server
# ══════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "orchestrator.main:app",
        host="0.0.0.0",
        port=8011,
        reload=True,
        log_level="info",
    )
