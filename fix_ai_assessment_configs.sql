-- Fix AI Assessment Configs Table
-- This script fixes the column structure issue

-- First, check if the table exists and what columns it has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_assessment_configs' 
AND table_schema = 'public';

-- Drop the table if it exists with wrong structure
DROP TABLE IF EXISTS public.ai_assessment_configs CASCADE;

-- Recreate the table with correct structure
CREATE TABLE public.ai_assessment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  ai_provider TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  system_prompt TEXT,
  user_prompt_template TEXT,
  evaluation_criteria JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_assessment_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Admins can manage AI configs" ON public.ai_assessment_configs;
CREATE POLICY "Admins can manage AI configs"
  ON public.ai_assessment_configs
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

DROP POLICY IF EXISTS "Authenticated users can view active AI configs" ON public.ai_assessment_configs;
CREATE POLICY "Authenticated users can view active AI configs"
  ON public.ai_assessment_configs
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_assessment_configs_active ON public.ai_assessment_configs(is_active);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_ai_assessment_configs_updated_at ON public.ai_assessment_configs;
CREATE TRIGGER update_ai_assessment_configs_updated_at
    BEFORE UPDATE ON public.ai_assessment_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample AI assessment config
INSERT INTO public.ai_assessment_configs (name, description, ai_provider, ai_model, temperature, max_tokens, system_prompt, user_prompt_template) VALUES
('Default Assessment Analyzer', 'Default AI configuration for assessment analysis', 'openai', 'gpt-4', 0.7, 1000, 
'You are an expert psychologist and assessment analyst. Analyze the user''s responses and provide detailed, personalized feedback.',
'Please analyze the following assessment responses and provide detailed feedback: {responses}');

-- Verify the table structure
SELECT 'AI Assessment Configs table created successfully' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_assessment_configs' 
AND table_schema = 'public'
ORDER BY ordinal_position;
