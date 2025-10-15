-- AI Feature Integration Migration
-- Add tables for connecting unified AI management with app features

-- AI Feature Configurations Table
CREATE TABLE IF NOT EXISTS ai_feature_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature VARCHAR(50) NOT NULL,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  voice_id UUID REFERENCES voices(id) ON DELETE SET NULL,
  system_prompt TEXT NOT NULL,
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 1000 CHECK (max_tokens > 0),
  enabled BOOLEAN DEFAULT true,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique feature configurations
  UNIQUE(feature)
);

-- AI Feature Usage Tracking
CREATE TABLE IF NOT EXISTS ai_feature_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Feature Performance Metrics
CREATE TABLE IF NOT EXISTS ai_feature_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,6) DEFAULT 0,
  avg_latency_ms DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique metrics per feature per day
  UNIQUE(feature, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_feature_configs_feature ON ai_feature_configs(feature);
CREATE INDEX IF NOT EXISTS idx_ai_feature_configs_enabled ON ai_feature_configs(enabled);
CREATE INDEX IF NOT EXISTS idx_ai_feature_usage_feature ON ai_feature_usage(feature);
CREATE INDEX IF NOT EXISTS idx_ai_feature_usage_user_id ON ai_feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feature_usage_created_at ON ai_feature_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_feature_metrics_feature_date ON ai_feature_metrics(feature, date);

-- RLS Policies
ALTER TABLE ai_feature_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feature_metrics ENABLE ROW LEVEL SECURITY;

-- Admin can manage all AI feature configs
CREATE POLICY "Admins can manage AI feature configs" ON ai_feature_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Users can view their own usage
CREATE POLICY "Users can view own AI feature usage" ON ai_feature_usage
  FOR SELECT USING (user_id = auth.uid());

-- System can insert usage records
CREATE POLICY "System can insert AI feature usage" ON ai_feature_usage
  FOR INSERT WITH CHECK (true);

-- Admins can view all usage
CREATE POLICY "Admins can view all AI feature usage" ON ai_feature_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Admins can manage metrics
CREATE POLICY "Admins can manage AI feature metrics" ON ai_feature_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_ai_feature_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_feature_configs_updated_at
  BEFORE UPDATE ON ai_feature_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_feature_configs_updated_at();

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_ai_feature_metrics()
RETURNS void AS $$
BEGIN
  INSERT INTO ai_feature_metrics (
    feature,
    date,
    total_requests,
    successful_requests,
    failed_requests,
    total_tokens,
    total_cost,
    avg_latency_ms
  )
  SELECT 
    feature,
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE success = true) as successful_requests,
    COUNT(*) FILTER (WHERE success = false) as failed_requests,
    COALESCE(SUM(tokens_used), 0) as total_tokens,
    COALESCE(SUM(cost), 0) as total_cost,
    COALESCE(AVG(latency_ms), 0) as avg_latency_ms
  FROM ai_feature_usage
  WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
  GROUP BY feature, DATE(created_at)
  ON CONFLICT (feature, date) DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    successful_requests = EXCLUDED.successful_requests,
    failed_requests = EXCLUDED.failed_requests,
    total_tokens = EXCLUDED.total_tokens,
    total_cost = EXCLUDED.total_cost,
    avg_latency_ms = EXCLUDED.avg_latency_ms;
END;
$$ LANGUAGE plpgsql;

-- Insert default AI feature configurations
INSERT INTO ai_feature_configs (feature, model_id, system_prompt, temperature, max_tokens, enabled)
SELECT 
  'assessment',
  m.id,
  'You are an expert assessment evaluator. Analyze responses objectively and provide detailed scoring with constructive feedback.',
  0.3,
  2000,
  true
FROM models m 
WHERE m.model_id LIKE '%gpt%' OR m.model_id LIKE '%claude%'
LIMIT 1;

INSERT INTO ai_feature_configs (feature, model_id, system_prompt, temperature, max_tokens, enabled)
SELECT 
  'couples',
  m.id,
  'You are a skilled relationship counselor. Help couples understand their dynamics and provide insights for growth.',
  0.7,
  2000,
  true
FROM models m 
WHERE m.model_id LIKE '%gpt%' OR m.model_id LIKE '%claude%'
LIMIT 1;

INSERT INTO ai_feature_configs (feature, model_id, system_prompt, temperature, max_tokens, enabled)
SELECT 
  'wellness',
  m.id,
  'You are a compassionate wellness coach. Provide supportive, evidence-based guidance for mental health and wellness.',
  0.8,
  1500,
  true
FROM models m 
WHERE m.model_id LIKE '%gpt%' OR m.model_id LIKE '%claude%'
LIMIT 1;

INSERT INTO ai_feature_configs (feature, model_id, system_prompt, temperature, max_tokens, enabled)
SELECT 
  'newme',
  m.id,
  'You are NewMe, a friendly and supportive AI companion. Provide helpful, encouraging responses.',
  0.7,
  1000,
  true
FROM models m 
WHERE m.model_id LIKE '%gpt%' OR m.model_id LIKE '%claude%'
LIMIT 1;

INSERT INTO ai_feature_configs (feature, model_id, system_prompt, temperature, max_tokens, enabled)
SELECT 
  'community',
  m.id,
  'You are a community engagement specialist. Create engaging, helpful content for community discussions.',
  0.8,
  1500,
  true
FROM models m 
WHERE m.model_id LIKE '%gpt%' OR m.model_id LIKE '%claude%'
LIMIT 1;
