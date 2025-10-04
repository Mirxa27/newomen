-- Enable RLS on remaining public tables
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Achievements: public read for all users
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);

-- Assessments: public read already has a policy, just ensure RLS is enabled
-- The policy "Anyone can view public assessments" already exists