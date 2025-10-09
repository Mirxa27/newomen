-- Create user_assessment_results table for storing completed assessments
CREATE TABLE IF NOT EXISTS user_assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id TEXT NOT NULL,
  answers JSONB NOT NULL,
  analysis JSONB NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),

  -- Indexes for better query performance
  CONSTRAINT user_assessment_results_user_id_assessment_id_key UNIQUE (user_id, assessment_id)
);

-- Enable RLS on the table
ALTER TABLE user_assessment_results ENABLE ROW LEVEL SECURITY;

-- Add policies for user access
CREATE POLICY "Users can view their own assessment results"
  ON user_assessment_results FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own assessment results"
  ON user_assessment_results FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all assessment results"
  ON user_assessment_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Grant appropriate privileges
GRANT ALL ON user_assessment_results TO authenticated;
GRANT ALL ON user_assessment_results TO service_role;
