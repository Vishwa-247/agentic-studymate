import React from "react";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProgressStep {
  label: string;
  status: "pending" | "active" | "done";
}

interface AnalysisProgressProps {
  steps: ProgressStep[];
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ steps }) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
                  step.status === "done" && "bg-green-500 text-white",
                  step.status === "active" && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  step.status === "pending" && "bg-muted text-muted-foreground"
                )}
              >
                {step.status === "done" && <CheckCircle2 className="w-4 h-4" />}
                {step.status === "active" && <Loader2 className="w-4 h-4 animate-spin" />}
                {step.status === "pending" && <Circle className="w-3 h-3" />}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium text-center leading-tight max-w-[80px]",
                  step.status === "done" && "text-green-600",
                  step.status === "active" && "text-primary font-semibold",
                  step.status === "pending" && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 rounded-full mt-[-18px] min-w-[20px]",
                  step.status === "done" ? "bg-green-500" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
