
export type CourseType = {
  id: string;
  user_id: string;
  title: string;
  purpose: 'exam' | 'job_interview' | 'practice' | 'coding_preparation' | 'other';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  summary?: string;
  status?: string;
  progress_percentage?: number;
  completion_time_estimate?: number;
  created_at: string;
  content?: {
    status?: string;
    message?: string;
    lastUpdated?: string;
    parsedContent?: {
      summary?: string;
      chapters?: any[];
      flashcards?: any[];
      mcqs?: any[];
      qnas?: any[];
    };
    [key: string]: any;
  };
};

export type ChapterType = {
  id: string;
  course_id: string;
  title: string;
  content: string;
  order_number: number;
  estimated_reading_time?: number;
  created_at: string;
  updated_at: string;
};

export type FlashcardType = {
  id: string;
  course_id: string;
  question: string;
  answer: string;
  created_at: string;
};

export type McqType = {
  id: string;
  course_id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  created_at: string;
};

export type QnaType = {
  id: string;
  course_id: string;
  question: string;
  answer: string;
  created_at: string;
};

export type MockInterviewType = {
  id: string;
  user_id: string;
  job_role: string;
  tech_stack: string;
  experience: string;
  created_at: string;
  completed: boolean;
};

export type InterviewQuestionType = {
  id: string;
  interview_id: string;
  question: string;
  user_answer: string | null;
  order_number: number;
  created_at: string;
};

export type InterviewAnalysisType = {
  id: string;
  interview_id: string;
  facial_data: {
    confident: number;
    stressed: number;
    hesitant: number;
    nervous: number;
    excited: number;
  };
  pronunciation_feedback: string;
  technical_feedback: string;
  language_feedback: string;
  recommendations: {
    title: string;
    description: string;
    link?: string;
  }[];
  created_at: string;
};
