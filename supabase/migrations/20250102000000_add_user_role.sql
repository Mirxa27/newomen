-- Add role column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Update existing admin user if exists
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@newomen.me'
);

-- Add RLS policy for role-based admin access
DROP POLICY IF EXISTS "Admins can manage all profiles by role" ON public.user_profiles;
CREATE POLICY "Admins can manage all profiles by role"
  ON public.user_profiles
  FOR ALL
  USING (
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR auth.email() = 'admin@newomen.me'
  );

-- Add RLS policy for role-based admin access to memory profiles
DROP POLICY IF EXISTS "Admins can manage all memory profiles by role" ON public.user_memory_profiles;
CREATE POLICY "Admins can manage all memory profiles by role"
  ON public.user_memory_profiles
  FOR ALL
  USING (
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR auth.email() = 'admin@newomen.me'
  );

-- Function to set admin role on user creation if email is admin
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