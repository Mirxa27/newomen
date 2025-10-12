-- COMPREHENSIVE FIX FOR USER SIGNUP DATABASE ERROR
-- This script fixes the user creation trigger to work with the correct schema

BEGIN;

-- Drop ALL conflicting triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_creation() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_creation() CASCADE;

-- Ensure the role column exists (added by later migrations)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN role TEXT DEFAULT 'user' 
        CHECK (role IN ('user', 'admin', 'moderator'));
        
        CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
        ON public.user_profiles(role);
    END IF;
END $$;

-- Create the definitive, correct trigger function
-- Uses user_id (not id) to reference auth.users.id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_nickname TEXT;
  user_role TEXT;
BEGIN
  -- Determine nickname from metadata or email
  default_nickname := COALESCE(
    NEW.raw_user_meta_data->>'nickname',
    split_part(NEW.email, '@', 1),
    'Friend'
  );
  
  -- Determine role (admin for specific email, otherwise user)
  user_role := CASE 
    WHEN NEW.email = 'admin@newomen.me' THEN 'admin'
    ELSE 'user'
  END;
  
  -- Insert user profile with user_id pointing to auth.users.id
  INSERT INTO public.user_profiles (user_id, nickname, role)
  VALUES (NEW.id, default_nickname, user_role)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert user memory profile
  INSERT INTO public.user_memory_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't prevent user creation
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies are correct for user_id column
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.user_profiles
  FOR ALL
  USING (
    auth.email() = 'admin@newomen.me' 
    OR (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin'
  );

-- Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory_profiles ENABLE ROW LEVEL SECURITY;

-- Verify the fix
DO $$
DECLARE
  trigger_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) INTO trigger_exists;
  
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) INTO function_exists;
  
  IF trigger_exists AND function_exists THEN
    RAISE NOTICE 'SUCCESS: User signup trigger is properly configured';
  ELSE
    RAISE EXCEPTION 'FAILED: Trigger or function missing';
  END IF;
END $$;

COMMIT;

-- Display current configuration
SELECT 
  'Trigger Configuration:' as info,
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';

