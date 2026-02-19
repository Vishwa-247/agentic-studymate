import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  Volume2,
  VolumeX,
  ArrowLeft,
  Bot,
  User,
  Loader2,
  Radio,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Code,
  Users,
} from "lucide-react";
import { useVoiceInterview, VoiceMessage, VoiceStatus } from "@/hooks/useVoiceInterview";

// ── Interview type config ─────────────────────────────────────────
const INTERVIEW_TYPES = [
  {
    id: "technical",
    label: "Technical",
    icon: Code,
    description: "Data structures, algorithms, system design",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "hr",
    label: "HR / Behavioral",
    icon: Users,
    description: "Situational, behavioral, culture fit",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "aptitude",
    label: "Aptitude",
    icon: Briefcase,
    description: "Problem-solving, logical reasoning",
    color: "from-amber-500 to-orange-500",
  },
];

// ── Status display config ────────────────────────────────────────
const STATUS_CONFIG: Record<
  VoiceStatus,
  { label: string; color: string; animate?: boolean }
> = {
  idle: { label: "Ready", color: "text-muted-foreground" },
  starting: { label: "Connecting...", color: "text-yellow-500", animate: true },
  listening: { label: "Listening", color: "text-green-500", animate: true },
  processing: { label: "AI Thinking...", color: "text-blue-500", animate: true },
  speaking: { label: "AI Speaking", color: "text-purple-500", animate: true },
  error: { label: "Error", color: "text-red-500" },
  ended: { label: "Interview Ended", color: "text-muted-foreground" },
};

// ── Animated audio bars ──────────────────────────────────────────
function AudioBars({ active, className = "" }: { active: boolean; className?: string }) {
  return (
    <div className={`flex items-end gap-0.5 h-4 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${
            active
              ? "bg-green-500 animate-pulse"
              : "bg-muted-foreground/30"
          }`}
          style={{
            height: active ? `${8 + Math.random() * 8}px` : "4px",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Chat bubble component ────────────────────────────────────────
function ChatBubble({ message }: { message: VoiceMessage }) {
  const isUser = message.role === "user";
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
        <p
          className={`text-[10px] mt-1 ${
            isUser ? "text-primary-foreground/60" : "text-muted-foreground"
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

// ── Main page component ──────────────────────────────────────────
export default function VoiceInterview() {
  const navigate = useNavigate();
  const {
    sessionId,
    status,
    messages,
    interimTranscript,
    ttsAvailable,
    error,
    exchangeCount,
    startSession,
    endSession,
    startListening,
    stopListening,
    sendText,
  } = useVoiceInterview();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [jobRole, setJobRole] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);

  const isInSession = status !== "idle" && status !== "ended";
  const isActive = status === "listening" || status === "processing" || status === "speaking";
  const statusCfg = STATUS_CONFIG[status];

  // ── Handlers ──────────────────────────────────────────────────
  const handleStart = () => {
    if (!selectedType || !jobRole.trim()) return;
    startSession(selectedType, jobRole.trim());
  };

  const handleSendText = () => {
    if (!textInput.trim() || status !== "listening") return;
    stopListening();
    sendText(textInput);
    setTextInput("");
  };

  const handleMicToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      stopListening();
    }
  };

  const handleEnd = () => {
    endSession();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // ── Setup Screen ──────────────────────────────────────────────
  if (status === "idle") {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Phone className="w-6 h-6 text-primary" />
                Voice Interview
              </h1>
              <p className="text-muted-foreground text-sm">
                Practice with an AI interviewer using your voice
              </p>
            </div>
          </div>

          {/* Interview type selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Interview Type</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {INTERVIEW_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Job role input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="e.g. Senior Frontend Developer"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
              />
              <div className="flex flex-wrap gap-2">
                {[
                  "Software Engineer",
                  "Frontend Developer",
                  "Data Scientist",
                  "Product Manager",
                  "DevOps Engineer",
                ].map((role) => (
                  <Badge
                    key={role}
                    variant={jobRole === role ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setJobRole(role)}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Start button */}
          <Button
            size="lg"
            className="w-full h-14 text-lg gap-2"
            disabled={!selectedType || !jobRole.trim()}
            onClick={handleStart}
          >
            <Mic className="w-5 h-5" />
            Start Voice Interview
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Uses your browser microphone for speech-to-text. Works best in Google Chrome.
          </p>
        </div>
      </div>
    );
  }

  // ── Interview Ended Screen ────────────────────────────────────
  if (status === "ended") {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-3 py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Interview Complete</h1>
            <p className="text-muted-foreground">
              You completed {exchangeCount} exchange{exchangeCount !== 1 ? "s" : ""} in this session.
            </p>
          </div>

          {/* Conversation transcript */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversation Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px] pr-4">
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <ChatBubble key={i} message={msg} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              <Phone className="w-4 h-4 mr-2" />
              New Interview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active Interview Screen ───────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"
              }`}
            />
            <span className={`text-sm font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          {status === "listening" && (
            <AudioBars active={true} />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {exchangeCount} exchange{exchangeCount !== 1 ? "s" : ""}
          </Badge>
          {ttsAvailable && (
            <Badge variant="outline" className="text-xs gap-1">
              <Volume2 className="w-3 h-3" /> TTS
            </Badge>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto text-xs"
            onClick={() => startListening()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="max-w-2xl mx-auto p-4 space-y-4 pb-32">
            {/* Session start indicator */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-xs gap-1">
                <Radio className="w-3 h-3" />
                Voice session started
              </Badge>
            </div>

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}

            {/* Interim transcript (what user is currently saying) */}
            {interimTranscript && (
              <div className="flex gap-3 flex-row-reverse">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 bg-primary/10 border border-dashed border-primary/30">
                  <p className="text-sm text-muted-foreground italic">
                    {interimTranscript}...
                  </p>
                </div>
              </div>
            )}

            {/* Processing indicator */}
            {status === "processing" && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Starting indicator */}
            {status === "starting" && (
              <div className="flex justify-center py-12">
                <div className="text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Setting up your interview...
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Bottom controls */}
      <div className="border-t bg-card p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Text input fallback */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder={
                status === "listening"
                  ? "Or type your response here..."
                  : "Waiting for AI..."
              }
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={status !== "listening"}
              className="flex-1"
            />
            <Button
              size="icon"
              variant="ghost"
              disabled={status !== "listening" || !textInput.trim()}
              onClick={handleSendText}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Voice controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Mute toggle */}
            <Button
              size="icon"
              variant={isMuted ? "destructive" : "outline"}
              className="rounded-full w-12 h-12"
              onClick={handleMicToggle}
              disabled={!isActive}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>

            {/* End call */}
            <Button
              size="icon"
              variant="destructive"
              className="rounded-full w-14 h-14"
              onClick={handleEnd}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>

            {/* TTS toggle (placeholder for future) */}
            <Button
              size="icon"
              variant="outline"
              className="rounded-full w-12 h-12"
              disabled={!ttsAvailable}
              title={ttsAvailable ? "TTS enabled" : "TTS not available"}
            >
              {ttsAvailable ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground">
            {status === "listening"
              ? "🎙️ Speak now — your voice is being captured"
              : status === "speaking"
              ? "🔊 AI is speaking — listening will resume automatically"
              : status === "processing"
              ? "⏳ Processing your response..."
              : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
