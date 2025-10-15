-- AB.MONEY Features: Meditations, Affirmations, Habits, Diaries, Cards, and Community

-- 1. Meditation Library
CREATE TABLE IF NOT EXISTS meditations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'guided', 'silent', '5d', 'brainwave', 'recipe'
  subcategory VARCHAR(100), -- For more specific categorization
  audio_url TEXT,
  cover_image_url TEXT,
  difficulty_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
  target_benefits TEXT[], -- array of benefits like ['anxiety', 'sleep', 'focus']
  meditation_type VARCHAR(100), -- 'alpha_wave', 'theta_wave', 'delta_wave', 'guided', etc.
  created_by_admin BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  rating FLOAT DEFAULT 0,
  is_free BOOLEAN DEFAULT TRUE,
  requires_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Meditation Recipes (Curated Collections)
CREATE TABLE IF NOT EXISTS meditation_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  recipe_content TEXT, -- JSON structure with steps and timing
  duration_minutes INT,
  for_situation VARCHAR(255), -- 'stress relief', 'sleep', 'productivity', 'wealth', etc.
  meditation_ids UUID[] DEFAULT ARRAY[]::UUID[],
  cover_image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Audio Library (Melodies, Nature Sounds, Brainwaves)
CREATE TABLE IF NOT EXISTS audio_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  audio_type VARCHAR(100) NOT NULL, -- 'melody', 'nature_sound', 'brainwave', 'background_music'
  duration_seconds INT,
  category VARCHAR(100),
  is_loopable BOOLEAN DEFAULT TRUE,
  is_free BOOLEAN DEFAULT TRUE,
  requires_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Daily Affirmations
CREATE TABLE IF NOT EXISTS daily_affirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100), -- 'motivation', 'abundance', 'love', 'health', 'success'
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT,
  schedule_time TIME DEFAULT '08:00:00', -- default time to send
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Affirmation Preferences
CREATE TABLE IF NOT EXISTS user_affirmation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_time TIME DEFAULT '08:00:00',
  allow_notifications BOOLEAN DEFAULT TRUE,
  enable_wallpaper BOOLEAN DEFAULT FALSE,
  selected_categories TEXT[] DEFAULT ARRAY['motivation', 'abundance'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 6. Habit Tracker
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'meditation', 'exercise', 'reading', 'gratitude', etc.
  frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  target_count INT DEFAULT 1, -- how many times per period
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Habit Tracking Logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL,
  completed_count INT DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, user_id, logged_date)
);

-- 8. Gratitude Diary Entries
CREATE TABLE IF NOT EXISTS gratitude_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  mood VARCHAR(50), -- 'happy', 'grateful', 'peaceful', 'inspired'
  mood_score INT, -- 1-10
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. State Diary Entries (Emotional State Tracking)
CREATE TABLE IF NOT EXISTS state_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  emotional_state VARCHAR(100)[], -- array of emotions
  energy_level INT, -- 1-10
  clarity_level INT, -- 1-10
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Progress Diaries
CREATE TABLE IF NOT EXISTS progress_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  achievements TEXT[],
  challenges TEXT[],
  goals_progress_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tarot Cards
CREATE TABLE IF NOT EXISTS tarot_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_name VARCHAR(100) NOT NULL,
  card_number INT,
  arcana_type VARCHAR(50), -- 'major', 'minor'
  suit VARCHAR(50), -- for minor arcana
  upright_meaning TEXT,
  reversed_meaning TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Osho Zen Cards
CREATE TABLE IF NOT EXISTS osho_zen_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_title VARCHAR(255) NOT NULL,
  card_description TEXT,
  wisdom TEXT,
  meditation_guidance TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Card Reading History (Tarot & Osho)
CREATE TABLE IF NOT EXISTS card_reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reading_type VARCHAR(50), -- 'tarot', 'osho_zen'
  cards_drawn UUID[],
  reading_interpretation TEXT,
  user_reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. User Meditation Progress
CREATE TABLE IF NOT EXISTS user_meditation_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meditation_id UUID NOT NULL REFERENCES meditations(id) ON DELETE CASCADE,
  completed_count INT DEFAULT 0,
  total_minutes_spent INT DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  favorited BOOLEAN DEFAULT FALSE,
  rating INT, -- 1-5
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, meditation_id)
);

-- 15. Meditation Sessions (Detailed tracking)
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meditation_id UUID NOT NULL REFERENCES meditations(id) ON DELETE CASCADE,
  duration_seconds INT,
  completed BOOLEAN DEFAULT FALSE,
  interrupted BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Community Locations (City-based communities)
CREATE TABLE IF NOT EXISTS community_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name VARCHAR(255) NOT NULL,
  country VARCHAR(255),
  latitude FLOAT,
  longitude FLOAT,
  member_count INT DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city_name, country)
);

-- 17. Community Location Members
CREATE TABLE IF NOT EXISTS community_location_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES community_locations(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, location_id)
);

-- 18. Community Location Events (Offline meetings)
CREATE TABLE IF NOT EXISTS community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES community_locations(id) ON DELETE CASCADE,
  event_title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  address TEXT,
  attendee_limit INT,
  event_type VARCHAR(100), -- 'meditation', 'meetup', 'workshop', 'retreat'
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Community Event Attendees
CREATE TABLE IF NOT EXISTS community_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rsvp_status VARCHAR(50), -- 'going', 'interested', 'maybe'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 20. Community City Chats
CREATE TABLE IF NOT EXISTS community_city_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES community_locations(id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. Wellness Milestones
CREATE TABLE IF NOT EXISTS wellness_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type VARCHAR(100), -- 'meditation', 'habit', 'gratitude', 'community'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  badge_icon_url TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_meditations_category ON meditations(category);
CREATE INDEX idx_meditations_user_views ON meditations(view_count DESC);
CREATE INDEX idx_user_meditation_progress_user ON user_meditation_progress(user_id);
CREATE INDEX idx_user_meditation_progress_meditation ON user_meditation_progress(meditation_id);
CREATE INDEX idx_meditation_sessions_user ON meditation_sessions(user_id);
CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_user ON habit_logs(user_id);
CREATE INDEX idx_gratitude_diary_user ON gratitude_diary_entries(user_id);
CREATE INDEX idx_state_diary_user ON state_diary_entries(user_id);
CREATE INDEX idx_community_location_members_user ON community_location_members(user_id);
CREATE INDEX idx_community_events_location ON community_events(location_id);
CREATE INDEX idx_community_city_chats_location ON community_city_chats(location_id);

-- Enable RLS policies
ALTER TABLE meditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_affirmation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gratitude_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarot_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE osho_zen_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_meditation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_location_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_city_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access (meditations, affirmations, cards)
CREATE POLICY "Public can read free meditations" ON meditations
  FOR SELECT USING (is_free = TRUE OR requires_premium = FALSE);

CREATE POLICY "Public can read meditation recipes" ON meditation_recipes
  FOR SELECT USING (TRUE);

CREATE POLICY "Public can read audio library" ON audio_library
  FOR SELECT USING (is_free = TRUE);

CREATE POLICY "Public can read affirmations" ON daily_affirmations
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can read tarot cards" ON tarot_cards
  FOR SELECT USING (TRUE);

CREATE POLICY "Public can read osho zen cards" ON osho_zen_cards
  FOR SELECT USING (TRUE);

-- RLS Policies for user personal data
CREATE POLICY "Users can read own affirmation settings" ON user_affirmation_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own affirmation settings" ON user_affirmation_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own affirmation settings" ON user_affirmation_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own habits" ON habits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own habits" ON habits
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own habits" ON habits
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can read own habit logs" ON habit_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own habit logs" ON habit_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own gratitude diary" ON gratitude_diary_entries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own gratitude diary" ON gratitude_diary_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own gratitude diary" ON gratitude_diary_entries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can read own state diary" ON state_diary_entries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own state diary" ON state_diary_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own progress diary" ON progress_diary_entries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own progress diary" ON progress_diary_entries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own meditation progress" ON user_meditation_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own meditation progress" ON user_meditation_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meditation progress" ON user_meditation_progress
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can read own meditation sessions" ON meditation_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own meditation sessions" ON meditation_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own card reading history" ON card_reading_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own card reading history" ON card_reading_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own wellness milestones" ON wellness_milestones
  FOR SELECT USING (user_id = auth.uid());

-- Community RLS Policies
CREATE POLICY "Users can read all locations" ON community_locations
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can read own location memberships" ON community_location_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join locations" ON community_location_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read all events" ON community_events
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can read own event attendance" ON community_event_attendees
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can attend events" ON community_event_attendees
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read city chats" ON community_city_chats
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can post to city chats" ON community_city_chats
  FOR INSERT WITH CHECK (user_id = auth.uid());
