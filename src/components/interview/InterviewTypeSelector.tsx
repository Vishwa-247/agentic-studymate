import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Users, Calculator, Clock, Target } from "lucide-react";
import GlassMorphism from "@/components/ui/GlassMorphism";

interface InterviewType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  questionCount: number;
  difficulty: string;
  topics: string[];
}

const interviewTypes: InterviewType[] = [
  {
    id: "technical",
    name: "Technical Interview",
    description: "Programming concepts, algorithms, data structures, system design",
    icon: <Code className="h-6 w-6" />,
    duration: "45-60 mins",
    questionCount: 8,
    difficulty: "Medium to Hard",
    topics: ["DSA", "System Design", "Programming Languages", "Databases"]
  },
  {
    id: "aptitude", 
    name: "Aptitude Test",
    description: "Logical reasoning, quantitative aptitude, verbal ability",
    icon: <Calculator className="h-6 w-6" />,
    duration: "30-45 mins", 
    questionCount: 15,
    difficulty: "Easy to Medium",
    topics: ["Logical Reasoning", "Quantitative Aptitude", "Verbal Ability", "Analytical Skills"]
  },
  {
    id: "hr",
    name: "HR Interview", 
    description: "Behavioral questions, company culture fit, career goals",
    icon: <Users className="h-6 w-6" />,
    duration: "20-30 mins",
    questionCount: 6,
    difficulty: "Easy to Medium", 
    topics: ["Behavioral Questions", "Leadership", "Communication", "Career Goals"]
  }
];

interface InterviewTypeSelectorProps {
  onSelectType: (type: string) => void;
  selectedType?: string;
}

const InterviewTypeSelector = ({ onSelectType, selectedType }: InterviewTypeSelectorProps) => {
  return (
    <GlassMorphism className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Choose Interview Type</h2>
        <p className="text-muted-foreground">
          Select the type of interview you want to practice for. Each type focuses on different skills and competencies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {interviewTypes.map((type) => (
          <Card 
            key={type.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedType === type.id 
                ? "ring-2 ring-primary border-primary bg-primary/5" 
                : "hover:border-primary/50"
            }`}
            onClick={() => onSelectType(type.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {type.icon}
                </div>
                <CardTitle className="text-lg">{type.name}</CardTitle>
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {type.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {type.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    {type.questionCount} questions
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {type.difficulty}
                  </Badge>
                  <div className="flex flex-wrap gap-1">
                    {type.topics.slice(0, 3).map((topic, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {type.topics.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{type.topics.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedType && (
        <div className="mt-6 text-center">
          <Button 
            onClick={() => onSelectType(selectedType)}
            className="px-8 py-2"
          >
            Continue with {interviewTypes.find(t => t.id === selectedType)?.name}
          </Button>
        </div>
      )}
    </GlassMorphism>
  );
};

export default InterviewTypeSelector;
