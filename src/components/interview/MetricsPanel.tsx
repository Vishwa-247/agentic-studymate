import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Eye, MessageSquare, Smile, TrendingUp, AlertTriangle, Hand, PersonStanding, ShieldAlert, Brain, Wifi, Target } from "lucide-react";
import { CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface MetricsPanelProps {
  facialData: {
    confident: number;
    stressed: number;
    nervous: number;
  };
  behaviorData: {
    blink_count: number;
    looking_at_camera: boolean;
    head_pose: { pitch: number; yaw: number; roll: number };
    gaze_zone?: string;
    gaze_label?: string;
    gaze_h?: number;
    gaze_v?: number;
    eye_contact_ratio?: number;
    engagement_score?: number;
  };
  communicationData: {
    filler_word_count: number;
    words_per_minute: number;
    clarity_score: number;
  };
  bodyLanguage?: Record<string, any>;
  stressData?: Record<string, any>;
  deceptionFlags?: string[];
  isVisible: boolean;
}

const MetricBar = ({ label, value, color, icon }: { label: string; value: number; color: string; icon?: React.ReactNode }) => {
  const colorClasses: Record<string, string> = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    cyan: "bg-cyan-500",
  };
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <span className="text-muted-foreground">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${colorClasses[color] || "bg-primary"}`}
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
    </div>
  );
};

const StressIndicator = ({ level, composite }: { level?: string; composite?: number }) => {
  const colorMap: Record<string, string> = {
    Calm: "bg-green-500",
    "Slight Stress": "bg-amber-500",
    "High Stress": "bg-red-500",
  };
  const bgColor = colorMap[level || ""] || "bg-muted";

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5">
        <Brain className="h-3 w-3" /> Stress Level
      </span>
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium text-white ${bgColor}`}>
        {level || "—"} {composite != null ? `(${Math.round(composite * 100)}%)` : ""}
      </span>
    </div>
  );
};

const MetricsPanel = ({ facialData, behaviorData, communicationData, bodyLanguage, stressData, deceptionFlags, isVisible }: MetricsPanelProps) => {
  const hasBody = bodyLanguage && Object.keys(bodyLanguage).length > 0;
  const hasStress = stressData && Object.keys(stressData).length > 0;
  const hasGaze = behaviorData.gaze_zone !== undefined && behaviorData.gaze_zone !== "";

  // Gaze visualization: small SVG eye diagram showing iris position
  const GazeViz = () => {
    const cx = 40 + (behaviorData.gaze_h ?? 0) * 18; // -1..1 → 22..58
    const cy = 25 + (behaviorData.gaze_v ?? 0) * 10; // -1..1 → 15..35
    return (
      <svg viewBox="0 0 80 50" className="w-16 h-10">
        {/* Eye outline */}
        <ellipse cx="40" cy="25" rx="30" ry="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
        {/* Iris */}
        <circle cx={cx} cy={cy} r="8" className="fill-blue-500/70" />
        {/* Pupil */}
        <circle cx={cx} cy={cy} r="3.5" className="fill-gray-900 dark:fill-gray-100" />
      </svg>
    );
  };

  // Track when metrics last changed to show "live updating" pulse
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isLive, setIsLive] = useState(false);
  const prevDataRef = useRef<string>("");

  useEffect(() => {
    const currentData = JSON.stringify({ facialData, stressData, bodyLanguage });
    if (currentData !== prevDataRef.current) {
      prevDataRef.current = currentData;
      setLastUpdate(Date.now());
      setIsLive(true);
      // Pulse for 2s after each update
      const timer = setTimeout(() => setIsLive(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [facialData, stressData, bodyLanguage]);

  return (
    <Card className="w-full max-h-[calc(100vh-6rem)] shadow-lg border-border/50 bg-card/95 backdrop-blur relative overflow-y-auto">
      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Live Metrics
          </span>
          {isVisible && (
            <span className={`flex items-center gap-1 text-[10px] font-normal px-1.5 py-0.5 rounded-full transition-colors duration-300 ${isLive ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
              <Wifi className={`h-3 w-3 ${isLive ? "animate-pulse" : ""}`} />
              {isLive ? "Updating…" : "Waiting"}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4">
        {/* Stress Level */}
        {hasStress && (
          <div>
            <StressIndicator level={stressData?.level} composite={stressData?.composite} />
          </div>
        )}

        {/* Facial Expression */}
        <div>
          <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
            <Smile className="h-3.5 w-3.5" /> Facial Expression
          </div>
          <div className="space-y-2">
            <MetricBar label="Confident" value={facialData.confident / 100} color="green" icon={<TrendingUp className="h-3 w-3 text-green-500" />} />
            <MetricBar label="Stressed" value={facialData.stressed / 100} color="amber" icon={<AlertTriangle className="h-3 w-3 text-amber-500" />} />
            <MetricBar label="Nervous" value={facialData.nervous / 100} color="red" icon={<AlertTriangle className="h-3 w-3 text-red-500" />} />
          </div>
        </div>
        
        {/* Behavior */}
        <div className="border-t border-border/50 pt-3">
          <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Behavior
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px]">Blinks</span>
              <span className="font-medium">{behaviorData.blink_count}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px]">Camera</span>
              <div className="flex items-center gap-1">
                {behaviorData.looking_at_camera ? (
                  <><CheckCircle className="h-3 w-3 text-green-500" /> <span className="text-green-500 text-[10px]">Yes</span></>
                ) : (
                  <><XCircle className="h-3 w-3 text-red-500" /> <span className="text-red-500 text-[10px]">No</span></>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Eye Tracking & Gaze */}
        {hasGaze && (
          <div className="border-t border-border/50 pt-3">
            <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Eye Tracking
            </div>
            <div className="flex items-center gap-3 mb-2">
              <GazeViz />
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Zone</span>
                  <span className="font-medium capitalize">{behaviorData.gaze_zone?.replace("-", " ")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Reading</span>
                  <span className="font-medium text-[10px]">{behaviorData.gaze_label || "—"}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {behaviorData.eye_contact_ratio != null && (
                <MetricBar label="Eye Contact" value={behaviorData.eye_contact_ratio} color="green" icon={<Eye className="h-3 w-3 text-green-500" />} />
              )}
              {behaviorData.engagement_score != null && (
                <MetricBar label="Engagement" value={behaviorData.engagement_score} color="blue" icon={<Brain className="h-3 w-3 text-blue-500" />} />
              )}
            </div>
          </div>
        )}

        {/* Body Language */}
        {hasBody && (
          <div className="border-t border-border/50 pt-3">
            <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
              <PersonStanding className="h-3.5 w-3.5" /> Body Language
            </div>
            <div className="space-y-2">
              {typeof bodyLanguage!.posture_score === "number" && (
                <MetricBar label="Posture" value={bodyLanguage!.posture_score} color="cyan" />
              )}
              {typeof bodyLanguage!.hand_fidget_score === "number" && (
                <MetricBar label="Hand Fidget" value={bodyLanguage!.hand_fidget_score} color="amber" />
              )}
              {typeof bodyLanguage!.shoulder_tension === "number" && (
                <MetricBar label="Shoulder Tension" value={bodyLanguage!.shoulder_tension} color="red" />
              )}
              {typeof bodyLanguage!.body_stillness === "number" && (
                <MetricBar label="Stillness" value={bodyLanguage!.body_stillness} color="green" />
              )}
              {typeof bodyLanguage!.palm_openness === "number" && (
                <MetricBar label="Palm Open" value={bodyLanguage!.palm_openness} color="blue" />
              )}
              {bodyLanguage!.lean_direction_label && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Lean</span>
                  <span className="font-medium capitalize">{bodyLanguage!.lean_direction_label}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Communication */}
        <div className="border-t border-border/50 pt-3">
          <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" /> Communication
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Filler words</span>
              <span className="font-medium">{communicationData.filler_word_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pace</span>
              <span className="font-medium">{communicationData.words_per_minute} WPM</span>
            </div>
            <MetricBar label="Clarity" value={communicationData.clarity_score / 100} color="blue" />
          </div>
        </div>

        {/* Deception Flags */}
        {deceptionFlags && deceptionFlags.length > 0 && (
          <div className="border-t border-border/50 pt-3">
            <div className="text-xs font-medium mb-2 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" /> Stress Signals
            </div>
            <div className="flex flex-wrap gap-1">
              {deceptionFlags.map((flag, i) => (
                <span
                  key={i}
                  className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-amber-500/10 text-amber-600 dark:text-amber-400"
                >
                  {flag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      {!isVisible && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center text-xs text-muted-foreground">
          Start recording to see metrics
        </div>
      )}
    </Card>
  );
};

export default MetricsPanel;
