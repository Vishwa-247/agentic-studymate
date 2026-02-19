
import { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { Loader2, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ContentGenerationStatusProps {
  isGenerating: boolean;
  title: string;
  startTime?: Date | null;
  progress: number;
  estimatedTime?: number; // in seconds
}

const ContentGenerationStatus = ({ 
  isGenerating,
  title, 
  startTime,
  progress,
  estimatedTime = 180 // 3 minutes = 180 seconds
}: ContentGenerationStatusProps) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  useEffect(() => {
    if (isGenerating && startTime) {
      const interval = setInterval(() => {
        const seconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        setElapsedTime(seconds);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isGenerating, startTime]);
  
  const getRemainingTime = () => {
    if (!startTime) return estimatedTime;
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const remaining = Math.max(0, estimatedTime - elapsed);
    return remaining;
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const remainingTime = getRemainingTime();
  
  if (!isGenerating) return null;
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {title}
        </CardTitle>
        <CardDescription>
          This process takes approximately {formatTime(estimatedTime)} to complete.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-sm">
            <span>{progress}% complete</span>
            {remainingTime > 0 && (
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-3.5 w-3.5 mr-1" />
                <span>Estimated {formatTime(remainingTime)} remaining</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentGenerationStatus;
