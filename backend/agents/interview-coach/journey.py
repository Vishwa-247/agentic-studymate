from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from fastapi import HTTPException
from pydantic import BaseModel, Field


# ----------------------------
# Types
# ----------------------------

JourneyState = str


class JourneyStartRequest(BaseModel):
    job_role: str = Field("Software Engineer")
    tech_stack: str = Field("General")
    experience_level: str = Field("intermediate")
    mode: str = Field("production_thinking")


class JourneyStartResponse(BaseModel):
    session_id: str
    state: JourneyState
    prompt: str


class JourneyStepRequest(BaseModel):
    session_id: str
    message: str


class JourneyStepResponse(BaseModel):
    session_id: str
    state: JourneyState
    prompt: str
    done: bool = False
    metrics: Optional[Dict[str, float]] = None


# ----------------------------
# Deterministic content
# ----------------------------


@dataclass(frozen=True)
class Scenario:
    title: str
    prompt: str


SCENARIOS: List[Scenario] = [
    Scenario(
        title="Rate limiter for login",
        prompt=(
            "You own the login endpoint for a consumer app. In production you're seeing bursts of abusive traffic "
            "causing database load spikes. Design a mitigation that reduces abuse while protecting legit users. "
            "Ask clarifying questions before proposing a solution."
        ),
    ),
    Scenario(
        title="Webhook ingestion",
        prompt=(
            "You need to ingest webhooks from a payment provider. Events can arrive out of order and may be retried. "
            "Design a system that is correct, observable, and cost-aware. Ask clarifying questions first."
        ),
    ),
    Scenario(
        title="Search latency regression",
        prompt=(
            "A recent deploy caused search latency to jump from 120ms p95 to 800ms p95. You must diagnose and "
            "mitigate quickly without a full rollback. Ask clarifying questions before proposing steps."
        ),
    ),
]


def _pick_scenario(seed: str) -> Scenario:
    # deterministic enough for a single run, but doesn't need cryptographic determinism
    idx = int(uuid.UUID(seed)) % len(SCENARIOS)
    return SCENARIOS[idx]


# ----------------------------
# Heuristics
# ----------------------------


_CLARIFY_KEYWORDS = {
    "users",
    "traffic",
    "qps",
    "latency",
    "p95",
    "sla",
    "slo",
    "constraints",
    "assumption",
    "assumptions",
    "budget",
    "cost",
    "consistency",
    "availability",
    "data size",
    "volume",
    "rate",
    "limits",
    "error",
    "failure",
}


def _has_clarification(message: str) -> bool:
    msg = message.lower()
    if "?" in msg:
        return True
    return any(k in msg for k in _CLARIFY_KEYWORDS)


def _score_structure(text: str) -> float:
    t = text.lower()
    signals = 0
    if re.search(r"\b(1\.|1\)|first|second|third|then|finally)\b", t):
        signals += 1
    if "- " in text or "\n-" in text:
        signals += 1
    if re.search(r"\b(requirements|tradeoffs|risks|monitoring|rollout)\b", t):
        signals += 1
    return min(1.0, signals / 3)


def _score_tradeoffs(text: str) -> float:
    t = text.lower()
    signals = 0
    if "tradeoff" in t or "trade-offs" in t:
        signals += 1
    if "pros" in t and "cons" in t:
        signals += 1
    if re.search(r"\b(vs\.|versus|instead of|rather than)\b", t):
        signals += 1
    return min(1.0, signals / 3)


def _score_scalability(text: str) -> float:
    t = text.lower()
    keywords = [
        "cache",
        "queue",
        "backpressure",
        "shard",
        "partition",
        "horizontal",
        "throughput",
        "rate limit",
        "load shed",
        "autoscale",
        "bottleneck",
    ]
    hits = sum(1 for k in keywords if k in t)
    return min(1.0, hits / 4)


def _score_failure_awareness(text: str) -> float:
    t = text.lower()
    keywords = [
        "timeout",
        "retry",
        "idempotent",
        "circuit",
        "fallback",
        "degrade",
        "monitor",
        "alert",
        "slo",
        "sli",
        "rollback",
        "feature flag",
    ]
    hits = sum(1 for k in keywords if k in t)
    return min(1.0, hits / 4)


def _score_adaptability(text: str) -> float:
    t = text.lower()
    signals = 0
    if re.search(r"\b(given that|since|because|now that|with this change)\b", t):
        signals += 1
    if re.search(r"\b(adjust|change|update|switch|revisit)\b", t):
        signals += 1
    if re.search(r"\b(new constraint|curveball|requirement change|spike)\b", t):
        signals += 1
    return min(1.0, signals / 3)


def compute_metrics(*, clarification_asked: bool, core_answer: str, follow_up: str, curveball: str) -> Dict[str, float]:
    clarification_habit = 1.0 if clarification_asked else 0.25
    structure = _score_structure(core_answer)
    tradeoff_awareness = max(_score_tradeoffs(core_answer), _score_tradeoffs(follow_up))
    scalability_thinking = max(_score_scalability(core_answer), _score_scalability(follow_up), _score_scalability(curveball))
    failure_awareness = max(_score_failure_awareness(core_answer), _score_failure_awareness(follow_up), _score_failure_awareness(curveball))
    adaptability = _score_adaptability(curveball)

    overall = (
        0.18 * clarification_habit
        + 0.18 * structure
        + 0.18 * tradeoff_awareness
        + 0.16 * scalability_thinking
        + 0.16 * failure_awareness
        + 0.14 * adaptability
    )
    return {
        "clarification_habit": round(float(clarification_habit), 3),
        "structure": round(float(structure), 3),
        "tradeoff_awareness": round(float(tradeoff_awareness), 3),
        "scalability_thinking": round(float(scalability_thinking), 3),
        "failure_awareness": round(float(failure_awareness), 3),
        "adaptability": round(float(adaptability), 3),
        "overall_score": round(float(overall), 3),
    }


# ----------------------------
# State machine
# ----------------------------


ST_INITIAL: JourneyState = "INITIAL"
ST_AWAITING_CLARIFICATION: JourneyState = "AWAITING_CLARIFICATION"
ST_CORE_ANSWER: JourneyState = "CORE_ANSWER"
ST_FOLLOW_UP: JourneyState = "FOLLOW_UP"
ST_CURVEBALL: JourneyState = "CURVEBALL"
ST_REFLECTION: JourneyState = "REFLECTION"
ST_COMPLETE: JourneyState = "COMPLETE"


def transition(state: JourneyState, message: str, context: Dict[str, Any]) -> Tuple[JourneyState, str, Dict[str, Any]]:
    msg = (message or "").strip()
    ctx = {**(context or {})}

    if state in (ST_INITIAL, ST_AWAITING_CLARIFICATION):
        asked = _has_clarification(msg)
        ctx["clarification_asked"] = bool(asked)
        next_state = ST_CORE_ANSWER
        if asked:
            prompt = "Good clarifications. Now propose an approach (high-level design + constraints + rollout)."
        else:
            prompt = "⚠️ You jumped to a solution. List the assumptions you made, then propose your approach."
        return next_state, prompt, ctx

    if state == ST_CORE_ANSWER:
        next_state = ST_FOLLOW_UP
        prompt = (
            "Follow-up: pick ONE trade-off you made (e.g., latency vs cost, correctness vs speed). "
            "Defend it with concrete numbers/limits and explain what you'd monitor."
        )
        return next_state, prompt, ctx

    if state == ST_FOLLOW_UP:
        next_state = ST_CURVEBALL
        prompt = (
            "Curveball: a new constraint appears (traffic spikes 10x OR a hard latency SLO is added OR a dependency is flaky). "
            "Adapt your design. What changes, what stays, and what do you de-risk first?"
        )
        return next_state, prompt, ctx

    if state == ST_CURVEBALL:
        next_state = ST_REFLECTION
        prompt = "Reflection (mandatory): what would you improve with more time, and what did you miss initially?"
        return next_state, prompt, ctx

    if state == ST_REFLECTION:
        if len(msg) < 20:
            return ST_REFLECTION, "Reflection needs more detail (>= 20 chars). Try again.", ctx
        return ST_COMPLETE, "Complete. Good work.", ctx

    return ST_COMPLETE, "Complete.", ctx


# ----------------------------
# Persistence helpers (Supabase)
# ----------------------------


def _require_supabase(supabase: Any) -> Any:
    if supabase is None:
        raise HTTPException(status_code=503, detail="Supabase not configured in interview-coach service")
    return supabase


def create_session(
    *,
    supabase: Any,
    user_id: str,
    payload: JourneyStartRequest,
) -> Tuple[str, JourneyState, str]:
    sb = _require_supabase(supabase)

    session_id = str(uuid.uuid4())
    scenario = _pick_scenario(session_id)
    now_iso = datetime.utcnow().isoformat()

    journey_context = {
        "scenario": {"title": scenario.title},
        "clarification_asked": None,
        "core_answer": "",
        "follow_up": "",
        "curveball": "",
    }

    sb.table("interview_sessions").insert(
        {
            "id": session_id,
            "user_id": user_id,
            "session_type": "journey",
            "job_role": payload.job_role,
            "tech_stack": payload.tech_stack,
            "experience_level": payload.experience_level,
            "status": "active",
            "started_at": now_iso,
            "questions_data": {"scenario": scenario.prompt},
            "journey_state": ST_AWAITING_CLARIFICATION,
            "journey_version": 1,
            "journey_mode": payload.mode,
            "journey_context": journey_context,
            "journey_last_step_at": now_iso,
        }
    ).execute()

    sb.table("interview_turns").insert(
        {
            "session_id": session_id,
            "user_id": user_id,
            "role": "assistant",
            "state": ST_AWAITING_CLARIFICATION,
            "content": scenario.prompt,
            "metadata": {"scenario_title": scenario.title},
        }
    ).execute()

    return session_id, ST_AWAITING_CLARIFICATION, scenario.prompt


def step_session(
    *,
    supabase: Any,
    user_id: str,
    payload: JourneyStepRequest,
) -> JourneyStepResponse:
    sb = _require_supabase(supabase)

    session_res = (
        sb.table("interview_sessions")
        .select("*")
        .eq("id", payload.session_id)
        .limit(1)
        .execute()
    )
    if not session_res.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = session_res.data[0]

    if str(session.get("user_id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    state: JourneyState = session.get("journey_state") or ST_INITIAL
    ctx: Dict[str, Any] = session.get("journey_context") or {}

    # Append user turn
    sb.table("interview_turns").insert(
        {
            "session_id": payload.session_id,
            "user_id": user_id,
            "role": "user",
            "state": state,
            "content": payload.message,
            "metadata": {},
        }
    ).execute()

    # Store message snapshot into journey_context for deterministic metrics
    msg = (payload.message or "").strip()
    if state in (ST_INITIAL, ST_AWAITING_CLARIFICATION):
        # no storage here; transition() will set clarification_asked
        pass
    elif state == ST_CORE_ANSWER:
        ctx["core_answer"] = msg
    elif state == ST_FOLLOW_UP:
        ctx["follow_up"] = msg
    elif state == ST_CURVEBALL:
        ctx["curveball"] = msg

    next_state, assistant_prompt, next_ctx = transition(state, msg, ctx)

    now_iso = datetime.utcnow().isoformat()

    update_data: Dict[str, Any] = {
        "journey_state": next_state,
        "journey_context": next_ctx,
        "journey_last_step_at": now_iso,
    }
    if next_state == ST_COMPLETE:
        update_data["journey_completed_at"] = now_iso
        update_data["status"] = "completed"

    sb.table("interview_sessions").update(update_data).eq("id", payload.session_id).execute()

    # Append assistant turn
    sb.table("interview_turns").insert(
        {
            "session_id": payload.session_id,
            "user_id": user_id,
            "role": "assistant",
            "state": next_state,
            "content": assistant_prompt,
            "metadata": {},
        }
    ).execute()

    metrics: Optional[Dict[str, float]] = None
    if next_state == ST_COMPLETE:
        clarification_asked = bool(next_ctx.get("clarification_asked"))
        core_answer = str(next_ctx.get("core_answer") or "")
        follow_up = str(next_ctx.get("follow_up") or "")
        curveball = str(next_ctx.get("curveball") or "")
        metrics = compute_metrics(
            clarification_asked=clarification_asked,
            core_answer=core_answer,
            follow_up=follow_up,
            curveball=curveball,
        )

        sb.table("interview_metrics").insert(
            {
                "session_id": payload.session_id,
                "user_id": user_id,
                "journey_version": 1,
                **metrics,
                "notes": {"deterministic": True},
            }
        ).execute()

    return JourneyStepResponse(
        session_id=payload.session_id,
        state=next_state,
        prompt=assistant_prompt,
        done=next_state == ST_COMPLETE,
        metrics=metrics,
    )
