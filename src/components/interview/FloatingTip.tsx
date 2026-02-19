import { useState, useEffect, useRef } from "react";
import { Lightbulb, X } from "lucide-react";

interface FloatingTipProps {
  stressLevel?: string;
  lookingAtCamera?: boolean;
  eyeContactRatio?: number;
  gazeLabel?: string;
}

const TIPS_POOL = {
  high_stress: [
    "Take a slow, deep breath before your next sentence.",
    "Pause briefly — silence shows confidence, not weakness.",
    "Slow down your speech pace to sound more composed.",
    "Relax your shoulders and unclench your jaw.",
  ],
  no_eye_contact: [
    "Look directly at the camera lens to simulate eye contact.",
    "Imagine a friendly face behind the camera.",
    "Brief glances away are fine, but return to the camera.",
  ],
  low_engagement: [
    "Try nodding slightly to show active engagement.",
    "Use hand gestures to emphasize key points.",
    "Smile naturally — it conveys warmth and confidence.",
  ],
  gaze_recall: [
    "Looking up-left suggests visual recall — great for examples!",
    "You're accessing memories — try to articulate them clearly.",
  ],
  gaze_construction: [
    "Looking up-right may suggest constructing thoughts — be specific.",
    "Stay grounded in real examples from your experience.",
  ],
  gaze_internal: [
    "Internal dialogue detected — take your time formulating.",
    "You seem to be thinking deeply — structure your answer out loud.",
  ],
  gaze_emotional: [
    "You may be accessing feelings — channel that into authentic answers.",
    "Emotional engagement is good — let it support your narrative.",
  ],
  default: [
    "Structure answers with the STAR method (Situation, Task, Action, Result).",
    "Use concrete numbers and metrics to strengthen your points.",
    "Keep answers under 2 minutes for maximum impact.",
    "Start with your conclusion, then explain how you got there.",
  ],
};

function pickTip(tips: string[]): string {
  return tips[Math.floor(Math.random() * tips.length)];
}

function selectTip(props: FloatingTipProps): string {
  const { stressLevel, lookingAtCamera, eyeContactRatio, gazeLabel } = props;

  if (stressLevel === "High Stress") {
    return pickTip(TIPS_POOL.high_stress);
  }
  if (lookingAtCamera === false || (eyeContactRatio != null && eyeContactRatio < 0.4)) {
    return pickTip(TIPS_POOL.no_eye_contact);
  }
  if (eyeContactRatio != null && eyeContactRatio < 0.55) {
    return pickTip(TIPS_POOL.low_engagement);
  }
  if (gazeLabel) {
    const label = gazeLabel.toLowerCase();
    if (label.includes("recall")) return pickTip(TIPS_POOL.gaze_recall);
    if (label.includes("construction")) return pickTip(TIPS_POOL.gaze_construction);
    if (label.includes("internal") || label.includes("dialogue")) return pickTip(TIPS_POOL.gaze_internal);
    if (label.includes("kinesthetic") || label.includes("emotional")) return pickTip(TIPS_POOL.gaze_emotional);
  }
  return pickTip(TIPS_POOL.default);
}

const FloatingTip = (props: FloatingTipProps) => {
  const [tip, setTip] = useState<string>("");
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Show a new tip every 15 seconds
    const showTip = () => {
      if (dismissed) return;
      setTip(selectTip(props));
      setVisible(true);
      // Auto-hide after 8 seconds
      setTimeout(() => setVisible(false), 8000);
    };

    // Initial tip after 5 seconds
    const initialTimer = setTimeout(showTip, 5000);
    timerRef.current = setInterval(showTip, 15000);

    return () => {
      clearTimeout(initialTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [props.stressLevel, props.lookingAtCamera, props.eyeContactRatio, props.gazeLabel, dismissed]);

  if (!visible || dismissed) return null;

  return (
    <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-start gap-3">
      <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <p className="text-sm text-foreground flex-1">{tip}</p>
      <button
        onClick={() => {
          setVisible(false);
          setDismissed(true);
        }}
        className="text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default FloatingTip;
