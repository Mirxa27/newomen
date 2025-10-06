-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
CREATE TYPE assessment_type AS ENUM ('personality', 'diagnostic', 'narrative');
CREATE TYPE message_sender AS ENUM ('user', 'ai');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE challenge_status AS ENUM ('pending', 'in_progress', 'completed', 'declined');
CREATE TYPE subscription_provider AS ENUM ('paypal');
CREATE TYPE provider_type AS ENUM ('llm', 'tts', 'stt');
CREATE TYPE model_modality AS ENUM ('text', 'audio', 'image');
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE session_status AS ENUM ('active', 'completed', 'error');

-- Main Application Schema
CREATE TABLE "users" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" text UNIQUE NOT NULL,
    "password_hash" text NOT NULL,
    "nickname" text,
    "avatar_url" text,
    "language" text DEFAULT 'en',
    "culture" text,
    "subscription_tier" subscription_tier DEFAULT 'free',
    "remaining_minutes" integer DEFAULT 0,
    "current_level" integer DEFAULT 1,
    "crystal_balance" integer DEFAULT 0,
    "daily_streak" integer DEFAULT 0,
    "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "user_memory_profiles" (
    "user_id" uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    "personality_type" text,
    "balance_wheel_scores" jsonb,
    "narrative_patterns" jsonb,
    "emotional_state_history" jsonb
);

CREATE TABLE "conversations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid REFERENCES users(id) ON DELETE CASCADE,
    "started_at" timestamptz DEFAULT now(),
    "ended_at" timestamptz
);

CREATE TABLE "messages" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversation_id" uuid REFERENCES conversations(id) ON DELETE CASCADE,
    "sender" message_sender NOT NULL,
    "text_content" text,
    "audio_url" text,
    "emotion_data" jsonb,
    "timestamp" timestamptz DEFAULT now()
);

CREATE TABLE "assessments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "type" assessment_type NOT NULL,
    "questions" jsonb NOT NULL
);

CREATE TABLE "assessment_results" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid REFERENCES users(id) ON DELETE CASCADE,
    "assessment_id" uuid REFERENCES assessments(id) ON DELETE CASCADE,
    "answers" jsonb NOT NULL,
    "score" jsonb,
    "created_at" timestamptz DEFAULT now()
);

CREATE TABLE "achievements" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "description" text,
    "badge_url" text,
    "unlock_criteria" jsonb
);

CREATE TABLE "user_achievements" (
    "user_id" uuid REFERENCES users(id) ON DELETE CASCADE,
    "achievement_id" uuid REFERENCES achievements(id) ON DELETE CASCADE,
    "earned_at" timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE "community_connections" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "requester_id" uuid REFERENCES users(id) ON DELETE CASCADE,
    "receiver_id" uuid REFERENCES users(id) ON DELETE CASCADE,
    "status" connection_status DEFAULT 'pending'
);

CREATE TABLE "couples_challenges" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "initiator_id" uuid REFERENCES users(id) ON DELETE CASCADE,
    "partner_id" uuid REFERENCES users(id) ON DELETE CASCADE,
    "status" challenge_status DEFAULT 'pending',
    "question_set" jsonb,
    "responses" jsonb,
    "ai_analysis" text
);

CREATE TABLE "wellness_resources" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "category" text,
    "duration" integer,
    "audio_url" text,
    "description" text
);

CREATE TABLE "subscriptions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" uuid REFERENCES users(id) ON DELETE CASCADE,
    "provider" subscription_provider NOT NULL,
    "provider_id" text,
    "status" text,
    "renewal_date" timestamptz
);

-- Realtime Admin Schema
CREATE TABLE "providers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "type" provider_type NOT NULL,
    "api_base" text,
    "region" text,
    "status" text,
    "last_synced_at" timestamptz
);

CREATE TABLE "models" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "provider_id" uuid REFERENCES providers(id) ON DELETE CASCADE,
    "model_id" text NOT NULL,
    "display_name" text,
    "modality" model_modality,
    "context_limit" integer,
    "latency_hint_ms" integer,
    "is_realtime" boolean DEFAULT false,
    "enabled" boolean DEFAULT true
);

CREATE TABLE "voices" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "provider_id" uuid REFERENCES providers(id) ON DELETE CASCADE,
    "voice_id" text NOT NULL,
    "name" text,
    "locale" text,
    "gender" text,
    "latency_hint_ms" integer,
    "enabled" boolean DEFAULT true
);

CREATE TABLE "prompts" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "hosted_prompt_id" text,
    "version" integer,
    "name" text,
    "json" jsonb,
    "status" text
);

CREATE TABLE "agents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "prompt_id" uuid REFERENCES prompts(id),
    "model_id" uuid REFERENCES models(id),
    "voice_id" uuid REFERENCES voices(id),
    "vad_json" jsonb,
    "tool_policy_json" jsonb,
    "status" agent_status DEFAULT 'active'
);

CREATE TABLE "sessions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "agent_id" uuid REFERENCES agents(id),
    "user_id" uuid REFERENCES users(id),
    "realtime_session_id" text,
    "start_ts" timestamptz DEFAULT now(),
    "end_ts" timestamptz,
    "status" session_status DEFAULT 'active'
);

CREATE TABLE "session_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id" uuid REFERENCES sessions(id) ON DELETE CASCADE,
    "type" text,
    "payload_json" jsonb,
    "ts" timestamptz DEFAULT now()
);