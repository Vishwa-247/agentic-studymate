
import Container from "@/components/ui/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Brain,
  CheckCircle,
  ChevronLeft,
  MessageSquare,
  PersonStanding,
  ShieldAlert,
  Video,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// ── Helpers ────────────────────────────────────────────────────────

const pct = (v: number | undefined) => Math.round((v ?? 0) * 100);

const StressBar = ({ label, value, max = 1 }: { label: string; value: number; max?: number }) => {
  const normalized = Math.min(100, (value / max) * 100);
  const color =
    normalized < 36 ? "bg-green-500" : normalized < 56 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted-foreground">{Math.round(normalized)}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
};

// ── Component ──────────────────────────────────────────────────────

const InterviewResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("feedback");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisSummary, setAnalysisSummary] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        // Load facial/body analysis summary from sessionStorage (set by MockInterview)
        const stored = sessionStorage.getItem(`analysis-summary-${id}`);
        if (stored) {
          try {
            setAnalysisSummary(JSON.parse(stored));
          } catch { /* ignore */ }
        }

        // Fetch from backend
        const resp = await fetch(`http://localhost:8000/interviews/${id}`);
        if (!resp.ok) throw new Error("Failed to load interview session");

        const data = await resp.json();
        const interviewData = data.interview || data;
        setSession(interviewData);

        // Auto-analyze if completed
        if (interviewData.status === "completed") {
          const analysisResp = await fetch(
            `http://localhost:8000/interviews/${id}/analyze`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            }
          );

          if (analysisResp.ok) {
            const analysisData = await analysisResp.json();
            setAnalysis(analysisData.analysis || analysisData);
          }
        }
      } catch (e: any) {
        setError(e?.message || "Unable to load interview");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500">Strong</Badge>;
    if (score >= 60) return <Badge className="bg-amber-500">Average</Badge>;
    return <Badge className="bg-red-500">Needs Improvement</Badge>;
  };

  const stressDistribution = analysisSummary?.stress_distribution || {};
  const studymateMetrics = analysisSummary?.studymate_metrics || {};
  const questionAnalyses: any[] = analysisSummary?.question_analyses || [];

  return (
    <Container>
      <div className="py-12">
        {/* ── Header ───────────────────────────────────────────── */}
        <div className="mb-8">
          {loading && (
            <div className="text-sm text-muted-foreground">Loading interview...</div>
          )}
          {error && <div className="text-sm text-red-500">{error}</div>}
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Video className="h-4 w-4" />
            <span>Interview #{id?.slice(0, 8)}</span>
            <span>•</span>
            <span>
              {session?.start_time
                ? new Date(session.start_time).toLocaleDateString()
                : ""}
            </span>
            <span>•</span>
            <span>{session?.duration ? `${session.duration} min` : ""}</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Interview Result
            </h1>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <Badge variant="outline" className="px-3 py-1">
              {session?.job_role || "—"}
            </Badge>
            {Array.isArray(session?.tech_stack) &&
              session.tech_stack.map((tech: string) => (
                <Badge key={tech} variant="secondary" className="px-3 py-1">
                  {tech}
                </Badge>
              ))}
          </div>

          {/* ── Score cards ───────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div
                    className={`text-3xl font-bold ${getScoreColor(
                      analysis?.overall_score || 0
                    )}`}
                  >
                    {Math.round(analysis?.overall_score || 0)}%
                  </div>
                  {getScoreBadge(Math.round(analysis?.overall_score || 0))}
                </div>
                <Progress
                  value={analysis?.overall_score || 0}
                  className="h-2 mt-2"
                />
              </CardContent>
            </Card>

            {analysisSummary && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                    <Brain className="h-4 w-4" /> Avg Stress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">
                      {pct(analysisSummary.avg_stress)}%
                    </div>
                    <Badge
                      className={
                        (analysisSummary.avg_stress ?? 0) < 0.36
                          ? "bg-green-500"
                          : (analysisSummary.avg_stress ?? 0) < 0.56
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }
                    >
                      {(analysisSummary.avg_stress ?? 0) < 0.36
                        ? "Calm"
                        : (analysisSummary.avg_stress ?? 0) < 0.56
                        ? "Slight"
                        : "High"}
                    </Badge>
                  </div>
                  <Progress
                    value={pct(analysisSummary.avg_stress)}
                    className="h-2 mt-2"
                  />
                </CardContent>
              </Card>
            )}

            {analysisSummary && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Frames Analyzed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analysisSummary.total_frames ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Duration: {Math.round(analysisSummary.duration_seconds ?? 0)}s
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis?.feedback && (
              <Card className="sm:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Feedback Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {analysis?.feedback?.overall || "—"}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <Tabs
          defaultValue="feedback"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-3xl" style={{ gridTemplateColumns: `repeat(${2 + (analysisSummary ? 2 : 0)}, minmax(0, 1fr))` }}>
            <TabsTrigger value="feedback">
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback
            </TabsTrigger>
            {((session?.questions && session.questions.length > 0) ||
              (session?.questions_data?.questions?.length > 0)) && (
              <TabsTrigger value="questions">
                <AlertCircle className="h-4 w-4 mr-2" />
                Questions
              </TabsTrigger>
            )}
            {analysisSummary && (
              <TabsTrigger value="stress">
                <Brain className="h-4 w-4 mr-2" />
                Stress Analysis
              </TabsTrigger>
            )}
            {analysisSummary && (
              <TabsTrigger value="body">
                <PersonStanding className="h-4 w-4 mr-2" />
                Body Language
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Feedback tab ────────────────────────────────────── */}
          <TabsContent value="feedback" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Technical Knowledge</CardTitle>
                <CardDescription>
                  Assessment of your technical expertise and domain knowledge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Strengths
                  </h3>
                  <ul className="ml-6 space-y-1 list-disc">
                    {(analysis?.feedback?.strengths || []).map(
                      (s: string, i: number) => (
                        <li key={i}>{s}</li>
                      )
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="ml-6 space-y-1 list-disc">
                    {(analysis?.feedback?.improvements || []).map(
                      (w: string, i: number) => (
                        <li key={i}>{w}</li>
                      )
                    )}
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">Summary</h3>
                  <p>{analysis?.feedback?.overall || "—"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Questions tab ───────────────────────────────────── */}
          <TabsContent value="questions" className="space-y-8">
            {(
              session?.questions ||
              session?.questions_data?.questions ||
              []
            ).map((q: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {q.question || q.text || `Question ${index + 1}`}
                    </CardTitle>
                    {typeof q?.feedback?.score === "number" && (
                      <Badge
                        className={
                          q.feedback.score >= 80
                            ? "bg-green-500"
                            : q.feedback.score >= 60
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }
                      >
                        {q.feedback.score}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {q.answer && (
                    <div>
                      <h3 className="font-medium mb-2">Your Answer</h3>
                      <div className="bg-muted/30 p-4 rounded-md border text-foreground/90">
                        {q.answer}
                      </div>
                    </div>
                  )}
                  {q.feedback && (
                    <div>
                      <h3 className="font-medium mb-2">Feedback</h3>
                      <div className="bg-primary/5 p-4 rounded-md border border-primary/20 text-foreground/90">
                        {typeof q.feedback === "string"
                          ? q.feedback
                          : q.feedback.overall_feedback || "—"}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ── Stress Analysis tab ─────────────────────────────── */}
          {analysisSummary && (
            <TabsContent value="stress" className="space-y-8">
              {/* Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" /> Stress Distribution
                  </CardTitle>
                  <CardDescription>
                    How your stress levels were distributed throughout the interview
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {Object.entries(stressDistribution).map(([level, pctVal]) => {
                      const color =
                        level === "Calm"
                          ? "text-green-500"
                          : level.includes("Slight")
                          ? "text-amber-500"
                          : "text-red-500";
                      return (
                        <div key={level}>
                          <div className={`text-2xl font-bold ${color}`}>
                            {typeof pctVal === "number" ? `${Math.round(pctVal)}%` : String(pctVal)}
                          </div>
                          <div className="text-xs text-muted-foreground">{level}</div>
                        </div>
                      );
                    })}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Average Stress</span>
                      <div className="font-medium">{pct(analysisSummary.avg_stress)}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Peak Stress</span>
                      <div className="font-medium">{pct(analysisSummary.max_stress)}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Per-question stress breakdown */}
              {questionAnalyses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Per-Question Stress</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {questionAnalyses.map((qa: any, i: number) => (
                      <div key={i} className="border rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start text-sm">
                          <span className="font-medium truncate mr-2">
                            Q{i + 1}: {qa.question?.slice(0, 60) || `Question ${i + 1}`}
                          </span>
                          <Badge
                            className={
                              qa.stress_level === "Calm"
                                ? "bg-green-500"
                                : qa.stress_level?.includes("Slight")
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }
                          >
                            {qa.stress_level}
                          </Badge>
                        </div>
                        <StressBar label="Avg" value={qa.avg_stress ?? 0} />
                        <StressBar label="Peak" value={qa.peak_stress ?? 0} />
                        {qa.deception_count > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-600">
                            <ShieldAlert className="h-3 w-3" />
                            {qa.deception_count} stress signal{qa.deception_count > 1 ? "s" : ""} detected
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* ── Body Language / StudyMate Metrics tab ────────────── */}
          {analysisSummary && (
            <TabsContent value="body" className="space-y-8">
              {/* StudyMate 6 Metrics */}
              {Object.keys(studymateMetrics).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PersonStanding className="h-5 w-5" /> StudyMate Behavioral Metrics
                    </CardTitle>
                    <CardDescription>
                      Six key behavioral dimensions measured during the interview
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(studymateMetrics).map(([key, val]) => {
                        const value = typeof val === "number" ? val : 0;
                        const color =
                          value >= 0.7
                            ? "text-green-500"
                            : value >= 0.4
                            ? "text-amber-500"
                            : "text-red-500";
                        return (
                          <div key={key} className="text-center p-3 border rounded-lg">
                            <div className={`text-2xl font-bold ${color}`}>
                              {pct(value)}%
                            </div>
                            <div className="text-xs text-muted-foreground capitalize mt-1">
                              {key.replace(/_/g, " ")}
                            </div>
                            <Progress value={pct(value)} className="h-1.5 mt-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Session Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Frames</span>
                      <div className="font-medium text-lg">{analysisSummary.total_frames ?? 0}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration</span>
                      <div className="font-medium text-lg">
                        {Math.round(analysisSummary.duration_seconds ?? 0)}s
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Stress</span>
                      <div className="font-medium text-lg">{pct(analysisSummary.avg_stress)}%</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Questions</span>
                      <div className="font-medium text-lg">{questionAnalyses.length}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Container>
  );
};

export default InterviewResult;
