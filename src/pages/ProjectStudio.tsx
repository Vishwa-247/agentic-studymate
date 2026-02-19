import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Search, Layout, Target, ShieldAlert,
  Loader2, CheckCircle2, Clock, Globe,
  ChevronRight, Copy, Check, Brain, Eye,
  AlertTriangle, ExternalLink, Timer, ArrowRight,
  FileText, Upload, X, Paperclip, Play, Download
} from "lucide-react";
import { API_GATEWAY_URL } from "@/configs/environment";
import { useAuth } from "@/hooks/useAuth";
import { gatewayAuthService } from "@/api/services/gatewayAuthService";

// ─── Types ───────────────────────────────────────────────────────
interface AgentResult {
  agent: string;
  status: "pending" | "running" | "completed" | "error";
  output?: string;
  elapsed_ms?: number;
  error?: string;
}

interface UploadedDoc {
  filename: string;
  content: string;
}

// ─── Agent Configs (Theme: Cream/Charcoal/Coral) ────────────────
const AGENTS = [
  {
    key: "Idea Analyst",
    icon: Brain,
    label: "Idea Analyst",
    tagline: "Validates idea & core problem",
    phase: 1,
  },
  {
    key: "Web Researcher",
    icon: Globe,
    label: "Web Researcher",
    tagline: "Live web search for trends",
    phase: 2,
  },
  {
    key: "Market Researcher",
    icon: Search,
    label: "Market Researcher",
    tagline: "Competitors & monetization",
    phase: 2,
  },
  {
    key: "System Architect",
    icon: Layout,
    label: "System Architect",
    tagline: "Tech stack & architecture",
    phase: 2,
  },
  {
    key: "UX Advisor",
    icon: Eye,
    label: "UX Advisor",
    tagline: "User flows & accessibility",
    phase: 2,
  },
  {
    key: "Project Planner",
    icon: Target,
    label: "Project Planner",
    tagline: "Milestones & sprint tasks",
    phase: 3,
  },
  {
    key: "Critic",
    icon: ShieldAlert,
    label: "Critic",
    tagline: "Final review & edge cases",
    phase: 4,
  },
];

// ─── Markdown Renderer ──────────────────────────────────────────
function RenderOutput({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90 font-light">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        // Headers
        if ((/^[A-Z][A-Za-z\s]+:/.test(trimmed) || line.startsWith("###")) && !trimmed.startsWith("-")) {
           const label = trimmed.replace(/^###\s*/, "").replace(/:$/, "").trim();
           return (
             <h3 key={i} className="text-base font-semibold mt-6 mb-2 text-foreground flex items-center gap-2">
               {label}
             </h3>
           );
        }
        // Bullet points
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || /^\d+\.\s/.test(trimmed)) {
          const content = trimmed.replace(/^[-•]\s*/, "").replace(/^\d+\.\s*/, "");
          const parts = content.split(/\*\*(.*?)\*\*/g);
          return (
            <div key={i} className="flex gap-3 pl-1 relative group">
              <div className="w-1.5 h-1.5 rounded-full bg-accent/40 mt-2 flex-shrink-0 group-hover:bg-accent transition-colors" />
              <span className="text-muted-foreground">
                {parts.map((part, j) =>
                  j % 2 === 1 ? (
                    <strong key={j} className="text-foreground font-medium">{part}</strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </span>
            </div>
          );
        }
        // Separators
        if (trimmed === "---") return <Separator key={i} className="my-6 bg-border/60" />;
        // Empty lines
        if (!trimmed) return <div key={i} className="h-2" />;
        // Paragraphs
        const parts = trimmed.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-muted-foreground">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="text-foreground font-medium">{part}</strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

// ─── File Utilities ─────────────────────────────────────────────
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// ─── Main Component ─────────────────────────────────────────────
const ProjectStudio = () => {
  const { session } = useAuth();
  
  // State
  const [idea, setIdea] = useState("");
  const [context, setContext] = useState("");
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  
  // Pipeline State
  const [pipelineStatus, setPipelineStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [agents, setAgents] = useState<Record<string, AgentResult>>({});
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  
  // UI State
  const [elapsed, setElapsed] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);

  // Auto-select agent logic
  useEffect(() => {
    if (pipelineStatus === "running" && !selectedAgent) {
       const runningAgent = AGENTS.find(a => agents[a.key]?.status === "running");
       if (runningAgent) setSelectedAgent(runningAgent.key);
    }
  }, [agents, pipelineStatus, selectedAgent]);

  // Timer
  useEffect(() => {
    if (pipelineStatus !== "running") return;
    startTimeRef.current = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [pipelineStatus]);

  // ─── Handlers ─────────────────────────────────────────────────
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const ALLOWED = [".txt", ".md", ".csv", ".json", ".py", ".js", ".ts", ".html", ".css", ".xml", ".yaml", ".yml"];
    for (const file of Array.from(files)) {
      if (file.size > 500_000) continue; 
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED.includes(ext)) continue;
      try {
        const content = await readFileAsText(file);
        setDocuments(p => [...p, { filename: file.name, content: content.slice(0, 50_000) }]);
      } catch {}
    }
  }, []);

  const startAnalysis = async () => {
    if (!idea.trim()) return;
    setPipelineStatus("running");
    setSelectedAgent(null);
    setElapsed(0);
    
    const initial: Record<string, AgentResult> = {};
    AGENTS.forEach(a => { initial[a.key] = { agent: a.key, status: "pending" }; });
    setAgents(initial);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = await gatewayAuthService.ensureGatewayAuth(session?.user?.email || null);
      const resp = await fetch(`${API_GATEWAY_URL}/api/project-studio/analyze/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          user_id: session?.user?.id || "anon", 
          description: idea, 
          context, 
          documents 
        }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error("API Error");

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
             if (event.type === "agent_running") {
               setAgents(prev => ({ ...prev, [event.agent]: { agent: event.agent, status: "running" } }));
             } else if (event.type === "agent_done") {
               setAgents(prev => ({ ...prev, [event.agent]: { ...event, agent: event.agent } }));
               if (!selectedAgent) setSelectedAgent(event.agent); 
             } else if (event.type === "complete") {
               setPipelineStatus(event.status === "completed" ? "completed" : "error");
             }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") setPipelineStatus("error");
    }
  };

  const selectedMeta = AGENTS.find(a => a.key === selectedAgent);
  
  // ─── VIEW: IDLE (Input) ───────────────────────────────────────
  if (pipelineStatus === "idle") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans text-foreground">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-[1fr_320px] gap-12">
          
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">New Project</h1>
              <p className="text-muted-foreground text-lg">Describe an idea. Our AI team will create a comprehensive plan.</p>
            </div>

            <Card className="border-0 shadow-xl bg-card rounded-2xl overflow-hidden">
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-sm font-semibold uppercase tracking-wide text-foreground/80">Project Idea</label>
                  <Textarea
                    placeholder="Describe your vision..."
                    className="min-h-[140px] bg-secondary/30 text-base resize-none border-border focus:ring-primary/10 rounded-xl"
                    value={idea}
                    onChange={e => setIdea(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                   <label className="text-sm font-semibold uppercase tracking-wide text-foreground/80 flex justify-between">
                     <span>Additional Context</span>
                     <span className="text-xs text-muted-foreground font-normal normal-case">Optional</span>
                   </label>
                   <Textarea
                    placeholder="Target audience, tech stack preference, budget..."
                    className="min-h-[80px] bg-secondary/30 text-sm resize-none border-border rounded-xl"
                    value={context}
                    onChange={e => setContext(e.target.value)}
                  />
                </div>

                {/* Upload Zone */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group ${
                    dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-secondary/20 hover:bg-secondary/40"
                  }`}
                >
                  <input ref={fileInputRef} type="file" multiple className="hidden" />
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-foreground/70" />
                  </div>
                  <p className="text-sm text-foreground font-medium">Click to upload documents</p>
                  <p className="text-xs text-muted-foreground mt-1">Accepts requirements, notes, or data (PDF, TXT, MD)</p>
                  
                  {documents.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                      {documents.map((d, i) => (
                        <Badge key={i} variant="secondary" className="font-normal gap-2 py-1 px-3 bg-white border border-border/50 text-foreground">
                           <FileText className="w-3 h-3 text-muted-foreground" />
                           <span className="max-w-[120px] truncate">{d.filename}</span>
                           <X className="w-3 h-3 hover:text-destructive cursor-pointer" onClick={(e) => { e.stopPropagation(); setDocuments(p => p.filter((_, idx) => idx !== i)); }} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  onClick={startAnalysis} 
                  disabled={!idea.trim()} 
                  className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all rounded-xl"
                >
                  Start Generation <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Team Preview */}
          <div className="hidden md:flex flex-col pt-16">
             <div className="bg-card rounded-2xl p-6 shadow-sm border border-border/60 sticky top-10">
                <h3 className="font-semibold mb-6 text-sm uppercase tracking-wider text-muted-foreground border-b border-border pb-2">The AI Team</h3>
                <div className="space-y-5">
                  {AGENTS.map((agent) => (
                    <div key={agent.key} className="flex items-start gap-3 group">
                       <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                         <agent.icon className="w-4 h-4" />
                       </div>
                       <div>
                         <p className="text-sm font-medium leading-none mb-1 text-foreground">{agent.label}</p>
                         <p className="text-xs text-muted-foreground leading-tight">{agent.tagline}</p>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

        </div>
      </div>
    );
  }

  // ─── VIEW: ACTIVE / RESULTS ───────────────────────────────────
  const completedCount = Object.values(agents).filter(a => a.status === "completed").length;
  const progressPercent = Math.round((completedCount / AGENTS.length) * 100);

  return (
    <div className="h-[calc(100vh-4rem)] bg-background flex overflow-hidden font-sans text-foreground">
      
      {/* SIDEBAR - PROGRESS */}
      <div className="w-[340px] flex-shrink-0 bg-secondary/30 border-r border-border flex flex-col">
        {/* Project Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs font-medium uppercase tracking-wider">
            <span>Current Project</span>
          </div>
          <h2 className="text-xl font-bold text-foreground leading-tight line-clamp-2 mb-6">{idea}</h2>
          
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
             <span>Progress</span>
             <span className="text-foreground">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-border" />
        </div>

        {/* Agent/Step List */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4">
          <div className="space-y-6 pb-6">
            {[1, 2, 3, 4].map(phase => {
               const phaseAgents = AGENTS.filter(a => a.phase === phase);
               const phaseLabels: Record<number,string> = { 1: "Discovery", 2: "Strategy", 3: "Planning", 4: "Review" };
               
               return (
                 <div key={phase}>
                    <div className="px-2 mb-2">
                       <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{phaseLabels[phase]}</span>
                    </div>
                    <div className="space-y-1">
                      {phaseAgents.map(agent => {
                        const status = agents[agent.key]?.status || "pending";
                        const isActive = selectedAgent === agent.key;
                        const SidebarIcon = agent.icon;
                        
                        return (
                          <button
                            key={agent.key}
                            onClick={() => setSelectedAgent(agent.key)}
                            className={`w-full text-left group flex items-center gap-3 p-3 rounded-xl transition-all ${
                              isActive ? "bg-white shadow-md shadow-black/5 ring-1 ring-border/50" : "hover:bg-white/60"
                            }`}
                          >
                            {/* Status + Icon */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                status === "completed" ? "bg-primary/10 text-primary" :
                                status === "running" ? "bg-primary text-primary-foreground" :
                                "bg-muted text-muted-foreground/50"
                            }`}>
                               {status === "running" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                <SidebarIcon className="w-4 h-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-medium ${
                                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                }`}>
                                  {agent.label}
                                </p>
                                {status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                              </div>
                              {isActive && <p className="text-[10px] text-muted-foreground truncate">{agent.tagline}</p>}
                            </div>
                            
                            {/* Time */}
                            {agents[agent.key]?.elapsed_ms && (
                                <span className="text-[10px] text-muted-foreground/60 font-medium">
                                  {(agents[agent.key]!.elapsed_ms! / 1000).toFixed(0)}s
                                </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                 </div>
               );
            })}
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t border-border mt-auto bg-background/50 backdrop-blur-sm">
           <Button 
             variant="outline" 
             className="w-full text-xs h-10 border-border hover:bg-white hover:shadow-sm transition-all" 
             onClick={() => { setPipelineStatus("idle"); setAgents({}); setDocuments([]); setIdea(""); }}
           >
             <ArrowRight className="w-3.5 h-3.5 mr-2 rotate-180" /> Start New Project
           </Button>
        </div>
      </div>

      {/* MAIN OUTPUT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-secondary/10 relative">
         {/* Top Navigation Bar */}
         <div className="h-16 border-b border-border flex items-center px-8 text-sm bg-background/80 backdrop-blur-md sticky top-0 z-20 justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
               <span className="hover:text-foreground cursor-pointer">Projects</span>
               <ChevronRight className="w-4 h-4 opacity-30" />
               <span className="font-medium text-foreground truncate max-w-[200px]">{idea}</span>
               <ChevronRight className="w-4 h-4 opacity-30" />
               <span className="text-foreground">{selectedMeta?.label || "Overview"}</span>
            </div>
            
            <div className="flex items-center gap-3">
               {pipelineStatus === "running" && (
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-muted-foreground">
                    <Timer className="w-3.5 h-3.5" />
                    <span>{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}</span>
                 </div>
               )}
               <Button size="icon" variant="ghost" className="rounded-full w-9 h-9">
                  <Download className="w-4 h-4 text-muted-foreground" />
               </Button>
            </div>
         </div>

         {/* Content Scroll View */}
         <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-10 flex flex-col items-center">
            {selectedAgent && selectedMeta ? (() => {
               const AgentIcon = selectedMeta.icon;
               return (
               <Card className="w-full max-w-5xl h-full shadow-sm border border-border bg-white rounded-2xl flex flex-col overflow-hidden transition-all duration-500 animate-in fade-in zoom-in-95">
                 {/* Agent Header */}
                 <div className="p-8 border-b border-border/40 flex items-start justify-between bg-gradient-to-r from-secondary/20 to-transparent">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-lg shadow-foreground/10">
                          <AgentIcon className="w-7 h-7" />
                       </div>
                       <div>
                          <h2 className="text-2xl font-bold text-foreground mb-1">{selectedMeta?.label}</h2>
                          <p className="text-sm text-muted-foreground">{selectedMeta?.tagline}</p>
                       </div>
                    </div>
                    {agents[selectedAgent].status === "completed" && (
                       <Badge variant="outline" className="bg-green-50/50 text-green-700 border-green-200 px-3 py-1 gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Complete
                       </Badge>
                    )}
                 </div>

                 {/* Agent Output Body */}
                 <ScrollArea className="flex-1 p-8 md:p-10">
                    <div className="max-w-4xl mx-auto">
                      {agents[selectedAgent].status === "running" ? (
                         <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="relative">
                               <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping opacity-75"></div>
                               <div className="relative w-16 h-16 bg-white rounded-full border-4 border-border flex items-center justify-center shadow-sm">
                                  <Loader2 className="w-8 h-8 animate-spin text-foreground" />
                               </div>
                            </div>
                            <div>
                               <h3 className="text-lg font-medium text-foreground">Generating Analysis...</h3>
                               <p className="text-sm text-muted-foreground mt-1">This usually takes about 10-20 seconds.</p>
                            </div>
                         </div>
                      ) : agents[selectedAgent].status === "pending" ? (
                          <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center icon-dashed-border">
                               <Clock className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground font-medium">Waiting for previous steps to complete...</p>
                         </div>
                      ) : (
                         <div className="font-sans leading-relaxed">
                            <RenderOutput text={agents[selectedAgent].output || ""} />
                         </div>
                      )}
                    </div>
                 </ScrollArea>
                 
                 {/* Output Actions Footer */}
                 {agents[selectedAgent].output && (
                    <div className="p-4 border-t border-border flex justify-end bg-secondary/5">
                       <Button variant="outline" size="sm" className="gap-2" onClick={() => navigator.clipboard.writeText(agents[selectedAgent].output || "")}>
                          <Copy className="w-4 h-4" /> Copy Analysis
                       </Button>
                    </div>
                 )}
               </Card>
               );
            })() : (
              // Empty State (No agent selected)
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60">
                 <Layout className="w-16 h-16 mb-4 stroke-1" />
                 <p className="text-lg font-medium">Select an agent from the sidebar</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ProjectStudio;
