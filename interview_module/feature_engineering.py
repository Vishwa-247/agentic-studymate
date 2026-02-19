"""
Feature Engineering for AI Micro-Expression Analyzer
=====================================================

Enhanced for StudyMate Interview Coach integration.
Extracts facial micro-expression features from MediaPipe 478-landmark mesh
and computes derived behavioral signals for interview stress analysis.

Features extracted:
  - 5 core facial metrics (eyebrow, lip, nod, symmetry, blink)
  - Engagement score (eye contact + head movement + mouth openness)
  - Stress recovery rate (how quickly stress drops after a spike)
  - Micro-expression flash detection (expressions lasting < 0.5s)
  - Jaw clench detection (separate from lip tension)
  - Head stability (overall positional steadiness)

Author: StudyMate Platform
"""

from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass, field
from typing import Any, Deque, Dict, List, Optional, Tuple

import numpy as np

from face_mesh_module import LandmarkFrame

# ── MediaPipe Face Mesh Landmark Indices ─────────────────────────────
# Eyes
LEFT_EYE_LIDS = (159, 145)
RIGHT_EYE_LIDS = (386, 374)
LEFT_EYE_HORIZONTAL = (33, 133)
RIGHT_EYE_HORIZONTAL = (362, 263)
LEFT_IRIS_CENTER = 468       # iris landmarks start at 468
RIGHT_IRIS_CENTER = 473

# Eyebrows
LEFT_EYEBROW = (55, 107, 46)
RIGHT_EYEBROW = (285, 336, 276)

# Mouth
LEFT_LIP_CORNER = 61
RIGHT_LIP_CORNER = 291
TOP_LIP = 13
BOTTOM_LIP = 14
UPPER_LIP_INNER = 0         # inner upper lip
LOWER_LIP_INNER = 17        # inner lower lip

# Jaw
JAW_LEFT = 172
JAW_RIGHT = 397
JAW_TIP = 199

# Head reference points
NOSE_TIP = 1
CHIN = 152
FOREHEAD = 10
LEFT_CHEEK = 234
RIGHT_CHEEK = 454
LEFT_EAR = 234
RIGHT_EAR = 454


def _distance(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.linalg.norm(a - b))


def _average_points(indices: List[int], landmarks: np.ndarray) -> np.ndarray:
    points = np.array([landmarks[idx] for idx in indices], dtype=np.float32)
    return points.mean(axis=0)


@dataclass
class TemporalMetric:
    """Tracks event counts within a rolling time window."""
    window_seconds: float
    timestamps: Deque[float] = field(default_factory=deque)

    def add(self, timestamp: float) -> None:
        self.timestamps.append(timestamp)
        while self.timestamps and (timestamp - self.timestamps[0]) > self.window_seconds:
            self.timestamps.popleft()

    @property
    def count(self) -> int:
        return len(self.timestamps)


@dataclass
class MicroExpressionEvent:
    """A detected micro-expression flash (< 0.5s duration)."""
    expression_type: str       # "eyebrow_flash", "lip_press", "eye_squeeze"
    intensity: float           # 0.0 – 1.0
    start_time: float
    end_time: float
    duration_ms: float         # milliseconds the expression lasted
    question_context: str = "" # which question was being asked

    @property
    def is_genuine_micro(self) -> bool:
        """True micro-expressions last 40–500ms."""
        return 40 <= self.duration_ms <= 500


@dataclass
class EngagementSnapshot:
    """Composite engagement score for a single moment."""
    eye_contact: float         # 0–1 (gaze at camera)
    head_attentiveness: float  # 0–1 (stable head, slight nodding = engaged)
    facial_expressiveness: float  # 0–1 (too flat = disengaged, moderate = engaged)
    overall: float             # weighted composite 0–1


class FeatureExtractor:
    """Extracts facial features from MediaPipe landmarks.

    Enhanced with:
    - Engagement scoring
    - Stress recovery tracking
    - Micro-expression flash detection
    - Jaw clench monitoring
    - Head stability measurement
    - Eye gaze direction estimation
    """

    def __init__(
        self,
        smoothing_window: int = 3,
        blink_threshold: float = 0.23,
        blink_window_seconds: float = 60.0,
    ) -> None:
        self.smoothing_window = smoothing_window
        self.blink_threshold = blink_threshold
        self.previous_blink_state = False

        # ── Smoothing histories ──────────────────────────────────
        self.metrics_history: Dict[str, Deque[float]] = {
            "eyebrow": deque(maxlen=smoothing_window),
            "lip_tension": deque(maxlen=smoothing_window),
            "nod": deque(maxlen=smoothing_window),
            "symmetry": deque(maxlen=smoothing_window),
            "jaw_clench": deque(maxlen=smoothing_window),
            "head_stability": deque(maxlen=smoothing_window),
            "mouth_openness": deque(maxlen=smoothing_window),
        }
        self.blink_events = TemporalMetric(window_seconds=blink_window_seconds)
        self.previous_nose_height: float | None = None

        # ── Stress recovery tracking ────────────────────────────
        self._stress_history: Deque[Tuple[float, float]] = deque(maxlen=300)  # (timestamp, score)
        self._last_spike_time: Optional[float] = None
        self._recovery_rates: Deque[float] = deque(maxlen=20)  # rates from recent recoveries

        # ── Micro-expression detection ──────────────────────────
        self._expression_onsets: Dict[str, Optional[Tuple[float, float]]] = {
            "eyebrow_flash": None,     # (onset_time, onset_value)
            "lip_press": None,
            "eye_squeeze": None,
        }
        self._micro_expression_log: List[MicroExpressionEvent] = []

        # ── Head tracking for stability ─────────────────────────
        self._head_positions: Deque[np.ndarray] = deque(maxlen=30)  # last 1 second @ 30fps

        # ── Engagement tracking ─────────────────────────────────
        self._gaze_on_camera_frames = 0
        self._total_gaze_frames = 0

        # ── Eye contact via iris ────────────────────────────────
        self._eye_contact_history: Deque[float] = deque(maxlen=smoothing_window)

    # ── Core Feature Extractors ──────────────────────────────────────

    def _eye_aspect_ratio(
        self,
        landmarks: np.ndarray,
        lids: tuple[int, int],
        horizontal_pair: tuple[int, int],
    ) -> float:
        upper = landmarks[lids[0]]
        lower = landmarks[lids[1]]
        horizontal = _distance(landmarks[horizontal_pair[0]], landmarks[horizontal_pair[1]])
        return _distance(upper, lower) / max(horizontal, 1e-5)

    def _compute_blink_rate(self, frame: LandmarkFrame) -> float:
        left_ratio = self._eye_aspect_ratio(
            frame.landmarks, LEFT_EYE_LIDS, LEFT_EYE_HORIZONTAL,
        )
        right_ratio = self._eye_aspect_ratio(
            frame.landmarks, RIGHT_EYE_LIDS, RIGHT_EYE_HORIZONTAL,
        )
        eye_ratio = (left_ratio + right_ratio) * 0.5
        is_blinking = eye_ratio < self.blink_threshold
        if is_blinking and not self.previous_blink_state:
            self.blink_events.add(frame.timestamp)
        self.previous_blink_state = is_blinking
        minutes = max(self.blink_events.window_seconds / 60.0, 1e-3)
        return self.blink_events.count / minutes

    def _compute_eyebrow_raise(self, landmarks: np.ndarray) -> float:
        left_brow = _average_points(list(LEFT_EYEBROW), landmarks)
        right_brow = _average_points(list(RIGHT_EYEBROW), landmarks)
        anchor = (landmarks[LEFT_EYE_LIDS[0]] + landmarks[RIGHT_EYE_LIDS[0]]) * 0.5
        left_raise = abs(left_brow[1] - anchor[1])
        right_raise = abs(right_brow[1] - anchor[1])
        value = (left_raise + right_raise) * 0.5
        self.metrics_history["eyebrow"].append(value)
        return float(np.mean(self.metrics_history["eyebrow"]))

    def _compute_lip_tension(self, landmarks: np.ndarray) -> float:
        mouth_width = _distance(landmarks[LEFT_LIP_CORNER], landmarks[RIGHT_LIP_CORNER])
        mouth_height = _distance(landmarks[TOP_LIP], landmarks[BOTTOM_LIP])
        raw_ratio = mouth_width / max(mouth_height, 1e-5)
        tension = float(np.clip((raw_ratio - 5.0) / 55.0, 0.0, 1.0))
        self.metrics_history["lip_tension"].append(tension)
        return float(np.mean(self.metrics_history["lip_tension"]))

    def _compute_head_nod(self, frame: LandmarkFrame) -> float:
        nose_y = frame.landmarks[NOSE_TIP][1]
        chin_y = frame.landmarks[CHIN][1]
        head_length = abs(chin_y - nose_y)
        if self.previous_nose_height is None:
            self.previous_nose_height = nose_y
            return 0.0
        delta = abs(nose_y - self.previous_nose_height) / max(head_length, 1e-5)
        self.previous_nose_height = nose_y
        self.metrics_history["nod"].append(delta)
        return float(np.mean(self.metrics_history["nod"]))

    def _compute_symmetry(self, landmarks: np.ndarray) -> float:
        left_cheek = landmarks[LEFT_CHEEK]
        right_cheek = landmarks[RIGHT_CHEEK]
        nose = landmarks[NOSE_TIP]
        left_dist = _distance(left_cheek, nose)
        right_dist = _distance(right_cheek, nose)
        symmetry_score = abs(left_dist - right_dist) / max(
            (left_dist + right_dist) * 0.5, 1e-5
        )
        self.metrics_history["symmetry"].append(symmetry_score)
        return float(np.mean(self.metrics_history["symmetry"]))

    # ── NEW: Advanced Feature Extractors ─────────────────────────────

    def _compute_jaw_clench(self, landmarks: np.ndarray) -> float:
        """Detect jaw clenching via jaw width relative to face height.
        
        Clenching causes masseter contraction → jaw widens slightly and
        mouth height compresses. Combined signal is more reliable than
        either alone.
        
        Calibrated so relaxed jaw ≈ 0.1–0.2, clenched ≈ 0.6–0.9.
        """
        jaw_width = _distance(landmarks[JAW_LEFT], landmarks[JAW_RIGHT])
        face_height = _distance(landmarks[FOREHEAD], landmarks[CHIN])
        jaw_ratio = jaw_width / max(face_height, 1e-5)

        # Baseline jaw_ratio is typically 0.55-0.70 for a relaxed face.
        # Clenching pushes it to 0.75+.  Subtract baseline so relaxed ≈ 0.
        jaw_deviation = float(np.clip((jaw_ratio - 0.65) / 0.15, 0.0, 1.0))

        mouth_height = _distance(landmarks[TOP_LIP], landmarks[BOTTOM_LIP])
        face_width = _distance(landmarks[LEFT_CHEEK], landmarks[RIGHT_CHEEK])
        # Normalize mouth_height by face_width for scale independence
        mouth_ratio = mouth_height / max(face_width, 1e-5)
        # Closed mouth ≈ 0.02, open ≈ 0.08+. Clench = low ratio.
        mouth_compress = float(np.clip(1.0 - mouth_ratio / 0.06, 0.0, 1.0))

        # Combine: only flag as clench when BOTH signals present
        clench = jaw_deviation * 0.5 + mouth_compress * 0.5
        # Reduce further — only significant clenching should register
        clench = float(np.clip(clench * 0.8, 0.0, 1.0))

        self.metrics_history["jaw_clench"].append(clench)
        return float(np.mean(self.metrics_history["jaw_clench"]))

    def _compute_mouth_openness(self, landmarks: np.ndarray) -> float:
        """How open the mouth is — indicator of speaking vs. silent."""
        mouth_height = _distance(landmarks[TOP_LIP], landmarks[BOTTOM_LIP])
        mouth_width = _distance(landmarks[LEFT_LIP_CORNER], landmarks[RIGHT_LIP_CORNER])
        openness = mouth_height / max(mouth_width, 1e-5)
        self.metrics_history["mouth_openness"].append(openness)
        return float(np.mean(self.metrics_history["mouth_openness"]))

    def _compute_head_stability(self, frame: LandmarkFrame) -> float:
        """Track how stable the head position is over the last ~1 second.
        
        Low jitter = stable (could be engaged OR frozen).
        High jitter = fidgety/nervous.
        Returns: jitter score 0.0 (perfectly still) to 1.0+ (very fidgety).
        """
        nose_pos = frame.landmarks[NOSE_TIP].copy()
        self._head_positions.append(nose_pos)

        if len(self._head_positions) < 3:
            return 0.0

        positions = np.array(self._head_positions)
        # Standard deviation of positions across recent frames
        jitter = float(np.std(positions, axis=0).mean())
        # Normalize: typical calm jitter ≈ 0.001, nervous ≈ 0.005+
        normalized = float(np.clip(jitter / 0.008, 0.0, 1.5))
        self.metrics_history["head_stability"].append(normalized)
        return float(np.mean(self.metrics_history["head_stability"]))

    def _compute_eye_contact(self, landmarks: np.ndarray) -> float:
        """Estimate eye contact using iris position relative to eye corners.
        
        When looking at camera, iris is approximately centered horizontally
        in the eye. Looking away shifts the iris toward corners.
        Returns: 0.0 (looking away) to 1.0 (direct eye contact).
        """
        # Use iris center landmarks if available (indices 468-477)
        if landmarks.shape[0] <= LEFT_IRIS_CENTER:
            # No iris landmarks — fall back to eye lid ratio as proxy
            return 0.5  # can't determine

        left_iris = landmarks[LEFT_IRIS_CENTER]
        right_iris = landmarks[RIGHT_IRIS_CENTER]
        left_inner = landmarks[LEFT_EYE_HORIZONTAL[0]]
        left_outer = landmarks[LEFT_EYE_HORIZONTAL[1]]
        right_inner = landmarks[RIGHT_EYE_HORIZONTAL[0]]
        right_outer = landmarks[RIGHT_EYE_HORIZONTAL[1]]

        # Horizontal position of iris relative to eye span (0=inner, 1=outer)
        left_span = _distance(left_inner, left_outer)
        left_pos = _distance(left_inner, left_iris) / max(left_span, 1e-5)

        right_span = _distance(right_inner, right_outer)
        right_pos = _distance(right_inner, right_iris) / max(right_span, 1e-5)

        # Center = ~0.5 for both eyes = looking at camera
        avg_deviation = (abs(left_pos - 0.5) + abs(right_pos - 0.5)) / 2.0
        # Convert deviation to contact score: 0 deviation = 1.0 contact
        contact = float(np.clip(1.0 - avg_deviation * 3.0, 0.0, 1.0))

        self._total_gaze_frames += 1
        if contact > 0.5:
            self._gaze_on_camera_frames += 1

        self._eye_contact_history.append(contact)
        return float(np.mean(self._eye_contact_history))

    def _compute_engagement(
        self,
        eye_contact: float,
        head_nod: float,
        head_stability: float,
        mouth_openness: float,
    ) -> EngagementSnapshot:
        """Composite engagement score from multiple signals.
        
        High engagement = good eye contact + slight nodding + 
        moderate expressiveness + speaking (mouth open).
        """
        # Eye contact contributes most to engagement
        eye_score = float(np.clip(eye_contact, 0.0, 1.0))

        # Head attentiveness: slight nodding is engaged (0.1-0.3),
        # still is neutral (0), excessive is distracted (0.5+)
        nod_score = 1.0 - abs(head_nod - 0.15) / 0.35
        nod_score = float(np.clip(nod_score, 0.0, 1.0))

        # Expressiveness: too flat (frozen) = low, moderate = high, extreme = stress
        expr_score = 1.0 - abs(head_stability - 0.2) / 0.5
        expr_score = float(np.clip(expr_score, 0.0, 1.0))

        # Mouth openness indicates speaking (active participation)
        speaking_score = float(np.clip(mouth_openness / 0.15, 0.0, 1.0))

        # Weighted composite
        overall = (
            eye_score * 0.35 +
            nod_score * 0.25 +
            expr_score * 0.15 +
            speaking_score * 0.25
        )

        return EngagementSnapshot(
            eye_contact=eye_score,
            head_attentiveness=nod_score,
            facial_expressiveness=expr_score,
            overall=float(np.clip(overall, 0.0, 1.0)),
        )

    # ── Gaze Direction + Psychology Labels ────────────────────────

    def _compute_gaze_direction(self, landmarks: np.ndarray) -> Dict[str, Any]:
        """Compute gaze direction (horizontal/vertical) and psychology label.
        
        Uses iris position relative to eye corners to determine where
        the person is looking. Maps to NLP Eye Accessing Cues:
          - Up-Left:    Visual Recall (remembering images)
          - Up-Right:   Visual Construction (imagining/creating images)
          - Left:       Auditory Recall (remembering sounds)
          - Right:      Auditory Construction (creating sounds)
          - Down-Left:  Internal Dialogue (self-talk)
          - Down-Right: Kinesthetic (feelings/emotions)
          - Center:     Direct Engagement
        
        Returns dict with keys: gaze_h, gaze_v, gaze_zone, gaze_label
        """
        if landmarks.shape[0] <= LEFT_IRIS_CENTER:
            return {
                "gaze_h": 0.0,
                "gaze_v": 0.0,
                "gaze_zone": "center",
                "gaze_label": "Direct Engagement",
            }

        # ── Horizontal position (iris relative to eye span) ──
        left_iris = landmarks[LEFT_IRIS_CENTER]
        right_iris = landmarks[RIGHT_IRIS_CENTER]
        left_inner = landmarks[LEFT_EYE_HORIZONTAL[0]]
        left_outer = landmarks[LEFT_EYE_HORIZONTAL[1]]
        right_inner = landmarks[RIGHT_EYE_HORIZONTAL[0]]
        right_outer = landmarks[RIGHT_EYE_HORIZONTAL[1]]

        left_span = _distance(left_inner, left_outer)
        left_pos = _distance(left_inner, left_iris) / max(left_span, 1e-5)
        right_span = _distance(right_inner, right_outer)
        right_pos = _distance(right_inner, right_iris) / max(right_span, 1e-5)

        # Average horizontal position: 0.5 = center
        h_pos = (left_pos + right_pos) / 2.0
        # Normalize to -1..+1: negative = looking left, positive = looking right
        gaze_h = float(np.clip((h_pos - 0.5) * 4.0, -1.0, 1.0))

        # ── Vertical position (iris relative to eye height) ──
        left_upper = landmarks[LEFT_EYE_LIDS[0]]
        left_lower = landmarks[LEFT_EYE_LIDS[1]]
        right_upper = landmarks[RIGHT_EYE_LIDS[0]]
        right_lower = landmarks[RIGHT_EYE_LIDS[1]]

        left_eye_h = _distance(left_upper, left_lower)
        left_iris_v = _distance(left_upper, left_iris) / max(left_eye_h, 1e-5)
        right_eye_h = _distance(right_upper, right_lower)
        right_iris_v = _distance(right_upper, right_iris) / max(right_eye_h, 1e-5)

        v_pos = (left_iris_v + right_iris_v) / 2.0
        # Normalize: negative = looking up, positive = looking down
        gaze_v = float(np.clip((v_pos - 0.5) * 4.0, -1.0, 1.0))

        # ── Map to 9-zone grid ──
        H_THRESH = 0.25
        V_THRESH = 0.25

        if abs(gaze_h) < H_THRESH and abs(gaze_v) < V_THRESH:
            zone = "center"
        elif gaze_v < -V_THRESH:
            if gaze_h < -H_THRESH:
                zone = "up-left"
            elif gaze_h > H_THRESH:
                zone = "up-right"
            else:
                zone = "up"
        elif gaze_v > V_THRESH:
            if gaze_h < -H_THRESH:
                zone = "down-left"
            elif gaze_h > H_THRESH:
                zone = "down-right"
            else:
                zone = "down"
        else:
            if gaze_h < -H_THRESH:
                zone = "left"
            else:
                zone = "right"

        label = self._gaze_psychology_label(zone)

        return {
            "gaze_h": round(gaze_h, 3),
            "gaze_v": round(gaze_v, 3),
            "gaze_zone": zone,
            "gaze_label": label,
        }

    @staticmethod
    def _gaze_psychology_label(zone: str) -> str:
        """Map gaze zone to NLP Eye Accessing Cue label."""
        labels = {
            "up-left": "Visual Recall",
            "up": "Visual Processing",
            "up-right": "Visual Construction",
            "left": "Auditory Recall",
            "center": "Direct Engagement",
            "right": "Auditory Construction",
            "down-left": "Internal Dialogue",
            "down": "Processing / Thinking",
            "down-right": "Kinesthetic / Emotional",
        }
        return labels.get(zone, "Direct Engagement")

    # ── Micro-Expression Flash Detection ─────────────────────────────

    def _detect_micro_expressions(
        self,
        frame: LandmarkFrame,
        eyebrow: float,
        lip_tension: float,
    ) -> List[MicroExpressionEvent]:
        """Detect expression flashes < 500ms — genuine micro-expressions.
        
        Tracks onset/offset of eyebrow raises, lip presses, and eye squeezes
        to measure expression duration. Only logs events 40–500ms long.
        """
        detected: List[MicroExpressionEvent] = []
        now = frame.timestamp

        # Check eyebrow flash (onset > 0.04, offset < 0.03)
        detected.extend(self._track_expression_event(
            "eyebrow_flash", eyebrow, onset_thresh=0.04,
            offset_thresh=0.03, now=now,
        ))

        # Check lip press (onset > 0.5, offset < 0.3)
        detected.extend(self._track_expression_event(
            "lip_press", lip_tension, onset_thresh=0.5,
            offset_thresh=0.3, now=now,
        ))

        # Eye squeeze (blink-like but partial — EAR between 0.15 and blink_threshold)
        left_ear = self._eye_aspect_ratio(
            frame.landmarks, LEFT_EYE_LIDS, LEFT_EYE_HORIZONTAL,
        )
        right_ear = self._eye_aspect_ratio(
            frame.landmarks, RIGHT_EYE_LIDS, RIGHT_EYE_HORIZONTAL,
        )
        avg_ear = (left_ear + right_ear) * 0.5
        squeeze_intensity = float(np.clip(
            (self.blink_threshold - avg_ear) / self.blink_threshold, 0.0, 1.0
        ))
        detected.extend(self._track_expression_event(
            "eye_squeeze", squeeze_intensity, onset_thresh=0.3,
            offset_thresh=0.15, now=now,
        ))

        self._micro_expression_log.extend(detected)
        return detected

    def _track_expression_event(
        self,
        expr_type: str,
        value: float,
        onset_thresh: float,
        offset_thresh: float,
        now: float,
    ) -> List[MicroExpressionEvent]:
        """Track onset/offset of a single expression type."""
        events: List[MicroExpressionEvent] = []
        onset = self._expression_onsets.get(expr_type)

        if value >= onset_thresh and onset is None:
            # Expression just started
            self._expression_onsets[expr_type] = (now, value)
        elif value < offset_thresh and onset is not None:
            # Expression just ended
            onset_time, onset_val = onset
            duration_ms = (now - onset_time) * 1000.0
            if 40 <= duration_ms <= 2000:  # log up to 2s but flag genuine micros
                event = MicroExpressionEvent(
                    expression_type=expr_type,
                    intensity=onset_val,
                    start_time=onset_time,
                    end_time=now,
                    duration_ms=duration_ms,
                )
                events.append(event)
            self._expression_onsets[expr_type] = None

        return events

    # ── Stress Recovery Tracking ─────────────────────────────────────

    def track_stress_recovery(self, stress_score: float, timestamp: float) -> float:
        """Track how quickly stress drops after a spike.
        
        Call this after each stress prediction to update recovery tracking.
        Returns: average recovery rate (score drop per second). Higher = recovers faster.
                 Returns 0.0 if no spikes have occurred yet.
        """
        self._stress_history.append((timestamp, stress_score))

        # Detect new spike
        if stress_score >= 0.65 and (
            self._last_spike_time is None
            or timestamp - self._last_spike_time > 3.0  # minimum 3s between spikes
        ):
            self._last_spike_time = timestamp

        # Check if we're recovering from a spike
        if self._last_spike_time is not None:
            time_since_spike = timestamp - self._last_spike_time
            if 2.0 < time_since_spike < 15.0 and stress_score < 0.45:
                # Recovered! Calculate rate
                # Find the peak score near the spike time
                peak = max(
                    (s for t, s in self._stress_history
                     if abs(t - self._last_spike_time) < 1.0),
                    default=stress_score,
                )
                drop = peak - stress_score
                rate = drop / max(time_since_spike, 0.1)
                self._recovery_rates.append(rate)
                self._last_spike_time = None  # reset

        if self._recovery_rates:
            return float(np.mean(self._recovery_rates))
        return 0.0

    # ── Public Properties ────────────────────────────────────────────

    @property
    def eye_contact_ratio(self) -> float:
        """Percentage of frames with detected eye contact."""
        if self._total_gaze_frames == 0:
            return 0.5
        return self._gaze_on_camera_frames / self._total_gaze_frames

    @property
    def micro_expression_events(self) -> List[MicroExpressionEvent]:
        """All micro-expression events detected this session."""
        return list(self._micro_expression_log)

    @property
    def genuine_micro_expressions(self) -> List[MicroExpressionEvent]:
        """Only genuine micro-expressions (40–500ms)."""
        return [e for e in self._micro_expression_log if e.is_genuine_micro]

    def get_micro_expression_summary(self) -> Dict:
        """Summary of micro-expressions for the entire session."""
        genuine = self.genuine_micro_expressions
        all_events = self._micro_expression_log
        from collections import Counter
        type_counts = Counter(e.expression_type for e in genuine)
        return {
            "total_detected": len(all_events),
            "genuine_micro_expressions": len(genuine),
            "by_type": dict(type_counts),
            "avg_duration_ms": float(np.mean([e.duration_ms for e in genuine])) if genuine else 0.0,
            "max_intensity": max((e.intensity for e in genuine), default=0.0),
        }

    def reset_session(self) -> None:
        """Reset all session-level tracking (call when starting a new interview)."""
        self._stress_history.clear()
        self._last_spike_time = None
        self._recovery_rates.clear()
        self._micro_expression_log.clear()
        self._gaze_on_camera_frames = 0
        self._total_gaze_frames = 0
        self._head_positions.clear()
        for key in self._expression_onsets:
            self._expression_onsets[key] = None

    # ── Main Extraction Method ───────────────────────────────────────

    def extract(self, frame: LandmarkFrame) -> Dict[str, Any]:
        """Extract all features from a single landmark frame.
        
        Returns the original 5 core features PLUS new advanced features.
        Backward-compatible — all original keys are preserved.
        """
        # ── Core features (original) ────────────────────────────
        eyebrow = self._compute_eyebrow_raise(frame.landmarks)
        lip_tension = self._compute_lip_tension(frame.landmarks)
        nod = self._compute_head_nod(frame)
        symmetry = self._compute_symmetry(frame.landmarks)
        blink_rate = self._compute_blink_rate(frame)

        # ── Advanced features (new) ─────────────────────────────
        jaw_clench = self._compute_jaw_clench(frame.landmarks)
        mouth_openness = self._compute_mouth_openness(frame.landmarks)
        head_stability = self._compute_head_stability(frame)
        eye_contact = self._compute_eye_contact(frame.landmarks)

        # ── Gaze direction ──────────────────────────────────────
        gaze = self._compute_gaze_direction(frame.landmarks)

        # ── Micro-expression detection ──────────────────────────
        self._detect_micro_expressions(frame, eyebrow, lip_tension)

        # ── Engagement composite ────────────────────────────────
        engagement = self._compute_engagement(
            eye_contact, nod, head_stability, mouth_openness,
        )

        return {
            # Original 5
            "eyebrow_raise": eyebrow,
            "lip_tension": lip_tension,
            "head_nod_intensity": nod,
            "symmetry_delta": symmetry,
            "blink_rate": blink_rate,
            # New advanced features
            "jaw_clench": jaw_clench,
            "mouth_openness": mouth_openness,
            "head_stability": head_stability,
            "eye_contact_ratio": eye_contact,
            "engagement_score": engagement.overall,
            "engagement_eye_contact": engagement.eye_contact,
            "engagement_attentiveness": engagement.head_attentiveness,
            # Gaze direction
            "gaze_h": gaze["gaze_h"],
            "gaze_v": gaze["gaze_v"],
            "gaze_zone": gaze["gaze_zone"],
            "gaze_label": gaze["gaze_label"],
        }

    def extract_with_metadata(self, frame: LandmarkFrame) -> Tuple[Dict[str, float], Dict]:
        """Extract features plus metadata useful for deep feedback.
        
        Returns:
            features: dict of float values for stress model
            metadata: dict with micro-expression events, engagement snapshot, etc.
        """
        features = self.extract(frame)

        # Build engagement snapshot from cached values
        engagement = self._compute_engagement(
            features["eye_contact_ratio"],
            features["head_nod_intensity"],
            features["head_stability"],
            features["mouth_openness"],
        )

        metadata = {
            "engagement": {
                "eye_contact": engagement.eye_contact,
                "head_attentiveness": engagement.head_attentiveness,
                "facial_expressiveness": engagement.facial_expressiveness,
                "overall": engagement.overall,
            },
            "session_eye_contact_ratio": self.eye_contact_ratio,
            "micro_expressions_detected": len(self._micro_expression_log),
            "genuine_micro_count": len(self.genuine_micro_expressions),
            "head_position_samples": len(self._head_positions),
        }

        return features, metadata
