import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  Target,
  Briefcase,
  GraduationCap,
  Clock,
  Brain,
  Sparkles,
  CheckCircle2,
  Edit3
} from "lucide-react";

interface OnboardingData {
  target_role: string;
  primary_focus: string;
  experience_level: string;
  hours_per_week: number;
  learning_mode: string;
}

const STEPS = [
  {
    title: "What role are you targeting?",
    description: "Help us personalize your learning path",
    icon: Target,
    field: "target_role" as const,
    options: [
      { value: "backend", label: "Backend Engineer", icon: "🔧" },
      { value: "fullstack", label: "Fullstack Developer", icon: "⚡" },
      { value: "frontend", label: "Frontend Engineer", icon: "🎨" },
      { value: "data", label: "Data Engineer/Scientist", icon: "📊" },
      { value: "devops", label: "DevOps/SRE", icon: "🚀" },
      { value: "custom", label: "Custom", icon: "✏️" },
    ],
  },
  {
    title: "What's your primary focus right now?",
    description: "We'll prioritize exercises accordingly",
    icon: Briefcase,
    field: "primary_focus" as const,
    options: [
      { value: "interviews", label: "Cracking Interviews", icon: "🎯" },
      { value: "projects", label: "Building Real Projects", icon: "🏗️" },
      { value: "resume", label: "Improving Resume", icon: "📄" },
      { value: "dsa", label: "Mastering DSA", icon: "💻" },
      { value: "custom", label: "Custom", icon: "✏️" },
    ],
  },
  {
    title: "What's your experience level?",
    description: "This helps calibrate challenge difficulty",
    icon: GraduationCap,
    field: "experience_level" as const,
    options: [
      { value: "student", label: "Student / Learning", icon: "📚" },
      { value: "new_grad", label: "New Graduate (0-1 yr)", icon: "🎓" },
      { value: "junior", label: "Junior (1-3 yrs)", icon: "🌱" },
      { value: "mid", label: "Mid-level (3+ yrs)", icon: "⭐" },
      { value: "custom", label: "Custom", icon: "✏️" },
    ],
  },
  {
    title: "How many hours per week can you dedicate?",
    description: "We'll pace your learning accordingly",
    icon: Clock,
    field: "hours_per_week" as const,
    options: [
      { value: "5", label: "2-5 hours", icon: "⏰" },
      { value: "10", label: "6-10 hours", icon: "🕐" },
      { value: "20", label: "11-20 hours", icon: "⏱️" },
      { value: "30", label: "20+ hours", icon: "🔥" },
      { value: "custom", label: "Custom", icon: "✏️" },
    ],
  },
  {
    title: "How do you prefer to learn?",
    description: "We'll adapt content delivery to your style",
    icon: Brain,
    field: "learning_mode" as const,
    options: [
      { value: "reading", label: "Reading & Theory", icon: "📖" },
      { value: "practice", label: "Hands-on Practice", icon: "⌨️" },
      { value: "interactive", label: "Interactive Challenges", icon: "🎮" },
      { value: "mixed", label: "Mixed Approach", icon: "🔄" },
      { value: "custom", label: "Custom", icon: "✏️" },
    ],
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    target_role: "",
    primary_focus: "",
    experience_level: "",
    hours_per_week: 0,
    learning_mode: "",
  });
  
  // Track custom inputs for each field
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({
    target_role: "",
    primary_focus: "",
    experience_level: "",
    hours_per_week: "",
    learning_mode: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;
  
  // Get current selection value
  const currentValue = step.field === "hours_per_week" 
    ? formData.hours_per_week.toString() 
    : formData[step.field];
  
  // Check if custom is selected
  const isCustomSelected = currentValue === "custom";
  
  // Validation: either predefined option selected OR custom input filled
  const canProceed = step.field === "hours_per_week"
    ? (isCustomSelected ? customInputs.hours_per_week.trim() !== "" : formData.hours_per_week > 0)
    : (isCustomSelected ? customInputs[step.field].trim() !== "" : formData[step.field] !== "");

  const handleOptionSelect = (value: string) => {
    if (step.field === "hours_per_week") {
      if (value === "custom") {
        setFormData(prev => ({ ...prev, [step.field]: 0 }));
      } else {
        setFormData(prev => ({ ...prev, [step.field]: parseInt(value) }));
      }
    } else {
      setFormData(prev => ({ ...prev, [step.field]: value }));
    }
  };
  
  const handleCustomInput = (value: string) => {
    setCustomInputs(prev => ({ ...prev, [step.field]: value }));
  };

  const handleNext = () => {
    if (!canProceed) {
      toast({
        title: "Please provide an answer",
        description: isCustomSelected 
          ? "Enter your custom answer to continue"
          : "Choose one option to continue",
        variant: "destructive",
      });
      return;
    }
    
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to complete onboarding",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Build final data object, using custom inputs where "custom" was selected
      const finalData: OnboardingData = {
        target_role: formData.target_role === "custom" 
          ? customInputs.target_role 
          : formData.target_role,
        primary_focus: formData.primary_focus === "custom"
          ? customInputs.primary_focus
          : formData.primary_focus,
        experience_level: formData.experience_level === "custom"
          ? customInputs.experience_level
          : formData.experience_level,
        hours_per_week: formData.hours_per_week === 0 && customInputs.hours_per_week
          ? parseInt(customInputs.hours_per_week) || 0
          : formData.hours_per_week,
        learning_mode: formData.learning_mode === "custom"
          ? customInputs.learning_mode
          : formData.learning_mode,
      };
      
      const { error } = await supabase
        .from('user_onboarding' as any)
        .upsert({
          user_id: user.id,
          ...finalData,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Onboarding complete! 🎉",
        description: "Your personalized learning path is ready",
      });

      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Onboarding save error:", error);
      toast({
        title: "Failed to save",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepIcon = step.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/10 bg-background/80 backdrop-blur">
        <div className="container max-w-4xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <img
              src="/brand_logo.png"
              alt="Studymate"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Study<span className="text-primary">mate</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Personalizing your experience</span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-muted/30">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-xl animate-fade-up">
          <Card className="border-border shadow-xl bg-card">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <StepIcon className="w-7 h-7" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold">
                {step.title}
              </CardTitle>
              <CardDescription className="text-base">
                {step.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <RadioGroup
                value={currentValue}
                onValueChange={handleOptionSelect}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {step.options.map((option) => (
                  <Label
                    key={option.value}
                    htmlFor={`option-${option.value}`}
                    className={`
                      relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer
                      transition-all duration-200 hover:border-primary/50 hover:bg-primary/5
                      ${currentValue === option.value 
                        ? "border-primary bg-primary/10 shadow-sm" 
                        : "border-border bg-background"
                      }
                    `}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`option-${option.value}`}
                      className="sr-only"
                    />
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-medium text-foreground">
                      {option.label}
                    </span>
                    {currentValue === option.value && (
                      <CheckCircle2 className="w-5 h-5 text-primary absolute right-4" />
                    )}
                  </Label>
                ))}
              </RadioGroup>

              {/* Custom Input Field */}
              {isCustomSelected && (
                <div className="space-y-2 animate-fade-up border-2 border-primary/20 rounded-xl p-4 bg-primary/5">
                  <Label htmlFor="custom-input" className="flex items-center gap-2 text-sm font-medium">
                    <Edit3 className="h-4 w-4 text-primary" />
                    {step.field === "hours_per_week" 
                      ? "Enter number of hours per week"
                      : `Enter your custom ${step.field.replace(/_/g, ' ')}`
                    }
                  </Label>
                  <Input
                    id="custom-input"
                    type={step.field === "hours_per_week" ? "number" : "text"}
                    placeholder={
                      step.field === "hours_per_week"
                        ? "e.g., 15"
                        : step.field === "target_role"
                        ? "e.g., Mobile Developer"
                        : step.field === "primary_focus"
                        ? "e.g., System Design"
                        : step.field === "experience_level"
                        ? "e.g., Senior (5+ years)"
                        : "e.g., Video-based learning"
                    }
                    value={customInputs[step.field]}
                    onChange={(e) => handleCustomInput(e.target.value)}
                    className="bg-background"
                    autoFocus
                    min={step.field === "hours_per_week" ? "1" : undefined}
                    max={step.field === "hours_per_week" ? "168" : undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    {step.field === "hours_per_week"
                      ? "Enter a number between 1-168 hours"
                      : "Be specific to help us personalize your experience"
                    }
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-4">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!canProceed || isSubmitting}
                  className="flex-1"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : isLastStep ? (
                    <>
                      Complete Setup
                      <Sparkles className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`
                  h-2 rounded-full transition-all duration-300
                  ${index === currentStep 
                    ? "w-8 bg-primary" 
                    : index < currentStep 
                      ? "w-2 bg-primary/60" 
                      : "w-2 bg-muted"
                  }
                `}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
