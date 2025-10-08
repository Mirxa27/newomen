-- AI Configurations System Migration
-- Creates comprehensive AI provider configuration for assessments, quizzes, challenges, and other services

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS ai_service_configs CASCADE;
DROP TABLE IF EXISTS ai_configurations CASCADE;

-- AI Configurations table
-- Stores AI provider configurations (OpenAI, Anthropic, custom OpenAI-compatible providers)
CREATE TABLE IF NOT EXISTS ai_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Configuration metadata
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default config for a provider type

  -- Provider details
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'azure', 'custom')),
  provider_name TEXT, -- Display name for custom providers
  model_name TEXT NOT NULL,

  -- API configuration
  api_base_url TEXT, -- For custom/compatible providers (e.g., Azure OpenAI)
  api_key_encrypted TEXT, -- Encrypted API key (use Supabase vault in production)
  api_version TEXT, -- For Azure and versioned APIs

  -- Model parameters
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 2000 CHECK (max_tokens > 0),
  top_p DECIMAL(3,2) DEFAULT 1.0 CHECK (top_p >= 0 AND top_p <= 1),
  frequency_penalty DECIMAL(3,2) DEFAULT 0.0 CHECK (frequency_penalty >= -2 AND frequency_penalty <= 2),
  presence_penalty DECIMAL(3,2) DEFAULT 0.0 CHECK (presence_penalty >= -2 AND presence_penalty <= 2),
  stop_sequences TEXT[], -- Array of stop sequences

  -- Custom headers for compatible providers
  custom_headers JSONB DEFAULT '{}'::jsonb,

  -- Cost tracking
  cost_per_1k_prompt_tokens DECIMAL(10,6),
  cost_per_1k_completion_tokens DECIMAL(10,6),

  -- Rate limiting
  max_requests_per_minute INTEGER DEFAULT 60,
  max_tokens_per_minute INTEGER DEFAULT 90000,

  -- Prompt templates
  system_prompt TEXT,
  user_prompt_template TEXT,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  last_tested_at TIMESTAMPTZ,
  test_status TEXT CHECK (test_status IN ('success', 'failed', 'pending', NULL))
);

-- AI Service Configurations table
-- Maps AI configurations to specific services (assessments, quizzes, challenges, etc.)
CREATE TABLE IF NOT EXISTS ai_service_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Service type
  service_type TEXT NOT NULL CHECK (service_type IN (
    'assessment_generation',
    'assessment_scoring',
    'assessment_feedback',
    'quiz_generation',
    'quiz_scoring',
    'challenge_generation',
    'challenge_feedback',
    'voice_conversation',
    'content_moderation',
    'text_analysis',
    'summarization',
    'other'
  )),

  -- Service-specific identifier (optional)
  service_id UUID, -- Reference to specific assessment/quiz/challenge
  service_name TEXT, -- Human-readable service name

  -- AI Configuration
  ai_configuration_id UUID REFERENCES ai_configurations(id) ON DELETE CASCADE,

  -- Priority and fallback
  priority INTEGER DEFAULT 1, -- Higher priority used first
  is_fallback BOOLEAN DEFAULT false, -- Use as fallback if primary fails

  -- Service-specific prompt overrides
  system_prompt_override TEXT,
  user_prompt_template_override TEXT,
  temperature_override DECIMAL(3,2),
  max_tokens_override INTEGER,

  -- Activation
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one primary config per service
  CONSTRAINT unique_service_config UNIQUE (service_type, service_id, ai_configuration_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_configurations_provider ON ai_configurations(provider);
CREATE INDEX IF NOT EXISTS idx_ai_configurations_is_active ON ai_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_configurations_is_default ON ai_configurations(is_default);
CREATE INDEX IF NOT EXISTS idx_ai_service_configs_service_type ON ai_service_configs(service_type);
CREATE INDEX IF NOT EXISTS idx_ai_service_configs_service_id ON ai_service_configs(service_id);
CREATE INDEX IF NOT EXISTS idx_ai_service_configs_ai_config_id ON ai_service_configs(ai_configuration_id);
CREATE INDEX IF NOT EXISTS idx_ai_service_configs_priority ON ai_service_configs(priority DESC);

-- RLS Policies
ALTER TABLE ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_service_configs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage AI configurations" ON ai_configurations;
DROP POLICY IF EXISTS "Admins can manage service configurations" ON ai_service_configs;
DROP POLICY IF EXISTS "Users can view active configurations" ON ai_configurations;
DROP POLICY IF EXISTS "Service can read configurations" ON ai_configurations;
DROP POLICY IF EXISTS "Service can read service configs" ON ai_service_configs;

-- Admins have full access
CREATE POLICY "Admins can manage AI configurations"
  ON ai_configurations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage service configurations"
  ON ai_service_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Service/backend can read active configurations
CREATE POLICY "Service can read configurations"
  ON ai_configurations
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Service can read service configs"
  ON ai_service_configs
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_configurations_updated_at ON ai_configurations;
CREATE TRIGGER ai_configurations_updated_at
  BEFORE UPDATE ON ai_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_configurations_updated_at();

DROP TRIGGER IF EXISTS ai_service_configs_updated_at ON ai_service_configs;
CREATE TRIGGER ai_service_configs_updated_at
  BEFORE UPDATE ON ai_service_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_configurations_updated_at();

DROP FUNCTION IF EXISTS get_ai_config_for_service(TEXT, UUID);
DROP FUNCTION IF EXISTS get_ai_config_for_service(TEXT);

-- Helper function to get best AI config for a service
CREATE OR REPLACE FUNCTION get_ai_config_for_service(
  p_service_type TEXT,
  p_service_id UUID DEFAULT NULL
)
RETURNS TABLE (
  config_id UUID,
  config_name TEXT,
  provider TEXT,
  model_name TEXT,
  api_base_url TEXT,
  temperature DECIMAL,
  max_tokens INTEGER,
  system_prompt TEXT,
  user_prompt_template TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.id,
    ac.name,
    ac.provider,
    ac.model_name,
    ac.api_base_url,
    COALESCE(sc.temperature_override, ac.temperature),
    COALESCE(sc.max_tokens_override, ac.max_tokens),
    COALESCE(sc.system_prompt_override, ac.system_prompt),
    COALESCE(sc.user_prompt_template_override, ac.user_prompt_template)
  FROM ai_service_configs sc
  JOIN ai_configurations ac ON ac.id = sc.ai_configuration_id
  WHERE sc.service_type = p_service_type
    AND (p_service_id IS NULL OR sc.service_id = p_service_id)
    AND sc.is_active = true
    AND ac.is_active = true
  ORDER BY
    sc.priority DESC,
    sc.is_fallback ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default configurations
INSERT INTO ai_configurations (
  name,
  description,
  provider,
  model_name,
  temperature,
  max_tokens,
  is_default,
  system_prompt,
  cost_per_1k_prompt_tokens,
  cost_per_1k_completion_tokens
) VALUES
(
  'GPT-4 Turbo - Assessment Generation',
  'High-quality assessment generation with GPT-4 Turbo',
  'openai',
  'gpt-4-turbo-preview',
  0.7,
  4000,
  true,
  'You are an expert psychologist and assessment designer. Create thoughtful, evidence-based assessments that help users gain meaningful insights about themselves.',
  0.01,
  0.03
),
(
  'GPT-3.5 Turbo - Quick Feedback',
  'Fast, cost-effective feedback generation',
  'openai',
  'gpt-3.5-turbo',
  0.8,
  2000,
  false,
  'You are a supportive coach providing personalized feedback based on assessment results.',
  0.0005,
  0.0015
),
(
  'NewMe Voice Agent',
  'Dedicated configuration for NewMe voice conversations',
  'openai',
  'gpt-4-turbo-preview',
  0.8,
  2000,
  false,
  'You are NewMe, a warm and empathetic AI companion...',
  0.01,
  0.03
)
ON CONFLICT DO NOTHING;

-- Insert default service mappings
INSERT INTO ai_service_configs (
  service_type,
  ai_configuration_id,
  priority,
  is_active
)
SELECT
  'assessment_generation',
  id,
  1,
  true
FROM ai_configurations
WHERE name = 'GPT-4 Turbo - Assessment Generation'
ON CONFLICT DO NOTHING;

INSERT INTO ai_service_configs (
  service_type,
  ai_configuration_id,
  priority,
  is_active
)
SELECT
  'assessment_feedback',
  id,
  1,
  true
FROM ai_configurations
WHERE name = 'GPT-3.5 Turbo - Quick Feedback'
ON CONFLICT DO NOTHING;

INSERT INTO ai_service_configs (
  service_type,
  ai_configuration_id,
  priority,
  is_active
)
SELECT
  'voice_conversation',
  id,
  1,
  true
FROM ai_configurations
WHERE name = 'NewMe Voice Agent'
ON CONFLICT DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE ai_configurations IS 'Stores AI provider configurations for various models and services';
COMMENT ON TABLE ai_service_configs IS 'Maps AI configurations to specific services with optional overrides';
COMMENT ON COLUMN ai_configurations.provider IS 'AI provider: openai, anthropic, google, azure, custom (OpenAI-compatible)';
COMMENT ON COLUMN ai_configurations.api_base_url IS 'Custom API endpoint for OpenAI-compatible providers (e.g., Azure OpenAI)';
COMMENT ON COLUMN ai_configurations.custom_headers IS 'Custom HTTP headers for API requests (JSON object)';
COMMENT ON COLUMN ai_service_configs.service_type IS 'Type of service using this configuration';
COMMENT ON COLUMN ai_service_configs.priority IS 'Higher priority configurations are used first';
COMMENT ON FUNCTION get_ai_config_for_service IS 'Returns the best AI configuration for a given service type and optional service ID';
