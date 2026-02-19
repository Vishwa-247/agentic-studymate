import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Pause, Play, RotateCcw, StepBack, StepForward } from "lucide-react";

type VisualizerControlsProps = {
  isPlaying: boolean;
  canStepBack: boolean;
  canStepForward: boolean;
  onTogglePlay: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onReset: () => void;
  speedMs: number;
  onSpeedMsChange: (ms: number) => void;
};

export function VisualizerControls({
  isPlaying,
  canStepBack,
  canStepForward,
  onTogglePlay,
  onStepBack,
  onStepForward,
  onReset,
  speedMs,
  onSpeedMsChange,
}: VisualizerControlsProps) {
  // Slider gives values array; we keep ms.
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onTogglePlay} className="gap-2">
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button variant="secondary" onClick={onStepBack} disabled={!canStepBack} className="gap-2">
          <StepBack className="h-4 w-4" />
          Back
        </Button>
        <Button variant="secondary" onClick={onStepForward} disabled={!canStepForward} className="gap-2">
          <StepForward className="h-4 w-4" />
          Next
        </Button>
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Speed</Label>
          <span className="text-sm text-muted-foreground">{speedMs}ms</span>
        </div>
        <Slider
          value={[speedMs]}
          min={200}
          max={2000}
          step={100}
          onValueChange={(v) => onSpeedMsChange(v[0] ?? 900)}
        />
      </div>
    </div>
  );
}
