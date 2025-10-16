-- Add YouTube link support to wellness_resources table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wellness_resources' AND column_name = 'youtube_url') THEN
    ALTER TABLE wellness_resources ADD COLUMN youtube_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wellness_resources' AND column_name = 'audio_type') THEN
    ALTER TABLE wellness_resources ADD COLUMN audio_type TEXT DEFAULT 'file' CHECK (audio_type IN ('file', 'youtube'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'wellness_resources' AND column_name = 'youtube_audio_extracted') THEN
    ALTER TABLE wellness_resources ADD COLUMN youtube_audio_extracted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add frontend_name to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'frontend_name') THEN
    ALTER TABLE user_profiles ADD COLUMN frontend_name TEXT;
  END IF;
END $$;

-- Create index for youtube_audio_extracted for performance
CREATE INDEX IF NOT EXISTS idx_wellness_resources_youtube_audio_extracted 
ON wellness_resources(youtube_audio_extracted) 
WHERE youtube_url IS NOT NULL;

-- Create index for frontend_name
CREATE INDEX IF NOT EXISTS idx_user_profiles_frontend_name 
ON user_profiles(frontend_name) 
WHERE frontend_name IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN wellness_resources.youtube_url IS 'YouTube video URL for audio extraction';
COMMENT ON COLUMN wellness_resources.audio_type IS 'Type of audio source: file or youtube';
COMMENT ON COLUMN wellness_resources.youtube_audio_extracted IS 'Whether YouTube audio has been successfully extracted';
COMMENT ON COLUMN user_profiles.frontend_name IS 'Custom display name that admins can set for users';