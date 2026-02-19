-- Create resume_extractions table for temporary AI-extracted data
CREATE TABLE public.resume_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_id UUID REFERENCES public.user_resumes(id) ON DELETE CASCADE,
  extracted_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  extraction_type TEXT NOT NULL DEFAULT 'groq_ai',
  confidence_score NUMERIC(3,2) DEFAULT 0.85,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  applied_at TIMESTAMP WITH TIME ZONE NULL,
  applied_by UUID NULL
);

-- Enable Row Level Security
ALTER TABLE public.resume_extractions ENABLE ROW LEVEL SECURITY;

-- Create policies for resume extractions
CREATE POLICY "Users can view their own resume extractions"
ON public.resume_extractions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resume extractions"
ON public.resume_extractions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume extractions"
ON public.resume_extractions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume extractions"
ON public.resume_extractions
FOR DELETE
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_resume_extractions_user_id ON public.resume_extractions(user_id);
CREATE INDEX idx_resume_extractions_resume_id ON public.resume_extractions(resume_id);
CREATE INDEX idx_resume_extractions_status ON public.resume_extractions(status);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_resume_extractions_updated_at
BEFORE UPDATE ON public.resume_extractions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add completion tracking to profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS ai_suggestions JSONB;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_ai_analysis TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS profile_strength_score INTEGER DEFAULT 0;

-- Create profile analytics table for tracking user interactions
CREATE TABLE public.profile_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'profile_view', 'section_edit', 'ai_suggestion_applied', etc.
  section_name TEXT, -- 'personal_info', 'experience', 'education', etc.
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for profile analytics
ALTER TABLE public.profile_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for profile analytics
CREATE POLICY "Users can view their own analytics"
ON public.profile_analytics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
ON public.profile_analytics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add indexes
CREATE INDEX idx_profile_analytics_user_id ON public.profile_analytics(user_id);
CREATE INDEX idx_profile_analytics_action_type ON public.profile_analytics(action_type);
CREATE INDEX idx_profile_analytics_created_at ON public.profile_analytics(created_at);

-- Update resume processing status options
ALTER TABLE public.user_resumes ADD COLUMN IF NOT EXISTS ai_suggestions JSONB;
ALTER TABLE public.user_resumes ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending';

-- Add a function to calculate profile completion score
CREATE OR REPLACE FUNCTION public.calculate_profile_completion(user_profile_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion_score INTEGER := 0;
  profile_data RECORD;
  education_count INTEGER;
  experience_count INTEGER;
  project_count INTEGER;
  skill_count INTEGER;
  cert_count INTEGER;
BEGIN
  -- Get profile data
  SELECT * INTO profile_data FROM public.user_profiles WHERE user_id = user_profile_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Basic profile info (30 points)
  IF profile_data.full_name IS NOT NULL AND profile_data.full_name != '' THEN
    completion_score := completion_score + 10;
  END IF;
  
  IF profile_data.email IS NOT NULL AND profile_data.email != '' THEN
    completion_score := completion_score + 5;
  END IF;
  
  IF profile_data.phone IS NOT NULL AND profile_data.phone != '' THEN
    completion_score := completion_score + 5;
  END IF;
  
  IF profile_data.location IS NOT NULL AND profile_data.location != '' THEN
    completion_score := completion_score + 5;
  END IF;
  
  IF profile_data.professional_summary IS NOT NULL AND profile_data.professional_summary != '' THEN
    completion_score := completion_score + 5;
  END IF;
  
  -- Count related data
  SELECT COUNT(*) INTO education_count FROM public.user_education WHERE user_id = user_profile_id;
  SELECT COUNT(*) INTO experience_count FROM public.user_experience WHERE user_id = user_profile_id;
  SELECT COUNT(*) INTO project_count FROM public.user_projects WHERE user_id = user_profile_id;
  SELECT COUNT(*) INTO skill_count FROM public.user_skills WHERE user_id = user_profile_id;
  SELECT COUNT(*) INTO cert_count FROM public.user_certifications WHERE user_id = user_profile_id;
  
  -- Education (20 points)
  IF education_count > 0 THEN
    completion_score := completion_score + 20;
  END IF;
  
  -- Experience (25 points)
  IF experience_count > 0 THEN
    completion_score := completion_score + 25;
  END IF;
  
  -- Projects (15 points)
  IF project_count > 0 THEN
    completion_score := completion_score + 15;
  END IF;
  
  -- Skills (10 points)
  IF skill_count >= 3 THEN
    completion_score := completion_score + 10;
  ELSIF skill_count > 0 THEN
    completion_score := completion_score + 5;
  END IF;
  
  -- Update the profile with the calculated score
  UPDATE public.user_profiles 
  SET completion_percentage = completion_score,
      updated_at = now()
  WHERE user_id = user_profile_id;
  
  RETURN completion_score;
END;
$$;