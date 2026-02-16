-- =============================================================
-- Fase 7: Prediction Game — Database Migration
-- =============================================================

-- 1. Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    round INTEGER NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('qualifying', 'race', 'sprint_qualifying', 'sprint')),
    pole_driver_id TEXT,
    p1_driver_id TEXT,
    p2_driver_id TEXT,
    p3_driver_id TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, season, round, session_type)
);

ALTER TABLE predictions
    DROP CONSTRAINT IF EXISTS predictions_unique_driver_slots_chk;

ALTER TABLE predictions
    ADD CONSTRAINT predictions_unique_driver_slots_chk CHECK (
        (pole_driver_id IS NULL OR p1_driver_id IS NULL OR pole_driver_id <> p1_driver_id) AND
        (pole_driver_id IS NULL OR p2_driver_id IS NULL OR pole_driver_id <> p2_driver_id) AND
        (pole_driver_id IS NULL OR p3_driver_id IS NULL OR pole_driver_id <> p3_driver_id) AND
        (p1_driver_id IS NULL OR p2_driver_id IS NULL OR p1_driver_id <> p2_driver_id) AND
        (p1_driver_id IS NULL OR p3_driver_id IS NULL OR p1_driver_id <> p3_driver_id) AND
        (p2_driver_id IS NULL OR p3_driver_id IS NULL OR p2_driver_id <> p3_driver_id)
    );

-- 2. Game scores table
CREATE TABLE IF NOT EXISTS game_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    season INTEGER NOT NULL,
    round INTEGER NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('race', 'sprint')),
    pole_points INTEGER DEFAULT 0,
    p1_points INTEGER DEFAULT 0,
    p2_points INTEGER DEFAULT 0,
    p3_points INTEGER DEFAULT 0,
    bonus_points INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, season, round, session_type)
);

-- 3. Profile columns for default driver preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_pole_driver TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_p1_driver TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_p2_driver TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_p3_driver TEXT;

-- =============================================================
-- Indexes
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_predictions_user_round ON predictions(user_id, season, round);
CREATE INDEX IF NOT EXISTS idx_predictions_round ON predictions(season, round, session_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id, season);
CREATE INDEX IF NOT EXISTS idx_game_scores_round ON game_scores(season, round);

-- =============================================================
-- RLS Policies
-- =============================================================

-- Predictions: users can manage their own, everyone can read (after session starts — filtered client-side)
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can update own predictions" ON predictions;
DROP POLICY IF EXISTS "Everyone can read predictions" ON predictions;
DROP POLICY IF EXISTS "Service role can manage predictions" ON predictions;

CREATE POLICY "Everyone can read predictions"
    ON predictions FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage predictions"
    ON predictions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Game scores: only admin inserts (via service role), everyone can read
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read scores" ON game_scores;
DROP POLICY IF EXISTS "Service role can manage scores" ON game_scores;

CREATE POLICY "Everyone can read scores"
    ON game_scores FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage scores"
    ON game_scores FOR ALL
    USING (auth.role() = 'service_role');

-- =============================================================
-- Auto-update updated_at on predictions
-- =============================================================
CREATE OR REPLACE FUNCTION update_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS predictions_updated_at ON predictions;

CREATE TRIGGER predictions_updated_at
    BEFORE UPDATE ON predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_predictions_updated_at();
