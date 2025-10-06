-- Community Features Migration
-- Creates tables for chat rooms, messages, announcements, and related functionality

-- Chat Rooms Table
CREATE TABLE community_chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    room_type TEXT NOT NULL CHECK (room_type IN ('general', 'support', 'announcements', 'challenges', 'assessments', 'quizzes')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- Chat Messages Table
CREATE TABLE community_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES community_chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    metadata JSONB,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Announcements Table
CREATE TABLE community_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    announcement_type TEXT NOT NULL CHECK (announcement_type IN ('general', 'challenge', 'assessment', 'quiz', 'maintenance', 'feature')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'premium', 'admin')),
    is_active BOOLEAN DEFAULT true,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- Announcement Read Status Table
CREATE TABLE community_announcement_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID REFERENCES community_announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(announcement_id, user_id)
);

-- Session Muting Table (for admin functionality)
CREATE TABLE session_mutes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    muted_by UUID REFERENCES user_profiles(id),
    muted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX idx_community_chat_messages_room_id ON community_chat_messages(room_id);
CREATE INDEX idx_community_chat_messages_user_id ON community_chat_messages(user_id);
CREATE INDEX idx_community_chat_messages_created_at ON community_chat_messages(created_at);

CREATE INDEX idx_community_announcements_active ON community_announcements(is_active, created_at);
CREATE INDEX idx_community_announcements_type ON community_announcements(announcement_type);

CREATE INDEX idx_community_announcement_reads_announcement_id ON community_announcement_reads(announcement_id);
CREATE INDEX idx_community_announcement_reads_user_id ON community_announcement_reads(user_id);

CREATE INDEX idx_session_mutes_session_id ON session_mutes(session_id);
CREATE INDEX idx_session_mutes_active ON session_mutes(is_active);

-- Insert default chat rooms
INSERT INTO community_chat_rooms (name, description, room_type, created_by) VALUES
('General Discussion', 'Open discussion about personal growth and wellness', 'general', NULL),
('Support Circle', 'Get support and share experiences with the community', 'support', NULL),
('Announcements', 'Official announcements and updates from NewWomen', 'announcements', NULL),
('Challenge Check-ins', 'Share progress and celebrate wins in challenges', 'challenges', NULL),
('Assessment Discussions', 'Discuss assessments and share insights', 'assessments', NULL),
('Quiz Corner', 'Fun quizzes and knowledge sharing', 'quizzes', NULL);

-- Enable Row Level Security
ALTER TABLE community_chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_mutes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat rooms
CREATE POLICY "Chat rooms are viewable by authenticated users" ON community_chat_rooms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage chat rooms" ON community_chat_rooms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND email = 'admin@newomen.me'
        )
    );

-- RLS Policies for chat messages
CREATE POLICY "Chat messages are viewable by authenticated users" ON community_chat_messages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own messages" ON community_chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM user_profiles WHERE id = user_id
        )
    );

CREATE POLICY "Users can edit their own messages" ON community_chat_messages
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles WHERE id = user_id
        )
    );

-- RLS Policies for announcements
CREATE POLICY "Announcements are viewable by authenticated users" ON community_announcements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage announcements" ON community_announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND email = 'admin@newomen.me'
        )
    );

-- RLS Policies for announcement reads
CREATE POLICY "Users can manage their own read status" ON community_announcement_reads
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles WHERE id = user_id
        )
    );

-- RLS Policies for session mutes
CREATE POLICY "Only admins can manage session mutes" ON session_mutes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND email = 'admin@newomen.me'
        )
    );

-- Function to get unread announcements count
CREATE OR REPLACE FUNCTION get_unread_announcements_count()
RETURNS INTEGER AS $$
DECLARE
    user_id UUID;
    unread_count INTEGER;
BEGIN
    -- Get current user ID
    user_id := (SELECT id FROM user_profiles WHERE user_id = auth.uid());

    IF user_id IS NULL THEN
        RETURN 0;
    END IF;

    -- Count unread announcements
    SELECT COUNT(*) INTO unread_count
    FROM community_announcements a
    WHERE a.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM community_announcement_reads r
        WHERE r.announcement_id = a.id AND r.user_id = user_id
    );

    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark announcement as read
CREATE OR REPLACE FUNCTION mark_announcement_read(p_announcement_id UUID)
RETURNS VOID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Get current user ID
    user_id := (SELECT id FROM user_profiles WHERE user_id = auth.uid());

    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Insert or update read status
    INSERT INTO community_announcement_reads (announcement_id, user_id)
    VALUES (p_announcement_id, user_id)
    ON CONFLICT (announcement_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;