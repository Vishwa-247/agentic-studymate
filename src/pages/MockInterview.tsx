import InterviewCapture from "@/components/interview/InterviewCapture";
import InterviewTypeSelector from "@/components/interview/InterviewTypeSelector";
import MetricsPanel from "@/components/interview/MetricsPanel";
import TechnicalInterviewSetup from "@/components/interview/TechnicalInterviewSetup";
import UnifiedInterviewSetup from "@/components/interview/UnifiedInterviewSetup";
import FloatingTip from "@/components/interview/FloatingTip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Container from "@/components/ui/Container";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Download, BarChart3, ChevronDown, ChevronUp, Radio, Mic, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { gatewayAuthService } from "@/api/services/gatewayAuthService";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import TranscriptionDisplay from "@/components/interview/TranscriptionDisplay";

const STORAGE_KEY = "mockInterviewState";

const CameraPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!mounted) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e: any) {
        setError(e?.message || "Camera permission denied");
      }
    };
    init();
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="rounded border p-2">
      {error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
        <video ref={videoRef} className="w-full scale-x-[-1]" muted playsInline />
      )}
    </div>
  );
};

// No static fallback questions — always use backend

enum InterviewStage {
  TypeSelection = "type_selection",
  Setup = "setup",
  Questions = "questions",
  Recording = "recording",
  Complete = "complete",
}

const MockInterview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const persisted = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
  })();
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<InterviewStage>(
    (persisted?.stage as InterviewStage) || InterviewStage.TypeSelection
  );
  const [selectedInterviewType, setSelectedInterviewType] =
    useState<string>(persisted?.selectedInterviewType || "");
  const [questions, setQuestions] = useState<string[]>(Array.isArray(persisted?.questions) ? persisted.questions : []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(typeof persisted?.currentQuestionIndex === "number" ? persisted.currentQuestionIndex : 0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [interviewId, setInterviewId] = useState<string>(persisted?.interviewId || "mock-001");
  const [pending, setPending] = useState<any[]>([]);
  const [pendingLoading, setPendingLoading] = useState<boolean>(false);

  // ── Analysis state ──────────────────────────────────────────────
  const [metricsData, setMetricsData] = useState({
    facialData: { confident: 0, stressed: 0, nervous: 0 },
    behaviorData: {
      blink_count: 0,
      looking_at_camera: false,
      head_pose: { pitch: 0, yaw: 0, roll: 0 },
      gaze_zone: "" as string | undefined,
      gaze_label: "" as string | undefined,
      gaze_h: 0 as number | undefined,
      gaze_v: 0 as number | undefined,
      eye_contact_ratio: 0 as number | undefined,
      engagement_score: 0 as number | undefined,
    },
    communicationData: {
      filler_word_count: 0,
      words_per_minute: 0,
      clarity_score: 0,
    },
  });
  const [bodyLanguage, setBodyLanguage] = useState<Record<string, any>>({});
  const [stressData, setStressData] = useState<Record<string, any>>({});
  const [deceptionFlags, setDeceptionFlags] = useState<string[]>([]);
  const [liveTranscription, setLiveTranscription] = useState("");
  const [interimTranscription, setInterimTranscription] = useState("");
  const [analysisSessionId, setAnalysisSessionId] = useState<string>("");
  const analysisStartedRef = useRef(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const transcriptionRef = useRef<string>("");

  const API_URL = "http://localhost:8000";

  // ── Start analysis session when entering Recording ────────────
  useEffect(() => {
    if (stage === InterviewStage.Recording && interviewId && !analysisStartedRef.current) {
      analysisStartedRef.current = true;
      const sid = `analysis-${interviewId}-${Date.now()}`;
      setAnalysisSessionId(sid);

      fetch(`${API_URL}/interviews/analyze-frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: "",
          session_id: sid,
          user_id: session?.user?.id || "anonymous",
        }),
      }).catch(() => {
        // Pre-warm will fail on empty image — that's expected.
        // The session is created server-side regardless.
      });

      // Also start the analysis session properly
      fetch(`${API_URL}/interviews/analysis/start-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sid,
          user_id: session?.user?.id || "anonymous",
          interview_type: selectedInterviewType || "technical",
        }),
      }).catch(console.warn);
    }
  }, [stage, interviewId]);

  // ── Mark question change for stress estimator ─────────────────
  useEffect(() => {
    if (
      analysisSessionId &&
      questions.length > 0 &&
      stage === InterviewStage.Recording
    ) {
      fetch(`${API_URL}/interviews/analysis/mark-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: analysisSessionId,
          question_text: questions[currentQuestionIndex] || "",
          question_type: selectedInterviewType || "technical",
          difficulty: "medium",
          topic: "general",
        }),
      }).catch(console.warn);
    }
  }, [currentQuestionIndex, analysisSessionId, stage]);

  // ── End analysis session on interview complete ────────────────
  useEffect(() => {
    if (stage === InterviewStage.Complete && analysisSessionId) {
      fetch(`${API_URL}/interviews/analysis/end-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: analysisSessionId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.summary) {
            // Store summary in sessionStorage for the results page
            sessionStorage.setItem(
              `analysis-summary-${interviewId}`,
              JSON.stringify(data.summary)
            );
          }
        })
        .catch(console.warn);
      analysisStartedRef.current = false;
    }
  }, [stage, analysisSessionId]);

  // ── Face frame handler (replaces Flask localhost:5000) ─────────
  const handleFaceFrame = async (jpegBase64: string) => {
    if (!analysisSessionId) return;
    try {
      const res = await fetch(`${API_URL}/interviews/analyze-frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: jpegBase64,
          session_id: analysisSessionId,
          user_id: session?.user?.id || "anonymous",
        }),
      });
      if (!res.ok) return;
      const data = await res.json();

      // Update facial metrics
      setMetricsData((prev) => ({
        ...prev,
        facialData: {
          confident: data.metrics?.confident ?? 0,
          stressed: data.metrics?.stressed ?? 0,
          nervous: data.metrics?.nervous ?? 0,
        },
        behaviorData: {
          blink_count: data.face_tracking?.blink_count ?? 0,
          looking_at_camera: !!data.face_tracking?.looking_at_camera,
          head_pose: data.face_tracking?.head_pose ?? {
            pitch: 0,
            yaw: 0,
            roll: 0,
          },
          gaze_zone: data.face_tracking?.gaze_zone ?? prev.behaviorData.gaze_zone,
          gaze_label: data.face_tracking?.gaze_label ?? prev.behaviorData.gaze_label,
          gaze_h: data.face_tracking?.gaze_h ?? prev.behaviorData.gaze_h,
          gaze_v: data.face_tracking?.gaze_v ?? prev.behaviorData.gaze_v,
          eye_contact_ratio: data.face_tracking?.eye_contact_ratio ?? prev.behaviorData.eye_contact_ratio,
          engagement_score: data.face_tracking?.engagement_score ?? prev.behaviorData.engagement_score,
        },
      }));

      // Update body language
      if (data.body_language && Object.keys(data.body_language).length > 0) {
        setBodyLanguage(data.body_language);
      }

      // Update stress data
      if (data.stress && Object.keys(data.stress).length > 0) {
        setStressData(data.stress);
      }

      // Update deception flags
      if (data.deception_flags) {
        setDeceptionFlags(data.deception_flags);
      }
    } catch (e) {
      // Silently ignore — analysis is best-effort
    }
  };

  // Load pending interviews from Supabase for current user
  useEffect(() => {
    const loadPending = async () => {
      if (!session?.user?.id) return;
      setPendingLoading(true);
      try {
        const { data, error } = await supabase
          .from('interview_sessions')
          .select('id, session_type, job_role, questions_data, status, started_at')
          .eq('user_id', session.user.id)
          .eq('status', 'active')
          .order('started_at', { ascending: false });
        if (error) throw error;
        setPending(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn('Load pending failed:', e);
      } finally {
        setPendingLoading(false);
      }
    };
    loadPending();
  }, [session?.user?.id]);

  const handleTypeSelection = (type: string) => {
    setSelectedInterviewType(type);
    setStage(InterviewStage.Setup);
  };

  const handleDeletePending = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('interview_sessions')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
      setPending(prev => prev.filter(s => s.id !== sessionId));
      toast({ title: 'Interview deleted', description: 'Pending interview has been removed.' });
    } catch (e) {
      console.error('Delete failed:', e);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };
  const handleInterviewSetup = async (
    dataOrRole: any,
    techStack?: string,
    experience?: string,
    resumeSummary?: string
  ) => {
    setIsLoading(true);
    try {
      // normalize incoming data
      let data = dataOrRole;
      if (typeof dataOrRole === "string" && techStack && experience) {
        data = { role: dataOrRole, techStack, experience, resumeSummary };
      }

      // Ensure we have a Gateway token (separate from Supabase token)
      const gatewayToken = await gatewayAuthService.ensureGatewayAuth(session?.user?.email || null);

      let endpoint = "";
      let payload: any = {};
      if (selectedInterviewType === "technical") {
        endpoint = "http://localhost:8000/interviews/technical/generate";
        payload = {
          user_id: "guest-user", // API Gateway will replace via token in production
          job_role: data.role || "Software Engineer",
          tech_stack: String(data.techStack || "").split(",").map((s: string) => s.trim()).filter(Boolean),
          exp_level: data.experience || "1-3",
          resume_summary: data.resumeSummary || "",
          total: 10,
          duration: 30,
        };
      } else if (selectedInterviewType === "aptitude") {
        endpoint = "http://localhost:8000/interviews/generate-aptitude";
        payload = {
          user_id: "guest-user",
          difficulty: data.difficulty || "medium",
          total: Number(data.questionCount || 15),
          duration: 45,
          resume_summary: data.resumeSummary || "",
        };
      } else if (selectedInterviewType === "hr") {
        // Map industry codes to readable labels
        const industryMap: Record<string, string> = {
          it: "Information Technology",
          finance: "Finance & Banking",
          healthcare: "Healthcare",
          education: "Education",
          marketing: "Marketing",
          consulting: "Consulting",
          manufacturing: "Manufacturing",
          retail: "Retail",
        };
        const industry = data.industry || data.role || "Software Engineer";
        const readableIndustry = industryMap[industry?.toLowerCase?.()] || industry;
        endpoint = "http://localhost:8000/interviews/generate-hr";
        payload = {
          user_id: "guest-user",
          job_role: data.role || readableIndustry,
          exp_level: data.experienceLevel || data.experience || data.positionLevel || "1-3",
          resume_summary: data.resumeSummary || "",
          total: 10,
          duration: 30,
        };
      }

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gatewayToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(`Failed to generate questions (${resp.status})`);
      const result = await resp.json();

      const returnedQuestions: string[] = (result.questions || []).map((q: any) => q.text || q.question || String(q));
      if (!returnedQuestions.length) throw new Error("No questions returned");

      setInterviewId(result.session_id || `session-${Date.now()}`);
      setQuestions(returnedQuestions);
      setCurrentQuestionIndex(0);
      toast({ title: "Interview Ready", description: `Generated ${returnedQuestions.length} questions. Review the first question, then click Ready to Answer.` });
      setStage(InterviewStage.Questions);
    } catch (e: any) {
      console.error("Question generation failed:", e);
      toast({ title: "Generation failed", description: e?.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumePending = (row: any) => {
    const qs = Array.isArray(row?.questions_data?.questions)
      ? row.questions_data.questions.map((q: any) => q.text || q.question || String(q))
      : [];
    if (!qs.length) {
      toast({ title: 'Resume failed', description: 'No questions found for this session.', variant: 'destructive' });
      return;
    }
    setInterviewId(row.id);
    setQuestions(qs);
    setCurrentQuestionIndex(row.current_question_index ?? 0);
    setSelectedInterviewType(row.session_type || 'technical');
    setStage(InterviewStage.Questions);
  };

  const handleAnswerSubmitted = () => {
    setRecordingComplete(true);
    toast({
      title: "Answer Recorded",
      description: "Your answer has been recorded successfully.",
    });
  };

  const handleNextQuestion = () => {
    setRecordingComplete(false);
    // Reset transcription for the next question
    transcriptionRef.current = "";
    setLiveTranscription("");
    setInterimTranscription("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      // Stay in Recording stage — don't go back to Questions preview
      toast({ title: `Question ${currentQuestionIndex + 2}`, description: "Record your answer when ready." });
    } else {
      // Interview complete — trigger analysis session end, navigate to results
      setStage(InterviewStage.Complete);
      navigate(`/interview-result/${interviewId}`);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    handleAnswerSubmitted(); // Auto-submit when recording stops
  };

  const handleCancel = () => {
    analysisStartedRef.current = false;
    setStage(InterviewStage.Questions);
  };

  const handleEndInterview = () => {
    const confirm = window.confirm("Are you sure you want to end the interview early? Your answered questions will still be saved.");
    if (!confirm) return;
    setIsRecording(false);
    setStage(InterviewStage.Complete);
    navigate(`/interview-result/${interviewId}`);
  };

  const handleDownloadInterview = () => {
    toast({
      title: "Interview Downloaded",
      description: "Your interview has been downloaded successfully.",
    });
  };

  // No resume of old static interviews

  const renderStage = () => {
    switch (stage) {
      case InterviewStage.Questions:
        if (questions.length === 0) {
          return (
            <div className="text-center py-12">
              <p>No questions available. Please set up a new interview.</p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="mb-6 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStage(InterviewStage.TypeSelection)}
                  className="text-muted-foreground"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Cancel Interview
                </Button>

                <span className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
              </div>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
                  <CardDescription>
                    Take a moment to think about your answer before recording.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-md text-lg">
                    {questions[currentQuestionIndex]}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center mt-4">
                <Button
                  size="lg"
                  onClick={() => setStage(InterviewStage.Recording)}
                >
                  Ready to Answer
                </Button>
              </div>

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Interview Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
                      </div>
                      <span>Speak clearly and at a moderate pace</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
                      </div>
                      <span>Maintain eye contact with the camera</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
                      </div>
                      <span>Structure your answers using the STAR method</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
                      </div>
                      <span>
                        Take a brief pause before answering to collect your
                        thoughts
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Camera Preview</CardTitle>
                  <CardDescription>
                    Check your camera and microphone before starting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CameraPreview />
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case InterviewStage.Recording:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ── Left column: question + transcription + tips ── */}
            <div className="space-y-6">
              <div className="mb-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isRecording) {
                      const confirmLeave = window.confirm("Stop recording and go back to questions?");
                      if (!confirmLeave) return;
                    }
                    analysisStartedRef.current = false;
                    setStage(InterviewStage.Questions);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex items-center gap-3">
                  {isRecording && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold animate-pulse">
                      <Radio className="h-3 w-3" />
                      RECORDING
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Question {currentQuestionIndex + 1}</span>
                    <span className="text-xs font-normal text-muted-foreground capitalize">
                      {selectedInterviewType} Interview
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {isRecording
                      ? "Recording your answer… speak clearly."
                      : "Press Start on the camera to begin recording."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-md text-lg">
                    {questions[currentQuestionIndex]}
                  </div>
                </CardContent>
              </Card>

              <TranscriptionDisplay text={liveTranscription} interimText={interimTranscription} isRecording={isRecording} />

              {/* Contextual floating tip based on live metrics */}
              <FloatingTip
                stressLevel={stressData?.level}
                lookingAtCamera={metricsData.behaviorData.looking_at_camera}
                eyeContactRatio={metricsData.behaviorData.eye_contact_ratio}
                gazeLabel={metricsData.behaviorData.gaze_label}
              />

              <div className="flex justify-center space-x-4">
                {recordingComplete ? (
                  currentQuestionIndex < questions.length - 1 ? (
                    <Button
                      onClick={handleNextQuestion}
                      className="px-6 py-3 bg-primary text-white rounded-lg flex items-center space-x-2"
                    >
                      <span>Next Question</span>
                      <ChevronRight size={16} />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextQuestion}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2"
                    >
                      <span>Finish Interview</span>
                      <ChevronRight size={16} />
                    </Button>
                  )
                ) : (
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={handleEndInterview}>
                  End Interview
                </Button>
              </div>
            </div>

            {/* ── Right column: camera + metrics toggle ── */}
            <div className="space-y-6">
              <Card className={`transition-all duration-300 ${isRecording ? "ring-2 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : ""}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>Your Camera</span>
                    {isRecording && (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isRecording ? "Recording in progress…" : "Press Start to begin recording"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InterviewCapture
                    onRecordingChange={(v) => setIsRecording(v)}
                    onTranscriptUpdate={(text, isFinal) => {
                      if (!text || !text.trim()) return;
                      if (isFinal) {
                        // Final transcript — append to permanent transcription
                        transcriptionRef.current = transcriptionRef.current
                          ? transcriptionRef.current + " " + text.trim()
                          : text.trim();
                        setLiveTranscription(transcriptionRef.current);
                        setInterimTranscription("");
                      } else {
                        // Interim (partial) — show as tentative text
                        setInterimTranscription(text.trim());
                      }
                    }}
                    wsEnabled={true}
                    wsUrl={"ws://localhost:8002/ws/transcribe"}
                    onFaceFrame={handleFaceFrame}
                    faceIntervalMs={1000}
                    onAudioReady={async (blob) => {
                      try {
                        const token = await gatewayAuthService.ensureGatewayAuth(
                          session?.user?.email || null
                        );
                        const fd = new FormData();
                        fd.append('audio', blob, 'answer.webm');
                        fd.append('question_id', String(currentQuestionIndex));
                        fd.append('facial_data', JSON.stringify({
                          ...metricsData.facialData,
                          stress: stressData,
                          body_language: bodyLanguage,
                          deception_flags: deceptionFlags,
                        }));
                        const resp = await fetch(`${API_URL}/interviews/${interviewId}/answer`, {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                          body: fd,
                        });
                        const data = await resp.json();
                        if (data?.analysis) {
                          setMetricsData(prev => ({
                            ...prev,
                            communicationData: {
                              filler_word_count: Number(data.analysis.filler_word_count ?? prev.communicationData.filler_word_count),
                              words_per_minute: Number(data.analysis.words_per_minute ?? prev.communicationData.words_per_minute),
                              clarity_score: Number(data.analysis.clarity_score ?? prev.communicationData.clarity_score),
                            }
                          }));
                        }
                        setRecordingComplete(true);
                      } catch (err) {
                        console.error('Submit answer failed:', err);
                        toast({ title: 'Submission Error', description: 'Please try again.', variant: 'destructive' });
                      }
                    }}
                  />
                </CardContent>
              </Card>

              {/* ── Collapsible Metrics Panel ── */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-between mb-2"
                  onClick={() => setMetricsExpanded(!metricsExpanded)}
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Live Metrics
                  </span>
                  {metricsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                {metricsExpanded && (
                  <MetricsPanel
                    facialData={metricsData.facialData}
                    behaviorData={metricsData.behaviorData}
                    communicationData={metricsData.communicationData}
                    bodyLanguage={bodyLanguage}
                    stressData={stressData}
                    deceptionFlags={deceptionFlags}
                    isVisible={isRecording}
                  />
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderRecentInterviews = () => {
    if (!session?.user?.id) return null;
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Your pending interviews</h2>
          <span className="text-sm text-muted-foreground">{pendingLoading ? 'Loading…' : `${pending.length}`}</span>
        </div>
        {pending.length === 0 ? (
          <div className="text-sm text-muted-foreground">No pending interviews. Create a new one above.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map((row) => (
              <Card key={row.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="truncate mr-2">{row.job_role || row.session_type}</span>
                    <span className="text-xs text-muted-foreground uppercase">{row.session_type}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {row.started_at ? new Date(row.started_at).toLocaleString() : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span>
                        {(row.current_question_index ?? 0)} / {(row.questions_data?.questions?.length ?? 0)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, Math.round(((row.current_question_index ?? 0) / Math.max(1, (row.questions_data?.questions?.length ?? 1))) * 100))}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="w-full" onClick={() => handleResumePending(row)}>
                      Resume
                    </Button>
                    <Button variant="outline" className="w-20" onClick={() => handleDeletePending(row.id)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Persist state so refresh does not reset flow
  useEffect(() => {
    const stateToSave = {
      stage,
      selectedInterviewType,
      questions,
      currentQuestionIndex,
      interviewId,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave)); } catch {}
  }, [stage, selectedInterviewType, questions, currentQuestionIndex, interviewId]);

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Mock Interview
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Practice your interview skills with our AI-powered mock interview
          simulator.
        </p>
      </div>

      {stage === InterviewStage.TypeSelection && (
        <div className="space-y-8">
          {/* Voice Interview CTA */}
          <Card className="border-dashed border-primary/40 bg-gradient-to-r from-primary/5 to-purple-500/5 cursor-pointer hover:border-primary/70 transition-colors"
            onClick={() => navigate("/voice-interview")}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mic className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Try Voice Interview</h3>
                <p className="text-xs text-muted-foreground">
                  Practice with an AI interviewer using your microphone — real-time voice conversation
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <InterviewTypeSelector
            onSelectType={handleTypeSelection}
            selectedType={selectedInterviewType}
          />
          {renderRecentInterviews()}
        </div>
      )}

      {stage === InterviewStage.Setup && (
        <div className="space-y-8">
          {selectedInterviewType === "technical" ? (
            <TechnicalInterviewSetup
              onSubmit={handleInterviewSetup}
              onBack={() => setStage(InterviewStage.TypeSelection)}
              isLoading={isLoading}
            />
          ) : (
            <UnifiedInterviewSetup
              type={selectedInterviewType as "aptitude" | "hr"}
              onSubmit={handleInterviewSetup}
              onBack={() => setStage(InterviewStage.TypeSelection)}
            />
          )}
        </div>
      )}

      {stage !== InterviewStage.TypeSelection &&
        stage !== InterviewStage.Setup &&
        renderStage()}
    </Container>
  );
};

export default MockInterview;
