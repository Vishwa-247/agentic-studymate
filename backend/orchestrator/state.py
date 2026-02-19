"""
Orchestrator Service - State Management
Handles fetching and updating user_state from database.
Auto-initializes state for new users.
"""

import logging
from typing import Optional

import asyncpg

logger = logging.getLogger(__name__)

# Default values for new users (all metrics start at 1.0 = healthy)
DEFAULT_STATE = {
    "clarity_avg": 1.0,
    "tradeoff_avg": 1.0,
    "adaptability_avg": 1.0,
    "failure_awareness_avg": 1.0,
    "dsa_predict_skill": 1.0,
    "next_module": None
}


async def fetch_user_state(pool: asyncpg.Pool, user_id: str) -> dict:
    """
    Fetch user_state from database.
    Auto-initializes if row doesn't exist (Option A behavior).
    
    Returns dict with all state fields.
    """
    try:
        async with pool.acquire() as conn:
            # First, ensure row exists (upsert with defaults)
            await conn.execute("""
                INSERT INTO public.user_state (user_id)
                VALUES ($1)
                ON CONFLICT (user_id) DO NOTHING
            """, user_id)
            
            # Then fetch
            row = await conn.fetchrow("""
                SELECT 
                    user_id,
                    COALESCE(clarity_avg, 1.0) as clarity_avg,
                    COALESCE(tradeoff_avg, 1.0) as tradeoff_avg,
                    COALESCE(adaptability_avg, 1.0) as adaptability_avg,
                    COALESCE(failure_awareness_avg, 1.0) as failure_awareness_avg,
                    COALESCE(dsa_predict_skill, 1.0) as dsa_predict_skill,
                    next_module,
                    last_update
                FROM public.user_state
                WHERE user_id = $1
            """, user_id)
            
            if row:
                return dict(row)
            
            # Fallback (should never reach here due to upsert)
            logger.warning(f"User {user_id} state not found after upsert, using defaults")
            return {**DEFAULT_STATE, "user_id": user_id}
            
    except Exception as e:
        logger.error(f"Failed to fetch user_state for {user_id}: {e}")
        # Return defaults on error to prevent frontend crash
        return {**DEFAULT_STATE, "user_id": user_id}


async def update_next_module(pool: asyncpg.Pool, user_id: str, next_module: str) -> bool:
    """
    Update the next_module field in user_state.
    
    Returns True if successful.
    """
    try:
        async with pool.acquire() as conn:
            await conn.execute("""
                UPDATE public.user_state
                SET next_module = $2, last_update = NOW()
                WHERE user_id = $1
            """, user_id, next_module)
            logger.info(f"Updated next_module for {user_id}: {next_module}")
            return True
            
    except Exception as e:
        logger.error(f"Failed to update next_module for {user_id}: {e}")
        return False
