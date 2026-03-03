-- =============================================================
-- Migration: Scoring log + role column for admin features
-- =============================================================

-- 1. Ensure role column exists on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Scoring log table
CREATE TABLE IF NOT EXISTS scoring_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    season INTEGER NOT NULL,
    round INTEGER NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('race', 'sprint')),
    status TEXT NOT NULL DEFAULT 'provisional'
        CHECK (status IN ('provisional', 'official', 'failed')),
    scored_by UUID REFERENCES auth.users(id),
    scored_count INTEGER DEFAULT 0,
    actual_pole TEXT,
    actual_p1 TEXT,
    actual_p2 TEXT,
    actual_p3 TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(season, round, session_type)
);

-- RLS
ALTER TABLE scoring_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read scoring log"
    ON scoring_log FOR SELECT USING (true);

CREATE POLICY "Service role can manage scoring log"
    ON scoring_log FOR ALL
    USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scoring_log_season ON scoring_log(season);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_scoring_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scoring_log_updated_at ON scoring_log;
CREATE TRIGGER scoring_log_updated_at
    BEFORE UPDATE ON scoring_log
    FOR EACH ROW
    EXECUTE FUNCTION update_scoring_log_updated_at();
