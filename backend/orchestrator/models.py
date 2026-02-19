"""
Orchestrator Models
====================
Pydantic models for API contracts, internal state, and events.
Single source of truth — imported by gateway and standalone service.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Enums ─────────────────────────────────────────────────────────

class DecisionDepth(str, Enum):
    """How urgent the routing decision is."""
    NORMAL = "normal"           # All scores healthy
    REMEDIATION = "remediation" # One skill below threshold
    CRITICAL = "critical"       # One skill below critical threshold
    ONBOARDING = "onboarding"   # Fresh user, no history


class CircuitState(str, Enum):
    """Circuit breaker states."""
    CLOSED = "closed"       # Healthy — traffic flows normally
    OPEN = "open"           # Failing — block traffic to prevent cascading failure
    HALF_OPEN = "half_open" # Testing — allow limited traffic to check recovery


class ServiceStatus(str, Enum):
    """Health status of a downstream service."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


# ── Skill Scores ──────────────────────────────────────────────────

class SkillScores(BaseModel):
    """Current skill scores for a user across all dimensions."""
    clarity_avg: float = Field(1.0, ge=0.0, le=1.0)
    tradeoff_avg: float = Field(1.0, ge=0.0, le=1.0)
    adaptability_avg: float = Field(1.0, ge=0.0, le=1.0)
    failure_awareness_avg: float = Field(1.0, ge=0.0, le=1.0)
    dsa_predict_skill: float = Field(1.0, ge=0.0, le=1.0)

    def to_dict(self) -> Dict[str, float]:
        return self.model_dump()

    def weakest_dimension(self, threshold: float = 0.4) -> Optional[str]:
        """Return the weakest skill below threshold, or None."""
        scores = self.to_dict()
        below = {k: v for k, v in scores.items() if v < threshold}
        if not below:
            return None
        return min(below, key=below.get)

    def all_healthy(self, threshold: float = 0.4) -> bool:
        return all(v >= threshold for v in self.to_dict().values())


# ── User State ────────────────────────────────────────────────────

class UserState(BaseModel):
    """Full user state snapshot from the database."""
    user_id: str
    scores: SkillScores = Field(default_factory=SkillScores)
    next_module: Optional[str] = None
    last_update: Optional[datetime] = None

    # Extended context (populated from memory + onboarding)
    target_role: Optional[str] = None
    primary_focus: Optional[str] = None
    recent_modules: List[str] = Field(default_factory=list)  # Last N modules visited
    module_visit_counts: Dict[str, int] = Field(default_factory=dict)


# ── Decision Output ──────────────────────────────────────────────

class ModuleScore(BaseModel):
    """Detailed scoring breakdown for a candidate module."""
    module: str
    total_score: float = 0.0
    weakness_severity_score: float = 0.0
    rate_of_change_score: float = 0.0
    recency_score: float = 0.0
    goal_alignment_score: float = 0.0
    pattern_score: float = 0.0
    cooldown_penalty: float = 0.0
    diversity_bonus: float = 0.0


class Decision(BaseModel):
    """The orchestrator's routing decision with full explainability."""
    next_module: str
    reason: str                                    # Human-readable (LLM-generated)
    rule_reason: str                               # Raw rule-engine reason
    description: str = ""
    depth: DecisionDepth = DecisionDepth.NORMAL
    weakness_trigger: Optional[str] = None         # Which dimension triggered it
    scores: Optional[Dict[str, float]] = None      # User's current skill scores
    memory_context: str = ""
    confidence: float = 1.0                        # 0–1 how confident the engine is
    candidate_scores: List[ModuleScore] = Field(default_factory=list)  # Full ranking
    decision_id: Optional[str] = None              # UUID from audit log


# ── API Response Models ──────────────────────────────────────────

class NextModuleResponse(BaseModel):
    """API response for GET /api/next."""
    next_module: str
    reason: str
    description: str = ""
    memory_context: str = ""
    weakness_trigger: Optional[str] = None
    scores: Optional[Dict[str, float]] = None
    confidence: float = 1.0
    depth: str = "normal"
    decision_id: Optional[str] = None


class HealthResponse(BaseModel):
    """API response for GET /health."""
    status: str
    service: str = "orchestrator"
    version: str = "2.0.0"
    database: str = "unknown"
    services: Dict[str, Any] = Field(default_factory=dict)
    uptime_seconds: float = 0.0
    metrics_summary: Dict[str, Any] = Field(default_factory=dict)


class UserStateResponse(BaseModel):
    """API response for GET /api/state/{user_id}."""
    user_id: str
    clarity_avg: float = 1.0
    tradeoff_avg: float = 1.0
    adaptability_avg: float = 1.0
    failure_awareness_avg: float = 1.0
    dsa_predict_skill: float = 1.0
    next_module: Optional[str] = None
    target_role: Optional[str] = None
    recent_modules: List[str] = Field(default_factory=list)
    depth: str = "normal"


class DecisionLogEntry(BaseModel):
    """A single entry from the orchestrator decision audit trail."""
    id: Optional[int] = None
    user_id: str
    next_module: str
    depth: int = 1
    reason: str
    confidence: float = 1.0
    input_snapshot: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None


# ── Event Models ─────────────────────────────────────────────────

class MemoryEventRequest(BaseModel):
    """Request body for recording a memory event."""
    event_type: str
    module: str
    observation: str
    metric_name: Optional[str] = None
    metric_value: Optional[float] = None
    tags: Optional[List[str]] = None
    context: Optional[Dict[str, Any]] = None


class FeedbackEvent(BaseModel):
    """Feedback from a completed module session — closes the learning loop."""
    user_id: str
    module: str
    session_duration_s: Optional[float] = None
    completion_status: str = "completed"   # completed | abandoned | partial
    satisfaction_score: Optional[float] = None  # 1–5 user rating
    scores: Optional[Dict[str, float]] = None   # New evaluation scores
    metadata: Dict[str, Any] = Field(default_factory=dict)
