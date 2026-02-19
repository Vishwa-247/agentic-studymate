-- Create DSA Feedbacks Table
CREATE TABLE public.dsa_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  problem_id TEXT NOT NULL,
  problem_name TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  time_spent INTEGER,
  struggled_areas TEXT[],
  detailed_feedback TEXT,
  ai_suggestions JSONB DEFAULT '{}'::jsonb,
  ai_resources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.dsa_feedbacks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own feedbacks"
  ON public.dsa_feedbacks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedbacks"
  ON public.dsa_feedbacks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedbacks"
  ON public.dsa_feedbacks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedbacks"
  ON public.dsa_feedbacks FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_dsa_feedbacks_updated_at
  BEFORE UPDATE ON public.dsa_feedbacks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();