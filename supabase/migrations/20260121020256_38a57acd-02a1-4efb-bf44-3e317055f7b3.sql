-- Milestone 2: Interview Journey Backend v1

-- 1) Extend existing interview_sessions (backwards compatible)
ALTER TABLE public.interview_sessions
  ADD COLUMN IF NOT EXISTS journey_state text NOT NULL DEFAULT 'INITIAL',
  ADD COLUMN IF NOT EXISTS journey_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS journey_mode text NOT NULL DEFAULT 'production_thinking',
  ADD COLUMN IF NOT EXISTS journey_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS journey_last_step_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS journey_completed_at timestamptz NULL;

-- 2) interview_turns (append-only journey event log)
CREATE TABLE IF NOT EXISTS public.interview_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  state text NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_turns_session_created
  ON public.interview_turns (session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_interview_turns_user_created
  ON public.interview_turns (user_id, created_at);

ALTER TABLE public.interview_turns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own interview turns" ON public.interview_turns;
CREATE POLICY "Users can view their own interview turns"
  ON public.interview_turns
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own interview turns" ON public.interview_turns;
CREATE POLICY "Users can insert their own interview turns"
  ON public.interview_turns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3) interview_metrics (one row per completed journey run)
CREATE TABLE IF NOT EXISTS public.interview_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  journey_version integer NOT NULL DEFAULT 1,
  clarification_habit numeric NOT NULL DEFAULT 0,
  structure numeric NOT NULL DEFAULT 0,
  tradeoff_awareness numeric NOT NULL DEFAULT 0,
  scalability_thinking numeric NOT NULL DEFAULT 0,
  failure_awareness numeric NOT NULL DEFAULT 0,
  adaptability numeric NOT NULL DEFAULT 0,
  overall_score numeric NOT NULL DEFAULT 0,
  notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_metrics_session_created
  ON public.interview_metrics (session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_interview_metrics_user_created
  ON public.interview_metrics (user_id, created_at);

ALTER TABLE public.interview_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own interview metrics" ON public.interview_metrics;
CREATE POLICY "Users can view their own interview metrics"
  ON public.interview_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own interview metrics" ON public.interview_metrics;
CREATE POLICY "Users can insert their own interview metrics"
  ON public.interview_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
