"""
Example: StudyMate Interview Module — Full Workflow Demo
=========================================================

Shows the enhanced interview analysis pipeline:
1. Create a UserProfile from StudyMate onboarding data
2. Run interview with QuestionContext for each question
3. Per-question stress + engagement analysis
4. StudyMate 6-metric behavioral scoring
5. LLM coaching feedback via FeedbackEngine
6. StudyMateBridge integration for orchestrator recommendations
7. JSON export of everything
"""

import time
import json
import os

from stress_model import (
    StressEstimator,
    UserProfile,
    QuestionContext,
)
from feedback_engine import FeedbackEngine
from studymate_bridge import StudyMateBridge


def run_studymate_interview_demo():
    """Complete StudyMate interview analysis workflow."""

    # ── 1. User Profile (from StudyMate onboarding) ─────────────
    print("=" * 60)
    print("👤 SETTING UP USER PROFILE")
    print("=" * 60)

    profile = UserProfile(
        user_id="user_abc123",
        target_role="backend_engineer",
        experience_level="intermediate",
        strengths=["algorithms", "python", "databases"],
        weaknesses=["system_design", "distributed_systems"],
        focus_areas=["system design interviews", "handling pressure"],
        previous_avg_stress=0.52,
        session_count=3,
    )
    print(f"  Target role: {profile.target_role}")
    print(f"  Experience: {profile.experience_level}")
    print(f"  Strengths: {', '.join(profile.strengths)}")
    print(f"  Weaknesses: {', '.join(profile.weaknesses)}")
    print(f"  Past sessions: {profile.session_count}")
    print()

    # ── 2. Initialize Estimator with Profile ────────────────────
    estimator = StressEstimator(user_profile=profile)

    # ── 3. Pre-Interview Baseline ───────────────────────────────
    print("📊 Collecting baseline (casual conversation)...")
    baseline_scores = []
    for _ in range(3):
        features = {
            "eyebrow_raise": 0.02,
            "lip_tension": 0.1,
            "head_nod_intensity": 0.1,
            "symmetry_delta": 0.01,
            "blink_rate": 18.0,
            "eye_contact_ratio": 0.7,
            "response_delay": 0.5,
            "speech_pace_variance": 0.1,
            "jaw_clench": 0.1,
            "head_stability": 0.15,
            "engagement_score": 0.7,
        }
        score = estimator.predict(features)
        baseline_scores.append(score)

    estimator.set_baseline(baseline_scores)
    print(f"  Baseline established: {estimator.baseline_stress:.2f}\n")

    # ── 4. Start Interview Session ──────────────────────────────
    print("🎤 Starting Interview Session...")
    session = estimator.start_session(
        session_id="studymate_demo_001",
        interview_type="technical",
    )
    print(f"  Session ID: {session.session_id}")
    print(f"  Interview type: {session.interview_type}\n")

    # ── Question 1: Warmup (Behavioral, Easy) ──────────────────
    q1_ctx = QuestionContext(
        question_text="Tell me about yourself and your background.",
        question_type="behavioral",
        difficulty="easy",
        topic="introduction",
        interview_stage="warmup",
        studymate_metric="structure",
    )
    estimator.mark_question(q1_ctx.question_text, context=q1_ctx)
    print(f"❓ Q1 [{q1_ctx.question_type}/{q1_ctx.difficulty}]: {q1_ctx.question_text}")

    for _ in range(5):
        result = estimator.predict({
            "eyebrow_raise": 0.03,
            "lip_tension": 0.2,
            "head_nod_intensity": 0.15,
            "symmetry_delta": 0.01,
            "blink_rate": 22.0,
            "eye_contact_ratio": 0.65,
            "response_delay": 1.0,
            "speech_pace_variance": 0.15,
            "jaw_clench": 0.15,
            "head_stability": 0.12,
            "engagement_score": 0.65,
        })
        print(f"  {result.formatted()}")
        time.sleep(0.2)

    # ── Question 2: Technical Hard (Weakness topic!) ────────────
    q2_ctx = QuestionContext(
        question_text="Design a distributed cache like Redis. How would you handle consistency?",
        question_type="technical",
        difficulty="hard",
        topic="system_design",
        interview_stage="main",
        expected_stress_range=QuestionContext.default_stress_range("technical", "hard"),
        studymate_metric="scalability_thinking",
    )
    estimator.mark_question(q2_ctx.question_text, context=q2_ctx)
    print(f"\n❓ Q2 [{q2_ctx.question_type}/{q2_ctx.difficulty}]: {q2_ctx.question_text}")
    print(f"   ⚡ This is a WEAKNESS topic for this user!")

    for i in range(6):
        stress_factor = 0.5 + i * 0.05  # stress increases during this question
        result = estimator.predict({
            "eyebrow_raise": 0.06 + i * 0.005,
            "lip_tension": 0.5 + i * 0.05,
            "head_nod_intensity": 0.3,
            "symmetry_delta": 0.035 + i * 0.003,
            "blink_rate": 30.0 + i * 2,
            "eye_contact_ratio": 0.4 - i * 0.03,
            "response_delay": 2.0 + i * 0.3,
            "speech_pace_variance": 0.22,
            "jaw_clench": 0.4 + i * 0.05,
            "head_stability": 0.35 + i * 0.05,
            "engagement_score": 0.5 - i * 0.03,
        })
        print(f"  {result.formatted()}")
        if result.deception_flags and result.deception_flags.flags:
            print(f"    🚩 {', '.join(result.deception_flags.flags[:2])}")
        time.sleep(0.2)

    # ── Question 3: Curveball ───────────────────────────────────
    q3_ctx = QuestionContext(
        question_text="If you could redesign the internet from scratch, what would you change?",
        question_type="curveball",
        difficulty="hard",
        topic="creative_thinking",
        interview_stage="curveball",
        expected_stress_range=QuestionContext.default_stress_range("curveball", "hard"),
        studymate_metric="adaptability",
    )
    estimator.mark_question(q3_ctx.question_text, context=q3_ctx)
    print(f"\n❓ Q3 [{q3_ctx.question_type}/{q3_ctx.difficulty}]: {q3_ctx.question_text}")

    # Stress spikes then recovers (shows adaptability)
    stress_levels = [0.7, 0.65, 0.5, 0.4, 0.35]
    for i, sl in enumerate(stress_levels):
        result = estimator.predict({
            "eyebrow_raise": 0.05 - i * 0.005,
            "lip_tension": sl,
            "head_nod_intensity": 0.2 + i * 0.03,
            "symmetry_delta": 0.03 - i * 0.003,
            "blink_rate": 30.0 - i * 2,
            "eye_contact_ratio": 0.45 + i * 0.05,
            "response_delay": 1.5 - i * 0.2,
            "speech_pace_variance": 0.2 - i * 0.02,
            "jaw_clench": 0.5 - i * 0.08,
            "head_stability": 0.3 - i * 0.03,
            "engagement_score": 0.5 + i * 0.05,
        })
        print(f"  {result.formatted()}")
        time.sleep(0.2)

    # ── Question 4: Clarification (Strength topic) ──────────────
    q4_ctx = QuestionContext(
        question_text="Can you walk me through a time you optimized a database query?",
        question_type="technical",
        difficulty="medium",
        topic="databases",
        interview_stage="main",
        studymate_metric="tradeoff_awareness",
    )
    estimator.mark_question(q4_ctx.question_text, context=q4_ctx)
    print(f"\n❓ Q4 [{q4_ctx.question_type}/{q4_ctx.difficulty}]: {q4_ctx.question_text}")
    print(f"   ✅ This is a STRENGTH topic for this user!")

    for _ in range(5):
        result = estimator.predict({
            "eyebrow_raise": 0.025,
            "lip_tension": 0.15,
            "head_nod_intensity": 0.2,
            "symmetry_delta": 0.01,
            "blink_rate": 20.0,
            "eye_contact_ratio": 0.75,
            "response_delay": 0.8,
            "speech_pace_variance": 0.1,
            "jaw_clench": 0.1,
            "head_stability": 0.1,
            "engagement_score": 0.8,
        })
        print(f"  {result.formatted()}")
        time.sleep(0.2)

    # ═══════════════════════════════════════════════════════════════
    # ANALYSIS
    # ═══════════════════════════════════════════════════════════════

    print("\n" + "=" * 60)
    print("📊 PER-QUESTION ANALYSIS")
    print("=" * 60)
    per_q = estimator.get_per_question_analysis()
    for q in per_q:
        icon = "🟢" if not q.get("was_struggle") else "🔴"
        if q.get("was_comfort_zone"):
            icon = "💚"
        print(f"\n  {icon} {q['question_text'][:60]}...")
        print(f"     Avg stress: {q['avg_stress']:.2f} | Peak: {q['peak_stress']:.2f}")
        print(f"     Engagement: {q['avg_engagement']:.2f} | Trend: {q['stress_trend']}")
        if q.get("was_comfort_zone"):
            print(f"     → Comfort zone!")
        if q.get("was_struggle"):
            print(f"     → Struggle area — recommend practice")

    print("\n" + "=" * 60)
    print("🎯 STUDYMATE 6-METRIC BEHAVIORAL SCORES")
    print("=" * 60)
    metrics = estimator.get_studymate_metrics()
    for metric, score in metrics.items():
        bar = "█" * int(score * 20) + "░" * (20 - int(score * 20))
        label = "Strong" if score >= 0.7 else "Developing" if score >= 0.4 else "Needs work"
        print(f"  {metric:25s} [{bar}] {score:.0%} ({label})")

    print("\n" + "=" * 60)
    print("🔍 DECEPTION ANALYSIS")
    print("=" * 60)
    if estimator.current_session:
        deception = estimator.current_session.get_deception_summary()
        print(f"  Total flags: {deception['total_flags']}")
        print(f"  Risk level:  {deception['overall_risk'].upper()}")
        if deception["most_common_flags"]:
            print(f"  Top flags:")
            for flag, count in deception["most_common_flags"]:
                print(f"    • {flag} ({count}x)")

    # ── End Session ─────────────────────────────────────────────
    summary = estimator.end_session()

    if summary:
        print("\n" + "=" * 60)
        print("📋 SESSION SUMMARY")
        print("=" * 60)
        print(f"  Duration:       {summary['duration_seconds']:.1f}s")
        print(f"  Recordings:     {summary['total_recordings']}")
        print(f"  Avg stress:     {summary['avg_stress']:.2f}")
        print(f"  Max stress:     {summary['max_stress']:.2f}")
        print(f"  Avg engagement: {summary['avg_engagement']:.2f}")
        print(f"  Calm %:         {summary['calm_percentage']:.1f}%")
        print(f"  Stress %:       {summary['stress_percentage']:.1f}%")
        print(f"\n  Comfort zones:  {', '.join(summary['comfort_zones']) or 'none'}")
        print(f"  Struggles:      {', '.join(summary['struggle_areas']) or 'none'}")
        print(f"\n  {summary['recommendation']}")

    # ═══════════════════════════════════════════════════════════════
    # STUDYMATE BRIDGE (Orchestrator integration)
    # ═══════════════════════════════════════════════════════════════

    print("\n" + "=" * 60)
    print("🔗 STUDYMATE BRIDGE — Orchestrator Recommendations")
    print("=" * 60)

    bridge = StudyMateBridge(
        groq_api_key=os.environ.get("GROQ_API_KEY"),
    )

    # Process the session through the bridge
    interview_result = bridge.process_interview_session(
        session_summary=summary,
        user_profile=profile.to_dict(),
        text_evaluation_scores={
            "clarification_habit": 0.6,
            "structure": 0.75,
            "tradeoff_awareness": 0.5,
            "scalability_thinking": 0.45,
            "failure_awareness": 0.55,
            "adaptability": 0.7,
        },
        generate_feedback=False,  # Set True if GROQ_API_KEY is set
    )

    print("\n  Orchestrator Recommendations:")
    for rec in interview_result.recommendations:
        print(f"    → [{rec.action}] {rec.reason}")
        if rec.suggested_topics:
            print(f"      Topics: {', '.join(rec.suggested_topics)}")
        print(f"      Difficulty: {rec.suggested_difficulty} | Confidence: {rec.confidence:.0%}")

    if interview_result.combined_metrics:
        print("\n  Combined Metrics (25% behavioral + 75% text):")
        for metric, score in interview_result.combined_metrics.items():
            print(f"    {metric:25s} {score:.0%}")

    # ── Export ──────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("💾 Exporting to JSON...")
    print("=" * 60)

    output = {
        "summary": summary,
        "per_question_analysis": per_q,
        "studymate_metrics": metrics,
        "recommendations": [r.to_dict() for r in interview_result.recommendations],
        "combined_metrics": interview_result.combined_metrics,
        "user_profile": profile.to_dict(),
    }

    output_file = "interview_timeline.json"
    with open(output_file, "w") as f:
        json.dump(output, f, indent=2, default=str)

    print(f"  ✅ Exported to: {output_file}")
    print(f"\n🎉 Demo complete!")


if __name__ == "__main__":
    run_studymate_interview_demo()
