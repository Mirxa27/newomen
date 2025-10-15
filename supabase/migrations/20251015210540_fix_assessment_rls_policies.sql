-- Enable RLS on assessment related tables
ALTER TABLE public.assessment_ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_service_mappings_new ENABLE ROW LEVEL SECURITY;

-- Create policies for assessment_ai_configs
CREATE POLICY "Anyone can view assessment AI configs"
  ON public.assessment_ai_configs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage assessment AI configs"
  ON public.assessment_ai_configs
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Create policies for assessment_ai_usage
CREATE POLICY "Users can view their own assessment AI usage"
  ON public.assessment_ai_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert assessment AI usage"
  ON public.assessment_ai_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all assessment AI usage"
  ON public.assessment_ai_usage
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Create policies for assessment_questions
CREATE POLICY "Anyone can view assessment questions"
  ON public.assessment_questions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage assessment questions"
  ON public.assessment_questions
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Create policies for ai_service_mappings_new
CREATE POLICY "Anyone can view AI service mappings"
  ON public.ai_service_mappings_new
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage AI service mappings"
  ON public.ai_service_mappings_new
  FOR ALL
  TO authenticated
  USING (is_admin());

