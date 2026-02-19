-- Fix/extend orchestrator tables (idempotent)

CREATE TABLE IF NOT EXISTS public.user_state (
  user_id uuid PRIMARY KEY
);

ALTER TABLE public.user_state
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_module text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_interview_session_id uuid,
  ADD COLUMN IF NOT EXISTS last_interview_overall_score numeric,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_state' AND policyname='Users can view their own user_state') THEN
    CREATE POLICY "Users can view their own user_state" ON public.user_state FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_state' AND policyname='Users can insert their own user_state') THEN
    CREATE POLICY "Users can insert their own user_state" ON public.user_state FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_state' AND policyname='Users can update their own user_state') THEN
    CREATE POLICY "Users can update their own user_state" ON public.user_state FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_state_last_seen_at ON public.user_state (last_seen_at DESC);


CREATE TABLE IF NOT EXISTS public.orchestrator_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_module text NOT NULL,
  depth integer NOT NULL DEFAULT 1,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orchestrator_decisions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='orchestrator_decisions' AND policyname='Users can view their own orchestrator decisions') THEN
    CREATE POLICY "Users can view their own orchestrator decisions" ON public.orchestrator_decisions FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='orchestrator_decisions' AND policyname='Users can insert their own orchestrator decisions') THEN
    CREATE POLICY "Users can insert their own orchestrator decisions" ON public.orchestrator_decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orchestrator_decisions_user_created ON public.orchestrator_decisions (user_id, created_at DESC);


-- updated_at trigger helper (keep existing behavior if already present)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_state_updated_at ON public.user_state;
CREATE TRIGGER update_user_state_updated_at
BEFORE UPDATE ON public.user_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
