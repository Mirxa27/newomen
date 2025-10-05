-- Alter community_connections table to add new columns
DO $$ 
BEGIN
  -- Add message column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'community_connections' 
    AND column_name = 'message'
  ) THEN
    ALTER TABLE public.community_connections ADD COLUMN message TEXT;
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'community_connections' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.community_connections ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  
  -- Update status check constraint to include blocked
  -- Note: We can't easily alter CHECK constraints, so we'll just ensure the column accepts the new values
  -- The CHECK constraint will be enforced by the new migration's CREATE TABLE IF NOT EXISTS
END $$;

-- Alter couples_challenges table to add new columns
DO $$ 
BEGIN
  -- Add unique_link column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'couples_challenges' 
    AND column_name = 'unique_link'
  ) THEN
    ALTER TABLE public.couples_challenges ADD COLUMN unique_link TEXT UNIQUE;
  END IF;
  
  -- Add responses column if it doesn't exist (different from old initiator_responses/partner_responses)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'couples_challenges' 
    AND column_name = 'responses'
  ) THEN
    ALTER TABLE public.couples_challenges ADD COLUMN responses JSONB;
  END IF;
  
  -- Add compatibility_score column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'couples_challenges' 
    AND column_name = 'compatibility_score'
  ) THEN
    ALTER TABLE public.couples_challenges ADD COLUMN compatibility_score INTEGER;
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'couples_challenges' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.couples_challenges ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  
  -- Add expires_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'couples_challenges' 
    AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.couples_challenges ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
  
  -- Ensure question_set is NOT NULL
  UPDATE public.couples_challenges SET question_set = '{}'::jsonb WHERE question_set IS NULL;
  ALTER TABLE public.couples_challenges ALTER COLUMN question_set SET NOT NULL;
END $$;

-- Create couples_challenge_responses table
CREATE TABLE IF NOT EXISTS public.couples_challenge_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.couples_challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  response TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id, question_index)
);

-- Alter subscriptions table to add new columns
DO $$ 
BEGIN
  -- Rename provider_subscription_id to provider_id if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'provider_subscription_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE public.subscriptions RENAME COLUMN provider_subscription_id TO provider_id;
  END IF;
  
  -- Add tier column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'tier'
  ) THEN
    ALTER TABLE public.subscriptions 
    ADD COLUMN tier TEXT NOT NULL DEFAULT 'discovery' 
    CHECK (tier IN ('discovery', 'growth', 'transformation'));
  END IF;
  
  -- Add minutes_included column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'minutes_included'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN minutes_included INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  -- Add minutes_used column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'minutes_used'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN minutes_used INTEGER DEFAULT 0;
  END IF;
  
  -- Add price column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'price'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN price DECIMAL(10,2);
  END IF;
  
  -- Add currency column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN currency TEXT DEFAULT 'USD';
  END IF;
  
  -- Add cancelled_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN cancelled_at TIMESTAMPTZ;
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
  
  -- Change renewal_date from DATE to TIMESTAMPTZ
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions' 
    AND column_name = 'renewal_date'
    AND data_type = 'date'
  ) THEN
    ALTER TABLE public.subscriptions ALTER COLUMN renewal_date TYPE TIMESTAMPTZ;
  END IF;
END $$;

-- Create subscription_transactions table
CREATE TABLE IF NOT EXISTS public.subscription_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  provider_transaction_id TEXT,
  provider_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community connections table already exists
-- Couples challenges table already exists  
-- Subscriptions table already exists
-- Create wellness_resources and progress tables below

-- Alter wellness_resources table to add new columns
DO $$ 
BEGIN
  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wellness_resources' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.wellness_resources ADD COLUMN description TEXT;
  END IF;
  
  -- Add transcript column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wellness_resources' 
    AND column_name = 'transcript'
  ) THEN
    ALTER TABLE public.wellness_resources ADD COLUMN transcript TEXT;
  END IF;
  
  -- Add is_downloadable column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wellness_resources' 
    AND column_name = 'is_downloadable'
  ) THEN
    ALTER TABLE public.wellness_resources ADD COLUMN is_downloadable BOOLEAN DEFAULT false;
  END IF;
  
  -- Add download_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wellness_resources' 
    AND column_name = 'download_url'
  ) THEN
    ALTER TABLE public.wellness_resources ADD COLUMN download_url TEXT;
  END IF;
  
  -- Add is_premium column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wellness_resources' 
    AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE public.wellness_resources ADD COLUMN is_premium BOOLEAN DEFAULT false;
  END IF;
  
  -- Add required_tier column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wellness_resources' 
    AND column_name = 'required_tier'
  ) THEN
    ALTER TABLE public.wellness_resources ADD COLUMN required_tier TEXT DEFAULT 'discovery';
  END IF;
  
  -- Add tags column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wellness_resources' 
    AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.wellness_resources ADD COLUMN tags TEXT[];
  END IF;
  
  -- Add usage_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wellness_resources' 
    AND column_name = 'usage_count'
  ) THEN
    ALTER TABLE public.wellness_resources ADD COLUMN usage_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wellness_resources' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.wellness_resources 
    ADD COLUMN status TEXT DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'draft'));
  END IF;
  
  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wellness_resources' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.wellness_resources ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wellness_resources' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.wellness_resources ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Create user_resource_progress table
CREATE TABLE IF NOT EXISTS public.user_resource_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.wellness_resources(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- Enable RLS
ALTER TABLE public.community_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_challenge_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_resource_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_connections
DROP POLICY IF EXISTS "Users can view their own connections" ON public.community_connections;
CREATE POLICY "Users can view their own connections"
  ON public.community_connections
  FOR SELECT
  USING (requester_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own connections" ON public.community_connections;
CREATE POLICY "Users can manage their own connections"
  ON public.community_connections
  FOR ALL
  USING (requester_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all connections" ON public.community_connections;
CREATE POLICY "Admins can manage all connections"
  ON public.community_connections
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for couples_challenges
DROP POLICY IF EXISTS "Users can view their own challenges" ON public.couples_challenges;
CREATE POLICY "Users can view their own challenges"
  ON public.couples_challenges
  FOR SELECT
  USING (initiator_id = auth.uid() OR partner_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their own challenges" ON public.couples_challenges;
CREATE POLICY "Users can manage their own challenges"
  ON public.couples_challenges
  FOR ALL
  USING (initiator_id = auth.uid() OR partner_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all challenges" ON public.couples_challenges;
CREATE POLICY "Admins can manage all challenges"
  ON public.couples_challenges
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for couples_challenge_responses
DROP POLICY IF EXISTS "Users can view challenge responses they're part of" ON public.couples_challenge_responses;
CREATE POLICY "Users can view challenge responses they're part of"
  ON public.couples_challenge_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples_challenges
      WHERE couples_challenges.id = couples_challenge_responses.challenge_id
      AND (couples_challenges.initiator_id = auth.uid() OR couples_challenges.partner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert their own challenge responses" ON public.couples_challenge_responses;
CREATE POLICY "Users can insert their own challenge responses"
  ON public.couples_challenge_responses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all challenge responses" ON public.couples_challenge_responses;
CREATE POLICY "Admins can manage all challenge responses"
  ON public.couples_challenge_responses
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for subscription_transactions
DROP POLICY IF EXISTS "Users can view their own subscription transactions" ON public.subscription_transactions;
CREATE POLICY "Users can view their own subscription transactions"
  ON public.subscription_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE subscriptions.id = subscription_transactions.subscription_id
      AND subscriptions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all subscription transactions" ON public.subscription_transactions;
CREATE POLICY "Admins can manage all subscription transactions"
  ON public.subscription_transactions
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for wellness_resources
DROP POLICY IF EXISTS "Anyone can view free resources" ON public.wellness_resources;
CREATE POLICY "Anyone can view free resources"
  ON public.wellness_resources
  FOR SELECT
  USING (is_premium = false AND status = 'active');

DROP POLICY IF EXISTS "Authenticated users can view resources they have access to" ON public.wellness_resources;
CREATE POLICY "Authenticated users can view resources they have access to"
  ON public.wellness_resources
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      is_premium = false OR 
      required_tier = 'discovery' OR
      (required_tier = 'growth' AND (
        SELECT subscription_tier FROM public.user_profiles WHERE user_id = auth.uid()
      ) IN ('growth', 'transformation')) OR
      (required_tier = 'transformation' AND (
        SELECT subscription_tier FROM public.user_profiles WHERE user_id = auth.uid()
      ) = 'transformation')
    )
  );

DROP POLICY IF EXISTS "Admins can manage all resources" ON public.wellness_resources;
CREATE POLICY "Admins can manage all resources"
  ON public.wellness_resources
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for user_resource_progress
DROP POLICY IF EXISTS "Users can manage their own resource progress" ON public.user_resource_progress;
CREATE POLICY "Users can manage their own resource progress"
  ON public.user_resource_progress
  FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all resource progress" ON public.user_resource_progress;
CREATE POLICY "Admins can view all resource progress"
  ON public.user_resource_progress
  FOR SELECT
  USING (auth.email() = 'admin@newomen.me');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_connections_requester ON public.community_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_community_connections_receiver ON public.community_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_community_connections_status ON public.community_connections(status);
CREATE INDEX IF NOT EXISTS idx_couples_challenges_initiator ON public.couples_challenges(initiator_id);
CREATE INDEX IF NOT EXISTS idx_couples_challenges_partner ON public.couples_challenges(partner_id);
CREATE INDEX IF NOT EXISTS idx_couples_challenges_unique_link ON public.couples_challenges(unique_link);
CREATE INDEX IF NOT EXISTS idx_couples_challenge_responses_challenge ON public.couples_challenge_responses(challenge_id);
CREATE INDEX IF NOT EXISTS idx_couples_challenge_responses_user ON public.couples_challenge_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_wellness_resources_category ON public.wellness_resources(category);
CREATE INDEX IF NOT EXISTS idx_wellness_resources_is_premium ON public.wellness_resources(is_premium);
CREATE INDEX IF NOT EXISTS idx_user_resource_progress_user_id ON public.user_resource_progress(user_id);

-- Add update timestamp triggers
DROP TRIGGER IF EXISTS update_community_connections_updated_at ON public.community_connections;
CREATE TRIGGER update_community_connections_updated_at
  BEFORE UPDATE ON public.community_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_couples_challenges_updated_at ON public.couples_challenges;
CREATE TRIGGER update_couples_challenges_updated_at
  BEFORE UPDATE ON public.couples_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_wellness_resources_updated_at ON public.wellness_resources;
CREATE TRIGGER update_wellness_resources_updated_at
  BEFORE UPDATE ON public.wellness_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_resource_progress_updated_at ON public.user_resource_progress;
CREATE TRIGGER update_user_resource_progress_updated_at
  BEFORE UPDATE ON public.user_resource_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default wellness resources
INSERT INTO public.wellness_resources (title, description, category, duration, is_premium, required_tier, tags) VALUES
(
  'Morning Mindfulness',
  'Start your day with clarity and intention through this guided mindfulness practice',
  'meditation',
  300, -- 5 minutes
  false,
  'discovery',
  ARRAY['mindfulness', 'morning', 'beginner']
),
(
  'Stress Relief Breathing',
  'Quick breathing exercises to calm your nervous system and reduce stress',
  'breathing',
  180, -- 3 minutes
  false,
  'discovery',
  ARRAY['breathing', 'stress', 'quick']
),
(
  'Body Scan Relaxation',
  'Progressive muscle relaxation to release tension throughout your body',
  'relaxation',
  600, -- 10 minutes
  false,
  'discovery',
  ARRAY['relaxation', 'body_scan', 'sleep']
),
(
  'Confidence Boost Visualization',
  'Guided visualization to enhance self-confidence and positive self-image',
  'visualization',
  420, -- 7 minutes
  true,
  'growth',
  ARRAY['confidence', 'visualization', 'self-esteem']
),
(
  'Deep Sleep Meditation',
  'Prepare your mind and body for restful, rejuvenating sleep',
  'sleep',
  900, -- 15 minutes
  true,
  'growth',
  ARRAY['sleep', 'meditation', 'relaxation']
),
(
  'Emotional Healing Journey',
  'A transformative practice for processing and healing emotional wounds',
  'healing',
  1200, -- 20 minutes
  true,
  'transformation',
  ARRAY['healing', 'emotions', 'transformation']
),
(
  'Focus Enhancement',
  'Improve concentration and mental clarity for better productivity',
  'focus',
  360, -- 6 minutes
  false,
  'discovery',
  ARRAY['focus', 'productivity', 'clarity']
),
(
  'Anxiety Release',
  'Gentle techniques to soothe anxiety and promote inner peace',
  'anxiety',
  480, -- 8 minutes
  true,
  'growth',
  ARRAY['anxiety', 'calm', 'peace']
);

-- Create function to generate unique challenge link
CREATE OR REPLACE FUNCTION public.generate_challenge_link()
RETURNS TEXT AS $$
DECLARE
  link_text TEXT;
  link_exists BOOLEAN;
BEGIN
  LOOP
    link_text := 'challenge_' || encode(gen_random_bytes(8), 'hex');
    SELECT EXISTS(SELECT 1 FROM public.couples_challenges WHERE unique_link = link_text) INTO link_exists;
    IF NOT link_exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN link_text;
END;
$$ LANGUAGE plpgsql;

-- Create function to update subscription minutes
CREATE OR REPLACE FUNCTION public.update_subscription_minutes(
  p_user_id UUID,
  p_minutes_used INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.subscriptions
  SET minutes_used = minutes_used + p_minutes_used
  WHERE user_id = p_user_id AND status = 'active';
  
  -- Update user profile remaining minutes
  UPDATE public.user_profiles
  SET remaining_minutes = GREATEST(0, remaining_minutes - p_minutes_used)
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
