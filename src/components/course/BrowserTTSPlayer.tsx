import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface BrowserTTSPlayerProps {
  script: string;
  title: string;
  audioType: 'short_podcast' | 'full_lecture';
}

export const BrowserTTSPlayer = ({ script, title, audioType }: BrowserTTSPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  // Check if Web Speech API is available
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Split script into sentences for better control
  const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakText = (text: string, index: number) => {
    if (!isSupported || !text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text.trim());
    
    // Configure voice settings - use current state values
    utterance.rate = rate; // Use current rate state
    utterance.pitch = 1.0;
    utterance.volume = volume; // Use current volume state

    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || 
      v.name.includes('Microsoft') || 
      v.name.includes('Zira') ||
      v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      if (index < sentences.length - 1) {
        // Continue to next sentence
        setCurrentIndex(index + 1);
        setTimeout(() => speakText(sentences[index + 1], index + 1), 200);
      } else {
        // Finished
        setIsPlaying(false);
        setCurrentIndex(0);
      }
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      setIsPlaying(false);
      toast({
        title: "Playback Error",
        description: "Failed to play audio. Please try again.",
        variant: "destructive",
      });
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const togglePlay = () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support text-to-speech. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    if (!script || script.trim().length < 50) {
      toast({
        title: "Script Too Short",
        description: "Audio script is too short.",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      // Pause
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    } else if (isPaused) {
      // Resume
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      // Start
      setCurrentIndex(0);
      setIsPlaying(true);
      setIsPaused(false);
      
      // Wait for voices to load (Chrome/Edge issue)
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          speakText(sentences[0], 0);
        };
      } else {
        speakText(sentences[0], 0);
      }
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
  };

  const handleRateChange = (value: number[]) => {
    const newRate = value[0];
    setRate(newRate);
    // If currently playing, cancel and restart with new rate
    if (isPlaying && utteranceRef.current) {
      const currentSentenceIndex = currentIndex; // Save current index
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      // Restart from current sentence with new rate
      setTimeout(() => {
        setIsPlaying(true);
        speakText(sentences[currentSentenceIndex], currentSentenceIndex);
      }, 100);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    // Update volume for current utterance if playing
    if (utteranceRef.current && isPlaying) {
      utteranceRef.current.volume = newVolume;
    }
  };

  const formatTime = () => {
    // Estimate based on script length (rough calculation)
    const wordsPerMinute = 150 * rate;
    const wordCount = script.split(/\s+/).length;
    const estimatedMinutes = Math.floor(wordCount / wordsPerMinute);
    const estimatedSeconds = Math.floor((wordCount % wordsPerMinute) / (wordsPerMinute / 60));
    return `${estimatedMinutes}:${estimatedSeconds.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p className="mb-2">Text-to-speech is not supported in your browser.</p>
          <p className="text-sm">Please use Chrome, Edge, or Safari for audio playback.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <div className="text-xs text-muted-foreground">
            Browser TTS • {formatTime()} estimated
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            size="lg"
            onClick={togglePlay}
            className="rounded-full h-12 w-12"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          {isPlaying && (
            <Button
              size="sm"
              variant="outline"
              onClick={stop}
            >
              Stop
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground w-20">Speed:</span>
            <Slider
              value={[rate]}
              min={0.5}
              max={2}
              step={0.1}
              onValueChange={handleRateChange}
              className="flex-1"
            />
            <span className="text-sm w-12 text-right">{rate.toFixed(1)}x</span>
          </div>

          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
            <span className="text-sm w-12 text-right">{Math.round(volume * 100)}%</span>
          </div>
        </div>

        {sentences.length > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            Sentence {currentIndex + 1} of {sentences.length}
          </div>
        )}

        {script && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-semibold mb-3">Script</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto">
              {script}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Note:</strong> This audio is generated using your browser's built-in text-to-speech.
            Quality may vary by browser. Works best in Chrome or Edge.
          </p>
        </div>
      </div>
    </Card>
  );
};

