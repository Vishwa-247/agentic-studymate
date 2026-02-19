from __future__ import annotations

import contextlib
import pathlib
import time
from dataclasses import dataclass
from typing import Generator, Iterable, Optional

import cv2
import mediapipe as mp
import numpy as np

# ── Resolve model path ──────────────────────────────────────────────
_MODEL_PATH = pathlib.Path(__file__).parent / "face_landmarker.task"
if not _MODEL_PATH.exists():
    raise FileNotFoundError(
        f"FaceLandmarker model not found at {_MODEL_PATH}. "
        "Download it from https://storage.googleapis.com/mediapipe-models/"
        "face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
    )

# ── MediaPipe Tasks API aliases ─────────────────────────────────────
BaseOptions = mp.tasks.BaseOptions
FaceLandmarker = mp.tasks.vision.FaceLandmarker
FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode


@dataclass
class LandmarkFrame:
    """Holds landmark coordinates for a single frame."""

    timestamp: float
    landmarks: np.ndarray  # shape: (478, 3) – 468 mesh + 10 iris
    image: Optional[np.ndarray] = None


class FaceMeshProcessor:
    """Wraps MediaPipe FaceLandmarker (Tasks API, ≥ 0.10)."""

    def __init__(
        self,
        max_num_faces: int = 1,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        running_mode: VisionRunningMode = VisionRunningMode.IMAGE,
    ) -> None:
        options = FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(_MODEL_PATH)),
            running_mode=running_mode,
            num_faces=max_num_faces,
            min_face_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
        )
        self._landmarker = FaceLandmarker.create_from_options(options)
        self._running_mode = running_mode
        self._frame_ts_ms: int = 0  # monotonic counter for VIDEO mode

    def process(self, image_bgr: np.ndarray) -> Optional[LandmarkFrame]:
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)

        if self._running_mode == VisionRunningMode.VIDEO:
            self._frame_ts_ms += 33  # ~30 fps
            result = self._landmarker.detect_for_video(mp_image, self._frame_ts_ms)
        else:
            result = self._landmarker.detect(mp_image)

        if not result.face_landmarks:
            return None

        face_lms = result.face_landmarks[0]
        coords = np.array(
            [[lm.x, lm.y, lm.z] for lm in face_lms], dtype=np.float32
        )
        return LandmarkFrame(
            timestamp=time.time(), landmarks=coords, image=image_bgr
        )

    def close(self) -> None:
        self._landmarker.close()

    def __enter__(self) -> "FaceMeshProcessor":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()


def iter_landmarks_from_camera(
    camera_index: int = 0,
    width: int = 640,
    height: int = 480,
    fps: int = 30,
) -> Generator[LandmarkFrame, None, None]:
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        raise RuntimeError("Unable to open camera.")
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
    cap.set(cv2.CAP_PROP_FPS, fps)

    with FaceMeshProcessor(running_mode=VisionRunningMode.VIDEO) as processor:
        try:
            while True:
                success, frame = cap.read()
                if not success:
                    break
                landmark_frame = processor.process(frame)
                if landmark_frame is None:
                    continue
                yield landmark_frame
        finally:
            cap.release()


def landmark_stream_from_frames(
    frames: Iterable[np.ndarray],
    timestamp_provider: Optional[Iterable[float]] = None,
) -> Generator[LandmarkFrame, None, None]:
    timestamps = iter(timestamp_provider) if timestamp_provider is not None else None
    with FaceMeshProcessor(running_mode=VisionRunningMode.VIDEO) as processor:
        for frame in frames:
            ts = next(timestamps, time.time()) if timestamps is not None else time.time()
            landmark_frame = processor.process(frame)
            if landmark_frame is None:
                continue
            landmark_frame.timestamp = ts
            yield landmark_frame


@contextlib.contextmanager
def open_face_mesh_processor(**kwargs) -> Generator[FaceMeshProcessor, None, None]:
    processor = FaceMeshProcessor(**kwargs)
    try:
        yield processor
    finally:
        processor.close()
