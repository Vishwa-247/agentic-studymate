-- Create comprehensive course tables
CREATE TABLE public.courses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('exam', 'job_interview', 'practice', 'coding_preparation', 'other')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
    summary TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'published')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    completion_time_estimate INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.course_chapters (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_number INTEGER NOT NULL,
    estimated_reading_time INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(course_id, order_number)
);

CREATE TABLE public.course_flashcards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.course_mcqs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.course_qnas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.course_resources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('video', 'article', 'documentation', 'book', 'exercise')),
    url TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    duration INTEGER, -- in seconds for videos
    provider TEXT, -- e.g., 'youtube', 'documentation', 'external'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.course_progress (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
    flashcard_id UUID REFERENCES course_flashcards(id) ON DELETE CASCADE,
    mcq_id UUID REFERENCES course_mcqs(id) ON DELETE CASCADE,
    progress_type TEXT NOT NULL CHECK (progress_type IN ('chapter_read', 'flashcard_reviewed', 'mcq_answered', 'resource_viewed')),
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    score INTEGER, -- for MCQs
    time_spent INTEGER, -- in seconds
    UNIQUE(user_id, course_id, chapter_id, flashcard_id, mcq_id)
);

CREATE TABLE public.course_notebooks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
    key_concepts JSONB NOT NULL DEFAULT '[]',
    analogy TEXT,
    mind_map JSONB,
    study_guide TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_mcqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_qnas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_notebooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Users can view their own courses" 
ON public.courses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own courses" 
ON public.courses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own courses" 
ON public.courses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own courses" 
ON public.courses FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for course_chapters
CREATE POLICY "Users can view chapters of their courses" 
ON public.course_chapters FOR SELECT 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.user_id = auth.uid()));

CREATE POLICY "Users can manage chapters of their courses" 
ON public.course_chapters FOR ALL 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.user_id = auth.uid()));

-- RLS Policies for course_flashcards
CREATE POLICY "Users can view flashcards of their courses" 
ON public.course_flashcards FOR SELECT 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.user_id = auth.uid()));

CREATE POLICY "Users can manage flashcards of their courses" 
ON public.course_flashcards FOR ALL 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.user_id = auth.uid()));

-- RLS Policies for course_mcqs
CREATE POLICY "Users can view MCQs of their courses" 
ON public.course_mcqs FOR SELECT 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.user_id = auth.uid()));

CREATE POLICY "Users can manage MCQs of their courses" 
ON public.course_mcqs FOR ALL 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.user_id = auth.uid()));

-- RLS Policies for course_qnas
CREATE POLICY "Users can view QNAs of their courses" 
ON public.course_qnas FOR SELECT 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.user_id = auth.uid()));

CREATE POLICY "Users can manage QNAs of their courses" 
ON public.course_qnas FOR ALL 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.user_id = auth.uid()));

-- RLS Policies for course_resources
CREATE POLICY "Users can view resources of their courses" 
ON public.course_resources FOR SELECT 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.user_id = auth.uid()));

CREATE POLICY "Users can manage resources of their courses" 
ON public.course_resources FOR ALL 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.user_id = auth.uid()));

-- RLS Policies for course_progress  
CREATE POLICY "Users can view their own progress" 
ON public.course_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" 
ON public.course_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.course_progress FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for course_notebooks
CREATE POLICY "Users can view notebooks of their courses" 
ON public.course_notebooks FOR SELECT 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.user_id = auth.uid()));

CREATE POLICY "Users can manage notebooks of their courses" 
ON public.course_notebooks FOR ALL 
USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = course_id AND courses.user_id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_courses_user_id ON public.courses(user_id);
CREATE INDEX idx_course_chapters_course_id ON public.course_chapters(course_id);
CREATE INDEX idx_course_chapters_order ON public.course_chapters(course_id, order_number);
CREATE INDEX idx_course_flashcards_course_id ON public.course_flashcards(course_id);
CREATE INDEX idx_course_mcqs_course_id ON public.course_mcqs(course_id);
CREATE INDEX idx_course_qnas_course_id ON public.course_qnas(course_id);
CREATE INDEX idx_course_resources_course_id ON public.course_resources(course_id);
CREATE INDEX idx_course_progress_user_course ON public.course_progress(user_id, course_id);
CREATE INDEX idx_course_notebooks_course_id ON public.course_notebooks(course_id);

-- Create function to update course progress percentage
CREATE OR REPLACE FUNCTION public.update_course_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update course progress percentage based on completed chapters
    WITH chapter_progress AS (
        SELECT 
            c.id as course_id,
            COUNT(DISTINCT ch.id) as total_chapters,
            COUNT(DISTINCT cp.chapter_id) as completed_chapters
        FROM courses c
        LEFT JOIN course_chapters ch ON ch.course_id = c.id
        LEFT JOIN course_progress cp ON cp.course_id = c.id AND cp.chapter_id = ch.id AND cp.progress_type = 'chapter_read'
        WHERE c.id = COALESCE(NEW.course_id, OLD.course_id)
        GROUP BY c.id
    )
    UPDATE courses 
    SET 
        progress_percentage = CASE 
            WHEN cp.total_chapters = 0 THEN 0
            ELSE ROUND((cp.completed_chapters::DECIMAL / cp.total_chapters::DECIMAL) * 100)
        END,
        updated_at = now()
    FROM chapter_progress cp
    WHERE courses.id = cp.course_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic progress updates
CREATE TRIGGER update_course_progress_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.course_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_course_progress();

-- Create function to update updated_at timestamp
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_chapters_updated_at
    BEFORE UPDATE ON public.course_chapters
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_notebooks_updated_at
    BEFORE UPDATE ON public.course_notebooks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();