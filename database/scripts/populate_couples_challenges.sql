-- Couples Challenge Templates Upsert
-- This script upserts richer, logical 10–15 question templates for couples challenges
-- It updates existing templates by title or inserts if not present.

-- Alignment & Values
WITH upsert AS (
  UPDATE public.challenge_templates
  SET description = 'Explore core values, alignment, and practical ways to support each other.',
      category = 'alignment',
      questions = '[
        "Which three values do you consider non‑negotiable in our relationship, and why?",
        "What does emotional safety look like for you in daily life?",
        "Where do our values feel most aligned right now?",
        "Where do our values differ, and how can we honor both?",
        "What boundary would help you show up more fully in this relationship?",
        "How do you prefer to receive support when you''re stressed?",
        "What decision did we make recently that reflected our shared values?",
        "What would you like me to better understand about your life goals?",
        "What does fairness look like to you when we disagree?",
        "How do you define commitment during difficult seasons?",
        "What ritual could we start to reinforce our shared values weekly?",
        "What is one small promise we can make to each other for the next 30 days?"
      ]'::jsonb,
      is_active = true,
      updated_at = now()
  WHERE title = 'Alignment & Values'
  RETURNING *
)
INSERT INTO public.challenge_templates (title, description, category, questions, is_active)
SELECT 'Alignment & Values', 'Explore core values, alignment, and practical ways to support each other.', 'alignment', '[
  "Which three values do you consider non‑negotiable in our relationship, and why?",
  "What does emotional safety look like for you in daily life?",
  "Where do our values feel most aligned right now?",
  "Where do our values differ, and how can we honor both?",
  "What boundary would help you show up more fully in this relationship?",
  "How do you prefer to receive support when you''re stressed?",
  "What decision did we make recently that reflected our shared values?",
  "What would you like me to better understand about your life goals?",
  "What does fairness look like to you when we disagree?",
  "How do you define commitment during difficult seasons?",
  "What ritual could we start to reinforce our shared values weekly?",
  "What is one small promise we can make to each other for the next 30 days?"
]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM upsert);

-- Conflict to Connection
WITH upsert AS (
  UPDATE public.challenge_templates
  SET description = 'Transform conflict into connection through repair, empathy, and shared learning.',
      category = 'communication',
      questions = '[
        "When conflict arises, what do you most need from me in the first five minutes?",
        "What signal tells you it''s safe to open up during a disagreement?",
        "What do I do during conflict that helps, and what gets in the way?",
        "What is one story from your past that shapes how you handle disagreements?",
        "How do you prefer we repair after an argument?",
        "What would an ideal timeout or pause look like for you?",
        "Which topics feel most charged, and how can we prepare for them better?",
        "What''s one shared phrase we can use to de‑escalate together?",
        "How can we name feelings without blaming each other?",
        "What boundary around conflict would help you feel respected?",
        "What does true forgiveness and forward‑movement look like for you?",
        "What can we celebrate about how far we''ve come in handling conflict?"
      ]'::jsonb,
      is_active = true,
      updated_at = now()
  WHERE title = 'Conflict to Connection'
  RETURNING *
)
INSERT INTO public.challenge_templates (title, description, category, questions, is_active)
SELECT 'Conflict to Connection', 'Transform conflict into connection through repair, empathy, and shared learning.', 'communication', '[
  "When conflict arises, what do you most need from me in the first five minutes?",
  "What signal tells you it''s safe to open up during a disagreement?",
  "What do I do during conflict that helps, and what gets in the way?",
  "What is one story from your past that shapes how you handle disagreements?",
  "How do you prefer we repair after an argument?",
  "What would an ideal timeout or pause look like for you?",
  "Which topics feel most charged, and how can we prepare for them better?",
  "What''s one shared phrase we can use to de‑escalate together?",
  "How can we name feelings without blaming each other?",
  "What boundary around conflict would help you feel respected?",
  "What does true forgiveness and forward‑movement look like for you?",
  "What can we celebrate about how far we''ve come in handling conflict?"
]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM upsert);

-- Intimacy & Trust
WITH upsert AS (
  UPDATE public.challenge_templates
  SET description = 'Deepen emotional, physical, and intellectual intimacy with trust‑building prompts.',
      category = 'intimacy',
      questions = '[
        "What makes you feel most emotionally connected to me?",
        "How do you like affection to be initiated and received?",
        "What builds your trust in me, and what erodes it?",
        "Where do you most want to feel seen or appreciated right now?",
        "What slows you down or closes you off when you''re vulnerable?",
        "What ritual could increase our sense of closeness?",
        "How can we create more spaciousness for playful connection?",
        "What does after‑care look like for you after intense emotions or intimacy?",
        "How do you want me to respond when you''re hesitant or unsure?",
        "What do you wish I asked you more often?",
        "What shared adventure would reignite our curiosity together?",
        "What promise about trust can we make to each other today?"
      ]'::jsonb,
      is_active = true,
      updated_at = now()
  WHERE title = 'Intimacy & Trust'
  RETURNING *
)
INSERT INTO public.challenge_templates (title, description, category, questions, is_active)
SELECT 'Intimacy & Trust', 'Deepen emotional, physical, and intellectual intimacy with trust‑building prompts.', 'intimacy', '[
  "What makes you feel most emotionally connected to me?",
  "How do you like affection to be initiated and received?",
  "What builds your trust in me, and what erodes it?",
  "Where do you most want to feel seen or appreciated right now?",
  "What slows you down or closes you off when you''re vulnerable?",
  "What ritual could increase our sense of closeness?",
  "How can we create more spaciousness for playful connection?",
  "What does after‑care look like for you after intense emotions or intimacy?",
  "How do you want me to respond when you''re hesitant or unsure?",
  "What do you wish I asked you more often?",
  "What shared adventure would reignite our curiosity together?",
  "What promise about trust can we make to each other today?"
]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM upsert);

-- Future Vision & Goals
WITH upsert AS (
  UPDATE public.challenge_templates
  SET description = 'Align long‑term vision across lifestyle, family, finances, and personal growth.',
      category = 'future',
      questions = '[
        "What does an ideal day together look like five years from now?",
        "What personal goal are you most excited to pursue, and how can I support it?",
        "What fears or risks are worth taking together in the next year?",
        "How do you want to grow as individuals while staying connected as a team?",
        "What financial habit would most improve our wellbeing?",
        "What does home mean to you, and where do you imagine it?",
        "How do you envision friendship and community in our future?",
        "What rhythms (work, rest, travel) feel most life‑giving to you?",
        "How do we want to make decisions when priorities conflict?",
        "What legacy or impact would we like to create together?",
        "What tradition would you love us to begin this year?",
        "What would future‑us thank us for choosing right now?"
      ]'::jsonb,
      is_active = true,
      updated_at = now()
  WHERE title = 'Future Vision & Goals'
  RETURNING *
)
INSERT INTO public.challenge_templates (title, description, category, questions, is_active)
SELECT 'Future Vision & Goals', 'Align long‑term vision across lifestyle, family, finances, and personal growth.', 'future', '[
  "What does an ideal day together look like five years from now?",
  "What personal goal are you most excited to pursue, and how can I support it?",
  "What fears or risks are worth taking together in the next year?",
  "How do you want to grow as individuals while staying connected as a team?",
  "What financial habit would most improve our wellbeing?",
  "What does home mean to you, and where do you imagine it?",
  "How do you envision friendship and community in our future?",
  "What rhythms (work, rest, travel) feel most life‑giving to you?",
  "How do we want to make decisions when priorities conflict?",
  "What legacy or impact would we like to create together?",
  "What tradition would you love us to begin this year?",
  "What would future‑us thank us for choosing right now?"
]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM upsert);

-- Daily Rituals & Communication
WITH upsert AS (
  UPDATE public.challenge_templates
  SET description = 'Build daily practices that strengthen communication, gratitude, and teamwork.',
      category = 'rituals',
      questions = '[
        "What daily check‑in question would feel most supportive?",
        "Which small habit would make our mornings smoother?",
        "What chore or task trade would feel fairer for both of us?",
        "What is one gratitude you want to share today, and why?",
        "How can we end the day in a way that leaves us feeling connected?",
        "What phone or tech boundary would improve our presence together?",
        "What is one topic we''ve avoided that deserves gentle attention?",
        "What is your preferred way to receive feedback from me?",
        "What signal can we use to ask for a reset during tense moments?",
        "What weekly ritual would boost our sense of partnership?"
      ]'::jsonb,
      is_active = true,
      updated_at = now()
  WHERE title = 'Daily Rituals & Communication'
  RETURNING *
)
INSERT INTO public.challenge_templates (title, description, category, questions, is_active)
SELECT 'Daily Rituals & Communication', 'Build daily practices that strengthen communication, gratitude, and teamwork.', 'rituals', '[
  "What daily check‑in question would feel most supportive?",
  "Which small habit would make our mornings smoother?",
  "What chore or task trade would feel fairer for both of us?",
  "What is one gratitude you want to share today, and why?",
  "How can we end the day in a way that leaves us feeling connected?",
  "What phone or tech boundary would improve our presence together?",
  "What is one topic we''ve avoided that deserves gentle attention?",
  "What is your preferred way to receive feedback from me?",
  "What signal can we use to ask for a reset during tense moments?",
  "What weekly ritual would boost our sense of partnership?"
]'::jsonb, true
WHERE NOT EXISTS (SELECT 1 FROM upsert);

-- Verification: list templates and question counts
SELECT title, category, jsonb_array_length(questions) AS question_count, is_active
FROM public.challenge_templates
ORDER BY created_at DESC;
