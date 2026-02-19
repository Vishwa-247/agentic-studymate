import { useState, useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';
import { CourseType } from '@/types';
import { API_GATEWAY_URL } from '@/configs/environment';
import { supabase } from '@/integrations/supabase/client';

interface CourseContent {
  summary: string;
  chapters: any[];
  [key: string]: any;
}

export const useCourseGeneration = () => {
  const [generationInBackground, setGenerationInBackground] = useState(false);
  const [courseGenerationId, setCourseGenerationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [generationStartTime, setGenerationStartTime] = useState<Date | null>(null);

  // Subscribe to real-time progress updates
  useEffect(() => {
    if (!courseGenerationId) return;

    const channel = supabase
      .channel('course-progress')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'course_generation_jobs',
          filter: `course_id=eq.${courseGenerationId}`
        },
        (payload) => {
          setProgress(payload.new.progress_percentage || 0);
          
          if (payload.new.status === 'completed') {
            setGenerationInBackground(false);
            setProgress(100);
            sonnerToast.success('Course Generated!', {
              description: 'Your course is ready to view',
            });
          } else if (payload.new.status === 'failed') {
            setGenerationInBackground(false);
            setError(payload.new.error_message || 'Generation failed');
            sonnerToast.error('Course generation failed', {
              description: payload.new.error_message || 'Please try again',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [courseGenerationId]);

  const startCourseGeneration = async (
    courseName: string,
    purpose: CourseType['purpose'],
    difficulty: CourseType['difficulty'],
    userId: string
  ): Promise<string> => {
    try {
      setError(null);
      setGenerationInBackground(true);
      setGenerationStartTime(new Date());
      setProgress(5);

      sonnerToast.info('Starting Course Generation', {
        description: 'Your course will be ready in ~40 seconds',
      });

      // Call real backend API
      const response = await fetch(`${API_GATEWAY_URL}/courses/generate-parallel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: courseName,
          userId: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate course');
      }

      const data = await response.json();
      const courseId = data.courseId;
      
      setCourseGenerationId(courseId);
      
      return courseId;
    } catch (error: any) {
      setError(error.message || 'Failed to start course generation');
      setGenerationInBackground(false);
      sonnerToast.error('Generation failed', {
        description: error.message || 'Please try again',
      });
      throw error;
    }
  };

  return {
    generationInBackground,
    courseGenerationId,
    error,
    progress,
    generationStartTime,
    setError,
    startCourseGeneration,
  };
};
