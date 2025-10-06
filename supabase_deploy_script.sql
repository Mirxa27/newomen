-- Complete database setup for admin functionality
-- Run this on production Supabase instance

-- Step 1: Add role column to user_profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'role') THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));
        
        -- Create index for role lookups
        CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
        
        RAISE NOTICE 'Role column added to user_profiles table';
    ELSE
        RAISE NOTICE 'Role column already exists in user_profiles table';
    END IF;
END $$;

-- Step 2: Update existing admin user if exists
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@newomen.me'
);

-- Step 3: Add RLS policy for role-based admin access
DROP POLICY IF EXISTS "Admins can manage all profiles by role" ON public.user_profiles;
CREATE POLICY "Admins can manage all profiles by role"
  ON public.user_profiles
  FOR ALL
  USING (
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR auth.email() = 'admin@newomen.me'
  );

-- Step 4: Add RLS policy for role-based admin access to memory profiles
DROP POLICY IF EXISTS "Admins can manage all memory profiles by role" ON public.user_memory_profiles;
CREATE POLICY "Admins can manage all memory profiles by role"
  ON public.user_memory_profiles
  FOR ALL
  USING (
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR auth.email() = 'admin@newomen.me'
  );

-- Step 5: Update the handle_new_user function to set admin role on user creation if email is admin
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
  ) ON CONFLICT (user_id) DO UPDATE SET
    role = CASE 
      WHEN NEW.email = 'admin@newomen.me' THEN 'admin'
      ELSE EXCLUDED.role
    END;
  
  INSERT INTO public.user_memory_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Ensure all necessary tables exist
CREATE TABLE IF NOT EXISTS public.ai_assessment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  max_tokens INTEGER DEFAULT 2000,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  system_prompt TEXT,
  user_prompt_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on ai_assessment_configs
ALTER TABLE public.ai_assessment_configs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for ai_assessment_configs
DROP POLICY IF EXISTS "Admins can manage AI assessment configs" ON public.ai_assessment_configs;
CREATE POLICY "Admins can manage AI assessment configs"
  ON public.ai_assessment_configs
  FOR ALL
  USING (
    (SELECT role FROM public.user_profiles WHERE user_id = auth.uid()) = 'admin'
    OR auth.email() = 'admin@newomen.me'
  );

DROP POLICY IF EXISTS "Users can view active AI assessment configs" ON public.ai_assessment_configs;
CREATE POLICY "Users can view active AI assessment configs"
  ON public.ai_assessment_configs
  FOR SELECT
  USING (is_active = true);

-- Step 7: Insert default AI assessment config if none exists
INSERT INTO public.ai_assessment_configs (name, provider, model, system_prompt, user_prompt_template)
VALUES (
  'Default Assessment Generator',
  'openai',
  'gpt-4',
  'You are an expert psychologist and assessment designer. Create comprehensive, scientifically-grounded assessments that help people understand themselves better.',
  'Create a {type} assessment about {topic} with 10-15 questions. Include multiple choice options and scoring logic.'
) ON CONFLICT DO NOTHING;

SELECT 'Database migration completed successfully! Admin functionality is now available.' AS status;