import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, GraduationCap } from "lucide-react";
import GlassMorphism from "@/components/ui/GlassMorphism";
import { CourseType } from "@/types";

interface CSECourseFormProps {
  onSubmit: (courseName: string, purpose: CourseType['purpose'], difficulty: CourseType['difficulty'], customPrompt?: string, includeExamPrep?: boolean) => void;
  isLoading: boolean;
}

const purposeOptions = [
  { value: "exam", label: "Exam Preparation", description: "Study for upcoming exams or assessments" },
  { value: "job_interview", label: "Interview Prep", description: "Prepare for technical interviews" },
  { value: "practice", label: "Skill Development", description: "Learn new concepts and improve understanding" },
  { value: "coding_preparation", label: "Coding Practice", description: "Focus on programming and DSA preparation" },
];

const difficultyOptions = [
  { value: "beginner", label: "Beginner", description: "Basic concepts and fundamentals" },
  { value: "intermediate", label: "Intermediate", description: "Standard university level topics" },
  { value: "advanced", label: "Advanced", description: "Complex topics and research level concepts" },
];

const CSECourseForm = ({ onSubmit, isLoading }: CSECourseFormProps) => {
  const [courseName, setCourseName] = useState<string>("");
  const [purpose, setPurpose] = useState<CourseType['purpose']>("exam");
  const [difficulty, setDifficulty] = useState<CourseType['difficulty']>("intermediate");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [includeExamPrep, setIncludeExamPrep] = useState<boolean>(true);
  const [showNonCSEWarning, setShowNonCSEWarning] = useState<boolean>(false);

  const handleCourseNameChange = (value: string) => {
    setCourseName(value);
    
    // Check if the topic seems to be non-CSE related
    const nonCSEKeywords = ['biology', 'chemistry', 'physics', 'history', 'geography', 'literature', 'arts', 'music', 'medical', 'civil', 'mechanical', 'electrical'];
    const isNonCSE = nonCSEKeywords.some(keyword => 
      value.toLowerCase().includes(keyword)
    );
    setShowNonCSEWarning(isNonCSE);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!courseName.trim()) return;
    
    if (showNonCSEWarning) {
      return; // Don't submit if it's a non-CSE topic
    }
    
    onSubmit(courseName, purpose, difficulty, customPrompt, includeExamPrep);
  };

  const isFormValid = courseName.trim() && !showNonCSEWarning;

  return (
    <GlassMorphism className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            CSE Course Generator
          </h2>
          <p className="text-muted-foreground">
            Generate comprehensive courses for Computer Science Engineering topics with exam preparation materials.
          </p>
        </div>

        {/* Course Topic Input */}
        <div className="space-y-2">
          <Label htmlFor="courseName" className="text-base font-medium">Course Topic</Label>
          <Input
            id="courseName"
            placeholder="e.g., Data Structures and Algorithms, Machine Learning, Operating Systems..."
            value={courseName}
            onChange={(e) => handleCourseNameChange(e.target.value)}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Enter any Computer Science Engineering topic you want to learn
          </p>
        </div>

        {showNonCSEWarning && (
          <Alert variant="destructive">
            <AlertDescription>
              This platform is specifically designed for Computer Science Engineering students. 
              Please enter a CSE-related topic like Data Structures, Algorithms, Machine Learning, etc.
            </AlertDescription>
          </Alert>
        )}

        {/* Purpose Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Course Purpose</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {purposeOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={purpose === option.value ? "default" : "outline"}
                className="h-auto p-4 flex flex-col items-start text-left"
                onClick={() => setPurpose(option.value as CourseType['purpose'])}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground mt-1">{option.description}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Difficulty Level</Label>
          <div className="grid grid-cols-3 gap-3">
            {difficultyOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={difficulty === option.value ? "default" : "outline"}
                className="h-auto p-3 flex flex-col items-center text-center"
                onClick={() => setDifficulty(option.value as CourseType['difficulty'])}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground mt-1">{option.description}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Exam Preparation Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="examPrep"
            checked={includeExamPrep}
            onChange={(e) => setIncludeExamPrep(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="examPrep" className="text-sm">
            Include exam preparation materials (MCQs, practice questions, mock tests)
          </Label>
        </div>

        {/* Custom Prompt */}
        <div className="space-y-2">
          <Label htmlFor="customPrompt" className="text-base font-medium">
            Additional Requirements (Optional)
          </Label>
          <Textarea
            id="customPrompt"
            placeholder="e.g., Focus on coding implementations, include real-world examples, emphasis on interview questions..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            className="w-full"
          />
        </div>

        <Button 
          type="submit" 
          disabled={!isFormValid || isLoading}
          className="w-full h-12 text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Course Layout...
            </>
          ) : (
            "Generate CSE Course"
          )}
        </Button>
      </form>
    </GlassMorphism>
  );
};

export default CSECourseForm;