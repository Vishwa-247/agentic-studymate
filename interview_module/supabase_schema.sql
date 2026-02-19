-- ═══════════════════════════════════════════════════════════════════════
-- Supabase Schema for StudyMate Interview Stress Analyzer
-- ═══════════════════════════════════════════════════════════════════════
--
-- Tables prefixed with stress_ to avoid conflicts with StudyMate's
-- existing tables. All tables include user_id for RLS.
--
-- Run this SQL in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════


-- ── Stress Sessions ─────────────────────────────────────────────────
-- One row per interview session

CREATE TABLE IF NOT EXISTS stress_sessions (
    session_id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    interview_type TEXT DEFAULT 'general',       -- "technical" | "behavioral" | "production_thinking" | "general"
    start_time REAL NOT NULL,
    start_datetime TEXT NOT NULL,
    duration_seconds REAL,
    total_recordings INTEGER,

    -- Stress metrics
    avg_stress REAL,
    max_stress REAL,
    min_stress REAL,
    stress_spikes INTEGER,
    calm_percentage REAL,
    stress_percentage REAL,

    -- Engagement metrics (NEW)
    avg_engagement REAL,

    -- Question analytics
    questions_asked INTEGER,
    comfort_zones TEXT[],                        -- questions/topics user was calm on
    struggle_areas TEXT[],                       -- questions/topics user found hard

    -- Deception analysis
    total_deception_flags INTEGER,
    deception_risk TEXT,
    recommendation TEXT,

    -- StudyMate 6-metric behavioral scores (NEW)
    studymate_metrics JSONB,                     -- { "clarification_habit": 0.7, ... }

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ── Stress Questions ────────────────────────────────────────────────
-- Timestamped question markers with rich context

CREATE TABLE IF NOT EXISTS stress_questions (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT REFERENCES stress_sessions(session_id) ON DELETE CASCADE,
    timestamp REAL NOT NULL,
    datetime TEXT NOT NULL,
    question_text TEXT NOT NULL,

    -- Question context (NEW)
    question_type TEXT DEFAULT 'general',         -- "technical" | "behavioral" | "curveball" | "clarification"
    difficulty TEXT DEFAULT 'medium',             -- "easy" | "medium" | "hard"
    topic TEXT,                                   -- "system_design" | "algorithms" | etc.
    interview_stage TEXT DEFAULT 'main',          -- "intro" | "warmup" | "main" | "curveball" | "reflection"
    studymate_metric TEXT                         -- which of the 6 metrics this tests
);


-- ── Stress Recordings ───────────────────────────────────────────────
-- Individual stress readings (sampled every few seconds)

CREATE TABLE IF NOT EXISTS stress_recordings (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT REFERENCES stress_sessions(session_id) ON DELETE CASCADE,
    timestamp REAL NOT NULL,
    datetime TEXT NOT NULL,
    elapsed_seconds REAL,
    stress_score REAL NOT NULL,
    stress_level TEXT NOT NULL,                   -- "calm" | "mild" | "high"

    -- Enhanced metrics (NEW)
    engagement_score REAL,
    baseline_delta REAL,
    confidence REAL,

    question TEXT,
    features JSONB,                               -- raw feature values
    deception_flags TEXT[],
    deception_risk TEXT
);


-- ── Stress Feedback ─────────────────────────────────────────────────
-- LLM-generated coaching feedback per session (NEW table)

CREATE TABLE IF NOT EXISTS stress_feedback (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT REFERENCES stress_sessions(session_id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL,                   -- "quick" | "detailed" | "progress"

    -- Structured feedback
    overall_summary TEXT,
    strengths TEXT[],
    areas_for_growth TEXT[],
    action_plan TEXT[],
    confidence_assessment TEXT,
    recommended_focus TEXT,

    -- Per-question feedback (for detailed type)
    per_question_feedback JSONB,

    -- StudyMate metric commentary
    metrics_commentary JSONB,                     -- { "structure": "Strong at 78%...", ... }

    -- Progress tracking (for progress type)
    stress_trend TEXT,                            -- "Decreasing" | "Stable" | "Increasing"
    improvement_areas TEXT[],
    persistent_struggles TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ── Stress Patterns ─────────────────────────────────────────────────
-- Long-term patterns tracked across sessions (NEW table)

CREATE TABLE IF NOT EXISTS stress_patterns (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL,                    -- "topic_stress" | "time_decay" | "recovery_rate"

    topic TEXT,                                   -- for topic_stress: the topic
    avg_stress_on_topic REAL,                     -- average stress when this topic comes up
    session_count INTEGER DEFAULT 1,              -- how many sessions contributed to this pattern
    trend TEXT,                                   -- "improving" | "stable" | "declining"

    -- Aggregate data
    data JSONB,                                   -- flexible data store for pattern-specific info

    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_stress_sessions_user ON stress_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_stress_sessions_start ON stress_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_stress_sessions_risk ON stress_sessions(deception_risk);
CREATE INDEX IF NOT EXISTS idx_stress_sessions_type ON stress_sessions(interview_type);

CREATE INDEX IF NOT EXISTS idx_stress_questions_session ON stress_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_stress_questions_timestamp ON stress_questions(timestamp);
CREATE INDEX IF NOT EXISTS idx_stress_questions_topic ON stress_questions(topic);

CREATE INDEX IF NOT EXISTS idx_stress_recordings_session ON stress_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_stress_recordings_stress ON stress_recordings(stress_score DESC);
CREATE INDEX IF NOT EXISTS idx_stress_recordings_timestamp ON stress_recordings(timestamp);

CREATE INDEX IF NOT EXISTS idx_stress_feedback_session ON stress_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_stress_feedback_user ON stress_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_stress_patterns_user ON stress_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_stress_patterns_topic ON stress_patterns(topic);


-- ═══════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE stress_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_patterns ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users see own sessions" ON stress_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own questions" ON stress_questions
    FOR ALL USING (
        session_id IN (SELECT session_id FROM stress_sessions WHERE user_id = auth.uid())
    );

CREATE POLICY "Users see own recordings" ON stress_recordings
    FOR ALL USING (
        session_id IN (SELECT session_id FROM stress_sessions WHERE user_id = auth.uid())
    );

CREATE POLICY "Users see own feedback" ON stress_feedback
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own patterns" ON stress_patterns
    FOR ALL USING (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════════════════
-- Views
-- ═══════════════════════════════════════════════════════════════════════

-- View: User's interview dashboard summary
CREATE OR REPLACE VIEW stress_dashboard AS
SELECT 
    s.user_id,
    COUNT(*) as total_interviews,
    AVG(s.avg_stress) as overall_avg_stress,
    AVG(s.avg_engagement) as overall_avg_engagement,
    AVG(s.duration_seconds) as avg_duration_seconds,
    SUM(CASE WHEN s.deception_risk = 'high' THEN 1 ELSE 0 END) as high_risk_count,
    SUM(CASE WHEN s.deception_risk = 'low' THEN 1 ELSE 0 END) as low_risk_count,
    MAX(s.start_datetime) as last_session,
    -- Trend: compare last 3 sessions avg stress to all-time
    (SELECT AVG(sub.avg_stress) 
     FROM (SELECT avg_stress FROM stress_sessions WHERE user_id = s.user_id ORDER BY start_time DESC LIMIT 3) sub
    ) as recent_avg_stress
FROM stress_sessions s
GROUP BY s.user_id;

-- View: Topic difficulty map (which topics cause most stress per user)
CREATE OR REPLACE VIEW stress_topic_map AS
SELECT 
    ss.user_id,
    sq.topic,
    COUNT(*) as times_asked,
    AVG(sr.stress_score) as avg_stress_on_topic,
    AVG(sr.engagement_score) as avg_engagement_on_topic
FROM stress_questions sq
JOIN stress_sessions ss ON sq.session_id = ss.session_id
JOIN stress_recordings sr ON sr.session_id = sq.session_id
    AND sr.timestamp >= sq.timestamp
WHERE sq.topic IS NOT NULL
GROUP BY ss.user_id, sq.topic
ORDER BY avg_stress_on_topic DESC;


-- ═══════════════════════════════════════════════════════════════════════
-- Functions
-- ═══════════════════════════════════════════════════════════════════════

-- Get full session with all related data
CREATE OR REPLACE FUNCTION get_stress_session(p_session_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'session', (SELECT row_to_json(s) FROM stress_sessions s WHERE s.session_id = p_session_id),
        'questions', (SELECT json_agg(q ORDER BY q.timestamp) FROM stress_questions q WHERE q.session_id = p_session_id),
        'recordings', (SELECT json_agg(r ORDER BY r.timestamp) FROM stress_recordings r WHERE r.session_id = p_session_id),
        'feedback', (SELECT json_agg(f) FROM stress_feedback f WHERE f.session_id = p_session_id)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's progress over time (last N sessions)
CREATE OR REPLACE FUNCTION get_stress_progress(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'sessions', (
            SELECT json_agg(row_to_json(sub))
            FROM (
                SELECT session_id, start_datetime, avg_stress, avg_engagement,
                       studymate_metrics, comfort_zones, struggle_areas, recommendation
                FROM stress_sessions
                WHERE user_id = p_user_id
                ORDER BY start_time DESC
                LIMIT p_limit
            ) sub
        ),
        'patterns', (
            SELECT json_agg(row_to_json(p))
            FROM stress_patterns p
            WHERE p.user_id = p_user_id
        ),
        'topic_map', (
            SELECT json_agg(row_to_json(t))
            FROM stress_topic_map t
            WHERE t.user_id = p_user_id
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_stress_session(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_stress_progress(UUID, INTEGER) TO authenticated;
