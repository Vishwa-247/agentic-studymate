-- Create exam preparation related tables for CSE courses

-- Course layout table for initial course structure
CREATE TABLE IF NOT EXISTS course_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  layout_data JSONB NOT NULL DEFAULT '{}',
  total_chapters INTEGER DEFAULT 0,
  estimated_duration INTEGER DEFAULT 0, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exam preparation materials
CREATE TABLE IF NOT EXISTS course_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('mock_test', 'chapter_test', 'final_exam', 'practice_quiz')),
  total_questions INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exam questions (enhanced from existing MCQs)
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES course_exams(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq', 'coding', 'short_answer', 'true_false')),
  options JSONB, -- For MCQ options
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  code_template TEXT, -- For coding questions
  test_cases JSONB, -- For coding questions
  marks INTEGER NOT NULL DEFAULT 1,
  difficulty TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student exam attempts
CREATE TABLE IF NOT EXISTS exam_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_id UUID NOT NULL REFERENCES course_exams(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC(5,2) DEFAULT 0,
  max_score NUMERIC(5,2) DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- in seconds
  answers JSONB NOT NULL DEFAULT '{}',
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Code submissions for coding questions
CREATE TABLE IF NOT EXISTS code_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'javascript',
  test_results JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'passed', 'failed', 'error')),
  execution_time INTEGER, -- in milliseconds
  memory_used INTEGER, -- in bytes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE course_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_layouts
CREATE POLICY "Users can manage layouts of their courses" 
ON course_layouts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_layouts.course_id 
    AND courses.user_id = auth.uid()
  )
);

-- RLS Policies for course_exams
CREATE POLICY "Users can manage exams of their courses" 
ON course_exams 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_exams.course_id 
    AND courses.user_id = auth.uid()
  )
);

-- RLS Policies for exam_questions
CREATE POLICY "Users can manage questions of their course exams" 
ON exam_questions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = exam_questions.course_id 
    AND courses.user_id = auth.uid()
  )
);

-- RLS Policies for exam_attempts
CREATE POLICY "Users can manage their own exam attempts" 
ON exam_attempts 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for code_submissions
CREATE POLICY "Users can manage their own code submissions" 
ON code_submissions 
FOR ALL 
USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_course_layouts_course_id ON course_layouts(course_id);
CREATE INDEX idx_course_exams_course_id ON course_exams(course_id);
CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX idx_exam_attempts_user_exam ON exam_attempts(user_id, exam_id);
CREATE INDEX idx_code_submissions_attempt ON code_submissions(attempt_id);

-- Triggers for updated_at
CREATE TRIGGER update_course_layouts_updated_at
  BEFORE UPDATE ON course_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_exams_updated_at
  BEFORE UPDATE ON course_exams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();