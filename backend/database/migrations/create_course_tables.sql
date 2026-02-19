-- Course Generation Additional Tables Migration
-- Run this in Supabase SQL Editor

-- course_articles table
CREATE TABLE IF NOT EXISTS course_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    article_type TEXT NOT NULL, -- 'deep_dive', 'key_takeaways', 'faq'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    reading_time_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- course_word_games table
CREATE TABLE IF NOT EXISTS course_word_games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    incorrect_options TEXT[] NOT NULL,
    difficulty TEXT DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- course_suggestions table
CREATE TABLE IF NOT EXISTS course_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    suggestion_topic TEXT NOT NULL,
    suggestion_description TEXT,
    relevance_score INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- chapter_completion table for progress tracking
CREATE TABLE IF NOT EXISTS chapter_completion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    chapter_id UUID NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, chapter_id)
);

-- Enable RLS for all tables
ALTER TABLE course_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_word_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_completion ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for course_articles
CREATE POLICY "Users can view articles for their courses"
    ON course_articles FOR SELECT
    USING (
        course_id IN (
            SELECT id FROM courses WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for course_word_games
CREATE POLICY "Users can view word games for their courses"
    ON course_word_games FOR SELECT
    USING (
        course_id IN (
            SELECT id FROM courses WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for course_suggestions
CREATE POLICY "Users can view suggestions for their courses"
    ON course_suggestions FOR SELECT
    USING (
        course_id IN (
            SELECT id FROM courses WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for chapter_completion
CREATE POLICY "Users can manage their own chapter completions"
    ON chapter_completion FOR ALL
    USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_articles_course ON course_articles(course_id);
CREATE INDEX IF NOT EXISTS idx_course_word_games_course ON course_word_games(course_id);
CREATE INDEX IF NOT EXISTS idx_course_suggestions_course ON course_suggestions(course_id);
CREATE INDEX IF NOT EXISTS idx_chapter_completion_user_course ON chapter_completion(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_chapter_completion_chapter ON chapter_completion(chapter_id);

