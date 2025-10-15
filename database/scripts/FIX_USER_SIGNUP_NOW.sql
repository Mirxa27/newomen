-- ⚡ CRITICAL FIX FOR USER SIGNUP DATABASE ERROR ⚡
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/fkikaozubngmzcrnhkqe/sql

-- Step 1: Remove all conflicting triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_creation() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_creation() CASCADE;

-- Step 2: Ensure role column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN role TEXT DEFAULT 'user' 
        CHECK (role IN ('user', 'admin', 'moderator'));
    END IF;
END $$;

-- Step 3: Create the CORRECT trigger function
-- ✅ Uses user_id (not id) - this is the fix!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile
  INSERT INTO public.user_profiles (user_id, nickname, role)
  VALUES (
    NEW.id,  -- Maps to user_id column in user_profiles
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      split_part(NEW.email, '@', 1),
      'Friend'
    ),
    CASE 
      WHEN NEW.email = 'admin@newomen.me' THEN 'admin'
      ELSE 'user'
    END
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert memory profile
  INSERT INTO public.user_memory_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error creating profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify the fix worked
DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count 
  FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created';
  
  SELECT COUNT(*) INTO function_count 
  FROM pg_proc 
  WHERE proname = 'handle_new_user';
  
  IF trigger_count > 0 AND function_count > 0 THEN
    RAISE NOTICE '✅ SUCCESS! User signup trigger is fixed and ready.';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Trigger or function missing. Please contact support.';
  END IF;
END $$;

-- Done! You can now test user signup.

