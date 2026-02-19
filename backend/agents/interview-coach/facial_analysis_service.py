"""
Facial & Body-Language Analysis Service
========================================
REST endpoint that wraps the interview_module for server-side
frame-by-frame stress / body-language analysis.

Architecture
------------
Frontend  ──(base64 JPEG every ~2 s)──►  POST /analyze-frame
         ◄── JSON { stress, facial, body_language, deception }

Each interview session gets its **own** StressEstimator instance so that
per-question history, calibration, and deception tracking are preserved.
Sessions auto-expire after ``SESSION_TTL_MINUTES``.

Dependencies
------------
Requires ``interview_module`` on ``sys.path`` — added dynamically so
the interview-coach service can import it from its sibling directory.
"""

from __future__ import annotations

import base64
import io
import logging
import sys
import time
import threading
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# ── Ensure interview_module is importable ──────────────────────────
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_MODULE_DIR = _PROJECT_ROOT / "interview_module"
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))
# Also add the module dir so bare cross-imports inside interview_module work
# (e.g. feature_engineering.py → from face_mesh_module import LandmarkFrame)
# Use *append* (not insert) so interview_module/main.py doesn't shadow
# this service's main.py when uvicorn reloads with "main:app".
if str(_MODULE_DIR) not in sys.path:
    sys.path.append(str(_MODULE_DIR))

from interview_module import (
    FaceMeshProcessor,
    FeatureExtractor,
    BodyProcessor,
    BodyLanguageExtractor,
    StressEstimator,
    UserProfile,
    QuestionContext,
)

logger = logging.getLogger(__name__)

# ── Configuration ──────────────────────────────────────────────────
SESSION_TTL_MINUTES = 60          # auto-expire idle sessions
JPEG_QUALITY = 80                 # quality when re-encoding
MAX_FRAME_BYTES = 2 * 1024 * 1024  # 2 MB sanity limit

# ── Session store ──────────────────────────────────────────────────
_sessions: Dict[str, "_AnalysisSession"] = {}
_sessions_lock = threading.Lock()


class _AnalysisSession:
    """Per-interview session holding processors and estimator."""

    def __init__(self, session_id: str, user_id: str = "anonymous"):
        self.session_id = session_id
        self.user_id = user_id
        self.created_at = time.time()
        self.last_access = time.time()

        # Processors  (initialized lazily on first frame)
        self.face_processor: Optional[FaceMeshProcessor] = None
        self.body_processor: Optional[BodyProcessor] = None
        self.feature_extractor = FeatureExtractor()
        self.body_extractor = BodyLanguageExtractor()
        self.stress_estimator = StressEstimator(
            user_profile=UserProfile(user_id=user_id)
        )
        self.stress_estimator.start_session(interview_type="technical")
        self._initialized = False
        self.frame_count = 0

    def _lazy_init(self):
        """Initialize MediaPipe processors on first use (heavy)."""
        if self._initialized:
            return
        try:
            self.face_processor = FaceMeshProcessor()
            logger.info(f"[{self.session_id}] FaceMeshProcessor ready")
        except Exception as e:
            logger.warning(f"[{self.session_id}] FaceMeshProcessor init failed: {e}")

        try:
            self.body_processor = BodyProcessor()
            logger.info(f"[{self.session_id}] BodyProcessor ready")
        except Exception as e:
            logger.warning(f"[{self.session_id}] BodyProcessor init failed: {e}")

        self._initialized = True

    def process_frame(self, bgr_frame: np.ndarray) -> Dict[str, Any]:
        """Run full analysis pipeline on a single BGR frame."""
        self._lazy_init()
        self.last_access = time.time()
        self.frame_count += 1

        result: Dict[str, Any] = {
            "frame_number": self.frame_count,
            "timestamp": datetime.utcnow().isoformat(),
            "facial_features": {},
            "body_language": {},
            "stress": {},
            "deception_flags": [],
            "metrics": {
                "confident": 0,
                "stressed": 0,
                "hesitant": 0,
                "nervous": 0,
                "excited": 0,
            },
            "face_tracking": {
                "blink_count": 0,
                "looking_at_camera": False,
                "head_pose": {"pitch": 0.0, "yaw": 0.0, "roll": 0.0},
            },
        }

        # ── 1.  Face mesh features ────────────────────────────────
        facial_features: Dict[str, float] = {}
        if self.face_processor is not None:
            try:
                rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
                face_result = self.face_processor.process(rgb_frame)
                if face_result is not None:
                    facial_features = self.feature_extractor.extract(face_result.landmarks)

                    # Populate face_tracking from features
                    blink_rate = facial_features.get("blink_rate", 0.0)
                    result["face_tracking"]["blink_count"] = (
                        max(1, round(blink_rate)) if blink_rate > 0.3 else int(blink_rate)
                    )
                    yaw = facial_features.get("head_yaw", 0.0)
                    pitch = facial_features.get("head_pitch", 0.0)
                    result["face_tracking"]["head_pose"] = {
                        "pitch": round(pitch, 2),
                        "yaw": round(yaw, 2),
                        "roll": 0.0,
                    }
                    # Iris-based eye contact (more accurate than head pose alone)
                    eye_contact_ratio = facial_features.get("eye_contact_ratio", 0.0)
                    result["face_tracking"]["looking_at_camera"] = (
                        eye_contact_ratio > 0.55 if eye_contact_ratio > 0 else (
                            abs(yaw) < 15 and abs(pitch) < 15
                        )
                    )
                    # Forward gaze + engagement data
                    result["face_tracking"]["eye_contact_ratio"] = round(eye_contact_ratio, 3)
                    result["face_tracking"]["engagement_score"] = round(
                        facial_features.get("engagement_score", 0.0), 3
                    )
                    result["face_tracking"]["gaze_zone"] = facial_features.get("gaze_zone", "center")
                    result["face_tracking"]["gaze_label"] = facial_features.get("gaze_label", "Direct Engagement")
                    result["face_tracking"]["gaze_h"] = round(float(facial_features.get("gaze_h", 0.0)), 3)
                    result["face_tracking"]["gaze_v"] = round(float(facial_features.get("gaze_v", 0.0)), 3)
            except Exception as e:
                logger.debug(f"Face processing error: {e}")

        result["facial_features"] = {
            k: round(v, 4) if isinstance(v, float) else v
            for k, v in facial_features.items()
        }

        # ── 2.  Body language features ────────────────────────────
        body_features: Dict[str, Any] = {}
        if self.body_processor is not None:
            try:
                body_result = self.body_processor.process(bgr_frame)
                if body_result is not None:
                    body_features = self.body_extractor.extract(body_result)
            except Exception as e:
                logger.debug(f"Body processing error: {e}")

        result["body_language"] = {
            k: round(v, 4) if isinstance(v, (int, float)) else v
            for k, v in body_features.items()
        }

        # ── 3.  Stress estimation ─────────────────────────────────
        merged = {}
        merged.update(facial_features)
        # Only add numeric body features to the stress model
        for k, v in body_features.items():
            if isinstance(v, (int, float)):
                merged[k] = v

        if merged:
            try:
                stress_score = self.stress_estimator.predict(merged)
                result["stress"] = {
                    "composite": round(stress_score.score, 4),
                    "level": stress_score.level,
                    "label": stress_score.label,
                    "baseline_delta": round(stress_score.baseline_delta, 4),
                    "engagement_score": round(stress_score.engagement_score, 4),
                }
                # DeceptionFlags is a dataclass with .flags list
                df = stress_score.deception_flags
                result["deception_flags"] = df.flags if df else []

                # Map to frontend-compatible metrics (0-100 scale)
                composite = stress_score.score
                result["metrics"] = {
                    "confident": round(max(0, (1 - composite)) * 100, 1),
                    "stressed": round(composite * 100, 1),
                    "hesitant": round(
                        min(100, facial_features.get("lip_press", 0.0) * 200), 1
                    ),
                    "nervous": round(
                        min(
                            100,
                            (
                                facial_features.get("blink_rate", 0.0) * 50
                                + body_features.get("hand_fidget_score", 0.0) * 50
                            ),
                        ),
                        1,
                    ),
                    "excited": round(
                        min(
                            100,
                            facial_features.get("eyebrow_raise", 0.0) * 150
                            + (1 - body_features.get("body_stillness", 1.0)) * 50,
                        ),
                        1,
                    ),
                }
            except Exception as e:
                logger.debug(f"Stress estimation error: {e}")

        return result


def _cleanup_expired():
    """Remove sessions idle for > TTL."""
    cutoff = time.time() - SESSION_TTL_MINUTES * 60
    with _sessions_lock:
        expired = [sid for sid, s in _sessions.items() if s.last_access < cutoff]
        for sid in expired:
            del _sessions[sid]
            logger.info(f"Expired analysis session {sid}")


def _get_or_create_session(
    session_id: str, user_id: str = "anonymous"
) -> _AnalysisSession:
    _cleanup_expired()
    with _sessions_lock:
        if session_id not in _sessions:
            _sessions[session_id] = _AnalysisSession(session_id, user_id)
            logger.info(f"Created analysis session {session_id}")
        return _sessions[session_id]


# ── Pydantic models ───────────────────────────────────────────────
class AnalyzeFrameRequest(BaseModel):
    image: str = Field(..., description="Base64-encoded JPEG (with or without data-URI prefix)")
    session_id: str = Field(default="", description="Interview session ID for state tracking")
    user_id: str = Field(default="anonymous")


class AnalyzeFrameResponse(BaseModel):
    success: bool
    frame_number: int = 0
    timestamp: str = ""
    metrics: Dict[str, float] = {}
    face_tracking: Dict[str, Any] = {}
    stress: Dict[str, Any] = {}
    body_language: Dict[str, Any] = {}
    facial_features: Dict[str, Any] = {}
    deception_flags: list = []


class StartAnalysisRequest(BaseModel):
    session_id: str = Field(default="", description="Interview session ID")
    user_id: str = Field(default="anonymous")
    interview_type: str = Field(default="technical")


class MarkQuestionRequest(BaseModel):
    session_id: str
    question_text: str
    question_type: str = "technical"
    difficulty: str = "medium"
    topic: str = "general"


class EndAnalysisRequest(BaseModel):
    session_id: str


# ── Router ─────────────────────────────────────────────────────────
router = APIRouter(prefix="/analysis", tags=["facial-analysis"])


@router.post("/start-session")
async def start_analysis_session(req: StartAnalysisRequest):
    """Initialize an analysis session (pre-warm processors)."""
    sid = req.session_id or str(uuid.uuid4())
    session = _get_or_create_session(sid, req.user_id)
    session.stress_estimator.start_session(interview_type=req.interview_type)
    return {
        "success": True,
        "session_id": sid,
        "message": "Analysis session started",
    }


@router.post("/mark-question")
async def mark_question(req: MarkQuestionRequest):
    """Tell the stress estimator a new question is being asked."""
    session = _get_or_create_session(req.session_id)
    session.stress_estimator.mark_question(
        req.question_text,
        context=QuestionContext(
            question_text=req.question_text,
            question_type=req.question_type,
            difficulty=req.difficulty,
            topic=req.topic,
        ),
    )
    return {"success": True, "message": f"Question marked: {req.question_text[:50]}"}


@router.post("/analyze-frame", response_model=AnalyzeFrameResponse)
async def analyze_frame(req: AnalyzeFrameRequest):
    """
    Analyze a single camera frame for stress, facial expressions,
    and body language.
    
    The ``image`` field should be a base64-encoded JPEG, optionally
    prefixed with ``data:image/jpeg;base64,``.
    """
    # ── Decode image ──────────────────────────────────────────
    raw_b64 = req.image
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]

    try:
        img_bytes = base64.b64decode(raw_b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    if len(img_bytes) > MAX_FRAME_BYTES:
        raise HTTPException(status_code=400, detail="Frame too large (> 2 MB)")

    # Decode to OpenCV BGR
    nparr = np.frombuffer(img_bytes, np.uint8)
    bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise HTTPException(status_code=400, detail="Could not decode JPEG image")

    # ── Get / create session ──────────────────────────────────
    sid = req.session_id or str(uuid.uuid4())
    session = _get_or_create_session(sid, req.user_id)

    # ── Process ───────────────────────────────────────────────
    try:
        analysis = session.process_frame(bgr)
    except Exception as e:
        logger.error(f"Frame analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Frame analysis failed")

    return AnalyzeFrameResponse(
        success=True,
        frame_number=analysis["frame_number"],
        timestamp=analysis["timestamp"],
        metrics=analysis["metrics"],
        face_tracking=analysis["face_tracking"],
        stress=analysis["stress"],
        body_language=analysis["body_language"],
        facial_features=analysis["facial_features"],
        deception_flags=analysis["deception_flags"],
    )


@router.post("/end-session")
async def end_analysis_session(req: EndAnalysisRequest):
    """
    End analysis session and return aggregate summary.
    
    Returns the StressEstimator's full session summary including
    per-question analysis, StudyMate 6-metric mapping, and
    overall statistics.
    """
    with _sessions_lock:
        session = _sessions.pop(req.session_id, None)

    if session is None:
        return {"success": False, "message": "Session not found"}

    try:
        summary = session.stress_estimator.end_session()
        # Convert dataclass to dict for JSON serialization
        summary_dict = {}
        if summary:
            summary_dict = {
                "session_id": getattr(summary, "session_id", req.session_id),
                "duration_seconds": getattr(summary, "duration_seconds", 0),
                "total_frames": getattr(summary, "total_frames", session.frame_count),
                "avg_stress": round(getattr(summary, "avg_stress", 0), 4),
                "max_stress": round(getattr(summary, "max_stress", 0), 4),
                "stress_distribution": getattr(summary, "stress_distribution", {}),
                "studymate_metrics": getattr(summary, "studymate_metrics", {}),
                "question_analyses": [],
            }
            # Per-question breakdown
            for qa in getattr(summary, "question_analyses", []):
                summary_dict["question_analyses"].append({
                    "question": getattr(qa, "question_text", ""),
                    "avg_stress": round(getattr(qa, "avg_stress", 0), 4),
                    "peak_stress": round(getattr(qa, "peak_stress", 0), 4),
                    "stress_level": getattr(qa, "stress_level", "unknown"),
                    "deception_count": getattr(qa, "deception_count", 0),
                })
    except Exception as e:
        logger.error(f"Session summary failed: {e}", exc_info=True)
        summary_dict = {"error": str(e)}

    return {
        "success": True,
        "session_id": req.session_id,
        "summary": summary_dict,
    }


@router.get("/sessions")
async def list_sessions():
    """List active analysis sessions (debug endpoint)."""
    with _sessions_lock:
        return {
            "active_sessions": [
                {
                    "session_id": s.session_id,
                    "user_id": s.user_id,
                    "frame_count": s.frame_count,
                    "created_at": datetime.fromtimestamp(s.created_at).isoformat(),
                    "last_access": datetime.fromtimestamp(s.last_access).isoformat(),
                }
                for s in _sessions.values()
            ]
        }
