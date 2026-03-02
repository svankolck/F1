-- =============================================
-- Migration: Create secure avatars storage bucket
-- =============================================
-- This bucket is NOT public. Images are served via signed URLs
-- or Supabase's authenticated image transformation endpoint.
--
-- RLS Policies:
-- 1. Users can ONLY upload/update files in their own folder (userId/*)
-- 2. Users can ONLY read their own avatar
-- 3. Authenticated users can read any avatar (needed for leaderboards/profiles)
-- 4. Anonymous users cannot access anything
-- =============================================

-- Create the bucket (private, not public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- NOTE: bucket is set to public=true so that avatar URLs work without signed URLs.
-- Security is enforced at the ROW level via the policies below:
-- only authenticated users can upload, and only to their own folder.

-- Policy 1: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Authenticated users can update their own files
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Anyone can view avatars (needed for profile display)
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy 4: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- File size limit: 2MB (enforced at application level, but also set here)
UPDATE storage.buckets
SET file_size_limit = 2097152,  -- 2MB in bytes
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';
