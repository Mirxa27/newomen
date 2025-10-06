-- Apply Community Chat Migration
-- This script creates the necessary tables for the community announcement system

-- Create community_chat_rooms table
CREATE TABLE IF NOT EXISTS public.community_chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  room_type TEXT NOT NULL DEFAULT 'general' CHECK (room_type IN ('general', 'support', 'announcements', 'challenges', 'assessments', 'quizzes')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_chat_messages table
CREATE TABLE IF NOT EXISTS public.community_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.community_chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'announcement', 'challenge', 'assessment', 'quiz')),
  metadata JSONB,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_announcements table
CREATE TABLE IF NOT EXISTS public.community_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  announcement_type TEXT NOT NULL CHECK (announcement_type IN ('general', 'challenge', 'assessment', 'quiz', 'maintenance', 'feature')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'discovery', 'growth', 'transformation', 'premium')),
  is_active BOOLEAN DEFAULT true,
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_announcement_reads table
CREATE TABLE IF NOT EXISTS public.community_announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES public.community_announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

-- Create community_challenge_announcements table
CREATE TABLE IF NOT EXISTS public.community_challenge_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'special')),
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  reward_crystals INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_assessment_announcements table
CREATE TABLE IF NOT EXISTS public.community_assessment_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments(id),
  title TEXT NOT NULL,
  description TEXT,
  special_instructions TEXT,
  reward_crystals INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_quiz_announcements table
CREATE TABLE IF NOT EXISTS public.community_quiz_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB,
  correct_answers JSONB,
  reward_crystals INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_challenge_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_assessment_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_quiz_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_chat_rooms
DROP POLICY IF EXISTS "Authenticated users can view active chat rooms" ON public.community_chat_rooms;
CREATE POLICY "Authenticated users can view active chat rooms"
  ON public.community_chat_rooms
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage chat rooms" ON public.community_chat_rooms;
CREATE POLICY "Admins can manage chat rooms"
  ON public.community_chat_rooms
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for community_chat_messages
DROP POLICY IF EXISTS "Authenticated users can view messages in active rooms" ON public.community_chat_messages;
CREATE POLICY "Authenticated users can view messages in active rooms"
  ON public.community_chat_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.community_chat_messages;
CREATE POLICY "Authenticated users can send messages"
  ON public.community_chat_messages
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- RLS Policies for community_announcements
DROP POLICY IF EXISTS "Authenticated users can view active announcements" ON public.community_announcements;
CREATE POLICY "Authenticated users can view active announcements"
  ON public.community_announcements
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.community_announcements;
CREATE POLICY "Admins can manage announcements"
  ON public.community_announcements
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for community_announcement_reads
DROP POLICY IF EXISTS "Users can manage their own read status" ON public.community_announcement_reads;
CREATE POLICY "Users can manage their own read status"
  ON public.community_announcement_reads
  FOR ALL
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- RLS Policies for community_challenge_announcements
DROP POLICY IF EXISTS "Authenticated users can view active challenge announcements" ON public.community_challenge_announcements;
CREATE POLICY "Authenticated users can view active challenge announcements"
  ON public.community_challenge_announcements
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage challenge announcements" ON public.community_challenge_announcements;
CREATE POLICY "Admins can manage challenge announcements"
  ON public.community_challenge_announcements
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for community_assessment_announcements
DROP POLICY IF EXISTS "Authenticated users can view active assessment announcements" ON public.community_assessment_announcements;
CREATE POLICY "Authenticated users can view active assessment announcements"
  ON public.community_assessment_announcements
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage assessment announcements" ON public.community_assessment_announcements;
CREATE POLICY "Admins can manage assessment announcements"
  ON public.community_assessment_announcements
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for community_quiz_announcements
DROP POLICY IF EXISTS "Authenticated users can view active quiz announcements" ON public.community_quiz_announcements;
CREATE POLICY "Authenticated users can view active quiz announcements"
  ON public.community_quiz_announcements
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

DROP POLICY IF EXISTS "Admins can manage quiz announcements" ON public.community_quiz_announcements;
CREATE POLICY "Admins can manage quiz announcements"
  ON public.community_quiz_announcements
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_chat_rooms_type ON public.community_chat_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_community_chat_rooms_active ON public.community_chat_rooms(is_active);

CREATE INDEX IF NOT EXISTS idx_community_chat_messages_room_id ON public.community_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_community_chat_messages_user_id ON public.community_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_community_chat_messages_created_at ON public.community_chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_community_announcements_active ON public.community_announcements(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_community_announcements_type ON public.community_announcements(announcement_type);
CREATE INDEX IF NOT EXISTS idx_community_announcements_priority ON public.community_announcements(priority);

CREATE INDEX IF NOT EXISTS idx_community_announcement_reads_announcement_id ON public.community_announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_community_announcement_reads_user_id ON public.community_announcement_reads(user_id);

-- Insert default chat rooms
INSERT INTO public.community_chat_rooms (name, description, room_type, created_by) VALUES
('General Discussion', 'Open discussion about personal growth and wellness', 'general', NULL),
('Support Circle', 'Get support and share experiences with the community', 'support', NULL),
('Announcements', 'Official announcements and updates from NewWomen', 'announcements', NULL),
('Challenge Check-ins', 'Share progress and celebrate wins in challenges', 'challenges', NULL),
('Assessment Results', 'Share and discuss assessment results and insights', 'assessments', NULL),
('Quiz Corner', 'Test your knowledge with community quizzes', 'quizzes', NULL)
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_community_chat_rooms_updated_at ON public.community_chat_rooms;
CREATE TRIGGER update_community_chat_rooms_updated_at
    BEFORE UPDATE ON public.community_chat_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_announcements_updated_at ON public.community_announcements;
CREATE TRIGGER update_community_announcements_updated_at
    BEFORE UPDATE ON public.community_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_challenge_announcements_updated_at ON public.community_challenge_announcements;
CREATE TRIGGER update_community_challenge_announcements_updated_at
    BEFORE UPDATE ON public.community_challenge_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_assessment_announcements_updated_at ON public.community_assessment_announcements;
CREATE TRIGGER update_community_assessment_announcements_updated_at
    BEFORE UPDATE ON public.community_assessment_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_quiz_announcements_updated_at ON public.community_quiz_announcements;
CREATE TRIGGER update_community_quiz_announcements_updated_at
    BEFORE UPDATE ON public.community_quiz_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a sample announcement to test the system
INSERT INTO public.community_announcements (title, content, announcement_type, priority, target_audience, created_by) VALUES
('Welcome to NewWomen Community!', 'Welcome to our amazing community of women supporting each other on their personal growth journey. We''re excited to have you here!', 'general', 'normal', 'all', NULL)
ON CONFLICT DO NOTHING;
