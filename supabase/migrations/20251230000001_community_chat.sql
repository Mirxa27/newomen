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
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.community_chat_rooms
      WHERE community_chat_rooms.id = community_chat_messages.room_id
      AND community_chat_rooms.is_active = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.community_chat_messages;
CREATE POLICY "Authenticated users can insert messages"
  ON public.community_chat_messages
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.community_chat_rooms
      WHERE community_chat_rooms.id = community_chat_messages.room_id
      AND community_chat_rooms.is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.community_chat_messages;
CREATE POLICY "Users can update their own messages"
  ON public.community_chat_messages
  FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all messages" ON public.community_chat_messages;
CREATE POLICY "Admins can manage all messages"
  ON public.community_chat_messages
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for community_announcements
DROP POLICY IF EXISTS "Authenticated users can view active announcements" ON public.community_announcements;
CREATE POLICY "Authenticated users can view active announcements"
  ON public.community_announcements
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    is_active = true AND
    (target_audience = 'all' OR
     target_audience = (
       SELECT subscription_tier FROM public.user_profiles WHERE user_id = auth.uid()
     ))
  );

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.community_announcements;
CREATE POLICY "Admins can manage announcements"
  ON public.community_announcements
  FOR ALL
  USING (auth.email() = 'admin@newomen.me');

-- RLS Policies for community_announcement_reads
DROP POLICY IF EXISTS "Users can manage their own announcement reads" ON public.community_announcement_reads;
CREATE POLICY "Users can manage their own announcement reads"
  ON public.community_announcement_reads
  FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all announcement reads" ON public.community_announcement_reads;
CREATE POLICY "Admins can view all announcement reads"
  ON public.community_announcement_reads
  FOR SELECT
  USING (auth.email() = 'admin@newomen.me');

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_chat_rooms_type ON public.community_chat_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_community_chat_rooms_active ON public.community_chat_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_community_chat_messages_room_id ON public.community_chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_community_chat_messages_user_id ON public.community_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_community_chat_messages_created_at ON public.community_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_community_announcements_type ON public.community_announcements(announcement_type);
CREATE INDEX IF NOT EXISTS idx_community_announcements_priority ON public.community_announcements(priority);
CREATE INDEX IF NOT EXISTS idx_community_announcements_active ON public.community_announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_community_announcement_reads_announcement ON public.community_announcement_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_community_announcement_reads_user ON public.community_announcement_reads(user_id);

-- Add update timestamp triggers
DROP TRIGGER IF EXISTS update_community_chat_rooms_updated_at ON public.community_chat_rooms;
CREATE TRIGGER update_community_chat_rooms_updated_at
  BEFORE UPDATE ON public.community_chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_announcements_updated_at ON public.community_announcements;
CREATE TRIGGER update_community_announcements_updated_at
  BEFORE UPDATE ON public.community_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_challenge_announcements_updated_at ON public.community_challenge_announcements;
CREATE TRIGGER update_community_challenge_announcements_updated_at
  BEFORE UPDATE ON public.community_challenge_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_assessment_announcements_updated_at ON public.community_assessment_announcements;
CREATE TRIGGER update_community_assessment_announcements_updated_at
  BEFORE UPDATE ON public.community_assessment_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_quiz_announcements_updated_at ON public.community_quiz_announcements;
CREATE TRIGGER update_community_quiz_announcements_updated_at
  BEFORE UPDATE ON public.community_quiz_announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default chat rooms
INSERT INTO public.community_chat_rooms (name, description, room_type, created_by) VALUES
('General Chat', 'General discussion and community chat', 'general', (SELECT id FROM auth.users WHERE email = 'admin@newomen.me' LIMIT 1)),
('Support & Help', 'Get help and support from the community', 'support', (SELECT id FROM auth.users WHERE email = 'admin@newomen.me' LIMIT 1)),
('Announcements', 'Official announcements and updates', 'announcements', (SELECT id FROM auth.users WHERE email = 'admin@newomen.me' LIMIT 1)),
('Challenges', 'Discuss and share challenge experiences', 'challenges', (SELECT id FROM auth.users WHERE email = 'admin@newomen.me' LIMIT 1)),
('Assessments', 'Share assessment results and insights', 'assessments', (SELECT id FROM auth.users WHERE email = 'admin@newomen.me' LIMIT 1)),
('Quizzes', 'Quiz discussions and learning together', 'quizzes', (SELECT id FROM auth.users WHERE email = 'admin@newomen.me' LIMIT 1));

-- Create function to mark announcement as read
CREATE OR REPLACE FUNCTION public.mark_announcement_read(
  p_announcement_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.community_announcement_reads (announcement_id, user_id)
  VALUES (p_announcement_id, auth.uid())
  ON CONFLICT (announcement_id, user_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread announcements count
CREATE OR REPLACE FUNCTION public.get_unread_announcements_count()
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM public.community_announcements a
  WHERE a.is_active = true
    AND (a.target_audience = 'all' OR a.target_audience = (
      SELECT subscription_tier FROM public.user_profiles WHERE user_id = auth.uid()
    ))
    AND NOT EXISTS (
      SELECT 1 FROM public.community_announcement_reads r
      WHERE r.announcement_id = a.id AND r.user_id = auth.uid()
    );
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
