-- =============================================================
-- Fase 7: Prediction Game — Hardening Patch (for existing DBs)
-- Run this when 002_game_tables.sql was already applied earlier.
-- =============================================================

-- 1) Enforce unique driver picks across prediction slots
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

-- 2) Restrict game_scores session_type to race/sprint only
ALTER TABLE game_scores
    DROP CONSTRAINT IF EXISTS game_scores_session_type_check;

ALTER TABLE game_scores
    ADD CONSTRAINT game_scores_session_type_check
    CHECK (session_type IN ('race', 'sprint'));

-- 3) Tighten RLS: writes only via service role
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Everyone can read scores" ON game_scores;
DROP POLICY IF EXISTS "Service role can manage scores" ON game_scores;

CREATE POLICY "Everyone can read scores"
    ON game_scores FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage scores"
    ON game_scores FOR ALL
    USING (auth.role() = 'service_role');

-- 4) Ensure updated_at trigger is present and idempotent
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
