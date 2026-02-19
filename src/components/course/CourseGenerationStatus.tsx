
import { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress";
import { Loader2, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

interface CourseGenerationStatusProps {
  courseId: string;
  title: string;
  progress: number;
  status: string;
  startTime?: string;
  errorMessage?: string;
}

const CourseGenerationStatus = ({ 
  courseId, 
  title, 
  progress, 
  status,
  startTime,
  errorMessage
}: CourseGenerationStatusProps) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  useEffect(() => {
    if ((status === 'generating' || status === 'generating_flashcards') && startTime) {
      const startDate = new Date(startTime);
      const interval = setInterval(() => {
        const seconds = Math.floor((new Date().getTime() - startDate.getTime()) / 1000);
        setElapsedTime(seconds);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [status, startTime]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const statusDisplay = () => {
    switch (status) {
      case "generating":
        return (
          <div className="flex items-center text-primary">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Generating with AI</span>
          </div>
        );
      case "generating_flashcards":
        return (
          <div className="flex items-center text-primary">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Enhancing with flashcards</span>
          </div>
        );
      case "complete":
        return (
          <div className="flex items-center text-primary">
            <span>Complete</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center text-destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>Failed</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Pending</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-muted-foreground">
            <span>Unknown</span>
          </div>
        );
    }
  };
  
  // Skip rendering if status is not provided
  if (!status) return null;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="flex justify-between">
          {statusDisplay()}
          {(status === 'generating' || status === 'generating_flashcards') && (
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>{formatTime(elapsedTime)}</span>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={progress} className="h-1.5" />
          
          {status === "error" && errorMessage && (
            <div className="text-sm text-destructive mt-2 mb-2">{errorMessage}</div>
          )}
          
          {status === 'complete' && (
            <div className="mt-4">
              <Button 
                variant="default"
                size="sm"
                className="w-full"
                asChild
              >
                <Link to={`/course/${courseId}`}>
                  View Course
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseGenerationStatus;
