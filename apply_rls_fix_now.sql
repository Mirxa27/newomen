-- APPLY THIS IMMEDIATELY IN SUPABASE SQL EDITOR
-- Fixes infinite recursion error in user_profiles RLS policies

-- Step 1: Drop ALL existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin full access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public read access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile select" ON user_profiles;
DROP POLICY IF EXISTS "Allow own profile update" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation via trigger" ON user_profiles;
DROP POLICY IF EXISTS "Allow self profile creation" ON user_profiles;
DROP POLICY IF EXISTS "Allow individual insert" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON user_profiles;

-- Step 2: Create simple, non-recursive policies

-- Allow users to read their own profile
CREATE POLICY "user_read_own"
ON user_profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR auth.uid() = id
);

-- Allow users to update their own profile
CREATE POLICY "user_update_own"
ON user_profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  OR auth.uid() = id
)
WITH CHECK (
  auth.uid() = user_id 
  OR auth.uid() = id
);

-- Allow users to insert their profile on signup
CREATE POLICY "user_insert_own"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  OR auth.uid() = id
);

-- Allow admins to read ALL profiles (using email check - NO RECURSION)
CREATE POLICY "admin_read_all"
ON user_profiles FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'admin@newomen.me'
  OR auth.jwt() ->> 'email' = 'katerina@newomen.me'
  OR auth.jwt() ->> 'email' = 'Abdullah@sourcekom.com'
);

-- Allow admins to update ALL profiles (using email check - NO RECURSION)
CREATE POLICY "admin_update_all"
ON user_profiles FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'admin@newomen.me'
  OR auth.jwt() ->> 'email' = 'katerina@newomen.me'
  OR auth.jwt() ->> 'email' = 'Abdullah@sourcekom.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'admin@newomen.me'
  OR auth.jwt() ->> 'email' = 'katerina@newomen.me'
  OR auth.jwt() ->> 'email' = 'Abdullah@sourcekom.com'
);

-- Step 3: Fix wellness_resources policies

DROP POLICY IF EXISTS "Public read access for active wellness resources" ON wellness_resources;
DROP POLICY IF EXISTS "Admin full access to wellness resources" ON wellness_resources;
DROP POLICY IF EXISTS "Public read wellness resources" ON wellness_resources;
DROP POLICY IF EXISTS "Admins manage wellness resources" ON wellness_resources;
DROP POLICY IF EXISTS "Public read wellness" ON wellness_resources;
DROP POLICY IF EXISTS "Admins manage wellness" ON wellness_resources;

-- Allow everyone to read active wellness resources
CREATE POLICY "wellness_public_read"
ON wellness_resources FOR SELECT
TO public
USING (
  status = 'active' 
  OR status IS NULL
);

-- Allow admins to manage wellness resources (email check - NO RECURSION)
CREATE POLICY "wellness_admin_all"
ON wellness_resources FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'admin@newomen.me'
  OR auth.jwt() ->> 'email' = 'katerina@newomen.me'
  OR auth.jwt() ->> 'email' = 'Abdullah@sourcekom.com'
)
WITH CHECK (
  auth.jwt() ->> 'email' = 'admin@newomen.me'
  OR auth.jwt() ->> 'email' = 'katerina@newomen.me'
  OR auth.jwt() ->> 'email' = 'Abdullah@sourcekom.com'
);

-- Step 4: Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_resources ENABLE ROW LEVEL SECURITY;

-- Done! Your admin panel and wellness library should work now.

