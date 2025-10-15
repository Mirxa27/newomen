-- Create error_reports table for production error tracking
CREATE TABLE IF NOT EXISTS public.error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  stack TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL CHECK (category IN ('network', 'database', 'authentication', 'validation', 'business_logic', 'ui', 'integration', 'performance', 'security', 'unknown')),
  context JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can insert their own error reports" ON public.error_reports;
CREATE POLICY "Users can insert their own error reports"
  ON public.error_reports
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins can view all error reports" ON public.error_reports;
CREATE POLICY "Admins can view all error reports"
  ON public.error_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR subscription_tier = 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update error reports" ON public.error_reports;
CREATE POLICY "Admins can update error reports"
  ON public.error_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR subscription_tier = 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_error_reports_severity ON error_reports(severity);
CREATE INDEX IF NOT EXISTS idx_error_reports_category ON error_reports(category);
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON error_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_session_id ON error_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_created_at ON error_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_error_reports_resolved ON error_reports(resolved);

-- Create compound indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_reports_unresolved_severity 
  ON error_reports(resolved, severity, created_at DESC) 
  WHERE resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_error_reports_user_session 
  ON error_reports(user_id, session_id, created_at DESC);

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_statistics(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_errors INTEGER;
  critical_errors INTEGER;
  high_errors INTEGER;
  resolved_errors INTEGER;
  error_categories JSON;
  error_trends JSON;
BEGIN
  -- Count total errors in date range
  SELECT COUNT(*) INTO total_errors
  FROM error_reports
  WHERE created_at BETWEEN start_date AND end_date;
  
  -- Count critical errors
  SELECT COUNT(*) INTO critical_errors
  FROM error_reports
  WHERE severity = 'critical' 
    AND created_at BETWEEN start_date AND end_date;
    
  -- Count high severity errors
  SELECT COUNT(*) INTO high_errors
  FROM error_reports
  WHERE severity = 'high'
    AND created_at BETWEEN start_date AND end_date;
  
  -- Count resolved errors
  SELECT COUNT(*) INTO resolved_errors
  FROM error_reports
  WHERE resolved = TRUE
    AND created_at BETWEEN start_date AND end_date;
  
  -- Get error breakdown by category
  SELECT json_object_agg(category, error_count) INTO error_categories
  FROM (
    SELECT category, COUNT(*) as error_count
    FROM error_reports
    WHERE created_at BETWEEN start_date AND end_date
    GROUP BY category
  ) category_stats;
  
  -- Get daily error trends
  SELECT json_agg(
    json_build_object(
      'date', error_date,
      'total', total_count,
      'critical', critical_count,
      'high', high_count
    )
  ) INTO error_trends
  FROM (
    SELECT 
      DATE(created_at) as error_date,
      COUNT(*) as total_count,
      SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_count,
      SUM(CASE WHEN severity = 'high' THEN 1 ELSE 0 END) as high_count
    FROM error_reports
    WHERE created_at BETWEEN start_date AND end_date
    GROUP BY DATE(created_at)
    ORDER BY error_date
  ) daily_stats;
  
  RETURN json_build_object(
    'total_errors', total_errors,
    'critical_errors', critical_errors,
    'high_errors', high_errors,
    'resolved_errors', resolved_errors,
    'resolution_rate', 
      CASE 
        WHEN total_errors > 0 THEN ROUND((resolved_errors::DECIMAL / total_errors) * 100, 2)
        ELSE 0 
      END,
    'error_categories', COALESCE(error_categories, '{}'::json),
    'daily_trends', COALESCE(error_trends, '[]'::json),
    'date_range', json_build_object('start', start_date, 'end', end_date)
  );
END;
$$;

-- Function to mark error as resolved
CREATE OR REPLACE FUNCTION resolve_error_report(
  error_id UUID,
  resolver_user_id UUID,
  notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has admin privileges
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = resolver_user_id 
    AND (is_admin = true OR subscription_tier = 'admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to resolve error reports';
  END IF;
  
  -- Update the error report
  UPDATE error_reports 
  SET 
    resolved = TRUE,
    resolved_at = NOW(),
    resolved_by = resolver_user_id,
    resolution_notes = notes,
    updated_at = NOW()
  WHERE id = error_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Error report not found with ID: %', error_id;
  END IF;
  
  RETURN json_build_object('success', true, 'resolved_at', NOW());
END;
$$;

-- Function to get recent critical errors
CREATE OR REPLACE FUNCTION get_recent_critical_errors(
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  message TEXT,
  category TEXT,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ,
  context JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.id,
    er.message,
    er.category,
    er.user_id,
    er.session_id,
    er.created_at,
    er.context
  FROM error_reports er
  WHERE er.severity IN ('critical', 'high')
    AND er.resolved = FALSE
  ORDER BY er.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_error_statistics(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_error_report(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_critical_errors(INTEGER) TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_error_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_error_reports_updated_at_trigger ON error_reports;
CREATE TRIGGER update_error_reports_updated_at_trigger
  BEFORE UPDATE ON error_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_error_reports_updated_at();
