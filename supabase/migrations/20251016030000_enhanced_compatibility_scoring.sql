-- Enhanced Compatibility Scoring Schema
-- Adds support for multi-dimensional compatibility analysis

-- Add dimensional compatibility scores to couples_challenges table
ALTER TABLE couples_challenges 
ADD COLUMN IF NOT EXISTS compatibility_breakdown jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS relationship_stage text,
ADD COLUMN IF NOT EXISTS calculated_at timestamp with time zone;

-- Create a new table for dimension scores history
CREATE TABLE IF NOT EXISTS couples_challenge_compatibility_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id uuid NOT NULL REFERENCES couples_challenges(id) ON DELETE CASCADE,
  overall_score numeric(5,2) NOT NULL,
  communication_score numeric(5,2) NOT NULL,
  emotional_connection_score numeric(5,2) NOT NULL,
  values_alignment_score numeric(5,2) NOT NULL,
  conflict_resolution_score numeric(5,2) NOT NULL,
  intimacy_score numeric(5,2) NOT NULL,
  future_vision_score numeric(5,2) NOT NULL,
  trust_security_score numeric(5,2) NOT NULL,
  growth_mindset_score numeric(5,2) NOT NULL,
  compatibility_level text NOT NULL,
  relationship_stage text NOT NULL,
  strength_areas text[] DEFAULT ARRAY[]::text[],
  growth_areas text[] DEFAULT ARRAY[]::text[],
  recommendations text[] DEFAULT ARRAY[]::text[],
  calculated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_compatibility_history_challenge 
ON couples_challenge_compatibility_history(challenge_id, calculated_at DESC);

-- Create a function to calculate compatibility trend
CREATE OR REPLACE FUNCTION get_compatibility_trend(
  p_challenge_id uuid,
  p_dimension text DEFAULT 'overall'
)
RETURNS TABLE (
  date timestamp with time zone,
  score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    calculated_at as date,
    CASE 
      WHEN p_dimension = 'overall' THEN overall_score
      WHEN p_dimension = 'communication' THEN communication_score
      WHEN p_dimension = 'emotional_connection' THEN emotional_connection_score
      WHEN p_dimension = 'values_alignment' THEN values_alignment_score
      WHEN p_dimension = 'conflict_resolution' THEN conflict_resolution_score
      WHEN p_dimension = 'intimacy' THEN intimacy_score
      WHEN p_dimension = 'future_vision' THEN future_vision_score
      WHEN p_dimension = 'trust_security' THEN trust_security_score
      WHEN p_dimension = 'growth_mindset' THEN growth_mindset_score
      ELSE overall_score
    END as score
  FROM couples_challenge_compatibility_history
  WHERE challenge_id = p_challenge_id
  ORDER BY calculated_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get latest compatibility breakdown
CREATE OR REPLACE FUNCTION get_latest_compatibility_breakdown(p_challenge_id uuid)
RETURNS TABLE (
  overall_score numeric,
  dimensions jsonb,
  strength_areas text[],
  growth_areas text[],
  compatibility_level text,
  relationship_stage text,
  recommendations text[],
  calculated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.overall_score,
    jsonb_build_object(
      'communication', jsonb_build_object('score', h.communication_score, 'dimension', 'Communication'),
      'emotionalConnection', jsonb_build_object('score', h.emotional_connection_score, 'dimension', 'Emotional Connection'),
      'valuesAlignment', jsonb_build_object('score', h.values_alignment_score, 'dimension', 'Values Alignment'),
      'conflictResolution', jsonb_build_object('score', h.conflict_resolution_score, 'dimension', 'Conflict Resolution'),
      'intimacy', jsonb_build_object('score', h.intimacy_score, 'dimension', 'Intimacy'),
      'futureVision', jsonb_build_object('score', h.future_vision_score, 'dimension', 'Future Vision'),
      'trustSecurity', jsonb_build_object('score', h.trust_security_score, 'dimension', 'Trust & Security'),
      'growthMindset', jsonb_build_object('score', h.growth_mindset_score, 'dimension', 'Growth Mindset')
    ) as dimensions,
    h.strength_areas,
    h.growth_areas,
    h.compatibility_level,
    h.relationship_stage,
    h.recommendations,
    h.calculated_at
  FROM couples_challenge_compatibility_history h
  WHERE h.challenge_id = p_challenge_id
  ORDER BY h.calculated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to save compatibility analysis
CREATE OR REPLACE FUNCTION save_compatibility_analysis(
  p_challenge_id uuid,
  p_overall_score numeric,
  p_communication_score numeric,
  p_emotional_connection_score numeric,
  p_values_alignment_score numeric,
  p_conflict_resolution_score numeric,
  p_intimacy_score numeric,
  p_future_vision_score numeric,
  p_trust_security_score numeric,
  p_growth_mindset_score numeric,
  p_compatibility_level text,
  p_relationship_stage text,
  p_strength_areas text[],
  p_growth_areas text[],
  p_recommendations text[],
  p_breakdown jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_history_id uuid;
BEGIN
  -- Insert into history table
  INSERT INTO couples_challenge_compatibility_history (
    challenge_id,
    overall_score,
    communication_score,
    emotional_connection_score,
    values_alignment_score,
    conflict_resolution_score,
    intimacy_score,
    future_vision_score,
    trust_security_score,
    growth_mindset_score,
    compatibility_level,
    relationship_stage,
    strength_areas,
    growth_areas,
    recommendations
  ) VALUES (
    p_challenge_id,
    p_overall_score,
    p_communication_score,
    p_emotional_connection_score,
    p_values_alignment_score,
    p_conflict_resolution_score,
    p_intimacy_score,
    p_future_vision_score,
    p_trust_security_score,
    p_growth_mindset_score,
    p_compatibility_level,
    p_relationship_stage,
    p_strength_areas,
    p_growth_areas,
    p_recommendations
  ) RETURNING id INTO v_history_id;

  -- Update couples_challenges table with latest scores
  UPDATE couples_challenges
  SET 
    compatibility_score = p_overall_score,
    compatibility_breakdown = p_breakdown,
    relationship_stage = p_relationship_stage,
    calculated_at = now(),
    updated_at = now()
  WHERE id = p_challenge_id;

  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for the new table
ALTER TABLE couples_challenge_compatibility_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view compatibility history for their own challenges
CREATE POLICY "Users can view their own compatibility history"
ON couples_challenge_compatibility_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM couples_challenges cc
    WHERE cc.id = couples_challenge_compatibility_history.challenge_id
    AND (cc.initiator_id = auth.uid() OR cc.partner_id = auth.uid())
  )
);

-- Policy: System can insert compatibility history
CREATE POLICY "System can insert compatibility history"
ON couples_challenge_compatibility_history
FOR INSERT
WITH CHECK (true);

-- Add comments
COMMENT ON TABLE couples_challenge_compatibility_history IS 'Stores historical compatibility scores for tracking relationship progress over time';
COMMENT ON COLUMN couples_challenges.compatibility_breakdown IS 'Detailed breakdown of compatibility scores across all dimensions';
COMMENT ON COLUMN couples_challenges.relationship_stage IS 'Current relationship stage: Exploring, Building, Deepening, or Thriving';
COMMENT ON COLUMN couples_challenges.calculated_at IS 'Timestamp when compatibility was last calculated';

-- Create a view for easy compatibility insights
CREATE OR REPLACE VIEW couples_compatibility_insights AS
SELECT 
  cc.id as challenge_id,
  cc.initiator_id,
  cc.partner_id,
  cc.compatibility_score as overall_score,
  cc.relationship_stage,
  cc.status,
  h.communication_score,
  h.emotional_connection_score,
  h.values_alignment_score,
  h.conflict_resolution_score,
  h.intimacy_score,
  h.future_vision_score,
  h.trust_security_score,
  h.growth_mindset_score,
  h.compatibility_level,
  h.strength_areas,
  h.growth_areas,
  h.recommendations,
  h.calculated_at,
  cc.created_at,
  cc.updated_at
FROM couples_challenges cc
LEFT JOIN LATERAL (
  SELECT *
  FROM couples_challenge_compatibility_history
  WHERE challenge_id = cc.id
  ORDER BY calculated_at DESC
  LIMIT 1
) h ON true;

-- Grant permissions
GRANT SELECT ON couples_compatibility_insights TO authenticated;
GRANT ALL ON couples_challenge_compatibility_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_compatibility_trend TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_compatibility_breakdown TO authenticated;
GRANT EXECUTE ON FUNCTION save_compatibility_analysis TO authenticated;

