-- Fix community_announcements RLS policies to allow public read access
-- Migration: 20251013000000_fix_announcements_rls.sql
-- Description: Allows public (unauthenticated) users to view active announcements
--              and fixes foreign key relationship to user_profiles

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Announcements are viewable by authenticated users" ON public.community_announcements;
DROP POLICY IF EXISTS "Authenticated users can view active announcements" ON public.community_announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.community_announcements;
DROP POLICY IF EXISTS "Only admins can manage announcements" ON public.community_announcements;

-- Create new public read policy for active announcements
CREATE POLICY "Public can view active announcements"
  ON public.community_announcements
  FOR SELECT
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (scheduled_at IS NULL OR scheduled_at <= NOW())
  );

-- Create admin management policy
CREATE POLICY "Admins can manage announcements"
  ON public.community_announcements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.email = 'admin@newomen.me'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.email = 'admin@newomen.me'
    )
  );

-- Fix the foreign key to reference user_profiles instead of auth.users
ALTER TABLE public.community_announcements 
  DROP CONSTRAINT IF EXISTS community_announcements_created_by_fkey;

ALTER TABLE public.community_announcements
  ADD CONSTRAINT community_announcements_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.user_profiles(id)
  ON DELETE SET NULL;

-- Fix RLS for community_announcement_reads to allow authenticated users
DROP POLICY IF EXISTS "Users can manage their own announcement reads" ON public.community_announcement_reads;

CREATE POLICY "Users can manage their own announcement reads"
  ON public.community_announcement_reads
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ensure RLS is enabled on both tables
ALTER TABLE public.community_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_announcement_reads ENABLE ROW LEVEL SECURITY;

-- Add helpful comment
COMMENT ON POLICY "Public can view active announcements" ON public.community_announcements IS 
  'Allows anyone (including unauthenticated users) to view active, non-expired, and published announcements';

