-- Create storage bucket for resume files if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume-files',
  'resume-files', 
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Update user_resumes table to include storage path
ALTER TABLE user_resumes 
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'application/pdf';

-- Create interview sessions table for tracking different interview types
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('technical', 'aptitude', 'hr', 'mixed')),
  job_role TEXT,
  tech_stack TEXT,
  experience_level TEXT,
  resume_id UUID REFERENCES user_resumes(id),
  questions_data JSONB NOT NULL DEFAULT '[]',
  current_question_index INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_score NUMERIC(5,2) DEFAULT 0,
  max_possible_score NUMERIC(5,2) DEFAULT 0,
  feedback JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Interview responses table
CREATE TABLE IF NOT EXISTS interview_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  response_text TEXT,
  video_recording_path TEXT,
  audio_recording_path TEXT,
  response_time_seconds INTEGER,
  ai_analysis JSONB,
  confidence_score NUMERIC(3,2),
  facial_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for interview sessions
CREATE POLICY "Users can manage their own interview sessions"
ON interview_sessions
FOR ALL
USING (auth.uid() = user_id);

-- RLS policies for interview responses  
CREATE POLICY "Users can manage their own interview responses"
ON interview_responses
FOR ALL
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_type ON interview_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_interview_responses_session_id ON interview_responses(session_id);

-- Triggers for updated_at
CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON interview_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for interview recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interview-recordings',
  'interview-recordings',
  false,
  104857600, -- 100MB limit
  ARRAY['video/webm', 'video/mp4', 'audio/webm', 'audio/mp3', 'audio/wav']
)
ON CONFLICT (id) DO NOTHING;