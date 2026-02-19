import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useDSAProgress = () => {
  const { user } = useAuth();
  const [completedProblems, setCompletedProblems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Define functions BEFORE useEffect to avoid temporal dead zone
  const loadProgress = useCallback(async () => {
    if (!user) return;

    try {
      console.log('📚 Loading DSA progress from database...');
      // Use dsa_feedbacks table to determine completed problems
      const { data, error } = await supabase
        .from('dsa_feedbacks')
        .select('problem_name')
        .eq('user_id', user.id);

      if (error) throw error;

      const completed = new Set(data?.map(f => f.problem_name) || []);
      console.log(`✅ Loaded ${completed.size} completed problems`);
      setCompletedProblems(completed);
    } catch (error) {
      console.error('❌ Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!user) return;

    console.log('🔔 Setting up realtime subscription for DSA progress...');
    const channel = supabase
      .channel('dsa-feedback-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dsa_feedbacks',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('🔄 Feedback updated:', payload);
        loadProgress(); // Refresh progress
      })
      .subscribe();

    return () => {
      console.log('🔕 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user, loadProgress]);

  // Now use them in useEffect (after they're defined)
  useEffect(() => {
    if (user) {
      loadProgress();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [user, loadProgress, setupRealtimeSubscription]);

  // Open feedback form without saving yet
  const toggleProblemForFeedback = useCallback((problemName: string) => {
    if (!user) {
      toast.error('Please sign in to track progress');
      return { action: 'none', shouldShow: false } as const;
    }

    const isCurrentlyCompleted = completedProblems.has(problemName);
    if (isCurrentlyCompleted) {
      // Allow unchecking/editing
      return { action: 'uncheck', shouldShow: false } as const;
    }
    console.log('📝 Opening feedback form for:', problemName);
    return { action: 'show', shouldShow: true } as const;
  }, [user, completedProblems]);

  const uncheckProblem = useCallback(async (problemName: string) => {
    if (!user) return;
    try {
      console.log('❌ Unchecking problem:', problemName);
      const { error } = await supabase
        .from('dsa_feedbacks')
        .delete()
        .eq('user_id', user.id)
        .eq('problem_name', problemName);
      if (error) throw error;

      setCompletedProblems(prev => {
        const next = new Set(prev);
        next.delete(problemName);
        return next;
      });
      toast.success('Problem unmarked - you can give feedback again');
    } catch (e) {
      console.error('Failed to uncheck:', e);
      toast.error('Failed to unmark problem');
    }
  }, [user]);

  // Mark as completed locally after feedback submit
  const markAsCompleted = useCallback((problemName: string) => {
    setCompletedProblems(prev => {
      const next = new Set(prev);
      next.add(problemName);
      return next;
    });
  }, []);

  const toggleProblem = useCallback(async (
    problemName: string,
    problemId?: string,
    topicId?: string,
    companyId?: string
  ) => {
    if (!user) {
      toast.error('Please sign in to track progress');
      return;
    }

    const isCurrentlyCompleted = completedProblems.has(problemName);

    try {
      if (isCurrentlyCompleted) {
        console.log('❌ Unmarking problem as completed:', problemName);
        // Unmark as completed - delete feedback for this problem
        const { error } = await supabase
          .from('dsa_feedbacks')
          .delete()
          .eq('user_id', user.id)
          .eq('problem_name', problemName);

        if (error) throw error;

        setCompletedProblems(prev => {
          const newSet = new Set(prev);
          newSet.delete(problemName);
          return newSet;
        });

        toast.success('Progress updated');
      } else {
        console.log('✅ Marking problem as completed:', problemName);
        // Mark as completed - create a basic feedback entry
        const { error } = await supabase
          .from('dsa_feedbacks')
          .insert({
            user_id: user.id,
            problem_id: problemId || problemName.toLowerCase().replace(/\s+/g, '-'),
            problem_name: problemName,
            difficulty: 'Medium', // Default difficulty
            category: topicId || 'General',
            rating: 5, // Default high rating for completed problems
            time_spent: null,
            struggled_areas: [],
            detailed_feedback: 'Problem completed successfully',
            ai_suggestions: null,
            ai_resources: null
          });

        if (error) throw error;

        setCompletedProblems(prev => {
          const newSet = new Set(prev);
          newSet.add(problemName);
          return newSet;
        });

        toast.success('Problem marked as completed! 🎉');
        return true; // Return true to trigger feedback form
      }
    } catch (error) {
      console.error('❌ Failed to update progress:', error);
      toast.error('Failed to update progress');
    }

    return false;
  }, [user, completedProblems]);

  const isCompleted = useCallback((problemName: string) => {
    return completedProblems.has(problemName);
  }, [completedProblems]);

  return {
    completedProblems,
    loading,
    toggleProblem,
    toggleProblemForFeedback,
    uncheckProblem,
    markAsCompleted,
    isCompleted,
    refreshProgress: loadProgress
  };
};
