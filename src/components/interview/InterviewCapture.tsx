import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PlayCircle, StopCircle, Clock, Activity } from "lucide-react";

type Props = {
  onAudioReady: (blob: Blob) => void;
  onFaceFrame: (jpegBase64: string) => void;
  onTranscriptUpdate?: (text: string, isFinal: boolean) => void;
  faceIntervalMs?: number;
  wsEnabled?: boolean;
  wsUrl?: string;
  onRecordingChange?: (recording: boolean) => void;
};

const InterviewCapture: React.FC<Props> = ({
  onAudioReady,
  onFaceFrame,
  onTranscriptUpdate,
  onRecordingChange,
  faceIntervalMs = 1000,
  wsEnabled = false,
  wsUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const faceTimerRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [recording, setRecording] = useState(false);
  const recordingRef = useRef(false);
  // Use refs for streams so cleanup always has current value (not stale closure)
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const maxDurationSec = 180;
  const timerRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  /** Stop all media tracks and release hardware */
  const stopAllStreams = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    if (faceTimerRef.current) { window.clearInterval(faceTimerRef.current); faceTimerRef.current = null; }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
    wsRef.current = null;
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
  };

  useEffect(() => {
    const init = async () => {
      const a = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const v = await navigator.mediaDevices.getUserMedia({ video: true });
      audioStreamRef.current = a;
      videoStreamRef.current = v;
      if (videoRef.current) {
        videoRef.current.srcObject = v;
        await videoRef.current.play();
      }
    };
    init().catch(console.error);
    return () => {
      stopAllStreams();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ensureStreams = async () => {
    if (!audioStreamRef.current) {
      const a = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      audioStreamRef.current = a;
    }
    if (!videoStreamRef.current) {
      const v = await navigator.mediaDevices.getUserMedia({ video: true });
      videoStreamRef.current = v;
      if (videoRef.current) {
        videoRef.current.srcObject = v;
        await videoRef.current.play();
      }
    }
    // Apply current toggle states
    audioStreamRef.current.getAudioTracks().forEach(t => (t.enabled = micEnabled));
    videoStreamRef.current.getVideoTracks().forEach(t => (t.enabled = camEnabled));
  };

  const startRecording = async () => {
    try {
      await ensureStreams();
    } catch (e) {
      console.error('Media permission error:', e);
      return;
    }
    if (!audioStreamRef.current) return;
    audioChunksRef.current = [];

    if (wsEnabled && wsUrl && !wsRef.current) {
      try {
        const connectWs = () => {
          if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;
          const ws = new WebSocket(wsUrl);
          ws.onopen = () => {
            console.log("[WS] Transcription connected");
          };
          ws.onmessage = (evt) => {
            try {
              const data = JSON.parse(evt.data);
              if (data?.transcript && typeof onTranscriptUpdate === 'function') {
                onTranscriptUpdate(data.transcript, !!data.is_final);
              }
            } catch {
              // ignore
            }
          };
          ws.onerror = (err) => {
            console.warn("[WS] Transcription error, will retry", err);
          };
          ws.onclose = () => {
            // Auto-reconnect if still recording
            wsRef.current = null;
            setTimeout(() => {
              if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                connectWs();
              }
            }, 2000);
          };
          wsRef.current = ws;
        };
        connectWs();
      } catch (e) {
        console.warn("WS init failed", e);
      }
    }

    const mr = new MediaRecorder(audioStreamRef.current, { mimeType: "audio/webm;codecs=opus" });
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        audioChunksRef.current.push(e.data);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(e.data);
        }
      }
    };
    mr.start(1000); // 1s chunks
    mediaRecorderRef.current = mr;
    setRecording(true);
    recordingRef.current = true;
    if (typeof onRecordingChange === 'function') onRecordingChange(true);

    // start timer
    setRecordingTime(0);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setRecordingTime((t) => {
        const next = t + 1;
        if (next >= maxDurationSec) {
          // auto-stop at limit
          stopRecording().catch(() => {});
        }
        return next;
      });
    }, 1000);

    if (faceTimerRef.current) window.clearInterval(faceTimerRef.current);
    faceTimerRef.current = window.setInterval(captureFaceFrame, faceIntervalMs);

    // setup audio analyser for level meter
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      const source = ctx.createMediaStreamSource(audioStreamRef.current!);
      source.connect(analyser);
      analyserRef.current = analyser;
      audioCtxRef.current = ctx;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / dataArray.length; // 0-255
        setAudioLevel(avg);
        if (recordingRef.current) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch (e) {
      // ignore analyser errors
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    recordingRef.current = false;
    if (typeof onRecordingChange === 'function') onRecordingChange(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      await new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = () => resolve();
        mediaRecorderRef.current!.stop();
      });
    }
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });
    onAudioReady(audioBlob);

    if (faceTimerRef.current) {
      window.clearInterval(faceTimerRef.current);
      faceTimerRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) wsRef.current.close();
    wsRef.current = null;
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    // Release camera/mic hardware on stop
    stopAllStreams();
  };

  const captureFaceFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!camEnabled) return; // don't capture when camera is off
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    onFaceFrame(dataUrl);
  };

  return (
    <div className="space-y-3">
      <div className="rounded border p-2 bg-black w-full max-w-md h-72 mx-auto">
        <video ref={videoRef} className="w-full h-full object-cover rounded scale-x-[-1]" muted playsInline />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono">
            {String(Math.floor(recordingTime / 60)).padStart(2,'0')}:{String(recordingTime % 60).padStart(2,'0')}
          </span>
          <span className="opacity-60">/ 03:00</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" />
          <div className="h-2 w-16 bg-muted rounded">
            <div className="h-2 bg-green-500 rounded" style={{ width: `${Math.min(100, Math.round((audioLevel/255)*100))}%` }} />
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-center">
        <Button
          onClick={async () => {
            try {
              await ensureStreams();
              const next = !micEnabled;
              setMicEnabled(next);
              if (audioStreamRef.current) audioStreamRef.current.getAudioTracks().forEach(t => (t.enabled = next));
            } catch {}
          }}
          variant={micEnabled ? 'default' : 'outline'}
          size="sm"
          title={micEnabled ? 'Mic On' : 'Mic Off'}
        >
          {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
        </Button>
        <Button
          onClick={async () => {
            try {
              await ensureStreams();
              const next = !camEnabled;
              setCamEnabled(next);
              if (videoStreamRef.current) videoStreamRef.current.getVideoTracks().forEach(t => (t.enabled = next));
            } catch {}
          }}
          variant={camEnabled ? 'default' : 'outline'}
          size="sm"
          title={camEnabled ? 'Camera On' : 'Camera Off'}
        >
          {camEnabled ? <VideoIcon className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
        </Button>
        {!recording ? (
          <Button onClick={startRecording} size="sm">
            <PlayCircle className="h-4 w-4 mr-1" /> Start
          </Button>
        ) : (
          <Button onClick={stopRecording} size="sm" variant="destructive">
            <StopCircle className="h-4 w-4 mr-1" /> Stop
          </Button>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default InterviewCapture;
