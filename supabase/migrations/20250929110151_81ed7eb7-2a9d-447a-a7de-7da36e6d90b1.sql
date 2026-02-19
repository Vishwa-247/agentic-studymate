-- Fix RLS security issues for reference tables

-- Enable RLS on action_verbs_reference and star_examples_reference
ALTER TABLE public.action_verbs_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_examples_reference ENABLE ROW LEVEL SECURITY;

-- Create policies for action_verbs_reference (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view action verbs reference" 
ON public.action_verbs_reference 
FOR SELECT 
TO authenticated
USING (true);

-- Create policies for star_examples_reference (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view STAR examples reference" 
ON public.star_examples_reference 
FOR SELECT 
TO authenticated
USING (true);