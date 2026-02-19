-- Fix security warning: Function Search Path Mutable
DROP FUNCTION IF EXISTS public.calculate_profile_completion(UUID);

CREATE OR REPLACE FUNCTION public.calculate_profile_completion(user_profile_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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