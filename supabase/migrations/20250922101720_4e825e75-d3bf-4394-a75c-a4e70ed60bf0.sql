-- Phase 1: Database Schema Updates and User Settings

-- Create user_settings table for API keys and preferences
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_api_key TEXT,
  preferred_difficulty TEXT DEFAULT 'intermediate',
  preferred_language TEXT DEFAULT 'en',
  theme_preference TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_settings
CREATE POLICY "Users can manage their own settings" ON user_settings
FOR ALL USING (auth.uid() = user_id);

-- Create course_generation_jobs for tracking background generation
CREATE TABLE course_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  job_type TEXT NOT NULL, -- course_creation, content_generation, resource_finding
  progress_percentage INTEGER DEFAULT 0,
  current_step TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on course_generation_jobs
ALTER TABLE course_generation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for course_generation_jobs
CREATE POLICY "Users can view their own generation jobs" ON course_generation_jobs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage all generation jobs" ON course_generation_jobs
FOR ALL USING (auth.role() = 'service_role');

-- Update courses table to add more fields
ALTER TABLE courses ADD COLUMN IF NOT EXISTS generation_job_id UUID REFERENCES course_generation_jobs(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_time_estimate INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- Create agent_logs table for debugging and monitoring
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE CASCADE,
  log_level TEXT NOT NULL DEFAULT 'info', -- debug, info, warn, error
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on agent_logs
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_logs
CREATE POLICY "Users can view logs for their courses" ON agent_logs
FOR SELECT USING (auth.uid() = user_id);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_generation_jobs_updated_at
  BEFORE UPDATE ON course_generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create user settings on signup
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create user settings when user signs up
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings();