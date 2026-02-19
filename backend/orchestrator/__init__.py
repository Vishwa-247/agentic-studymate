"""
Orchestrator Service Package v2.0
==================================
Production-grade learning path orchestrator.

Architecture:
- config.py          → Configuration, module registry, skill dimensions
- models.py          → Pydantic models (API contracts, internal types)
- engine.py          → Weighted multi-signal decision engine
- state_manager.py   → User state lifecycle (DB reads/writes)
- circuit_breaker.py → Per-service circuit breaker pattern
- service_registry.py→ Service discovery + background health monitoring
- metrics.py         → In-memory metrics (counters, histograms)
- main_v2.py         → FastAPI application (HTTP layer)

Legacy compatibility:
- state.py           → Old state module (still importable)
- rules.py           → Old rule engine (still importable)
- main.py            → Old FastAPI app (still runnable)
"""

from .config import MODULES, EngineConfig, load_config, SKILL_DIMENSIONS
from .models import (
    Decision,
    DecisionDepth,
    NextModuleResponse,
    SkillScores,
    UserState,
)
from .engine import DecisionEngine, decide_legacy
from .circuit_breaker import CircuitBreaker, CircuitBreakerRegistry, CircuitOpenError
from .metrics import MetricsCollector

__all__ = [
    "MODULES",
    "EngineConfig",
    "load_config",
    "SKILL_DIMENSIONS",
    "Decision",
    "DecisionDepth",
    "NextModuleResponse",
    "SkillScores",
    "UserState",
    "DecisionEngine",
    "decide_legacy",
    "CircuitBreaker",
    "CircuitBreakerRegistry",
    "CircuitOpenError",
    "MetricsCollector",
]
