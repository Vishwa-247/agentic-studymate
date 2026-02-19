import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircularScore } from "./CircularScore";
import { ChevronDown, ChevronUp, Star, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulletAnalysis {
  bullet: string;
  star_score: number;
  improvements: string[];
}

interface StarDeepDiveProps {
  bulletAnalysis: BulletAnalysis[];
  overallScore: number;
}

export const StarDeepDive: React.FC<StarDeepDiveProps> = ({ bulletAnalysis, overallScore }) => {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  if (!bulletAnalysis || bulletAnalysis.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <p>No bullet-point analysis available.</p>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.75) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 0.5) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getStarIcons = (score: number) => {
    const filledStars = Math.round(score * 4);
    return Array.from({ length: 4 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-3.5 h-3.5",
          i < filledStars ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
        )}
      />
    ));
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <Card className="p-4 bg-card border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground">STAR Method Deep Dive</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Analyzing {bulletAnalysis.length} bullet points for Situation-Task-Action-Result structure
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Overall</p>
              <p className="text-lg font-bold text-foreground">{Math.round(overallScore)}%</p>
            </div>
          </div>
        </div>
        {/* Distribution */}
        <div className="flex gap-2 mt-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {bulletAnalysis.filter(b => b.star_score >= 0.75).length} Strong
          </Badge>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {bulletAnalysis.filter(b => b.star_score >= 0.5 && b.star_score < 0.75).length} Needs Work
          </Badge>
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {bulletAnalysis.filter(b => b.star_score < 0.5).length} Weak
          </Badge>
        </div>
      </Card>

      {/* Individual bullets */}
      <div className="space-y-2">
        {bulletAnalysis.map((item, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <Card
              key={index}
              className={cn(
                "border transition-all cursor-pointer",
                isExpanded ? "shadow-sm" : "hover:shadow-sm",
                getScoreColor(item.star_score)
              )}
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
            >
              <div className="p-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                      {item.bullet}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex">{getStarIcons(item.star_score)}</div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded improvements */}
                {isExpanded && item.improvements && item.improvements.length > 0 && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      How to improve
                    </p>
                    {item.improvements.map((imp, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                        <p className="text-xs text-foreground/80 leading-relaxed">{imp}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
