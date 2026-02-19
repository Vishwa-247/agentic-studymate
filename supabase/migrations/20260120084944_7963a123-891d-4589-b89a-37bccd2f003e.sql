-- Create user onboarding table (no FK to auth.users)
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  user_id UUID PRIMARY KEY,
  target_role TEXT NOT NULL,
  primary_focus TEXT NOT NULL,
  experience_level TEXT NOT NULL,
  hours_per_week INT NOT NULL DEFAULT 0,
  learning_mode TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Ensure we have a reusable updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_onboarding_updated_at'
  ) THEN
    CREATE TRIGGER trg_user_onboarding_updated_at
    BEFORE UPDATE ON public.user_onboarding
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_onboarding' AND policyname = 'Users can view their own onboarding'
  ) THEN
    CREATE POLICY "Users can view their own onboarding"
    ON public.user_onboarding
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_onboarding' AND policyname = 'Users can insert their own onboarding'
  ) THEN
    CREATE POLICY "Users can insert their own onboarding"
    ON public.user_onboarding
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_onboarding' AND policyname = 'Users can update their own onboarding'
  ) THEN
    CREATE POLICY "Users can update their own onboarding"
    ON public.user_onboarding
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_onboarding' AND policyname = 'Users can delete their own onboarding'
  ) THEN
    CREATE POLICY "Users can delete their own onboarding"
    ON public.user_onboarding
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;