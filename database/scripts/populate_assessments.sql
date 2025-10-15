-- Add comprehensive questions to all assessments

-- The Grief Alchemist
UPDATE assessments_enhanced
SET questions = $json$[
  {
    "id": "q1",
    "question": "Which statement best describes how you currently relate to your grief?",
    "type": "multiple_choice",
    "options": [
      "I keep it mostly to myself and move forward quietly",
      "I regularly lean on trusted people or communities",
      "I stay busy to avoid feeling it too strongly",
      "I meet it directly and let emotions move through me"
    ],
    "required": true
  },
  {
    "id": "q2",
    "question": "If your grief were a chapter title today, what would it be and why?",
    "type": "text",
    "placeholder": "Name the chapter and describe what it captures...",
    "required": true,
    "maxLength": 800
  },
  {
    "id": "q3",
    "question": "How often do you allow yourself to express emotions related to this loss?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q4",
    "question": "Which practices feel most supportive when a wave of grief rises?",
    "type": "multiple_choice",
    "options": [
      "Rituals or spiritual practices",
      "Creative expression (writing, art, music)",
      "Movement or somatic release",
      "Conversations with someone who truly listens"
    ],
    "required": true
  },
  {
    "id": "q5",
    "question": "Where do you most often feel grief in your body and what do you notice there?",
    "type": "text",
    "placeholder": "Describe sensations, tension, temperature, or movement...",
    "required": true,
    "maxLength": 600
  },
  {
    "id": "q6",
    "question": "How connected do you feel to the person or chapter you are grieving right now?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q7",
    "question": "Which belief has emerged or strengthened because of this loss?",
    "type": "multiple_choice",
    "options": [
      "Life is fragile and needs savoring",
      "Love continues even after separation",
      "I am more resilient than I knew",
      "I must protect myself to stay safe"
    ],
    "required": true
  },
  {
    "id": "q8",
    "question": "Share a moment when grief surprised you recently. What triggered it and how did you respond?",
    "type": "text",
    "placeholder": "Describe the moment, trigger, and your response...",
    "required": true,
    "maxLength": 900
  },
  {
    "id": "q9",
    "question": "How comfortable are you sharing your grief story with others right now?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q10",
    "question": "Which inner resource do you rely on when grief feels overwhelming?",
    "type": "multiple_choice",
    "options": [
      "Faith or spiritual connection",
      "Personal resilience and grit",
      "Perspective from previous losses",
      "Creative imagination and meaning-making"
    ],
    "required": true
  },
  {
    "id": "q11",
    "question": "What legacy or act of remembrance feels alive for you right now?",
    "type": "text",
    "placeholder": "Describe a ritual, project, or promise you feel called to create...",
    "required": true,
    "maxLength": 800
  },
  {
    "id": "q12",
    "question": "How ready do you feel to transform this grief energy into purposeful action?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  }
]$json$::jsonb
WHERE title = 'The Grief Alchemist: Metabolizing Loss into Legacy';

-- The Logotherapy Codex
UPDATE assessments_enhanced
SET questions = $json$[
  {
    "id": "q1",
    "question": "What gives your life the most meaning at this moment and why?",
    "type": "text",
    "placeholder": "Describe the people, projects, or moments that make life feel purposeful...",
    "required": true,
    "maxLength": 900
  },
  {
    "id": "q2",
    "question": "How clearly do you feel connected to a personal mission or calling right now?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q3",
    "question": "Which value do you refuse to compromise even when life is hard?",
    "type": "multiple_choice",
    "options": [
      "Integrity and honesty",
      "Love and connectedness",
      "Courage and growth",
      "Service and contribution"
    ],
    "required": true
  },
  {
    "id": "q4",
    "question": "Share a story of a time you transformed suffering into meaning.",
    "type": "text",
    "placeholder": "Describe the challenge, the insight you found, and how it changed you...",
    "required": true,
    "maxLength": 900
  },
  {
    "id": "q5",
    "question": "How aligned do your daily actions feel with the future you want to create?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q6",
    "question": "When you feel directionless, what usually helps you reorient?",
    "type": "multiple_choice",
    "options": [
      "Spending time alone in reflection",
      "Talking with a mentor or trusted friend",
      "Engaging in service or helping someone",
      "Returning to spiritual or philosophical teachings"
    ],
    "required": true
  },
  {
    "id": "q7",
    "question": "What would you create or contribute if you believed your gifts were urgently needed?",
    "type": "text",
    "placeholder": "Describe the project, relationship, or change you would initiate...",
    "required": true,
    "maxLength": 800
  },
  {
    "id": "q8",
    "question": "How supported do you feel in pursuing a life of meaning right now?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q9",
    "question": "Which mindset best describes how you interpret challenges today?",
    "type": "multiple_choice",
    "options": [
      "They are random obstacles I must overcome",
      "They are lessons guiding me to adjust",
      "They are invitations to deepen my purpose",
      "They are signals that I should slow down"
    ],
    "required": true
  },
  {
    "id": "q10",
    "question": "Write a message from your future self celebrating how you lived with meaning.",
    "type": "text",
    "placeholder": "Let future-you thank present-you for a courageous choice...",
    "required": true,
    "maxLength": 800
  },
  {
    "id": "q11",
    "question": "How confident are you that your current path reflects your core values?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q12",
    "question": "What is one bold shift you are ready to make to live your meaning more fully?",
    "type": "text",
    "placeholder": "Describe the decision, habit, or conversation you are willing to initiate...",
    "required": true,
    "maxLength": 700
  }
]$json$::jsonb
WHERE title = 'The Logotherapy Codex: Forging Meaning in the Chaos';

-- The Body as a Living Oracle
UPDATE assessments_enhanced
SET questions = $json$[
  {
    "id": "q1",
    "question": "How often do you consciously check in with your body during a typical day?",
    "type": "multiple_choice",
    "options": [
      "Every couple of hours or more",
      "Once or twice a day",
      "Only when discomfort appears",
      "Rarely or almost never"
    ],
    "required": true
  },
  {
    "id": "q2",
    "question": "Describe a recent moment when your body sent a signal before your mind caught up.",
    "type": "text",
    "placeholder": "Share the sensation, the situation, and what you realized...",
    "required": true,
    "maxLength": 900
  },
  {
    "id": "q3",
    "question": "Where do you most commonly carry stress and what does it feel like there?",
    "type": "multiple_choice",
    "options": [
      "Head or jaw: pressure, headaches, clenching",
      "Chest or throat: tightness, shallow breath",
      "Stomach or gut: knots, churning, heaviness",
      "Shoulders or back: stiffness, ache, burning",
      "Limbs: restlessness, numbness, tingling"
    ],
    "required": true
  },
  {
    "id": "q4",
    "question": "How fluent do you feel in translating body sensations into emotional insight?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q5",
    "question": "What movement or posture instantly shifts your mood?",
    "type": "text",
    "placeholder": "Describe a stretch, dance, breath, or stance that changes things...",
    "required": true,
    "maxLength": 600
  },
  {
    "id": "q6",
    "question": "When your body is exhausted, which response do you default to?",
    "type": "multiple_choice",
    "options": [
      "Push through and ignore the signals",
      "Rest briefly but return to the same pace",
      "Restructure plans to honor the need",
      "Seek support or care from others"
    ],
    "required": true
  },
  {
    "id": "q7",
    "question": "How nourished do you feel by your current routines around food, hydration, and rest?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q8",
    "question": "What emotion is your body holding that your words have not yet spoken?",
    "type": "text",
    "placeholder": "Name the emotion and where it lives in you right now...",
    "required": true,
    "maxLength": 700
  },
  {
    "id": "q9",
    "question": "Which practice helps you return to embodied presence most reliably?",
    "type": "multiple_choice",
    "options": [
      "Breathwork or meditation",
      "Stretching or yoga",
      "Somatic shaking or intuitive movement",
      "Touch, massage, or grounding through texture"
    ],
    "required": true
  },
  {
    "id": "q10",
    "question": "How safe does it feel to fully express emotion through your body (tears, trembling, laughter)?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q11",
    "question": "What is your body asking you to say yes to over the next week?",
    "type": "text",
    "placeholder": "Describe a boundary, practice, or experience your body is craving...",
    "required": true,
    "maxLength": 600
  },
  {
    "id": "q12",
    "question": "What is your body asking you to release or complete?",
    "type": "text",
    "placeholder": "Identify a habit, pattern, or commitment your body wants to finish...",
    "required": true,
    "maxLength": 600
  }
]$json$::jsonb
WHERE title LIKE '%Body as a Living Oracle%';

-- Time Traveler's Passport
UPDATE assessments_enhanced
SET questions = $json$[
  {
    "id": "q1",
    "question": "Which past experience most shapes who you are today?",
    "type": "text",
    "placeholder": "Describe the memory, the lesson, and how it still lives in you...",
    "required": true,
    "maxLength": 900
  },
  {
    "id": "q2",
    "question": "How satisfied are you with the way you honor your past while living in the present?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q3",
    "question": "Which personal pattern from the past feels ready to be rewritten?",
    "type": "multiple_choice",
    "options": [
      "People-pleasing over self-trust",
      "Perfectionism over experimentation",
      "Avoidance over courageous conversation",
      "Self-criticism over compassionate accountability"
    ],
    "required": true
  },
  {
    "id": "q4",
    "question": "Describe a moment from today that deserves to become a core memory.",
    "type": "text",
    "placeholder": "What happened, why it matters, and how you can savor it...",
    "required": true,
    "maxLength": 700
  },
  {
    "id": "q5",
    "question": "How present do you feel in the rhythm of your current days?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q6",
    "question": "Which time orientation dominates your thinking right now?",
    "type": "multiple_choice",
    "options": [
      "Replaying the past",
      "Savoring the present",
      "Strategizing the future",
      "Drifting between all three without intention"
    ],
    "required": true
  },
  {
    "id": "q7",
    "question": "Imagine your future self five years from now. What are they grateful you chose today?",
    "type": "text",
    "placeholder": "Let future-you thank present-you for a specific decision or practice...",
    "required": true,
    "maxLength": 800
  },
  {
    "id": "q8",
    "question": "How confident are you in the trajectory you are currently on?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q9",
    "question": "What habit or ritual will future-you thank you for establishing this month?",
    "type": "text",
    "placeholder": "Describe the habit, why it matters, and how you can begin...",
    "required": true,
    "maxLength": 700
  },
  {
    "id": "q10",
    "question": "When you imagine your ideal day five years ahead, which theme stands out most?",
    "type": "multiple_choice",
    "options": [
      "Creative expression and impact",
      "Deep relationships and belonging",
      "Adventure, learning, and exploration",
      "Peace, spaciousness, and wellbeing"
    ],
    "required": true
  },
  {
    "id": "q11",
    "question": "How resilient do you feel in adapting plans when life shifts unexpectedly?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q12",
    "question": "Write a promise your present self is making to bridge past wisdom with future dreams.",
    "type": "text",
    "placeholder": "State the promise and how you will remember it...",
    "required": true,
    "maxLength": 600
  }
]$json$::jsonb
WHERE title LIKE '%Time Traveler%';

-- Update all remaining assessments with generic but powerful questions
UPDATE assessments_enhanced
SET questions = $json$[
  {
    "id": "q1",
    "question": "What area of your life feels most ready for expansion right now?",
    "type": "multiple_choice",
    "options": [
      "Purpose and career",
      "Relationships and belonging",
      "Health and vitality",
      "Creative expression",
      "Inner growth and mindset"
    ],
    "required": true
  },
  {
    "id": "q2",
    "question": "How energized do you feel by your current daily rhythm?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q3",
    "question": "Describe a meaningful win from the past month and what it taught you.",
    "type": "text",
    "placeholder": "Share the win, why it mattered, and the insight you gained...",
    "required": true,
    "maxLength": 700
  },
  {
    "id": "q4",
    "question": "Which thought pattern most limits you at the moment?",
    "type": "multiple_choice",
    "options": [
      "All-or-nothing thinking",
      "Fear of visibility or judgment",
      "Second-guessing decisions",
      "Delaying action until conditions are perfect"
    ],
    "required": true
  },
  {
    "id": "q5",
    "question": "How aligned do you feel with your core values today?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q6",
    "question": "What supportive habits or rituals are you ready to double down on?",
    "type": "text",
    "placeholder": "List the practices you want to recommit to and why...",
    "required": true,
    "maxLength": 600
  },
  {
    "id": "q7",
    "question": "Where do you most need to ask for help or accountability?",
    "type": "multiple_choice",
    "options": [
      "Clarifying priorities",
      "Emotional support",
      "Skill development",
      "Staying consistent with new habits"
    ],
    "required": true
  },
  {
    "id": "q8",
    "question": "How confident are you in navigating setbacks with resilience right now?",
    "type": "rating",
    "min": 1,
    "max": 5,
    "required": true
  },
  {
    "id": "q9",
    "question": "Describe a belief about yourself that you are ready to evolve.",
    "type": "text",
    "placeholder": "State the old belief and the empowering one replacing it...",
    "required": true,
    "maxLength": 600
  },
  {
    "id": "q10",
    "question": "What promise are you making to yourself for the next 30 days?",
    "type": "text",
    "placeholder": "Describe the commitment, why it matters, and how you will keep it...",
    "required": true,
    "maxLength": 600
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

