import { supabase } from '@/integrations/supabase/client';
import { CourseType, ChapterType, FlashcardType, McqType, QnaType } from '../../types';

export interface CourseGenerationRequest {
  course_name: string;
  purpose: CourseType['purpose'];
  difficulty: CourseType['difficulty'];
  additional_requirements?: string;
}

export interface CourseGenerationResponse {
  course_id: string;
  status: string;
  message: string;
  estimated_completion_time?: number;
}

export interface CourseResource {
  id: string;
  course_id: string;
  chapter_id?: string;
  title: string;
  type: 'video' | 'article' | 'documentation' | 'book' | 'exercise';
  url: string;
  description?: string;
  thumbnail_url?: string;
  duration?: number;
  provider?: string;
  created_at: string;
}

export interface CourseNotebook {
  id: string;
  course_id: string;
  chapter_id?: string;
  key_concepts: Array<{ term: string; definition: string }>;
  analogy?: string;
  mind_map?: any;
  study_guide?: string;
  created_at: string;
  updated_at: string;
}

export interface ProgressTrackRequest {
  user_id: string;
  course_id: string;
  chapter_id?: string;
  flashcard_id?: string;
  mcq_id?: string;
  progress_type: 'chapter_read' | 'flashcard_reviewed' | 'mcq_answered' | 'resource_viewed';
  score?: number;
  time_spent?: number;
}

export const courseService = {
  async getCourses(): Promise<CourseType[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }

    return (data || []) as CourseType[];
  },

  async getCourse(courseId: string): Promise<CourseType> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch course: ${error.message}`);
    }

    return data as CourseType;
  },

  async getCourseChapters(courseId: string): Promise<ChapterType[]> {
    const { data, error } = await supabase
      .from('course_chapters')
      .select('*')
      .eq('course_id', courseId)
      .order('order_number', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch chapters: ${error.message}`);
    }

    return data || [];
  },

  async getCourseFlashcards(courseId: string): Promise<FlashcardType[]> {
    const { data, error } = await supabase
      .from('course_flashcards')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    return data || [];
  },

  async getCourseMcqs(courseId: string): Promise<McqType[]> {
    const { data, error } = await supabase
      .from('course_mcqs')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch MCQs: ${error.message}`);
    }

    return (data || []).map(mcq => ({
      ...mcq,
      options: Array.isArray(mcq.options) ? mcq.options as string[] : []
    })) as McqType[];
  },

  async getCourseQnas(courseId: string): Promise<QnaType[]> {
    const { data, error } = await supabase
      .from('course_qnas')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch Q&As: ${error.message}`);
    }

    return data || [];
  },

  async getCourseResources(courseId: string): Promise<CourseResource[]> {
    const { data, error } = await supabase
      .from('course_resources')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch resources: ${error.message}`);
    }

    return (data || []) as CourseResource[];
  },

  async getCourseNotebook(courseId: string, chapterId?: string): Promise<CourseNotebook | null> {
    let query = supabase
      .from('course_notebooks')
      .select('*')
      .eq('course_id', courseId);

    if (chapterId) {
      query = query.eq('chapter_id', chapterId);
    } else {
      query = query.is('chapter_id', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch notebook: ${error.message}`);
    }

    if (!data) return null;

    return {
      ...data,
      key_concepts: Array.isArray(data.key_concepts) ? data.key_concepts as Array<{ term: string; definition: string }> : []
    } as CourseNotebook;
  },

  async trackProgress(request: ProgressTrackRequest): Promise<void> {
    const { data, error } = await supabase
      .from('course_progress')
      .upsert({
        user_id: request.user_id,
        course_id: request.course_id,
        chapter_id: request.chapter_id,
        flashcard_id: request.flashcard_id,
        mcq_id: request.mcq_id,
        progress_type: request.progress_type,
        score: request.score,
        time_spent: request.time_spent,
        completed_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to track progress: ${error.message}`);
    }
  },

  async getCourseContent(courseId: string) {
    return this.getCourse(courseId);
  },

  async updateCourseProgress(courseId: string, progress: any) {
    return this.trackProgress({
      courseId,
      ...progress
    });
  }
};
