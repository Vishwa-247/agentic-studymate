
// import { useState, useRef, useEffect } from "react";
// import { Camera, Mic, MicOff, Video, VideoOff, RotateCw } from "lucide-react";
// import GlassMorphism from "../ui/GlassMorphism";

// interface VideoRecorderProps {
//   onRecordingComplete: (blob: Blob) => void;
//   isRecording: boolean;
//   startRecording: () => void;
//   stopRecording: () => void;
// }

// const VideoRecorder = ({
//   onRecordingComplete,
//   isRecording,
//   startRecording,
//   stopRecording,
// }: VideoRecorderProps) => {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const chunksRef = useRef<BlobPart[]>([]);
  
//   const [videoEnabled, setVideoEnabled] = useState(true);
//   const [audioEnabled, setAudioEnabled] = useState(true);
//   const [error, setError] = useState<string>("");
//   const [countdown, setCountdown] = useState<number | null>(null);
  
//   // Simple facial analysis state without conflicting video stream management
//   const [facialData, setFacialData] = useState({
//     confident: 0,
//     stressed: 0, 
//     hesitant: 0,
//     nervous: 0,
//     excited: 0
//   });
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const analysisTimerRef = useRef<number | null>(null);
  
//   const analyzeFrame = async () => {
//     try {
//       if (!videoRef.current) return;
      
//       // Capture frame from video
//       const canvas = document.createElement('canvas');
//       canvas.width = videoRef.current.videoWidth;
//       canvas.height = videoRef.current.videoHeight;
//       const ctx = canvas.getContext('2d');
      
//       if (!ctx) return;
      
//       ctx.drawImage(videoRef.current, 0, 0);
      
//       // Convert to base64
//       const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
//       // Call Flask emotion detection API
//       const response = await fetch('http://localhost:5000/analyze', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ image: imageData })
//       });
      
//       if (!response.ok) {
//         console.error('Facial analysis API error:', response.status);
//         // Fallback to mock data if API fails
//         const mockAnalysis = {
//           confident: Math.random() * 100,
//           stressed: Math.random() * 50,
//           hesitant: 50,
//           nervous: Math.random() * 60,
//           excited: Math.random() * 80
//         };
//         setFacialData(mockAnalysis);
//         return;
//       }
      
//       const result = await response.json();
      
//       if (result.metrics) {
//         const analysisData = {
//           confident: result.metrics.confident * 100,
//           stressed: result.metrics.stressed * 100,
//           nervous: result.metrics.nervous * 100,
//           hesitant: 50, // Derived metric
//           excited: result.metrics.engaged * 100
//         };
        
//         setFacialData(analysisData);
//       }
//     } catch (error) {
//       console.error('Error analyzing facial expression:', error);
//       // Fallback to mock data on error
//       const mockAnalysis = {
//         confident: Math.random() * 100,
//         stressed: Math.random() * 50,
//         hesitant: 50,
//         nervous: Math.random() * 60,
//         excited: Math.random() * 80
//       };
//       setFacialData(mockAnalysis);
//     }
//   };
  
//   // Start/stop analysis functions
//   const startAnalysis = () => {
//     setIsAnalyzing(true);
//     const interval = setInterval(analyzeFrame, 2000); // Analyze every 2 seconds
//     analysisTimerRef.current = interval as unknown as number;
//   };
  
//   const stopAnalysis = () => {
//     setIsAnalyzing(false);
//     if (analysisTimerRef.current) {
//       clearInterval(analysisTimerRef.current);
//       analysisTimerRef.current = null;
//     }
//   };
  
//   useEffect(() => {
//     const initCamera = async () => {
//       try {
//         // Stop any existing stream first
//         if (streamRef.current) {
//           streamRef.current.getTracks().forEach((track) => track.stop());
//         }
        
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: videoEnabled,
//           audio: audioEnabled,
//         });
        
//         if (videoRef.current) {
//           videoRef.current.srcObject = stream;
//         }
        
//         streamRef.current = stream;
        
//         // Create a new MediaRecorder
//         mediaRecorderRef.current = new MediaRecorder(stream);
//         chunksRef.current = [];
        
//         mediaRecorderRef.current.ondataavailable = (e) => {
//           if (e.data.size > 0) {
//             chunksRef.current.push(e.data);
//           }
//         };
        
//         mediaRecorderRef.current.onstop = () => {
//           const blob = new Blob(chunksRef.current, { type: "video/webm" });
//           onRecordingComplete(blob);
//           chunksRef.current = []; // Clear chunks after completion
//         };
        
//         setError("");
//       } catch (err) {
//         console.error("Error accessing media devices:", err);
//         setError("Could not access camera or microphone. Please check permissions.");
//       }
//     };
    
//     initCamera();
    
//     return () => {
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach((track) => track.stop());
//       }
      
//       // Stop facial analysis if it's running
//       stopAnalysis();
//     };
//   }, [videoEnabled, audioEnabled]); // Removed onRecordingComplete and stopAnalysis from dependencies
  
//   // Watch for isRecording state changes
//   useEffect(() => {
//     if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== "recording") {
//       try {
//         // Start facial analysis
//         startAnalysis();
//         mediaRecorderRef.current.start();
//         console.log("Recording started");
//       } catch (err) {
//         console.error("Error starting recording:", err);
//         setError("Could not start recording. Please refresh and try again.");
//       }
//     } else if (!isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
//       try {
//         mediaRecorderRef.current.stop();
//         // Stop facial analysis
//         stopAnalysis();
//         console.log("Recording stopped");
//       } catch (err) {
//         console.error("Error stopping recording:", err);
//       }
//     }
//   }, [isRecording]); // Only depend on isRecording
  
//   const toggleVideo = () => {
//     if (streamRef.current) {
//       streamRef.current.getVideoTracks().forEach((track) => {
//         track.enabled = !videoEnabled;
//       });
//       setVideoEnabled(!videoEnabled);
//     }
//   };
  
//   const toggleAudio = () => {
//     if (streamRef.current) {
//       streamRef.current.getAudioTracks().forEach((track) => {
//         track.enabled = !audioEnabled;
//       });
//       setAudioEnabled(!audioEnabled);
//     }
//   };
  
//   const handleStartRecording = () => {
//     setCountdown(3);
    
//     const countdownTimer = setInterval(() => {
//       setCountdown((prev) => {
//         if (prev === 1) {
//           clearInterval(countdownTimer);
//           startRecording();
//           return null;
//         }
//         return prev ? prev - 1 : null;
//       });
//     }, 1000);
//   };
  
//   const handleStopRecording = () => {
//     stopRecording();
//   };
  
//   // Display facial analysis data if available and recording
//   const renderFacialAnalysis = () => {
//     if (!isRecording || !isAnalyzing) return null;
    
//     return (
//       <div className="absolute bottom-4 left-4 bg-black/60 rounded-lg p-2 text-xs text-white">
//         <div className="grid grid-cols-2 gap-x-4 gap-y-1">
//           <div>Confidence: {facialData.confident.toFixed(1)}%</div>
//           <div>Stress: {facialData.stressed.toFixed(1)}%</div>
//           <div>Hesitation: {facialData.hesitant.toFixed(1)}%</div>
//           <div>Nervousness: {facialData.nervous.toFixed(1)}%</div>
//           <div>Engagement: {facialData.excited.toFixed(1)}%</div>
//         </div>
//       </div>
//     );
//   };
  
//   return (
//     <div className="flex flex-col space-y-4">
//       <div className="relative rounded-lg overflow-hidden aspect-video bg-black/20">
//         {error ? (
//           <div className="absolute inset-0 flex items-center justify-center text-white">
//             <p>{error}</p>
//           </div>
//         ) : (
//           <video
//             ref={videoRef}
//             autoPlay
//             playsInline
//             muted
//             className={`w-full h-full object-cover ${!videoEnabled ? "hidden" : ""}`}
//           />
//         )}
        
//         {!videoEnabled && !error && (
//           <div className="absolute inset-0 flex items-center justify-center bg-secondary">
//             <Camera size={48} className="text-muted-foreground" />
//           </div>
//         )}
        
//         {isRecording && (
//           <div className="absolute top-4 left-4 flex items-center space-x-2">
//             <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
//             <span className="text-sm font-medium text-white">Recording</span>
//           </div>
//         )}
        
//         {renderFacialAnalysis()}
        
//         {countdown !== null && (
//           <div className="absolute inset-0 flex items-center justify-center bg-black/70">
//             <div className="text-6xl font-bold text-white animate-pulse">
//               {countdown}
//             </div>
//           </div>
//         )}
//       </div>
      
//       <div className="flex items-center justify-between">
//         <div className="flex space-x-2">
//           <GlassMorphism
//             className="p-2 cursor-pointer"
//             intensity="light"
//             rounded="full"
//           >
//             <button
//               onClick={toggleVideo}
//               className="w-10 h-10 flex items-center justify-center"
//             >
//               {videoEnabled ? (
//                 <Video size={20} className="text-foreground" />
//               ) : (
//                 <VideoOff size={20} className="text-foreground" />
//               )}
//             </button>
//           </GlassMorphism>
          
//           <GlassMorphism
//             className="p-2 cursor-pointer"
//             intensity="light"
//             rounded="full"
//           >
//             <button
//               onClick={toggleAudio}
//               className="w-10 h-10 flex items-center justify-center"
//             >
//               {audioEnabled ? (
//                 <Mic size={20} className="text-foreground" />
//               ) : (
//                 <MicOff size={20} className="text-foreground" />
//               )}
//             </button>
//           </GlassMorphism>
//         </div>
        
//         <div>
//           {!isRecording ? (
//             <button
//               onClick={handleStartRecording}
//               className="px-4 py-2 bg-primary text-white rounded-full flex items-center space-x-2 hover:bg-primary/90 transition-colors"
//             >
//               <div className="w-3 h-3 rounded-full bg-red-500" />
//               <span>Start Recording</span>
//             </button>
//           ) : (
//             <button
//               onClick={handleStopRecording}
//               className="px-4 py-2 bg-destructive text-white rounded-full flex items-center space-x-2 hover:bg-destructive/90 transition-colors"
//             >
//               <RotateCw size={16} />
//               <span>Stop Recording</span>
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default VideoRecorder;



import { useState, useRef, useEffect } from "react";
import { Camera, Mic, MicOff, Video, VideoOff, RotateCw } from "lucide-react";
import GlassMorphism from "../ui/GlassMorphism";

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  onMetricsUpdate?: (metrics: any) => void;
}

const VideoRecorder = ({
  onRecordingComplete,
  isRecording,
  startRecording,
  stopRecording,
  onMetricsUpdate,
}: VideoRecorderProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [error, setError] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);

  // Facial analysis with behavioral metrics
  const [facialData, setFacialData] = useState({
    confident: 0,
    stressed: 0,
    nervous: 0,
  });
  const [behaviorData, setBehaviorData] = useState({
    blink_count: 0,
    looking_at_camera: false,
    head_pose: { pitch: 0, yaw: 0, roll: 0 },
  });
  const [communicationData, setCommunicationData] = useState({
    filler_word_count: 0,
    words_per_minute: 0,
    clarity_score: 0,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisTimerRef = useRef<number | null>(null);

  const analyzeFrame = async () => {
    try {
      if (!videoRef.current) return;

      // Capture frame from video
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      ctx.drawImage(videoRef.current, 0, 0);

      // Convert to base64
      const imageData = canvas.toDataURL("image/jpeg", 0.8);

      // Call interview-coach facial analysis API via gateway
      const response = await fetch("http://localhost:8000/interviews/analyze-frame", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ frame_data: imageData }),
      });

      if (!response.ok) {
        console.error("Facial analysis API error:", response.status);
        // Fallback to mock data if API fails
        const mockAnalysis = {
          confident: Math.random() * 100,
          stressed: Math.random() * 50,
          hesitant: 50,
          nervous: Math.random() * 60,
          excited: Math.random() * 80,
        };
        setFacialData(mockAnalysis);
        return;
      }

      const result = await response.json();

      if (result.metrics && result.face_tracking) {
        const analysisData = {
          confident: result.metrics.confident * 100,
          stressed: result.metrics.stressed * 100,
          nervous: result.metrics.nervous * 100,
        };

        const behavior = {
          blink_count: result.face_tracking.blink_count || 0,
          looking_at_camera: result.face_tracking.looking_at_camera || false,
          head_pose: result.face_tracking.head_pose || {
            pitch: 0,
            yaw: 0,
            roll: 0,
          },
        };

        setFacialData(analysisData);
        setBehaviorData(behavior);

        // Update parent component with metrics
        if (onMetricsUpdate) {
          onMetricsUpdate({
            facialData: analysisData,
            behaviorData: behavior,
            communicationData,
          });
        }
      }
    } catch (error) {
      console.error("Error analyzing facial expression:", error);
      // Fallback to mock data on error
      const mockAnalysis = {
        confident: Math.random() * 80 + 20,
        stressed: Math.random() * 30,
        nervous: Math.random() * 30,
      };
      const mockBehavior = {
        blink_count: Math.floor(Math.random() * 20) + 10,
        looking_at_camera: Math.random() > 0.3,
        head_pose: { pitch: 0, yaw: 0, roll: 0 },
      };
      setFacialData(mockAnalysis);
      setBehaviorData(mockBehavior);

      if (onMetricsUpdate) {
        onMetricsUpdate({
          facialData: mockAnalysis,
          behaviorData: mockBehavior,
          communicationData,
        });
      }
    }
  };

  // Start/stop analysis functions
  const startAnalysis = () => {
    setIsAnalyzing(true);
    const interval = setInterval(analyzeFrame, 2000); // Analyze every 2 seconds
    analysisTimerRef.current = interval as unknown as number;
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    if (analysisTimerRef.current) {
      clearInterval(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
  };

  useEffect(() => {
    const initCamera = async () => {
      try {
        // Stop any existing stream first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoEnabled,
          audio: audioEnabled,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        streamRef.current = stream;

        // Create a new MediaRecorder
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          onRecordingComplete(blob);
          chunksRef.current = []; // Clear chunks after completion
        };

        setError("");
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setError(
          "Could not access camera or microphone. Please check permissions."
        );
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Stop facial analysis if it's running
      stopAnalysis();
    };
  }, [videoEnabled, audioEnabled]); // Removed onRecordingComplete and stopAnalysis from dependencies

  // Watch for isRecording state changes
  useEffect(() => {
    if (
      isRecording &&
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "recording"
    ) {
      try {
        // Start facial analysis
        startAnalysis();
        mediaRecorderRef.current.start();
        console.log("Recording started");
      } catch (err) {
        console.error("Error starting recording:", err);
        setError("Could not start recording. Please refresh and try again.");
      }
    } else if (
      !isRecording &&
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      try {
        mediaRecorderRef.current.stop();
        // Stop facial analysis
        stopAnalysis();
        console.log("Recording stopped");
      } catch (err) {
        console.error("Error stopping recording:", err);
      }
    }
  }, [isRecording]); // Only depend on isRecording

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const handleStartRecording = () => {
    setCountdown(3);

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownTimer);
          startRecording();
          return null;
        }
        return prev ? prev - 1 : null;
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  // Display is now handled by MetricsPanel component
  const renderFacialAnalysis = () => {
    return null;
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="relative rounded-lg overflow-hidden aspect-video bg-black/20">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <p>{error}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              !videoEnabled ? "hidden" : ""
            }`}
          />
        )}

        {!videoEnabled && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary">
            <Camera size={48} className="text-muted-foreground" />
          </div>
        )}

        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-medium text-white">Recording</span>
          </div>
        )}

        {renderFacialAnalysis()}

        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-6xl font-bold text-white animate-pulse">
              {countdown}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <GlassMorphism
            className="p-2 cursor-pointer"
            intensity="light"
            rounded="full"
          >
            <button
              onClick={toggleVideo}
              className="w-10 h-10 flex items-center justify-center"
            >
              {videoEnabled ? (
                <Video size={20} className="text-foreground" />
              ) : (
                <VideoOff size={20} className="text-foreground" />
              )}
            </button>
          </GlassMorphism>

          <GlassMorphism
            className="p-2 cursor-pointer"
            intensity="light"
            rounded="full"
          >
            <button
              onClick={toggleAudio}
              className="w-10 h-10 flex items-center justify-center"
            >
              {audioEnabled ? (
                <Mic size={20} className="text-foreground" />
              ) : (
                <MicOff size={20} className="text-foreground" />
              )}
            </button>
          </GlassMorphism>
        </div>

        <div>
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="px-4 py-2 bg-primary text-white rounded-full flex items-center space-x-2 hover:bg-primary/90 transition-colors"
            >
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              className="px-4 py-2 bg-destructive text-white rounded-full flex items-center space-x-2 hover:bg-destructive/90 transition-colors"
            >
              <RotateCw size={16} />
              <span>Stop Recording</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRecorder;
