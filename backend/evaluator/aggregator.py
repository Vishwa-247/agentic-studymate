"""
Evaluator Service - Aggregator
Handles user_state updates using SQL aggregation.
"""

import logging
from typing import Optional

import asyncpg

logger = logging.getLogger(__name__)


async def update_user_state(pool: asyncpg.Pool, user_id: str) -> bool:
    """
    Update user_state with aggregated scores from scores table.
    Uses SQL AVG() which automatically ignores NULL values.
    
    Returns True if successful, False otherwise.
    """
    try:
        async with pool.acquire() as conn:
            # First, ensure user_state row exists (upsert)
            await conn.execute("""
                INSERT INTO public.user_state (user_id)
                VALUES ($1)
                ON CONFLICT (user_id) DO NOTHING
            """, user_id)
            
            # Then update with aggregated scores
            result = await conn.execute("""
                UPDATE public.user_state us SET
                    clarity_avg = COALESCE(sub.clarity_avg, us.clarity_avg),
                    tradeoff_avg = COALESCE(sub.tradeoff_avg, us.tradeoff_avg),
                    adaptability_avg = COALESCE(sub.adaptability_avg, us.adaptability_avg),
                    failure_awareness_avg = COALESCE(sub.failure_awareness_avg, us.failure_awareness_avg),
                    dsa_predict_skill = COALESCE(sub.dsa_predict_skill, us.dsa_predict_skill),
                    last_update = NOW()
                FROM (
                    SELECT
                        user_id,
                        AVG(clarity) AS clarity_avg,
                        AVG(tradeoffs) AS tradeoff_avg,
                        AVG(adaptability) AS adaptability_avg,
                        AVG(failure_awareness) AS failure_awareness_avg,
                        AVG(dsa_predict) AS dsa_predict_skill
                    FROM public.scores
                    WHERE user_id = $1
                    GROUP BY user_id
                ) AS sub
                WHERE us.user_id = sub.user_id
            """, user_id)
            
            logger.info(f"Updated user_state for user {user_id}: {result}")
            return True
            
    except Exception as e:
        logger.error(f"Failed to update user_state for {user_id}: {e}")
        return False


async def get_user_state(pool: asyncpg.Pool, user_id: str) -> Optional[dict]:
    """
    Get current user_state for a user.
    Returns None if user doesn't exist.
    """
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT 
                    user_id,
                    clarity_avg,
                    tradeoff_avg,
                    adaptability_avg,
                    failure_awareness_avg,
                    dsa_predict_skill,
                    next_module,
                    last_update
                FROM public.user_state
                WHERE user_id = $1
            """, user_id)
            
            if row:
                return dict(row)
            return None
            
    except Exception as e:
        logger.error(f"Failed to get user_state for {user_id}: {e}")
        return None
