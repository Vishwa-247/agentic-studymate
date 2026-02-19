-- Enable RLS on tables flagged by linter
ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent) for user_state
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_state' AND policyname='Users can view their own state'
  ) THEN
    CREATE POLICY "Users can view their own state"
    ON public.user_state
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_state' AND policyname='Users can insert their own state'
  ) THEN
    CREATE POLICY "Users can insert their own state"
    ON public.user_state
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_state' AND policyname='Users can update their own state'
  ) THEN
    CREATE POLICY "Users can update their own state"
    ON public.user_state
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_state' AND policyname='Users can delete their own state'
  ) THEN
    CREATE POLICY "Users can delete their own state"
    ON public.user_state
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policies (idempotent) for scores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scores' AND policyname='Users can view their own scores'
  ) THEN
    CREATE POLICY "Users can view their own scores"
    ON public.scores
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scores' AND policyname='Users can insert their own scores'
  ) THEN
    CREATE POLICY "Users can insert their own scores"
    ON public.scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scores' AND policyname='Users can update their own scores'
  ) THEN
    CREATE POLICY "Users can update their own scores"
    ON public.scores
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='scores' AND policyname='Users can delete their own scores'
  ) THEN
    CREATE POLICY "Users can delete their own scores"
    ON public.scores
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Policies (idempotent) for interactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interactions' AND policyname='Users can view their own interactions'
  ) THEN
    CREATE POLICY "Users can view their own interactions"
    ON public.interactions
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interactions' AND policyname='Users can insert their own interactions'
  ) THEN
    CREATE POLICY "Users can insert their own interactions"
    ON public.interactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interactions' AND policyname='Users can update their own interactions'
  ) THEN
    CREATE POLICY "Users can update their own interactions"
    ON public.interactions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='interactions' AND policyname='Users can delete their own interactions'
  ) THEN
    CREATE POLICY "Users can delete their own interactions"
    ON public.interactions
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;