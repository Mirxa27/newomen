-- Unified AI Management System Database Schema
-- Comprehensive tables for managing AI providers, models, voices, agents, and configurations

BEGIN;

-- Enhanced providers table with API integration metadata
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  api_base TEXT,
  status VARCHAR(20) DEFAULT 'inactive',
  description TEXT,
  max_tokens INTEGER DEFAULT 4096,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  top_p DECIMAL(3,2) DEFAULT 1.0,
  frequency_penalty DECIMAL(3,2) DEFAULT 0.0,
  presence_penalty DECIMAL(3,2) DEFAULT 0.0,
  stop_sequences TEXT[],
  system_instructions TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Provider API keys (encrypted storage)
CREATE TABLE IF NOT EXISTS provider_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider_id)
);

-- Models table
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  model_id VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  modality VARCHAR(20) DEFAULT 'text',
  context_limit INTEGER DEFAULT 4096,
  latency_hint_ms INTEGER,
  is_realtime BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider_id, model_id)
);

-- Voices table
CREATE TABLE IF NOT EXISTS voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  voice_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  locale VARCHAR(10) DEFAULT 'en-US',
  gender VARCHAR(10) DEFAULT 'neutral',
  latency_hint_ms INTEGER,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider_id, voice_id)
);

-- AI Agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  voice_id UUID REFERENCES voices(id) ON DELETE SET NULL,
  prompt_id UUID,
  system_prompt TEXT,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Service Mappings for unified configuration
CREATE TABLE IF NOT EXISTS ai_service_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  voice_id UUID REFERENCES voices(id) ON DELETE SET NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_name, service_type)
);

-- Provider health monitoring
CREATE TABLE IF NOT EXISTS provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  response_time_ms INTEGER,
  is_healthy BOOLEAN DEFAULT false,
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT,
  UNIQUE(provider_id, endpoint)
);

-- Provider sync logs
CREATE TABLE IF NOT EXISTS provider_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  sync_type VARCHAR(20) DEFAULT 'full',
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  models_discovered INTEGER DEFAULT 0,
  voices_discovered INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost DECIMAL(10,4) DEFAULT 0.0,
  success BOOLEAN DEFAULT true,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on all tables
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_service_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for providers
DROP POLICY IF EXISTS "Admins can manage providers" ON providers;
CREATE POLICY "Admins can manage providers"
  ON providers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for provider_api_keys
DROP POLICY IF EXISTS "Admins can manage provider API keys" ON provider_api_keys;
CREATE POLICY "Admins can manage provider API keys"
  ON provider_api_keys
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for models
DROP POLICY IF EXISTS "Admins can manage models" ON models;
CREATE POLICY "Admins can manage models"
  ON models
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for voices
DROP POLICY IF EXISTS "Admins can manage voices" ON voices;
CREATE POLICY "Admins can manage voices"
  ON voices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for agents
DROP POLICY IF EXISTS "Admins can manage agents" ON agents;
CREATE POLICY "Admins can manage agents"
  ON agents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for ai_service_mappings
DROP POLICY IF EXISTS "Admins can manage service mappings" ON ai_service_mappings;
CREATE POLICY "Admins can manage service mappings"
  ON ai_service_mappings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for provider_health
DROP POLICY IF EXISTS "Admins can view provider health" ON provider_health;
CREATE POLICY "Admins can view provider health"
  ON provider_health
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for provider_sync_logs
DROP POLICY IF EXISTS "Admins can view sync logs" ON provider_sync_logs;
CREATE POLICY "Admins can view sync logs"
  ON provider_sync_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'ADMIN'
    )
  );

-- RLS Policies for api_usage_tracking
DROP POLICY IF EXISTS "Admins can view usage tracking" ON api_usage_tracking;
CREATE POLICY "Admins can view usage tracking"
  ON api_usage_tracking
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'ADMIN'
    )
  );

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_models_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_voices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_ai_service_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS providers_updated_at ON providers;
CREATE TRIGGER providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW
  EXECUTE FUNCTION update_providers_updated_at();

DROP TRIGGER IF EXISTS models_updated_at ON models;
CREATE TRIGGER models_updated_at
  BEFORE UPDATE ON models
  FOR EACH ROW
  EXECUTE FUNCTION update_models_updated_at();

DROP TRIGGER IF EXISTS voices_updated_at ON voices;
CREATE TRIGGER voices_updated_at
  BEFORE UPDATE ON voices
  FOR EACH ROW
  EXECUTE FUNCTION update_voices_updated_at();

DROP TRIGGER IF EXISTS agents_updated_at ON agents;
CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_agents_updated_at();

DROP TRIGGER IF EXISTS ai_service_mappings_updated_at ON ai_service_mappings;
CREATE TRIGGER ai_service_mappings_updated_at
  BEFORE UPDATE ON ai_service_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_service_mappings_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);
CREATE INDEX IF NOT EXISTS idx_models_provider_id ON models(provider_id);
CREATE INDEX IF NOT EXISTS idx_models_enabled ON models(enabled);
CREATE INDEX IF NOT EXISTS idx_voices_provider_id ON voices(provider_id);
CREATE INDEX IF NOT EXISTS idx_voices_enabled ON voices(enabled);
CREATE INDEX IF NOT EXISTS idx_agents_model_id ON agents(model_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_ai_service_mappings_service_name ON ai_service_mappings(service_name);
CREATE INDEX IF NOT EXISTS idx_ai_service_mappings_service_type ON ai_service_mappings(service_type);
CREATE INDEX IF NOT EXISTS idx_ai_service_mappings_is_active ON ai_service_mappings(is_active);
CREATE INDEX IF NOT EXISTS idx_provider_health_provider_id ON provider_health(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_health_is_healthy ON provider_health(is_healthy);
CREATE INDEX IF NOT EXISTS idx_provider_sync_logs_provider_id ON provider_sync_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_sync_logs_status ON provider_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_service_name ON api_usage_tracking(service_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_timestamp ON api_usage_tracking(timestamp);

-- Add comments
COMMENT ON TABLE providers IS 'AI provider configurations with API integration metadata';
COMMENT ON TABLE provider_api_keys IS 'Encrypted storage for provider API keys';
COMMENT ON TABLE models IS 'AI models discovered from providers';
COMMENT ON TABLE voices IS 'AI voices available from providers';
COMMENT ON TABLE agents IS 'AI agents combining models, voices, and prompts';
COMMENT ON TABLE ai_service_mappings IS 'Unified service mappings for different app features';
COMMENT ON TABLE provider_health IS 'Health monitoring for AI providers';
COMMENT ON TABLE provider_sync_logs IS 'Logs of provider synchronization operations';
COMMENT ON TABLE api_usage_tracking IS 'Usage tracking for AI API calls';

COMMIT;
