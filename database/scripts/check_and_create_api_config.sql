-- Check if api_configurations table exists and create it if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_configurations') THEN
        -- Create API configurations table
        CREATE TABLE api_configurations (
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

        -- Enable RLS
        ALTER TABLE api_configurations ENABLE ROW LEVEL SECURITY;

        -- Add comments
        COMMENT ON TABLE api_configurations IS 'Stores third-party API configurations for services like PayPal, OpenAI, etc.';

        RAISE NOTICE 'Table api_configurations created successfully';
    ELSE
        RAISE NOTICE 'Table api_configurations already exists';
    END IF;
END $$;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'api_configurations'
    AND policyname = 'Admins can view API configurations'
  ) THEN
    CREATE POLICY "Admins can view API configurations"
      ON api_configurations FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
    RAISE NOTICE 'Policy "Admins can view API configurations" created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'api_configurations'
    AND policyname = 'Admins can insert API configurations'
  ) THEN
    CREATE POLICY "Admins can insert API configurations"
      ON api_configurations FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
    RAISE NOTICE 'Policy "Admins can insert API configurations" created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'api_configurations'
    AND policyname = 'Admins can update API configurations'
  ) THEN
    CREATE POLICY "Admins can update API configurations"
      ON api_configurations FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
    RAISE NOTICE 'Policy "Admins can update API configurations" created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'api_configurations'
    AND policyname = 'Admins can delete API configurations'
  ) THEN
    CREATE POLICY "Admins can delete API configurations"
      ON api_configurations FOR DELETE TO authenticated
      USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
    RAISE NOTICE 'Policy "Admins can delete API configurations" created';
  END IF;
END $$;

-- Create trigger function and trigger
CREATE OR REPLACE FUNCTION update_api_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS api_configurations_updated_at ON api_configurations;
CREATE TRIGGER api_configurations_updated_at
  BEFORE UPDATE ON api_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_api_configurations_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_configurations_service ON api_configurations(service);
CREATE INDEX IF NOT EXISTS idx_api_configurations_is_active ON api_configurations(is_active);

-- Display result
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_configurations')
    THEN 'SUCCESS: api_configurations table is ready'
    ELSE 'ERROR: Failed to create api_configurations table'
  END as status;
