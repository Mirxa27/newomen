-- Wellness Library Seed Data
-- Populate the wellness_resources table with sample content
-- These use free, publicly available meditation and wellness audio

-- Clear existing data (optional - comment out if you want to keep existing resources)
-- DELETE FROM wellness_resources;

-- Insert sample meditation resources
INSERT INTO wellness_resources (
  id,
  title,
  category,
  duration,
  audio_url,
  description,
  audio_type,
  status,
  is_premium,
  created_at,
  updated_at
) VALUES
  -- Meditation Resources
  (
    gen_random_uuid(),
    '5-Minute Mindful Breathing',
    'meditation',
    300,
    'https://www.youtube.com/watch?v=SEfs5TJZ6Nk',
    'A quick 5-minute guided meditation focusing on mindful breathing. Perfect for beginners or a quick reset during your day.',
    'youtube',
    'active',
    false,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '10-Minute Body Scan Meditation',
    'meditation',
    600,
    'https://www.youtube.com/watch?v=15q-N-_ippg',
    'A calming body scan meditation to release tension and increase body awareness. Great for stress relief.',
    'youtube',
    'active',
    false,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '15-Minute Morning Meditation',
    'meditation',
    900,
    'https://www.youtube.com/watch?v=aEqlQvczMJQ',
    'Start your day with intention and clarity. A gentle morning meditation to set positive energy for the day ahead.',
    'youtube',
    'active',
    false,
    now(),
    now()
  ),
  
  -- Breathing Exercises
  (
    gen_random_uuid(),
    'Box Breathing - 4-4-4-4',
    'breathing',
    240,
    'https://www.youtube.com/watch?v=tEmt1Znux58',
    'Box breathing technique (4 seconds inhale, 4 hold, 4 exhale, 4 hold). Used by Navy SEALs for stress management.',
    'youtube',
    'active',
    false,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    '4-7-8 Breathing for Sleep',
    'breathing',
    300,
    'https://www.youtube.com/watch?v=gz4G31LGyog',
    'Dr. Andrew Weil''s 4-7-8 breathing technique. A natural tranquilizer for your nervous system.',
    'youtube',
    'active',
    false,
    now(),
    now()
  ),
  
  -- Affirmations
  (
    gen_random_uuid(),
    'Morning Affirmations for Self-Love',
    'affirmations',
    600,
    'https://www.youtube.com/watch?v=d-Z3KquLhPI',
    'Start your day with powerful affirmations to build self-love, confidence, and positive mindset.',
    'youtube',
    'active',
    false,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'Confidence Boost Affirmations',
    'affirmations',
    480,
    'https://www.youtube.com/watch?v=D6mJRIr4EyM',
    'Boost your confidence and self-belief with these powerful daily affirmations.',
    'youtube',
    'active',
    false,
    now(),
    now()
  ),
  
  -- Sleep Resources
  (
    gen_random_uuid(),
    'Deep Sleep Meditation',
    'sleep',
    1800,
    'https://www.youtube.com/watch?v=1vx8iUvfyCY',
    'A 30-minute guided meditation to help you fall into deep, restful sleep. Includes calming background music.',
    'youtube',
    'active',
    false,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'Sleep Meditation - Let Go of Anxiety',
    'sleep',
    2100,
    'https://www.youtube.com/watch?v=z3XzkQONqIg',
    'Release anxiety and worry before bed. A gentle guided meditation for peaceful sleep.',
    'youtube',
    'active',
    false,
    now(),
    now()
  ),
  
  -- Focus Resources
  (
    gen_random_uuid(),
    'Focus Flow - Deep Work Session',
    'focus',
    1800,
    'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    '30 minutes of ambient focus music to enhance concentration and productivity during deep work.',
    'youtube',
    'active',
    false,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'Mindful Focus Meditation',
    'focus',
    600,
    'https://www.youtube.com/watch?v=oqJG2TJg64I',
    'A 10-minute meditation to sharpen focus and mental clarity before important tasks.',
    'youtube',
    'active',
    false,
    now(),
    now()
  ),
  
  -- Relaxation Resources
  (
    gen_random_uuid(),
    'Progressive Muscle Relaxation',
    'relaxation',
    900,
    'https://www.youtube.com/watch?v=86HUcX8ZtAk',
    'Systematic relaxation technique to release physical tension throughout your body.',
    'youtube',
    'active',
    false,
    now(),
    now()
  ),
  (
    gen_random_uuid(),
    'Stress Relief Meditation',
    'relaxation',
    720,
    'https://www.youtube.com/watch?v=dEHvPMEQdHE',
    'A 12-minute guided meditation specifically designed to reduce stress and promote relaxation.',
    'youtube',
    'active',
    false,
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;

-- Update wellness resources with YouTube info
UPDATE wellness_resources
SET 
  youtube_url = audio_url,
  youtube_audio_extracted = false
WHERE audio_type = 'youtube' AND youtube_url IS NULL;

-- Add some statistics
DO $$
DECLARE
  resource_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO resource_count FROM wellness_resources;
  RAISE NOTICE 'Wellness Library: % resources available', resource_count;
END $$;

