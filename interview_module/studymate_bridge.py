"""
StudyMate Bridge — Interview Module ↔ StudyMate Integration Layer
==================================================================

Bridges the interview stress analyzer with StudyMate's:
  - Orchestrator (provides stress-aware recommendations)
  - Evaluator (supplements text-based scores with behavioral scores)
  - Profile Service (syncs user profile for personalization)

This module does NOT run MediaPipe — it accepts pre-computed stress data
and translates it for the StudyMate backend.

Usage:
    from interview_module.studymate_bridge import StudyMateBridge

    bridge = StudyMateBridge(groq_api_key="gsk_...")
    
    # After an interview session…
    result = bridge.process_interview_session(
        session_summary=session.get_timeline_summary(),
        user_profile=profile.to_dict(),
    )
    # result contains: metrics, feedback, orchestrator_recommendations

Author: StudyMate Platform
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any

try:
    from .stress_model import (
        StressEstimator,
        InterviewSession,
        UserProfile,
        QuestionContext,
        STUDYMATE_METRICS,
    )
    from .feedback_engine import FeedbackEngine
except ImportError:
    from stress_model import (
        StressEstimator,
        InterviewSession,
        UserProfile,
        QuestionContext,
        STUDYMATE_METRICS,
    )
    from feedback_engine import FeedbackEngine


# ═══════════════════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════════════════

# Weight given to behavioral (facial) scores vs text evaluation scores
BEHAVIORAL_WEIGHT = 0.25   # 25% behavioral, 75% text-based
TEXT_WEIGHT = 0.75

# Orchestrator recommendation thresholds
RECOMMEND_HARDER = 0.35     # avg_stress below this → suggest harder questions
RECOMMEND_EASIER = 0.7      # avg_stress above this → suggest easier questions
RECOMMEND_PRACTICE = 0.55   # stress on specific topic above this → recommend practice


# ═══════════════════════════════════════════════════════════════════════
# Orchestrator Recommendation
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class OrchestratorRecommendation:
    """Recommendation for the orchestrator based on stress analysis."""
    action: str                  # "increase_difficulty" | "decrease_difficulty" | "change_topic" | "continue" | "take_break"
    reason: str
    suggested_topics: List[str]
    suggested_difficulty: str    # "easy" | "medium" | "hard"
    confidence: float            # 0-1

    def to_dict(self) -> Dict:
        return {
            "action": self.action,
            "reason": self.reason,
            "suggested_topics": self.suggested_topics,
            "suggested_difficulty": self.suggested_difficulty,
            "confidence": self.confidence,
        }


@dataclass
class InterviewResult:
    """Complete result package from processing an interview session."""
    # StudyMate 6-metric behavioral scores (0-1)
    behavioral_metrics: Dict[str, float]
    # Combined metrics (behavioral + text) — only if text scores provided
    combined_metrics: Optional[Dict[str, float]]
    # Orchestrator recommendations
    recommendations: List[OrchestratorRecommendation]
    # LLM-generated feedback
    feedback: Optional[Dict]
    # Session metadata
    session_id: str
    avg_stress: float
    avg_engagement: float
    comfort_zones: List[str]
    struggle_areas: List[str]
    # Per-question analysis
    per_question: List[Dict]

    def to_dict(self) -> Dict:
        return {
            "behavioral_metrics": self.behavioral_metrics,
            "combined_metrics": self.combined_metrics,
            "recommendations": [r.to_dict() for r in self.recommendations],
            "feedback": self.feedback,
            "session_id": self.session_id,
            "avg_stress": self.avg_stress,
            "avg_engagement": self.avg_engagement,
            "comfort_zones": self.comfort_zones,
            "struggle_areas": self.struggle_areas,
            "per_question": self.per_question,
        }


# ═══════════════════════════════════════════════════════════════════════
# Bridge Class
# ═══════════════════════════════════════════════════════════════════════


class StudyMateBridge:
    """Bridges the interview module with StudyMate's evaluation system.
    
    Responsibilities:
    1. Translate stress timeline → StudyMate 6-metric behavioral scores
    2. Combine behavioral scores with text-based evaluation scores
    3. Generate orchestrator recommendations (harder/easier/change topic)
    4. Generate LLM coaching feedback via FeedbackEngine
    5. Provide data for the profile service (learning patterns)
    """

    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        behavioral_weight: float = BEHAVIORAL_WEIGHT,
    ) -> None:
        self.behavioral_weight = behavioral_weight
        self.text_weight = 1.0 - behavioral_weight

        self.feedback_engine = FeedbackEngine(groq_api_key=groq_api_key)

    # ── Main Entry Point ─────────────────────────────────────────

    def process_interview_session(
        self,
        session_summary: Dict,
        user_profile: Optional[Dict] = None,
        text_evaluation_scores: Optional[Dict[str, float]] = None,
        historical_sessions: Optional[List[Dict]] = None,
        generate_feedback: bool = True,
    ) -> InterviewResult:
        """Process a completed interview session.
        
        Args:
            session_summary: Output from InterviewSession.get_timeline_summary()
            user_profile: Output from UserProfile.to_dict()
            text_evaluation_scores: StudyMate evaluator scores (6 metrics, 0-1)
            historical_sessions: Past session summaries for progress tracking
            generate_feedback: Whether to call the LLM for feedback
        
        Returns:
            InterviewResult with metrics, recommendations, and feedback
        """
        behavioral_metrics = session_summary.get("studymate_metrics", {})
        if not behavioral_metrics:
            behavioral_metrics = {m: 0.5 for m in STUDYMATE_METRICS}

        # Combine with text scores if available
        combined = None
        if text_evaluation_scores:
            combined = self.combine_metrics(behavioral_metrics, text_evaluation_scores)

        # Generate orchestrator recommendations
        recommendations = self.generate_recommendations(
            session_summary, user_profile
        )

        # Generate LLM feedback
        feedback = None
        if generate_feedback:
            try:
                feedback = self.feedback_engine.generate_all_feedback(
                    session_summary, user_profile, historical_sessions
                )
            except Exception as e:
                print(f"⚠️ Feedback generation failed: {e}")

        per_question = session_summary.get("per_question_analysis", [])

        return InterviewResult(
            behavioral_metrics=behavioral_metrics,
            combined_metrics=combined,
            recommendations=recommendations,
            feedback=feedback,
            session_id=session_summary.get("session_id", "unknown"),
            avg_stress=session_summary.get("avg_stress", 0.5),
            avg_engagement=session_summary.get("avg_engagement", 0.5),
            comfort_zones=session_summary.get("comfort_zones", []),
            struggle_areas=session_summary.get("struggle_areas", []),
            per_question=per_question,
        )

    # ── Metric Combination ───────────────────────────────────────

    def combine_metrics(
        self,
        behavioral: Dict[str, float],
        text_scores: Dict[str, float],
    ) -> Dict[str, float]:
        """Weighted combination of behavioral and text-based scores.
        
        Behavioral scores come from facial analysis (this module).
        Text scores come from the evaluator's LLM analysis of answers.
        """
        combined = {}
        for metric in STUDYMATE_METRICS:
            b_score = behavioral.get(metric, 0.5)
            t_score = text_scores.get(metric, 0.5)
            combined[metric] = round(
                self.behavioral_weight * b_score + self.text_weight * t_score,
                3,
            )
        return combined

    # ── Recommendations ──────────────────────────────────────────

    def generate_recommendations(
        self,
        session_summary: Dict,
        user_profile: Optional[Dict] = None,
    ) -> List[OrchestratorRecommendation]:
        """Generate adaptive interview recommendations for the orchestrator.
        
        Logic:
        - Too calm → increase difficulty (they're not being challenged)
        - Too stressed → decrease difficulty or change topic
        - Specific topic stress → recommend practice on that topic
        - Low engagement → suggest a break or more interactive questions
        """
        recs: List[OrchestratorRecommendation] = []
        avg_stress = session_summary.get("avg_stress", 0.5)
        avg_engagement = session_summary.get("avg_engagement", 0.5)
        struggles = session_summary.get("struggle_areas", [])
        comforts = session_summary.get("comfort_zones", [])
        per_question = session_summary.get("per_question_analysis", [])

        profile = user_profile or {}
        weaknesses = profile.get("weaknesses", [])

        # 1. Overall difficulty adjustment
        if avg_stress < RECOMMEND_HARDER and avg_engagement > 0.5:
            recs.append(OrchestratorRecommendation(
                action="increase_difficulty",
                reason=f"Low overall stress ({avg_stress:.0%}) with good engagement — candidate is ready for harder questions.",
                suggested_topics=comforts[:2] if comforts else [],
                suggested_difficulty="hard",
                confidence=0.8 if len(per_question) >= 3 else 0.5,
            ))
        elif avg_stress > RECOMMEND_EASIER:
            recs.append(OrchestratorRecommendation(
                action="decrease_difficulty",
                reason=f"High stress ({avg_stress:.0%}) detected. Reduce difficulty to build confidence.",
                suggested_topics=comforts[:2] if comforts else [],
                suggested_difficulty="easy",
                confidence=0.8,
            ))

        # 2. Topic-specific recommendations
        for q in per_question:
            q_stress = q.get("avg_stress", 0.5)
            q_text = q.get("question_text", "")
            q_ctx = q.get("question_context", {})
            topic = q_ctx.get("topic", "") if q_ctx else ""

            if q_stress > RECOMMEND_PRACTICE:
                recs.append(OrchestratorRecommendation(
                    action="recommend_practice",
                    reason=f"High stress ({q_stress:.0%}) on '{q_text[:50]}...' — recommend more practice on this topic.",
                    suggested_topics=[topic] if topic else [q_text[:30]],
                    suggested_difficulty="medium",
                    confidence=0.7,
                ))

        # 3. Engagement-based recommendations
        if avg_engagement < 0.3:
            recs.append(OrchestratorRecommendation(
                action="take_break",
                reason=f"Low engagement ({avg_engagement:.0%}). Candidate may need a break or more interactive format.",
                suggested_topics=[],
                suggested_difficulty="easy",
                confidence=0.6,
            ))

        # 4. Weakness-targeting (from user profile)
        if weaknesses and avg_stress < 0.55:
            # User is calm enough to handle their weak areas
            untested_weaknesses = [w for w in weaknesses if w not in
                                   [q.get("question_context", {}).get("topic", "") for q in per_question if q.get("question_context")]]
            if untested_weaknesses:
                recs.append(OrchestratorRecommendation(
                    action="target_weakness",
                    reason="User is calm enough to practice weak areas.",
                    suggested_topics=untested_weaknesses[:2],
                    suggested_difficulty="medium",
                    confidence=0.6,
                ))

        # 5. If no specific recommendations, continue normally
        if not recs:
            recs.append(OrchestratorRecommendation(
                action="continue",
                reason="Performance is within expected range. Continue with planned questions.",
                suggested_topics=[],
                suggested_difficulty="medium",
                confidence=0.5,
            ))

        return recs

    # ── Profile Update Helpers ───────────────────────────────────

    def get_profile_updates(self, session_summary: Dict) -> Dict[str, Any]:
        """Extract data to update the user's StudyMate profile.
        
        Returns dict suitable for updating the profile service:
        - updated previous_avg_stress
        - session_count increment
        - new comfort/struggle topics to track
        """
        return {
            "previous_avg_stress": session_summary.get("avg_stress", 0.5),
            "session_count_increment": 1,
            "new_comfort_zones": session_summary.get("comfort_zones", []),
            "new_struggle_areas": session_summary.get("struggle_areas", []),
            "studymate_metrics": session_summary.get("studymate_metrics", {}),
            "interview_type": session_summary.get("interview_type", "general"),
            "timestamp": session_summary.get("start_time", ""),
        }

    # ── Real-Time Features (for live interview) ──────────────────

    def get_realtime_recommendation(
        self,
        current_stress: float,
        current_engagement: float,
        question_context: Optional[Dict] = None,
    ) -> Optional[OrchestratorRecommendation]:
        """Quick recommendation based on a single stress reading.
        
        Designed to be called during live interviews for adaptive
        question selection.
        """
        if current_stress > 0.8 and current_engagement < 0.3:
            return OrchestratorRecommendation(
                action="take_break",
                reason="Very high stress with low engagement. Consider a lighter question.",
                suggested_topics=[],
                suggested_difficulty="easy",
                confidence=0.7,
            )

        if current_stress > 0.75:
            return OrchestratorRecommendation(
                action="decrease_difficulty",
                reason="High stress peak. Switch to a more comfortable topic.",
                suggested_topics=[],
                suggested_difficulty="easy",
                confidence=0.6,
            )

        if current_stress < 0.2 and current_engagement > 0.7:
            return OrchestratorRecommendation(
                action="increase_difficulty",
                reason="Candidate is very comfortable. Challenge them.",
                suggested_topics=[],
                suggested_difficulty="hard",
                confidence=0.5,
            )

        return None  # No intervention needed
