import { useState, useEffect } from "react";
import { Search, BookOpen, Layout, Sparkles, Target, ArrowRight } from "lucide-react";

const agents = [
  { id: 1, name: "Idea Analyst", icon: Search, color: "bg-blue-500", status: "Analyzing your idea...", output: "Who is the user? What problem does this solve?" },
  { id: 2, name: "Researcher", icon: BookOpen, color: "bg-emerald-500", status: "Researching market...", output: "Found 3 similar products. Here's what works..." },
  { id: 3, name: "System Design", icon: Layout, color: "bg-purple-500", status: "Designing architecture...", output: "Recommending microservices with Redis cache" },
  { id: 4, name: "UI/UX Agent", icon: Sparkles, color: "bg-pink-500", status: "Planning screens...", output: "5 core screens: Dashboard, Editor, Settings..." },
  { id: 5, name: "Planner", icon: Target, color: "bg-amber-500", status: "Creating milestones...", output: "Week 1: Auth + DB. Week 2: Core API..." },
];

export default function ProjectStudioDemo() {
  const [activeAgent, setActiveAgent] = useState(0);
  const [showOutput, setShowOutput] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowOutput(false);
      setTimeout(() => {
        setActiveAgent(a => (a + 1) % agents.length);
        setTimeout(() => setShowOutput(true), 500);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setShowOutput(true), 800);
    return () => clearTimeout(timeout);
  }, []);

  const current = agents[activeAgent];

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs text-muted-foreground font-mono">Project Studio — Multi-Agent Swarm</span>
      </div>

      {/* Agent Pipeline */}
      <div className="p-6">
        <div className="flex items-center justify-between gap-2 mb-8">
          {agents.map((agent, i) => (
            <div key={agent.id} className="flex items-center">
              <div 
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  i === activeAgent 
                    ? `${agent.color} text-white scale-110 shadow-lg` 
                    : i < activeAgent 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <agent.icon className="w-5 h-5" />
              </div>
              {i < agents.length - 1 && (
                <ArrowRight className={`w-4 h-4 mx-1 ${i < activeAgent ? "text-primary" : "text-muted-foreground/30"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Active Agent Output */}
        <div className="bg-muted/30 rounded-lg p-4 border border-border min-h-[120px]">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 rounded-lg ${current.color} flex items-center justify-center`}>
              <current.icon className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">{current.name}</span>
            <span className="text-xs text-muted-foreground animate-pulse">● Active</span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">{current.status}</p>
          
          {showOutput && (
            <div className="p-3 bg-background rounded-md border border-primary/20 animate-fade-up">
              <p className="text-sm font-mono text-primary">→ {current.output}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
