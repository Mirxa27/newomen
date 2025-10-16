-- Create conflict resolution system tables
CREATE TABLE IF NOT EXISTS public.conflict_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.couples_challenges(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('escalation', 'defensiveness', 'stonewalling', 'criticism', 'contempt')),
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger_message TEXT,
  context TEXT,
  resolution_suggested BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conflict_resolution_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.couples_challenges(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('active_listening', 'i_feel_statements', 'perspective_taking', 'de_escalation', 'repair_attempt')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  exercise_data JSONB NOT NULL,
  user_response JSONB,
  partner_response JSONB,
  completed_at TIMESTAMPTZ,
  effectiveness_score INTEGER CHECK (effectiveness_score >= 1 AND effectiveness_score <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conflict_resolution_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.couples_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('escalation_frequency', 'repair_success_rate', 'conflict_duration', 'emotional_regulation', 'communication_improvement')),
  value DECIMAL NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conflict_resolution_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('i_feel_statement', 'active_listening', 'timeout_request', 'repair_attempt')),
  template_text TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add conflict resolution columns to couples_challenges table
DO $$ 
BEGIN
  -- Add conflict_resolution_enabled column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'couples_challenges' 
    AND column_name = 'conflict_resolution_enabled'
  ) THEN
    ALTER TABLE public.couples_challenges ADD COLUMN conflict_resolution_enabled BOOLEAN DEFAULT true;
  END IF;

  -- Add conflict_resolution_data column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'couples_challenges' 
    AND column_name = 'conflict_resolution_data'
  ) THEN
    ALTER TABLE public.couples_challenges ADD COLUMN conflict_resolution_data JSONB;
  END IF;

  -- Add conflict_resolution_score column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'couples_challenges' 
    AND column_name = 'conflict_resolution_score'
  ) THEN
    ALTER TABLE public.couples_challenges ADD COLUMN conflict_resolution_score INTEGER;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.conflict_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_resolution_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_resolution_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_resolution_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conflict_patterns
DROP POLICY IF EXISTS "Users can view their own conflict patterns" ON public.conflict_patterns;
CREATE POLICY "Users can view their own conflict patterns"
  ON public.conflict_patterns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples_challenges
      WHERE couples_challenges.id = conflict_patterns.challenge_id
      AND (couples_challenges.initiator_id = auth.uid() OR couples_challenges.partner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage all conflict patterns" ON public.conflict_patterns;
CREATE POLICY "Admins can manage all conflict patterns"
  ON public.conflict_patterns
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for conflict_resolution_exercises
DROP POLICY IF EXISTS "Users can view their own conflict exercises" ON public.conflict_resolution_exercises;
CREATE POLICY "Users can view their own conflict exercises"
  ON public.conflict_resolution_exercises
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples_challenges
      WHERE couples_challenges.id = conflict_resolution_exercises.challenge_id
      AND (couples_challenges.initiator_id = auth.uid() OR couples_challenges.partner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own conflict exercises" ON public.conflict_resolution_exercises;
CREATE POLICY "Users can update their own conflict exercises"
  ON public.conflict_resolution_exercises
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.couples_challenges
      WHERE couples_challenges.id = conflict_resolution_exercises.challenge_id
      AND (couples_challenges.initiator_id = auth.uid() OR couples_challenges.partner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage all conflict exercises" ON public.conflict_resolution_exercises;
CREATE POLICY "Admins can manage all conflict exercises"
  ON public.conflict_resolution_exercises
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for conflict_resolution_metrics
DROP POLICY IF EXISTS "Users can view their own conflict metrics" ON public.conflict_resolution_metrics;
CREATE POLICY "Users can view their own conflict metrics"
  ON public.conflict_resolution_metrics
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all conflict metrics" ON public.conflict_resolution_metrics;
CREATE POLICY "Admins can manage all conflict metrics"
  ON public.conflict_resolution_metrics
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for conflict_resolution_templates
DROP POLICY IF EXISTS "Anyone can view active conflict templates" ON public.conflict_resolution_templates;
CREATE POLICY "Anyone can view active conflict templates"
  ON public.conflict_resolution_templates
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage all conflict templates" ON public.conflict_resolution_templates;
CREATE POLICY "Admins can manage all conflict templates"
  ON public.conflict_resolution_templates
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conflict_patterns_challenge ON public.conflict_patterns(challenge_id);
CREATE INDEX IF NOT EXISTS idx_conflict_patterns_type ON public.conflict_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_conflict_patterns_detected_at ON public.conflict_patterns(detected_at);
CREATE INDEX IF NOT EXISTS idx_conflict_exercises_challenge ON public.conflict_resolution_exercises(challenge_id);
CREATE INDEX IF NOT EXISTS idx_conflict_exercises_type ON public.conflict_resolution_exercises(exercise_type);
CREATE INDEX IF NOT EXISTS idx_conflict_exercises_status ON public.conflict_resolution_exercises(status);
CREATE INDEX IF NOT EXISTS idx_conflict_metrics_challenge ON public.conflict_resolution_metrics(challenge_id);
CREATE INDEX IF NOT EXISTS idx_conflict_metrics_user ON public.conflict_resolution_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_conflict_metrics_type ON public.conflict_resolution_metrics(metric_type);

-- Add update timestamp triggers
DROP TRIGGER IF EXISTS update_conflict_patterns_updated_at ON public.conflict_patterns;
CREATE TRIGGER update_conflict_patterns_updated_at
  BEFORE UPDATE ON public.conflict_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conflict_exercises_updated_at ON public.conflict_resolution_exercises;
CREATE TRIGGER update_conflict_exercises_updated_at
  BEFORE UPDATE ON public.conflict_resolution_exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conflict_templates_updated_at ON public.conflict_resolution_templates;
CREATE TRIGGER update_conflict_templates_updated_at
  BEFORE UPDATE ON public.conflict_resolution_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default conflict resolution templates
INSERT INTO public.conflict_resolution_templates (name, description, template_type, template_text, variables) VALUES
(
  'I Feel Statement',
  'Express your feelings without blame using "I feel" statements',
  'i_feel_statement',
  'I feel {emotion} when {situation} because {reason}. I would appreciate {request}.',
  '{"emotion": ["sad", "frustrated", "hurt", "angry", "disappointed"], "situation": ["we discuss this topic", "this happens", "I feel unheard"], "reason": ["it makes me feel unimportant", "it affects our connection", "I value our relationship"], "request": ["if we could find a different approach", "if we could take a break and return to this", "if we could listen to each other more"]}'
),
(
  'Active Listening',
  'Practice reflective listening to ensure understanding',
  'active_listening',
  'What I hear you saying is {summary}. Is that right?',
  '{"summary": ["that you feel...", "that you need...", "that you want..."]}'
),
(
  'Timeout Request',
  'Request a break when emotions are running high',
  'timeout_request',
  'I''m feeling overwhelmed right now. Can we take a 20-minute break and come back to this?',
  '{}'
),
(
  'Repair Attempt',
  'Make a repair attempt to reconnect after conflict',
  'repair_attempt',
  'I appreciate that {positive_quality}. Can we try {alternative_approach}?',
  '{"positive_quality": ["you''re trying to understand", "you care about our relationship", "we both want to resolve this"], "alternative_approach": ["starting over", "focusing on solutions", "listening without interrupting"]}'
),
(
  'Perspective Taking',
  'Try to see the situation from your partner''s perspective',
  'active_listening',
  'Help me understand your perspective. What is this like for you?',
  '{}'
);

-- Create function to detect conflict patterns
CREATE OR REPLACE FUNCTION public.detect_conflict_pattern(
  challenge_id UUID,
  message_content TEXT,
  sender_role TEXT
)
RETURNS TABLE(pattern_type TEXT, severity INTEGER, trigger_message TEXT, context TEXT) AS $$
DECLARE
  pattern RECORD;
BEGIN
  -- Check for escalation patterns (rapid-fire messages, intense language)
  IF message_content ~* '(angry|furious|livid|hate|stupid|idiot|never|always)' THEN
    pattern_type := 'escalation';
    severity := 3;
    trigger_message := message_content;
    context := 'Intense language detected';
    RETURN NEXT;
  END IF;

  -- Check for defensiveness patterns (justification, counter-attack)
  IF message_content ~* '(but you|you always|you never|it''s not my fault|why are you)' THEN
    pattern_type := 'defensiveness';
    severity := 2;
    trigger_message := message_content;
    context := 'Defensive language pattern detected';
    RETURN NEXT;
  END IF;

  -- Check for stonewalling patterns (withdrawal, disengagement)
  IF message_content ~* '(fine|whatever|I''m done|not talking)' OR LENGTH(message_content) < 10 THEN
    pattern_type := 'stonewalling';
    severity := 2;
    trigger_message := message_content;
    context := 'Potential withdrawal or stonewalling detected';
    RETURN NEXT;
  END IF;

  -- Check for criticism patterns (global attacks, character assassination)
  IF message_content ~* '(you are|you''re so|always so|never so)' THEN
    pattern_type := 'criticism';
    severity := 3;
    trigger_message := message_content;
    context := 'Criticism pattern detected';
    RETURN NEXT;
  END IF;

  -- Check for contempt patterns (sarcasm, mockery, disrespect)
  IF message_content ~* '(sarcastic|mock|ridiculous|pathetic|whatever)' THEN
    pattern_type := 'contempt';
    severity := 4;
    trigger_message := message_content;
    context := 'Contemptuous language detected';
    RETURN NEXT;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate conflict resolution score
CREATE OR REPLACE FUNCTION public.calculate_conflict_score(challenge_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_patterns INTEGER;
  resolved_patterns INTEGER;
  exercise_completion_rate DECIMAL;
  final_score INTEGER;
BEGIN
  -- Count total conflict patterns
  SELECT COUNT(*) INTO total_patterns
  FROM public.conflict_patterns
  WHERE conflict_patterns.challenge_id = calculate_conflict_score.challenge_id;

  -- Count resolved patterns
  SELECT COUNT(*) INTO resolved_patterns
  FROM public.conflict_patterns
  WHERE conflict_patterns.challenge_id = calculate_conflict_score.challenge_id
  AND conflict_patterns.resolution_suggested = true;

  -- Calculate exercise completion rate
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 1.0
      ELSE COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)
    END INTO exercise_completion_rate
  FROM public.conflict_resolution_exercises
  WHERE challenge_id = calculate_conflict_score.challenge_id;

  -- Calculate final score (0-100)
  IF total_patterns = 0 THEN
    final_score := 100;
  ELSE
    final_score := ROUND(
      (resolved_patterns::DECIMAL / total_patterns * 0.6 + 
       exercise_completion_rate * 0.4) * 100
    );
  END IF;

  RETURN final_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;