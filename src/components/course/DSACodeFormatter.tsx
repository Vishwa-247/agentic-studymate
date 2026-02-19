import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Play, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DSACodeFormatterProps {
  title: string;
  description?: string;
  code: string;
  language: string;
  difficulty?: "easy" | "medium" | "hard";
  complexity?: {
    time: string;
    space: string;
  };
  explanation?: string;
  testCases?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
}

const DSACodeFormatter = ({ 
  title, 
  description, 
  code, 
  language,
  difficulty = "medium",
  complexity,
  explanation,
  testCases 
}: DSACodeFormatterProps) => {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copied!",
        description: "The code has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "easy": return "bg-green-100 text-green-800 border-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-base leading-relaxed">
                {description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getDifficultyColor(difficulty)}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
            <Badge variant="outline">{language}</Badge>
          </div>
        </div>
        
        {complexity && (
          <div className="flex gap-4 mt-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Time Complexity:</span>
              <code className="ml-2 px-2 py-1 bg-muted rounded text-primary font-mono">
                {complexity.time}
              </code>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Space Complexity:</span>
              <code className="ml-2 px-2 py-1 bg-muted rounded text-primary font-mono">
                {complexity.space}
              </code>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Code Block */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Code Implementation</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="h-8 px-2"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-lg border bg-muted/50">
            <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed">
              <code className="language-javascript text-foreground whitespace-pre">
                {code}
              </code>
            </pre>
          </div>
        </div>

        {/* Explanation */}
        {explanation && (
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">Explanation</h4>
            <div className="text-sm text-muted-foreground leading-relaxed">
              {explanation.split('\n').map((line, index) => (
                <p key={index} className="mb-2 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Test Cases */}
        {testCases && testCases.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Test Cases</h4>
            <div className="space-y-3">
              {testCases.map((testCase, index) => (
                <div key={index} className="border rounded-lg p-3 bg-background">
                  <div className="text-sm space-y-2">
                    <div className="font-medium">Example {index + 1}:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">Input:</span>
                        <pre className="mt-1 p-2 bg-muted rounded font-mono text-sm">
                          {testCase.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Output:</span>
                        <pre className="mt-1 p-2 bg-muted rounded font-mono text-sm">
                          {testCase.output}
                        </pre>
                      </div>
                    </div>
                    {testCase.explanation && (
                      <div className="text-xs text-muted-foreground mt-2">
                        <span className="font-medium">Explanation:</span> {testCase.explanation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DSACodeFormatter;