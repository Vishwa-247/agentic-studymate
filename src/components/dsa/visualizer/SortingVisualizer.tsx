import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AlgorithmStep } from "./types";
import { bubbleSortSteps } from "./engine/bubbleSortSteps";
import { BarsCanvas } from "./ui/BarsCanvas";
import { ArrayInput } from "./ui/ArrayInput";
import { PredictPanel } from "./ui/PredictPanel";
import { VisualizerControls } from "./ui/VisualizerControls";

const DEFAULT_INPUT = "45, 72, 28, 85, 55, 38, 92, 18";

function randomArray(len = 10) {
  const n = Math.max(5, Math.min(16, len));
  return Array.from({ length: n }, () => Math.floor(10 + Math.random() * 90));
}

export default function SortingVisualizer() {
  const [rawInput, setRawInput] = useState(DEFAULT_INPUT);
  const [sourceArray, setSourceArray] = useState<number[]>([45, 72, 28, 85, 55, 38, 92, 18]);

  const steps = useMemo<AlgorithmStep[]>(() => bubbleSortSteps(sourceArray), [sourceArray]);
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[Math.min(stepIndex, Math.max(0, steps.length - 1))];

  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(900);

  // Pause & Predict state
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);
  const awaitingCheckpoint = !!step?.checkpoint && !revealed;

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isPlaying) return;

    // Auto-pause at checkpoints
    if (awaitingCheckpoint) {
      setIsPlaying(false);
      return;
    }

    if (stepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    timerRef.current = window.setTimeout(() => {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1));
    }, speedMs);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, speedMs, stepIndex, steps.length, awaitingCheckpoint]);

  // Reset prediction state when step changes
  useEffect(() => {
    setPrediction(null);
    setRevealed(false);
  }, [step?.id]);

  const canStepBack = stepIndex > 0;
  const canStepForward = stepIndex < steps.length - 1;

  const reset = () => {
    setIsPlaying(false);
    setStepIndex(0);
    setPrediction(null);
    setRevealed(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sorting Visualizer — Bubble Sort</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <BarsCanvas
            values={step?.array ?? sourceArray}
            comparing={step?.comparing}
            swapping={step?.swapping}
            fixedFrom={step?.fixedFrom}
          />

          <Separator />

          <VisualizerControls
            isPlaying={isPlaying}
            canStepBack={canStepBack}
            canStepForward={canStepForward}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onStepBack={() => {
              setIsPlaying(false);
              setStepIndex((i) => Math.max(0, i - 1));
            }}
            onStepForward={() => {
              setIsPlaying(false);
              setStepIndex((i) => Math.min(steps.length - 1, i + 1));
            }}
            onReset={reset}
            speedMs={speedMs}
            onSpeedMsChange={setSpeedMs}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Step</span>
              <span className="text-sm text-muted-foreground">
                {Math.min(stepIndex + 1, steps.length)}/{steps.length}
              </span>
            </div>
            <Slider
              value={[stepIndex]}
              min={0}
              max={Math.max(0, steps.length - 1)}
              step={1}
              onValueChange={(v) => {
                setIsPlaying(false);
                setStepIndex(v[0] ?? 0);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editable input</CardTitle>
          </CardHeader>
          <CardContent>
            <ArrayInput
              value={rawInput}
              onChange={setRawInput}
              onRun={(parsed) => {
                setSourceArray(parsed);
                reset();
              }}
              onRandomize={() => {
                const arr = randomArray();
                setRawInput(arr.join(", "));
                setSourceArray(arr);
                reset();
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Narration & invariant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium">What’s happening</div>
              <p className="text-sm text-muted-foreground">{step?.narration ?? "—"}</p>
            </div>
            <div>
              <div className="text-sm font-medium">Invariant</div>
              <p className="text-sm text-muted-foreground">{step?.invariant ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        {step?.checkpoint ? (
          <PredictPanel
            question={step.checkpoint.question}
            expected={step.checkpoint.expected}
            value={prediction}
            revealed={revealed}
            onChange={(v) => {
              setPrediction(v);
            }}
            onReveal={() => setRevealed(true)}
            onContinue={() => {
              setRevealed(false);
              setPrediction(null);
              setStepIndex((i) => Math.min(i + 1, steps.length - 1));
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
