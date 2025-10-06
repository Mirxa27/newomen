-- Enhanced AI Provider System with OpenAI Compatibility and Prompt Templates

-- Add OpenAI compatibility fields to providers table
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS api_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS openai_compatible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 4096,
ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS top_p DECIMAL(3,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS frequency_penalty DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS presence_penalty DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS stop_sequences TEXT[],
ADD COLUMN IF NOT EXISTS system_instructions TEXT,
ADD COLUMN IF NOT EXISTS behavior_config JSONB;

-- Create AI use cases table for different prompt templates
CREATE TABLE IF NOT EXISTS public.ai_use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL, -- 'assessment', 'challenge', 'conversation', 'analysis', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create prompt templates table for different use cases
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID REFERENCES public.ai_use_cases(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  variables JSONB, -- Template variables like {user_name}, {assessment_type}, etc.
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prompt_templates ADD CONSTRAINT prompt_templates_use_case_id_name_key UNIQUE (use_case_id, name);

-- Create AI behavior configurations
CREATE TABLE IF NOT EXISTS public.ai_behaviors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  personality_traits JSONB, -- e.g., {"empathy": 0.8, "directness": 0.6}
  communication_style TEXT, -- 'supportive', 'challenging', 'analytical', 'creative'
  response_length TEXT, -- 'brief', 'detailed', 'comprehensive'
  emotional_tone TEXT, -- 'warm', 'professional', 'encouraging', 'neutral'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AI model configurations for specific use cases
CREATE TABLE IF NOT EXISTS public.ai_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  model_id UUID REFERENCES public.models(id) ON DELETE CASCADE,
  use_case_id UUID REFERENCES public.ai_use_cases(id) ON DELETE CASCADE,
  behavior_id UUID REFERENCES public.ai_behaviors(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default AI use cases
INSERT INTO public.ai_use_cases (name, description, category) VALUES
('Assessment Completion', 'AI responses for completed assessments and personality tests', 'assessment'),
('Couples Challenge', 'AI analysis and guidance for couples challenges', 'challenge'),
('Narrative Exploration', 'AI guidance for narrative identity exploration', 'conversation'),
('Wellness Guidance', 'AI wellness advice and meditation guidance', 'wellness'),
('Community Moderation', 'AI moderation for community discussions', 'moderation'),
('General Chat', 'General conversational AI interactions', 'conversation'),
('Assessment Analysis', 'AI analysis of assessment results and patterns', 'analysis'),
('Goal Setting', 'AI assistance with personal goal setting and tracking', 'coaching'),
('Relationship Advice', 'AI relationship and communication guidance', 'advice'),
('Crisis Support', 'AI support for users in crisis situations', 'support')
ON CONFLICT (name) DO NOTHING;

-- Insert default AI behaviors
INSERT INTO public.ai_behaviors (name, description, personality_traits, communication_style, response_length, emotional_tone) VALUES
('Supportive Companion', 'Warm, empathetic, and encouraging', '{"empathy": 0.9, "patience": 0.8, "encouragement": 0.9}', 'supportive', 'detailed', 'warm'),
('Analytical Guide', 'Logical, thorough, and insightful', '{"analytical": 0.9, "thorough": 0.8, "insightful": 0.8}', 'analytical', 'comprehensive', 'professional'),
('Challenging Coach', 'Direct, motivating, and growth-focused', '{"directness": 0.8, "motivation": 0.9, "challenge": 0.7}', 'challenging', 'detailed', 'encouraging'),
('Creative Facilitator', 'Imaginative, inspiring, and open-minded', '{"creativity": 0.9, "openness": 0.8, "inspiration": 0.8}', 'creative', 'detailed', 'inspiring'),
('Crisis Counselor', 'Calm, professional, and supportive', '{"calmness": 0.9, "professional": 0.9, "supportive": 0.8}', 'supportive', 'detailed', 'calm')
ON CONFLICT (name) DO NOTHING;

-- Insert default prompt templates for assessment completion
INSERT INTO public.prompt_templates (use_case_id, name, system_prompt, user_prompt_template, variables, is_default)
SELECT
  uc.id,
  'Assessment Results Analysis',
  'You are a compassionate and insightful AI companion helping users understand their assessment results. Your role is to provide meaningful insights, celebrate their strengths, and offer gentle guidance for areas of growth. Always maintain a warm, supportive tone while being honest and constructive.',
  'Based on the assessment results for {user_name}, please provide a comprehensive analysis. The user completed a {assessment_type} assessment and scored: {assessment_scores}. Their responses indicate: {key_insights}. Please provide insights, strengths, areas for growth, and actionable next steps.',
  '{"user_name": "string", "assessment_type": "string", "assessment_scores": "object", "key_insights": "string"}',
  true
FROM public.ai_use_cases uc WHERE uc.name = 'Assessment Completion'
ON CONFLICT (use_case_id, name) DO NOTHING;

-- Insert default prompt templates for couples challenges
INSERT INTO public.prompt_templates (use_case_id, name, system_prompt, user_prompt_template, variables, is_default)
SELECT
  uc.id,
  'Couples Challenge Analysis',
  'You are a relationship expert AI helping couples understand their communication patterns and relationship dynamics. Provide balanced, insightful analysis that helps both partners grow together. Focus on communication, understanding, and mutual growth.',
  'Analyze this couples challenge response from {partner_name}: {challenge_response}. The challenge question was: {challenge_question}. The other partner responded: {other_partner_response}. Provide insights on communication patterns, areas of alignment, and suggestions for deeper connection.',
  '{"partner_name": "string", "challenge_response": "string", "challenge_question": "string", "other_partner_response": "string"}',
  true
FROM public.ai_use_cases uc WHERE uc.name = 'Couples Challenge'
ON CONFLICT (use_case_id, name) DO NOTHING;

-- Insert default prompt templates for narrative exploration
INSERT INTO public.prompt_templates (use_case_id, name, system_prompt, user_prompt_template, variables, is_default)
SELECT
  uc.id,
  'Narrative Identity Guidance',
  'You are a wise and empathetic guide helping users explore their narrative identity. Your role is to ask thoughtful questions, reflect on their stories, and help them discover deeper meaning in their life experiences. Be curious, non-judgmental, and encouraging.',
  'The user is exploring their narrative identity. They shared: {user_story}. Their current reflection is: {current_thoughts}. Guide them through deeper exploration by asking meaningful questions and offering gentle insights about their story patterns and themes.',
  '{"user_story": "string", "current_thoughts": "string"}',
  true
FROM public.ai_use_cases uc WHERE uc.name = 'Narrative Exploration'
ON CONFLICT (use_case_id, name) DO NOTHING;

-- Insert default prompt templates for wellness guidance
INSERT INTO public.prompt_templates (use_case_id, name, system_prompt, user_prompt_template, variables, is_default)
SELECT
  uc.id,
  'Wellness Support',
  'You are a caring wellness companion providing gentle guidance for mental and emotional wellbeing. Offer practical, evidence-based suggestions while maintaining a warm, supportive tone. Always prioritize the user''s safety and encourage professional help when needed.',
  'The user is seeking wellness support. They mentioned: {user_concern}. Their current emotional state is: {emotional_state}. Their goals are: {wellness_goals}. Provide gentle guidance, practical suggestions, and encouragement for their wellness journey.',
  '{"user_concern": "string", "emotional_state": "string", "wellness_goals": "string"}',
  true
FROM public.ai_use_cases uc WHERE uc.name = 'Wellness Guidance'
ON CONFLICT (use_case_id, name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.ai_use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI use cases (admin only)
CREATE POLICY "Admins can manage AI use cases" ON public.ai_use_cases
  FOR ALL USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for prompt templates (admin only)
CREATE POLICY "Admins can manage prompt templates" ON public.prompt_templates
  FOR ALL USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for AI behaviors (admin only)
CREATE POLICY "Admins can manage AI behaviors" ON public.ai_behaviors
  FOR ALL USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for AI model configs (admin only)
CREATE POLICY "Admins can manage AI model configs" ON public.ai_model_configs
  FOR ALL USING (auth.email() = 'admin@newomen.me');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_templates_use_case ON public.prompt_templates(use_case_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_provider ON public.prompt_templates(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_model_configs_provider ON public.ai_model_configs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_model_configs_use_case ON public.ai_model_configs(use_case_id);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_use_cases_updated_at BEFORE UPDATE ON public.ai_use_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON public.prompt_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_behaviors_updated_at BEFORE UPDATE ON public.ai_behaviors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_model_configs_updated_at BEFORE UPDATE ON public.ai_model_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
