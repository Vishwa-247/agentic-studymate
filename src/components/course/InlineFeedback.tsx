import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Star, Brain, Code, Target, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InlineFeedbackProps {
  isExpanded: boolean;
  onToggle: () => void;
  problemName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  company: string;
  onSubmit?: () => void;
}

const InlineFeedback = ({ isExpanded, onToggle, problemName, difficulty, company, onSubmit }: InlineFeedbackProps) => {
  const [experience, setExperience] = useState("");
  const [struggledAreas, setStruggledAreas] = useState<string[]>([]);
  const [detailedFeedback, setDetailedFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const experienceOptions = [
    { value: "very-easy", label: "Very Easy", icon: "😊", color: "text-green-600" },
    { value: "easy", label: "Easy", icon: "🙂", color: "text-green-500" },
    { value: "moderate", label: "Moderate", icon: "😐", color: "text-yellow-500" },
    { value: "challenging", label: "Challenging", icon: "😤", color: "text-orange-500" },
    { value: "very-hard", label: "Very Hard", icon: "😰", color: "text-red-500" }
  ];

  const struggleAreas = [
    "Algorithm Logic", "Data Structure Choice", "Edge Cases", "Time Complexity", 
    "Space Complexity", "Implementation", "Understanding Problem", "Debugging"
  ];

  const toggleStruggleArea = (area: string) => {
    setStruggledAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleSubmit = async () => {
    if (!experience) {
      toast({
        title: "Please select your experience level",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Map experience to rating (1-5)
      const experienceToRating: Record<string, number> = {
        "very-easy": 5,
        "easy": 4,
        "moderate": 3,
        "challenging": 2,
        "very-hard": 1
      };

      const rating = experienceToRating[experience] || 3;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to submit feedback",
          variant: "destructive"
        });
        return;
      }

      // Save feedback to database
      const { data: savedFeedback, error: dbError } = await supabase
        .from('dsa_feedbacks')
        .insert({
          user_id: user.id,
          problem_id: problemName.toLowerCase().replace(/\s+/g, '-'),
          problem_name: problemName,
          difficulty: difficulty.toLowerCase(),
          category: company,
          rating: rating,
          time_spent: null,
          struggled_areas: struggledAreas,
          detailed_feedback: detailedFeedback || `Experience: ${experience}`
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Generate AI suggestions using backend API
      console.log('🚀 Submitting feedback to backend:', {
        feedback_id: savedFeedback.id,
        user_id: user.id,
        problem_name: problemName,
        rating: experience
      });

      try {
        const response = await fetch('http://localhost:8000/api/dsa/feedback/generate-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback_id: savedFeedback.id,
            user_id: user.id,
            problem_name: problemName,
            difficulty: difficulty,
            category: company,
            rating: experience === 'very-easy' ? 5 : experience === 'easy' ? 4 : experience === 'medium' ? 3 : experience === 'hard' ? 2 : 1,
            time_spent: null,
            struggled_areas: struggledAreas,
            detailed_feedback: detailedFeedback,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ AI suggestions generated successfully:", result);
        } else {
          const errorText = await response.text();
          console.error("❌ Error generating AI suggestions:", errorText);
          toast({
            title: "Warning",
            description: "Feedback saved but AI suggestions failed. Please check your API keys.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("❌ Network error generating AI suggestions:", error);
        toast({
          title: "Warning",
          description: "Feedback saved but AI suggestions failed. Please check your API keys.",
          variant: "destructive"
        });
      }

      toast({
        title: "Feedback submitted successfully!",
        description: "AI suggestions are being generated. Check the Feedback tab shortly.",
      });

      // Reset form
      setExperience("");
      setStruggledAreas([]);
      setDetailedFeedback("");
      onSubmit?.();
      onToggle();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Failed to submit feedback",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBoilerplateSuggestions = () => {
    const suggestions = [];

    if (struggledAreas.includes("Algorithm Logic")) {
      suggestions.push("💡 Break down the problem into smaller steps before coding");
    }
    if (struggledAreas.includes("Data Structure Choice")) {
      suggestions.push("📚 Review common data structures and their use cases");
    }
    if (struggledAreas.includes("Time Complexity")) {
      suggestions.push("⚡ Practice analyzing time complexity with Big O notation");
    }
    if (struggledAreas.includes("Edge Cases")) {
      suggestions.push("🔍 Always consider empty inputs, single elements, and boundary conditions");
    }

    return suggestions;
  };

  return (
    <div className="space-y-2">
      {/* Toggle Header */}
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow border-primary/20"
        onClick={onToggle}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Share Your Experience</span>
              <Badge variant="outline" className="text-xs">
                {difficulty}
              </Badge>
            </div>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardContent>
      </Card>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Problem Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">{problemName}</h4>
                <Badge variant="secondary" className="text-xs">{company}</Badge>
              </div>

              {/* Experience Rating */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">How was your experience?</Label>
                <RadioGroup value={experience} onValueChange={setExperience}>
                  {experienceOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className={`text-sm cursor-pointer ${option.color}`}>
                        <span className="mr-2">{option.icon}</span>
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Struggle Areas */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">What areas did you struggle with?</Label>
                <div className="flex flex-wrap gap-2">
                  {struggleAreas.map(area => (
                    <Button
                      key={area}
                      variant={struggledAreas.includes(area) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStruggleArea(area)}
                      className="justify-start text-xs h-8"
                    >
                      {area}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Boilerplate Suggestions */}
              {struggledAreas.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Personalized Learning Suggestions
                  </Label>
                  <div className="space-y-2">
                    {getBoilerplateSuggestions().map((suggestion, index) => (
                      <div key={index} className="p-3 bg-primary/5 rounded-lg border-l-4 border-primary">
                        <p className="text-xs text-muted-foreground">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Feedback */}
              <div className="space-y-3">
                <Label htmlFor="detailed-feedback" className="text-sm font-medium">
                  Additional Comments (Optional)
                </Label>
                <Textarea
                  id="detailed-feedback"
                  placeholder="Share your thoughts about this problem..."
                  value={detailedFeedback}
                  onChange={(e) => setDetailedFeedback(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={onToggle} size="sm" className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  size="sm"
                  className="flex-1"
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InlineFeedback;
