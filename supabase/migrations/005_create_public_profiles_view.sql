-- Create a secure view that only exposes public profile information
-- This allows us to keep the main 'profiles' table RLS strict (owner-only)
-- while still allowing the leaderboard to show names and avatars.

CREATE OR REPLACE VIEW public_profiles AS
SELECT 
    id, 
    username, 
    avatar_url,
    first_name,
    last_name
FROM profiles;

-- Grant access to this view to authenticated users (and anon if needed)
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;

-- Comment for documentation
COMMENT ON VIEW public_profiles IS 'Exposes only public profile data (username, avatar) for leaderboards, hiding private settings like default predictions.';
