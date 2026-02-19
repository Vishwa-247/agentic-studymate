
import { useState, useEffect, useRef } from "react";
import { Terminal, Circle, CheckCircle2, AlertCircle } from "lucide-react";

interface LogEntry {
  id: number;
  timestamp: string;
  level: "INFO" | "WARN" | "SUCCESS" | "bg-blue-500" | "SYSTEM";
  source: string;
  message: string;
}

const steps = [
  { level: "INFO", source: "USER_SESSION", message: "Initializing career path: Backend Engineer" },
  { level: "SYSTEM", source: "ORCHESTRATOR", message: "Analyzing user profile data..." },
  { level: "WARN", source: "ANALYSIS", message: "Gap detected: Distributed Caching" },
  { level: "SUCCESS", source: "MODULE_MGR", message: "Selected module: 'Redis Architecture'" },
  { level: "INFO", source: "AI_TUTOR", message: "Generating scenario-based question..." },
  { level: "INFO", source: "USER_INPUT", message: "Response received. Evaluating..." },
  { level: "SUCCESS", source: "EVALUATOR", message: "Feedback: +15 Accuracy. Adapting path." },
  { level: "SYSTEM", source: "ROUTER", message: "Next step: CAP Theorem Re-evaluation" },
];

export default function SystemFlowDemo() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= steps.length) {
          // Reset after a pause
          if (prev > steps.length + 2) {
             setLogs([]);
             return 0;
          }
          return prev + 1;
        }

        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        const newLog = {
          id: Date.now(),
          timestamp: timeString,
          level: steps[prev].level as any,
          source: steps[prev].source,
          message: steps[prev].message
        };

        setLogs(current => [...current, newLog]);
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "INFO": return "text-blue-400";
      case "WARN": return "text-yellow-400";
      case "SUCCESS": return "text-emerald-400";
      case "SYSTEM": return "text-purple-400";
      default: return "text-slate-400";
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto rounded-xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl font-mono text-sm leading-relaxed relative">
        {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="ml-3 text-xs text-slate-500 font-medium">system_orchestrator.log</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/50 border border-slate-700/50">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={scrollRef}
        className="h-[300px] p-4 overflow-y-auto scrollbar-hide space-y-2 font-mono text-xs md:text-sm"
      >
        {logs.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-600 italic">
                Waiting for system events...
            </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="animate-fade-up">
            <span className="text-slate-500 select-none mr-2">[{log.timestamp}]</span>
            <span className={`${getLevelColor(log.level)} font-bold mr-2 w-16 inline-block`}>{log.level}</span>
            <span className="text-slate-400 mr-2">[{log.source}]</span>
            <span className="text-slate-300">{log.message}</span>
          </div>
        ))}
        <div className="h-4" /> {/* Spacer */}
      </div>

      {/* Overlay Gradient at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none" />
    </div>
  );
}
