"""
Feedback Engine — Groq LLM-Powered Interview Coaching
======================================================

Uses the Groq API (llama-3.3-70b-versatile) to generate personalized,
actionable interview coaching feedback from:
  - Stress timeline data (per-question analysis)
  - User profile (strengths, weaknesses, experience)
  - Engagement patterns (eye contact, head stability)
  - Comfort zones and struggle areas

This module generates 3 types of feedback:
  1. QuickFeedback — 2-3 sentence summary generated immediately
  2. DetailedFeedback — deep per-question coaching + action plan
  3. ProgressFeedback — compares current session with past sessions

Author: StudyMate Platform
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False


# ═══════════════════════════════════════════════════════════════════════
# Feedback Dataclasses
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class QuickFeedback:
    """Short, immediate feedback after each question or section."""
    summary: str               # 2-3 sentence overview
    stress_comment: str        # "Your stress was moderate — within normal range"
    engagement_comment: str    # "Good eye contact throughout"
    top_flag: str              # single most important thing to note
    encouragement: str         # positive reinforcement

    def to_dict(self) -> Dict:
        return {
            "summary": self.summary,
            "stress_comment": self.stress_comment,
            "engagement_comment": self.engagement_comment,
            "top_flag": self.top_flag,
            "encouragement": self.encouragement,
        }


@dataclass
class QuestionFeedback:
    """Detailed feedback for a single question."""
    question_text: str
    stress_assessment: str     # "Your stress spiked 40% on this system design question"
    body_language_notes: str   # "Jaw clenching detected — try relaxing your jaw"
    what_went_well: str
    what_to_improve: str
    practice_tip: str          # actionable practice recommendation
    studymate_metric: str      # which of the 6 metrics this relates to

    def to_dict(self) -> Dict:
        return {
            "question_text": self.question_text,
            "stress_assessment": self.stress_assessment,
            "body_language_notes": self.body_language_notes,
            "what_went_well": self.what_went_well,
            "what_to_improve": self.what_to_improve,
            "practice_tip": self.practice_tip,
            "studymate_metric": self.studymate_metric,
        }


@dataclass
class DetailedFeedback:
    """Comprehensive post-interview feedback."""
    overall_summary: str
    per_question: List[QuestionFeedback]
    strengths_identified: List[str]
    areas_for_growth: List[str]
    action_plan: List[str]      # 3-5 concrete next steps
    confidence_assessment: str   # "Your confidence is building — 20% calmer than last session"
    recommended_focus: str       # what to practice next
    studymate_metrics_commentary: Dict[str, str]  # per-metric feedback

    def to_dict(self) -> Dict:
        return {
            "overall_summary": self.overall_summary,
            "per_question": [q.to_dict() for q in self.per_question],
            "strengths_identified": self.strengths_identified,
            "areas_for_growth": self.areas_for_growth,
            "action_plan": self.action_plan,
            "confidence_assessment": self.confidence_assessment,
            "recommended_focus": self.recommended_focus,
            "studymate_metrics_commentary": self.studymate_metrics_commentary,
        }


@dataclass
class ProgressFeedback:
    """Comparison with previous sessions — shows growth over time."""
    sessions_compared: int
    stress_trend: str           # "Decreasing" | "Stable" | "Increasing"
    improvement_areas: List[str]
    persistent_struggles: List[str]
    milestone_message: str      # "You've completed 5 practice interviews!"
    next_challenge: str         # what to try next

    def to_dict(self) -> Dict:
        return {
            "sessions_compared": self.sessions_compared,
            "stress_trend": self.stress_trend,
            "improvement_areas": self.improvement_areas,
            "persistent_struggles": self.persistent_struggles,
            "milestone_message": self.milestone_message,
            "next_challenge": self.next_challenge,
        }


# ═══════════════════════════════════════════════════════════════════════
# Prompt Templates
# ═══════════════════════════════════════════════════════════════════════


QUICK_FEEDBACK_PROMPT = """You are StudyMate's Interview Coach AI. Analyze this interview moment and provide brief, encouraging feedback.

## Current Question
{question_text}

## Stress Data
- Average stress: {avg_stress:.2f} (scale 0-1, 0.35 = calm, 0.65 = high)
- Peak stress: {peak_stress:.2f}
- Engagement score: {avg_engagement:.2f}
- Stress trend during question: {stress_trend}
{deception_info}

## User Profile
- Target role: {target_role}
- Experience: {experience_level}
- Known strengths: {strengths}
- Working on: {focus_areas}

Respond in exactly this JSON format (no extra text):
{{
  "summary": "2-3 sentence overview of how they handled this question",
  "stress_comment": "brief comment on their stress level in context",
  "engagement_comment": "brief comment on their engagement/body language",
  "top_flag": "the single most important observation (positive or constructive)",
  "encouragement": "brief positive reinforcement"
}}"""


DETAILED_FEEDBACK_PROMPT = """You are StudyMate's Interview Coach AI. Generate comprehensive post-interview coaching feedback.

## Interview Summary
- Interview type: {interview_type}
- Duration: {duration_seconds:.0f} seconds
- Questions asked: {questions_asked}
- Average stress: {avg_stress:.2f}
- Maximum stress: {max_stress:.2f}
- Average engagement: {avg_engagement:.2f}
- Calm percentage: {calm_percentage:.1f}%
- Stress percentage: {stress_percentage:.1f}%

## Per-Question Analysis
{per_question_json}

## Comfort Zones (questions where user was calm)
{comfort_zones}

## Struggle Areas (questions where user showed elevated stress)
{struggle_areas}

## StudyMate Behavioral Metrics (0-1 scale)
{studymate_metrics_json}

## User Profile
- Target role: {target_role}
- Experience level: {experience_level}
- Strengths: {strengths}
- Weaknesses: {weaknesses}
- Focus areas: {focus_areas}
- Past sessions: {session_count}
- Previous average stress: {previous_avg_stress:.2f}

## Deception Analysis
{deception_json}

Generate detailed coaching feedback. Be specific, actionable, and encouraging. Reference specific questions and moments.

Respond in exactly this JSON format (no markdown, no extra text):
{{
  "overall_summary": "3-4 sentence overview of interview performance",
  "per_question": [
    {{
      "question_text": "the question",
      "stress_assessment": "how they handled stress on this question",
      "body_language_notes": "specific body language observations",
      "what_went_well": "positive observation",
      "what_to_improve": "constructive suggestion",
      "practice_tip": "specific practice recommendation",
      "studymate_metric": "which of the 6 metrics this relates to most"
    }}
  ],
  "strengths_identified": ["strength 1", "strength 2"],
  "areas_for_growth": ["area 1", "area 2"],
  "action_plan": ["step 1", "step 2", "step 3"],
  "confidence_assessment": "assessment of overall confidence trajectory",
  "recommended_focus": "what to practice next",
  "studymate_metrics_commentary": {{
    "clarification_habit": "feedback on this metric",
    "structure": "feedback on this metric",
    "tradeoff_awareness": "feedback on this metric",
    "scalability_thinking": "feedback on this metric",
    "failure_awareness": "feedback on this metric",
    "adaptability": "feedback on this metric"
  }}
}}"""


PROGRESS_FEEDBACK_PROMPT = """You are StudyMate's Interview Coach AI. Compare the user's current interview with their history.

## Current Session
- Average stress: {current_avg_stress:.2f}
- Average engagement: {current_avg_engagement:.2f}
- Struggle areas: {current_struggles}
- Comfort zones: {current_comforts}
- StudyMate metrics: {current_metrics_json}

## Historical Data
- Total sessions: {total_sessions}
- Previous average stress: {historical_avg_stress:.2f}
- Common struggle topics: {historical_struggles}
- Improving areas: {improving_areas}

## User Profile
- Target role: {target_role}
- Experience: {experience_level}

Generate progress feedback. Be encouraging about improvements and specific about what to work on.

Respond in exactly this JSON format:
{{
  "stress_trend": "Decreasing|Stable|Increasing",
  "improvement_areas": ["area where they improved"],
  "persistent_struggles": ["area still needing work"],
  "milestone_message": "encouraging milestone message",
  "next_challenge": "what to try in their next session"
}}"""


# ═══════════════════════════════════════════════════════════════════════
# Feedback Engine
# ═══════════════════════════════════════════════════════════════════════


class FeedbackEngine:
    """Generates personalized interview coaching using Groq LLM.
    
    Usage:
        engine = FeedbackEngine(groq_api_key="gsk_...")
        
        # Quick feedback after a question
        quick = engine.generate_quick_feedback(question_analysis, user_profile)
        
        # Detailed feedback after full interview
        detailed = engine.generate_detailed_feedback(session_summary, user_profile)
        
        # Progress comparison with past sessions
        progress = engine.generate_progress_feedback(current, history, user_profile)
    """

    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        model: str = "llama-3.3-70b-versatile",
    ) -> None:
        self.model = model
        self.api_key = groq_api_key or os.environ.get("GROQ_API_KEY", "")

        if GROQ_AVAILABLE and self.api_key:
            self.client = Groq(api_key=self.api_key)
        else:
            self.client = None

    @property
    def is_available(self) -> bool:
        return self.client is not None

    def _call_llm(self, prompt: str) -> Optional[Dict]:
        """Call Groq LLM and parse JSON response."""
        if not self.is_available:
            return None

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert interview coach. Respond ONLY with valid JSON. "
                            "No markdown, no code fences, no extra text. "
                            "Be specific, actionable, and encouraging."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=2000,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content
            return json.loads(content) if content else None
        except Exception as e:
            print(f"⚠️ LLM call failed: {e}")
            return None

    # ── Quick Feedback ───────────────────────────────────────────

    def generate_quick_feedback(
        self,
        question_analysis: Dict,
        user_profile: Optional[Dict] = None,
    ) -> QuickFeedback:
        """Generate 2-3 sentence feedback for a single question.
        
        Args:
            question_analysis: Output from QuestionAnalysis.to_dict()
            user_profile: Output from UserProfile.to_dict()
        """
        profile = user_profile or {}

        deception_info = ""
        if question_analysis.get("deception_flags", 0) > 0:
            deception_info = f"- Deception flags detected: {question_analysis['deception_flags']}"

        prompt = QUICK_FEEDBACK_PROMPT.format(
            question_text=question_analysis.get("question_text", "Unknown question"),
            avg_stress=question_analysis.get("avg_stress", 0.5),
            peak_stress=question_analysis.get("peak_stress", 0.5),
            avg_engagement=question_analysis.get("avg_engagement", 0.5),
            stress_trend=question_analysis.get("stress_trend", "stable"),
            deception_info=deception_info,
            target_role=profile.get("target_role", "software engineer"),
            experience_level=profile.get("experience_level", "beginner"),
            strengths=", ".join(profile.get("strengths", ["unknown"])),
            focus_areas=", ".join(profile.get("focus_areas", ["general preparation"])),
        )

        result = self._call_llm(prompt)

        if result:
            return QuickFeedback(
                summary=result.get("summary", "Good effort on this question."),
                stress_comment=result.get("stress_comment", "Stress levels were within normal range."),
                engagement_comment=result.get("engagement_comment", "Engagement was adequate."),
                top_flag=result.get("top_flag", "Keep practicing!"),
                encouragement=result.get("encouragement", "You're making progress!"),
            )

        # Fallback: rule-based feedback when LLM is unavailable
        return self._fallback_quick_feedback(question_analysis)

    def _fallback_quick_feedback(self, q: Dict) -> QuickFeedback:
        """Rule-based quick feedback when Groq is unavailable."""
        avg_stress = q.get("avg_stress", 0.5)
        engagement = q.get("avg_engagement", 0.5)
        trend = q.get("stress_trend", "stable")

        if avg_stress < 0.35:
            stress_comment = "You appeared calm and collected — great composure."
        elif avg_stress < 0.55:
            stress_comment = "Moderate stress detected — within the normal range for interviews."
        else:
            stress_comment = "Elevated stress noticed on this question. Try the 4-7-8 breathing technique."

        if engagement > 0.6:
            engagement_comment = "Strong eye contact and attentiveness throughout."
        elif engagement > 0.35:
            engagement_comment = "Engagement was adequate. Try maintaining more consistent eye contact."
        else:
            engagement_comment = "Low engagement detected — focus on looking at the camera."

        if trend == "decreasing":
            top_flag = "Your stress decreased as you spoke — you recovered well."
        elif trend == "increasing":
            top_flag = "Stress increased during this question. Take a pause before answering."
        else:
            top_flag = "Steady performance on this question."

        return QuickFeedback(
            summary=f"Stress: {avg_stress:.0%}, Engagement: {engagement:.0%}. {stress_comment}",
            stress_comment=stress_comment,
            engagement_comment=engagement_comment,
            top_flag=top_flag,
            encouragement="Every practice session builds your confidence. Keep going!",
        )

    # ── Detailed Feedback ────────────────────────────────────────

    def generate_detailed_feedback(
        self,
        session_summary: Dict,
        user_profile: Optional[Dict] = None,
    ) -> DetailedFeedback:
        """Generate comprehensive post-interview coaching.
        
        Args:
            session_summary: Output from InterviewSession.get_timeline_summary()
            user_profile: Output from UserProfile.to_dict()
        """
        profile = user_profile or {}

        prompt = DETAILED_FEEDBACK_PROMPT.format(
            interview_type=session_summary.get("interview_type", "general"),
            duration_seconds=session_summary.get("duration_seconds", 0),
            questions_asked=session_summary.get("questions_asked", 0),
            avg_stress=session_summary.get("avg_stress", 0.5),
            max_stress=session_summary.get("max_stress", 0.5),
            avg_engagement=session_summary.get("avg_engagement", 0.5),
            calm_percentage=session_summary.get("calm_percentage", 50),
            stress_percentage=session_summary.get("stress_percentage", 20),
            per_question_json=json.dumps(
                session_summary.get("per_question_analysis", []), indent=2
            ),
            comfort_zones=", ".join(session_summary.get("comfort_zones", ["none"])),
            struggle_areas=", ".join(session_summary.get("struggle_areas", ["none"])),
            studymate_metrics_json=json.dumps(
                session_summary.get("studymate_metrics", {}), indent=2
            ),
            deception_json=json.dumps(
                session_summary.get("deception_analysis", {}), indent=2
            ),
            target_role=profile.get("target_role", "software engineer"),
            experience_level=profile.get("experience_level", "beginner"),
            strengths=", ".join(profile.get("strengths", ["unknown"])),
            weaknesses=", ".join(profile.get("weaknesses", ["unknown"])),
            focus_areas=", ".join(profile.get("focus_areas", ["general preparation"])),
            session_count=profile.get("session_count", 0),
            previous_avg_stress=profile.get("previous_avg_stress", 0.5),
        )

        result = self._call_llm(prompt)

        if result:
            per_question = [
                QuestionFeedback(
                    question_text=q.get("question_text", ""),
                    stress_assessment=q.get("stress_assessment", ""),
                    body_language_notes=q.get("body_language_notes", ""),
                    what_went_well=q.get("what_went_well", ""),
                    what_to_improve=q.get("what_to_improve", ""),
                    practice_tip=q.get("practice_tip", ""),
                    studymate_metric=q.get("studymate_metric", ""),
                )
                for q in result.get("per_question", [])
            ]
            return DetailedFeedback(
                overall_summary=result.get("overall_summary", ""),
                per_question=per_question,
                strengths_identified=result.get("strengths_identified", []),
                areas_for_growth=result.get("areas_for_growth", []),
                action_plan=result.get("action_plan", []),
                confidence_assessment=result.get("confidence_assessment", ""),
                recommended_focus=result.get("recommended_focus", ""),
                studymate_metrics_commentary=result.get("studymate_metrics_commentary", {}),
            )

        # Fallback
        return self._fallback_detailed_feedback(session_summary)

    def _fallback_detailed_feedback(self, s: Dict) -> DetailedFeedback:
        """Rule-based detailed feedback when Groq is unavailable."""
        avg_stress = s.get("avg_stress", 0.5)
        avg_eng = s.get("avg_engagement", 0.5)
        struggles = s.get("struggle_areas", [])
        comforts = s.get("comfort_zones", [])
        metrics = s.get("studymate_metrics", {})

        strengths = []
        growth = []
        if avg_stress < 0.4:
            strengths.append("Strong composure — you stayed calm under pressure")
        else:
            growth.append("Stress management — practice breathing exercises before tough questions")
        if avg_eng > 0.6:
            strengths.append("Excellent engagement and eye contact")
        else:
            growth.append("Engagement — maintain consistent eye contact with the camera")
        if comforts:
            strengths.append(f"Comfort with: {', '.join(comforts[:2])}")
        if struggles:
            growth.append(f"Areas to practice: {', '.join(struggles[:2])}")

        metrics_commentary = {}
        for metric, score in metrics.items():
            if score >= 0.7:
                metrics_commentary[metric] = f"Strong ({score:.0%}) — keep it up."
            elif score >= 0.4:
                metrics_commentary[metric] = f"Developing ({score:.0%}) — shows promise."
            else:
                metrics_commentary[metric] = f"Needs work ({score:.0%}) — consider focused practice."

        action_plan = [
            "Practice answering one struggle-area question daily",
            "Record yourself and review body language",
            "Use the 4-7-8 breathing technique before each session",
        ]

        return DetailedFeedback(
            overall_summary=(
                f"Your average stress was {avg_stress:.0%} with {avg_eng:.0%} engagement. "
                f"You handled {len(comforts)} questions comfortably and "
                f"showed elevated stress on {len(struggles)} questions."
            ),
            per_question=[],  # No per-question without LLM
            strengths_identified=strengths,
            areas_for_growth=growth,
            action_plan=action_plan,
            confidence_assessment=(
                "Your confidence is building with each session."
                if avg_stress < 0.5
                else "Work on managing stress peaks — it will improve with practice."
            ),
            recommended_focus=(
                struggles[0] if struggles else "Continue general interview practice"
            ),
            studymate_metrics_commentary=metrics_commentary,
        )

    # ── Progress Feedback ────────────────────────────────────────

    def generate_progress_feedback(
        self,
        current_summary: Dict,
        historical_sessions: List[Dict],
        user_profile: Optional[Dict] = None,
    ) -> ProgressFeedback:
        """Compare current session with past sessions.
        
        Args:
            current_summary: Output from InterviewSession.get_timeline_summary()
            historical_sessions: List of past session summaries from Supabase
            user_profile: Output from UserProfile.to_dict()
        """
        if not historical_sessions:
            return ProgressFeedback(
                sessions_compared=0,
                stress_trend="Baseline",
                improvement_areas=[],
                persistent_struggles=[],
                milestone_message="Welcome to your first practice interview session!",
                next_challenge="Complete 3 practice interviews to start tracking your progress.",
            )

        profile = user_profile or {}

        # Calculate historical averages
        hist_stresses = [s.get("avg_stress", 0.5) for s in historical_sessions]
        historical_avg = sum(hist_stresses) / len(hist_stresses) if hist_stresses else 0.5

        # Find improving areas (struggle areas that no longer appear)
        past_struggles = set()
        for s in historical_sessions:
            past_struggles.update(s.get("struggle_areas", []))
        current_struggles = set(current_summary.get("struggle_areas", []))
        improving = list(past_struggles - current_struggles)

        prompt = PROGRESS_FEEDBACK_PROMPT.format(
            current_avg_stress=current_summary.get("avg_stress", 0.5),
            current_avg_engagement=current_summary.get("avg_engagement", 0.5),
            current_struggles=", ".join(current_summary.get("struggle_areas", ["none"])),
            current_comforts=", ".join(current_summary.get("comfort_zones", ["none"])),
            current_metrics_json=json.dumps(
                current_summary.get("studymate_metrics", {}), indent=2
            ),
            total_sessions=len(historical_sessions) + 1,
            historical_avg_stress=historical_avg,
            historical_struggles=", ".join(list(past_struggles)[:5]) or "none",
            improving_areas=", ".join(improving[:3]) or "none identified yet",
            target_role=profile.get("target_role", "software engineer"),
            experience_level=profile.get("experience_level", "beginner"),
        )

        result = self._call_llm(prompt)

        total = len(historical_sessions) + 1

        if result:
            return ProgressFeedback(
                sessions_compared=total,
                stress_trend=result.get("stress_trend", "Stable"),
                improvement_areas=result.get("improvement_areas", []),
                persistent_struggles=result.get("persistent_struggles", []),
                milestone_message=result.get("milestone_message", f"You've completed {total} sessions!"),
                next_challenge=result.get("next_challenge", "Keep practicing!"),
            )

        # Fallback
        current_stress = current_summary.get("avg_stress", 0.5)
        if current_stress < historical_avg - 0.05:
            trend = "Decreasing"
        elif current_stress > historical_avg + 0.05:
            trend = "Increasing"
        else:
            trend = "Stable"

        persistent = list(current_struggles & past_struggles)

        return ProgressFeedback(
            sessions_compared=total,
            stress_trend=trend,
            improvement_areas=improving[:3],
            persistent_struggles=persistent[:3],
            milestone_message=f"Session #{total} complete! {'Great progress!' if trend == 'Decreasing' else 'Keep practicing!'}",
            next_challenge=(
                f"Focus on: {persistent[0]}" if persistent
                else "Try a harder interview difficulty level"
            ),
        )

    # ── Batch Utilities ──────────────────────────────────────────

    def generate_all_feedback(
        self,
        session_summary: Dict,
        user_profile: Optional[Dict] = None,
        historical_sessions: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """Generate all feedback types in one call.
        
        Returns dict with keys: "detailed", "progress", "quick_per_question"
        """
        detailed = self.generate_detailed_feedback(session_summary, user_profile)

        progress = None
        if historical_sessions is not None:
            progress = self.generate_progress_feedback(
                session_summary, historical_sessions, user_profile
            )

        quick_list = []
        for q_analysis in session_summary.get("per_question_analysis", []):
            quick = self.generate_quick_feedback(q_analysis, user_profile)
            quick_list.append(quick.to_dict())

        return {
            "detailed": detailed.to_dict(),
            "progress": progress.to_dict() if progress else None,
            "quick_per_question": quick_list,
        }
