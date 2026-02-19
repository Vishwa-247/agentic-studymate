-- ═══════════════════════════════════════════════════════════════
-- DSA Service Tables — Migrated from MongoDB to Supabase
-- ═══════════════════════════════════════════════════════════════

-- ── DSA Progress ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dsa_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  problem_name TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  difficulty TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, topic_id, problem_name)
);

CREATE INDEX IF NOT EXISTS idx_dsa_progress_user ON public.dsa_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_dsa_progress_topic ON public.dsa_progress(user_id, topic_id);

-- ── DSA Preferences ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dsa_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  filters JSONB DEFAULT '{}'::jsonb,
  favorites TEXT[] DEFAULT '{}',
  last_visited TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dsa_preferences_user ON public.dsa_preferences(user_id);

-- ── DSA Analytics ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dsa_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  total_problems INTEGER DEFAULT 0,
  solved_problems INTEGER DEFAULT 0,
  difficulty_stats JSONB DEFAULT '{}'::jsonb,
  category_stats JSONB DEFAULT '{}'::jsonb,
  streak_days INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dsa_analytics_user ON public.dsa_analytics(user_id);

-- ── Auto-update updated_at triggers ─────────────────────────
-- (Reuses the existing update_updated_at_column function)

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dsa_progress_updated_at') THEN
    CREATE TRIGGER update_dsa_progress_updated_at
      BEFORE UPDATE ON public.dsa_progress
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dsa_preferences_updated_at') THEN
    CREATE TRIGGER update_dsa_preferences_updated_at
      BEFORE UPDATE ON public.dsa_preferences
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_dsa_analytics_updated_at') THEN
    CREATE TRIGGER update_dsa_analytics_updated_at
      BEFORE UPDATE ON public.dsa_analytics
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;
