-- Create sample assessments for testing the AI assessment system

-- First, ensure we have the necessary AI configuration
INSERT INTO ai_assessment_configs (
  id,
  name,
  provider,
  model_name,
  api_base_url,
  temperature,
  max_tokens,
  system_prompt,
  is_active
) VALUES (
  gen_random_uuid(),
  'Default Z.AI Assessment Config',
  'zai',
  'GLM-4.6',
  'https://api.z.ai/api/coding/paas/v4',
  0.7,
  2000,
  'You are an expert psychologist and personal growth coach. Analyze user responses to assessment questions and provide detailed, personalized feedback.',
  true
) ON CONFLICT (name) DO NOTHING;

-- Sample Personality Assessment
INSERT INTO assessments_enhanced (
  id,
  title,
  description,
  category,
  difficulty_level,
  time_limit_minutes,
  max_attempts,
  passing_score,
  questions,
  scoring_rubric,
  is_public,
  is_active,
  ai_config_id
) VALUES (
  'sample-personality-001',
  'Personality Insights Assessment',
  'Discover key aspects of your personality and how you interact with the world around you.',
  'personality',
  'medium',
  15,
  3,
  70.0,
  '[
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "How do you typically handle stress in challenging situations?",
      "options": [
        "I take time to think through the problem carefully",
        "I seek advice from others I trust",
        "I dive in and take immediate action",
        "I step back and take a break first"
      ],
      "required": true,
      "weight": 1
    },
    {
      "id": "q2",
      "type": "text",
      "question": "Describe a time when you had to make a difficult decision. What was your process?",
      "required": true,
      "weight": 2
    },
    {
      "id": "q3",
      "type": "rating",
      "question": "How comfortable are you with taking leadership roles?",
      "options": ["1", "2", "3", "4", "5"],
      "required": true,
      "weight": 1
    },
    {
      "id": "q4",
      "type": "multiple_choice",
      "question": "In social situations, you tend to be:",
      "options": [
        "The one who initiates conversations",
        "An active participant in discussions",
        "A thoughtful listener",
        "Someone who prefers smaller groups"
      ],
      "required": true,
      "weight": 1
    },
    {
      "id": "q5",
      "type": "boolean",
      "question": "Do you prefer to have a detailed plan before starting a project?",
      "required": true,
      "weight": 1
    }
  ]'::jsonb,
  '{
    "criteria": {
      "leadership": "Questions 3 focuses on leadership comfort",
      "decision_making": "Question 2 evaluates decision-making process",
      "social_style": "Questions 1 and 4 assess social interaction style",
      "planning_style": "Question 5 determines planning preferences"
    },
    "scoring": {
      "total_points": 6,
      "passing_threshold": 4.2
    }
  }'::jsonb,
  true,
  true,
  (SELECT id FROM ai_assessment_configs WHERE name = 'Default Z.AI Assessment Config' LIMIT 1)
);

-- Sample Emotional Intelligence Assessment
INSERT INTO assessments_enhanced (
  id,
  title,
  description,
  category,
  difficulty_level,
  time_limit_minutes,
  max_attempts,
  passing_score,
  questions,
  scoring_rubric,
  is_public,
  is_active,
  ai_config_id
) VALUES (
  'sample-emotional-001',
  'Emotional Intelligence Self-Assessment',
  'Explore your emotional awareness, regulation, and social skills in this comprehensive assessment.',
  'emotional',
  'medium',
  20,
  3,
  75.0,
  '[
    {
      "id": "eq1",
      "type": "rating",
      "question": "I can easily identify my emotions as they occur.",
      "options": ["1", "2", "3", "4", "5"],
      "required": true,
      "weight": 1
    },
    {
      "id": "eq2",
      "type": "multiple_choice",
      "question": "When someone is upset with me, I typically:",
      "options": [
        "Try to understand their perspective first",
        "Explain my own point of view",
        "Give them space until they calm down",
        "Focus on finding a solution quickly"
      ],
      "required": true,
      "weight": 2
    },
    {
      "id": "eq3",
      "type": "text",
      "question": "Describe how you typically manage strong emotions like anger or disappointment.",
      "required": true,
      "weight": 2
    },
    {
      "id": "eq4",
      "type": "rating",
      "question": "I can sense when others are feeling uncomfortable or stressed.",
      "options": ["1", "2", "3", "4", "5"],
      "required": true,
      "weight": 1
    },
    {
      "id": "eq5",
      "type": "multiple_choice",
      "question": "In group settings, I am usually:",
      "options": [
        "The one who notices group dynamics",
        "Focused on the task at hand",
        "Ensuring everyone feels included",
        "Contributing ideas and solutions"
      ],
      "required": true,
      "weight": 1
    }
  ]'::jsonb,
  '{
    "criteria": {
      "self_awareness": "Questions eq1 and eq3 measure emotional self-awareness",
      "self_regulation": "Question eq3 evaluates emotional regulation skills",
      "empathy": "Questions eq2 and eq4 assess empathetic abilities",
      "social_skills": "Questions eq2 and eq5 measure social interaction skills"
    },
    "scoring": {
      "total_points": 7,
      "passing_threshold": 5.25
    }
  }'::jsonb,
  true,
  true,
  (SELECT id FROM ai_assessment_configs WHERE name = 'Default Z.AI Assessment Config' LIMIT 1)
);

-- Sample Relationship Assessment
INSERT INTO assessments_enhanced (
  id,
  title,
  description,
  category,
  difficulty_level,
  time_limit_minutes,
  max_attempts,
  passing_score,
  questions,
  scoring_rubric,
  is_public,
  is_active,
  ai_config_id
) VALUES (
  'sample-relationship-001',
  'Relationship Patterns Assessment',
  'Gain insights into your relationship patterns, communication style, and attachment preferences.',
  'relationship',
  'medium',
  25,
  3,
  70.0,
  '[
    {
      "id": "r1",
      "type": "multiple_choice",
      "question": "In close relationships, I tend to:",
      "options": [
        "Share my feelings openly and frequently",
        "Share when asked or when it feels necessary",
        "Keep most feelings to myself",
        "Express feelings through actions rather than words"
      ],
      "required": true,
      "weight": 2
    },
    {
      "id": "r2",
      "type": "text",
      "question": "What does trust mean to you in a relationship? How do you build and maintain it?",
      "required": true,
      "weight": 2
    },
    {
      "id": "r3",
      "type": "rating",
      "question": "How comfortable are you with conflict in relationships?",
      "options": ["1", "2", "3", "4", "5"],
      "required": true,
      "weight": 1
    },
    {
      "id": "r4",
      "type": "multiple_choice",
      "question": "When I feel disconnected from someone I care about, I usually:",
      "options": [
        "Reach out and try to reconnect directly",
        "Wait for them to make the first move",
        "Give them space and see what happens",
        "Focus on other relationships or activities"
      ],
      "required": true,
      "weight": 2
    },
    {
      "id": "r5",
      "type": "boolean",
      "question": "I believe that good relationships require constant work and attention.",
      "required": true,
      "weight": 1
    }
  ]'::jsonb,
  '{
    "criteria": {
      "communication_style": "Questions r1 and r2 assess communication patterns",
      "conflict_resolution": "Question r3 measures comfort with relationship conflict",
      "attachment_behavior": "Question r4 evaluates attachment and reconnection patterns",
      "relationship_philosophy": "Questions r2 and r5 explore relationship beliefs"
    },
    "scoring": {
      "total_points": 8,
      "passing_threshold": 5.6
    }
  }'::jsonb,
  true,
  true,
  (SELECT id FROM ai_assessment_configs WHERE name = 'Default Z.AI Assessment Config' LIMIT 1)
);

-- Display created assessments
SELECT 
  id,
  title,
  category,
  difficulty_level,
  time_limit_minutes,
  is_active,
  (questions::jsonb -> 0 ->> 'question') as first_question
FROM assessments_enhanced 
WHERE id LIKE 'sample-%'
ORDER BY created_at DESC;
