/**
 * OrchestratorCard Component
 * Displays the "Recommended Next Step" from the Orchestrator v0.
 * Fetches the next module on mount and shows a CTA to navigate.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowRight, 
  Bot, 
  Loader2, 
  Video, 
  BookOpen, 
  Code, 
  FileText, 
  Briefcase,
  AlertCircle,
  Sparkles
} from "lucide-react";

interface OrchestratorCardProps {
  userId: string;
}

// Map orchestrator modules to frontend routes and icons
const MODULE_CONFIG: Record<string, { 
  route: string; 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = {
  production_interview: { 
    route: "/mock-interview", 
    icon: Video,
    label: "Mock Interview",
  },
  interview_journey: {
    route: "/mock-interview",
    icon: Video,
    label: "Interview Journey",
  },
  onboarding: {
    route: "/onboarding",
    icon: Bot,
    label: "Onboarding",
  },
  interactive_course: { 
    route: "/course-generator", 
    icon: BookOpen,
    label: "Interactive Course",
  },
  dsa_practice: { 
    route: "/dsa-sheet", 
    icon: Code,
    label: "DSA Practice",
  },
  resume_builder: { 
    route: "/resume-analyzer", 
    icon: FileText,
    label: "Resume Builder",
  },
  project_studio: { 
    route: "/project-studio", 
    icon: Briefcase,
    label: "Project Studio",
  },
  // Fallback
  default: { 
    route: "/dashboard", 
    icon: Bot,
    label: "Continue Learning",
  },
};

export default function OrchestratorCard({ userId }: OrchestratorCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<{
    next_module: string;
    reason: string;
    description?: string;
    depth?: number;
    weakness_trigger?: string | null;
    scores?: Record<string, number | null> | null;
  } | null>(null);

  const [decisionLog, setDecisionLog] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logLoadedOnce, setLogLoadedOnce] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const fetchRecommendation = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const resp = await fetch(`${API_BASE}/api/next?user_id=${encodeURIComponent(userId)}`);
      if (!resp.ok) throw new Error(`Gateway error ${resp.status}`);
      const data = await resp.json();
      setRecommendation(data);
    } catch (err: any) {
      console.error("Failed to fetch orchestrator recommendation:", err);
      setError("Couldn't fetch your next step. Try again later.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  const moduleConfig = useMemo(() => {
    if (!recommendation) return MODULE_CONFIG.default;
    return MODULE_CONFIG[recommendation.next_module] || MODULE_CONFIG.default;
  }, [recommendation]);

  const ModuleIcon = moduleConfig.icon;

  const depthLabel = useMemo(() => {
    const d = recommendation?.depth ?? 1;
    return d > 1 ? `Depth ${d}` : "Baseline";
  }, [recommendation?.depth]);

  const loadDecisionLog = useCallback(async () => {
    if (!userId) return;
    setLogLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const resp = await fetch(`${API_BASE}/api/orchestrator/decisions?user_id=${encodeURIComponent(userId)}`);
      if (!resp.ok) throw new Error(`Gateway error ${resp.status}`);
      const data = await resp.json();
      setDecisionLog(data || []);
      setLogLoadedOnce(true);
    } catch (e) {
      console.error("Failed to load decision log:", e);
      setDecisionLog([]);
    } finally {
      setLogLoading(false);
    }
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Next recommended step</CardTitle>
              <CardDescription className="text-sm">
                Personalized by your Orchestrator
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-3 py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing your progress…</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Next recommended step</CardTitle>
          <CardDescription className="text-sm">Personalized by your Orchestrator</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRecommendation}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-md bg-primary/10 p-2">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Next recommended step</CardTitle>
              <CardDescription className="text-sm">
                Updates after your activity (interviews, courses, and practice).
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Orchestrator v0</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {recommendation && (
          <>
            {/* Module Badge */}
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="rounded-md bg-background p-3 shadow-sm text-primary">
                <ModuleIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">
                  {moduleConfig.label}
                </p>
                  <span className="text-xs text-muted-foreground">{depthLabel}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {recommendation.description || recommendation.reason}
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Why this?</span>{" "}
              {recommendation.reason}
            </div>

            {/* Weakness Scores (when available) */}
            {recommendation.scores && (
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                {Object.entries(recommendation.scores).map(([key, val]) => {
                  const label = key
                    .replace(/_avg$/, "")
                    .replace(/_skill$/, "")
                    .replace(/_/g, " ");
                  const score = val ?? 1.0;
                  const isWeak = score < 0.4;
                  return (
                    <div
                      key={key}
                      className={`rounded-md border px-1.5 py-1.5 ${
                        isWeak
                          ? "border-destructive/40 bg-destructive/10 text-destructive"
                          : "border-border/40 bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      <div className="font-medium tabular-nums">
                        {(score * 100).toFixed(0)}%
                      </div>
                      <div className="mt-0.5 truncate capitalize leading-tight">
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CTA Button */}
            <Button asChild className="w-full gap-2 font-medium" size="lg">
              <Link to={moduleConfig.route}>
                Start {moduleConfig.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <Dialog
              open={logOpen}
              onOpenChange={(open) => {
                setLogOpen(open);
                if (open && !logLoadedOnce) loadDecisionLog();
              }}
            >
              <DialogTrigger asChild>
                <Button type="button" variant="outline" className="w-full">
                  View decision log
                </Button>
              </DialogTrigger>
              <DialogContent
                className="max-w-xl"
                onInteractOutside={() => {
                  // no-op; keep default behavior
                }}
                onEscapeKeyDown={() => {
                  // no-op; keep default behavior
                }}
              >
                <DialogHeader>
                  <DialogTitle>Orchestrator decision log</DialogTitle>
                  <DialogDescription>
                    Audit trail of recent routing decisions for this user.
                  </DialogDescription>
                </DialogHeader>

                {logLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                ) : decisionLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No decisions yet. Complete an interview or create a course to generate signals.
                  </p>
                ) : (
                  <ScrollArea className="max-h-[360px] pr-2">
                    <div className="space-y-3">
                      {decisionLog.map((d) => (
                        <div key={d.id} className="rounded-lg border border-border/60 p-3 bg-muted/20">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">
                              {MODULE_CONFIG[d.next_module]?.label || d.next_module}
                            </p>
                            <p className="text-xs text-muted-foreground">Depth {d.depth}</p>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{d.reason}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {new Date(d.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
