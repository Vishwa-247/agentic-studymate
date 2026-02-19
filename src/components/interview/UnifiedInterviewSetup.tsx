// import { useState } from "react";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Brain, Users, Target, Clock, BookOpen, Lightbulb } from "lucide-react";

// interface UnifiedInterviewSetupProps {
//   type: 'technical' | 'aptitude' | 'hr';
//   onSubmit: (data: any) => void;
// }

// const UnifiedInterviewSetup = ({ type, onSubmit }: UnifiedInterviewSetupProps) => {
//   const [formData, setFormData] = useState({
//     jobRole: '',
//     experience: 'intermediate',
//     techStack: '',
//     questionCount: 5,
//     duration: 30
//   });

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSubmit(formData);
//   };

//   const getTips = () => {
//     switch (type) {
//       case 'technical':
//         return {
//           icon: Brain,
//           title: "Technical Interview Tips",
//           tips: [
//             "Think out loud while solving problems",
//             "Ask clarifying questions before answering",
//             "Explain your thought process step by step",
//             "Consider edge cases and optimization"
//           ]
//         };
//       case 'aptitude':
//         return {
//           icon: Target,
//           title: "Aptitude Test Tips",
//           tips: [
//             "Read questions carefully before answering",
//             "Manage your time effectively",
//             "Use elimination method for multiple choice",
//             "Show your working for calculations"
//           ]
//         };
//       case 'hr':
//         return {
//           icon: Users,
//           title: "HR Interview Tips",
//           tips: [
//             "Use the STAR method (Situation, Task, Action, Result)",
//             "Be authentic and honest in your responses",
//             "Prepare specific examples from your experience",
//             "Show enthusiasm and cultural fit"
//           ]
//         };
//     }
//   };

//   const tips = getTips();
//   const TipIcon = tips.icon;

//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//       {/* Left: Form */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <TipIcon className="h-5 w-5" />
//             {type === 'technical' && 'Technical Interview Setup'}
//             {type === 'aptitude' && 'Aptitude Test Setup'}
//             {type === 'hr' && 'HR Interview Setup'}
//           </CardTitle>
//           <CardDescription>
//             Configure your {type} interview preferences
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="jobRole">Job Role</Label>
//               <Input
//                 id="jobRole"
//                 placeholder={type === 'technical' ? "e.g., Software Engineer" : "e.g., Marketing Manager"}
//                 value={formData.jobRole}
//                 onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
//                 required
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="experience">Experience Level</Label>
//               <Select
//                 value={formData.experience}
//                 onValueChange={(value) => setFormData({ ...formData, experience: value })}
//               >
//                 <SelectTrigger>
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
//                   <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
//                   <SelectItem value="advanced">Advanced (5+ years)</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             {type === 'technical' && (
//               <div className="space-y-2">
//                 <Label htmlFor="techStack">Tech Stack</Label>
//                 <Input
//                   id="techStack"
//                   placeholder="e.g., React, Node.js, Python"
//                   value={formData.techStack}
//                   onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
//                   required
//                 />
//               </div>
//             )}

//             <div className="grid grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="questionCount" className="flex items-center gap-1">
//                   <BookOpen className="h-3.5 w-3.5" />
//                   Questions
//                 </Label>
//                 <Input
//                   id="questionCount"
//                   type="number"
//                   min="3"
//                   max="10"
//                   value={formData.questionCount}
//                   onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="duration" className="flex items-center gap-1">
//                   <Clock className="h-3.5 w-3.5" />
//                   Duration (min)
//                 </Label>
//                 <Input
//                   id="duration"
//                   type="number"
//                   min="15"
//                   max="60"
//                   step="15"
//                   value={formData.duration}
//                   onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
//                 />
//               </div>
//             </div>

//             <Button type="submit" className="w-full">
//               Start Interview
//             </Button>
//           </form>
//         </CardContent>
//       </Card>

//       {/* Right: Tips */}
//       <Card className="bg-primary/5">
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Lightbulb className="h-5 w-5 text-primary" />
//             {tips.title}
//           </CardTitle>
//           <CardDescription>
//             Best practices for a successful interview
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <ul className="space-y-3">
//             {tips.tips.map((tip, index) => (
//               <li key={index} className="flex items-start gap-3">
//                 <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary mt-0.5">
//                   {index + 1}
//                 </div>
//                 <span className="text-sm text-muted-foreground leading-relaxed">{tip}</span>
//               </li>
//             ))}
//           </ul>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default UnifiedInterviewSetup;


import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft } from "lucide-react";
import React, { useState } from "react";

interface UnifiedInterviewSetupProps {
  type: 'technical' | 'aptitude' | 'hr';
  onSubmit: (data: any) => void;
  onBack?: () => void;
}

const UnifiedInterviewSetup = ({ type, onSubmit, onBack }: UnifiedInterviewSetupProps) => {
  const [difficulty, setDifficulty] = useState("medium");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState("30");
  const [questionCount, setQuestionCount] = useState("15");
  const [industry, setIndustry] = useState("");
  const [positionLevel, setPositionLevel] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'aptitude') {
      onSubmit({
        difficulty,
        focusAreas: focusAreas.join(', '),
        timeLimit,
        questionCount
      });
    } else if (type === 'hr') {
      onSubmit({
        industry,
        positionLevel,
        companySize,
        experienceLevel
      });
    }
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const aptitudeTips = [
    { icon: "🎯", text: "Practice time management - aim to spend equal time on each question" },
    { icon: "📊", text: "Read questions carefully - aptitude tests often contain trick elements" },
    { icon: "💡", text: "Use elimination strategy for multiple choice questions" },
    { icon: "⚡", text: "Don't spend too much time on difficult questions - move on and return later" }
  ];

  const hrTips = [
    { icon: "🤝", text: "Use the STAR method: Situation, Task, Action, Result" },
    { icon: "💬", text: "Be honest and authentic - share real experiences" },
    { icon: "🎯", text: "Research the company culture and values beforehand" },
    { icon: "🌟", text: "Prepare examples that showcase your soft skills and teamwork" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {onBack && (
        <div className="lg:col-span-2 -mt-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      )}
      {/* Left: Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {type === 'aptitude' ? 'Aptitude Test Setup' : 'HR Interview Setup'}
          </CardTitle>
          <CardDescription>
            {type === 'aptitude' 
              ? 'Configure your aptitude test parameters'
              : 'Set up your HR interview session'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {type === 'aptitude' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Focus Areas</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Logical Reasoning', 'Quantitative', 'Verbal', 'Data Interpretation'].map(area => (
                      <Button
                        key={area}
                        type="button"
                        variant={focusAreas.includes(area) ? 'default' : 'outline'}
                        onClick={() => toggleFocusArea(area)}
                        className="justify-start"
                      >
                        {area}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Select value={timeLimit} onValueChange={setTimeLimit}>
                    <SelectTrigger id="timeLimit">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionCount">Number of Questions</Label>
                  <Select value={questionCount} onValueChange={setQuestionCount}>
                    <SelectTrigger id="questionCount">
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 questions</SelectItem>
                      <SelectItem value="15">15 questions</SelectItem>
                      <SelectItem value="20">20 questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it">Information Technology</SelectItem>
                      <SelectItem value="finance">Finance & Banking</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="positionLevel">Position Level</Label>
                  <Select value={positionLevel} onValueChange={setPositionLevel}>
                    <SelectTrigger id="positionLevel">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead / Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger id="companySize">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup (1-50)</SelectItem>
                      <SelectItem value="midsize">Mid-size (51-500)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (500+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">Your Experience</Label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger id="experienceLevel">
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-2">0-2 years</SelectItem>
                      <SelectItem value="2-5">2-5 years</SelectItem>
                      <SelectItem value="5+">5+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" size="lg">
              Start {type === 'aptitude' ? 'Test' : 'Interview'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right: Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Success</CardTitle>
          <CardDescription>
            {type === 'aptitude' 
              ? 'Maximize your aptitude test performance'
              : 'Ace your HR interview'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(type === 'aptitude' ? aptitudeTips : hrTips).map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <span className="text-2xl">{tip.icon}</span>
                <p className="text-sm">{tip.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedInterviewSetup;
