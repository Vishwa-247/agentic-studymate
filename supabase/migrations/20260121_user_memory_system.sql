-- Migration: User Memory System
-- Created: 2026-01-21
-- Purpose: Supabase-based memory for orchestrator (alternative to Zep)

-- ============================================================
-- TABLE: user_memory
-- Stores individual events/observations about user behavior
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- What happened
    event_type TEXT NOT NULL,  -- 'interview_completed', 'course_finished', 'weakness_detected', 'improvement'
    module TEXT NOT NULL,       -- 'interview', 'course', 'dsa', 'project_studio'
    
    -- The observation/fact (human-readable description)
    observation TEXT NOT NULL,  -- "User failed to ask clarifying questions in system design interview"
    
    -- Quantitative data (optional)
    metric_name TEXT,           -- 'clarity', 'tradeoff', 'adaptability', 'failure_awareness'
    metric_value FLOAT,         -- 0.35
    
    -- Context
    session_id UUID,            -- Group events by session (optional)
    context JSONB DEFAULT '{}', -- Additional structured data
    
    -- Tags for filtering
    tags TEXT[] DEFAULT '{}',   -- ['weakness', 'interview', 'clarification']
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON public.user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_created_at ON public.user_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_memory_event_type ON public.user_memory(event_type);
CREATE INDEX IF NOT EXISTS idx_user_memory_module ON public.user_memory(module);
CREATE INDEX IF NOT EXISTS idx_user_memory_tags ON public.user_memory USING GIN(tags);

-- RLS Policies
ALTER TABLE public.user_memory ENABLE ROW LEVEL SECURITY;

-- Users can read their own memory
CREATE POLICY "Users can read own memory"
    ON public.user_memory
    FOR SELECT
    USING (auth.uid() = user_id);

-- System can insert (via service role)
CREATE POLICY "Service can insert memory"
    ON public.user_memory
    FOR INSERT
    WITH CHECK (true);

-- Users can delete their own memory
CREATE POLICY "Users can delete own memory"
    ON public.user_memory
    FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================================
-- TABLE: user_patterns
-- Aggregated insights derived from user_memory
-- Updated periodically or on-demand
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Pattern detected
    pattern_type TEXT NOT NULL,  -- 'recurring_weakness', 'improvement', 'plateau', 'strength'
    module TEXT,                 -- Which module this pattern relates to
    metric_name TEXT,            -- Which metric this pattern relates to
    
    -- Human-readable description
    description TEXT NOT NULL,   -- "User consistently struggles with scalability questions"
    
    -- Evidence
    occurrence_count INT DEFAULT 1,
    avg_score FLOAT,             -- Average score for this pattern
    trend TEXT,                  -- 'improving', 'declining', 'stable'
    
    -- Confidence
    confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    
    -- Time tracking
    first_seen_at TIMESTAMPTZ DEFAULT now(),
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    
    -- Prevent duplicates
    UNIQUE(user_id, pattern_type, module, metric_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_patterns_user_id ON public.user_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_patterns_type ON public.user_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_user_patterns_confidence ON public.user_patterns(confidence DESC);

-- RLS Policies
ALTER TABLE public.user_patterns ENABLE ROW LEVEL SECURITY;

-- Users can read their own patterns
CREATE POLICY "Users can read own patterns"
    ON public.user_patterns
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service can manage patterns
CREATE POLICY "Service can manage patterns"
    ON public.user_patterns
    FOR ALL
    WITH CHECK (true);


-- ============================================================
-- VIEW: user_memory_summary
-- Quick aggregation of user's recent memory for orchestrator
-- ============================================================

CREATE OR REPLACE VIEW public.user_memory_summary AS
SELECT 
    user_id,
    module,
    metric_name,
    COUNT(*) as event_count,
    AVG(metric_value) as avg_value,
    MIN(metric_value) as min_value,
    MAX(metric_value) as max_value,
    MAX(created_at) as last_event_at
FROM public.user_memory
WHERE metric_value IS NOT NULL
GROUP BY user_id, module, metric_name;


-- ============================================================
-- FUNCTION: record_memory_event
-- Helper function to record events with proper formatting
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_memory_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_module TEXT,
    p_observation TEXT,
    p_metric_name TEXT DEFAULT NULL,
    p_metric_value FLOAT DEFAULT NULL,
    p_tags TEXT[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.user_memory (
        user_id, event_type, module, observation, 
        metric_name, metric_value, tags
    ) VALUES (
        p_user_id, p_event_type, p_module, p_observation,
        p_metric_name, p_metric_value, p_tags
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- FUNCTION: get_user_weakness_summary
-- Returns a text summary of user's weaknesses for LLM context
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_weakness_summary(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_summary TEXT := '';
    v_row RECORD;
BEGIN
    -- Get weakness counts by module and metric
    FOR v_row IN (
        SELECT 
            module,
            metric_name,
            COUNT(*) as weakness_count,
            ROUND(AVG(metric_value)::numeric, 2) as avg_score
        FROM public.user_memory
        WHERE 
            user_id = p_user_id 
            AND metric_value IS NOT NULL 
            AND metric_value < 0.4
            AND created_at > now() - INTERVAL '30 days'
        GROUP BY module, metric_name
        ORDER BY weakness_count DESC
        LIMIT 10
    ) LOOP
        v_summary := v_summary || format(
            '- %s/%s: %s occurrences (avg: %s)' || E'\n',
            v_row.module,
            v_row.metric_name,
            v_row.weakness_count,
            v_row.avg_score
        );
    END LOOP;
    
    IF v_summary = '' THEN
        RETURN 'No significant weaknesses detected in the last 30 days.';
    END IF;
    
    RETURN 'User weakness patterns (last 30 days):' || E'\n' || v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- FUNCTION: update_user_patterns
-- Analyzes user_memory and updates user_patterns table
-- Call this after significant events or periodically
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_user_patterns(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    v_count INT := 0;
    v_row RECORD;
    v_trend TEXT;
BEGIN
    -- Analyze each module/metric combination
    FOR v_row IN (
        SELECT 
            module,
            metric_name,
            COUNT(*) as event_count,
            AVG(metric_value) as avg_score,
            -- Calculate trend: compare recent vs older
            AVG(CASE WHEN created_at > now() - INTERVAL '7 days' THEN metric_value END) as recent_avg,
            AVG(CASE WHEN created_at <= now() - INTERVAL '7 days' AND created_at > now() - INTERVAL '30 days' THEN metric_value END) as older_avg
        FROM public.user_memory
        WHERE 
            user_id = p_user_id 
            AND metric_value IS NOT NULL
            AND created_at > now() - INTERVAL '30 days'
        GROUP BY module, metric_name
        HAVING COUNT(*) >= 3  -- Need at least 3 events for a pattern
    ) LOOP
        -- Determine trend
        IF v_row.recent_avg IS NULL OR v_row.older_avg IS NULL THEN
            v_trend := 'stable';
        ELSIF v_row.recent_avg > v_row.older_avg + 0.1 THEN
            v_trend := 'improving';
        ELSIF v_row.recent_avg < v_row.older_avg - 0.1 THEN
            v_trend := 'declining';
        ELSE
            v_trend := 'stable';
        END IF;
        
        -- Upsert pattern
        INSERT INTO public.user_patterns (
            user_id, pattern_type, module, metric_name,
            description, occurrence_count, avg_score, trend,
            confidence, last_seen_at
        ) VALUES (
            p_user_id,
            CASE 
                WHEN v_row.avg_score < 0.4 THEN 'recurring_weakness'
                WHEN v_row.avg_score > 0.7 THEN 'strength'
                ELSE 'neutral'
            END,
            v_row.module,
            v_row.metric_name,
            format('User shows %s pattern in %s/%s (avg: %s, trend: %s)',
                CASE WHEN v_row.avg_score < 0.4 THEN 'weakness' ELSE 'strength' END,
                v_row.module, v_row.metric_name,
                ROUND(v_row.avg_score::numeric, 2), v_trend
            ),
            v_row.event_count,
            v_row.avg_score,
            v_trend,
            LEAST(v_row.event_count * 0.1, 1.0),  -- Confidence grows with events
            now()
        )
        ON CONFLICT (user_id, pattern_type, module, metric_name)
        DO UPDATE SET
            occurrence_count = EXCLUDED.occurrence_count,
            avg_score = EXCLUDED.avg_score,
            trend = EXCLUDED.trend,
            description = EXCLUDED.description,
            confidence = EXCLUDED.confidence,
            last_seen_at = now();
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
