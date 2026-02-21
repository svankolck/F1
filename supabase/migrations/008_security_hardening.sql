-- =============================================================
-- Security hardening: restrict data exposure
-- =============================================================

-- 1) Restrict public_profiles view to username only + authenticated only
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles AS
SELECT
    id,
    username
FROM profiles;

-- Only authenticated users can read public profiles (not anon)
REVOKE ALL ON public_profiles FROM anon;
GRANT SELECT ON public_profiles TO authenticated;

COMMENT ON VIEW public_profiles IS 'Minimal public profile data (username only) for leaderboards. Authenticated users only.';

-- 2) Restrict profiles table: users can only read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- 3) Restrict predictions: users can only read their own predictions
DROP POLICY IF EXISTS "Everyone can read predictions" ON predictions;

CREATE POLICY "Users can read own predictions"
    ON predictions FOR SELECT
    USING (auth.uid() = user_id);
