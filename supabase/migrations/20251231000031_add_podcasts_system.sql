-- Phase 3: Podcasts System (Podcast Library, Episodes, Subscriptions, Playback)

-- 1. Podcasts Table
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  author VARCHAR(255),
  category VARCHAR(100), -- 'meditation', 'wellness', 'motivation', 'spirituality'
  subcategory VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en',
  explicit_content BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  requires_premium BOOLEAN DEFAULT FALSE,
  total_episodes INT DEFAULT 0,
  average_rating FLOAT DEFAULT 0,
  total_downloads INT DEFAULT 0,
  podcast_url TEXT, -- External podcast feed URL
  rss_feed_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Podcast Episodes
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  episode_number INT,
  season_number INT DEFAULT 1,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  duration_seconds INT,
  release_date TIMESTAMPTZ DEFAULT NOW(),
  thumbnail_url TEXT,
  transcript TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  is_free BOOLEAN DEFAULT FALSE,
  requires_premium BOOLEAN DEFAULT FALSE,
  episode_summary TEXT,
  key_topics TEXT[],
  download_count INT DEFAULT 0,
  play_count INT DEFAULT 0,
  average_rating FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Podcast Subscriptions
CREATE TABLE IF NOT EXISTS user_podcast_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  auto_download BOOLEAN DEFAULT FALSE,
  notify_on_new BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, podcast_id)
);

-- 4. Episode Playback History
CREATE TABLE IF NOT EXISTS podcast_playback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES podcast_episodes(id) ON DELETE CASCADE,
  podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  last_position_seconds INT DEFAULT 0,
  total_seconds_played INT DEFAULT 0,
  play_count INT DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  playback_quality VARCHAR(50), -- 'low', 'medium', 'high'
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, episode_id)
);

-- 5. Episode Ratings & Reviews
CREATE TABLE IF NOT EXISTS podcast_episode_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES podcast_episodes(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_helpful BOOLEAN,
  helpful_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, episode_id)
);

-- 6. Podcast Favorites
CREATE TABLE IF NOT EXISTS podcast_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES podcast_episodes(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, podcast_id, episode_id)
);

-- 7. Podcast Downloads (for offline listening)
CREATE TABLE IF NOT EXISTS podcast_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES podcast_episodes(id) ON DELETE CASCADE,
  local_file_path TEXT,
  file_size_bytes INT,
  download_status VARCHAR(50), -- 'pending', 'downloading', 'completed', 'failed'
  download_progress_percent INT DEFAULT 0,
  downloaded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Podcast Playlists (user-created)
CREATE TABLE IF NOT EXISTS podcast_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  episode_ids UUID[] DEFAULT ARRAY[]::UUID[],
  is_public BOOLEAN DEFAULT FALSE,
  play_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Podcast Analytics (for creators)
CREATE TABLE IF NOT EXISTS podcast_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES podcast_episodes(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT NOW(),
  total_plays INT DEFAULT 0,
  total_downloads INT DEFAULT 0,
  completion_rate FLOAT DEFAULT 0,
  average_listen_time_seconds INT DEFAULT 0,
  unique_listeners INT DEFAULT 0,
  new_subscriptions INT DEFAULT 0
);

-- 10. Podcast Categories (Reference Table)
CREATE TABLE IF NOT EXISTS podcast_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed podcast categories
INSERT INTO podcast_categories (name, description, display_order, is_active)
VALUES 
  ('Meditation & Mindfulness', 'Guided meditations and mindfulness practices', 1, TRUE),
  ('Wellness & Health', 'Health tips, nutrition, and wellness advice', 2, TRUE),
  ('Spirituality', 'Spiritual growth and development', 3, TRUE),
  ('Motivation & Inspiration', 'Motivational talks and success stories', 4, TRUE),
  ('Relationships', 'Relationship advice and communication tips', 5, TRUE),
  ('Personal Growth', 'Self-improvement and personal development', 6, TRUE),
  ('Sleep & Relaxation', 'Sleep stories and relaxation techniques', 7, TRUE),
  ('Business & Finance', 'Financial wellness and business tips', 8, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_podcasts_category ON podcasts(category);
CREATE INDEX IF NOT EXISTS idx_podcasts_active ON podcasts(is_active);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_podcast ON podcast_episodes(podcast_id);
CREATE INDEX IF NOT EXISTS idx_podcast_episodes_released ON podcast_episodes(release_date);
CREATE INDEX IF NOT EXISTS idx_podcast_subscriptions_user ON user_podcast_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_podcast_playback_user ON podcast_playback(user_id);
CREATE INDEX IF NOT EXISTS idx_podcast_playback_episode ON podcast_playback(episode_id);
CREATE INDEX IF NOT EXISTS idx_podcast_playback_completed ON podcast_playback(is_completed);
CREATE INDEX IF NOT EXISTS idx_podcast_downloads_user ON podcast_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_podcast_downloads_status ON podcast_downloads(download_status);
CREATE INDEX IF NOT EXISTS idx_podcast_favorites_user ON podcast_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_podcast_playlists_user ON podcast_playlists(user_id);

-- RLS Policies
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_podcast_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_playback ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_episode_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcast_categories ENABLE ROW LEVEL SECURITY;

-- Public policies
CREATE POLICY "podcasts_public_read" ON podcasts
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "podcast_episodes_public_read" ON podcast_episodes
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "podcast_categories_public_read" ON podcast_categories
  FOR SELECT USING (is_active = TRUE);

-- User subscription policies
CREATE POLICY "user_podcast_subscriptions_user_read" ON user_podcast_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_podcast_subscriptions_user_write" ON user_podcast_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Playback history policies
CREATE POLICY "podcast_playback_user_read" ON podcast_playback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "podcast_playback_user_write" ON podcast_playback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "podcast_playback_user_update" ON podcast_playback
  FOR UPDATE USING (auth.uid() = user_id);

-- Ratings policies
CREATE POLICY "podcast_ratings_user_read" ON podcast_episode_ratings
  FOR SELECT USING (TRUE);

CREATE POLICY "podcast_ratings_user_write" ON podcast_episode_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "podcast_ratings_user_update" ON podcast_episode_ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "podcast_favorites_user_read" ON podcast_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "podcast_favorites_user_write" ON podcast_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "podcast_favorites_user_delete" ON podcast_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Downloads policies
CREATE POLICY "podcast_downloads_user_read" ON podcast_downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "podcast_downloads_user_write" ON podcast_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Playlist policies
CREATE POLICY "podcast_playlists_user_read" ON podcast_playlists
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "podcast_playlists_user_write" ON podcast_playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "podcast_playlists_user_update" ON podcast_playlists
  FOR UPDATE USING (auth.uid() = user_id);
