import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface AiSuggestionsProps {
  suggestions: string[];
  title?: string;
  className?: string;
  variant?: "default" | "compact";
}

export const AiSuggestions: React.FC<AiSuggestionsProps> = ({ 
  suggestions, 
  title = "AI Suggestions", 
  className,
  variant = "default"
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" />
          <h3>{title}</h3>
        </div>
      )}
      <ul className={cn("space-y-3", variant === "compact" && "space-y-2")}>
        {suggestions.map((suggestion, index) => (
          <li key={index} className="flex items-start gap-3 group">
            <div className="rounded-full bg-primary/10 p-1 mt-0.5 shrink-0 group-hover:bg-primary/20 transition-colors">
              <span className="block h-1.5 w-1.5 rounded-full bg-primary"></span>
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
              {suggestion}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
