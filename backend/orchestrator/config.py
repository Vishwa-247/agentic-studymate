"""
Orchestrator Configuration
===========================
Centralized configuration with environment variable overrides.
All magic numbers, thresholds, and feature flags live here.
"""

import os
from dataclasses import dataclass, field
from typing import Dict, List


@dataclass(frozen=True)
class ModuleDefinition:
    """Defines a learning module the orchestrator can route to."""
    name: str
    label: str
    description: str
    route: str
    port: int | None = None          # None = embedded in gateway
    base_url: str | None = None      # None = embedded
    remediation_skills: tuple = ()   # Which weakness dimensions this module addresses
    prerequisite_modules: tuple = () # Modules user should complete first (soft gate)
    weight: float = 1.0              # Base priority weight (higher = more likely to be chosen)
    cooldown_minutes: int = 30       # Min time before re-recommending same module


# ── Module Registry ──────────────────────────────────────────────
MODULES: Dict[str, ModuleDefinition] = {
    "onboarding": ModuleDefinition(
        name="onboarding",
        label="Onboarding",
        description="Set up your goals, preferences, and learning profile.",
        route="/onboarding",
        remediation_skills=(),
        weight=0.5,
        cooldown_minutes=1440,  # 24h — don't re-suggest daily
    ),
    "production_interview": ModuleDefinition(
        name="production_interview",
        label="Mock Interview",
        description="Practice production thinking, clarity, and adaptability in realistic mock interviews.",
        route="/mock-interview",
        port=8002,
        base_url="http://127.0.0.1:8002",
        remediation_skills=("clarity_avg", "adaptability_avg"),
        weight=1.2,
        cooldown_minutes=15,
    ),
    "interactive_course": ModuleDefinition(
        name="interactive_course",
        label="Interactive Course",
        description="Learn system design, tradeoffs, and failure analysis through AI-powered courses.",
        route="/course-generator",
        port=8008,
        base_url="http://127.0.0.1:8008",
        remediation_skills=("tradeoff_avg", "failure_awareness_avg"),
        weight=1.0,
        cooldown_minutes=20,
    ),
    "dsa_practice": ModuleDefinition(
        name="dsa_practice",
        label="DSA Practice",
        description="Strengthen algorithm fundamentals with AI-guided problem solving.",
        route="/dsa-sheet",
        port=8004,
        base_url="http://127.0.0.1:8004",
        remediation_skills=("dsa_predict_skill",),
        weight=1.0,
        cooldown_minutes=10,
    ),
    "resume_builder": ModuleDefinition(
        name="resume_builder",
        label="Resume Builder",
        description="Optimize your resume for target roles with AI analysis.",
        route="/resume-analyzer",
        port=8003,
        base_url="http://127.0.0.1:8003",
        remediation_skills=(),
        weight=0.7,
        cooldown_minutes=60,
    ),
    "project_studio": ModuleDefinition(
        name="project_studio",
        label="Project Studio",
        description="Apply your skills to a real project with multi-agent AI collaboration.",
        route="/project-studio",
        port=8012,
        base_url="http://127.0.0.1:8012",
        remediation_skills=(),
        prerequisite_modules=("production_interview", "interactive_course"),
        weight=0.9,
        cooldown_minutes=30,
    ),
}


# ── Decision Engine Config ────────────────────────────────────────

@dataclass(frozen=True)
class EngineConfig:
    """Tuning knobs for the weighted decision engine."""

    # Score thresholds
    weakness_threshold: float = 0.4       # Below this → remediation needed
    strength_threshold: float = 0.75      # Above this → skill is strong
    critical_threshold: float = 0.2       # Below this → urgent remediation

    # Temporal decay (exponential moving average)
    decay_alpha: float = 0.3             # Higher = recent scores matter MORE
    score_window_days: int = 30          # How far back to look

    # Weights for the multi-signal scoring
    weakness_severity_weight: float = 0.40   # How weak is the skill?
    rate_of_change_weight: float = 0.15      # Getting worse vs improving?
    recency_weight: float = 0.15             # Time since last visit to module
    goal_alignment_weight: float = 0.15      # Matches user's stated target role?
    pattern_weight: float = 0.15             # Memory patterns signal

    # Cooldown & diversity
    max_consecutive_same_module: int = 3  # Force diversity after N in a row
    min_modules_before_repeat: int = 1    # Visit at least N other modules before repeating

    # LLM reasoning
    llm_timeout_seconds: float = 10.0
    llm_max_tokens: int = 200
    llm_temperature: float = 0.3

    # Circuit breaker
    cb_failure_threshold: int = 5         # Failures before opening
    cb_recovery_timeout_s: int = 60       # Seconds before half-open test
    cb_half_open_max_calls: int = 2       # Test calls in half-open state

    # Health check
    health_check_interval_s: int = 30     # Background health check frequency
    health_check_timeout_s: float = 5.0   # Per-service health check timeout

    # Metrics
    metrics_buffer_size: int = 1000       # In-memory ring buffer size
    metrics_flush_interval_s: int = 60    # Flush to DB frequency


# ── Dimension Metadata ────────────────────────────────────────────

SKILL_DIMENSIONS = {
    "clarity_avg": {
        "label": "Clarity",
        "description": "Ability to explain thinking clearly and communicate solutions",
        "remediation_modules": ["production_interview"],
    },
    "tradeoff_avg": {
        "label": "Tradeoff Analysis",
        "description": "Ability to evaluate and articulate engineering tradeoffs",
        "remediation_modules": ["interactive_course"],
    },
    "adaptability_avg": {
        "label": "Adaptability",
        "description": "Flexibility in handling curveballs and changing requirements",
        "remediation_modules": ["production_interview"],
    },
    "failure_awareness_avg": {
        "label": "Failure Awareness",
        "description": "Understanding of edge cases, failure modes, and system reliability",
        "remediation_modules": ["interactive_course"],
    },
    "dsa_predict_skill": {
        "label": "DSA Skills",
        "description": "Data structures and algorithms problem-solving ability",
        "remediation_modules": ["dsa_practice"],
    },
}


# ── Goal → Skill Weighting Maps ──────────────────────────────────
# Different target roles weight skills differently.
GOAL_SKILL_WEIGHTS: Dict[str, Dict[str, float]] = {
    "backend_engineer": {
        "clarity_avg": 1.0, "tradeoff_avg": 1.3, "adaptability_avg": 1.0,
        "failure_awareness_avg": 1.3, "dsa_predict_skill": 1.2,
    },
    "frontend_engineer": {
        "clarity_avg": 1.2, "tradeoff_avg": 1.0, "adaptability_avg": 1.3,
        "failure_awareness_avg": 0.8, "dsa_predict_skill": 0.9,
    },
    "fullstack_engineer": {
        "clarity_avg": 1.1, "tradeoff_avg": 1.2, "adaptability_avg": 1.1,
        "failure_awareness_avg": 1.1, "dsa_predict_skill": 1.1,
    },
    "ml_engineer": {
        "clarity_avg": 1.0, "tradeoff_avg": 1.3, "adaptability_avg": 1.0,
        "failure_awareness_avg": 1.2, "dsa_predict_skill": 1.4,
    },
    "devops_engineer": {
        "clarity_avg": 0.9, "tradeoff_avg": 1.2, "adaptability_avg": 1.1,
        "failure_awareness_avg": 1.5, "dsa_predict_skill": 0.7,
    },
    "default": {
        "clarity_avg": 1.0, "tradeoff_avg": 1.0, "adaptability_avg": 1.0,
        "failure_awareness_avg": 1.0, "dsa_predict_skill": 1.0,
    },
}


def load_config() -> EngineConfig:
    """Load config with environment variable overrides."""
    overrides = {}
    env_map = {
        "ORCH_WEAKNESS_THRESHOLD": ("weakness_threshold", float),
        "ORCH_STRENGTH_THRESHOLD": ("strength_threshold", float),
        "ORCH_DECAY_ALPHA": ("decay_alpha", float),
        "ORCH_SCORE_WINDOW_DAYS": ("score_window_days", int),
        "ORCH_LLM_TIMEOUT": ("llm_timeout_seconds", float),
        "ORCH_CB_FAILURE_THRESHOLD": ("cb_failure_threshold", int),
        "ORCH_CB_RECOVERY_TIMEOUT": ("cb_recovery_timeout_s", int),
        "ORCH_HEALTH_CHECK_INTERVAL": ("health_check_interval_s", int),
    }
    for env_key, (field_name, cast_fn) in env_map.items():
        val = os.getenv(env_key)
        if val is not None:
            try:
                overrides[field_name] = cast_fn(val)
            except (ValueError, TypeError):
                pass
    return EngineConfig(**overrides)
