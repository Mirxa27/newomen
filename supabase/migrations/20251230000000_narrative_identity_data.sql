-- Add narrative_identity_data column to user_memory_profiles table
ALTER TABLE public.user_memory_profiles 
ADD COLUMN IF NOT EXISTS narrative_identity_data JSONB DEFAULT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_memory_profiles_narrative_identity 
ON public.user_memory_profiles USING gin (narrative_identity_data);

-- Update the trigger to set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_memory_profiles_updated_at ON public.user_memory_profiles;
CREATE TRIGGER update_user_memory_profiles_updated_at
  BEFORE UPDATE ON public.user_memory_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
