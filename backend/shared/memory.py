"""
User Memory Module for StudyMate Orchestrator

Provides persistent memory for tracking user behavior patterns,
weaknesses, and improvements across sessions.

This is a Supabase-based alternative to Zep Cloud.
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

logger = logging.getLogger(__name__)


class UserMemory:
    """
    Memory interface for a single user.
    Records events and retrieves patterns for orchestrator decisions.
    """
    
    def __init__(self, user_id: str, pool=None, supabase_client=None):
        """
        Initialize memory for a user.
        
        Args:
            user_id: UUID of the user
            pool: asyncpg connection pool (for direct DB access)
            supabase_client: Supabase client (for REST API access)
        """
        self.user_id = user_id
        self.pool = pool
        self.supabase = supabase_client
    
    # ==================== Recording Events ====================
    
    async def record_event(
        self,
        event_type: str,
        module: str,
        observation: str,
        metric_name: str = None,
        metric_value: float = None,
        tags: List[str] = None,
        context: Dict = None
    ) -> Optional[str]:
        """
        Record a memory event for this user.
        
        Args:
            event_type: Type of event (e.g., 'interview_completed', 'weakness_detected')
            module: Which module (e.g., 'interview', 'course', 'dsa')
            observation: Human-readable description of what happened
            metric_name: Optional metric name (e.g., 'clarity', 'tradeoff')
            metric_value: Optional metric value (0.0 to 1.0)
            tags: Optional tags for filtering
            context: Optional additional structured data
        
        Returns:
            Event ID if successful, None otherwise
        """
        if not self.pool:
            logger.warning("No database pool available for memory recording")
            return None
        
        try:
            async with self.pool.acquire() as conn:
                result = await conn.fetchrow(
                    """
                    INSERT INTO user_memory (
                        user_id, event_type, module, observation,
                        metric_name, metric_value, tags, context
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id
                    """,
                    self.user_id,
                    event_type,
                    module,
                    observation,
                    metric_name,
                    metric_value,
                    tags or [],
                    context or {}
                )
                event_id = str(result['id'])
                logger.info(f"Recorded memory event {event_id} for user {self.user_id[:8]}...")
                return event_id
        except Exception as e:
            logger.error(f"Failed to record memory event: {e}")
            return None
    
    async def record_interview_result(
        self,
        clarity_score: float,
        tradeoff_score: float,
        adaptability_score: float,
        failure_awareness_score: float,
        topic: str = "general"
    ) -> List[str]:
        """
        Convenience method to record all interview metrics at once.
        
        Returns:
            List of event IDs created
        """
        event_ids = []
        metrics = [
            ("clarity", clarity_score),
            ("tradeoff", tradeoff_score),
            ("adaptability", adaptability_score),
            ("failure_awareness", failure_awareness_score)
        ]
        
        for metric_name, score in metrics:
            # Determine event type based on score
            if score < 0.4:
                event_type = "weakness_detected"
                observation = f"User showed weakness in {metric_name} during {topic} interview (score: {score:.2f})"
                tags = ["weakness", "interview", metric_name, topic]
            elif score > 0.7:
                event_type = "strength_detected"
                observation = f"User showed strength in {metric_name} during {topic} interview (score: {score:.2f})"
                tags = ["strength", "interview", metric_name, topic]
            else:
                event_type = "interview_completed"
                observation = f"User completed {topic} interview with {metric_name} score: {score:.2f}"
                tags = ["interview", metric_name, topic]
            
            event_id = await self.record_event(
                event_type=event_type,
                module="interview",
                observation=observation,
                metric_name=metric_name,
                metric_value=score,
                tags=tags
            )
            if event_id:
                event_ids.append(event_id)
        
        return event_ids
    
    async def record_course_progress(
        self,
        course_id: str,
        lesson_completed: bool,
        understanding_score: float = None,
        topic: str = "unknown"
    ) -> Optional[str]:
        """Record course learning progress."""
        if lesson_completed:
            observation = f"User completed lesson on {topic}"
            event_type = "course_lesson_completed"
        else:
            observation = f"User started lesson on {topic}"
            event_type = "course_lesson_started"
        
        return await self.record_event(
            event_type=event_type,
            module="course",
            observation=observation,
            metric_name="understanding" if understanding_score else None,
            metric_value=understanding_score,
            tags=["course", topic],
            context={"course_id": course_id}
        )
    
    async def record_dsa_attempt(
        self,
        problem_id: str,
        success: bool,
        prediction_correct: bool = None,
        algorithm_type: str = "unknown"
    ) -> Optional[str]:
        """Record DSA practice attempt."""
        if prediction_correct is not None:
            metric_value = 1.0 if prediction_correct else 0.0
            metric_name = "prediction_skill"
        else:
            metric_value = 1.0 if success else 0.0
            metric_name = "problem_solving"
        
        observation = f"User {'solved' if success else 'attempted'} {algorithm_type} problem"
        if prediction_correct is not None:
            observation += f" (prediction {'correct' if prediction_correct else 'incorrect'})"
        
        return await self.record_event(
            event_type="dsa_attempt",
            module="dsa",
            observation=observation,
            metric_name=metric_name,
            metric_value=metric_value,
            tags=["dsa", algorithm_type, "success" if success else "failure"],
            context={"problem_id": problem_id}
        )
    
    # ==================== Retrieving Memory ====================
    
    async def get_recent_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get most recent memory events for this user."""
        if not self.pool:
            return []
        
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT * FROM user_memory
                    WHERE user_id = $1
                    ORDER BY created_at DESC
                    LIMIT $2
                    """,
                    self.user_id,
                    limit
                )
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to get recent events: {e}")
            return []
    
    async def get_weakness_events(self, days: int = 30, limit: int = 50) -> List[Dict[str, Any]]:
        """Get weakness events from the last N days."""
        if not self.pool:
            return []
        
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT * FROM user_memory
                    WHERE user_id = $1
                      AND event_type = 'weakness_detected'
                      AND created_at > now() - make_interval(days => $2)
                    ORDER BY created_at DESC
                    LIMIT $3
                    """,
                    self.user_id,
                    days,
                    limit
                )
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to get weakness events: {e}")
            return []
    
    async def get_weakness_summary(self) -> str:
        """
        Get a text summary of user's weaknesses for LLM context.
        Uses the database function if available, otherwise calculates locally.
        """
        if not self.pool:
            return "Memory system unavailable."
        
        try:
            async with self.pool.acquire() as conn:
                # Try using the database function first
                result = await conn.fetchval(
                    "SELECT get_user_weakness_summary($1)",
                    self.user_id
                )
                if result:
                    return result
        except Exception as e:
            logger.warning(f"Database function not available, calculating locally: {e}")
        
        # Fallback: calculate locally
        try:
            events = await self.get_weakness_events(days=30)
            if not events:
                return "No significant weaknesses detected in the last 30 days."
            
            # Count by module/metric
            counts = {}
            scores = {}
            for event in events:
                key = f"{event.get('module')}/{event.get('metric_name')}"
                counts[key] = counts.get(key, 0) + 1
                if event.get('metric_value') is not None:
                    if key not in scores:
                        scores[key] = []
                    scores[key].append(event['metric_value'])
            
            # Format summary
            lines = ["User weakness patterns (last 30 days):"]
            for key, count in sorted(counts.items(), key=lambda x: -x[1]):
                avg_score = sum(scores.get(key, [0])) / len(scores.get(key, [1]))
                lines.append(f"- {key}: {count} occurrences (avg: {avg_score:.2f})")
            
            return "\n".join(lines)
        except Exception as e:
            logger.error(f"Failed to calculate weakness summary: {e}")
            return "Error calculating weakness summary."
    
    async def get_patterns(self) -> List[Dict[str, Any]]:
        """Get detected patterns for this user."""
        if not self.pool:
            return []
        
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT * FROM user_patterns
                    WHERE user_id = $1
                    ORDER BY confidence DESC, occurrence_count DESC
                    """,
                    self.user_id
                )
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to get patterns: {e}")
            return []
    
    async def update_patterns(self) -> int:
        """
        Analyze memory and update patterns table.
        Returns number of patterns updated.
        """
        if not self.pool:
            return 0
        
        try:
            async with self.pool.acquire() as conn:
                result = await conn.fetchval(
                    "SELECT update_user_patterns($1)",
                    self.user_id
                )
                return result or 0
        except Exception as e:
            logger.error(f"Failed to update patterns: {e}")
            return 0
    
    # ==================== Context for Orchestrator ====================
    
    async def get_orchestrator_context(self) -> Dict[str, Any]:
        """
        Get complete context for orchestrator decision-making.
        
        Returns a dict with:
        - weakness_summary: Text summary for LLM
        - recent_events: Last 10 events
        - patterns: Detected patterns
        - stats: Aggregate statistics
        """
        context = {
            "user_id": self.user_id,
            "weakness_summary": await self.get_weakness_summary(),
            "recent_events": await self.get_recent_events(limit=10),
            "patterns": await self.get_patterns(),
            "stats": await self._calculate_stats()
        }
        return context
    
    async def _calculate_stats(self) -> Dict[str, Any]:
        """Calculate aggregate statistics from memory."""
        if not self.pool:
            return {}
        
        try:
            async with self.pool.acquire() as conn:
                # Get event counts by type
                rows = await conn.fetch(
                    """
                    SELECT event_type, COUNT(*) as count
                    FROM user_memory
                    WHERE user_id = $1
                      AND created_at > now() - INTERVAL '30 days'
                    GROUP BY event_type
                    """,
                    self.user_id
                )
                event_counts = {row['event_type']: row['count'] for row in rows}
                
                # Get average scores by module/metric
                rows = await conn.fetch(
                    """
                    SELECT module, metric_name, AVG(metric_value) as avg_score
                    FROM user_memory
                    WHERE user_id = $1
                      AND metric_value IS NOT NULL
                      AND created_at > now() - INTERVAL '30 days'
                    GROUP BY module, metric_name
                    """,
                    self.user_id
                )
                avg_scores = {
                    f"{row['module']}/{row['metric_name']}": round(row['avg_score'], 3)
                    for row in rows
                }
                
                return {
                    "event_counts": event_counts,
                    "avg_scores": avg_scores,
                    "total_events_30d": sum(event_counts.values())
                }
        except Exception as e:
            logger.error(f"Failed to calculate stats: {e}")
            return {}


# ==================== Factory Function ====================

def create_user_memory(user_id: str, pool=None) -> UserMemory:
    """
    Factory function to create a UserMemory instance.
    
    Args:
        user_id: UUID of the user
        pool: asyncpg connection pool
    
    Returns:
        UserMemory instance
    """
    return UserMemory(user_id=user_id, pool=pool)
