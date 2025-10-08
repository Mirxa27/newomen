-- Create API configurations table
CREATE TABLE IF NOT EXISTS api_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  mode VARCHAR(20) DEFAULT 'sandbox',
  is_active BOOLEAN DEFAULT false,
  test_status VARCHAR(20),
  last_tested TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage API configurations
CREATE POLICY "Admins can view API configurations"
  ON api_configurations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
        AND user_profiles.role IN ('admin', 'ADMIN')
    )
  );

CREATE POLICY "Admins can insert API configurations"
  ON api_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
        AND user_profiles.role IN ('admin', 'ADMIN')
    )
  );

CREATE POLICY "Admins can update API configurations"
  ON api_configurations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
        AND user_profiles.role IN ('admin', 'ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_profiles
      WHERE (user_profiles.user_id = auth.uid() OR user_profiles.id = auth.uid())
        AND user_profiles.role IN ('admin', 'ADMIN')
    )
  );

CREATE POLICY "Admins can delete API configurations"
  ON api_configurations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_api_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_configurations_updated_at
  BEFORE UPDATE ON api_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_api_configurations_updated_at();

-- Add indexes
CREATE INDEX idx_api_configurations_service ON api_configurations(service);
CREATE INDEX idx_api_configurations_is_active ON api_configurations(is_active);

-- Add comments
COMMENT ON TABLE api_configurations IS 'Stores third-party API configurations for services like PayPal, OpenAI, etc.';
COMMENT ON COLUMN api_configurations.service IS 'Name of the service (paypal, openai, stripe, etc.)';
COMMENT ON COLUMN api_configurations.client_id IS 'API client ID or public key (encrypted)';
COMMENT ON COLUMN api_configurations.client_secret IS 'API secret key (encrypted)';
COMMENT ON COLUMN api_configurations.mode IS 'Environment mode (sandbox, live, production)';
COMMENT ON COLUMN api_configurations.is_active IS 'Whether this integration is currently active';
COMMENT ON COLUMN api_configurations.test_status IS 'Result of the last connection test (success, failed)';
COMMENT ON COLUMN api_configurations.last_tested IS 'Timestamp of the last successful test';
