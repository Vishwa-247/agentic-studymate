"""
Stress Model for AI Micro-Expression Analyzer
===============================================

Enhanced for StudyMate Interview Coach integration.

Additions over the original:
- QuestionContext: question type, difficulty, topic classification
- UserProfile: target role, strengths, weaknesses from onboarding
- Per-question stress analysis with contextual interpretation
- StudyMate 6-metric mapping (behavioral signals → evaluation metrics)
- Stress recovery rate integration
- Engagement-aware scoring (low engagement penalizes separately from stress)
- Adaptive thresholds based on interview stage and question type
- Comfort zone detection (topics that consistently cause stress)
- Supabase tables renamed to stress_sessions / stress_questions / stress_recordings

Author: StudyMate Platform
"""

from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass, field
from typing import Dict, Tuple, List, Optional
from datetime import datetime
import numpy as np

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None

OUTPUT_LABELS: Dict[str, Tuple[str, str]] = {
    "calm": ("🟢", "Calm"),
    "mild": ("🟡", "Slight Stress"),
    "high": ("🔴", "High Stress / Possible Deception Indicators"),
}

# ── StudyMate 6-Metric Names ────────────────────────────────────────
STUDYMATE_METRICS = [
    "clarification_habit",
    "structure",
    "tradeoff_awareness",
    "scalability_thinking",
    "failure_awareness",
    "adaptability",
]


# ═══════════════════════════════════════════════════════════════════════
# NEW: Context & Profile Dataclasses
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class QuestionContext:
    """Context about the interview question being asked.
    
    Allows the stress model to interpret signals differently based on
    question type. For example, high stress on a curveball question is
    expected, but high stress on a simple intro question is concerning.
    """
    question_text: str
    question_type: str = "general"            # "technical" | "behavioral" | "curveball" | "clarification" | "general"
    difficulty: str = "medium"                # "easy" | "medium" | "hard"
    topic: str = ""                           # "system_design" | "algorithms" | "behavioral" | "tradeoffs" | etc.
    interview_stage: str = "main"             # "intro" | "warmup" | "main" | "curveball" | "reflection"
    expected_stress_range: Tuple[float, float] = (0.2, 0.6)  # normal range for this question type
    studymate_metric: str = ""                # which of the 6 metrics this question primarily tests

    def to_dict(self) -> Dict:
        return {
            "question_text": self.question_text,
            "question_type": self.question_type,
            "difficulty": self.difficulty,
            "topic": self.topic,
            "interview_stage": self.interview_stage,
            "expected_stress_range": list(self.expected_stress_range),
            "studymate_metric": self.studymate_metric,
        }

    @staticmethod
    def default_stress_range(question_type: str, difficulty: str) -> Tuple[float, float]:
        """Expected stress ranges by question type + difficulty."""
        ranges = {
            ("general", "easy"): (0.1, 0.35),
            ("general", "medium"): (0.2, 0.5),
            ("general", "hard"): (0.3, 0.65),
            ("technical", "easy"): (0.2, 0.45),
            ("technical", "medium"): (0.3, 0.6),
            ("technical", "hard"): (0.4, 0.75),
            ("behavioral", "easy"): (0.15, 0.4),
            ("behavioral", "medium"): (0.25, 0.55),
            ("behavioral", "hard"): (0.35, 0.65),
            ("curveball", "easy"): (0.35, 0.6),
            ("curveball", "medium"): (0.4, 0.7),
            ("curveball", "hard"): (0.5, 0.85),
            ("clarification", "easy"): (0.1, 0.3),
            ("clarification", "medium"): (0.15, 0.4),
            ("clarification", "hard"): (0.2, 0.5),
        }
        return ranges.get((question_type, difficulty), (0.2, 0.6))


@dataclass
class UserProfile:
    """User context from StudyMate onboarding.
    
    Personalizes stress interpretation. A user who is already confident
    in system design should have lower expected stress on those questions.
    """
    user_id: str = ""
    target_role: str = ""                 # "backend_engineer" | "frontend_developer" | etc.
    experience_level: str = "beginner"    # "beginner" | "intermediate" | "advanced"
    strengths: List[str] = field(default_factory=list)   # topics user is confident in
    weaknesses: List[str] = field(default_factory=list)  # topics user struggles with
    focus_areas: List[str] = field(default_factory=list)  # what user wants to improve
    previous_avg_stress: float = 0.5      # historical average from past sessions
    session_count: int = 0                # how many interviews they've done

    def is_strength(self, topic: str) -> bool:
        return any(s.lower() in topic.lower() or topic.lower() in s.lower()
                   for s in self.strengths)

    def is_weakness(self, topic: str) -> bool:
        return any(w.lower() in topic.lower() or topic.lower() in w.lower()
                   for w in self.weaknesses)

    def to_dict(self) -> Dict:
        return {
            "user_id": self.user_id,
            "target_role": self.target_role,
            "experience_level": self.experience_level,
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "focus_areas": self.focus_areas,
            "previous_avg_stress": self.previous_avg_stress,
            "session_count": self.session_count,
        }


# ═══════════════════════════════════════════════════════════════════════
# Enhanced Dataclasses
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class DeceptionFlags:
    """Red flags that may indicate deception or high anxiety."""
    flags: List[str]
    risk_level: str  # "low" | "medium" | "high"

    def summary(self) -> str:
        if not self.flags:
            return "✅ No major deception indicators"
        return (
            f"⚠️ {self.risk_level.upper()} risk - {len(self.flags)} flag(s):\n"
            + "\n".join(f"  • {f}" for f in self.flags)
        )


@dataclass
class StressScore:
    """Single stress measurement at a point in time."""
    score: float
    label: str
    icon: str
    level: str  # "calm" | "mild" | "high"
    timestamp: float = 0.0
    datetime_str: str = ""
    features: Dict[str, float] = field(default_factory=dict)
    deception_flags: Optional[DeceptionFlags] = None
    baseline_delta: float = 0.0
    confidence: float = 1.0
    # NEW fields
    engagement_score: float = 0.5              # from feature extractor
    question_context: Optional[Dict] = None    # serialized QuestionContext
    stress_vs_expected: float = 0.0            # how far above/below expected range
    recovery_rate: float = 0.0                 # current recovery rate

    def formatted(self) -> str:
        base = f"{self.icon} {self.label} ({self.score:.2f})"
        if self.datetime_str:
            base += f" @ {self.datetime_str}"
        if self.deception_flags and self.deception_flags.flags:
            base += f" | 🚩 {len(self.deception_flags.flags)} flags"
        if self.baseline_delta > 0.15:
            base += f" | ↑{self.baseline_delta:+.2f} from baseline"
        if self.engagement_score < 0.3:
            base += " | ⚠ Low engagement"
        return base

    def to_dict(self) -> Dict:
        return {
            "timestamp": self.timestamp,
            "datetime": self.datetime_str,
            "stress_score": self.score,
            "stress_level": self.level,
            "label": self.label,
            "features": self.features,
            "deception_flags": self.deception_flags.flags if self.deception_flags else [],
            "deception_risk": self.deception_flags.risk_level if self.deception_flags else "low",
            "baseline_delta": self.baseline_delta,
            "confidence": self.confidence,
            "engagement_score": self.engagement_score,
            "question_context": self.question_context,
            "stress_vs_expected": self.stress_vs_expected,
            "recovery_rate": self.recovery_rate,
        }


# ═══════════════════════════════════════════════════════════════════════
# Per-Question Analysis
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class QuestionAnalysis:
    """Deep analysis of user behavior during a single question."""
    question_text: str
    question_context: Optional[QuestionContext]
    recordings: List[StressScore]
    start_time: float
    end_time: float

    @property
    def duration_seconds(self) -> float:
        return self.end_time - self.start_time

    @property
    def avg_stress(self) -> float:
        if not self.recordings:
            return 0.0
        return float(np.mean([r.score for r in self.recordings]))

    @property
    def peak_stress(self) -> float:
        if not self.recordings:
            return 0.0
        return float(max(r.score for r in self.recordings))

    @property
    def stress_trend(self) -> str:
        """Did stress increase, decrease, or stay stable during this question?"""
        if len(self.recordings) < 3:
            return "insufficient_data"
        scores = [r.score for r in self.recordings]
        first_half = np.mean(scores[: len(scores) // 2])
        second_half = np.mean(scores[len(scores) // 2 :])
        delta = second_half - first_half
        if delta > 0.08:
            return "increasing"
        elif delta < -0.08:
            return "decreasing"
        return "stable"

    @property
    def avg_engagement(self) -> float:
        if not self.recordings:
            return 0.5
        return float(np.mean([r.engagement_score for r in self.recordings]))

    @property
    def deception_flag_count(self) -> int:
        return sum(
            len(r.deception_flags.flags) if r.deception_flags else 0
            for r in self.recordings
        )

    def was_comfort_zone(self) -> bool:
        """True if user was consistently calm during this question."""
        return self.avg_stress < 0.35 and self.peak_stress < 0.5

    def was_struggle(self) -> bool:
        """True if user showed elevated stress throughout."""
        return self.avg_stress > 0.55 or self.peak_stress > 0.75

    def to_dict(self) -> Dict:
        return {
            "question_text": self.question_text,
            "question_context": self.question_context.to_dict() if self.question_context else None,
            "duration_seconds": self.duration_seconds,
            "avg_stress": self.avg_stress,
            "peak_stress": self.peak_stress,
            "stress_trend": self.stress_trend,
            "avg_engagement": self.avg_engagement,
            "deception_flags": self.deception_flag_count,
            "was_comfort_zone": self.was_comfort_zone(),
            "was_struggle": self.was_struggle(),
            "recording_count": len(self.recordings),
        }


# ═══════════════════════════════════════════════════════════════════════
# Enhanced Interview Session
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class InterviewSession:
    """Tracks entire interview session with timestamps, context, and analysis."""
    session_id: str
    start_time: float
    recordings: List[StressScore] = field(default_factory=list)
    question_markers: Dict[float, str] = field(default_factory=dict)
    # NEW fields
    user_profile: Optional[UserProfile] = None
    question_contexts: Dict[float, QuestionContext] = field(default_factory=dict)  # timestamp → context
    interview_type: str = "general"     # "technical" | "behavioral" | "production_thinking" | "general"
    metadata: Dict = field(default_factory=dict)

    def add_recording(self, score: StressScore):
        self.recordings.append(score)

    def mark_question(
        self,
        question_text: str,
        timestamp: Optional[float] = None,
        context: Optional[QuestionContext] = None,
    ):
        """Mark when a new question is asked, optionally with rich context."""
        import time
        ts = timestamp or time.time()
        self.question_markers[ts] = question_text
        if context is not None:
            self.question_contexts[ts] = context

    def get_question_at_time(self, timestamp: float) -> Optional[str]:
        question_times = sorted(self.question_markers.keys())
        for i, q_time in enumerate(question_times):
            if timestamp < q_time:
                return self.question_markers[question_times[i - 1]] if i > 0 else None
            if i == len(question_times) - 1:
                return self.question_markers[q_time]
        return None

    def get_context_at_time(self, timestamp: float) -> Optional[QuestionContext]:
        """Get the QuestionContext active at a given timestamp."""
        ctx_times = sorted(self.question_contexts.keys())
        for i, q_time in enumerate(ctx_times):
            if timestamp < q_time:
                return self.question_contexts[ctx_times[i - 1]] if i > 0 else None
            if i == len(ctx_times) - 1:
                return self.question_contexts[q_time]
        return None

    # ── Per-Question Analysis ────────────────────────────────────

    def get_per_question_analysis(self) -> List[QuestionAnalysis]:
        """Break the session into per-question segments and analyze each."""
        if not self.question_markers:
            return []

        q_times = sorted(self.question_markers.keys())
        analyses: List[QuestionAnalysis] = []

        for idx, q_start in enumerate(q_times):
            q_end = q_times[idx + 1] if idx + 1 < len(q_times) else (
                self.recordings[-1].timestamp + 0.1 if self.recordings else q_start + 1
            )
            q_text = self.question_markers[q_start]
            q_ctx = self.question_contexts.get(q_start)
            q_recordings = [r for r in self.recordings if q_start <= r.timestamp < q_end]

            analyses.append(QuestionAnalysis(
                question_text=q_text,
                question_context=q_ctx,
                recordings=q_recordings,
                start_time=q_start,
                end_time=q_end,
            ))

        return analyses

    def get_comfort_zones(self) -> List[str]:
        """Topics / questions where user was consistently calm."""
        return [
            a.question_text for a in self.get_per_question_analysis()
            if a.was_comfort_zone()
        ]

    def get_struggle_areas(self) -> List[str]:
        """Topics / questions where user showed elevated stress."""
        return [
            a.question_text for a in self.get_per_question_analysis()
            if a.was_struggle()
        ]

    # ── StudyMate 6-Metric Mapping ──────────────────────────────

    def compute_studymate_metrics(self) -> Dict[str, float]:
        """Map behavioral signals to StudyMate's 6 evaluation metrics.
        
        These are SUPPLEMENTARY behavioral scores derived from facial
        analysis. They get combined with the text-based evaluation
        scores from the main evaluator.
        
        Scale: 0.0 (poor) to 1.0 (excellent).
        """
        if not self.recordings:
            return {m: 0.5 for m in STUDYMATE_METRICS}

        per_q = self.get_per_question_analysis()
        scores = [r.score for r in self.recordings]
        engagements = [r.engagement_score for r in self.recordings]

        # ── clarification_habit ──────────────────────────────────
        # Behavioral proxy: if user showed LOWER stress on clarification
        # questions and maintained engagement → they're comfortable asking
        clarification_qs = [a for a in per_q if a.question_context
                           and a.question_context.interview_stage == "clarification"]
        if clarification_qs:
            clar_stress = np.mean([a.avg_stress for a in clarification_qs])
            clar_engagement = np.mean([a.avg_engagement for a in clarification_qs])
            clarification_score = float(np.clip(
                (1.0 - clar_stress) * 0.5 + clar_engagement * 0.5, 0.0, 1.0
            ))
        else:
            # No clarification questions tagged — use overall engagement as proxy
            clarification_score = float(np.clip(np.mean(engagements), 0.0, 1.0))

        # ── structure ────────────────────────────────────────────
        # Behavioral proxy: stable stress pattern (not chaotic) + consistent
        # engagement → organized thinking
        stress_std = float(np.std(scores)) if len(scores) > 3 else 0.3
        engagement_consistency = 1.0 - float(np.std(engagements)) if len(engagements) > 3 else 0.5
        structure_score = float(np.clip(
            (1.0 - stress_std / 0.3) * 0.6 + engagement_consistency * 0.4, 0.0, 1.0
        ))

        # ── tradeoff_awareness ───────────────────────────────────
        # Behavioral proxy: moderate (not extreme) stress on hard questions
        # → thoughtful consideration rather than panic or indifference
        hard_qs = [a for a in per_q if a.question_context
                   and a.question_context.difficulty == "hard"]
        if hard_qs:
            avg_hard_stress = np.mean([a.avg_stress for a in hard_qs])
            # Ideal range: 0.3–0.5 (engaged but not panicking)
            tradeoff_score = float(np.clip(
                1.0 - abs(avg_hard_stress - 0.4) / 0.3, 0.0, 1.0
            ))
        else:
            tradeoff_score = float(np.clip(1.0 - abs(np.mean(scores) - 0.4) / 0.3, 0.0, 1.0))

        # ── scalability_thinking ─────────────────────────────────
        # Behavioral proxy: engagement stays high on technical/design questions
        tech_qs = [a for a in per_q if a.question_context
                   and a.question_context.question_type == "technical"]
        if tech_qs:
            scalability_score = float(np.clip(
                np.mean([a.avg_engagement for a in tech_qs]), 0.0, 1.0
            ))
        else:
            scalability_score = float(np.clip(np.mean(engagements) * 0.8, 0.0, 1.0))

        # ── failure_awareness ────────────────────────────────────
        # Behavioral proxy: on curveball questions, stress increases but
        # RECOVERS (shows resilience). Pure high stress = no recovery.
        curveball_qs = [a for a in per_q if a.question_context
                        and a.question_context.interview_stage == "curveball"]
        if curveball_qs:
            recovery_count = sum(1 for a in curveball_qs if a.stress_trend == "decreasing")
            failure_score = float(np.clip(
                recovery_count / max(len(curveball_qs), 1), 0.0, 1.0
            ))
        else:
            # Fall back to overall recovery rate
            recovery_rates = [r.recovery_rate for r in self.recordings if r.recovery_rate > 0]
            failure_score = float(np.clip(
                np.mean(recovery_rates) * 5 if recovery_rates else 0.5, 0.0, 1.0
            ))

        # ── adaptability ────────────────────────────────────────
        # Behavioral proxy: stress decreases over the interview →
        # user adapts to pressure. Also penalizes frozen/disengaged behavior.
        if len(scores) >= 6:
            first_third = np.mean(scores[: len(scores) // 3])
            last_third = np.mean(scores[-len(scores) // 3 :])
            improvement = first_third - last_third  # positive = improved
            adaptability_score = float(np.clip(0.5 + improvement * 2.0, 0.0, 1.0))
        else:
            adaptability_score = 0.5

        return {
            "clarification_habit": round(clarification_score, 3),
            "structure": round(structure_score, 3),
            "tradeoff_awareness": round(tradeoff_score, 3),
            "scalability_thinking": round(scalability_score, 3),
            "failure_awareness": round(failure_score, 3),
            "adaptability": round(adaptability_score, 3),
        }

    # ── Original Analysis Methods ────────────────────────────────

    def get_stress_spikes(self, threshold: float = 0.7) -> List[Dict]:
        spikes = []
        for recording in self.recordings:
            if recording.score >= threshold:
                spikes.append({
                    "timestamp": recording.timestamp,
                    "datetime": recording.datetime_str,
                    "score": recording.score,
                    "level": recording.level,
                    "question": self.get_question_at_time(recording.timestamp),
                    "deception_flags": recording.deception_flags.flags if recording.deception_flags else [],
                })
        return spikes

    def get_deception_summary(self) -> Dict:
        all_flags: List[str] = []
        high_risk_count = 0
        for recording in self.recordings:
            if recording.deception_flags:
                all_flags.extend(recording.deception_flags.flags)
                if recording.deception_flags.risk_level == "high":
                    high_risk_count += 1
        flag_counts = Counter(all_flags)
        return {
            "total_flags": len(all_flags),
            "unique_flag_types": len(set(all_flags)),
            "high_risk_moments": high_risk_count,
            "most_common_flags": flag_counts.most_common(3),
            "overall_risk": "high" if high_risk_count > 5 else "medium" if len(all_flags) > 3 else "low",
        }

    def get_timeline_summary(self) -> Dict:
        if not self.recordings:
            return {}

        scores = [r.score for r in self.recordings]
        levels = [r.level for r in self.recordings]
        engagements = [r.engagement_score for r in self.recordings]
        deception_summary = self.get_deception_summary()
        per_question = self.get_per_question_analysis()
        studymate_metrics = self.compute_studymate_metrics()

        return {
            "session_id": self.session_id,
            "interview_type": self.interview_type,
            "start_time": datetime.fromtimestamp(self.start_time).strftime("%Y-%m-%d %H:%M:%S"),
            "duration_seconds": self.recordings[-1].timestamp - self.start_time if self.recordings else 0,
            "total_recordings": len(self.recordings),
            # Stress metrics
            "avg_stress": round(float(np.mean(scores)), 3),
            "max_stress": round(float(max(scores)), 3),
            "min_stress": round(float(min(scores)), 3),
            "stress_std": round(float(np.std(scores)), 3),
            "stress_spikes": len([s for s in scores if s >= 0.7]),
            "calm_percentage": round((levels.count("calm") / len(levels) * 100) if levels else 0, 1),
            "stress_percentage": round((levels.count("high") / len(levels) * 100) if levels else 0, 1),
            # Engagement metrics (NEW)
            "avg_engagement": round(float(np.mean(engagements)), 3),
            "min_engagement": round(float(min(engagements)), 3),
            # Per-question summary (NEW)
            "questions_asked": len(self.question_markers),
            "per_question_analysis": [a.to_dict() for a in per_question],
            "comfort_zones": self.get_comfort_zones(),
            "struggle_areas": self.get_struggle_areas(),
            # StudyMate metrics (NEW)
            "studymate_metrics": studymate_metrics,
            # Deception analysis
            "deception_analysis": deception_summary,
            "recommendation": self._get_recommendation(deception_summary, float(np.mean(scores))),
            # User context
            "user_profile": self.user_profile.to_dict() if self.user_profile else None,
        }

    def _get_recommendation(self, deception_summary: Dict, avg_stress: float) -> str:
        total_flags = deception_summary["total_flags"]
        risk_level = deception_summary["overall_risk"]

        if risk_level == "high" and avg_stress > 0.7:
            return "⚠️ HIGH RISK - Multiple deception indicators + high stress. Recommend further investigation."
        elif risk_level == "high" or (total_flags >= 3 and avg_stress > 0.65):
            return "⚠️ MEDIUM RISK - Some concerning patterns detected. Proceed with caution."
        elif avg_stress > 0.5:
            return "ℹ️ NORMAL - Expected interview stress levels. No major concerns."
        else:
            return "✅ LOW RISK - Candidate appears genuine and calm throughout interview."

    def export_timeline(self) -> List[Dict]:
        timeline = []
        for recording in self.recordings:
            entry = {
                **recording.to_dict(),
                "question": self.get_question_at_time(recording.timestamp),
                "elapsed_seconds": recording.timestamp - self.start_time,
            }
            ctx = self.get_context_at_time(recording.timestamp)
            if ctx:
                entry["question_context"] = ctx.to_dict()
            timeline.append(entry)
        return timeline

    # ── Supabase Persistence (updated table names) ───────────────

    def save_to_supabase(
        self,
        supabase_url: str,
        supabase_key: str,
        user_id: Optional[str] = None,
    ) -> bool:
        """Save interview session to Supabase (stress_sessions / stress_questions / stress_recordings)."""
        if not SUPABASE_AVAILABLE:
            print("❌ Supabase not installed. Run: pip install supabase")
            return False

        try:
            sb: Client = create_client(supabase_url, supabase_key)

            summary = self.get_timeline_summary()
            deception_summary = self.get_deception_summary()
            studymate_metrics = self.compute_studymate_metrics()

            session_data = {
                "session_id": self.session_id,
                "user_id": user_id or (self.user_profile.user_id if self.user_profile else None),
                "interview_type": self.interview_type,
                "start_time": self.start_time,
                "start_datetime": summary["start_time"],
                "duration_seconds": summary["duration_seconds"],
                "total_recordings": summary["total_recordings"],
                "avg_stress": summary["avg_stress"],
                "max_stress": summary["max_stress"],
                "min_stress": summary["min_stress"],
                "avg_engagement": summary["avg_engagement"],
                "stress_spikes": summary["stress_spikes"],
                "calm_percentage": summary["calm_percentage"],
                "stress_percentage": summary["stress_percentage"],
                "questions_asked": summary["questions_asked"],
                "total_deception_flags": deception_summary["total_flags"],
                "deception_risk": deception_summary["overall_risk"],
                "recommendation": summary["recommendation"],
                "studymate_metrics": json.dumps(studymate_metrics),
                "comfort_zones": summary["comfort_zones"],
                "struggle_areas": summary["struggle_areas"],
            }
            # Remove None values
            session_data = {k: v for k, v in session_data.items() if v is not None}
            sb.table("stress_sessions").upsert(session_data).execute()

            # Questions
            questions_data = []
            for ts, q_text in self.question_markers.items():
                q_entry: Dict = {
                    "session_id": self.session_id,
                    "timestamp": ts,
                    "datetime": datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S"),
                    "question_text": q_text,
                }
                ctx = self.question_contexts.get(ts)
                if ctx:
                    q_entry["question_type"] = ctx.question_type
                    q_entry["difficulty"] = ctx.difficulty
                    q_entry["topic"] = ctx.topic
                    q_entry["interview_stage"] = ctx.interview_stage
                    q_entry["studymate_metric"] = ctx.studymate_metric
                questions_data.append(q_entry)

            if questions_data:
                sb.table("stress_questions").insert(questions_data).execute()

            # Recordings (significant ones only)
            recordings_data = []
            for recording in self.recordings:
                if (
                    recording.score > 0.6
                    or (recording.deception_flags and recording.deception_flags.flags)
                    or recording.engagement_score < 0.3
                    or len(self.recordings) < 100
                ):
                    rec = {
                        "session_id": self.session_id,
                        "timestamp": recording.timestamp,
                        "datetime": recording.datetime_str,
                        "elapsed_seconds": recording.timestamp - self.start_time,
                        "stress_score": recording.score,
                        "stress_level": recording.level,
                        "engagement_score": recording.engagement_score,
                        "baseline_delta": recording.baseline_delta,
                        "confidence": recording.confidence,
                        "question": self.get_question_at_time(recording.timestamp),
                        "features": recording.features,
                    }
                    if recording.deception_flags and recording.deception_flags.flags:
                        rec["deception_flags"] = recording.deception_flags.flags
                        rec["deception_risk"] = recording.deception_flags.risk_level
                    recordings_data.append(rec)

            if recordings_data:
                sb.table("stress_recordings").insert(recordings_data).execute()

            print(f"✅ Saved to Supabase")
            print(f"   Session: {self.session_id}")
            print(f"   Recordings: {len(recordings_data)}")
            print(f"   Questions: {len(questions_data)}")
            print(f"   StudyMate Metrics: {studymate_metrics}")
            return True

        except Exception as e:
            print(f"❌ Error saving to Supabase: {e}")
            return False


# ═══════════════════════════════════════════════════════════════════════
# Enhanced Stress Estimator
# ═══════════════════════════════════════════════════════════════════════


class StressEstimator:
    """Interview stress estimator with personalization and context awareness.
    
    Enhanced for StudyMate with:
    - Adaptive thresholds based on question context
    - User profile integration for personalized baselines
    - Engagement-aware scoring
    - Stress recovery tracking
    - Jaw clench detection in deception flags
    """

    def __init__(self, user_profile: Optional[UserProfile] = None) -> None:
        # Interview-optimized weights — recalibrated so a relaxed person
        # sitting normally reads as CALM, not "mild stress".
        self.weights = {
            # Facial features
            "eyebrow_raise": 0.10,
            "lip_tension": 0.14,
            "head_nod_intensity": 0.05,
            "symmetry_delta": 0.07,
            "blink_rate": 0.09,
            "eye_contact_ratio": 0.10,
            "response_delay": 0.08,
            "speech_pace_variance": 0.04,
            "jaw_clench": 0.06,
            "head_stability": 0.05,
            # Hand / Posture features (from body_language_features)
            "hand_fidget_score": 0.06,
            "hand_to_face": 0.06,
            "posture_score": 0.06,
            "shoulder_tension": 0.05,
            "body_stillness": 0.05,
        }
        # Scalers: the value at which a feature contributes its FULL weight.
        # Values above scaler are clipped to 1.5×.  Values well below scaler
        # contribute very little, keeping normal behaviour "calm".
        self.scalers = {
            "eyebrow_raise": 0.08,      # typical relaxed ≈ 0.02–0.04
            "lip_tension": 0.75,        # 0–1, relaxed ≈ 0.1–0.3
            "head_nod_intensity": 2.0,   # smoothed delta; calm ≈ 0–0.3
            "symmetry_delta": 0.05,      # typical ≈ 0.005–0.02
            "blink_rate": 30.0,          # blinks/min; normal 15–20, stress >30
            "eye_contact_ratio": 1.0,    # 0–1; higher = more contact (inverted contrib)
            "response_delay": 4.0,       # seconds; >3s = real hesitation
            "speech_pace_variance": 0.35,
            "jaw_clench": 0.70,          # recalibrated: relaxed ≈ 0.1–0.2
            "head_stability": 0.70,      # normalized jitter; relaxed ≈ 0.05–0.2
            # Hand / Posture scalers
            "hand_fidget_score": 0.60,   # 0–1; calm ≈ 0–0.2
            "hand_to_face": 0.50,        # 0–1; calm ≈ 0
            "posture_score": 0.60,       # higher = worse posture
            "shoulder_tension": 0.60,
            "body_stillness": 0.70,      # high = fidgety body
        }
        self.thresholds = {
            "calm": 0.36,       # balanced: relaxed face = calm, moderate signals = mild
            "mild": 0.56,       # lowered so genuine stress registers as "high"
        }

        # User profile for personalization
        self.user_profile = user_profile

        self.current_session: Optional[InterviewSession] = None
        self.current_question_context: Optional[QuestionContext] = None

        # Baseline tracking
        self.baseline_stress: Optional[float] = None
        self.baseline_features: Dict[str, float] = {}

        # Recovery tracking
        self._recovery_rate: float = 0.0

    def start_session(
        self,
        session_id: Optional[str] = None,
        interview_type: str = "general",
    ) -> InterviewSession:
        """Start a new interview session with optional context."""
        import time

        if session_id is None:
            session_id = f"interview_{int(time.time())}"

        self.current_session = InterviewSession(
            session_id=session_id,
            start_time=time.time(),
            user_profile=self.user_profile,
            interview_type=interview_type,
        )
        return self.current_session

    def mark_question(
        self,
        question_text: str,
        context: Optional[QuestionContext] = None,
    ):
        """Mark when interviewer asks a new question.
        
        If `context` is provided, the stress model adapts its
        interpretation (e.g., higher stress is expected on curveballs).
        """
        if context is None:
            context = QuestionContext(question_text=question_text)
        self.current_question_context = context
        if self.current_session:
            self.current_session.mark_question(question_text, context=context)

    def set_baseline(self, pre_interview_scores: List[StressScore]):
        if not pre_interview_scores:
            return
        self.baseline_stress = float(np.mean([s.score for s in pre_interview_scores]))
        for key in self.weights:
            values = [s.features.get(key, 0.0) for s in pre_interview_scores if key in s.features]
            if values:
                self.baseline_features[key] = float(np.mean(values))

    def _get_adaptive_thresholds(self) -> Dict[str, float]:
        """Adjust stress thresholds based on question context.
        
        Curveball questions get higher thresholds (more stress is expected).
        Easy intro questions get lower thresholds (should be calm).
        """
        base = dict(self.thresholds)
        ctx = self.current_question_context

        if ctx is None:
            return base

        # Adjust by question type
        adjustment = {
            "curveball": 0.08,
            "technical": 0.05,
            "behavioral": 0.0,
            "clarification": -0.05,
            "general": 0.0,
        }.get(ctx.question_type, 0.0)

        # Adjust by difficulty
        diff_adj = {
            "easy": -0.05,
            "medium": 0.0,
            "hard": 0.05,
        }.get(ctx.difficulty, 0.0)

        total_adj = adjustment + diff_adj

        # Adjust by user experience — more experienced users should
        # handle more stress, so thresholds stay stricter
        if self.user_profile:
            exp_adj = {
                "beginner": 0.05,
                "intermediate": 0.0,
                "advanced": -0.05,
            }.get(self.user_profile.experience_level, 0.0)
            total_adj += exp_adj

        return {
            "calm": base["calm"] + total_adj,
            "mild": base["mild"] + total_adj,
        }

    def detect_deception_flags(self, features: Dict[str, float]) -> DeceptionFlags:
        """Enhanced deception flag detection with jaw clench and engagement."""
        flags = []

        # 1. Excessive blinking (>35 bpm)
        if features.get("blink_rate", 0) > 35:
            flags.append("Elevated blink rate (anxiety/cognitive load)")

        # 2. Poor eye contact (<40%)
        if features.get("eye_contact_ratio", 1.0) < 0.4:
            flags.append("Avoiding eye contact")

        # 3. Facial asymmetry (>0.04)
        if features.get("symmetry_delta", 0) > 0.04:
            flags.append("Significant facial asymmetry")

        # 4. Micro-expression: lip tension + eyebrow raise
        if features.get("lip_tension", 0) > 0.6 and features.get("eyebrow_raise", 0) > 0.05:
            flags.append("Lip compression + eyebrow raise (suppressed emotion)")

        # 5. Response delay (hesitation)
        if features.get("response_delay", 0) > 2.5:
            flags.append("Delayed response (thinking/fabricating)")

        # 6. Inconsistent speech pace
        if features.get("speech_pace_variance", 0) > 0.25:
            flags.append("Irregular speech pace")

        # 7. Frozen face (minimal movement + high blink = rehearsed)
        if features.get("head_nod_intensity", 0) < 0.1 and features.get("eyebrow_raise", 0) < 0.02:
            if features.get("blink_rate", 0) > 30:
                flags.append("Minimal facial movement + high blink rate (possible rehearsed response)")

        # 8. NEW: Jaw clenching (stress suppression)
        if features.get("jaw_clench", 0) > 0.6:
            flags.append("Jaw clenching detected (suppressed stress)")

        # 9. NEW: Head instability (fidgeting)
        if features.get("head_stability", 0) > 0.7:
            flags.append("Excessive head movement (fidgeting/nervous energy)")

        # 10. NEW: Very low engagement + high stress = checked out
        if features.get("engagement_score", 0.5) < 0.25 and features.get("lip_tension", 0) > 0.4:
            flags.append("Low engagement with tension (mentally checked out)")

        # ── Hand / Posture deception flags ───────────────────────

        # 11. Hand-to-face touching (anxiety / self-soothing)
        if features.get("hand_to_face", 0) > 0.5:
            flags.append("Hand-to-face touching (self-soothing / anxiety)")

        # 12. Excessive hand fidgeting
        if features.get("hand_fidget_score", 0) > 0.6:
            flags.append("Excessive hand fidgeting (nervous energy)")

        # 13. Closed/clenched fists (defensive posture)
        if features.get("palm_openness", 0.5) < 0.15:
            flags.append("Clenched fists (defensive / withholding)")

        # 14. Poor posture (disengagement or discomfort)
        if features.get("posture_score", 0) > 0.6:
            flags.append("Poor posture / slouching (disengagement)")

        # 15. Shoulder tension
        if features.get("shoulder_tension", 0) > 0.6:
            flags.append("Raised / tense shoulders (physical stress)")

        # 16. Body fidgeting (overall restlessness)
        if features.get("body_stillness", 0) > 0.6:
            flags.append("Restless body movement (fidgeting)")

        # Risk level (with more granularity)
        if len(flags) >= 4:
            risk_level = "high"
        elif len(flags) >= 2:
            risk_level = "medium"
        elif len(flags) >= 1:
            risk_level = "low"
        else:
            risk_level = "none"

        return DeceptionFlags(flags=flags, risk_level=risk_level)

    def predict(self, features: Dict[str, float]) -> StressScore:
        """Predict stress with context-aware adaptive thresholds."""
        import time

        # Calculate raw stress score
        weighted_sum = 0.0
        for key, value in features.items():
            if not isinstance(value, (int, float)):
                continue  # skip non-numeric features (e.g. lean_direction_label)
            weight = self.weights.get(key, 0.0)
            scale = self.scalers.get(key, 1.0)
            weighted_sum += weight * min(value / scale, 1.5)
        score = float(np.clip(weighted_sum, 0.0, 1.5))

        # Use adaptive thresholds based on question context
        thresholds = self._get_adaptive_thresholds()

        if score < thresholds["calm"]:
            label_key = "calm"
        elif score < thresholds["mild"]:
            label_key = "mild"
        else:
            label_key = "high"
        icon, label = OUTPUT_LABELS[label_key]

        timestamp = time.time()
        datetime_str = datetime.fromtimestamp(timestamp).strftime("%H:%M:%S.%f")[:-3]
        deception_flags = self.detect_deception_flags(features)
        baseline_delta = score - self.baseline_stress if self.baseline_stress else 0.0

        expected_features = set(self.weights.keys())
        provided_features = set(features.keys())
        confidence = len(provided_features & expected_features) / len(expected_features)

        # Engagement score from features (if available from enhanced extractor)
        engagement = features.get("engagement_score", 0.5)

        # Stress vs expected range
        stress_vs_expected = 0.0
        ctx = self.current_question_context
        if ctx:
            expected_low, expected_high = ctx.expected_stress_range
            if score > expected_high:
                stress_vs_expected = score - expected_high  # positive = above expected
            elif score < expected_low:
                stress_vs_expected = score - expected_low   # negative = below expected

        result = StressScore(
            score=score,
            icon=icon,
            label=label,
            level=label_key,
            timestamp=timestamp,
            datetime_str=datetime_str,
            features=features.copy(),
            deception_flags=deception_flags,
            baseline_delta=baseline_delta,
            confidence=confidence,
            engagement_score=engagement,
            question_context=ctx.to_dict() if ctx else None,
            stress_vs_expected=stress_vs_expected,
            recovery_rate=self._recovery_rate,
        )

        if self.current_session:
            self.current_session.add_recording(result)

        return result

    def end_session(self) -> Optional[Dict]:
        if self.current_session:
            summary = self.current_session.get_timeline_summary()
            self.current_session = None
            return summary
        return None

    def get_session_timeline(self) -> Optional[List[Dict]]:
        if self.current_session:
            return self.current_session.export_timeline()
        return None

    def get_stress_spikes(self, threshold: float = 0.7) -> List[Dict]:
        if self.current_session:
            return self.current_session.get_stress_spikes(threshold)
        return []

    def get_per_question_analysis(self) -> List[Dict]:
        """Get per-question analysis for the current session."""
        if self.current_session:
            return [a.to_dict() for a in self.current_session.get_per_question_analysis()]
        return []

    def get_studymate_metrics(self) -> Dict[str, float]:
        """Get StudyMate 6-metric behavioral scores for current session."""
        if self.current_session:
            return self.current_session.compute_studymate_metrics()
        return {m: 0.5 for m in STUDYMATE_METRICS}

    def update_recovery_rate(self, rate: float) -> None:
        """Update the stress recovery rate from FeatureExtractor tracking."""
        self._recovery_rate = rate

    def save_session_to_supabase(self, supabase_url: str, supabase_key: str) -> bool:
        if self.current_session:
            return self.current_session.save_to_supabase(supabase_url, supabase_key)
        return False

    @staticmethod
    def load_session_from_supabase(
        session_id: str, supabase_url: str, supabase_key: str,
    ) -> Optional[Dict]:
        if not SUPABASE_AVAILABLE:
            print("❌ Supabase not installed. Run: pip install supabase")
            return None
        try:
            sb: Client = create_client(supabase_url, supabase_key)
            session_resp = sb.table("stress_sessions").select("*").eq("session_id", session_id).execute()
            if not session_resp.data:
                return None
            session_data = session_resp.data[0]
            questions = sb.table("stress_questions").select("*").eq("session_id", session_id).order("timestamp").execute().data
            recordings = sb.table("stress_recordings").select("*").eq("session_id", session_id).order("timestamp").execute().data
            return {
                "session": session_data,
                "questions": questions,
                "recordings": recordings,
                "total_recordings": len(recordings),
            }
        except Exception as e:
            print(f"❌ Error loading session: {e}")
            return None

    @staticmethod
    def list_all_sessions(
        supabase_url: str, supabase_key: str, limit: int = 50, user_id: Optional[str] = None,
    ) -> List[Dict]:
        if not SUPABASE_AVAILABLE:
            return []
        try:
            sb: Client = create_client(supabase_url, supabase_key)
            query = sb.table("stress_sessions").select(
                "session_id, user_id, interview_type, start_datetime, duration_seconds, "
                "avg_stress, avg_engagement, total_deception_flags, deception_risk, "
                "studymate_metrics, comfort_zones, struggle_areas, recommendation"
            ).order("start_time", desc=True).limit(limit)
            if user_id:
                query = query.eq("user_id", user_id)
            return query.execute().data
        except Exception as e:
            print(f"❌ Error listing sessions: {e}")
            return []

    @staticmethod
    def delete_session(session_id: str, supabase_url: str, supabase_key: str) -> bool:
        if not SUPABASE_AVAILABLE:
            return False
        try:
            sb: Client = create_client(supabase_url, supabase_key)
            sb.table("stress_recordings").delete().eq("session_id", session_id).execute()
            sb.table("stress_questions").delete().eq("session_id", session_id).execute()
            sb.table("stress_sessions").delete().eq("session_id", session_id).execute()
            print(f"✅ Deleted session: {session_id}")
            return True
        except Exception as e:
            print(f"❌ Error deleting session: {e}")
            return False
