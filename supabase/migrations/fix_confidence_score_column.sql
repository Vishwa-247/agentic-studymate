-- Fix confidence_score column to properly handle 0-1 decimal range
-- This allows values like 0.8888 (0.0000 to 9.9999) which is perfect for confidence scores

-- Update the confidence_score column in resume_extractions table
ALTER TABLE public.resume_extractions 
ALTER COLUMN confidence_score TYPE NUMERIC(5,4);

-- Add comment to document the change
COMMENT ON COLUMN public.resume_extractions.confidence_score IS 'Confidence score in 0-1 range (e.g., 0.8888 for 88.88% confidence)';

-- Update any existing records to ensure they're within the new range
UPDATE public.resume_extractions 
SET confidence_score = LEAST(GREATEST(confidence_score, 0.0), 1.0)
WHERE confidence_score IS NOT NULL;
