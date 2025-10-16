-- Add 'superadmin' role to user_profiles role constraint
-- This allows admin@newomen.me to have full access while Katrina has limited moderator access

-- Drop existing constraint
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add new constraint with superadmin
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('user', 'admin', 'moderator', 'superadmin'));

-- Update admin@newomen.me to superadmin role (if exists)
UPDATE public.user_profiles 
SET role = 'superadmin' 
WHERE email = 'admin@newomen.me' AND role = 'admin';

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON public.user_profiles(role);

-- Add comment
COMMENT ON COLUMN public.user_profiles.role IS 
'User role: user (default), moderator (limited admin), admin (full admin), superadmin (system admin)';

