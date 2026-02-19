-- Create enhanced tables for Resume Analyzer Agent Overhaul

-- Resume analysis history table
CREATE TABLE public.resume_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_role TEXT NOT NULL,
  job_description TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  analysis_results JSONB NOT NULL DEFAULT '{}',
  action_verb_score NUMERIC DEFAULT 0,
  star_methodology_score NUMERIC DEFAULT 0,
  ats_score NUMERIC DEFAULT 0,
  overall_score NUMERIC DEFAULT 0,
  recommendations JSONB DEFAULT '[]',
  line_by_line_analysis JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resume_analysis_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for resume analysis history
CREATE POLICY "Users can view their own analysis history" 
ON public.resume_analysis_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis history" 
ON public.resume_analysis_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis history" 
ON public.resume_analysis_history 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis history" 
ON public.resume_analysis_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Action verbs reference table
CREATE TABLE public.action_verbs_reference (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verb TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  strength_score INTEGER NOT NULL DEFAULT 1,
  alternatives JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- STAR examples reference table  
CREATE TABLE public.star_examples_reference (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  situation TEXT NOT NULL,
  task TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  industry TEXT,
  role_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dedicated storage bucket for analyzer uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('analyzer-uploads', 'analyzer-uploads', false);

-- Storage policies for analyzer uploads
CREATE POLICY "Users can view their own analyzer uploads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'analyzer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own analyzer files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'analyzer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own analyzer uploads" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'analyzer-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updating timestamps
CREATE TRIGGER update_resume_analysis_history_updated_at
BEFORE UPDATE ON public.resume_analysis_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Populate action verbs reference data (sample data based on common categories)
INSERT INTO public.action_verbs_reference (verb, category, strength_score, alternatives) VALUES 
('achieved', 'Leadership', 5, '["accomplished", "attained", "realized"]'),
('managed', 'Leadership', 4, '["supervised", "directed", "oversaw"]'),
('led', 'Leadership', 5, '["guided", "spearheaded", "championed"]'),
('developed', 'Technical', 4, '["created", "built", "engineered"]'),
('implemented', 'Technical', 4, '["executed", "deployed", "established"]'),
('designed', 'Creative', 4, '["crafted", "conceptualized", "architected"]'),
('optimized', 'Analytical', 5, '["enhanced", "improved", "streamlined"]'),
('analyzed', 'Analytical', 3, '["evaluated", "assessed", "examined"]'),
('collaborated', 'Communication', 3, '["partnered", "coordinated", "facilitated"]'),
('presented', 'Communication', 3, '["delivered", "communicated", "demonstrated"]');

-- Populate STAR examples reference data (sample data)
INSERT INTO public.star_examples_reference (category, situation, task, action, result, industry, role_level) VALUES 
('Project Management', 'Team was struggling to meet quarterly deadlines', 'Improve project delivery timeline', 'Implemented agile methodology and daily standups', 'Reduced delivery time by 40% and improved team satisfaction', 'Technology', 'Mid-level'),
('Leadership', 'Department had low employee engagement scores', 'Boost team morale and productivity', 'Created mentorship program and monthly team building events', 'Increased engagement scores by 60% over 6 months', 'General', 'Senior-level'),
('Problem Solving', 'Customer complaints increased by 200%', 'Identify root cause and implement solution', 'Analyzed customer feedback data and redesigned user interface', 'Reduced complaints by 75% and improved customer satisfaction', 'Customer Service', 'Mid-level');