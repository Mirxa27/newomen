-- Admin Panel Fix - Run this in Supabase Dashboard SQL Editor
-- This adds the role column and updates admin authentication

-- Step 1: Add role column to user_profiles table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'role') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));
    END IF;
END $$;

-- Step 2: Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Step 3: Update existing admin user if exists
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@newomen.me'
);

-- Step 4: Add RLS policy for role-based admin access
DROP POLICY IF EXISTS "Admins can manage all profiles by role" ON public.user_profiles;
CREATE POLICY "Admins can manage all profiles by role"
  ON public.user_profiles
  FOR ALL
  USING (
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR auth.email() = 'admin@newomen.me'
  );

-- Step 5: Add RLS policy for role-based admin access to memory profiles
DROP POLICY IF EXISTS "Admins can manage all memory profiles by role" ON public.user_memory_profiles;
CREATE POLICY "Admins can manage all memory profiles by role"
  ON public.user_memory_profiles
  FOR ALL
  USING (
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR auth.email() = 'admin@newomen.me'
  );

-- Step 6: Update the handle_new_user function to set admin role on user creation if email is admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, nickname, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'Friend'),
    CASE 
      WHEN NEW.email = 'admin@newomen.me' THEN 'admin'
      ELSE 'user'
    END
  );
  
  INSERT INTO public.user_memory_profiles (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: If you want to manually create the admin user (replace with your actual admin email)
-- INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'admin@newomen.me') 
-- ON CONFLICT (email) DO NOTHING;

SELECT 'Admin panel fix applied successfully!' AS status;