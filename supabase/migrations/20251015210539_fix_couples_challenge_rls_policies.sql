-- Enable RLS on couples_challenge related tables
ALTER TABLE public.couples_challenge_ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_challenge_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_challenge_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for couples_challenge_ai_configs
CREATE POLICY "Anyone can view AI configs for couples challenges"
  ON public.couples_challenge_ai_configs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage couples challenge AI configs"
  ON public.couples_challenge_ai_configs
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Create policies for couples_challenge_ai_usage
CREATE POLICY "Users can view their own couples challenge AI usage"
  ON public.couples_challenge_ai_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM couples_challenges cc
      WHERE cc.id = couples_challenge_ai_usage.challenge_id
        AND (cc.initiator_id = auth.uid() OR cc.partner_id = auth.uid())
    )
  );

CREATE POLICY "Service role can insert couples challenge AI usage"
  ON public.couples_challenge_ai_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all couples challenge AI usage"
  ON public.couples_challenge_ai_usage
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Create policies for couples_challenge_questions
CREATE POLICY "Anyone can view couples challenge questions"
  ON public.couples_challenge_questions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage couples challenge questions"
  ON public.couples_challenge_questions
  FOR ALL
  TO authenticated
  USING (is_admin());

