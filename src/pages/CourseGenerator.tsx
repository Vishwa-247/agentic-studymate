import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { API_GATEWAY_URL } from '@/configs/environment';
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import Container from "@/components/ui/Container";
import GlassMorphism from "@/components/ui/GlassMorphism";
import { cseSuggestions } from "@/data/cseSuggestions";
import { supabase } from "@/integrations/supabase/client";

const CourseGenerator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    listening: 0,
    reading: 0,
    interacting: 0,
    overall: 0
  });
  const [currentStep, setCurrentStep] = useState('');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

  // Subscribe to realtime progress updates
  useEffect(() => {
    if (!courseId) return;

    const startTimeKey = `course_gen_start_${courseId}`;
    const startTime = Date.now();
    localStorage.setItem(startTimeKey, startTime.toString());
    
    // Start elapsed time counter
    const timeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    const channel = supabase
      .channel('course-generation-progress')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'course_generation_jobs',
          filter: `course_id=eq.${courseId}`
        },
        (payload: any) => {
          const progress = payload.new.progress || 0;
          const status = payload.new.status;
          const step = payload.new.current_step || "";

          // Calculate estimated remaining time based on progress
          if (progress > 0 && progress < 100) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const estimatedTotal = Math.ceil((elapsed / progress) * 100);
            const remaining = Math.max(0, estimatedTotal - elapsed);
            setEstimatedTime(remaining);
          }

          // Map backend steps to learning modes (functional update avoids stale closure)
          const stepLower = step.toLowerCase();
          setGenerationProgress((prev) => {
            const updatedProgress = { ...prev };

            if (stepLower.includes('audio') || stepLower.includes('listening') || stepLower.includes('podcast') || stepLower.includes('lecture') || stepLower.includes('script')) {
              updatedProgress.listening = Math.min(progress, 100);
            } else if (stepLower.includes('reading') || stepLower.includes('chapter') || stepLower.includes('outline') || stepLower.includes('structure') || stepLower.includes('article') || stepLower.includes('notes')) {
              updatedProgress.reading = Math.min(progress, 100);
            } else if (stepLower.includes('interacting') || stepLower.includes('quiz') || stepLower.includes('flashcard') || stepLower.includes('game') || stepLower.includes('exercise') || stepLower.includes('resource') || stepLower.includes('suggestion') || stepLower.includes('practice')) {
              updatedProgress.interacting = Math.min(progress, 100);
            }

            updatedProgress.overall = progress;
            return updatedProgress;
          });
          setCurrentStep(step);

          if (status === 'completed' && progress >= 100) {
            clearInterval(timeInterval);
            setIsGenerating(false);
            setLoading(false);
            setEstimatedTime(0);
            
            // Calculate generation duration
            const generationDuration = Math.floor((Date.now() - startTime) / 1000);
            localStorage.removeItem(startTimeKey);
            
            // Show success toast with stats
            toast.success("🎉 Course Ready!", {
              description: `Generated successfully in ${generationDuration}s`,
              duration: 5000,
            });
            
            // Navigate to My Courses after 1 second
            setTimeout(() => {
              navigate('/courses');
            }, 1000);
          } else if (status === 'failed') {
            clearInterval(timeInterval);
            setEstimatedTime(null);
            toast.error("Course generation failed");
            setIsGenerating(false);
            setLoading(false);
            localStorage.removeItem(startTimeKey);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(timeInterval);
      supabase.removeChannel(channel);
    };
  }, [courseId, navigate]);

  const handleGenerate = async () => {
    if (isGenerating) {
      toast.info("Course generation already in progress");
      return;
    }

    if (!user) {
      toast.error("Please sign in to generate courses");
      navigate('/auth');
      return;
    }

    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setLoading(true);
    setIsGenerating(true);
    setCurrentStep('Initializing course generation...');
    setElapsedTime(0);
    setEstimatedTime(null);

    try {
      const response = await fetch(`${API_GATEWAY_URL}/courses/generate-parallel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topic.trim(), userId: user.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate course');
      }

      const data = await response.json();
      setCourseId(data.courseId);
      
      // Store generation start time for duration calculation
      if (data.courseId) {
        localStorage.setItem(`course_gen_start_${data.courseId}`, Date.now().toString());
      }

      toast.success("Course generation started!");

    } catch (error: any) {
      console.error('Generation failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate course");
      setIsGenerating(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestionTitle: string) => {
    setTopic(suggestionTitle);
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground/90">
              What do you want to learn?
            </h1>
          </div>

          <GlassMorphism className="p-8">
            <div className="space-y-6">
              <div className="flex gap-3">
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Machine Learning, Web Development, Data Structures..."
                  className="flex-1 text-lg py-6"
                  disabled={loading || isGenerating}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && topic.trim() && !loading && !isGenerating) {
                      handleGenerate();
                    }
                  }}
                />
                <Button 
                  onClick={handleGenerate}
                  disabled={!topic.trim() || loading || isGenerating}
                  size="lg"
                  className="px-8"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  {loading ? "Creating..." : "Create Course"}
                </Button>
              </div>

              {/* CSE Topic Suggestions */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">📚 Suggested CSE Topics:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {cseSuggestions.map((suggestion, index) => (
                    <Card 
                      key={index}
                      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                      onClick={() => handleSuggestionClick(suggestion.title)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{suggestion.icon}</span>
                          <h3 className="font-semibold text-sm">{suggestion.title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {suggestion.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Inline Progress Display */}
              {isGenerating && (
                <div className="mt-6 p-6 border rounded-lg bg-muted/30 space-y-4">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Creating Your Course</h3>
                    <p className="text-sm text-muted-foreground">{currentStep}</p>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span>⏱️ Elapsed: {formatTime(elapsedTime)}</span>
                      {estimatedTime !== null && estimatedTime > 0 && (
                        <span>🕐 Est. remaining: {formatTime(estimatedTime)}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          🎧 Learn by Listening
                        </span>
                        <span className="text-muted-foreground">{Math.round(generationProgress.listening)}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${generationProgress.listening}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          📚 Learn by Reading
                        </span>
                        <span className="text-muted-foreground">{Math.round(generationProgress.reading)}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${generationProgress.reading}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          🎮 Learn by Interacting
                        </span>
                        <span className="text-muted-foreground">{Math.round(generationProgress.interacting)}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${generationProgress.interacting}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span>Overall Progress</span>
                        <span>{Math.round(generationProgress.overall)}%</span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden mt-2">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                          style={{ width: `${generationProgress.overall}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </GlassMorphism>
        </div>
      </Container>
    </div>
  );
};

export default CourseGenerator;
