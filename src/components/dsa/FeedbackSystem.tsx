import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, MessageSquare, Play, Star, Video } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface Feedback {
  rating: number;
  timeSpent: number;
  struggledWith: string[];
  additionalFeedback: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
  relevanceScore: number;
}

interface FeedbackSystemProps {
  problemId: string;
  problemName: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  problemId,
  problemName,
  difficulty,
  category,
}) => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback>({
    rating: 0,
    timeSpent: 0,
    struggledWith: [],
    additionalFeedback: "",
  });
  const [recommendations, setRecommendations] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const struggledAreaOptions = [
    "Understanding the problem",
    "Algorithm design",
    "Implementation",
    "Edge cases",
    "Time complexity",
    "Space complexity",
    "Debugging",
    "Testing",
  ];

  useEffect(() => {
    if (feedback.rating > 0) {
      fetchRecommendations();
    }
  }, [feedback.rating]);

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "youtube-recommendations",
        {
          body: {
            problemName,
            category,
            difficulty,
            rating: feedback.rating,
            struggledWith: feedback.struggledWith,
          },
        }
      );

      if (error) throw error;
      setRecommendations(data?.videos || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedback.rating === 0) {
      toast.error("Please provide a rating");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error("Please sign in to submit feedback");
        return;
      }

      // Save feedback to database
      const { data: savedFeedback, error: dbError } = await supabase
        .from("dsa_feedbacks")
        .insert({
          user_id: currentUser.id,
          problem_id: problemId,
          problem_name: problemName,
          difficulty: difficulty,
          category: category,
          rating: feedback.rating,
          time_spent: feedback.timeSpent || null,
          struggled_areas: feedback.struggledWith,
          detailed_feedback: feedback.additionalFeedback,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Show loading toast for AI suggestions
      toast.info("Generating AI suggestions... This may take a few seconds");

      // Generate AI suggestions using backend API
      try {
        console.log('🚀 Submitting feedback to backend:', {
          feedback_id: savedFeedback.id,
          user_id: currentUser.id,
          problem_name: problemName,
          rating: feedback.rating
        });

        const response = await fetch('http://localhost:8000/api/dsa/feedback/generate-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback_id: savedFeedback.id,
            user_id: currentUser.id,
            problem_name: problemName,
            difficulty: difficulty,
            category: category,
            rating: feedback.rating,
            time_spent: feedback.timeSpent || null,
            struggled_areas: feedback.struggledWith,
            detailed_feedback: feedback.additionalFeedback,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ AI suggestions generated successfully:", result);
          toast.success("AI suggestions generated! Check your feedback history to see personalized recommendations");
        } else {
          const errorText = await response.text();
          console.error("❌ Error generating AI suggestions:", errorText);
          toast.error("Failed to generate AI suggestions. Please try again later");
        }
      } catch (error) {
        console.error("❌ Network error generating AI suggestions:", error);
        toast.error("Network error: Could not connect to AI service");
      }

      // Fetch YouTube recommendations from backend
      try {
        console.log('📺 Fetching YouTube recommendations from backend...');
        const response = await fetch('http://localhost:8000/api/dsa/feedback/youtube-recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            problemName,
            category,
            difficulty,
            rating: feedback.rating,
            struggledWith: feedback.struggledWith,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ YouTube recommendations fetched:", data.videos?.length || 0, "videos");
          setRecommendations(data?.videos || []);
        } else {
          console.error("❌ Error fetching YouTube recommendations");
          setRecommendations([]);
        }
      } catch (error) {
        console.error("❌ Network error fetching YouTube recommendations:", error);
        setRecommendations([]);
      }

      toast.success("Feedback saved! AI suggestions are being generated...");

      // Reset form
      setFeedback({
        rating: 0,
        timeSpent: 0,
        struggledWith: [],
        additionalFeedback: "",
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  };

  const toggleStruggleArea = (area: string) => {
    setFeedback((prev) => ({
      ...prev,
      struggledWith: prev.struggledWith.includes(area)
        ? prev.struggledWith.filter((a) => a !== area)
        : [...prev.struggledWith, area],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Feedback Form */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Share Your Experience
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Help us improve by sharing your experience with "{problemName}"
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Rating */}
          <div>
            <Label className="text-sm font-medium">
              How was your experience?
            </Label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFeedback((prev) => ({ ...prev, rating: star }))
                  }
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= feedback.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </Button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {feedback.rating > 0 && `${feedback.rating}/5 stars`}
              </span>
            </div>
          </div>

          {/* Time Spent */}
          <div>
            <Label htmlFor="timeSpent" className="text-sm font-medium">
              Time spent (minutes)
            </Label>
            <Input
              id="timeSpent"
              type="number"
              value={feedback.timeSpent}
              onChange={(e) =>
                setFeedback((prev) => ({
                  ...prev,
                  timeSpent: Number(e.target.value),
                }))
              }
              placeholder="How many minutes did you spend?"
              className="mt-1"
            />
          </div>

          {/* Struggled Areas */}
          <div>
            <Label className="text-sm font-medium">
              What areas did you struggle with?
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {struggledAreaOptions.map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={area}
                    checked={feedback.struggledWith.includes(area)}
                    onChange={() => toggleStruggleArea(area)}
                    className="rounded border-border"
                  />
                  <Label
                    htmlFor={area}
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    {area}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Feedback */}
          <div>
            <Label htmlFor="detailed-feedback" className="text-sm font-medium">
              Additional feedback (optional)
            </Label>
            <Textarea
              id="detailed-feedback"
              value={feedback.additionalFeedback}
              onChange={(e) =>
                setFeedback((prev) => ({
                  ...prev,
                  additionalFeedback: e.target.value,
                }))
              }
              placeholder="Share any additional thoughts, suggestions, or insights..."
              rows={3}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleSubmitFeedback}
            disabled={loading || feedback.rating === 0}
            className="w-full"
          >
            {loading
              ? "Submitting..."
              : "Submit Feedback & Get Recommendations"}
          </Button>
        </CardContent>
      </Card>

      {/* YouTube Recommendations */}
      {(recommendations.length > 0 || loadingRecommendations) && (
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Personalized Learning Recommendations
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Based on your feedback, here are some helpful resources
            </p>
          </CardHeader>
          <CardContent>
            {loadingRecommendations ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {recommendations.map((video) => (
                  <div
                    key={video.id}
                    className="flex gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded hover:bg-black/70 transition-colors">
                        <Play className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {video.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {video.channelTitle}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(video.relevanceScore * 100)}% match
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(video.url, "_blank")}
                          className="h-auto p-1 text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Watch
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
