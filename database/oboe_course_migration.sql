-- ================================
-- OBOE-STYLE COURSE TABLES MIGRATION
-- Run this in your Supabase SQL Editor
-- ================================

-- AUDIO TABLE (for TTS podcasts)
CREATE TABLE IF NOT EXISTS course_audio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    audio_type TEXT NOT NULL CHECK (audio_type IN ('short_podcast', 'full_lecture')),
    audio_url TEXT NOT NULL,
    script_text TEXT,
    duration_seconds INTEGER,
    voice_used TEXT DEFAULT 'Aria',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_audio_course_id ON course_audio(course_id);

ALTER TABLE course_audio ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view course audio"
ON course_audio FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = course_audio.course_id 
        AND courses.user_id = auth.uid()
    )
);

-- ARTICLES TABLE (for reading content)
CREATE TABLE IF NOT EXISTS course_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    article_type TEXT NOT NULL CHECK (article_type IN ('deep_dive', 'key_takeaways', 'faq')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    reading_time_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_articles_course_id ON course_articles(course_id);

ALTER TABLE course_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view course articles"
ON course_articles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = course_articles.course_id 
        AND courses.user_id = auth.uid()
    )
);

-- WORD GAME TABLE (for vocabulary games)
CREATE TABLE IF NOT EXISTS course_word_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    incorrect_options TEXT[] DEFAULT '{}',
    difficulty TEXT DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_word_games_course_id ON course_word_games(course_id);

ALTER TABLE course_word_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view word games"
ON course_word_games FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = course_word_games.course_id 
        AND courses.user_id = auth.uid()
    )
);

-- USER PROGRESS TABLE (for tracking)
CREATE TABLE IF NOT EXISTS user_course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    sections_completed JSONB DEFAULT '[]'::jsonb,
    quiz_scores JSONB DEFAULT '{}'::jsonb,
    flashcards_reviewed INTEGER DEFAULT 0,
    word_game_score INTEGER DEFAULT 0,
    audio_listened BOOLEAN DEFAULT false,
    articles_read TEXT[] DEFAULT '{}',
    last_accessed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_course_progress(course_id);

ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own progress"
ON user_course_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own progress"
ON user_course_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own progress"
ON user_course_progress FOR UPDATE
USING (auth.uid() = user_id);

-- CONTINUE LEARNING SUGGESTIONS
CREATE TABLE IF NOT EXISTS course_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    suggestion_topic TEXT NOT NULL,
    suggestion_description TEXT,
    relevance_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suggestions_course_id ON course_suggestions(course_id);

ALTER TABLE course_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view suggestions"
ON course_suggestions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = course_suggestions.course_id 
        AND courses.user_id = auth.uid()
    )
);

-- UPDATE COURSES TABLE
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS generation_duration_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_oboe_style BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS audio_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS articles_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS games_generated BOOLEAN DEFAULT false;

-- STORAGE BUCKET FOR COURSE AUDIO
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-audio', 'course-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY IF NOT EXISTS "Anyone can view course audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-audio');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload course audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-audio' 
  AND auth.role() = 'authenticated'
);

-- ENABLE REALTIME FOR PROGRESS TRACKING
ALTER TABLE course_generation_jobs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE course_generation_jobs;
