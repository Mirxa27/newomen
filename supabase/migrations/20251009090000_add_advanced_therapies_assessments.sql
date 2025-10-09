-- Seed Advanced Exploration Therapies Gallery into assessments_enhanced
-- Adds 10 guided-journey assessments with stage-based prompts

-- Helper note: questions JSON structure must match app expectations:
-- [ { "id": string, "question": string, "type": "text"|"multiple-choice", "options"?: string[] } ]

begin;

insert into public.assessments_enhanced (
  id, title, description, type, category, difficulty_level,
  time_limit_minutes, questions, passing_score, ai_config_id, is_public, is_active
) values
-- 1. The Grief Alchemist
('998b7ab2-8cb0-42d6-abc3-2859877d5bd9',
 'The Grief Alchemist: Metabolizing Loss into Legacy',
 'Welcome grief as a sacred visitor, learn its language, and alchemize pain into a living legacy.',
 'assessment', 'advanced-therapy', 'expert',
 20,
 jsonb_build_array(
   jsonb_build_object('id','welcome-grief','question','Stage 1 — The Sacred Welcome: If grief were a presence visiting you, how would you describe it? What does its presence feel like in your body and your space?','type','text'),
   jsonb_build_object('id','hosting-dialogue','question','Stage 2 — Hosting the Visitor: If your grief had a voice, what would it say it needs from you right now? What does it want you to remember?','type','text'),
   jsonb_build_object('id','legacy-gift','question','Stage 3 — Discovering the Legacy Gift: What beautiful quality, lesson, or strength was imprinted on your soul by this person/experience? How will you carry it forward?','type','text'),
   jsonb_build_object('id','ritual-remembrance','question','Stage 4 — Ritual of Remembrance: Design a small ritual (daily/weekly) to honor this love and integrate its legacy. Describe it in detail.','type','text'),
   jsonb_build_object('id','pearl-of-wisdom','question','Transformative Outcome — The Pearl of Wisdom: Write a single sentence that captures the most beautiful lesson this loss leaves you.','type','text')
 ),
 null, null, false, true),

-- 2. The Logotherapy Codex
('4f79057f-b9df-4711-8711-7c67719885fa',
 'The Logotherapy Codex: Forging Meaning in the Chaos',
 'Choose a path to meaning (creation, love, attitude), then author your personal mission.',
 'assessment', 'advanced-therapy', 'expert',
 20,
 jsonb_build_array(
   jsonb_build_object('id','three-paths','question','Stage 1 — The Three Paths: Which path to meaning resonates most right now?','type','multiple-choice','options', to_jsonb(array['A great work (creation)','A great love (connection)','Courage in suffering (attitude)']::text[])),
   jsonb_build_object('id','responsibility-audit','question','Stage 2 — Responsibility Audit: To what person, task, or ideal is life calling for your unique response at this moment?','type','text'),
   jsonb_build_object('id','attitudinal-forge','question','Stage 3 — The Attitudinal Forge: Identify one unavoidable suffering; what attitude will you choose as your “last human freedom”?','type','text'),
   jsonb_build_object('id','legacy-statement','question','Stage 4 — Legacy Statement: Write one powerful sentence that defines the meaning you choose to create with your life.','type','text')
 ),
 null, null, false, true),

-- 3. The Body as a Living Oracle
('70ee1207-4882-4dc7-a525-6b4500651d4f',
 'The Body as a Living Oracle: Translating Symptoms into Soul Stories',
 'Treat chronic sensations as messengers; decode their metaphor and design a somatic release.',
 'assessment', 'advanced-therapy', 'expert',
 20,
 jsonb_build_array(
   jsonb_build_object('id','choose-messenger','question','Stage 1 — Choosing the Messenger: Which recurring sensation will you work with?','type','multiple-choice','options', to_jsonb(array['Shoulder tension','Stomach knots','Lump in throat','Tight chest','Heavy limbs']::text[])),
   jsonb_build_object('id','somatic-dialogue','question','Stage 2 — Somatic Dialogue: If this sensation had a voice, what would it say? What emotion does it hold? What is it protecting you from?','type','text'),
   jsonb_build_object('id','emotional-metaphor','question','Stage 3 — Emotional Metaphor: Which metaphor fits this sensation best?','type','multiple-choice','options', to_jsonb(array['Weight of the world','Brace for impact','Armor against vulnerability','Frozen in place','Firewall against overwhelm']::text[])),
   jsonb_build_object('id','somatic-release','question','Stage 4 — Somatic Release: Design a short (3–5 min) practice (breath, gentle movement, vocal toning) to help the body release the story.','type','text'),
   jsonb_build_object('id','body-chronicle','question','Transformative Outcome — The Body Chronicle: Write a brief journal entry recording this dialogue, metaphor, and your release ritual.','type','text')
 ),
 null, null, false, true),

-- 4. The Time Traveler's Passport
('3a37017b-f7ac-48f5-9ad4-f030387178c5',
 'The Time Traveler''s Passport: Healing Past, Grounding Present, Designing Future',
 'Assess time perspective, reframe the past, anchor presence, and script your future letter.',
 'assessment', 'advanced-therapy', 'expert',
 20,
 jsonb_build_array(
   jsonb_build_object('id','time-diagnostic','question','Stage 1 — Time Zone Diagnostic: What''s your dominant time zone?','type','multiple-choice','options', to_jsonb(array['Past-Negative','Past-Positive','Present-Hedonistic','Present-Fatalistic','Future-Oriented']::text[])),
   jsonb_build_object('id','journey-past','question','Stage 2 — Journey to the Past: Revisit one negative memory as a compassionate observer. Reframe the story and extract its wisdom.','type','text'),
   jsonb_build_object('id','anchor-present','question','Stage 3 — Anchoring in the Present: Describe a sensory 5-4-3-2-1 grounding you can practice today.','type','text'),
   jsonb_build_object('id','script-future','question','Stage 4 — Scripting the Future: Write a detailed letter from your desired future self, describing the steps you took.','type','text'),
   jsonb_build_object('id','passport-artifact','question','Transformative Outcome — Time Traveler''s Passport: Summarize your time profile + reframed past + one next step.','type','text')
 ),
 null, null, false, true),

-- 5. The Money Temple
('72e87332-de94-4b95-9d74-4eba05633f02',
 'The Money Temple: An Archeology of Your Wealth & Worth',
 'Excavate money memories, identify archetypes, uncover vows, and write a new covenant with money.',
 'assessment', 'advanced-therapy', 'expert',
 20,
 jsonb_build_array(
   jsonb_build_object('id','first-artifact','question','Stage 1 — The First Artifact: Describe your first vivid memory of money. What did it teach you?','type','text'),
   jsonb_build_object('id','money-gods','question','Stage 2 — Money Gods: Which archetype most rules your temple?','type','multiple-choice','options', to_jsonb(array['The Worrier','The Spender','The Avoider','The Hoarder','The Visionary']::text[])),
   jsonb_build_object('id','vow-scarcity','question','Stage 3 — Vow of Scarcity/Abundance: What unconscious vow about money did you form in childhood?','type','text'),
   jsonb_build_object('id','new-covenant','question','Stage 4 — The New Covenant: Write your empowered covenant with money—aligned to your values.','type','text')
 ),
 null, null, false, true),

-- 6. The Wabi-Sabi Workshop
('d653fd0f-7539-47ad-9cf4-2ac50930adc4',
 'The Wabi-Sabi Workshop: Finding Liberation in Imperfection',
 'Transform perfectionism through acceptance, beauty in flaws, good-enough drafts, and self-compassion.',
 'assessment', 'advanced-therapy', 'expert',
 20,
 jsonb_build_array(
   jsonb_build_object('id','cost-cage','question','Stage 1 — Cost of the Cage: What has perfectionism given—and stolen—from you? Be brutally honest.','type','text'),
   jsonb_build_object('id','wabi-sabi-hunt','question','Stage 2 — Wabi-Sabi Hunt: Describe three imperfect/asymmetrical/aged things around you and their unique beauty.','type','text'),
   jsonb_build_object('id','good-enough-draft','question','Stage 3 — Gloriously Imperfect Draft: Create a 3-sentence story in 3 minutes. Paste it here—no edits.','type','text'),
   jsonb_build_object('id','self-compassion-script','question','Stage 4 — Self-Compassion Script: Write a kind script for the next time perfectionism flares.','type','text'),
   jsonb_build_object('id','wabi-sabi-manifesto','question','Transformative Outcome — Wabi-Sabi Manifesto: Declare your right to be imperfect, human, and free.','type','text')
 ),
 null, null, false, true),

-- 7. The Creative Spring
('21563e88-a447-4b2b-aa61-4b6075e52d6d',
 'The Creative Spring: Mapping Your Unique Flow State',
 'Discover your creative archetype, map flow conditions, meet the inner critic, and create a ritual.',
 'assessment', 'advanced-therapy', 'expert',
 20,
 jsonb_build_array(
   jsonb_build_object('id','creative-archetype','question','Stage 1 — Creative Archetype: Which best describes you?','type','multiple-choice','options', to_jsonb(array['Wild River (chaotic, powerful)','Structured Garden (orderly, deliberate)','Deep Well (slow, profound)','Playful Fire (spontaneous, joyful)']::text[])),
   jsonb_build_object('id','flow-audit','question','Stage 2 — Flow Audit: Recall a time you were in flow. What exact conditions enabled it (challenge/skill, environment, time)?','type','text'),
   jsonb_build_object('id','inner-critic','question','Stage 3 — Dialogue with Inner Critic: What is it trying to protect? How will you thank and repurpose it?','type','text'),
   jsonb_build_object('id','sacred-ritual','question','Stage 4 — Sacred Ritual: Design a short ritual that signals your brain it''s time to create.','type','text'),
   jsonb_build_object('id','creative-blueprint','question','Transformative Outcome — Creative Flow Blueprint: Summarize your archetype, ideal conditions, and ritual.','type','text')
 ),
 null, null, false, true),

-- 8. The Sovereign''s Domain
('163963f5-3732-47aa-8b8b-3a87e3e4a3f5',
 'The Sovereign''s Domain: The Advanced Art of Energetic Boundaries',
 'Audit energy, identify boundary style, write a Royal Decree, and clear your domain.',
 'assessment', 'advanced-therapy', 'expert',
 20,
 jsonb_build_array(
   jsonb_build_object('id','energetic-audit','question','Stage 1 — Energetic Audit: Who/what reliably drains vs. replenishes you? List specifics.','type','text'),
   jsonb_build_object('id','three-gates','question','Stage 2 — Three Gates: Which boundary style is your default?','type','multiple-choice','options', to_jsonb(array['Porous (over-sharing, enmeshed)','Rigid (walled-off, isolated)','Sovereign (flexible, conscious)']::text[])),
   jsonb_build_object('id','royal-decree','question','Stage 3 — Royal Decree: State a specific energetic boundary you will set. Write it clearly and calmly.','type','text'),
   jsonb_build_object('id','energetic-clearing','question','Stage 4 — Energetic Clearing: Describe a visualization to clear your domain and call power back.','type','text'),
   jsonb_build_object('id','sovereigns-constitution','question','Transformative Outcome — Sovereign''s Constitution: List your core laws for governing your energetic domain.','type','text')
 ),
 null, null, false, true),

-- 9. The Hope Forge
('a6270e77-0a4b-4fad-a71e-1bfc65d80a51',
 'The Hope Forge: Crafting Resilience from Despair',
 'Shift from passive to active hope, reclaim agency, map pathways, and set your hope anchor.',
 'assessment', 'advanced-therapy', 'expert',
 20,
 jsonb_build_array(
   jsonb_build_object('id','hope-diagnostic','question','Stage 1 — Hope Diagnostic: Which describes your stance?','type','multiple-choice','options', to_jsonb(array['Passive Hope (waiting to be rescued)','Active Hope (co-creating a future)']::text[])),
   jsonb_build_object('id','agency-audit','question','Stage 2 — Agency Audit: Identify a difficult situation. What is your smallest circle of influence within it?','type','text'),
   jsonb_build_object('id','pathway-thinking','question','Stage 3 — Pathway Thinking: Brainstorm 3+ potential pathways (even tiny ones) toward your goal.','type','text'),
   jsonb_build_object('id','hope-anchor','question','Stage 4 — Hope Anchor: Choose a mantra, object, or memory that reconnects you to agency and purpose. Describe it.','type','text'),
   jsonb_build_object('id','grounded-hope-compass','question','Transformative Outcome — Grounded Hope Compass: Summarize your agency, pathways, and anchor.','type','text')
 ),
 null, null, false, true),

-- 10. The Legacy Blueprint
('bec21e51-2558-4f3b-abb3-59b99fdd7e06',
 'The Legacy Blueprint: Living a Life Worth Remembering',
 'Hear your eulogy, define legacy pillars, reverse-engineer actions, and choose a memento mori.',
 'assessment', 'advanced-therapy', 'expert',
 20,
 jsonb_build_array(
   jsonb_build_object('id','eulogy-visualization','question','Stage 1 — Eulogy Visualization: What do you want loved ones to say at your funeral? Write what you hear.','type','text'),
   jsonb_build_object('id','legacy-pillars','question','Stage 2 — Legacy Pillars: List 3–4 pillars you want to be remembered for (e.g., Kindness, Courage).','type','text'),
   jsonb_build_object('id','reverse-engineered-actions','question','Stage 3 — Reverse-Engineered Action Plan: For each pillar, name one small action you''ll take this week.','type','text'),
   jsonb_build_object('id','memento-mori','question','Stage 4 — Memento Mori: Choose a daily reminder of mortality that motivates authentic living.','type','multiple-choice','options', to_jsonb(array['Ring/bracelet to touch','Desk note “Memento Mori”','Phone lock-screen','Morning reflection ritual']::text[])),
   jsonb_build_object('id','legacy-blueprint-outcome','question','Transformative Outcome — Legacy Blueprint: Summarize your pillars, this week''s actions, and your reminder.','type','text')
 ),
 null, null, false, true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  type = excluded.type,
  category = excluded.category,
  difficulty_level = excluded.difficulty_level,
  time_limit_minutes = excluded.time_limit_minutes,
  questions = excluded.questions,
  passing_score = excluded.passing_score,
  ai_config_id = excluded.ai_config_id,
  is_public = excluded.is_public,
  is_active = excluded.is_active,
  updated_at = now();

commit;
