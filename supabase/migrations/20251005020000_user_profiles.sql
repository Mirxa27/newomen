-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  avatar_url TEXT,
  language TEXT DEFAULT 'en',
  culture TEXT DEFAULT 'western',
  subscription_tier TEXT DEFAULT 'discovery' CHECK (subscription_tier IN ('discovery', 'growth', 'transformation')),
  remaining_minutes INTEGER DEFAULT 10,
  current_level INTEGER DEFAULT 1,
  crystal_balance INTEGER DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  last_login_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_memory_profiles table
CREATE TABLE IF NOT EXISTS public.user_memory_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  personality_type TEXT,
  balance_wheel_scores JSONB,
  narrative_patterns JSONB,
  emotional_state_history JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
  ON public.user_profiles
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for user_memory_profiles
CREATE POLICY "Users can view their own memory profile"
  ON public.user_memory_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory profile"
  ON public.user_memory_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory profile"
  ON public.user_memory_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all memory profiles"
  ON public.user_memory_profiles
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_memory_profiles_user_id ON public.user_memory_profiles(user_id);

-- Add update timestamp triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_memory_profiles_updated_at
  BEFORE UPDATE ON public.user_memory_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle user profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', 'Friend'));
  
  INSERT INTO public.user_memory_profiles (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
