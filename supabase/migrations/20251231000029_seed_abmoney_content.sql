-- Seed data for AB.MONEY features

-- Insert Guided Meditations
INSERT INTO meditations (title, description, duration_minutes, category, subcategory, audio_url, difficulty_level, target_benefits, meditation_type, created_by_admin, is_free, requires_premium) VALUES
('Morning Awakening', 'Start your day with energy and positivity', 10, 'guided', 'morning', NULL, 'beginner', ARRAY['energy', 'focus', 'motivation'], 'guided', TRUE, TRUE, FALSE),
('Deep Sleep', 'Drift into peaceful sleep with this calming meditation', 20, 'guided', 'sleep', NULL, 'beginner', ARRAY['sleep', 'relaxation', 'peace'], 'guided', TRUE, TRUE, FALSE),
('Anxiety Relief', 'Release tension and find calm', 15, 'guided', 'anxiety', NULL, 'beginner', ARRAY['anxiety', 'stress', 'calm'], 'guided', TRUE, TRUE, FALSE),
('Loving Kindness', 'Cultivate compassion for yourself and others', 12, 'guided', 'love', NULL, 'intermediate', ARRAY['love', 'compassion', 'connection'], 'guided', TRUE, TRUE, FALSE),
('Body Scan', 'Progressive relaxation through body awareness', 18, 'guided', 'relaxation', NULL, 'beginner', ARRAY['relaxation', 'awareness', 'peace'], 'guided', TRUE, TRUE, FALSE),
('Silent Meditation', 'Pure silence for deep inner work', 15, 'silent', 'silent', NULL, 'intermediate', ARRAY['focus', 'clarity', 'awareness'], 'silent', TRUE, TRUE, FALSE),
('Alpha Wave Meditation', 'Boost creativity and mental clarity', 20, 'brainwave', 'alpha', NULL, 'intermediate', ARRAY['creativity', 'focus', 'clarity'], 'alpha_wave', TRUE, FALSE, TRUE),
('Theta Wave Relaxation', 'Deep relaxation and stress relief', 25, 'brainwave', 'theta', NULL, 'intermediate', ARRAY['relaxation', 'stress', 'focus'], 'theta_wave', TRUE, FALSE, TRUE),
('Delta Wave Sleep', 'Restorative sleep and healing', 30, 'brainwave', 'delta', NULL, 'advanced', ARRAY['sleep', 'healing', 'restoration'], 'delta_wave', TRUE, FALSE, TRUE),
('5D Meditation', 'Transcendent experience beyond dimensions', 25, '5d', 'transcendence', NULL, 'advanced', ARRAY['transcendence', 'spirituality', 'awakening'], 'guided', TRUE, FALSE, TRUE);

-- Insert Meditation Recipes
INSERT INTO meditation_recipes (title, description, duration_minutes, for_situation, cover_image_url, is_featured) VALUES
('Stress Relief Recipe', 'A curated sequence for immediate stress relief', 30, 'stress relief', NULL, TRUE),
('Abundance Meditation', 'Attract wealth and prosperity', 45, 'wealth and abundance', NULL, TRUE),
('Love and Connection', 'Open your heart and attract loving relationships', 40, 'love', NULL, TRUE),
('Creative Flow', 'Unlock your creativity and inspiration', 35, 'creativity', NULL, FALSE),
('Deep Sleep Guide', 'Your guide to restful, rejuvenating sleep', 50, 'sleep', NULL, TRUE),
('Morning Ritual', 'Set up your day for success', 25, 'motivation', NULL, TRUE),
('Energy Boost', 'Revitalize your energy and focus', 20, 'energy', NULL, FALSE),
('Spiritual Awakening', 'Connect with your higher self', 60, 'spirituality', NULL, FALSE);

-- Insert Audio Library (Melodies, Nature Sounds, Brainwaves)
INSERT INTO audio_library (title, description, audio_url, audio_type, duration_seconds, category, is_loopable, is_free) VALUES
('Gentle Rain', 'Peaceful rainfall sounds for relaxation', NULL, 'nature_sound', 600, 'nature', TRUE, TRUE),
('Forest Ambience', 'Immersive forest sounds with birds', NULL, 'nature_sound', 600, 'nature', TRUE, TRUE),
('Ocean Waves', 'Calming ocean waves for meditation', NULL, 'nature_sound', 600, 'nature', TRUE, TRUE),
('Celestial Dreams', 'Ethereal melody for deep relaxation', NULL, 'melody', 300, 'healing', TRUE, TRUE),
('Zen Garden', 'Peaceful garden sounds', NULL, 'nature_sound', 600, 'peace', TRUE, FALSE),
('Universal Love', 'Harmonic frequencies for heart opening', NULL, 'melody', 600, 'love', TRUE, FALSE),
('Alpha Waves for Focus', 'Binaural beats at 10Hz for concentration', NULL, 'brainwave', 1200, 'focus', TRUE, FALSE),
('Theta Relaxation', 'Binaural beats at 5Hz for deep relaxation', NULL, 'brainwave', 1800, 'relaxation', TRUE, FALSE);

-- Insert Daily Affirmations
INSERT INTO daily_affirmations (title, content, category, is_active, display_order) VALUES
('I Am Worthy', 'I am worthy of love, success, and happiness', 'motivation', TRUE, 1),
('Abundance Flows', 'Abundance and prosperity flow to me effortlessly', 'abundance', TRUE, 2),
('I Am Enough', 'I am enough, exactly as I am right now', 'motivation', TRUE, 3),
('Love Within', 'I choose to love myself unconditionally', 'love', TRUE, 4),
('Health and Vitality', 'My body is healthy, strong, and vital', 'health', TRUE, 5),
('Success Attracts Success', 'I attract success in all that I do', 'success', TRUE, 6),
('Inner Peace', 'I am peaceful, calm, and centered', 'motivation', TRUE, 7),
('I Deserve Joy', 'I deserve to experience joy and happiness', 'motivation', TRUE, 8),
('Grateful Heart', 'I am grateful for all the blessings in my life', 'gratitude', TRUE, 9),
('Powerful Creator', 'I am a powerful creator of my reality', 'abundance', TRUE, 10),
('Limitless Potential', 'I have unlimited potential within me', 'success', TRUE, 11),
('Present Moment', 'I am fully present in this moment', 'mindfulness', TRUE, 12),
('Divine Connection', 'I am connected to divine wisdom and love', 'spirituality', TRUE, 13),
('Authentic Self', 'I express my authentic self with confidence', 'motivation', TRUE, 14),
('Radiant Energy', 'I radiate positive energy and attract goodness', 'motivation', TRUE, 15);

-- Insert Tarot Cards - Major Arcana (0-21)
INSERT INTO tarot_cards (card_name, card_number, arcana_type, upright_meaning, reversed_meaning, description) VALUES
('The Fool', 0, 'major', 'New beginnings, innocence, spontaneity', 'Recklessness, naivety, risk-taking', 'A figure stands at the edge of a cliff, about to begin a journey.'),
('The Magician', 1, 'major', 'Power, skill, concentration', 'Illusion, deception, untapped potential', 'A figure holds a wand, symbolizing power and connection to the divine.'),
('The High Priestess', 2, 'major', 'Intuition, wisdom, mystery', 'Ignorance, lack of intuition', 'A mysterious figure sits between two pillars, guarding secrets.'),
('The Empress', 3, 'major', 'Fertility, femininity, beauty', 'Infertility, blocked creativity', 'A woman surrounded by abundance and nature.'),
('The Emperor', 4, 'major', 'Authority, power, structure', 'Tyranny, chaos, lack of control', 'A powerful ruler on his throne.'),
('The Hierophant', 5, 'major', 'Tradition, faith, education', 'Conformity, dogmatism, blind faith', 'A spiritual teacher passing wisdom.'),
('The Lovers', 6, 'major', 'Love, harmony, relationships', 'Disharmony, conflict, separation', 'Two figures in an intimate moment.'),
('The Chariot', 7, 'major', 'Control, determination, willpower', 'Lack of direction, recklessness', 'A warrior in a chariot moving forward.'),
('Strength', 8, 'major', 'Inner strength, courage, confidence', 'Weakness, self-doubt, insecurity', 'A figure gently restrains a lion.'),
('The Hermit', 9, 'major', 'Introspection, wisdom, solitude', 'Isolation, loneliness, disconnection', 'A wise figure alone with a lantern.'),
('Wheel of Fortune', 10, 'major', 'Luck, cycles, destiny', 'Bad luck, setbacks, powerlessness', 'A great wheel turning.'),
('Justice', 11, 'major', 'Justice, truth, fairness', 'Injustice, dishonesty, deception', 'A figure holding scales and a sword.'),
('The Hanged Man', 12, 'major', 'Perspective, pause, sacrifice', 'Stagnation, indecision, apathy', 'A figure suspended from a tree.'),
('Death', 13, 'major', 'Transformation, endings, beginnings', 'Stagnation, resistance to change', 'Death riding on a white horse.'),
('Temperance', 14, 'major', 'Balance, moderation, harmony', 'Imbalance, excess, conflict', 'An angel pouring water between two vessels.'),
('The Devil', 15, 'major', 'Bondage, materialism, playfulness', 'Freedom, liberation, transcendence', 'A demonic figure representing earthly pleasures.'),
('The Tower', 16, 'major', 'Upheaval, chaos, revelation', 'Avoidance, delayed chaos', 'A tower struck by lightning.'),
('The Star', 17, 'major', 'Hope, faith, inspiration', 'Despair, lost faith, doubt', 'A woman looking at stars.'),
('The Moon', 18, 'major', 'Illusion, intuition, dreams', 'Clarity, understanding, confusion', 'The moon illuminates a path through darkness.'),
('The Sun', 19, 'major', 'Success, vitality, joy', 'Blocked success, lack of joy', 'The sun shines brightly over the world.'),
('Judgement', 20, 'major', 'Reckoning, awakening, renewal', 'Self-doubt, failure', 'An angel calling forth the dead to judgment.'),
('The World', 21, 'major', 'Completion, accomplishment, wholeness', 'Incompleteness, lack of closure', 'A figure dances within a wreath, representing wholeness.');

-- Insert Osho Zen Cards
INSERT INTO osho_zen_cards (card_title, card_description, wisdom, meditation_guidance) VALUES
('Silence', 'The space between thoughts', 'Silence is not absence of sound but presence of consciousness', 'Sit silently and listen to the silence within'),
('Let Go', 'Release attachment and resistance', 'The more you hold on, the more you lose', 'Practice releasing expectations and surrender'),
('Laughter', 'The healing power of joy', 'Laughter is the best meditation', 'Laugh at yourself and life freely'),
('Patience', 'The virtue of time and acceptance', 'Patience is not weakness but wisdom', 'Wait with awareness and trust'),
('Love', 'The highest human emotion', 'Love is the bridge to the divine', 'Open your heart to give and receive'),
('Trust', 'Faith in life itself', 'When you trust, miracles happen', 'Surrender your fears to trust'),
('Acceptance', 'Yes to what is', 'What you resist persists', 'Accept yourself and your journey'),
('Surrender', 'Letting go of control', 'Surrender is not defeat but victory', 'Release the illusion of control');

-- Create a helper function to increment meditation views
CREATE OR REPLACE FUNCTION increment_meditation_views(meditation_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE meditations SET view_count = view_count + 1 WHERE id = meditation_id;
END;
$$ LANGUAGE plpgsql;
