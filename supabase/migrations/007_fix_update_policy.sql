-- =============================================================
-- Fix RLS UPDATE policy: voeg WITH CHECK toe aan profiles
-- =============================================================
-- PROBLEEM: de vorige UPDATE policy had alleen USING (lees-filter)
-- maar miste WITH CHECK (schrijf-filter). Hierdoor kan Supabase
-- de update negeren zonder error terug te sturen.
--
-- ⚠️ VOER DIT OOK UIT IN SUPABASE DASHBOARD → SQL Editor
-- =============================================================

-- Reset RLS momenteel
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verwijder de gebrekkige UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Herstel met correcte WITH CHECK clause
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Herstel RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
