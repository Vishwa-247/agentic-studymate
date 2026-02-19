-- Migration: Create evaluator tables
-- Run this in Supabase SQL Editor or via migration

-- interactions: stores raw user answers
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    module TEXT NOT NULL,
    step_type TEXT NOT NULL DEFAULT 'core',
    user_answer TEXT NOT NULL,
    question TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- scores: stores evaluation metrics from LLM
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    module TEXT NOT NULL,
    clarity DOUBLE PRECISION,
    tradeoffs DOUBLE PRECISION,
    adaptability DOUBLE PRECISION,
    failure_awareness DOUBLE PRECISION,
    dsa_predict DOUBLE PRECISION,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- user_state: aggregated state for orchestrator (deterministic routing)
CREATE TABLE IF NOT EXISTS public.user_state (
    user_id UUID PRIMARY KEY,
    clarity_avg DOUBLE PRECISION DEFAULT 1.0,
    tradeoff_avg DOUBLE PRECISION DEFAULT 1.0,
    adaptability_avg DOUBLE PRECISION DEFAULT 1.0,
    failure_awareness_avg DOUBLE PRECISION DEFAULT 1.0,
    dsa_predict_skill DOUBLE PRECISION DEFAULT 1.0,
    next_module TEXT,
    last_update TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON public.scores(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON public.interactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scores_timestamp ON public.scores(timestamp DESC);
