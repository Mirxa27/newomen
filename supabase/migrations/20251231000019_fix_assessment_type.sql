-- Fix assessment type column and index
ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS assessment_type TEXT;

COMMENT ON COLUMN assessments.assessment_type
  IS 'Type of assessment (e.g. personality, relationship, etc.)';

DROP INDEX IF EXISTS idx_assessments_type;
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
