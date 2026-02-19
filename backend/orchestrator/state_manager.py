"""
Orchestrator State Manager (v2)
================================
Enhanced state management with:
- User state fetch/update with auto-initialization
- Decision history tracking (recent_modules)
- Module visit counting
- Onboarding context retrieval
- Decision audit trail persistence

Replaces the old state.py with richer state assembly.
"""

import json
import logging
import time
from typing import Any, Dict, List, Optional

import asyncpg

from .models import Decision, SkillScores, UserState

logger = logging.getLogger(__name__)

# Default values for brand-new users
DEFAULT_SCORES = {
    "clarity_avg": 1.0,
    "tradeoff_avg": 1.0,
    "adaptability_avg": 1.0,
    "failure_awareness_avg": 1.0,
    "dsa_predict_skill": 1.0,
}


class StateManager:
    """
    Manages user state lifecycle for the orchestrator.

    Responsibilities:
    1. Fetch full user state (scores + context + history)
    2. Update next_module after decision
    3. Record decisions to audit trail
    4. Track module visit history
    """

    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def get_user_state(self, user_id: str) -> UserState:
        """
        Fetch complete user state snapshot.

        Flow:
        1. Ensure user_state row exists (auto-init)
        2. Fetch scores
        3. Fetch onboarding context (target_role, primary_focus)
        4. Fetch recent module history from decisions table
        5. Assemble into UserState model
        """
        start = time.monotonic()
        try:
            async with self.pool.acquire() as conn:
                # 1. Ensure row exists
                await conn.execute("""
                    INSERT INTO public.user_state (user_id)
                    VALUES ($1)
                    ON CONFLICT (user_id) DO NOTHING
                """, user_id)

                # 2. Fetch scores
                row = await conn.fetchrow("""
                    SELECT user_id,
                           COALESCE(clarity_avg, 1.0) AS clarity_avg,
                           COALESCE(tradeoff_avg, 1.0) AS tradeoff_avg,
                           COALESCE(adaptability_avg, 1.0) AS adaptability_avg,
                           COALESCE(failure_awareness_avg, 1.0) AS failure_awareness_avg,
                           COALESCE(dsa_predict_skill, 1.0) AS dsa_predict_skill,
                           next_module,
                           last_update
                    FROM public.user_state
                    WHERE user_id = $1
                """, user_id)

                if not row:
                    logger.warning(f"User {user_id} not found after upsert, using defaults")
                    return UserState(
                        user_id=user_id,
                        scores=SkillScores(**DEFAULT_SCORES),
                    )

                scores = SkillScores(
                    clarity_avg=row["clarity_avg"],
                    tradeoff_avg=row["tradeoff_avg"],
                    adaptability_avg=row["adaptability_avg"],
                    failure_awareness_avg=row["failure_awareness_avg"],
                    dsa_predict_skill=row["dsa_predict_skill"],
                )

                # 3. Fetch onboarding context
                target_role = None
                primary_focus = None
                try:
                    onboarding = await conn.fetchrow("""
                        SELECT target_role, primary_focus
                        FROM user_onboarding
                        WHERE user_id = $1
                    """, user_id)
                    if onboarding:
                        target_role = onboarding.get("target_role")
                        primary_focus = onboarding.get("primary_focus")
                except Exception:
                    pass  # Table might not exist yet

                # 4. Fetch recent module history (last 10 decisions)
                recent_modules = []
                module_visit_counts: Dict[str, int] = {}
                try:
                    decision_rows = await conn.fetch("""
                        SELECT next_module
                        FROM orchestrator_decisions
                        WHERE user_id = $1
                        ORDER BY created_at DESC
                        LIMIT 10
                    """, user_id)
                    recent_modules = [r["next_module"] for r in decision_rows]

                    # Count total visits per module
                    count_rows = await conn.fetch("""
                        SELECT next_module, COUNT(*) as cnt
                        FROM orchestrator_decisions
                        WHERE user_id = $1
                        GROUP BY next_module
                    """, user_id)
                    module_visit_counts = {r["next_module"]: r["cnt"] for r in count_rows}
                except Exception:
                    pass  # Table might not exist yet

                elapsed = (time.monotonic() - start) * 1000
                logger.debug(f"State fetch for {user_id} took {elapsed:.1f}ms")

                return UserState(
                    user_id=user_id,
                    scores=scores,
                    next_module=row["next_module"],
                    last_update=row["last_update"],
                    target_role=target_role,
                    primary_focus=primary_focus,
                    recent_modules=recent_modules,
                    module_visit_counts=module_visit_counts,
                )

        except Exception as e:
            logger.error(f"Failed to fetch user state for {user_id}: {e}")
            return UserState(
                user_id=user_id,
                scores=SkillScores(**DEFAULT_SCORES),
            )

    async def update_next_module(self, user_id: str, module: str) -> bool:
        """Update the next_module field in user_state."""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    UPDATE public.user_state
                    SET next_module = $2, last_update = NOW()
                    WHERE user_id = $1
                """, user_id, module)
                return True
        except Exception as e:
            logger.error(f"Failed to update next_module for {user_id}: {e}")
            return False

    async def record_decision(
        self,
        user_id: str,
        decision: Decision,
    ) -> Optional[str]:
        """
        Persist a decision to the audit trail.
        Returns the decision ID if successful.
        """
        try:
            depth_int = {
                "normal": 1,
                "remediation": 2,
                "critical": 3,
                "onboarding": 0,
            }.get(decision.depth.value, 1)

            input_snapshot = json.dumps({
                "scores": decision.scores,
                "weakness_trigger": decision.weakness_trigger,
                "confidence": decision.confidence,
                "candidate_scores": [
                    {"module": cs.module, "total_score": round(cs.total_score, 4)}
                    for cs in decision.candidate_scores[:5]
                ],
            })

            async with self.pool.acquire() as conn:
                row = await conn.fetchrow("""
                    INSERT INTO orchestrator_decisions
                        (user_id, input_snapshot, next_module, depth, reason)
                    VALUES ($1, $2::jsonb, $3, $4, $5)
                    RETURNING id
                """, user_id, input_snapshot, decision.next_module,
                    depth_int, decision.reason)

                decision_id = str(row["id"]) if row else None
                logger.info(
                    f"Decision #{decision_id}: {user_id} → {decision.next_module} "
                    f"(depth={decision.depth.value}, confidence={decision.confidence:.2f})"
                )
                return decision_id

        except Exception as e:
            logger.warning(f"Failed to persist decision for {user_id}: {e}")
            return None

    async def get_decision_history(
        self, user_id: str, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Fetch recent decisions for a user (audit trail)."""
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT id, next_module, depth, reason, created_at, input_snapshot
                    FROM orchestrator_decisions
                    WHERE user_id = $1
                    ORDER BY created_at DESC
                    LIMIT $2
                """, user_id, limit)
                return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"Failed to fetch decision history: {e}")
            return []


# ── Legacy compatibility ──────────────────────────────────────────
# These functions match the old state.py API so existing code still works.

async def fetch_user_state(pool: asyncpg.Pool, user_id: str) -> dict:
    """Legacy wrapper — returns a plain dict like the old state.py."""
    mgr = StateManager(pool)
    state = await mgr.get_user_state(user_id)
    return {
        "user_id": state.user_id,
        "clarity_avg": state.scores.clarity_avg,
        "tradeoff_avg": state.scores.tradeoff_avg,
        "adaptability_avg": state.scores.adaptability_avg,
        "failure_awareness_avg": state.scores.failure_awareness_avg,
        "dsa_predict_skill": state.scores.dsa_predict_skill,
        "next_module": state.next_module,
        "last_update": state.last_update,
    }


async def update_next_module(pool: asyncpg.Pool, user_id: str, next_module: str) -> bool:
    """Legacy wrapper."""
    mgr = StateManager(pool)
    return await mgr.update_next_module(user_id, next_module)
