-- Safe migration to update existing database
-- This migration uses DROP ... IF EXISTS and CREATE OR REPLACE where possible

-- First, drop the conflicting policies if they exist
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can manage AI use cases" ON public.ai_use_cases;
    DROP POLICY IF EXISTS "Admins can manage prompt templates" ON public.prompt_templates;
    DROP POLICY IF EXISTS "Admins can manage AI behaviors" ON public.ai_behaviors;
    DROP POLICY IF EXISTS "Admins can manage AI model configs" ON public.ai_model_configs;
    DROP POLICY IF EXISTS "Users can view their own attempts" ON public.assessment_attempts;
    DROP POLICY IF EXISTS "Users can create their own attempts" ON public.assessment_attempts;
END $$;

-- Ensure tables exist with proper structure (using CREATE IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.ai_use_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    use_case_id UUID REFERENCES public.ai_use_cases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT,
    variables JSONB DEFAULT '{}',
    temperature NUMERIC DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_behaviors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    personality_traits JSONB DEFAULT '{}',
    response_style JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_model_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    model_id UUID REFERENCES public.models(id) ON DELETE CASCADE,
    use_case_id UUID REFERENCES public.ai_use_cases(id) ON DELETE CASCADE,
    behavior_id UUID REFERENCES public.ai_behaviors(id) ON DELETE SET NULL,
    temperature NUMERIC DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    system_prompt TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_use_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_configs ENABLE ROW LEVEL SECURITY;

-- Recreate policies with proper checks
DO $$
BEGIN
    -- AI Use Cases Policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'ai_use_cases'
        AND policyname = 'Admins can manage AI use cases'
    ) THEN
        CREATE POLICY "Admins can manage AI use cases" ON public.ai_use_cases
            FOR ALL USING (auth.email() = 'admin@newomen.me');
    END IF;

    -- Prompt Templates Policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'prompt_templates'
        AND policyname = 'Admins can manage prompt templates'
    ) THEN
        CREATE POLICY "Admins can manage prompt templates" ON public.prompt_templates
            FOR ALL USING (auth.email() = 'admin@newomen.me');
    END IF;

    -- AI Behaviors Policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'ai_behaviors'
        AND policyname = 'Admins can manage AI behaviors'
    ) THEN
        CREATE POLICY "Admins can manage AI behaviors" ON public.ai_behaviors
            FOR ALL USING (auth.email() = 'admin@newomen.me');
    END IF;

    -- AI Model Configs Policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'ai_model_configs'
        AND policyname = 'Admins can manage AI model configs'
    ) THEN
        CREATE POLICY "Admins can manage AI model configs" ON public.ai_model_configs
            FOR ALL USING (auth.email() = 'admin@newomen.me');
    END IF;
END $$;

-- Add assessment_attempts table if not exists
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    raw_responses JSONB DEFAULT '{}',
    ai_analysis JSONB,
    score NUMERIC,
    status TEXT DEFAULT 'in_progress',
    time_spent_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on assessment_attempts
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;

-- Assessment attempts policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'assessment_attempts'
        AND policyname = 'Users can view their own attempts'
    ) THEN
        CREATE POLICY "Users can view their own attempts" ON public.assessment_attempts
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'assessment_attempts'
        AND policyname = 'Users can create their own attempts'
    ) THEN
        CREATE POLICY "Users can create their own attempts" ON public.assessment_attempts
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment_id ON public.assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_ai_model_configs_use_case ON public.ai_model_configs(use_case_id);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_use_case ON public.prompt_templates(use_case_id);
