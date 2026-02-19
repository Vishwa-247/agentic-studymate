import argparse
import os
import sys
import time
from pathlib import Path

import cv2
import numpy as np

CLASSES = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]


def preprocess_fer(gray_img_48: np.ndarray) -> np.ndarray:
    """Preprocess 48x48 grayscale image to model input (NCHW, float32)."""
    x = gray_img_48.astype("float32") / 255.0
    # Common FER-2013 normalization; adjust if your model expects raw [0,1]
    x = (x - 0.5) / 0.5
    x = np.expand_dims(x, axis=0)   # (1,48,48)
    x = np.expand_dims(x, axis=0)   # (1,1,48,48)
    return x


def detect_face_haar(bgr_img: np.ndarray, cascade: cv2.CascadeClassifier, min_size: int = 80):
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(min_size, min_size))
    if len(faces) == 0:
        return None
    # pick the largest face
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    face = gray[y:y + h, x:x + w]
    face_resized = cv2.resize(face, (48, 48))
    return face_resized, (x, y, w, h)


class TorchModel:
    def __init__(self, model_path: str, device: str = "cpu"):
        import torch
        self.torch = torch
        self.device = device
        # torch.load supports checkpoints with full module; adjust if state_dict is needed
        self.model = torch.load(model_path, map_location=device)
        self.model.eval()

    def predict(self, x_np: np.ndarray):
        t = self.torch.from_numpy(x_np).to(self.device)
        with self.torch.no_grad():
            logits = self.model(t)
            if isinstance(logits, (list, tuple)):
                logits = logits[0]
            probs = self.torch.softmax(logits, dim=1).cpu().numpy()[0]
        idx = int(np.argmax(probs))
        return idx, probs


def load_torch_model(model_path: str, device: str):
    if not os.path.isfile(model_path):
        print(f"Error: model not found at: {model_path}")
        sys.exit(1)
    return TorchModel(model_path, device)


def predict_on_image(img_bgr: np.ndarray, model: TorchModel, cascade: cv2.CascadeClassifier, use_face: bool = True):
    if use_face and cascade is not None:
        det = detect_face_haar(img_bgr, cascade)
        if det is None:
            # fallback: center crop
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape
            sz = min(h, w)
            cy, cx = h // 2, w // 2
            face = gray[max(0, cy - sz // 2):min(h, cy + sz // 2), max(0, cx - sz // 2):min(w, cx + sz // 2)]
            face = cv2.resize(face, (48, 48))
            box = None
        else:
            face, box = det
    else:
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        face = cv2.resize(gray, (48, 48))
        box = None

    x = preprocess_fer(face)
    idx, probs = model.predict(x)
    return idx, probs, box


def run_image(args, model: TorchModel, cascade: cv2.CascadeClassifier):
    img = cv2.imread(args.image)
    if img is None:
        print(f"Error: could not read image: {args.image}")
        sys.exit(1)
    idx, probs, box = predict_on_image(img, model, cascade, args.use_face)
    label = f"{CLASSES[idx]} ({probs[idx]:.2f})"
    if box is not None:
        x, y, w, h = box
        cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
    cv2.putText(img, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
    cv2.imshow("FER Tester", img)
    print("Prediction:", label)
    print("Probabilities:", {CLASSES[i]: float(probs[i]) for i in range(len(CLASSES))})
    cv2.waitKey(0)


def run_webcam(args, model: TorchModel, cascade: cv2.CascadeClassifier):
    cap = cv2.VideoCapture(args.cam)
    if not cap.isOpened():
        print(f"Error: camera {args.cam} not available")
        sys.exit(1)

    fps_hist = []
    while True:
        t0 = time.time()
        ret, frame = cap.read()
        if not ret:
            break
        idx, probs, box = predict_on_image(frame, model, cascade, args.use_face)
        label = f"{CLASSES[idx]} ({probs[idx]:.2f})"
        if box is not None:
            x, y, w, h = box
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(frame, label, (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        fps = 1.0 / max(1e-6, time.time() - t0)
        fps_hist.append(fps)
        if len(fps_hist) > 30:
            fps_hist.pop(0)
        cv2.putText(frame, f"FPS: {np.mean(fps_hist):.1f}", (10, 58), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.imshow("FER Webcam Test", frame)
        if cv2.waitKey(1) & 0xFF in (27, ord('q')):
            break
    cap.release()
    cv2.destroyAllWindows()


def main():
    parser = argparse.ArgumentParser("FER-2013 Torch Model Tester")
    parser.add_argument(
        "--model",
        default=str(Path("backend/agents/emotion-detection/models/best_vit_fer2013_model.pt").as_posix()),
        help="Path to .pt/.pth torch model"
    )
    parser.add_argument("--device", default="cpu", help="torch device: cpu/cuda")
    parser.add_argument("--use_face", action="store_true", help="Use Haar face crop before classification")
    parser.add_argument("--haar", default=cv2.data.haarcascades + "haarcascade_frontalface_default.xml", help="Path to Haar cascade")
    sub = parser.add_subparsers(dest="mode", required=True)

    p_img = sub.add_parser("image", help="Run on a single image")
    p_img.add_argument("--image", required=True, help="Path to image file")

    p_cam = sub.add_parser("webcam", help="Run with webcam")
    p_cam.add_argument("--cam", type=int, default=0, help="Camera index (default 0)")

    args = parser.parse_args()

    cascade = cv2.CascadeClassifier(args.haar) if args.use_face else None
    model = load_torch_model(args.model, args.device)

    if args.mode == "image":
        run_image(args, model, cascade)
    elif args.mode == "webcam":
        run_webcam(args, model, cascade)


if __name__ == "__main__":
    main()
