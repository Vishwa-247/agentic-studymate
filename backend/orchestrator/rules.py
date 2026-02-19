"""
Orchestrator Service — Deterministic Rule Engine
=================================================
NO LLM. NO RANDOMNESS. PURE CONDITIONALS.

Routes users to modules based on weakness scores.
Module names MUST match frontend OrchestratorCard MODULE_CONFIG:
  production_interview, interactive_course, dsa_practice,
  resume_builder, project_studio, onboarding
"""

from typing import Dict, Optional, Tuple

# Threshold for triggering remediation
WEAKNESS_THRESHOLD = 0.4

# Module descriptions — keys match frontend MODULE_CONFIG
MODULES: Dict[str, str] = {
    "production_interview": "Mock Interview — practice production thinking, clarity, and adaptability.",
    "interactive_course": "Interactive Course — learn system design, tradeoffs, and failure analysis.",
    "dsa_practice": "DSA Practice — strengthen algorithm fundamentals with AI guidance.",
    "resume_builder": "Resume Builder — optimize your resume for target roles.",
    "project_studio": "Project Studio — apply your skills to a real project with AI agents.",
    "onboarding": "Onboarding — set up your goals and preferences.",
}


def decide(state: dict) -> Tuple[str, str]:
    """
    Deterministic routing logic based on weakness scores.

    Args:
        state: dict with clarity_avg, tradeoff_avg, adaptability_avg,
               failure_awareness_avg, dsa_predict_skill

    Returns:
        Tuple of (next_module, reason)

    Rules (priority order):
    1. Low clarity         → production_interview  (clarification drills)
    2. Low tradeoffs       → interactive_course    (system design learning)
    3. Low adaptability    → production_interview  (curveball scenarios)
    4. Low failure aware.  → interactive_course    (failure mode analysis)
    5. Low DSA             → dsa_practice          (algorithm practice)
    6. All healthy         → project_studio        (apply knowledge)
    """

    # Extract values with defaults (1.0 = healthy)
    clarity = state.get("clarity_avg", 1.0) or 1.0
    tradeoffs = state.get("tradeoff_avg", 1.0) or 1.0
    adaptability = state.get("adaptability_avg", 1.0) or 1.0
    failure_awareness = state.get("failure_awareness_avg", 1.0) or 1.0
    dsa_predict = state.get("dsa_predict_skill", 1.0) or 1.0

    # Rule 1: Clarity issues → production_interview
    if clarity < WEAKNESS_THRESHOLD:
        return (
            "production_interview",
            f"Clarity score ({clarity:.2f}) is below {WEAKNESS_THRESHOLD}. "
            "Practice explaining your thinking clearly in mock interviews.",
        )

    # Rule 2: Tradeoff issues → interactive_course
    if tradeoffs < WEAKNESS_THRESHOLD:
        return (
            "interactive_course",
            f"Tradeoff awareness ({tradeoffs:.2f}) is below {WEAKNESS_THRESHOLD}. "
            "Study system design concepts and tradeoff analysis through interactive courses.",
        )

    # Rule 3: Adaptability issues → production_interview
    if adaptability < WEAKNESS_THRESHOLD:
        return (
            "production_interview",
            f"Adaptability score ({adaptability:.2f}) is below {WEAKNESS_THRESHOLD}. "
            "Practice curveball scenarios in mock interviews to improve flexibility.",
        )

    # Rule 4: Failure awareness → interactive_course
    if failure_awareness < WEAKNESS_THRESHOLD:
        return (
            "interactive_course",
            f"Failure awareness ({failure_awareness:.2f}) is below {WEAKNESS_THRESHOLD}. "
            "Learn about edge cases and failure modes through interactive courses.",
        )

    # Rule 5: DSA prediction → dsa_practice
    if dsa_predict < WEAKNESS_THRESHOLD:
        return (
            "dsa_practice",
            f"DSA skill ({dsa_predict:.2f}) is below {WEAKNESS_THRESHOLD}. "
            "Practice algorithms and use the AI chatbot for hints.",
        )

    # Rule 6: All healthy → project_studio
    return (
        "project_studio",
        "All metrics are healthy (≥ 0.4). Apply your skills to a real project!",
    )


def get_module_description(module: str) -> str:
    """Get human-readable description of a module."""
    return MODULES.get(module, module)


def get_weakness_trigger(state: dict) -> Optional[str]:
    """Return the metric name that triggered routing, or None if all healthy."""
    clarity = state.get("clarity_avg", 1.0) or 1.0
    tradeoffs = state.get("tradeoff_avg", 1.0) or 1.0
    adaptability = state.get("adaptability_avg", 1.0) or 1.0
    failure_awareness = state.get("failure_awareness_avg", 1.0) or 1.0
    dsa_predict = state.get("dsa_predict_skill", 1.0) or 1.0

    if clarity < WEAKNESS_THRESHOLD:
        return "clarity_avg"
    if tradeoffs < WEAKNESS_THRESHOLD:
        return "tradeoff_avg"
    if adaptability < WEAKNESS_THRESHOLD:
        return "adaptability_avg"
    if failure_awareness < WEAKNESS_THRESHOLD:
        return "failure_awareness_avg"
    if dsa_predict < WEAKNESS_THRESHOLD:
        return "dsa_predict_skill"
    return None
