import React, { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileText, Loader2, Sparkles, History, Search, Check,
  X, Eye, Clock, ArrowLeft, Lightbulb
} from "lucide-react";
import { AnalysisProgress, type ProgressStep } from "@/components/resume/AnalysisProgress";
import { EnhancedAnalysisResults } from "@/components/resume/EnhancedAnalysisResults";
import { SuggestedRoles } from "@/components/resume/SuggestedRoles";
import { supabase } from "@/integrations/supabase/client";
import { resumeService } from "@/api/services/resumeService";
import { roleTemplates, getRoleTemplate } from "@/data/sampleJobDescriptions";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/* ─── History sidebar item ─── */
interface HistoryItem {
  id: string;
  job_role: string;
  file_name: string;
  overall_score: number;
  created_at: string;
}

export default function ResumeAnalyzer() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  // ─── Restore from localStorage synchronously to avoid flash ───
  const cachedAnalysis = (() => {
    try {
      const raw = localStorage.getItem("sm_last_analysis");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.results && parsed.jobRole) return parsed;
    } catch { /* ignore corrupt cache */ }
    return null;
  })();

  // Input states
  const [jobRole, setJobRole] = useState(cachedAnalysis?.jobRole || "");
  const [jobDescription, setJobDescription] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedResumeName, setSelectedResumeName] = useState<string | null>(
    cachedAnalysis?.resumeName || null
  );

  // Analysis states
  const [loading, setLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(!!cachedAnalysis);
  const [analysisResults, setAnalysisResults] = useState<any>(cachedAnalysis?.results || null);
  const [extractedText, setExtractedText] = useState<string>(cachedAnalysis?.extractedText || "");
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);

  // History panel
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch auth user on mount ───
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch history when panel opens
  useEffect(() => {
    if (historyOpen && user?.id) {
      fetchHistory();
    }
  }, [historyOpen, user?.id]);

  const fetchHistory = async () => {
    if (!user?.id) return;
    setHistoryLoading(true);
    try {
      const data = await resumeService.getAnalysisHistory(user.id);
      setHistoryItems(data.history || []);
    } catch {
      console.error("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  /* ─── Drag & Drop ─── */
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
      setSelectedFile(file);
      setSelectedResumeId(null);
      setSelectedResumeName(file.name);
    } else {
      toast({ title: "Invalid File", description: "Please upload a PDF or DOCX.", variant: "destructive" });
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setSelectedResumeId(null); setSelectedResumeName(file.name); }
  };

  /* ─── Role chip click ─── */
  const handleRoleSelect = (role: string) => {
    setJobRole(role);
    const template = getRoleTemplate(role);
    if (template && !jobDescription) {
      setJobDescription(template.sampleJD);
      toast({ title: `${role} selected`, description: "Sample job description loaded — edit it or paste your own." });
    }
  };

  /* ─── Progress simulation ─── */
  const simulateProgress = useCallback(() => {
    const steps: ProgressStep[] = [
      { label: "Extracting text", status: "active" },
      { label: "Scoring keywords", status: "pending" },
      { label: "AI analysis", status: "pending" },
      { label: "Building report", status: "pending" },
    ];
    setProgressSteps([...steps]);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const advance = (idx: number, delay: number) => {
      timers.push(setTimeout(() => {
        steps[idx].status = "done";
        if (idx + 1 < steps.length) steps[idx + 1].status = "active";
        setProgressSteps([...steps]);
      }, delay));
    };
    advance(0, 2000);
    advance(1, 5000);
    advance(2, 9000);

    return () => timers.forEach(clearTimeout);
  }, []);

  /* ─── Trigger Analysis ─── */
  const handleAnalyze = async () => {
    if ((!selectedFile && !selectedResumeId) || !jobDescription) {
      toast({ title: "Missing Information", description: "Provide a resume and a job description.", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      const cleanup = simulateProgress();

      const data = await resumeService.analyzeResume(selectedFile, {
        jobRole: jobRole || "Candidate",
        jobDescription,
        userId: user?.id,
        resumeId: selectedResumeId || undefined,
      });

      cleanup();
      setProgressSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));

      setAnalysisResults(data.analysis);
      setExtractedText(data.full_resume_text || data.extracted_text || "");

      // Persist to localStorage for offline access
      try {
        localStorage.setItem("sm_last_analysis", JSON.stringify({
          results: data.analysis,
          jobRole,
          extractedText: data.full_resume_text || data.extracted_text || "",
          resumeName: selectedResumeName || "Uploaded Resume",
          savedAt: new Date().toISOString(),
        }));
      } catch { /* quota exceeded - ignore */ }

      setTimeout(() => {
        setAnalysisComplete(true);
        toast({ title: "Scan Complete", description: "Your comprehensive match report is ready." });
      }, 600);

    } catch (error) {
      console.error("Analysis error:", error);
      setProgressSteps([]);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "There was an error analyzing your resume.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ─── View past report from history ─── */
  const handleViewReport = async (item: HistoryItem) => {
    setLoadingReportId(item.id);
    try {
      const data = await resumeService.getFullAnalysis(item.id);
      const analysis = data.analysis?.analysis_results || data.analysis;
      setAnalysisResults(analysis);
      setJobRole(item.job_role);
      setSelectedResumeName(item.file_name);
      setAnalysisComplete(true);
      setHistoryOpen(false);

      // Persist loaded report
      try {
        localStorage.setItem("sm_last_analysis", JSON.stringify({
          results: analysis,
          jobRole: item.job_role,
          extractedText: "",
          resumeName: item.file_name,
          savedAt: new Date().toISOString(),
        }));
      } catch { /* ignore */ }
    } catch {
      toast({ title: "Error", description: "Failed to load report.", variant: "destructive" });
    } finally {
      setLoadingReportId(null);
    }
  };

  /* ─── Re-use resume from history ─── */
  const handleReuseResume = (item: HistoryItem) => {
    setSelectedResumeId(item.id);
    setSelectedFile(null);
    setSelectedResumeName(item.file_name);
    setHistoryOpen(false);
    toast({ title: "Resume Selected", description: `Using: ${item.file_name}` });
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const getScoreBadge = (score: number) => {
    if (score >= 75) return "bg-green-100 text-green-700";
    if (score >= 50) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  /* ────────────────────────── RESULTS VIEW ────────────────────────── */
  if (analysisComplete && analysisResults) {
    return (
      <div className="container mx-auto px-4 py-8 animate-in fade-in duration-500">
        <div className="flex justify-end mb-6">
          <Button
            variant="outline"
            onClick={() => {
              // Clear cached analysis so refresh won't restore old results
              localStorage.removeItem("sm_last_analysis");
              setAnalysisComplete(false);
              setAnalysisResults(null);
              setExtractedText("");
              setSelectedFile(null);
              setSelectedResumeId(null);
              setSelectedResumeName(null);
              setJobRole("");
              setJobDescription("");
              setProgressSteps([]);
            }}
            className="gap-2 px-6 py-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> New Scan
          </Button>
        </div>

        <EnhancedAnalysisResults
          results={analysisResults}
          jobRole={jobRole}
          resumeName={selectedResumeName || "Uploaded Resume"}
          extractedText={extractedText}
        />

        {analysisResults.suggested_roles && analysisResults.suggested_roles.length > 0 && (
          <div className="mt-12 mb-8 max-w-7xl mx-auto">
            <SuggestedRoles
              roles={analysisResults.suggested_roles}
              onSelectRole={(role) => {
                localStorage.removeItem("sm_last_analysis");
                setJobRole(role);
                setAnalysisComplete(false);
                setAnalysisResults(null);
                setProgressSteps([]);
                const tpl = getRoleTemplate(role);
                if (tpl) setJobDescription(tpl.sampleJD);
                toast({ title: `Switched to ${role}`, description: "Update the JD and scan again." });
              }}
            />
          </div>
        )}
      </div>
    );
  }

  /* ──────────────────────────── INPUT VIEW ─────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Resume Scanner</h1>
            <p className="text-muted-foreground mt-1">
              Upload your resume, pick a target role, and get a detailed ATS match report.
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            <History className="w-4 h-4" /> History
          </Button>
        </div>

        <div className="flex gap-6">

          {/* ─── MAIN COLUMN ─── */}
          <div className="flex-1 space-y-6">

            {/* STEP 1: Upload Resume */}
            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                  Upload Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer",
                    isDragOver && "border-primary bg-primary/5",
                    !isDragOver && !selectedFile && !selectedResumeId && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
                    (selectedFile || selectedResumeId) && "border-green-500/50 bg-green-50/50"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      (selectedFile || selectedResumeId) ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                    )}>
                      {(selectedFile || selectedResumeId) ? <FileText className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    </div>
                    {(selectedFile || selectedResumeId) ? (
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground text-sm">{selectedResumeName}</p>
                        <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                          <Check className="w-3 h-3" /> Ready
                        </p>
                        <Button
                          variant="ghost" size="sm"
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setSelectedResumeId(null); setSelectedResumeName(null); }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 text-xs mt-1"
                        >Remove</Button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium text-foreground text-sm">Click or drag & drop</p>
                        <p className="text-xs text-muted-foreground">PDF or DOCX (Max 5MB)</p>
                      </>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.docx" />
                </div>
              </CardContent>
            </Card>

            {/* STEP 2: Choose Role */}
            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                  Target Role
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <Input
                  placeholder="e.g. Senior Frontend Developer"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="bg-background"
                />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Quick select:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {roleTemplates.map((r) => (
                      <Badge
                        key={r.title}
                        variant={jobRole === r.title ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer text-xs py-1 px-2.5 transition-all",
                          jobRole === r.title
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        )}
                        onClick={() => handleRoleSelect(r.title)}
                      >
                        {r.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* STEP 3: Job Description */}
            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/30 border-b pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                    Job Description <span className="text-destructive text-xs">*</span>
                  </CardTitle>
                  {!jobDescription && jobRole && (
                    <Button
                      variant="ghost" size="sm"
                      className="text-xs h-7 text-primary hover:text-primary"
                      onClick={() => {
                        const tpl = getRoleTemplate(jobRole);
                        if (tpl) { setJobDescription(tpl.sampleJD); toast({ title: "Example loaded" }); }
                      }}
                    >
                      <Lightbulb className="w-3 h-3 mr-1" /> Try Example
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <Textarea
                  placeholder="Paste the full job description here..."
                  className="min-h-[180px] font-mono text-xs bg-background resize-none focus-visible:ring-primary"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                <div className="flex items-start gap-2 mt-3 p-3 rounded-md bg-blue-50/60 border border-blue-100">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 leading-snug">
                    Use a text-based PDF/DOCX. Scanned images aren't readable by ATS software.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Progress tracker (shown during analysis) */}
            <AnimatePresence>
              {loading && progressSteps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="border shadow-sm p-6">
                    <AnalysisProgress steps={progressSteps} />
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Button */}
            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleAnalyze}
                disabled={loading || !jobDescription || (!selectedFile && !selectedResumeId)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 shadow-sm text-base"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <>Scan & Match <Search className="w-5 h-5 ml-2" /></>
                )}
              </Button>
            </div>

          </div>

          {/* ─── HISTORY SIDEBAR ─── */}
          <AnimatePresence>
            {historyOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="shrink-0 overflow-hidden hidden md:block"
              >
                <Card className="border shadow-sm h-fit max-h-[calc(100vh-160px)] flex flex-col sticky top-4">
                  <CardHeader className="pb-2 border-b bg-muted/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> History
                      </CardTitle>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setHistoryOpen(false)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 overflow-y-auto flex-1 min-h-0">
                    {historyLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : historyItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No history yet</p>
                    ) : (
                      <div className="space-y-1.5">
                        {historyItems.map((item) => (
                          <div
                            key={item.id}
                            className="group rounded-lg border border-border p-2.5 hover:border-primary/30 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-start gap-2">
                              <FileText className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate">{item.job_role}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{item.file_name}</p>
                              </div>
                              <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0", getScoreBadge(item.overall_score))}>
                                {Math.round(item.overall_score)}%
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-muted-foreground">{formatDate(item.created_at)}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-5 text-[10px] px-1.5 text-primary"
                                  onClick={() => handleViewReport(item)}
                                  disabled={loadingReportId === item.id}
                                >
                                  {loadingReportId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Eye className="w-3 h-3 mr-0.5" /> View</>}
                                </Button>
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-5 text-[10px] px-1.5"
                                  onClick={() => handleReuseResume(item)}
                                >
                                  Re-use
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
