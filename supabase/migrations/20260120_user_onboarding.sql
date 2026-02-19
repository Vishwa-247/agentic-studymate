-- Migration: Create user_onboarding table for onboarding flow
-- This table stores the 5 onboarding questions and completion status

CREATE TABLE IF NOT EXISTS public.user_onboarding (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    target_role TEXT NOT NULL,
    primary_focus TEXT NOT NULL,
    experience_level TEXT NOT NULL,
    hours_per_week INT DEFAULT 0,
    learning_mode TEXT NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own onboarding data
CREATE POLICY "Users can view their own onboarding" ON public.user_onboarding
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding" ON public.user_onboarding
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding" ON public.user_onboarding
    FOR UPDATE USING (auth.uid() = user_id);

-- Add updated_at trigger (uses existing function if available)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_user_onboarding_updated_at
            BEFORE UPDATE ON public.user_onboarding
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.user_onboarding TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.user_onboarding IS 'Stores user onboarding answers and completion status';
COMMENT ON COLUMN public.user_onboarding.target_role IS 'Backend, Fullstack, Frontend, Data, DevOps, Other';
COMMENT ON COLUMN public.user_onboarding.primary_focus IS 'Interviews, Projects, Resume, DSA';
COMMENT ON COLUMN public.user_onboarding.experience_level IS 'Student, New grad, Junior, Mid';
COMMENT ON COLUMN public.user_onboarding.hours_per_week IS 'Time commitment: 2-5, 6-10, 11-20, 20+';
COMMENT ON COLUMN public.user_onboarding.learning_mode IS 'Reading, Practice, Interactive, Mixed';
COMMENT ON COLUMN public.user_onboarding.completed_at IS 'NULL if onboarding not completed, timestamp when finished';
