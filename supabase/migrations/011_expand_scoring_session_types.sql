-- =============================================================
-- Migration 011: Expand scoring session types to full sprint weekend model
-- Supports: qualifying, sprint_qualifying, sprint, race
-- =============================================================

-- game_scores: allow all 4 session types
ALTER TABLE game_scores
    DROP CONSTRAINT IF EXISTS game_scores_session_type_check;

ALTER TABLE game_scores
    ADD CONSTRAINT game_scores_session_type_check
    CHECK (session_type IN ('qualifying', 'sprint_qualifying', 'sprint', 'race'));

-- scoring_log: allow all 4 session types
ALTER TABLE scoring_log
    DROP CONSTRAINT IF EXISTS scoring_log_session_type_check;

ALTER TABLE scoring_log
    ADD CONSTRAINT scoring_log_session_type_check
    CHECK (session_type IN ('qualifying', 'sprint_qualifying', 'sprint', 'race'));
