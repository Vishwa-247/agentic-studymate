import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { gatewayAuthService } from "@/api/services/gatewayAuthService";
import { API_GATEWAY_URL } from "@/configs/environment";

// ── Types ─────────────────────────────────────────────────────────────
export interface VoiceMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
}

export type VoiceStatus =
  | "idle"
  | "starting"
  | "listening"
  | "processing"
  | "speaking"
  | "error"
  | "ended";

export interface VoiceInterviewState {
  sessionId: string | null;
  status: VoiceStatus;
  messages: VoiceMessage[];
  interimTranscript: string;
  ttsAvailable: boolean;
  error: string | null;
  exchangeCount: number;
}

// ── Speech Recognition types (Web Speech API) ─────────────────────
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useVoiceInterview() {
  const { user } = useAuth();

  const [state, setState] = useState<VoiceInterviewState>({
    sessionId: null,
    status: "idle",
    messages: [],
    interimTranscript: "",
    ttsAvailable: false,
    error: null,
    exchangeCount: 0,
  });

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isListeningRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  // Keep sessionId ref in sync
  useEffect(() => {
    sessionIdRef.current = state.sessionId;
  }, [state.sessionId]);

  // ── Auth header helper ──────────────────────────────────────────
  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const email = user?.email;
    const token = await gatewayAuthService.ensureGatewayAuth(email);
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [user]);

  // ── Add message helper ──────────────────────────────────────────
  const addMessage = useCallback((role: "user" | "assistant", text: string) => {
    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, { role, text, timestamp: Date.now() }],
    }));
  }, []);

  // ── TTS playback ───────────────────────────────────────────────
  const playTTS = useCallback(
    async (text: string) => {
      if (!sessionIdRef.current || !state.ttsAvailable) return;

      setState((prev) => ({ ...prev, status: "speaking" }));

      try {
        const headers = await getAuthHeaders();
        const resp = await fetch(
          `${API_GATEWAY_URL}/api/interview/voice/tts`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              session_id: sessionIdRef.current,
              text,
            }),
          }
        );

        if (!resp.ok) {
          // TTS failed — just skip audio, text is already shown
          setState((prev) => ({ ...prev, status: "listening" }));
          return;
        }

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          setState((prev) => ({
            ...prev,
            status: prev.status === "ended" ? "ended" : "listening",
          }));
          // Auto-resume listening after AI finishes speaking
          startListening();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          setState((prev) => ({
            ...prev,
            status: prev.status === "ended" ? "ended" : "listening",
          }));
        };

        await audio.play();
      } catch {
        setState((prev) => ({
          ...prev,
          status: prev.status === "ended" ? "ended" : "listening",
        }));
      }
    },
    [state.ttsAvailable, getAuthHeaders]
  );

  // ── Send transcript to backend ─────────────────────────────────
  const sendTranscript = useCallback(
    async (text: string) => {
      if (!sessionIdRef.current) return;

      addMessage("user", text);
      setState((prev) => ({ ...prev, status: "processing", interimTranscript: "" }));

      try {
        const headers = await getAuthHeaders();
        const resp = await fetch(
          `${API_GATEWAY_URL}/api/interview/voice/respond`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              session_id: sessionIdRef.current,
              transcript: text,
            }),
          }
        );

        if (!resp.ok) {
          const errText = await resp.text().catch(() => "Request failed");
          throw new Error(errText);
        }

        const data = await resp.json();
        const aiResponse = data.response as string;
        const exchanges = (data.exchanges as number) || 0;

        addMessage("assistant", aiResponse);
        setState((prev) => ({ ...prev, exchangeCount: exchanges }));

        // Play TTS if available, otherwise resume listening
        if (state.ttsAvailable) {
          await playTTS(aiResponse);
        } else {
          setState((prev) => ({ ...prev, status: "listening" }));
          startListening();
        }
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err.message || "Failed to get AI response",
        }));
      }
    },
    [getAuthHeaders, addMessage, state.ttsAvailable, playTTS]
  );

  // ── Speech Recognition (Web Speech API) ────────────────────────
  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState((prev) => ({
        ...prev,
        error: "Speech recognition is not supported in this browser. Please use Chrome.",
      }));
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    return recognition;
  }, []);

  const startListening = useCallback(() => {
    if (isListeningRef.current) return;

    let recognition = recognitionRef.current;
    if (!recognition) {
      recognition = initRecognition();
      if (!recognition) return;
      recognitionRef.current = recognition;
    }

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setState((prev) => ({ ...prev, interimTranscript: interim }));
    };

    recognition.onspeechend = () => {
      // User stopped speaking — send the transcript if we have one
      if (finalTranscript.trim().length > 0) {
        isListeningRef.current = false;
        recognition.stop();
        sendTranscript(finalTranscript.trim());
        finalTranscript = "";
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        // Benign errors — restart listening
        isListeningRef.current = false;
        if (state.status !== "ended" && state.status !== "processing" && state.status !== "speaking") {
          setTimeout(() => startListening(), 500);
        }
        return;
      }
      console.error("Speech recognition error:", event.error);
      setState((prev) => ({
        ...prev,
        status: "error",
        error: `Microphone error: ${event.error}`,
      }));
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      // If we have accumulated text but speechend didn't fire, send it
      if (finalTranscript.trim().length > 0) {
        sendTranscript(finalTranscript.trim());
        finalTranscript = "";
      } else if (state.status === "listening") {
        // Restart recognition (Chrome kills it after ~60s)
        setTimeout(() => startListening(), 300);
      }
    };

    try {
      recognition.start();
      isListeningRef.current = true;
      setState((prev) => ({ ...prev, status: "listening" }));
    } catch (err) {
      // Already started — ignore
    }
  }, [initRecognition, sendTranscript, state.status]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      isListeningRef.current = false;
    }
  }, []);

  // ── Start session ──────────────────────────────────────────────
  const startSession = useCallback(
    async (interviewType: string, jobRole: string) => {
      setState((prev) => ({ ...prev, status: "starting", error: null, messages: [] }));

      try {
        const headers = await getAuthHeaders();
        const resp = await fetch(
          `${API_GATEWAY_URL}/api/interview/voice/start`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              interview_type: interviewType,
              job_role: jobRole,
            }),
          }
        );

        if (!resp.ok) {
          const errText = await resp.text().catch(() => "Failed to start session");
          throw new Error(errText);
        }

        const data = await resp.json();
        const sid = data.session_id as string;
        const greeting = data.greeting as string;
        const ttsOk = (data.tts_available as boolean) || false;

        setState((prev) => ({
          ...prev,
          sessionId: sid,
          ttsAvailable: ttsOk,
          status: "speaking",
          messages: [{ role: "assistant", text: greeting, timestamp: Date.now() }],
        }));

        // Play greeting audio if TTS available, else just start listening
        if (ttsOk) {
          // need to wait for sessionId ref to update
          sessionIdRef.current = sid;
          await playTTS(greeting);
        } else {
          setState((prev) => ({ ...prev, status: "listening" }));
          startListening();
        }
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err.message || "Failed to start voice interview",
        }));
      }
    },
    [getAuthHeaders, playTTS, startListening]
  );

  // ── End session ────────────────────────────────────────────────
  const endSession = useCallback(async () => {
    stopListening();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Fetch final summary
    if (sessionIdRef.current) {
      try {
        const headers = await getAuthHeaders();
        const resp = await fetch(
          `${API_GATEWAY_URL}/api/interview/voice/history/${sessionIdRef.current}`,
          { headers }
        );
        if (resp.ok) {
          const data = await resp.json();
          if (data.summary) {
            addMessage("assistant", `📋 Interview Summary:\n${data.summary}`);
          }
        }
      } catch {
        // ignore
      }
    }

    setState((prev) => ({ ...prev, status: "ended" }));
  }, [stopListening, getAuthHeaders, addMessage]);

  // ── Manual send (for text fallback) ────────────────────────────
  const sendText = useCallback(
    (text: string) => {
      if (text.trim()) {
        sendTranscript(text.trim());
      }
    },
    [sendTranscript]
  );

  // ── Cleanup on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return {
    ...state,
    startSession,
    endSession,
    startListening,
    stopListening,
    sendText,
  };
}
