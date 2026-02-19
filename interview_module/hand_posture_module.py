"""
Hand & Posture Landmark Extraction
====================================

Wraps **MediaPipe Hands** (21 landmarks per hand) and **MediaPipe Pose**
(33 body landmarks) using the Tasks API, matching the pattern of
``face_mesh_module.py``.

Requirements
------------
* mediapipe >= 0.10.8
* hand_landmarker.task   (auto-downloaded on first run)
* pose_landmarker_lite.task  (auto-downloaded on first run)

These ``.task`` model bundles are fetched from the official MediaPipe
model repository and cached next to this file.

Author: StudyMate Platform
"""

from __future__ import annotations

import pathlib
import time
import urllib.request
from dataclasses import dataclass
from typing import Generator, List, Optional, Tuple

import cv2
import mediapipe as mp
import numpy as np

# ── Model paths & auto-download URLs ────────────────────────────────
_DIR = pathlib.Path(__file__).parent

_HAND_MODEL_PATH = _DIR / "hand_landmarker.task"
_HAND_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
)

_POSE_MODEL_PATH = _DIR / "pose_landmarker_lite.task"
_POSE_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
)


def _ensure_model(path: pathlib.Path, url: str) -> pathlib.Path:
    """Download a MediaPipe model bundle if it is not already cached."""
    if path.exists():
        return path
    print(f"⬇  Downloading {path.name} …")
    try:
        urllib.request.urlretrieve(url, str(path))
        print(f"✅  Saved {path.name} ({path.stat().st_size / 1e6:.1f} MB)")
    except Exception as exc:
        raise RuntimeError(
            f"Failed to download {path.name} from {url}.\n"
            "You can download it manually and place it next to this file."
        ) from exc
    return path


# ── MediaPipe Tasks API aliases ─────────────────────────────────────
BaseOptions = mp.tasks.BaseOptions
HandLandmarker = mp.tasks.vision.HandLandmarker
HandLandmarkerOptions = mp.tasks.vision.HandLandmarkerOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode


# ── Dataclasses ──────────────────────────────────────────────────────

@dataclass
class HandLandmarkFrame:
    """Landmarks for one or two detected hands in a single frame."""
    timestamp: float
    hands: List[np.ndarray]          # list of (21, 3) arrays
    handedness: List[str]            # "Left" or "Right" for each hand
    image: Optional[np.ndarray] = None


@dataclass
class PoseLandmarkFrame:
    """33-landmark body pose for a single frame."""
    timestamp: float
    landmarks: np.ndarray            # shape (33, 3)
    visibility: np.ndarray           # shape (33,) — per-landmark confidence
    image: Optional[np.ndarray] = None


@dataclass
class BodyFrame:
    """Combined hand + pose data for one video frame."""
    timestamp: float
    hands: Optional[HandLandmarkFrame] = None
    pose: Optional[PoseLandmarkFrame] = None
    image: Optional[np.ndarray] = None


# ═══════════════════════════════════════════════════════════════════════
# Hand Processor
# ═══════════════════════════════════════════════════════════════════════

class HandProcessor:
    """MediaPipe HandLandmarker wrapper (Tasks API, VIDEO mode)."""

    def __init__(
        self,
        max_num_hands: int = 2,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        running_mode: VisionRunningMode = VisionRunningMode.VIDEO,
    ) -> None:
        model_path = _ensure_model(_HAND_MODEL_PATH, _HAND_MODEL_URL)
        options = HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(model_path)),
            running_mode=running_mode,
            num_hands=max_num_hands,
            min_hand_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        self._landmarker = HandLandmarker.create_from_options(options)
        self._running_mode = running_mode
        self._frame_ts_ms: int = 0

    def process(self, image_bgr: np.ndarray) -> Optional[HandLandmarkFrame]:
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)

        if self._running_mode == VisionRunningMode.VIDEO:
            self._frame_ts_ms += 33
            result = self._landmarker.detect_for_video(mp_image, self._frame_ts_ms)
        else:
            result = self._landmarker.detect(mp_image)

        if not result.hand_landmarks:
            return None

        hands: List[np.ndarray] = []
        handedness_labels: List[str] = []
        for i, hand_lms in enumerate(result.hand_landmarks):
            coords = np.array(
                [[lm.x, lm.y, lm.z] for lm in hand_lms], dtype=np.float32
            )
            hands.append(coords)
            # Handedness: result.handedness[i][0].category_name
            label = "Unknown"
            if result.handedness and i < len(result.handedness):
                label = result.handedness[i][0].category_name
            handedness_labels.append(label)

        return HandLandmarkFrame(
            timestamp=time.time(),
            hands=hands,
            handedness=handedness_labels,
            image=image_bgr,
        )

    def close(self) -> None:
        self._landmarker.close()

    def __enter__(self) -> "HandProcessor":
        return self

    def __exit__(self, *args) -> None:
        self.close()


# ═══════════════════════════════════════════════════════════════════════
# Pose Processor
# ═══════════════════════════════════════════════════════════════════════

class PoseProcessor:
    """MediaPipe PoseLandmarker wrapper (Tasks API, VIDEO mode)."""

    def __init__(
        self,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        running_mode: VisionRunningMode = VisionRunningMode.VIDEO,
    ) -> None:
        model_path = _ensure_model(_POSE_MODEL_PATH, _POSE_MODEL_URL)
        options = PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(model_path)),
            running_mode=running_mode,
            num_poses=1,
            min_pose_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        self._landmarker = PoseLandmarker.create_from_options(options)
        self._running_mode = running_mode
        self._frame_ts_ms: int = 0

    def process(self, image_bgr: np.ndarray) -> Optional[PoseLandmarkFrame]:
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)

        if self._running_mode == VisionRunningMode.VIDEO:
            self._frame_ts_ms += 33
            result = self._landmarker.detect_for_video(mp_image, self._frame_ts_ms)
        else:
            result = self._landmarker.detect(mp_image)

        if not result.pose_landmarks:
            return None

        pose_lms = result.pose_landmarks[0]
        coords = np.array(
            [[lm.x, lm.y, lm.z] for lm in pose_lms], dtype=np.float32
        )
        # Visibility scores per landmark
        vis = np.array(
            [lm.visibility if hasattr(lm, "visibility") else 1.0 for lm in pose_lms],
            dtype=np.float32,
        )
        return PoseLandmarkFrame(
            timestamp=time.time(),
            landmarks=coords,
            visibility=vis,
            image=image_bgr,
        )

    def close(self) -> None:
        self._landmarker.close()

    def __enter__(self) -> "PoseProcessor":
        return self

    def __exit__(self, *args) -> None:
        self.close()


# ═══════════════════════════════════════════════════════════════════════
# Combined Body Processor (Hands + Pose in one call)
# ═══════════════════════════════════════════════════════════════════════

class BodyProcessor:
    """Process a single video frame through both Hand and Pose landmarkers.
    
    Usage::

        with BodyProcessor() as body:
            for frame_bgr in video_frames:
                body_frame = body.process(frame_bgr)
                # body_frame.hands  → Optional[HandLandmarkFrame]
                # body_frame.pose   → Optional[PoseLandmarkFrame]
    """

    def __init__(
        self,
        max_num_hands: int = 2,
        enable_hands: bool = True,
        enable_pose: bool = True,
    ) -> None:
        self._hand_processor: Optional[HandProcessor] = None
        self._pose_processor: Optional[PoseProcessor] = None
        if enable_hands:
            self._hand_processor = HandProcessor(
                max_num_hands=max_num_hands,
                running_mode=VisionRunningMode.VIDEO,
            )
        if enable_pose:
            self._pose_processor = PoseProcessor(
                running_mode=VisionRunningMode.VIDEO,
            )

    def process(self, image_bgr: np.ndarray) -> BodyFrame:
        hands = None
        pose = None
        if self._hand_processor is not None:
            hands = self._hand_processor.process(image_bgr)
        if self._pose_processor is not None:
            pose = self._pose_processor.process(image_bgr)
        return BodyFrame(
            timestamp=time.time(),
            hands=hands,
            pose=pose,
            image=image_bgr,
        )

    def close(self) -> None:
        if self._hand_processor:
            self._hand_processor.close()
        if self._pose_processor:
            self._pose_processor.close()

    def __enter__(self) -> "BodyProcessor":
        return self

    def __exit__(self, *args) -> None:
        self.close()
