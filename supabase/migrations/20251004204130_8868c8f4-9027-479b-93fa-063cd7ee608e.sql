-- Fix RLS policies for admin and public tables

-- Enable RLS on tables that need it
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;

-- Admin-only tables: only authenticated admins can access
-- For now, we'll allow authenticated users to read these (will add proper role-based access later)
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;
DROP POLICY IF EXISTS "Authenticated users can view models" ON public.models;
DROP POLICY IF EXISTS "Authenticated users can view voices" ON public.voices;
DROP POLICY IF EXISTS "Authenticated users can view prompts" ON public.prompts;
DROP POLICY IF EXISTS "Authenticated users can view agents" ON public.agents;
CREATE POLICY "Authenticated users can view providers" ON public.providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view models" ON public.models FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view voices" ON public.voices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view prompts" ON public.prompts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view agents" ON public.agents FOR SELECT TO authenticated USING (true);

-- Session events: users can only view events from their own sessions
DROP POLICY IF EXISTS "Users can view events from own sessions" ON public.session_events;
CREATE POLICY "Users can view events from own sessions" ON public.session_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sessions 
    WHERE sessions.id = session_events.session_id 
    AND sessions.user_id IN (SELECT id FROM public.user_profiles WHERE user_id = auth.uid())
  )
);

-- Assessment results: already has RLS enabled, add missing policies
DROP POLICY IF EXISTS "Users can insert own assessment results" ON public.assessment_results;
CREATE POLICY "Users can insert own assessment results" ON public.assessment_results FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = assessment_results.user_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can view own assessment results" ON public.assessment_results;
CREATE POLICY "Users can view own assessment results" ON public.assessment_results FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = assessment_results.user_id AND user_id = auth.uid())
);

-- User achievements: add insert policy
DROP POLICY IF EXISTS "System can insert user achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "System can insert user achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = user_achievements.user_id AND user_id = auth.uid())
);

-- Community connections: add full CRUD policies
DROP POLICY IF EXISTS "Users can view connections involving them" ON public.community_connections;
CREATE POLICY "Users can view connections involving them" ON public.community_connections FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE (id = community_connections.requester_id OR id = community_connections.receiver_id) 
    AND user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can create connection requests" ON public.community_connections;
CREATE POLICY "Users can create connection requests" ON public.community_connections FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = community_connections.requester_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update connections involving them" ON public.community_connections;
CREATE POLICY "Users can update connections involving them" ON public.community_connections FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE (id = community_connections.requester_id OR id = community_connections.receiver_id) 
    AND user_id = auth.uid()
  )
);

-- Couples challenges: add policies
DROP POLICY IF EXISTS "Users can view challenges involving them" ON public.couples_challenges;
CREATE POLICY "Users can view challenges involving them" ON public.couples_challenges FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE (id = couples_challenges.initiator_id OR id = couples_challenges.partner_id) 
    AND user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Users can create challenges" ON public.couples_challenges;
CREATE POLICY "Users can create challenges" ON public.couples_challenges FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = couples_challenges.initiator_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update challenges involving them" ON public.couples_challenges;
CREATE POLICY "Users can update challenges involving them" ON public.couples_challenges FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE (id = couples_challenges.initiator_id OR id = couples_challenges.partner_id) 
    AND user_id = auth.uid()
  )
);

-- Subscriptions: add policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = subscriptions.user_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = subscriptions.user_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = subscriptions.user_id AND user_id = auth.uid())
);