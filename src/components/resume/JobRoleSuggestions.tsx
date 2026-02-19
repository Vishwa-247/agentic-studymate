import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Code, Database, Brain, Cloud, TrendingUp } from "lucide-react";

interface JobRoleSuggestionsProps {
  onSelectRole: (role: string) => void;
}

const popularRoles = [
  {
    title: "Frontend Developer",
    icon: Code,
    description: "UI/UX focused development",
    keywords: ["React", "TypeScript", "CSS", "JavaScript"]
  },
  {
    title: "Backend Developer", 
    icon: Database,
    description: "Server-side development",
    keywords: ["Node.js", "Python", "APIs", "Databases"]
  },
  {
    title: "Full Stack Developer",
    icon: TrendingUp,
    description: "End-to-end development",
    keywords: ["React", "Node.js", "MongoDB", "APIs"]
  },
  {
    title: "Data Scientist",
    icon: Brain,
    description: "Data analysis and ML",
    keywords: ["Python", "Machine Learning", "Statistics", "SQL"]
  },
  {
    title: "DevOps Engineer",
    icon: Cloud,
    description: "Infrastructure and deployment",
    keywords: ["Docker", "AWS", "CI/CD", "Kubernetes"]
  },
  {
    title: "Product Manager",
    icon: Briefcase,
    description: "Product strategy and planning",
    keywords: ["Strategy", "Analytics", "Roadmapping", "Leadership"]
  }
];

export default function JobRoleSuggestions({ onSelectRole }: JobRoleSuggestionsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Popular Job Roles</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Quick select a common role or enter your own specific position
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {popularRoles.map((role) => {
          const IconComponent = role.icon;
          return (
            <Card
              key={role.title}
              className="cursor-pointer hover:shadow-md transition-shadow border-muted"
              onClick={() => onSelectRole(role.title)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <IconComponent className="h-5 w-5 text-primary" />
                  <h4 className="font-medium text-sm">{role.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {role.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {role.keywords.slice(0, 3).map((keyword) => (
                    <Badge 
                      key={keyword} 
                      variant="secondary" 
                      className="text-xs py-0 px-2"
                    >
                      {keyword}
                    </Badge>
                  ))}
                  {role.keywords.length > 3 && (
                    <Badge variant="outline" className="text-xs py-0 px-2">
                      +{role.keywords.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}