-- Create course_audio table for storing audio scripts and URLs
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS course_audio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    audio_type TEXT NOT NULL, -- 'short_podcast' or 'full_lecture'
    script TEXT NOT NULL, -- Script text for browser TTS
    script_text TEXT, -- Legacy field, kept for compatibility
    audio_url TEXT, -- NULL if TTS failed, will use browser TTS
    transcript TEXT,
    voice_id TEXT DEFAULT '9BWtsMINqrJLrRacOk9x',
    voice_used TEXT DEFAULT 'Aria', -- Legacy field
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE course_audio ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view audio for their courses"
    ON course_audio FOR SELECT
    USING (
        course_id IN (
            SELECT id FROM courses WHERE user_id = auth.uid()
        )
    );

-- Create index
CREATE INDEX IF NOT EXISTS idx_course_audio_course ON course_audio(course_id);
CREATE INDEX IF NOT EXISTS idx_course_audio_type ON course_audio(course_id, audio_type);

-- Create function for updated_at trigger (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_course_audio_updated_at ON course_audio;
CREATE TRIGGER update_course_audio_updated_at
    BEFORE UPDATE ON course_audio
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

