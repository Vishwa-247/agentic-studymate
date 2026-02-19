"""
AI Micro-Expression Analyzer — StudyMate Interview Module
==========================================================

Enhanced stress analysis for interview coaching with:
  - MediaPipe Face Mesh (478 landmarks) feature extraction
  - Heuristic stress estimation with adaptive thresholds
  - LLM-powered coaching feedback (Groq)
  - StudyMate 6-metric behavioral mapping
  - Supabase persistence

Quick Start:
    from interview_module import (
        StressEstimator,
        FeatureExtractor,
        FeedbackEngine,
        StudyMateBridge,
        UserProfile,
        QuestionContext,
    )

    estimator = StressEstimator(user_profile=UserProfile(user_id="..."))
    session = estimator.start_session(interview_type="technical")
    estimator.mark_question("Explain CAP theorem", context=QuestionContext(
        question_text="Explain CAP theorem",
        question_type="technical",
        difficulty="medium",
        topic="system_design",
    ))
    result = estimator.predict(features)
    summary = estimator.end_session()
"""

__version__ = "2.1.0"

try:
    # ── Core classes ─────────────────────────────────────────────────
    from .feature_engineering import FeatureExtractor
    from .face_mesh_module import FaceMeshProcessor, LandmarkFrame

    # ── Hand & Posture ───────────────────────────────────────────────
    from .hand_posture_module import (
        BodyProcessor,
        HandProcessor,
        PoseProcessor,
        BodyFrame,
        HandLandmarkFrame,
        PoseLandmarkFrame,
    )
    from .body_language_features import BodyLanguageExtractor

    # ── Stress model ─────────────────────────────────────────────────
    from .stress_model import (
        StressEstimator,
        StressScore,
        DeceptionFlags,
        InterviewSession,
        QuestionAnalysis,
        QuestionContext,
        UserProfile,
        STUDYMATE_METRICS,
    )

    # ── Feedback & integration ───────────────────────────────────────
    from .feedback_engine import (
        FeedbackEngine,
        QuickFeedback,
        DetailedFeedback,
        ProgressFeedback,
        QuestionFeedback,
    )
    from .studymate_bridge import (
        StudyMateBridge,
        InterviewResult,
        OrchestratorRecommendation,
    )
except ImportError:
    from feature_engineering import FeatureExtractor
    from face_mesh_module import FaceMeshProcessor, LandmarkFrame

    try:
        from hand_posture_module import (
            BodyProcessor,
            HandProcessor,
            PoseProcessor,
            BodyFrame,
            HandLandmarkFrame,
            PoseLandmarkFrame,
        )
        from body_language_features import BodyLanguageExtractor
    except ImportError:
        BodyProcessor = None  # type: ignore
        HandProcessor = None  # type: ignore
        PoseProcessor = None  # type: ignore
        BodyFrame = None  # type: ignore
        HandLandmarkFrame = None  # type: ignore
        PoseLandmarkFrame = None  # type: ignore
        BodyLanguageExtractor = None  # type: ignore

    from stress_model import (
        StressEstimator,
        StressScore,
        DeceptionFlags,
        InterviewSession,
        QuestionAnalysis,
        QuestionContext,
        UserProfile,
        STUDYMATE_METRICS,
    )

    from feedback_engine import (
        FeedbackEngine,
        QuickFeedback,
        DetailedFeedback,
        ProgressFeedback,
        QuestionFeedback,
    )
    from studymate_bridge import (
        StudyMateBridge,
        InterviewResult,
        OrchestratorRecommendation,
    )

__all__ = [
    # Core
    "FeatureExtractor",
    "FaceMeshProcessor",
    "LandmarkFrame",
    # Hand & Posture
    "BodyProcessor",
    "HandProcessor",
    "PoseProcessor",
    "BodyFrame",
    "HandLandmarkFrame",
    "PoseLandmarkFrame",
    "BodyLanguageExtractor",
    # Stress
    "StressEstimator",
    "StressScore",
    "DeceptionFlags",
    "InterviewSession",
    "QuestionAnalysis",
    "QuestionContext",
    "UserProfile",
    "STUDYMATE_METRICS",
    # Feedback
    "FeedbackEngine",
    "QuickFeedback",
    "DetailedFeedback",
    "ProgressFeedback",
    "QuestionFeedback",
    # Integration
    "StudyMateBridge",
    "InterviewResult",
    "OrchestratorRecommendation",
]

