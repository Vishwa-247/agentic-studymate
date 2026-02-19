"""
Body Language Feature Extraction
==================================

Extracts high-level behavioural features from **MediaPipe Hands** (21
landmarks per hand) and **MediaPipe Pose** (33 body landmarks).

Produces a flat ``Dict[str, float]`` that can be merged with the facial
features from ``feature_engineering.py`` and fed into ``StressEstimator``.

Features produced
-----------------
* ``hand_fidget_score``  – 0-1, rapid hand movement / finger twitching
* ``hand_to_face``       – 0-1, proximity of hand to face (anxiety signal)
* ``palm_openness``      – 0-1, open palm = confidence, closed = defensive
* ``posture_score``      – 0-1, higher = worse posture (slouch / lean)
* ``shoulder_tension``   – 0-1, raised / asymmetric shoulders
* ``body_stillness``     – 0-1, higher = more fidgeting (inverted stillness)
* ``lean_direction``     – str label: "center" | "left" | "right" | "forward"
* ``head_tilt``          – degrees of head tilt from vertical

Author: StudyMate Platform
"""

from __future__ import annotations

from collections import deque
from typing import Any, Dict, Optional

import numpy as np

try:
    from .hand_posture_module import BodyFrame, HandLandmarkFrame, PoseLandmarkFrame
except ImportError:
    from hand_posture_module import BodyFrame, HandLandmarkFrame, PoseLandmarkFrame


# ── MediaPipe landmark indices (Pose model, 33 landmarks) ───────────
# Reference: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
_NOSE = 0
_LEFT_SHOULDER = 11
_RIGHT_SHOULDER = 12
_LEFT_ELBOW = 13
_RIGHT_ELBOW = 14
_LEFT_WRIST = 15
_RIGHT_WRIST = 16
_LEFT_HIP = 23
_RIGHT_HIP = 24
_LEFT_EAR = 7
_RIGHT_EAR = 8

# ── MediaPipe Hand landmark indices (21 landmarks) ──────────────────
_WRIST = 0
_THUMB_TIP = 4
_INDEX_TIP = 8
_MIDDLE_TIP = 12
_RING_TIP = 16
_PINKY_TIP = 20
_INDEX_MCP = 5
_MIDDLE_MCP = 9
_RING_MCP = 13
_PINKY_MCP = 17

# Smoothing history length (frames)
_HISTORY = 15


def _dist(a: np.ndarray, b: np.ndarray) -> float:
    """Euclidean distance between two landmarks (x, y, z)."""
    return float(np.linalg.norm(a - b))


def _dist_2d(a: np.ndarray, b: np.ndarray) -> float:
    """Euclidean distance using only x, y (ignore depth)."""
    return float(np.linalg.norm(a[:2] - b[:2]))


class BodyLanguageExtractor:
    """Stateful feature extractor for hand gestures & body posture.
    
    Call ``extract(body_frame)`` each frame and merge the returned dict
    with facial features before passing to ``StressEstimator.predict()``.
    """

    def __init__(self, history_len: int = _HISTORY) -> None:
        self._history_len = history_len

        # ── Hand tracking history ────────────────────────────────
        self._prev_hand_positions: Dict[str, Optional[np.ndarray]] = {
            "Left": None, "Right": None,
        }
        self._hand_velocity_history: deque = deque(maxlen=history_len)
        self._hand_to_face_history: deque = deque(maxlen=history_len)
        self._palm_openness_history: deque = deque(maxlen=history_len)

        # ── Pose tracking history ────────────────────────────────
        self._posture_history: deque = deque(maxlen=history_len)
        self._shoulder_history: deque = deque(maxlen=history_len)
        self._body_position_history: deque = deque(maxlen=history_len)
        self._prev_body_center: Optional[np.ndarray] = None

    # ─────────────────────────────────────────────────────────────
    # Public API
    # ─────────────────────────────────────────────────────────────

    def extract(self, body_frame: BodyFrame) -> Dict[str, float]:
        """Extract body-language features from a combined BodyFrame.
        
        Returns a dict with keys matching the weight names in
        ``StressEstimator``.  Missing detections → 0.0 (benign default).
        """
        hand_features = self._extract_hand_features(body_frame.hands)
        pose_features = self._extract_pose_features(body_frame.pose)

        # Merge — hand features override defaults when hands are detected
        features: Dict[str, Any] = {
            "hand_fidget_score": hand_features.get("hand_fidget_score", 0.0),
            "hand_to_face": hand_features.get("hand_to_face", 0.0),
            "palm_openness": hand_features.get("palm_openness", 0.5),
            "posture_score": pose_features.get("posture_score", 0.0),
            "shoulder_tension": pose_features.get("shoulder_tension", 0.0),
            "body_stillness": pose_features.get("body_stillness", 0.0),
            "head_tilt": pose_features.get("head_tilt", 0.0),
        }

        # Compute lean_direction as a string (not fed to weights, but
        # included in the features dict for UI / logging).
        features["lean_direction_label"] = pose_features.get(
            "lean_direction_label", "center"
        )
        return features

    # ─────────────────────────────────────────────────────────────
    # Hand features
    # ─────────────────────────────────────────────────────────────

    def _extract_hand_features(
        self, hand_frame: Optional[HandLandmarkFrame],
    ) -> Dict[str, float]:
        if hand_frame is None or len(hand_frame.hands) == 0:
            # No hands detected — return benign defaults
            self._hand_velocity_history.append(0.0)
            self._hand_to_face_history.append(0.0)
            self._palm_openness_history.append(0.5)
            return {}

        fidget_velocities = []
        face_proximities = []
        openness_scores = []

        for i, (hand_lms, label) in enumerate(
            zip(hand_frame.hands, hand_frame.handedness)
        ):
            # ── 1. Fidget: velocity of wrist between frames ─────
            wrist_pos = hand_lms[_WRIST]
            prev = self._prev_hand_positions.get(label)
            if prev is not None:
                velocity = _dist_2d(wrist_pos, prev)
                fidget_velocities.append(velocity)
            self._prev_hand_positions[label] = wrist_pos.copy()

            # ── 2. Hand-to-face proximity ────────────────────────
            # Use nose position approximation: face center is roughly
            # at (0.5, 0.3) in normalized coords.  But better: we'll
            # compare wrist y-position to face region (y < 0.45).
            # Lower y = higher on screen = closer to face.
            wrist_y = float(wrist_pos[1])
            # If wrist is above shoulders (y < 0.45) it's near face
            # The closer to nose (~0.25-0.35), the higher the score.
            if wrist_y < 0.50:
                proximity = float(np.clip(1.0 - wrist_y / 0.50, 0.0, 1.0))
            else:
                proximity = 0.0
            face_proximities.append(proximity)

            # ── 3. Palm openness (finger spread) ─────────────────
            openness = self._compute_palm_openness(hand_lms)
            openness_scores.append(openness)

        # Aggregate across both hands
        fidget = float(np.mean(fidget_velocities)) if fidget_velocities else 0.0
        # Scale fidget: small movements < 0.01 are normal, > 0.04 is fidgety
        fidget_score = float(np.clip(fidget / 0.04, 0.0, 1.0))

        face_prox = float(np.max(face_proximities)) if face_proximities else 0.0
        palm_open = float(np.mean(openness_scores)) if openness_scores else 0.5

        # Smooth
        self._hand_velocity_history.append(fidget_score)
        self._hand_to_face_history.append(face_prox)
        self._palm_openness_history.append(palm_open)

        return {
            "hand_fidget_score": float(np.mean(self._hand_velocity_history)),
            "hand_to_face": float(np.mean(self._hand_to_face_history)),
            "palm_openness": float(np.mean(self._palm_openness_history)),
        }

    def _compute_palm_openness(self, hand_lms: np.ndarray) -> float:
        """How spread/open the hand is.  0 = clenched fist, 1 = fully open.
        
        Measured by average finger-tip to palm-center distance relative
        to palm size.
        """
        palm_center = np.mean(
            hand_lms[[_WRIST, _INDEX_MCP, _MIDDLE_MCP, _RING_MCP, _PINKY_MCP]], axis=0
        )
        palm_size = _dist(hand_lms[_WRIST], hand_lms[_MIDDLE_MCP])
        if palm_size < 1e-6:
            return 0.5

        tips = [_THUMB_TIP, _INDEX_TIP, _MIDDLE_TIP, _RING_TIP, _PINKY_TIP]
        avg_tip_dist = float(np.mean([_dist(hand_lms[t], palm_center) for t in tips]))

        # Normalize by palm size.  Closed fist ≈ 0.5, open ≈ 1.5+
        ratio = avg_tip_dist / palm_size
        openness = float(np.clip((ratio - 0.5) / 1.0, 0.0, 1.0))
        return openness

    # ─────────────────────────────────────────────────────────────
    # Pose features
    # ─────────────────────────────────────────────────────────────

    def _extract_pose_features(
        self, pose_frame: Optional[PoseLandmarkFrame],
    ) -> Dict[str, Any]:
        if pose_frame is None:
            self._posture_history.append(0.0)
            self._shoulder_history.append(0.0)
            self._body_position_history.append(0.0)
            return {}

        lms = pose_frame.landmarks  # (33, 3)
        vis = pose_frame.visibility  # (33,)

        posture = self._compute_posture_score(lms, vis)
        shoulder = self._compute_shoulder_tension(lms, vis)
        stillness = self._compute_body_stillness(lms)
        head_tilt = self._compute_head_tilt(lms, vis)
        lean_label = self._compute_lean_direction(lms, vis)

        self._posture_history.append(posture)
        self._shoulder_history.append(shoulder)

        return {
            "posture_score": float(np.mean(self._posture_history)),
            "shoulder_tension": float(np.mean(self._shoulder_history)),
            "body_stillness": stillness,  # already smoothed internally
            "head_tilt": head_tilt,
            "lean_direction_label": lean_label,  # type: ignore[dict-item]
        }

    def _compute_posture_score(
        self, lms: np.ndarray, vis: np.ndarray,
    ) -> float:
        """0 = upright, 1 = severely slouched.
        
        Slouch detection: compare vertical alignment of shoulders
        relative to hips.  Good posture: shoulders directly above hips.
        Slouching: shoulders move forward (larger z) or drop (larger y).
        """
        # Check visibility
        needed = [_LEFT_SHOULDER, _RIGHT_SHOULDER, _LEFT_HIP, _RIGHT_HIP, _NOSE]
        if any(vis[i] < 0.3 for i in needed):
            return 0.0  # not enough confidence

        mid_shoulder = (lms[_LEFT_SHOULDER] + lms[_RIGHT_SHOULDER]) / 2
        mid_hip = (lms[_LEFT_HIP] + lms[_RIGHT_HIP]) / 2
        nose = lms[_NOSE]

        # Vertical alignment: shoulder y should be well above hip y.
        # In normalized coords, y=0 is top, y=1 is bottom.
        torso_height = float(mid_hip[1] - mid_shoulder[1])  # positive = normal
        if torso_height < 0.01:
            return 0.0

        # Forward lean: shoulder z vs hip z.  If shoulders are more
        # forward (toward camera) than expected, that's slouching.
        forward_lean = float(mid_hip[2] - mid_shoulder[2])
        # Positive forward_lean means shoulders are closer to camera than hips

        # Nose-to-shoulder vertical distance.  If nose drops close to
        # shoulders, user is hunching.
        head_drop = float(mid_shoulder[1] - nose[1])  # smaller = head dropping
        head_drop_ratio = head_drop / max(torso_height, 0.01)

        # Slouch score combines forward lean + head drop
        # Normal: forward_lean ≈ 0, head_drop_ratio ≈ 0.5+
        slouch = float(np.clip(
            (1.0 - head_drop_ratio) * 0.6 + abs(forward_lean) * 8.0 * 0.4,
            0.0, 1.0
        ))

        return slouch

    def _compute_shoulder_tension(
        self, lms: np.ndarray, vis: np.ndarray,
    ) -> float:
        """0 = relaxed, 1 = tense/raised shoulders.
        
        Tension signal: shoulders raised toward ears, or asymmetric
        shoulder height.
        """
        needed = [_LEFT_SHOULDER, _RIGHT_SHOULDER, _LEFT_EAR, _RIGHT_EAR]
        if any(vis[i] < 0.3 for i in needed):
            return 0.0

        # Shoulder-to-ear distance (normalized).  Tense → shoulders rise
        # → distance shrinks.
        left_ear_shoulder = _dist_2d(lms[_LEFT_EAR], lms[_LEFT_SHOULDER])
        right_ear_shoulder = _dist_2d(lms[_RIGHT_EAR], lms[_RIGHT_SHOULDER])
        avg_ear_shoulder = (left_ear_shoulder + right_ear_shoulder) / 2

        # Normal ≈ 0.12-0.18, tense ≈ 0.06-0.10
        tension_from_height = float(np.clip(
            1.0 - (avg_ear_shoulder - 0.06) / 0.12, 0.0, 1.0
        ))

        # Asymmetry: different shoulder heights = uneven tension
        shoulder_height_diff = abs(lms[_LEFT_SHOULDER][1] - lms[_RIGHT_SHOULDER][1])
        asymmetry = float(np.clip(shoulder_height_diff / 0.05, 0.0, 1.0))

        return tension_from_height * 0.7 + asymmetry * 0.3

    def _compute_body_stillness(self, lms: np.ndarray) -> float:
        """0 = still, 1 = fidgety body.
        
        Uses torso center-of-mass velocity across frames.
        """
        mid_body = (lms[_LEFT_SHOULDER] + lms[_RIGHT_SHOULDER] +
                     lms[_LEFT_HIP] + lms[_RIGHT_HIP]) / 4

        if self._prev_body_center is not None:
            velocity = _dist_2d(mid_body, self._prev_body_center)
        else:
            velocity = 0.0
        self._prev_body_center = mid_body.copy()

        # Scale: normal typing/nodding ≈ 0.001-0.005, fidgeting > 0.01
        fidget_score = float(np.clip(velocity / 0.015, 0.0, 1.0))

        self._body_position_history.append(fidget_score)
        return float(np.mean(self._body_position_history))

    def _compute_head_tilt(
        self, lms: np.ndarray, vis: np.ndarray,
    ) -> float:
        """Head tilt in degrees from vertical. 0 = straight, >15 = notable."""
        needed = [_LEFT_EAR, _RIGHT_EAR]
        if any(vis[i] < 0.3 for i in needed):
            return 0.0

        left_ear = lms[_LEFT_EAR]
        right_ear = lms[_RIGHT_EAR]
        dx = right_ear[0] - left_ear[0]
        dy = right_ear[1] - left_ear[1]
        angle = float(np.degrees(np.arctan2(dy, dx)))
        return abs(angle)  # degrees from horizontal (0 = level)

    def _compute_lean_direction(
        self, lms: np.ndarray, vis: np.ndarray,
    ) -> str:
        """Classify body lean: center, left, right, or forward."""
        needed = [_LEFT_SHOULDER, _RIGHT_SHOULDER, _LEFT_HIP, _RIGHT_HIP, _NOSE]
        if any(vis[i] < 0.3 for i in needed):
            return "center"

        mid_shoulder = (lms[_LEFT_SHOULDER] + lms[_RIGHT_SHOULDER]) / 2
        mid_hip = (lms[_LEFT_HIP] + lms[_RIGHT_HIP]) / 2
        nose = lms[_NOSE]

        # Lateral lean: nose x vs mid_hip x
        lateral_offset = nose[0] - mid_hip[0]

        # Forward lean: nose z vs mid_shoulder z
        forward_offset = mid_shoulder[2] - nose[2]

        if abs(lateral_offset) > 0.06:
            # Nose is significantly left or right of hips
            return "left" if lateral_offset < 0 else "right"
        elif forward_offset > 0.04:
            return "forward"
        else:
            return "center"
