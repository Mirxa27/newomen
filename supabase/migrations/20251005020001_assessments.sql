-- Alter assessments table to add new columns
DO $$ 
BEGIN
  -- Add description column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN description TEXT;
  END IF;
  
  -- Rename assessment_type to type if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments' 
    AND column_name = 'assessment_type'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.assessments RENAME COLUMN assessment_type TO type;
  END IF;
  
  -- Add type column if it doesn't exist (in case rename didn't happen)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.assessments 
    ADD COLUMN type TEXT NOT NULL DEFAULT 'personality' 
    CHECK (type IN ('personality', 'diagnostic', 'narrative', 'exploration', 'course', 'quiz'));
  END IF;
  
  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN category TEXT;
  END IF;
  
  -- Add duration column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments' 
    AND column_name = 'duration'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN duration TEXT;
  END IF;
  
  -- Add scoring_logic column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments' 
    AND column_name = 'scoring_logic'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN scoring_logic JSONB;
  END IF;
  
  -- Add outcome_descriptions column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments' 
    AND column_name = 'outcome_descriptions'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN outcome_descriptions JSONB;
  END IF;
  
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.assessments 
    ADD COLUMN status TEXT DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'draft'));
  END IF;
  
  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessments' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.assessments ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Alter assessment_results table to add new columns
DO $$ 
BEGIN
  -- Add outcome column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessment_results' 
    AND column_name = 'outcome'
  ) THEN
    ALTER TABLE public.assessment_results ADD COLUMN outcome TEXT;
  END IF;
  
  -- Add completed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'assessment_results' 
    AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.assessment_results ADD COLUMN completed_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'paused')),
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Note: messages table already exists from earlier migration with session_id column
-- We need to add conversation_id column to support assessment conversations
DO $$ 
BEGIN
  -- Add conversation_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;
  END IF;
  
  -- Add text_content column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'text_content'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN text_content TEXT;
  END IF;
  
  -- Add audio_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN audio_url TEXT;
  END IF;
  
  -- Add emotion_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'emotion_data'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN emotion_data JSONB;
  END IF;
  
  -- Add sender column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'sender'
  ) THEN
    ALTER TABLE public.messages 
    ADD COLUMN sender TEXT CHECK (sender IN ('user', 'ai'));
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assessments
DROP POLICY IF EXISTS "Anyone can view public assessments" ON public.assessments;
CREATE POLICY "Anyone can view public assessments"
  ON public.assessments
  FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Authenticated users can view all assessments" ON public.assessments;
CREATE POLICY "Authenticated users can view all assessments"
  ON public.assessments
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage assessments" ON public.assessments;
CREATE POLICY "Admins can manage assessments"
  ON public.assessments
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for assessment_results
DROP POLICY IF EXISTS "Users can view their own assessment results" ON public.assessment_results;
CREATE POLICY "Users can view their own assessment results"
  ON public.assessment_results
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all assessment results" ON public.assessment_results;
CREATE POLICY "Admins can view all assessment results"
  ON public.assessment_results
  FOR SELECT
  USING (auth.email() = 'admin@newomen.me');

DROP POLICY IF EXISTS "Users can insert their own assessment results" ON public.assessment_results;
CREATE POLICY "Users can insert their own assessment results"
  ON public.assessment_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
CREATE POLICY "Admins can view all conversations"
  ON public.conversations
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
CREATE POLICY "Users can insert their own conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view their own conversation messages" ON public.messages;
CREATE POLICY "Users can view their own conversation messages"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages"
  ON public.messages
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

DROP POLICY IF EXISTS "Users can insert their own conversation messages" ON public.messages;
CREATE POLICY "Users can insert their own conversation messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assessments_type ON public.assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_category ON public.assessments(category);
CREATE INDEX IF NOT EXISTS idx_assessments_is_public ON public.assessments(is_public);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON public.assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON public.assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_ts ON public.messages(ts);

-- Add update timestamp triggers
DROP TRIGGER IF EXISTS update_assessments_updated_at ON public.assessments;
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default assessments from publicAssessments.ts
INSERT INTO public.assessments (title, description, type, category, duration, is_public, questions, outcome_descriptions) VALUES
(
  'Emotional Intelligence Assessment',
  'Discover your emotional awareness and management skills',
  'personality',
  'personality',
  '10-12 min',
  true,
  '[
    {
      "text": "How often do you notice your emotions as they happen?",
      "options": ["Rarely", "Sometimes", "Often", "Almost always"]
    },
    {
      "text": "When faced with conflict, I typically:",
      "options": ["Avoid it", "Get defensive", "Try to understand both sides", "Seek resolution calmly"]
    },
    {
      "text": "I can usually identify what triggers my stress:",
      "options": ["Strongly disagree", "Disagree", "Agree", "Strongly agree"]
    },
    {
      "text": "When someone shares their feelings with me, I:",
      "options": ["Feel uncomfortable", "Listen politely", "Empathize deeply", "Offer immediate solutions"]
    },
    {
      "text": "How well do you manage your emotions in pressure situations?",
      "options": ["Poorly", "Somewhat", "Well", "Very well"]
    },
    {
      "text": "I can sense the emotional atmosphere in a room:",
      "options": ["Never", "Rarely", "Often", "Always"]
    },
    {
      "text": "When criticized, I:",
      "options": ["Take it personally", "Get defensive", "Listen and reflect", "See it as growth opportunity"]
    },
    {
      "text": "I express my feelings to others:",
      "options": ["Rarely", "When forced", "Regularly", "Openly and appropriately"]
    },
    {
      "text": "How often do you consider others'' perspectives before reacting?",
      "options": ["Never", "Sometimes", "Usually", "Always"]
    },
    {
      "text": "I bounce back from setbacks:",
      "options": ["With difficulty", "Eventually", "Relatively quickly", "Rapidly and stronger"]
    },
    {
      "text": "When I''m upset, I:",
      "options": ["Shut down", "Lash out", "Take time to process", "Address it constructively"]
    },
    {
      "text": "I recognize emotions in others through body language:",
      "options": ["Poorly", "Somewhat", "Well", "Exceptionally well"]
    },
    {
      "text": "My self-awareness helps me:",
      "options": ["Not much", "Occasionally", "Regularly", "Make better decisions daily"]
    },
    {
      "text": "I handle interpersonal conflicts by:",
      "options": ["Avoiding them", "Winning arguments", "Finding compromise", "Seeking win-win solutions"]
    },
    {
      "text": "When stressed, I use healthy coping mechanisms:",
      "options": ["Rarely", "Sometimes", "Often", "Consistently"]
    }
  ]'::jsonb,
  '{
    "low": "You''re just beginning your emotional intelligence journey. Focus on self-awareness and recognizing emotions in yourself and others.",
    "medium": "You have a good foundation in emotional intelligence. Continue practicing empathy and emotional regulation.",
    "high": "You demonstrate strong emotional intelligence. You excel at understanding and managing emotions effectively.",
    "very_high": "Your emotional intelligence is exceptional. You have mastered emotional awareness, regulation, and interpersonal skills."
  }'::jsonb
),
(
  'Stress Management & Resilience',
  'Assess your ability to handle stress and build resilience',
  'diagnostic',
  'wellness',
  '8-10 min',
  true,
  '[
    {
      "text": "How often do you feel overwhelmed by daily tasks?",
      "options": ["Always", "Often", "Sometimes", "Rarely"]
    },
    {
      "text": "When facing challenges, I:",
      "options": ["Feel helpless", "Struggle to cope", "Find ways to manage", "Thrive under pressure"]
    },
    {
      "text": "I practice stress-relief activities:",
      "options": ["Never", "Rarely", "Regularly", "Daily"]
    },
    {
      "text": "My sleep quality is:",
      "options": ["Poor", "Fair", "Good", "Excellent"]
    },
    {
      "text": "I take breaks during stressful periods:",
      "options": ["Never", "Rarely", "When possible", "Consistently"]
    },
    {
      "text": "How do you rate your work-life balance?",
      "options": ["Poor", "Needs improvement", "Good", "Excellent"]
    },
    {
      "text": "When stressed, I turn to:",
      "options": ["Unhealthy habits", "Distraction", "Support systems", "Healthy coping strategies"]
    },
    {
      "text": "I can identify my stress triggers:",
      "options": ["Not at all", "Vaguely", "Mostly", "Completely"]
    },
    {
      "text": "Physical symptoms of stress (headaches, tension) occur:",
      "options": ["Daily", "Weekly", "Occasionally", "Rarely"]
    },
    {
      "text": "I ask for help when overwhelmed:",
      "options": ["Never", "Reluctantly", "When needed", "Comfortably"]
    },
    {
      "text": "My ability to stay calm in crisis is:",
      "options": ["Poor", "Fair", "Good", "Excellent"]
    },
    {
      "text": "I maintain healthy boundaries:",
      "options": ["Struggle to", "Sometimes", "Usually", "Consistently"]
    }
  ]'::jsonb,
  '{
    "high_stress": "Your stress levels are concerning. Consider prioritizing self-care and seeking support to build resilience.",
    "moderate_stress": "You experience moderate stress. Developing better coping strategies and boundaries could help.",
    "good_management": "You manage stress reasonably well. Continue building your resilience toolkit.",
    "excellent_resilience": "You have excellent stress management skills and strong resilience. Keep up the great work!"
  }'::jsonb
);
