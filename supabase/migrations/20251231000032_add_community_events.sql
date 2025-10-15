-- Phase 5: Enhanced Community Features (Events, Meetings, RSVP)

-- 1. Community Events Table
CREATE TABLE IF NOT EXISTS community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES community_locations(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(100), -- 'meditation', 'meetup', 'workout', 'workshop', 'social'
  image_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location_address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  max_attendees INT,
  is_online BOOLEAN DEFAULT FALSE,
  online_meeting_url TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'ongoing', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Event Attendees/RSVP
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsvp_status VARCHAR(50), -- 'going', 'interested', 'declined', 'maybe'
  notes TEXT,
  check_in_time TIMESTAMPTZ,
  is_checked_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 3. Event Schedule Items (for recurring events)
CREATE TABLE IF NOT EXISTS event_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  day_of_week VARCHAR(10), -- 'monday', 'tuesday', etc.
  time_of_day TIME,
  repeat_count INT,
  repeat_interval VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Community Challenges (larger team-based challenges)
CREATE TABLE IF NOT EXISTS community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES community_locations(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  challenge_type VARCHAR(100), -- 'meditation', 'steps', 'hydration', 'sleep', etc.
  target_value INT,
  unit VARCHAR(50), -- 'minutes', 'steps', 'glasses', 'hours'
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  prize_description TEXT,
  total_participants INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Challenge Participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES community_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_value FLOAT DEFAULT 0,
  rank INT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- 6. Community Resources (documents, guides shared)
CREATE TABLE IF NOT EXISTS community_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES community_locations(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(100), -- 'guide', 'video', 'article', 'pdf', 'image'
  file_url TEXT,
  file_size_bytes INT,
  is_approved BOOLEAN DEFAULT FALSE,
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Community Moderators
CREATE TABLE IF NOT EXISTS community_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES community_locations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50), -- 'moderator', 'admin', 'organizer'
  appointed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(community_id, user_id)
);

-- 8. Community Guidelines/Rules
CREATE TABLE IF NOT EXISTS community_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES community_locations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  display_order INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Event Reviews/Feedback
CREATE TABLE IF NOT EXISTS event_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 10. Community Reports (for moderation)
CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_content_type VARCHAR(100), -- 'post', 'user', 'event', 'comment'
  reported_content_id VARCHAR(255),
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_events_community ON community_events(community_id);
CREATE INDEX IF NOT EXISTS idx_community_events_creator ON community_events(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_community_events_date ON community_events(start_date);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_status ON event_attendees(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_challenges_community ON community_challenges(community_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_community_resources_community ON community_resources(community_id);
CREATE INDEX IF NOT EXISTS idx_community_moderators_community ON community_moderators(community_id);

-- Enable RLS
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Community Events - Public read, authenticated create
CREATE POLICY "events_public_read" ON community_events
  FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "events_creator_crud" ON community_events
  FOR ALL USING (auth.uid() = created_by_user_id);

-- Event Attendees - Users see their own
CREATE POLICY "event_attendees_user_read" ON event_attendees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "event_attendees_user_write" ON event_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "event_attendees_user_update" ON event_attendees
  FOR UPDATE USING (auth.uid() = user_id);

-- Challenges - Public read
CREATE POLICY "challenges_public_read" ON community_challenges
  FOR SELECT USING (status = 'active');

-- Challenge Participants - Users see their own
CREATE POLICY "challenge_participants_read" ON challenge_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "challenge_participants_write" ON challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Community Resources - Public read for approved
CREATE POLICY "resources_public_read" ON community_resources
  FOR SELECT USING (is_approved = TRUE);

-- Event Reviews - Public read
CREATE POLICY "event_reviews_read" ON event_reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "event_reviews_write" ON event_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Community Reports - Users can report
CREATE POLICY "reports_write" ON community_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by_user_id);
