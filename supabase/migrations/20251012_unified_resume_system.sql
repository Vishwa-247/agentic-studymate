-- Migration: Unified Resume System
-- Add analysis tracking columns to user_resumes table
-- Link resume_analysis_history to user_resumes

-- Add analysis tracking columns to user_resumes
ALTER TABLE user_resumes
ADD COLUMN IF NOT EXISTS analysis_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS latest_analysis_id UUID REFERENCES resume_analysis_history(id);

-- Add resume_id column to resume_analysis_history to link back to the resume
ALTER TABLE resume_analysis_history
ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES user_resumes(id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_resume_analysis_resume_id 
ON resume_analysis_history(resume_id);

CREATE INDEX IF NOT EXISTS idx_user_resumes_user_id 
ON user_resumes(user_id);

CREATE INDEX IF NOT EXISTS idx_user_resumes_latest_analysis 
ON user_resumes(latest_analysis_id);

-- Add comment for documentation
COMMENT ON COLUMN user_resumes.analysis_count IS 'Number of times this resume has been analyzed';
COMMENT ON COLUMN user_resumes.last_analyzed_at IS 'Timestamp of the most recent analysis';
COMMENT ON COLUMN user_resumes.latest_analysis_id IS 'Foreign key to the most recent analysis in resume_analysis_history';
COMMENT ON COLUMN resume_analysis_history.resume_id IS 'Foreign key linking back to the resume file in user_resumes';
