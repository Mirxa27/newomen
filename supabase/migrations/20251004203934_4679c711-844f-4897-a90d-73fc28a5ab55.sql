-- Core user and authentication tables
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT UNIQUE,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'discovery' CHECK (subscription_tier IN ('discovery', 'growth', 'transformation')),
  remaining_minutes INTEGER DEFAULT 10,
  current_level INTEGER DEFAULT 1,
  crystal_balance INTEGER DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  last_streak_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User memory and personality profile
CREATE TABLE IF NOT EXISTS public.user_memory_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  personality_type TEXT,
  balance_wheel_scores JSONB,
  narrative_patterns JSONB,
  emotional_state_history JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- AI Providers (OpenAI, ElevenLabs, etc.)
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  api_base TEXT,
  region TEXT,
  status TEXT DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Models
CREATE TABLE IF NOT EXISTS public.models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  modality TEXT,
  context_limit INTEGER,
  latency_hint_ms INTEGER,
  is_realtime BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Voices
CREATE TABLE IF NOT EXISTS public.voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL,
  name TEXT NOT NULL,
  locale TEXT,
  gender TEXT,
  latency_hint_ms INTEGER,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hosted Prompts
CREATE TABLE IF NOT EXISTS public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hosted_prompt_id TEXT,
  version INTEGER DEFAULT 1,
  name TEXT NOT NULL,
  content JSONB NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agents configuration
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  prompt_id UUID REFERENCES public.prompts(id),
  model_id UUID REFERENCES public.models(id),
  voice_id UUID REFERENCES public.voices(id),
  vad_config JSONB,
  tool_policy JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  realtime_session_id TEXT,
  start_ts TIMESTAMPTZ DEFAULT NOW(),
  end_ts TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  duration_seconds INTEGER,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 4)
);

-- Session events and traces
CREATE TABLE IF NOT EXISTS public.session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  ts TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  text_content TEXT,
  audio_url TEXT,
  emotion_data JSONB,
  ts TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments (personality, diagnostic, narrative)
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('personality', 'diagnostic', 'narrative', 'custom')),
  questions JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment results
CREATE TABLE IF NOT EXISTS public.assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  badge_url TEXT,
  unlock_criteria JSONB,
  crystal_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Community connections
CREATE TABLE IF NOT EXISTS public.community_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Couples challenge
CREATE TABLE IF NOT EXISTS public.couples_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  question_set JSONB,
  initiator_responses JSONB,
  partner_responses JSONB,
  ai_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wellness resources
CREATE TABLE IF NOT EXISTS public.wellness_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  duration INTEGER,
  audio_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (PayPal)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'paypal',
  provider_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  renewal_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own memory profile" ON public.user_memory_profiles;
DROP POLICY IF EXISTS "Users can update own memory profile" ON public.user_memory_profiles;
CREATE POLICY "Users can view own memory profile" ON public.user_memory_profiles FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.user_profiles WHERE id = user_memory_profiles.user_id));
CREATE POLICY "Users can update own memory profile" ON public.user_memory_profiles FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.user_profiles WHERE id = user_memory_profiles.user_id));

DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.user_profiles WHERE id = sessions.user_id));

DROP POLICY IF EXISTS "Users can view messages from own sessions" ON public.messages;
CREATE POLICY "Users can view messages from own sessions" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.sessions 
    WHERE sessions.id = messages.session_id 
    AND sessions.user_id IN (SELECT id FROM public.user_profiles WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Anyone can view public assessments" ON public.assessments;
CREATE POLICY "Anyone can view public assessments" ON public.assessments FOR SELECT USING (is_public = true);

-- Public read for wellness resources
ALTER TABLE public.wellness_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view wellness resources" ON public.wellness_resources;
CREATE POLICY "Anyone can view wellness resources" ON public.wellness_resources FOR SELECT USING (true);