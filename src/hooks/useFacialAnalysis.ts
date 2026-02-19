/**
 * @deprecated This hook is no longer used.
 * Facial analysis is now handled server-side via the API gateway
 * (/interviews/analyze-frame) → interview-coach → interview_module.
 *
 * See MockInterview.tsx handleFaceFrame() for the current implementation.
 */

import { useState, useRef } from 'react';

const useFacialAnalysis = (_isActive: boolean = false, _interval: number = 3000) => {
  const [facialData] = useState({
    confident: 0,
    stressed: 0,
    hesitant: 0,
    nervous: 0,
    excited: 0,
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return {
    videoRef,
    facialData,
    isAnalyzing: false,
    startAnalysis: () => {},
    stopAnalysis: () => {},
    getAggregatedAnalysis: () => facialData,
  };
};

export default useFacialAnalysis;
