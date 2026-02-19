import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useEffect, useMemo, useRef, useState } from "react";
import { dsaTopics } from "@/data/dsaProblems";
import { Badge } from "@/components/ui/badge";
import { VisualizerControls } from "@/components/dsa/visualizer/ui/VisualizerControls";
import { PredictPanel } from "@/components/dsa/visualizer/ui/PredictPanel";
import { StringCanvas } from "@/components/dsa/visualizer/string/ui/StringCanvas";
import { StringInput } from "@/components/dsa/visualizer/string/ui/StringInput";
import type { StringStep } from "@/components/dsa/visualizer/string/types";
import { reverseStringSteps } from "@/components/dsa/visualizer/string/engine/reverseStringSteps";
import { validPalindromeSteps } from "@/components/dsa/visualizer/string/engine/validPalindromeSteps";
import { longestUniqueSubstringSteps } from "@/components/dsa/visualizer/string/engine/longestUniqueSubstringSteps";

type DemoKey = "reverse" | "palindrome" | "longest-unique";

const DEMOS: Array<{ key: DemoKey; label: string; problemName: string }>= [
  { key: "reverse", label: "Reverse String", problemName: "Reverse String" },
  { key: "palindrome", label: "Valid Palindrome", problemName: "Valid Palindrome" },
  {
    key: "longest-unique",
    label: "Longest Unique Substring",
    problemName: "Longest Substring Without Repeating Characters",
  },
];

const DEFAULTS: Record<DemoKey, string> = {
  reverse: "starmate",
  palindrome: "A man, a plan, a canal: Panama",
  "longest-unique": "abcabcbb",
};

function buildSteps(demo: DemoKey, input: string): StringStep[] {
  switch (demo) {
    case "reverse":
      return reverseStringSteps(input);
    case "palindrome":
      return validPalindromeSteps(input);
    case "longest-unique":
      return longestUniqueSubstringSteps(input);
  }
}

export default function StringBasicsVisualizer({ topicId }: { topicId: string }) {
  const topic = useMemo(() => dsaTopics.find((t) => t.id === topicId), [topicId]);
  const allProblems = topic?.problems ?? [];

  const [demo, setDemo] = useState<DemoKey>("reverse");
  const [rawInput, setRawInput] = useState(DEFAULTS.reverse);
  const [input, setInput] = useState(DEFAULTS.reverse);

  const steps = useMemo(() => buildSteps(demo, input), [demo, input]);
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[Math.min(stepIndex, Math.max(0, steps.length - 1))];

  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(900);

  // Pause & Predict state
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);
  const awaitingCheckpoint = !!step?.checkpoint && !revealed;

  const timerRef = useRef<number | null>(null);

  const reset = () => {
    setIsPlaying(false);
    setStepIndex(0);
    setPrediction(null);
    setRevealed(false);
  };

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isPlaying) return;
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

  useEffect(() => {
    setPrediction(null);
    setRevealed(false);
  }, [step?.id]);

  useEffect(() => {
    // When switching demo, sync input defaults.
    setRawInput(DEFAULTS[demo]);
    setInput(DEFAULTS[demo]);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  const canStepBack = stepIndex > 0;
  const canStepForward = stepIndex < steps.length - 1;

  const implementedNames = useMemo(() => new Set(DEMOS.map((d) => d.problemName)), []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">String Basics Visualizer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Demo</div>
              <div className="text-sm text-muted-foreground">Concept-check pauses included.</div>
            </div>

            <Select value={demo} onValueChange={(v) => setDemo(v as DemoKey)}>
              <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue placeholder="Choose a demo" />
              </SelectTrigger>
              <SelectContent>
                {DEMOS.map((d) => (
                  <SelectItem key={d.key} value={d.key}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <StringCanvas
            chars={step?.chars ?? [...input]}
            left={step?.left}
            right={step?.right}
            windowStart={step?.windowStart}
            windowEnd={step?.windowEnd}
            activeIndices={step?.activeIndices}
            swapping={step?.swapping}
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
            <StringInput
              value={rawInput}
              onChange={setRawInput}
              onRun={(v) => {
                setInput(v);
                reset();
              }}
              maxLen={60}
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
            onChange={(v) => setPrediction(v)}
            onReveal={() => setRevealed(true)}
            onContinue={() => {
              setRevealed(false);
              setPrediction(null);
              setStepIndex((i) => Math.min(i + 1, steps.length - 1));
            }}
          />
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All String Basics problems</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {topic ? `${allProblems.length} problems` : "Topic not found."}
            </div>
            <div className="grid gap-2">
              {allProblems.map((p) => {
                const status = implementedNames.has(p.name) ? "Visualized" : "Coming soon";
                return (
                  <div key={p.name} className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.url}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.difficulty ? (
                        <Badge variant="outline" className="shrink-0">{p.difficulty}</Badge>
                      ) : null}
                      <Badge variant={status === "Visualized" ? "secondary" : "outline"} className="shrink-0">
                        {status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
