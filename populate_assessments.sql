-- Add comprehensive questions to all assessments

-- The Grief Alchemist
UPDATE assessments_enhanced
SET questions = $json$[
  {
    "id": "q1",
    "question": "How do you typically process significant loss in your life?",
    "type": "multiple_choice",
    "options": [
      "I need time alone to process my emotions privately",
      "I seek support from friends and loved ones",
      "I throw myself into work or activities as a distraction",
      "I allow myself to feel deeply and express emotions openly"
    ],
    "required": true
  },
  {
    "id": "q2",
    "question": "When remembering someone or something you have lost, what emotion surfaces most often?",
    "type": "multiple_choice",
    "options": [
      "Gratitude for the time we had together",
      "Sadness and longing for what was",
      "Anger or regret about how things ended",
      "Peace and acceptance"
    ],
    "required": true
  },
  {
    "id": "q3",
    "question": "How has grief or loss shaped who you are today?",
    "type": "text",
    "placeholder": "Share how loss has transformed you...",
    "required": true,
    "maxLength": 1000
  },
  {
    "id": "q4",
    "question": "What legacy do you want to create from your experiences with loss?",
    "type": "text",
    "placeholder": "What meaning can you create from your grief?",
    "required": true,
    "maxLength": 1000
  },
  {
    "id": "q5",
    "question": "On a scale of 1-10, how well do you feel you have integrated past losses into your life story?",
    "type": "rating",
    "min": 1,
    "max": 10,
    "required": true
  }
]$json$::jsonb
WHERE title = 'The Grief Alchemist: Metabolizing Loss into Legacy';

-- The Logotherapy Codex
UPDATE assessments_enhanced
SET questions = $json$[
  {
    "id": "q1",
    "question": "What gives your life the most meaning right now?",
    "type": "text",
    "placeholder": "Describe what makes you feel your life has purpose...",
    "required": true,
    "maxLength": 1000
  },
  {
    "id": "q2",
    "question": "When you imagine yourself at the end of your life looking back, what would make you feel it was well-lived?",
    "type": "text",
    "placeholder": "What legacy or impact do you want to leave?",
    "required": true,
    "maxLength": 1000
  },
  {
    "id": "q3",
    "question": "In moments of difficulty, what helps you find meaning in the struggle?",
    "type": "multiple_choice",
    "options": [
      "Remembering my values and what I stand for",
      "Connecting to something larger than myself",
      "Seeing how it could help me grow",
      "Finding ways to help others through similar struggles"
    ],
    "required": true
  },
  {
    "id": "q4",
    "question": "What would you do differently if you knew your actions truly mattered?",
    "type": "text",
    "placeholder": "If your life had profound meaning, how would you live?",
    "required": true,
    "maxLength": 1000
  }
]$json$::jsonb
WHERE title = 'The Logotherapy Codex: Forging Meaning in the Chaos';

-- The Body as a Living Oracle
UPDATE assessments_enhanced
SET questions = $json$[
  {
    "id": "q1",
    "question": "How often do you check in with your body throughout the day?",
    "type": "multiple_choice",
    "options": [
      "Constantly - I am very aware of physical sensations",
      "Regularly - I pause to notice how I am feeling",
      "Occasionally - Only when something hurts or feels off",
      "Rarely - I am mostly in my head"
    ],
    "required": true
  },
  {
    "id": "q2",
    "question": "Describe a recent time when your body was trying to tell you something. What was the sensation and what do you think it meant?",
    "type": "text",
    "placeholder": "E.g., tight shoulders, butterflies in stomach, tension headache...",
    "required": true,
    "maxLength": 1000
  },
  {
    "id": "q3",
    "question": "Where in your body do you typically feel stress or anxiety?",
    "type": "multiple_choice",
    "options": [
      "Head - tension headaches, racing thoughts",
      "Chest/Heart - tightness, rapid heartbeat",
      "Stomach/Gut - butterflies, nausea, knots",
      "Shoulders/Neck - tension, tightness",
      "All over - general body tension"
    ],
    "required": true
  },
  {
    "id": "q4",
    "question": "How comfortable are you expressing emotions physically (crying, shaking, moving)?",
    "type": "rating",
    "min": 1,
    "max": 10,
    "required": true
  },
  {
    "id": "q5",
    "question": "What does your body need more of right now?",
    "type": "text",
    "placeholder": "Movement, rest, touch, stillness, expression...",
    "required": true,
    "maxLength": 500
  }
]$json$::jsonb
WHERE title LIKE '%Body as a Living Oracle%';

-- Time Traveler's Passport
UPDATE assessments_enhanced
SET questions = $json$[
  {
    "id": "q1",
    "question": "What from your past still influences your present in significant ways?",
    "type": "text",
    "placeholder": "Share memories, experiences, or patterns...",
    "required": true,
    "maxLength": 1000
  },
  {
    "id": "q2",
    "question": "When you think about your future self, what do you hope they will thank you for doing today?",
    "type": "text",
    "placeholder": "What actions today will matter most tomorrow?",
    "required": true,
    "maxLength": 1000
  },
  {
    "id": "q3",
    "question": "How present do you feel in your daily life?",
    "type": "rating",
    "min": 1,
    "max": 10,
    "required": true
  },
  {
    "id": "q4",
    "question": "What habit or pattern from your past are you ready to release?",
    "type": "text",
    "placeholder": "What no longer serves you?",
    "required": true,
    "maxLength": 500
  },
  {
    "id": "q5",
    "question": "Describe your ideal future self 5 years from now:",
    "type": "text",
    "placeholder": "Who are you? What are you doing? How do you feel?",
    "required": true,
    "maxLength": 1000
  }
]$json$::jsonb
WHERE title LIKE '%Time Traveler%';

-- Update all remaining assessments with generic but powerful questions
UPDATE assessments_enhanced
SET questions = $json$[
  {
    "id": "q1",
    "question": "What aspect of your life would you most like to transform?",
    "type": "multiple_choice",
    "options": [
      "Career and professional fulfillment",
      "Relationships and connections",
      "Health and physical well-being",
      "Personal growth and self-discovery",
      "Creative expression and purpose"
    ],
    "required": true
  },
  {
    "id": "q2",
    "question": "Describe a challenge you are currently facing and how you are approaching it:",
    "type": "text",
    "placeholder": "Share your current challenge...",
    "required": true,
    "maxLength": 1000
  },
  {
    "id": "q3",
    "question": "On a scale of 1-10, how aligned do you feel with your authentic self?",
    "type": "rating",
    "min": 1,
    "max": 10,
    "required": true
  },
  {
    "id": "q4",
    "question": "What strengths do you want to develop further?",
    "type": "text",
    "placeholder": "List the qualities you want to cultivate...",
    "required": true,
    "maxLength": 500
  },
  {
    "id": "q5",
    "question": "If you could give your future self one piece of advice, what would it be?",
    "type": "text",
    "placeholder": "Share your wisdom with your future self...",
    "required": true,
    "maxLength": 500
  }
]$json$::jsonb
WHERE (questions IS NULL OR jsonb_array_length(questions) < 3) 
  AND is_active = true 
  AND type = 'assessment';

-- Verify all assessments now have questions
SELECT 
  title,
  jsonb_array_length(questions) as question_count,
  category,
  difficulty_level,
  ai_config_id IS NOT NULL as has_ai_config,
  is_public
FROM assessments_enhanced
WHERE is_active = true
ORDER BY created_at DESC;

