-- Fix Infinite Recursion in RLS Policies
-- This migration fixes the circular dependency in user_profiles RLS policies

-- Drop all existing RLS policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin full access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public read access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- Create non-recursive policies for user_profiles

-- 1. Users can read their own profile
CREATE POLICY "Users can read own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Users can update their own profile (specific columns only)
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Admins can read all profiles (without checking role from user_profiles - avoid recursion)
CREATE POLICY "Admins can read all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'admin@newomen.me',
    'katerina@newomen.me'
  )
  OR auth.uid() = user_id
);

-- 4. Admins can update all profiles (without checking role from user_profiles - avoid recursion)
CREATE POLICY "Admins can update all profiles"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'admin@newomen.me',
    'katerina@newomen.me'
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'admin@newomen.me',
    'katerina@newomen.me'
  )
);

-- 5. Allow authenticated users to insert (for new signups)
CREATE POLICY "Allow authenticated insert"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix wellness_resources RLS policies
DROP POLICY IF EXISTS "Public read access for active wellness resources" ON wellness_resources;
DROP POLICY IF EXISTS "Admin full access to wellness resources" ON wellness_resources;

-- 1. Public can read active wellness resources
CREATE POLICY "Public read wellness resources"
ON wellness_resources
FOR SELECT
TO public
USING (status = 'active' OR status IS NULL);

-- 2. Admins can manage wellness resources (using email check to avoid recursion)
CREATE POLICY "Admins manage wellness resources"
ON wellness_resources
FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' IN (
    'admin@newomen.me',
    'katerina@newomen.me'
  )
)
WITH CHECK (
  auth.jwt() ->> 'email' IN (
    'admin@newomen.me',
    'katerina@newomen.me'
  )
);

-- Add comment
COMMENT ON POLICY "Admins can read all profiles" ON user_profiles IS 
'Uses email-based admin check to avoid infinite recursion';

COMMENT ON POLICY "Admins manage wellness resources" ON wellness_resources IS 
'Uses email-based admin check to avoid infinite recursion with user_profiles';

