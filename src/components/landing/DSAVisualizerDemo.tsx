import { useState, useEffect } from "react";

const initialBars = [45, 72, 28, 85, 55, 38, 92, 18];
const sortingSteps = [
  { bars: [45, 72, 28, 85, 55, 38, 92, 18], comparing: [0, 1], step: "Compare 45 and 72" },
  { bars: [45, 72, 28, 85, 55, 38, 92, 18], comparing: [1, 2], step: "Compare 72 and 28" },
  { bars: [45, 28, 72, 85, 55, 38, 92, 18], comparing: [1, 2], step: "Swap! 28 < 72" },
  { bars: [45, 28, 72, 85, 55, 38, 92, 18], comparing: [2, 3], step: "Compare 72 and 85" },
  { bars: [45, 28, 72, 85, 55, 38, 92, 18], comparing: [3, 4], step: "Compare 85 and 55" },
  { bars: [45, 28, 72, 55, 85, 38, 92, 18], comparing: [3, 4], step: "Swap! 55 < 85" },
  { bars: [45, 28, 72, 55, 85, 38, 92, 18], comparing: [4, 5], step: "Compare 85 and 38" },
  { bars: [45, 28, 72, 55, 38, 85, 92, 18], comparing: [4, 5], step: "Swap! 38 < 85" },
  { bars: [45, 28, 72, 55, 38, 85, 92, 18], comparing: [5, 6], step: "Compare 85 and 92" },
  { bars: [45, 28, 72, 55, 38, 85, 92, 18], comparing: [6, 7], step: "Compare 92 and 18" },
  { bars: [45, 28, 72, 55, 38, 85, 18, 92], comparing: [6, 7], step: "Swap! 18 < 92" },
];

export default function DSAVisualizerDemo() {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = sortingSteps[stepIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex(i => (i + 1) % sortingSteps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs text-slate-400 font-mono">Bubble Sort Visualizer</span>
        <span className="text-xs text-primary font-mono">Step {stepIndex + 1}/{sortingSteps.length}</span>
      </div>

      {/* Visualization */}
      <div className="p-6">
        <div className="flex items-end justify-center gap-2 h-48 mb-6">
          {currentStep.bars.map((height, i) => (
            <div
              key={i}
              className={`w-8 rounded-t-sm transition-all duration-500 ${
                currentStep.comparing.includes(i) 
                  ? "bg-primary shadow-glow" 
                  : "bg-primary/30"
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        
        {/* Step Description */}
        <div className="text-center">
          <div className="inline-block px-4 py-2 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-sm font-mono text-slate-300">{currentStep.step}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
