

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."agent_status" AS ENUM (
    'active',
    'inactive',
    'archived'
);


ALTER TYPE "public"."agent_status" OWNER TO "postgres";


CREATE TYPE "public"."ai_provider_type" AS ENUM (
    'openai',
    'anthropic',
    'google',
    'azure',
    'custom',
    'elevenlabs',
    'cartesia',
    'deepgram',
    'hume'
);


ALTER TYPE "public"."ai_provider_type" OWNER TO "postgres";


CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'moderator',
    'user'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."assessment_type" AS ENUM (
    'personality',
    'diagnostic',
    'narrative'
);


ALTER TYPE "public"."assessment_type" OWNER TO "postgres";


CREATE TYPE "public"."challenge_status" AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'declined'
);


ALTER TYPE "public"."challenge_status" OWNER TO "postgres";


CREATE TYPE "public"."connection_status" AS ENUM (
    'pending',
    'accepted',
    'declined'
);


ALTER TYPE "public"."connection_status" OWNER TO "postgres";


CREATE TYPE "public"."message_sender" AS ENUM (
    'user',
    'ai'
);


ALTER TYPE "public"."message_sender" OWNER TO "postgres";


CREATE TYPE "public"."model_modality" AS ENUM (
    'text',
    'audio',
    'image'
);


ALTER TYPE "public"."model_modality" OWNER TO "postgres";


CREATE TYPE "public"."provider_type" AS ENUM (
    'llm',
    'tts',
    'stt'
);


ALTER TYPE "public"."provider_type" OWNER TO "postgres";


CREATE TYPE "public"."session_status" AS ENUM (
    'active',
    'completed',
    'error'
);


ALTER TYPE "public"."session_status" OWNER TO "postgres";


CREATE TYPE "public"."subscription_provider" AS ENUM (
    'paypal'
);


ALTER TYPE "public"."subscription_provider" OWNER TO "postgres";


CREATE TYPE "public"."subscription_tier" AS ENUM (
    'free',
    'premium'
);


ALTER TYPE "public"."subscription_tier" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_create_admin_policy_if_table_exists"("tbl" "regclass", "polname" "text", "for_ops" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF to_regclass(tbl::text) IS NOT NULL THEN
    EXECUTE format('CREATE POLICY %I ON %s FOR %s TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''));', polname, tbl::text, for_ops);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;


ALTER FUNCTION "public"."_create_admin_policy_if_table_exists"("tbl" "regclass", "polname" "text", "for_ops" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ai_content_builder"("p_content_type" "text", "p_topic" "text", "p_style" "text" DEFAULT 'professional'::"text", "p_length" "text" DEFAULT 'medium'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
BEGIN
  -- Simulate AI content generation
  result := jsonb_build_object(
    'content', 'Generated content for ' || p_content_type || ' about ' || p_topic,
    'style', p_style,
    'length', p_length,
    'generated_at', now()
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."ai_content_builder"("p_content_type" "text", "p_topic" "text", "p_style" "text", "p_length" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_crystals"("p_user_id" "uuid", "p_amount" integer, "p_source" "text", "p_description" "text" DEFAULT NULL::"text", "p_related_entity_id" "uuid" DEFAULT NULL::"uuid", "p_related_entity_type" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_balance INTEGER;
  new_level INTEGER;
BEGIN
  -- Get current crystal balance
  SELECT crystal_balance INTO current_balance
  FROM public.user_profiles
  WHERE user_id = p_user_id;
  
  -- Update crystal balance
  UPDATE public.user_profiles
  SET crystal_balance = crystal_balance + p_amount
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO public.crystal_transactions (
    user_id, amount, type, source, description, related_entity_id, related_entity_type
  ) VALUES (
    p_user_id, p_amount, 'earned', p_source, p_description, p_related_entity_id, p_related_entity_type
  );
  
  -- Check for level up
  new_level := (
    SELECT COALESCE(MAX(level), 1)
    FROM public.level_thresholds
    WHERE crystals_required <= (current_balance + p_amount)
  );
  
  -- Update user level if they've leveled up
  UPDATE public.user_profiles
  SET current_level = new_level
  WHERE user_id = p_user_id AND current_level < new_level;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."award_crystals"("p_user_id" "uuid", "p_amount" integer, "p_source" "text", "p_description" "text", "p_related_entity_id" "uuid", "p_related_entity_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_achievements"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  achievement_record RECORD;
  should_award BOOLEAN;
BEGIN
  FOR achievement_record IN 
    SELECT * FROM public.achievements 
    WHERE is_active = true 
    AND id NOT IN (
      SELECT achievement_id FROM public.user_achievements 
      WHERE user_id = p_user_id
    )
  LOOP
    should_award := false;
    
    -- Check different achievement types
    CASE achievement_record.unlock_criteria->>'type'
      WHEN 'assessment_completion' THEN
        should_award := (
          SELECT COUNT(DISTINCT assessment_id) >= (achievement_record.unlock_criteria->>'count')::INTEGER
          FROM public.assessment_results
          WHERE user_id = p_user_id
        );
      
      WHEN 'conversation_completion' THEN
        should_award := (
          SELECT COUNT(*) >= (achievement_record.unlock_criteria->>'count')::INTEGER
          FROM public.conversations
          WHERE user_id = p_user_id AND status = 'ended'
        );
      
      WHEN 'daily_streak' THEN
        should_award := (
          SELECT daily_streak >= (achievement_record.unlock_criteria->>'count')::INTEGER
          FROM public.user_profiles
          WHERE user_id = p_user_id
        );
      
      WHEN 'crystal_balance' THEN
        should_award := (
          SELECT crystal_balance >= (achievement_record.unlock_criteria->>'amount')::INTEGER
          FROM public.user_profiles
          WHERE user_id = p_user_id
        );
      
      WHEN 'level' THEN
        should_award := (
          SELECT current_level >= (achievement_record.unlock_criteria->>'level')::INTEGER
          FROM public.user_profiles
          WHERE user_id = p_user_id
        );
    END CASE;
    
    -- Award achievement if criteria met
    IF should_award THEN
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (p_user_id, achievement_record.id);
      
      -- Award crystal reward
      PERFORM public.award_crystals(
        p_user_id, 
        achievement_record.crystal_reward, 
        'achievement', 
        'Achievement unlocked: ' || achievement_record.title,
        achievement_record.id,
        'achievement'
      );
    END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."check_achievements"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_ai_rate_limit"("p_user_id" "uuid", "p_provider_name" "text", "p_max_requests" integer DEFAULT 100, "p_window_minutes" integer DEFAULT 60) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  window_start := NOW() - INTERVAL '1 minute' * p_window_minutes;
  
  SELECT COALESCE(SUM(requests_count), 0) INTO current_count
  FROM public.ai_rate_limits
  WHERE user_id = p_user_id 
    AND provider_name = p_provider_name
    AND window_start >= window_start;
  
  RETURN current_count < p_max_requests;
END;
$$;


ALTER FUNCTION "public"."check_ai_rate_limit"("p_user_id" "uuid", "p_provider_name" "text", "p_max_requests" integer, "p_window_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_challenge_link"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  link_text TEXT;
  link_exists BOOLEAN;
BEGIN
  LOOP
    link_text := 'challenge_' || encode(gen_random_bytes(8), 'hex');
    SELECT EXISTS(SELECT 1 FROM public.couples_challenges WHERE unique_link = link_text) INTO link_exists;
    IF NOT link_exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN link_text;
END;
$$;


ALTER FUNCTION "public"."generate_challenge_link"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ai_config_for_service"("service_type_param" "text", "service_id_param" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("config_id" "uuid", "config_name" "text", "provider" "text", "model_name" "text", "api_base_url" "text", "api_version" "text", "temperature" numeric, "max_tokens" integer, "top_p" numeric, "frequency_penalty" numeric, "presence_penalty" numeric, "system_prompt" "text", "user_prompt_template" "text", "custom_headers" "jsonb", "is_default" boolean, "provider_name" "text", "cost_per_1k_input_tokens" numeric, "cost_per_1k_output_tokens" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.id,
    ac.name,
    ac.provider,
    ac.model_name,
    ac.api_base_url,
    ac.api_version,
    COALESCE(sc.temperature_override, ac.temperature),
    COALESCE(sc.max_tokens_override, ac.max_tokens),
    ac.top_p,
    ac.frequency_penalty,
    ac.presence_penalty,
    COALESCE(sc.system_prompt_override, ac.system_prompt),
    COALESCE(sc.user_prompt_template_override, ac.user_prompt_template),
    ac.custom_headers,
    ac.is_default,
    ac.provider_name,
    ac.cost_per_1k_input_tokens,
    ac.cost_per_1k_output_tokens
  FROM ai_service_configs sc
  JOIN ai_configurations ac ON ac.id = sc.ai_configuration_id
  WHERE sc.service_type = service_type_param
    AND (service_id_param IS NULL OR sc.service_id = service_id_param)
    AND sc.is_active = true
    AND ac.is_active = true
  ORDER BY
    sc.priority DESC,
    sc.is_fallback ASC
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_ai_config_for_service"("service_type_param" "text", "service_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_newme_user_context"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  context JSONB;
BEGIN
  SELECT jsonb_build_object(
    'nickname', (SELECT memory_value FROM newme_user_memories
                 WHERE user_id = p_user_id
                 AND memory_type = 'personal_detail'
                 AND memory_key = 'nickname'
                 AND is_active = true
                 LIMIT 1),
    'last_conversation_date', (SELECT started_at FROM newme_conversations
                                WHERE user_id = p_user_id
                                ORDER BY started_at DESC
                                LIMIT 1 OFFSET 1),
    'last_conversation_topic', (SELECT summary FROM newme_conversations
                                 WHERE user_id = p_user_id
                                 ORDER BY started_at DESC
                                 LIMIT 1 OFFSET 1),
    'completed_assessments', (SELECT COALESCE(array_agg(assessment_name), ARRAY[]::TEXT[])
                              FROM newme_assessment_tracking
                              WHERE user_id = p_user_id
                              AND completion_status = 'completed'),
    'emotional_patterns', (SELECT COALESCE(array_agg(memory_value), ARRAY[]::TEXT[])
                           FROM newme_user_memories
                           WHERE user_id = p_user_id
                           AND memory_type = 'emotional_pattern'
                           AND is_active = true
                           ORDER BY importance_score DESC
                           LIMIT 5),
    'important_memories', (SELECT COALESCE(jsonb_agg(
                            jsonb_build_object(
                              'type', memory_type,
                              'key', memory_key,
                              'value', memory_value,
                              'context', context
                            )
                          ), '[]'::jsonb)
                          FROM newme_user_memories
                          WHERE user_id = p_user_id
                          AND is_active = true
                          ORDER BY importance_score DESC
                          LIMIT 10)
  ) INTO context;

  RETURN context;
END;
$$;


ALTER FUNCTION "public"."get_newme_user_context"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_provider_api_key"("p_provider_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_api_key text;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  SELECT api_key
    INTO v_api_key
    FROM public.provider_api_keys
    WHERE provider_id = p_provider_id;

  RETURN v_api_key;
END;
$$;


ALTER FUNCTION "public"."get_provider_api_key"("p_provider_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_announcements_count"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_user_id UUID;
    unread_count INTEGER;
BEGIN
    -- Get current user ID
    current_user_id := (SELECT id FROM user_profiles WHERE id = auth.uid());

    IF current_user_id IS NULL THEN
        RETURN 0;
    END IF;

    -- Count unread announcements
    SELECT COUNT(*) INTO unread_count
    FROM community_announcements a
    WHERE a.is_active = true
    AND NOT EXISTS (
        SELECT 1 FROM community_announcement_reads r
        WHERE r.announcement_id = a.id AND r.user_id = current_user_id
    );

    RETURN unread_count;
END;
$$;


ALTER FUNCTION "public"."get_unread_announcements_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Insert user profile with default role
    INSERT INTO public.user_profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'MODERATOR')
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_ai_rate_limit"("p_user_id" "uuid", "p_provider_name" "text", "p_max_requests" integer DEFAULT 100, "p_window_minutes" integer DEFAULT 60) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  current_window TIMESTAMPTZ;
BEGIN
  current_window := date_trunc('minute', NOW());
  
  INSERT INTO public.ai_rate_limits (user_id, provider_name, requests_count, window_start, max_requests, window_duration_minutes)
  VALUES (p_user_id, p_provider_name, 1, current_window, p_max_requests, p_window_minutes)
  ON CONFLICT (user_id, provider_name, window_start)
  DO UPDATE SET 
    requests_count = ai_rate_limits.requests_count + 1,
    updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."increment_ai_rate_limit"("p_user_id" "uuid", "p_provider_name" "text", "p_max_requests" integer, "p_window_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_message_count"("conv_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE newme_conversations
  SET message_count = message_count + 1
  WHERE id = conv_id;
END;
$$;


ALTER FUNCTION "public"."increment_message_count"("conv_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COALESCE(
    (
      SELECT TRUE
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role = 'admin'
      LIMIT 1
    ), FALSE
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_announcement_read"("p_announcement_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user ID
    current_user_id := (SELECT id FROM user_profiles WHERE id = auth.uid());

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;

    -- Insert or update read status
    INSERT INTO community_announcement_reads (announcement_id, user_id)
    VALUES (p_announcement_id, current_user_id)
    ON CONFLICT (announcement_id, user_id) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."mark_announcement_read"("p_announcement_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."paypal_capture_order"("p_order_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'order_id', p_order_id,
    'status', 'captured',
    'captured_at', now()
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."paypal_capture_order"("p_order_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."paypal_create_order"("p_amount" numeric, "p_currency" "text" DEFAULT 'USD'::"text", "p_description" "text" DEFAULT 'Newomen Subscription'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  order_id TEXT;
  result JSONB;
BEGIN
  -- Generate a mock order ID
  order_id := 'ORDER_' || extract(epoch from now())::text;
  
  result := jsonb_build_object(
    'order_id', order_id,
    'status', 'created',
    'amount', p_amount,
    'currency', p_currency,
    'description', p_description,
    'created_at', now()
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."paypal_create_order"("p_amount" numeric, "p_currency" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."promote_user_to_admin"("p_email" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  SELECT id
    INTO v_profile_id
    FROM public.user_profiles
    WHERE lower(email) = lower(p_email)
    LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  UPDATE public.user_profiles
  SET role = 'admin'
  WHERE id = v_profile_id;
END;
$$;


ALTER FUNCTION "public"."promote_user_to_admin"("p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."provider_discovery"("p_service_type" "text" DEFAULT 'ai'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'providers', jsonb_build_array(
      jsonb_build_object(
        'id', 'openai',
        'name', 'OpenAI',
        'type', 'ai',
        'status', 'active'
      ),
      jsonb_build_object(
        'id', 'anthropic',
        'name', 'Anthropic',
        'type', 'ai',
        'status', 'active'
      )
    ),
    'discovered_at', now()
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."provider_discovery"("p_service_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."realtime_token"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
BEGIN
  result := jsonb_build_object(
    'token', 'realtime_token_' || p_user_id::text,
    'user_id', p_user_id,
    'expires_at', now() + interval '1 hour'
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."realtime_token"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_created_by_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id
    INTO v_profile_id
    FROM public.user_profiles
    WHERE user_id = auth.uid()
    LIMIT 1;

  IF FOUND THEN
    NEW.created_by = v_profile_id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_created_by_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."store_provider_api_key"("p_provider_id" "uuid", "p_api_key" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'insufficient_privileges';
  END IF;

  INSERT INTO public.provider_api_keys(provider_id, api_key)
  VALUES (p_provider_id, p_api_key)
  ON CONFLICT (provider_id)
  DO UPDATE
  SET api_key = EXCLUDED.api_key,
      updated_at = now();
END;
$$;


ALTER FUNCTION "public"."store_provider_api_key"("p_provider_id" "uuid", "p_api_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ai_configurations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_ai_configurations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_api_configurations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_api_configurations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_newme_conversations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_newme_conversations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_newme_user_memories_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  NEW.last_referenced_at = CURRENT_TIMESTAMP;
  NEW.reference_count = NEW.reference_count + 1;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_newme_user_memories_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_subscription_minutes"("p_user_id" "uuid", "p_minutes_used" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.subscriptions
  SET minutes_used = minutes_used + p_minutes_used
  WHERE user_id = p_user_id AND status = 'active';
  
  -- Update user profile remaining minutes
  UPDATE public.user_profiles
  SET remaining_minutes = GREATEST(0, remaining_minutes - p_minutes_used)
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."update_subscription_minutes"("p_user_id" "uuid", "p_minutes_used" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "badge_url" "text",
    "unlock_criteria" "jsonb" NOT NULL,
    "crystal_reward" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "category" "text",
    "is_hidden" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."affirmations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "category" "text" DEFAULT 'self-love'::"text" NOT NULL,
    "tone" "text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."affirmations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "prompt_id" "uuid",
    "model_id" "uuid",
    "voice_id" "uuid",
    "vad_config" "jsonb",
    "tool_policy" "jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_assessment_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "ai_provider" "text" NOT NULL,
    "ai_model" "text" NOT NULL,
    "temperature" numeric(3,2) DEFAULT 0.7,
    "max_tokens" integer DEFAULT 1000,
    "system_prompt" "text",
    "user_prompt_template" "text",
    "evaluation_criteria" "jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_assessment_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_behaviors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "personality_traits" "jsonb",
    "communication_style" "text",
    "response_length" "text",
    "emotional_tone" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_behaviors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "is_default" boolean DEFAULT false,
    "provider" "text" DEFAULT 'openai'::"text" NOT NULL,
    "provider_name" "text",
    "model_name" "text" NOT NULL,
    "api_base_url" "text",
    "api_key_encrypted" "text",
    "api_version" "text",
    "temperature" numeric(3,2) DEFAULT 0.7,
    "max_tokens" integer DEFAULT 2000,
    "top_p" numeric(3,2) DEFAULT 1.0,
    "frequency_penalty" numeric(3,2) DEFAULT 0.0,
    "presence_penalty" numeric(3,2) DEFAULT 0.0,
    "stop_sequences" "text"[],
    "custom_headers" "jsonb" DEFAULT '{}'::"jsonb",
    "cost_per_1k_prompt_tokens" numeric(10,6),
    "cost_per_1k_completion_tokens" numeric(10,6),
    "max_requests_per_minute" integer DEFAULT 60,
    "max_tokens_per_minute" integer DEFAULT 90000,
    "system_prompt" "text",
    "user_prompt_template" "text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "last_tested_at" timestamp with time zone,
    "test_status" "text",
    CONSTRAINT "ai_configurations_frequency_penalty_check" CHECK ((("frequency_penalty" >= ('-2'::integer)::numeric) AND ("frequency_penalty" <= (2)::numeric))),
    CONSTRAINT "ai_configurations_max_tokens_check" CHECK (("max_tokens" > 0)),
    CONSTRAINT "ai_configurations_presence_penalty_check" CHECK ((("presence_penalty" >= ('-2'::integer)::numeric) AND ("presence_penalty" <= (2)::numeric))),
    CONSTRAINT "ai_configurations_provider_check" CHECK (("provider" = ANY (ARRAY['openai'::"text", 'anthropic'::"text", 'google'::"text", 'azure'::"text", 'custom'::"text", 'elevenlabs'::"text", 'cartesia'::"text", 'deepgram'::"text", 'hume'::"text"]))),
    CONSTRAINT "ai_configurations_temperature_check" CHECK ((("temperature" >= (0)::numeric) AND ("temperature" <= (2)::numeric))),
    CONSTRAINT "ai_configurations_test_status_check" CHECK (("test_status" = ANY (ARRAY['success'::"text", 'failed'::"text", 'pending'::"text", NULL::"text"]))),
    CONSTRAINT "ai_configurations_top_p_check" CHECK ((("top_p" >= (0)::numeric) AND ("top_p" <= (1)::numeric)))
);


ALTER TABLE "public"."ai_configurations" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_configurations" IS 'Stores AI provider configurations for various models and services';



COMMENT ON COLUMN "public"."ai_configurations"."provider" IS 'AI provider: openai, anthropic, google, azure, custom (OpenAI-compatible)';



COMMENT ON COLUMN "public"."ai_configurations"."api_base_url" IS 'Custom API endpoint for OpenAI-compatible providers (e.g., Azure OpenAI)';



COMMENT ON COLUMN "public"."ai_configurations"."custom_headers" IS 'Custom HTTP headers for API requests (JSON object)';



CREATE TABLE IF NOT EXISTS "public"."ai_model_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid",
    "model_id" "uuid",
    "use_case_id" "uuid",
    "behavior_id" "uuid",
    "is_primary" boolean DEFAULT false,
    "priority" integer DEFAULT 1,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_model_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_processing_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "attempt_id" "uuid",
    "processing_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "priority" integer DEFAULT 1,
    "retry_count" integer DEFAULT 0,
    "max_retries" integer DEFAULT 3,
    "error_message" "text",
    "processing_started_at" timestamp with time zone,
    "processing_completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_processing_queue_processing_type_check" CHECK (("processing_type" = ANY (ARRAY['assessment'::"text", 'quiz'::"text", 'challenge'::"text"]))),
    CONSTRAINT "ai_processing_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'retry'::"text"])))
);


ALTER TABLE "public"."ai_processing_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_rate_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "provider_name" "text" NOT NULL,
    "requests_count" integer DEFAULT 0,
    "window_start" timestamp with time zone DEFAULT "now"(),
    "window_duration_minutes" integer DEFAULT 60,
    "max_requests" integer DEFAULT 100,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_service_configs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_type" "text" NOT NULL,
    "service_id" "uuid",
    "service_name" "text",
    "ai_configuration_id" "uuid",
    "priority" integer DEFAULT 1,
    "is_fallback" boolean DEFAULT false,
    "system_prompt_override" "text",
    "user_prompt_template_override" "text",
    "temperature_override" numeric(3,2),
    "max_tokens_override" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ai_service_configs_service_type_check" CHECK (("service_type" = ANY (ARRAY['assessment_generation'::"text", 'assessment_scoring'::"text", 'assessment_feedback'::"text", 'quiz_generation'::"text", 'quiz_scoring'::"text", 'challenge_generation'::"text", 'challenge_feedback'::"text", 'voice_conversation'::"text", 'content_moderation'::"text", 'text_analysis'::"text", 'summarization'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."ai_service_configs" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_service_configs" IS 'Maps AI configurations to specific services with optional overrides';



COMMENT ON COLUMN "public"."ai_service_configs"."service_type" IS 'Type of service using this configuration';



COMMENT ON COLUMN "public"."ai_service_configs"."priority" IS 'Higher priority configurations are used first';



CREATE TABLE IF NOT EXISTS "public"."ai_usage_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "assessment_id" "uuid",
    "attempt_id" "uuid",
    "ai_config_id" "uuid",
    "provider_name" "text" NOT NULL,
    "model_name" "text" NOT NULL,
    "tokens_used" integer,
    "cost_usd" numeric(10,6),
    "processing_time_ms" integer,
    "success" boolean NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_use_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_use_cases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service" character varying(50) NOT NULL,
    "client_id" "text" NOT NULL,
    "client_secret" "text" NOT NULL,
    "mode" character varying(20) DEFAULT 'sandbox'::character varying,
    "is_active" boolean DEFAULT false,
    "test_status" character varying(20),
    "last_tested" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."api_configurations" OWNER TO "postgres";


COMMENT ON TABLE "public"."api_configurations" IS 'Stores third-party API configurations for services like PayPal, OpenAI, etc.';



COMMENT ON COLUMN "public"."api_configurations"."service" IS 'Name of the service (paypal, openai, stripe, etc.)';



COMMENT ON COLUMN "public"."api_configurations"."client_id" IS 'API client ID or public key (encrypted)';



COMMENT ON COLUMN "public"."api_configurations"."client_secret" IS 'API secret key (encrypted)';



COMMENT ON COLUMN "public"."api_configurations"."mode" IS 'Environment mode (sandbox, live, production)';



COMMENT ON COLUMN "public"."api_configurations"."is_active" IS 'Whether this integration is currently active';



COMMENT ON COLUMN "public"."api_configurations"."test_status" IS 'Result of the last connection test (success, failed)';



COMMENT ON COLUMN "public"."api_configurations"."last_tested" IS 'Timestamp of the last successful test';



CREATE TABLE IF NOT EXISTS "public"."api_integrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service" "text" NOT NULL,
    "client_id" "text",
    "client_secret" "text",
    "mode" "text" DEFAULT 'sandbox'::"text",
    "is_active" boolean DEFAULT false,
    "last_tested" timestamp with time zone,
    "test_status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "api_integrations_test_status_check" CHECK (("test_status" = ANY (ARRAY['success'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."api_integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid",
    "user_id" "uuid",
    "attempt_number" integer NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "time_spent_minutes" integer,
    "status" "text" DEFAULT 'in_progress'::"text",
    "raw_responses" "jsonb" NOT NULL,
    "ai_analysis" "jsonb",
    "ai_score" numeric(5,2),
    "ai_feedback" "text",
    "ai_explanation" "text",
    "is_ai_processed" boolean DEFAULT false,
    "ai_processing_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "assessment_attempts_status_check" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text", 'abandoned'::"text", 'timeout'::"text"])))
);


ALTER TABLE "public"."assessment_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "color" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assessment_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "assessment_id" "uuid",
    "answers" "jsonb" NOT NULL,
    "score" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "outcome" "text",
    "completed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."assessment_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "questions" "jsonb" NOT NULL,
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "category" "text",
    "duration" "text",
    "scoring_logic" "jsonb",
    "outcome_descriptions" "jsonb",
    "status" "text" DEFAULT 'active'::"text",
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assessment_type" "text",
    CONSTRAINT "assessments_assessment_type_check" CHECK (("type" = ANY (ARRAY['personality'::"text", 'diagnostic'::"text", 'narrative'::"text", 'custom'::"text"]))),
    CONSTRAINT "assessments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'draft'::"text"])))
);


ALTER TABLE "public"."assessments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."assessments"."assessment_type" IS 'Type of assessment (e.g. personality, relationship, etc.)';



CREATE TABLE IF NOT EXISTS "public"."assessments_enhanced" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "category" "text" NOT NULL,
    "difficulty_level" "text" DEFAULT 'medium'::"text",
    "time_limit_minutes" integer,
    "max_attempts" integer DEFAULT 3,
    "is_public" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "ai_config_id" "uuid",
    "questions" "jsonb" NOT NULL,
    "scoring_rubric" "jsonb",
    "passing_score" numeric(5,2) DEFAULT 70.0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "assessments_enhanced_difficulty_level_check" CHECK (("difficulty_level" = ANY (ARRAY['easy'::"text", 'medium'::"text", 'hard'::"text", 'expert'::"text"]))),
    CONSTRAINT "assessments_enhanced_type_check" CHECK (("type" = ANY (ARRAY['assessment'::"text", 'quiz'::"text", 'challenge'::"text"])))
);


ALTER TABLE "public"."assessments_enhanced" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenge_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid",
    "user_id" "uuid",
    "partner_id" "uuid",
    "status" "text" DEFAULT 'invited'::"text",
    "joined_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "challenge_participants_status_check" CHECK (("status" = ANY (ARRAY['invited'::"text", 'accepted'::"text", 'declined'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."challenge_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenge_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" DEFAULT 'connection'::"text" NOT NULL,
    "questions" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."challenge_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenge_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "ai_config_id" "uuid",
    "template_data" "jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."challenge_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_announcement_reads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "announcement_id" "uuid",
    "user_id" "uuid",
    "read_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."community_announcement_reads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "announcement_type" "text" NOT NULL,
    "priority" "text" DEFAULT 'normal'::"text",
    "target_audience" "text" DEFAULT 'all'::"text",
    "is_active" boolean DEFAULT true,
    "scheduled_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "community_announcements_announcement_type_check" CHECK (("announcement_type" = ANY (ARRAY['general'::"text", 'challenge'::"text", 'assessment'::"text", 'quiz'::"text", 'maintenance'::"text", 'feature'::"text"]))),
    CONSTRAINT "community_announcements_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "community_announcements_target_audience_check" CHECK (("target_audience" = ANY (ARRAY['all'::"text", 'discovery'::"text", 'growth'::"text", 'transformation'::"text", 'premium'::"text"])))
);


ALTER TABLE "public"."community_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_assessment_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "special_instructions" "text",
    "reward_crystals" integer DEFAULT 0,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."community_assessment_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_challenge_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid",
    "challenge_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "instructions" "text",
    "reward_crystals" integer DEFAULT 0,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "community_challenge_announcements_challenge_type_check" CHECK (("challenge_type" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text", 'special'::"text"])))
);


ALTER TABLE "public"."community_challenge_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid",
    "user_id" "uuid",
    "message" "text" NOT NULL,
    "message_type" "text" DEFAULT 'text'::"text",
    "metadata" "jsonb",
    "is_edited" boolean DEFAULT false,
    "edited_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "community_chat_messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'file'::"text", 'announcement'::"text", 'challenge'::"text", 'assessment'::"text", 'quiz'::"text"])))
);


ALTER TABLE "public"."community_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_chat_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "room_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "community_chat_rooms_room_type_check" CHECK (("room_type" = ANY (ARRAY['general'::"text", 'support'::"text", 'announcements'::"text", 'challenges'::"text", 'assessments'::"text", 'quizzes'::"text"])))
);


ALTER TABLE "public"."community_chat_rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_id" "uuid",
    "receiver_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "message" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "community_connections_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."community_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_quiz_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quiz_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "questions" "jsonb",
    "correct_answers" "jsonb",
    "reward_crystals" integer DEFAULT 0,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."community_quiz_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "conversations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'ended'::"text", 'paused'::"text"])))
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."couples_challenge_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid",
    "user_id" "uuid",
    "question_index" integer NOT NULL,
    "response" "text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."couples_challenge_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."couples_challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "initiator_id" "uuid",
    "partner_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "question_set" "jsonb" NOT NULL,
    "initiator_responses" "jsonb",
    "partner_responses" "jsonb",
    "ai_analysis" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "unique_link" "text",
    "responses" "jsonb",
    "compatibility_score" integer,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."couples_challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crystal_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" integer NOT NULL,
    "type" "text" NOT NULL,
    "source" "text" NOT NULL,
    "description" "text",
    "related_entity_id" "uuid",
    "related_entity_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crystal_transactions_type_check" CHECK (("type" = ANY (ARRAY['earned'::"text", 'spent'::"text", 'bonus'::"text", 'penalty'::"text"])))
);


ALTER TABLE "public"."crystal_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gamification_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" DEFAULT 'default'::"text" NOT NULL,
    "crystal_reward_session" integer DEFAULT 10 NOT NULL,
    "crystal_reward_assessment" integer DEFAULT 25 NOT NULL,
    "crystal_reward_challenge" integer DEFAULT 50 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."gamification_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."level_thresholds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "level" integer NOT NULL,
    "crystals_required" integer NOT NULL,
    "title" "text",
    "description" "text",
    "rewards" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."level_thresholds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "sender" "text" NOT NULL,
    "text_content" "text",
    "audio_url" "text",
    "emotion_data" "jsonb",
    "ts" timestamp with time zone DEFAULT "now"(),
    "conversation_id" "uuid",
    CONSTRAINT "messages_sender_check" CHECK (("sender" = ANY (ARRAY['user'::"text", 'ai'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid",
    "model_id" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "modality" "text",
    "context_limit" integer,
    "latency_hint_ms" integer,
    "is_realtime" boolean DEFAULT false,
    "enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."newme_assessment_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "assessment_name" "text" NOT NULL,
    "suggested_in_conversation_id" "uuid",
    "suggested_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "completion_status" "text",
    "key_insights" "text"[],
    "follow_up_discussed" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "newme_assessment_tracking_completion_status_check" CHECK (("completion_status" = ANY (ARRAY['suggested'::"text", 'started'::"text", 'completed'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "public"."newme_assessment_tracking" OWNER TO "postgres";


COMMENT ON TABLE "public"."newme_assessment_tracking" IS 'Links NewMe assessment suggestions to completion and follow-up';



CREATE TABLE IF NOT EXISTS "public"."newme_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "duration_seconds" integer,
    "message_count" integer DEFAULT 0,
    "topics_discussed" "text"[],
    "emotional_tone" "text",
    "suggested_assessments" "text"[],
    "key_insights" "text"[],
    "summary" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."newme_conversations" OWNER TO "postgres";


COMMENT ON TABLE "public"."newme_conversations" IS 'Stores NewMe voice conversation sessions with metadata and insights';



CREATE TABLE IF NOT EXISTS "public"."newme_emotional_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "conversation_id" "uuid",
    "snapshot_date" timestamp with time zone DEFAULT "now"(),
    "primary_emotion" "text" NOT NULL,
    "emotion_intensity" numeric(3,2),
    "triggers" "text"[],
    "coping_strategies" "text"[],
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "newme_emotional_snapshots_emotion_intensity_check" CHECK ((("emotion_intensity" >= (0)::numeric) AND ("emotion_intensity" <= (1)::numeric)))
);


ALTER TABLE "public"."newme_emotional_snapshots" OWNER TO "postgres";


COMMENT ON TABLE "public"."newme_emotional_snapshots" IS 'Tracks user emotional journey over time';



COMMENT ON COLUMN "public"."newme_emotional_snapshots"."emotion_intensity" IS 'Scale of 0.00 to 1.00, where 1.00 is highest intensity';



CREATE TABLE IF NOT EXISTS "public"."newme_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "audio_duration_ms" integer,
    "sentiment_score" numeric(3,2),
    "emotion_detected" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "newme_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."newme_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."newme_messages" IS 'Individual messages within NewMe conversations';



CREATE TABLE IF NOT EXISTS "public"."newme_user_memories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "memory_type" "text" NOT NULL,
    "memory_key" "text" NOT NULL,
    "memory_value" "text" NOT NULL,
    "context" "text",
    "importance_score" integer DEFAULT 5,
    "first_mentioned_at" timestamp with time zone DEFAULT "now"(),
    "last_referenced_at" timestamp with time zone DEFAULT "now"(),
    "reference_count" integer DEFAULT 1,
    "source_conversation_id" "uuid",
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "newme_user_memories_importance_score_check" CHECK ((("importance_score" >= 1) AND ("importance_score" <= 10))),
    CONSTRAINT "newme_user_memories_memory_type_check" CHECK (("memory_type" = ANY (ARRAY['personal_detail'::"text", 'life_event'::"text", 'relationship'::"text", 'work_context'::"text", 'emotional_pattern'::"text", 'assessment_insight'::"text", 'goal'::"text", 'preference'::"text", 'achievement'::"text", 'challenge'::"text"])))
);


ALTER TABLE "public"."newme_user_memories" OWNER TO "postgres";


COMMENT ON TABLE "public"."newme_user_memories" IS 'Persistent user-specific memories that NewMe maintains across conversations';



COMMENT ON COLUMN "public"."newme_user_memories"."importance_score" IS 'Scale of 1-10, where 10 is most important for NewMe to remember';



COMMENT ON COLUMN "public"."newme_user_memories"."reference_count" IS 'How many times this memory has been referenced in conversations';



CREATE TABLE IF NOT EXISTS "public"."prompt_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "use_case_id" "uuid",
    "provider_id" "uuid",
    "name" "text" NOT NULL,
    "system_prompt" "text" NOT NULL,
    "user_prompt_template" "text",
    "variables" "jsonb",
    "temperature" numeric(3,2) DEFAULT 0.7,
    "max_tokens" integer DEFAULT 1000,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."prompt_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hosted_prompt_id" "text",
    "version" integer DEFAULT 1,
    "name" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_api_keys" (
    "provider_id" "uuid" NOT NULL,
    "api_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."provider_api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_credentials" (
    "provider_id" "uuid" NOT NULL,
    "encrypted_api_key" "bytea" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."provider_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "api_base" "text",
    "region" "text",
    "status" "text" DEFAULT 'active'::"text",
    "last_synced_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "api_key_encrypted" "text",
    "openai_compatible" boolean DEFAULT false,
    "max_tokens" integer DEFAULT 4096,
    "temperature" numeric(3,2) DEFAULT 0.7,
    "top_p" numeric(3,2) DEFAULT 1.0,
    "frequency_penalty" numeric(3,2) DEFAULT 0.0,
    "presence_penalty" numeric(3,2) DEFAULT 0.0,
    "stop_sequences" "text"[],
    "system_instructions" "text",
    "behavior_config" "jsonb"
);


ALTER TABLE "public"."providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "event_type" "text" NOT NULL,
    "payload" "jsonb",
    "ts" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."session_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_mutes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "muted_by" "uuid",
    "muted_at" timestamp with time zone DEFAULT "now"(),
    "reason" "text",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."session_mutes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_id" "uuid",
    "user_id" "uuid",
    "realtime_session_id" "text",
    "start_ts" timestamp with time zone DEFAULT "now"(),
    "end_ts" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text",
    "duration_seconds" integer,
    "tokens_used" integer,
    "cost_usd" numeric(10,4),
    "is_muted" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subscription_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "status" "text" NOT NULL,
    "provider_transaction_id" "text",
    "provider_response" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscription_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."subscription_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "provider" "text" DEFAULT 'paypal'::"text",
    "provider_id" "text",
    "status" "text" DEFAULT 'active'::"text",
    "renewal_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tier" "text" DEFAULT 'discovery'::"text" NOT NULL,
    "minutes_included" integer DEFAULT 0 NOT NULL,
    "minutes_used" integer DEFAULT 0,
    "price" numeric(10,2),
    "currency" "text" DEFAULT 'USD'::"text",
    "cancelled_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "subscriptions_tier_check" CHECK (("tier" = ANY (ARRAY['discovery'::"text", 'growth'::"text", 'transformation'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "achievement_id" "uuid",
    "earned_at" timestamp with time zone DEFAULT "now"(),
    "progress_data" "jsonb"
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_assessment_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "assessment_id" "uuid",
    "best_score" numeric(5,2),
    "best_attempt_id" "uuid",
    "total_attempts" integer DEFAULT 0,
    "last_attempt_at" timestamp with time zone,
    "is_completed" boolean DEFAULT false,
    "completion_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_assessment_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_memory_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "personality_type" "text",
    "balance_wheel_scores" "jsonb",
    "narrative_patterns" "jsonb",
    "emotional_state_history" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "narrative_identity_data" "jsonb"
);


ALTER TABLE "public"."user_memory_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "nickname" "text",
    "avatar_url" "text",
    "subscription_tier" "text" DEFAULT 'discovery'::"text",
    "remaining_minutes" integer DEFAULT 10,
    "current_level" integer DEFAULT 1,
    "crystal_balance" integer DEFAULT 0,
    "daily_streak" integer DEFAULT 0,
    "last_streak_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text", 'moderator'::"text"]))),
    CONSTRAINT "user_profiles_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['discovery'::"text", 'growth'::"text", 'transformation'::"text"])))
);

ALTER TABLE ONLY "public"."user_profiles" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_resource_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "resource_id" "uuid",
    "progress_percentage" integer DEFAULT 0,
    "completed_at" timestamp with time zone,
    "last_accessed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_resource_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "nickname" "text",
    "avatar_url" "text",
    "language" "text" DEFAULT 'en'::"text",
    "culture" "text",
    "subscription_tier" "public"."subscription_tier" DEFAULT 'free'::"public"."subscription_tier",
    "remaining_minutes" integer DEFAULT 0,
    "current_level" integer DEFAULT 1,
    "crystal_balance" integer DEFAULT 0,
    "daily_streak" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."voices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid",
    "voice_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "locale" "text",
    "gender" "text",
    "latency_hint_ms" integer,
    "enabled" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."voices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wellness_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "category" "text" NOT NULL,
    "duration" integer,
    "audio_url" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "transcript" "text",
    "is_downloadable" boolean DEFAULT false,
    "download_url" "text",
    "is_premium" boolean DEFAULT false,
    "required_tier" "text" DEFAULT 'discovery'::"text",
    "tags" "text"[],
    "usage_count" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "wellness_resources_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'draft'::"text"])))
);


ALTER TABLE "public"."wellness_resources" OWNER TO "postgres";


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affirmations"
    ADD CONSTRAINT "affirmations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_assessment_configs"
    ADD CONSTRAINT "ai_assessment_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_behaviors"
    ADD CONSTRAINT "ai_behaviors_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."ai_behaviors"
    ADD CONSTRAINT "ai_behaviors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_configurations"
    ADD CONSTRAINT "ai_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_model_configs"
    ADD CONSTRAINT "ai_model_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_processing_queue"
    ADD CONSTRAINT "ai_processing_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_rate_limits"
    ADD CONSTRAINT "ai_rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_rate_limits"
    ADD CONSTRAINT "ai_rate_limits_user_id_provider_name_window_start_key" UNIQUE ("user_id", "provider_name", "window_start");



ALTER TABLE ONLY "public"."ai_service_configs"
    ADD CONSTRAINT "ai_service_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_use_cases"
    ADD CONSTRAINT "ai_use_cases_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."ai_use_cases"
    ADD CONSTRAINT "ai_use_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_configurations"
    ADD CONSTRAINT "api_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_configurations"
    ADD CONSTRAINT "api_configurations_service_key" UNIQUE ("service");



ALTER TABLE ONLY "public"."api_integrations"
    ADD CONSTRAINT "api_integrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_attempts"
    ADD CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_categories"
    ADD CONSTRAINT "assessment_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."assessment_categories"
    ADD CONSTRAINT "assessment_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_results"
    ADD CONSTRAINT "assessment_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessments_enhanced"
    ADD CONSTRAINT "assessments_enhanced_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenge_participants"
    ADD CONSTRAINT "challenge_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenge_templates"
    ADD CONSTRAINT "challenge_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenge_types"
    ADD CONSTRAINT "challenge_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_announcement_reads"
    ADD CONSTRAINT "community_announcement_reads_announcement_id_user_id_key" UNIQUE ("announcement_id", "user_id");



ALTER TABLE ONLY "public"."community_announcement_reads"
    ADD CONSTRAINT "community_announcement_reads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_announcements"
    ADD CONSTRAINT "community_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_assessment_announcements"
    ADD CONSTRAINT "community_assessment_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_challenge_announcements"
    ADD CONSTRAINT "community_challenge_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_chat_messages"
    ADD CONSTRAINT "community_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_chat_rooms"
    ADD CONSTRAINT "community_chat_rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_connections"
    ADD CONSTRAINT "community_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_quiz_announcements"
    ADD CONSTRAINT "community_quiz_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."couples_challenge_responses"
    ADD CONSTRAINT "couples_challenge_responses_challenge_id_user_id_question_i_key" UNIQUE ("challenge_id", "user_id", "question_index");



ALTER TABLE ONLY "public"."couples_challenge_responses"
    ADD CONSTRAINT "couples_challenge_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."couples_challenges"
    ADD CONSTRAINT "couples_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."couples_challenges"
    ADD CONSTRAINT "couples_challenges_unique_link_key" UNIQUE ("unique_link");



ALTER TABLE ONLY "public"."crystal_transactions"
    ADD CONSTRAINT "crystal_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gamification_settings"
    ADD CONSTRAINT "gamification_settings_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."gamification_settings"
    ADD CONSTRAINT "gamification_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."level_thresholds"
    ADD CONSTRAINT "level_thresholds_level_key" UNIQUE ("level");



ALTER TABLE ONLY "public"."level_thresholds"
    ADD CONSTRAINT "level_thresholds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newme_assessment_tracking"
    ADD CONSTRAINT "newme_assessment_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newme_conversations"
    ADD CONSTRAINT "newme_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newme_emotional_snapshots"
    ADD CONSTRAINT "newme_emotional_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newme_messages"
    ADD CONSTRAINT "newme_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."newme_user_memories"
    ADD CONSTRAINT "newme_user_memories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_templates"
    ADD CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_templates"
    ADD CONSTRAINT "prompt_templates_use_case_id_name_key" UNIQUE ("use_case_id", "name");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_api_keys"
    ADD CONSTRAINT "provider_api_keys_pkey" PRIMARY KEY ("provider_id");



ALTER TABLE ONLY "public"."provider_credentials"
    ADD CONSTRAINT "provider_credentials_pkey" PRIMARY KEY ("provider_id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_events"
    ADD CONSTRAINT "session_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_mutes"
    ADD CONSTRAINT "session_mutes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_transactions"
    ADD CONSTRAINT "subscription_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_service_configs"
    ADD CONSTRAINT "unique_service_config" UNIQUE ("service_type", "service_id", "ai_configuration_id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_achievement_id_key" UNIQUE ("user_id", "achievement_id");



ALTER TABLE ONLY "public"."user_assessment_progress"
    ADD CONSTRAINT "user_assessment_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_assessment_progress"
    ADD CONSTRAINT "user_assessment_progress_user_id_assessment_id_key" UNIQUE ("user_id", "assessment_id");



ALTER TABLE ONLY "public"."user_memory_profiles"
    ADD CONSTRAINT "user_memory_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_memory_profiles"
    ADD CONSTRAINT "user_memory_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_nickname_key" UNIQUE ("nickname");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_resource_progress"
    ADD CONSTRAINT "user_resource_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_resource_progress"
    ADD CONSTRAINT "user_resource_progress_user_id_resource_id_key" UNIQUE ("user_id", "resource_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."voices"
    ADD CONSTRAINT "voices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wellness_resources"
    ADD CONSTRAINT "wellness_resources_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_achievements_category" ON "public"."achievements" USING "btree" ("category");



CREATE INDEX "idx_achievements_is_active" ON "public"."achievements" USING "btree" ("is_active");



CREATE INDEX "idx_affirmations_active" ON "public"."affirmations" USING "btree" ("is_active");



CREATE INDEX "idx_affirmations_category" ON "public"."affirmations" USING "btree" ("category");



CREATE INDEX "idx_agents_model_id" ON "public"."agents" USING "btree" ("model_id");



CREATE INDEX "idx_agents_voice_id" ON "public"."agents" USING "btree" ("voice_id");



CREATE INDEX "idx_ai_assessment_configs_active" ON "public"."ai_assessment_configs" USING "btree" ("is_active");



CREATE INDEX "idx_ai_configurations_is_active" ON "public"."ai_configurations" USING "btree" ("is_active");



CREATE INDEX "idx_ai_configurations_is_default" ON "public"."ai_configurations" USING "btree" ("is_default");



CREATE INDEX "idx_ai_configurations_provider" ON "public"."ai_configurations" USING "btree" ("provider");



CREATE INDEX "idx_ai_model_configs_provider" ON "public"."ai_model_configs" USING "btree" ("provider_id");



CREATE INDEX "idx_ai_model_configs_use_case" ON "public"."ai_model_configs" USING "btree" ("use_case_id");



CREATE INDEX "idx_ai_processing_queue_priority" ON "public"."ai_processing_queue" USING "btree" ("priority");



CREATE INDEX "idx_ai_processing_queue_status" ON "public"."ai_processing_queue" USING "btree" ("status");



CREATE INDEX "idx_ai_service_configs_ai_config_id" ON "public"."ai_service_configs" USING "btree" ("ai_configuration_id");



CREATE INDEX "idx_ai_service_configs_priority" ON "public"."ai_service_configs" USING "btree" ("priority" DESC);



CREATE INDEX "idx_ai_service_configs_service_id" ON "public"."ai_service_configs" USING "btree" ("service_id");



CREATE INDEX "idx_ai_service_configs_service_type" ON "public"."ai_service_configs" USING "btree" ("service_type");



CREATE INDEX "idx_ai_usage_logs_created" ON "public"."ai_usage_logs" USING "btree" ("created_at");



CREATE INDEX "idx_ai_usage_logs_created_at" ON "public"."ai_usage_logs" USING "btree" ("created_at");



CREATE INDEX "idx_ai_usage_logs_user" ON "public"."ai_usage_logs" USING "btree" ("user_id");



CREATE INDEX "idx_ai_usage_logs_user_id" ON "public"."ai_usage_logs" USING "btree" ("user_id");



CREATE INDEX "idx_api_configurations_is_active" ON "public"."api_configurations" USING "btree" ("is_active");



CREATE INDEX "idx_api_configurations_service" ON "public"."api_configurations" USING "btree" ("service");



CREATE INDEX "idx_assessment_attempts_assessment" ON "public"."assessment_attempts" USING "btree" ("assessment_id");



CREATE INDEX "idx_assessment_attempts_assessment_id" ON "public"."assessment_attempts" USING "btree" ("assessment_id");



CREATE INDEX "idx_assessment_attempts_status" ON "public"."assessment_attempts" USING "btree" ("status");



CREATE INDEX "idx_assessment_attempts_user" ON "public"."assessment_attempts" USING "btree" ("user_id");



CREATE INDEX "idx_assessment_attempts_user_id" ON "public"."assessment_attempts" USING "btree" ("user_id");



CREATE INDEX "idx_assessment_results_assessment_id" ON "public"."assessment_results" USING "btree" ("assessment_id");



CREATE INDEX "idx_assessment_results_user_id" ON "public"."assessment_results" USING "btree" ("user_id");



CREATE INDEX "idx_assessments_category" ON "public"."assessments" USING "btree" ("category");



CREATE INDEX "idx_assessments_enhanced_active" ON "public"."assessments_enhanced" USING "btree" ("is_active");



CREATE INDEX "idx_assessments_enhanced_category" ON "public"."assessments_enhanced" USING "btree" ("category");



CREATE INDEX "idx_assessments_is_public" ON "public"."assessments" USING "btree" ("is_public");



CREATE INDEX "idx_assessments_type" ON "public"."assessments" USING "btree" ("assessment_type");



CREATE INDEX "idx_challenge_participants_challenge" ON "public"."challenge_participants" USING "btree" ("challenge_id");



CREATE INDEX "idx_challenge_participants_user" ON "public"."challenge_participants" USING "btree" ("user_id");



CREATE INDEX "idx_challenge_templates_active" ON "public"."challenge_templates" USING "btree" ("is_active");



CREATE INDEX "idx_challenge_templates_category" ON "public"."challenge_templates" USING "btree" ("category");



CREATE INDEX "idx_community_announcement_reads_announcement" ON "public"."community_announcement_reads" USING "btree" ("announcement_id");



CREATE INDEX "idx_community_announcement_reads_announcement_id" ON "public"."community_announcement_reads" USING "btree" ("announcement_id");



CREATE INDEX "idx_community_announcement_reads_user" ON "public"."community_announcement_reads" USING "btree" ("user_id");



CREATE INDEX "idx_community_announcement_reads_user_id" ON "public"."community_announcement_reads" USING "btree" ("user_id");



CREATE INDEX "idx_community_announcements_active" ON "public"."community_announcements" USING "btree" ("is_active");



CREATE INDEX "idx_community_announcements_priority" ON "public"."community_announcements" USING "btree" ("priority");



CREATE INDEX "idx_community_announcements_type" ON "public"."community_announcements" USING "btree" ("announcement_type");



CREATE INDEX "idx_community_chat_messages_created_at" ON "public"."community_chat_messages" USING "btree" ("created_at");



CREATE INDEX "idx_community_chat_messages_room_id" ON "public"."community_chat_messages" USING "btree" ("room_id");



CREATE INDEX "idx_community_chat_messages_user_id" ON "public"."community_chat_messages" USING "btree" ("user_id");



CREATE INDEX "idx_community_chat_rooms_active" ON "public"."community_chat_rooms" USING "btree" ("is_active");



CREATE INDEX "idx_community_chat_rooms_type" ON "public"."community_chat_rooms" USING "btree" ("room_type");



CREATE INDEX "idx_community_connections_receiver" ON "public"."community_connections" USING "btree" ("receiver_id");



CREATE INDEX "idx_community_connections_requester" ON "public"."community_connections" USING "btree" ("requester_id");



CREATE INDEX "idx_community_connections_status" ON "public"."community_connections" USING "btree" ("status");



CREATE INDEX "idx_conversations_user_id" ON "public"."conversations" USING "btree" ("user_id");



CREATE INDEX "idx_couples_challenge_responses_challenge" ON "public"."couples_challenge_responses" USING "btree" ("challenge_id");



CREATE INDEX "idx_couples_challenge_responses_user" ON "public"."couples_challenge_responses" USING "btree" ("user_id");



CREATE INDEX "idx_couples_challenges_initiator" ON "public"."couples_challenges" USING "btree" ("initiator_id");



CREATE INDEX "idx_couples_challenges_partner" ON "public"."couples_challenges" USING "btree" ("partner_id");



CREATE INDEX "idx_couples_challenges_unique_link" ON "public"."couples_challenges" USING "btree" ("unique_link");



CREATE INDEX "idx_crystal_transactions_type" ON "public"."crystal_transactions" USING "btree" ("type");



CREATE INDEX "idx_crystal_transactions_user_id" ON "public"."crystal_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_gamification_settings_name" ON "public"."gamification_settings" USING "btree" ("name");



CREATE INDEX "idx_level_thresholds_level" ON "public"."level_thresholds" USING "btree" ("level");



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_ts" ON "public"."messages" USING "btree" ("ts");



CREATE INDEX "idx_models_provider_id" ON "public"."models" USING "btree" ("provider_id");



CREATE INDEX "idx_newme_assessment_tracking_user" ON "public"."newme_assessment_tracking" USING "btree" ("user_id", "suggested_at" DESC);



CREATE INDEX "idx_newme_conversations_active" ON "public"."newme_conversations" USING "btree" ("user_id") WHERE ("ended_at" IS NULL);



CREATE INDEX "idx_newme_conversations_user_id" ON "public"."newme_conversations" USING "btree" ("user_id", "started_at" DESC);



CREATE INDEX "idx_newme_emotional_snapshots_user" ON "public"."newme_emotional_snapshots" USING "btree" ("user_id", "snapshot_date" DESC);



CREATE INDEX "idx_newme_messages_conversation" ON "public"."newme_messages" USING "btree" ("conversation_id", "timestamp");



CREATE INDEX "idx_newme_messages_role" ON "public"."newme_messages" USING "btree" ("conversation_id", "role");



CREATE INDEX "idx_newme_user_memories_importance" ON "public"."newme_user_memories" USING "btree" ("user_id", "importance_score" DESC);



CREATE INDEX "idx_newme_user_memories_type" ON "public"."newme_user_memories" USING "btree" ("user_id", "memory_type");



CREATE INDEX "idx_newme_user_memories_user" ON "public"."newme_user_memories" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_prompt_templates_provider" ON "public"."prompt_templates" USING "btree" ("provider_id");



CREATE INDEX "idx_prompt_templates_use_case" ON "public"."prompt_templates" USING "btree" ("use_case_id");



CREATE INDEX "idx_session_events_session_id" ON "public"."session_events" USING "btree" ("session_id");



CREATE INDEX "idx_session_mutes_active" ON "public"."session_mutes" USING "btree" ("is_active");



CREATE INDEX "idx_session_mutes_session_id" ON "public"."session_mutes" USING "btree" ("session_id");



CREATE INDEX "idx_sessions_agent_id" ON "public"."sessions" USING "btree" ("agent_id");



CREATE INDEX "idx_sessions_is_muted" ON "public"."sessions" USING "btree" ("is_muted");



CREATE INDEX "idx_sessions_user_id" ON "public"."sessions" USING "btree" ("user_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_user_achievements_achievement_id" ON "public"."user_achievements" USING "btree" ("achievement_id");



CREATE INDEX "idx_user_achievements_user_id" ON "public"."user_achievements" USING "btree" ("user_id");



CREATE INDEX "idx_user_assessment_progress_assessment_id" ON "public"."user_assessment_progress" USING "btree" ("assessment_id");



CREATE INDEX "idx_user_assessment_progress_user_id" ON "public"."user_assessment_progress" USING "btree" ("user_id");



CREATE INDEX "idx_user_memory_profiles_narrative_identity" ON "public"."user_memory_profiles" USING "gin" ("narrative_identity_data");



CREATE INDEX "idx_user_memory_profiles_user_id" ON "public"."user_memory_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_role" ON "public"."user_profiles" USING "btree" ("role");



CREATE INDEX "idx_user_profiles_subscription_tier" ON "public"."user_profiles" USING "btree" ("subscription_tier");



CREATE INDEX "idx_user_profiles_user_id" ON "public"."user_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_user_progress_assessment" ON "public"."user_assessment_progress" USING "btree" ("assessment_id");



CREATE INDEX "idx_user_progress_user" ON "public"."user_assessment_progress" USING "btree" ("user_id");



CREATE INDEX "idx_user_resource_progress_user_id" ON "public"."user_resource_progress" USING "btree" ("user_id");



CREATE INDEX "idx_voices_provider_id" ON "public"."voices" USING "btree" ("provider_id");



CREATE INDEX "idx_wellness_resources_category" ON "public"."wellness_resources" USING "btree" ("category");



CREATE INDEX "idx_wellness_resources_is_premium" ON "public"."wellness_resources" USING "btree" ("is_premium");



CREATE OR REPLACE TRIGGER "ai_configurations_updated_at" BEFORE UPDATE ON "public"."ai_configurations" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_configurations_updated_at"();



CREATE OR REPLACE TRIGGER "ai_service_configs_updated_at" BEFORE UPDATE ON "public"."ai_service_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_ai_configurations_updated_at"();



CREATE OR REPLACE TRIGGER "api_configurations_updated_at" BEFORE UPDATE ON "public"."api_configurations" FOR EACH ROW EXECUTE FUNCTION "public"."update_api_configurations_updated_at"();



CREATE OR REPLACE TRIGGER "newme_conversations_updated_at" BEFORE UPDATE ON "public"."newme_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_newme_conversations_updated_at"();



CREATE OR REPLACE TRIGGER "newme_user_memories_updated_at" BEFORE UPDATE ON "public"."newme_user_memories" FOR EACH ROW EXECUTE FUNCTION "public"."update_newme_user_memories_updated_at"();



CREATE OR REPLACE TRIGGER "set_affirmations_created_by" BEFORE INSERT ON "public"."affirmations" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by_profile"();



CREATE OR REPLACE TRIGGER "set_challenge_templates_created_by" BEFORE INSERT ON "public"."challenge_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_created_by_profile"();



CREATE OR REPLACE TRIGGER "set_timestamp_api_integrations" BEFORE UPDATE ON "public"."api_integrations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_achievements_updated_at" BEFORE UPDATE ON "public"."achievements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_affirmations_updated_at" BEFORE UPDATE ON "public"."affirmations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_agents_updated_at" BEFORE UPDATE ON "public"."agents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_assessment_configs_updated_at" BEFORE UPDATE ON "public"."ai_assessment_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_behaviors_updated_at" BEFORE UPDATE ON "public"."ai_behaviors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_model_configs_updated_at" BEFORE UPDATE ON "public"."ai_model_configs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_rate_limits_updated_at" BEFORE UPDATE ON "public"."ai_rate_limits" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_ai_use_cases_updated_at" BEFORE UPDATE ON "public"."ai_use_cases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_assessments_enhanced_updated_at" BEFORE UPDATE ON "public"."assessments_enhanced" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_assessments_updated_at" BEFORE UPDATE ON "public"."assessments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_challenge_templates_updated_at" BEFORE UPDATE ON "public"."challenge_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_community_announcements_updated_at" BEFORE UPDATE ON "public"."community_announcements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_community_assessment_announcements_updated_at" BEFORE UPDATE ON "public"."community_assessment_announcements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_community_challenge_announcements_updated_at" BEFORE UPDATE ON "public"."community_challenge_announcements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_community_chat_rooms_updated_at" BEFORE UPDATE ON "public"."community_chat_rooms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_community_connections_updated_at" BEFORE UPDATE ON "public"."community_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_community_quiz_announcements_updated_at" BEFORE UPDATE ON "public"."community_quiz_announcements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_couples_challenges_updated_at" BEFORE UPDATE ON "public"."couples_challenges" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_gamification_settings_updated_at" BEFORE UPDATE ON "public"."gamification_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_level_thresholds_updated_at" BEFORE UPDATE ON "public"."level_thresholds" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_models_updated_at" BEFORE UPDATE ON "public"."models" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_newme_conversations_updated_at" BEFORE UPDATE ON "public"."newme_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_prompt_templates_updated_at" BEFORE UPDATE ON "public"."prompt_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_prompts_updated_at" BEFORE UPDATE ON "public"."prompts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_provider_api_keys_updated_at" BEFORE UPDATE ON "public"."provider_api_keys" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_provider_credentials_updated_at" BEFORE UPDATE ON "public"."provider_credentials" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_providers_updated_at" BEFORE UPDATE ON "public"."providers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_assessment_progress_updated_at" BEFORE UPDATE ON "public"."user_assessment_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_memory_profiles_updated_at" BEFORE UPDATE ON "public"."user_memory_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_resource_progress_updated_at" BEFORE UPDATE ON "public"."user_resource_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_voices_updated_at" BEFORE UPDATE ON "public"."voices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_wellness_resources_updated_at" BEFORE UPDATE ON "public"."wellness_resources" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."affirmations"
    ADD CONSTRAINT "affirmations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_voice_id_fkey" FOREIGN KEY ("voice_id") REFERENCES "public"."voices"("id");



ALTER TABLE ONLY "public"."ai_configurations"
    ADD CONSTRAINT "ai_configurations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."ai_model_configs"
    ADD CONSTRAINT "ai_model_configs_behavior_id_fkey" FOREIGN KEY ("behavior_id") REFERENCES "public"."ai_behaviors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_model_configs"
    ADD CONSTRAINT "ai_model_configs_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_model_configs"
    ADD CONSTRAINT "ai_model_configs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_model_configs"
    ADD CONSTRAINT "ai_model_configs_use_case_id_fkey" FOREIGN KEY ("use_case_id") REFERENCES "public"."ai_use_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_processing_queue"
    ADD CONSTRAINT "ai_processing_queue_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_rate_limits"
    ADD CONSTRAINT "ai_rate_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_service_configs"
    ADD CONSTRAINT "ai_service_configs_ai_configuration_id_fkey" FOREIGN KEY ("ai_configuration_id") REFERENCES "public"."ai_configurations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments_enhanced"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assessment_attempts"
    ADD CONSTRAINT "assessment_attempts_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments_enhanced"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_attempts"
    ADD CONSTRAINT "assessment_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_results"
    ADD CONSTRAINT "assessment_results_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_results"
    ADD CONSTRAINT "assessment_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."assessments_enhanced"
    ADD CONSTRAINT "assessments_enhanced_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."challenge_participants"
    ADD CONSTRAINT "challenge_participants_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."assessments_enhanced"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_participants"
    ADD CONSTRAINT "challenge_participants_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."challenge_participants"
    ADD CONSTRAINT "challenge_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_templates"
    ADD CONSTRAINT "challenge_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."community_announcement_reads"
    ADD CONSTRAINT "community_announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "public"."community_announcements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_announcement_reads"
    ADD CONSTRAINT "community_announcement_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_announcements"
    ADD CONSTRAINT "community_announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."community_assessment_announcements"
    ADD CONSTRAINT "community_assessment_announcements_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id");



ALTER TABLE ONLY "public"."community_assessment_announcements"
    ADD CONSTRAINT "community_assessment_announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."community_challenge_announcements"
    ADD CONSTRAINT "community_challenge_announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."community_chat_messages"
    ADD CONSTRAINT "community_chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."community_chat_rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_chat_messages"
    ADD CONSTRAINT "community_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_chat_rooms"
    ADD CONSTRAINT "community_chat_rooms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."community_connections"
    ADD CONSTRAINT "community_connections_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_connections"
    ADD CONSTRAINT "community_connections_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_quiz_announcements"
    ADD CONSTRAINT "community_quiz_announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."couples_challenge_responses"
    ADD CONSTRAINT "couples_challenge_responses_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."couples_challenges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."couples_challenge_responses"
    ADD CONSTRAINT "couples_challenge_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."couples_challenges"
    ADD CONSTRAINT "couples_challenges_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."couples_challenges"
    ADD CONSTRAINT "couples_challenges_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crystal_transactions"
    ADD CONSTRAINT "crystal_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."newme_assessment_tracking"
    ADD CONSTRAINT "newme_assessment_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."newme_conversations"
    ADD CONSTRAINT "newme_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."newme_emotional_snapshots"
    ADD CONSTRAINT "newme_emotional_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."newme_user_memories"
    ADD CONSTRAINT "newme_user_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_templates"
    ADD CONSTRAINT "prompt_templates_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_templates"
    ADD CONSTRAINT "prompt_templates_use_case_id_fkey" FOREIGN KEY ("use_case_id") REFERENCES "public"."ai_use_cases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_api_keys"
    ADD CONSTRAINT "provider_api_keys_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_credentials"
    ADD CONSTRAINT "provider_credentials_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_events"
    ADD CONSTRAINT "session_events_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_mutes"
    ADD CONSTRAINT "session_mutes_muted_by_fkey" FOREIGN KEY ("muted_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."session_mutes"
    ADD CONSTRAINT "session_mutes_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_transactions"
    ADD CONSTRAINT "subscription_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_assessment_progress"
    ADD CONSTRAINT "user_assessment_progress_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments_enhanced"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_assessment_progress"
    ADD CONSTRAINT "user_assessment_progress_best_attempt_id_fkey" FOREIGN KEY ("best_attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_assessment_progress"
    ADD CONSTRAINT "user_assessment_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_memory_profiles"
    ADD CONSTRAINT "user_memory_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_resource_progress"
    ADD CONSTRAINT "user_resource_progress_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "public"."wellness_resources"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_resource_progress"
    ADD CONSTRAINT "user_resource_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."voices"
    ADD CONSTRAINT "voices_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wellness_resources"
    ADD CONSTRAINT "wellness_resources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



CREATE POLICY "Admin email can manage all profiles" ON "public"."user_profiles" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can delete API configurations" ON "public"."api_configurations" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE ((("user_profiles"."user_id" = "auth"."uid"()) OR ("user_profiles"."id" = "auth"."uid"())) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"text", 'ADMIN'::"text"]))))));



CREATE POLICY "Admins can delete roles" ON "public"."user_roles" FOR DELETE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can insert API configurations" ON "public"."api_configurations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE ((("user_profiles"."user_id" = "auth"."uid"()) OR ("user_profiles"."id" = "auth"."uid"())) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"text", 'ADMIN'::"text"]))))));



CREATE POLICY "Admins can insert roles" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage AI assessment configs" ON "public"."ai_assessment_configs" USING (((( SELECT "user_profiles"."role"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."user_id" = "auth"."uid"())) = 'admin'::"text") OR ("auth"."email"() = 'admin@newomen.me'::"text")));



CREATE POLICY "Admins can manage AI behaviors" ON "public"."ai_behaviors" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can manage AI configs" ON "public"."ai_assessment_configs" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can manage AI configurations" ON "public"."ai_configurations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"public"."app_role")))));



CREATE POLICY "Admins can manage AI model configs" ON "public"."ai_model_configs" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can manage AI processing queue" ON "public"."ai_processing_queue" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can manage AI use cases" ON "public"."ai_use_cases" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can manage achievements" ON "public"."achievements" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage agents" ON "public"."agents" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all assessments" ON "public"."assessments_enhanced" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can manage all challenge responses" ON "public"."couples_challenge_responses" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all challenges" ON "public"."couples_challenges" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all connections" ON "public"."community_connections" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all conversations" ON "public"."newme_conversations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."user_id" = "auth"."uid"()) AND ("user_profiles"."role" = 'ADMIN'::"text")))));



CREATE POLICY "Admins can manage all memory profiles" ON "public"."user_memory_profiles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all memory profiles by role" ON "public"."user_memory_profiles" USING (((( SELECT "user_profiles"."role"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."user_id" = "auth"."uid"())) = 'admin'::"text") OR ("auth"."email"() = 'admin@newomen.me'::"text")));



CREATE POLICY "Admins can manage all messages" ON "public"."community_chat_messages" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all resources" ON "public"."wellness_resources" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all session events" ON "public"."session_events" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all sessions" ON "public"."sessions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all subscription transactions" ON "public"."subscription_transactions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all subscriptions" ON "public"."subscriptions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage announcements" ON "public"."community_announcements" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage assessment announcements" ON "public"."community_assessment_announcements" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage assessments" ON "public"."assessments" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage assessments" ON "public"."assessments_enhanced" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can manage categories" ON "public"."assessment_categories" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can manage challenge announcements" ON "public"."community_challenge_announcements" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage challenge types" ON "public"."challenge_types" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can manage chat rooms" ON "public"."community_chat_rooms" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage community connections" ON "public"."community_connections" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage content" ON "public"."wellness_resources" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage couples challenges" ON "public"."couples_challenges" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage level thresholds" ON "public"."level_thresholds" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage models" ON "public"."models" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage processing queue" ON "public"."ai_processing_queue" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can manage prompt templates" ON "public"."prompt_templates" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can manage prompts" ON "public"."prompts" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage providers" ON "public"."providers" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage quiz announcements" ON "public"."community_quiz_announcements" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage service configurations" ON "public"."ai_service_configs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"public"."app_role")))));



CREATE POLICY "Admins can manage sessions" ON "public"."sessions" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage voices" ON "public"."voices" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage wellness resources" ON "public"."wellness_resources" TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can update API configurations" ON "public"."api_configurations" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE ((("user_profiles"."user_id" = "auth"."uid"()) OR ("user_profiles"."id" = "auth"."uid"())) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"text", 'ADMIN'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE ((("user_profiles"."user_id" = "auth"."uid"()) OR ("user_profiles"."id" = "auth"."uid"())) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"text", 'ADMIN'::"text"]))))));



CREATE POLICY "Admins can update any user profile" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can update roles" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view AI usage logs" ON "public"."ai_usage_logs" FOR SELECT USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins can view API configurations" ON "public"."api_configurations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE ((("user_profiles"."user_id" = "auth"."uid"()) OR ("user_profiles"."id" = "auth"."uid"())) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"text", 'ADMIN'::"text"]))))));



CREATE POLICY "Admins can view all announcement reads" ON "public"."community_announcement_reads" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can view all assessment results" ON "public"."assessment_results" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can view all conversations" ON "public"."conversations" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can view all conversations" ON "public"."newme_conversations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all memories" ON "public"."newme_user_memories" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all messages" ON "public"."messages" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can view all resource progress" ON "public"."user_resource_progress" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can view all roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view all session events" ON "public"."session_events" FOR SELECT TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view all sessions" ON "public"."sessions" FOR SELECT TO "authenticated" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view all transactions" ON "public"."crystal_transactions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can view all user achievements" ON "public"."user_achievements" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can view all user profiles" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING ("public"."has_role"(( SELECT "auth"."uid"() AS "uid"), 'admin'::"public"."app_role"));



CREATE POLICY "Admins manage affirmations" ON "public"."affirmations" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins manage challenge templates" ON "public"."challenge_templates" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins manage gamification settings" ON "public"."gamification_settings" USING (("auth"."email"() = 'admin@newomen.me'::"text"));



CREATE POLICY "Admins manage models" ON "public"."models" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins manage provider API keys" ON "public"."provider_api_keys" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins manage provider credentials" ON "public"."provider_credentials" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins manage providers" ON "public"."providers" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins manage voices" ON "public"."voices" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Allow profile creation via trigger" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Announcements are viewable by authenticated users" ON "public"."community_announcements" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Anyone can view achievements" ON "public"."achievements" FOR SELECT USING (true);



CREATE POLICY "Anyone can view active achievements" ON "public"."achievements" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view free resources" ON "public"."wellness_resources" FOR SELECT USING ((("is_premium" = false) AND ("status" = 'active'::"text")));



CREATE POLICY "Anyone can view level thresholds" ON "public"."level_thresholds" FOR SELECT USING (true);



CREATE POLICY "Anyone can view public assessments" ON "public"."assessments" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Anyone can view wellness resources" ON "public"."wellness_resources" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can insert messages" ON "public"."community_chat_messages" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."community_chat_rooms"
  WHERE (("community_chat_rooms"."id" = "community_chat_messages"."room_id") AND ("community_chat_rooms"."is_active" = true))))));



CREATE POLICY "Authenticated users can send messages" ON "public"."community_chat_messages" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Authenticated users can view active AI configs" ON "public"."ai_assessment_configs" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("is_active" = true)));



CREATE POLICY "Authenticated users can view active announcements" ON "public"."community_announcements" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("is_active" = true) AND (("target_audience" = 'all'::"text") OR ("target_audience" = ( SELECT "user_profiles"."subscription_tier"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Authenticated users can view active assessment announcements" ON "public"."community_assessment_announcements" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("is_active" = true)));



CREATE POLICY "Authenticated users can view active assessments" ON "public"."assessments_enhanced" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("is_active" = true)));



CREATE POLICY "Authenticated users can view active challenge announcements" ON "public"."community_challenge_announcements" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("is_active" = true)));



CREATE POLICY "Authenticated users can view active chat rooms" ON "public"."community_chat_rooms" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("is_active" = true)));



CREATE POLICY "Authenticated users can view active quiz announcements" ON "public"."community_quiz_announcements" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("is_active" = true)));



CREATE POLICY "Authenticated users can view agents" ON "public"."agents" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view all assessments" ON "public"."assessments" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view categories" ON "public"."assessment_categories" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can view messages in active rooms" ON "public"."community_chat_messages" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."community_chat_rooms"
  WHERE (("community_chat_rooms"."id" = "community_chat_messages"."room_id") AND ("community_chat_rooms"."is_active" = true))))));



CREATE POLICY "Authenticated users can view models" ON "public"."models" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view prompts" ON "public"."prompts" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view providers" ON "public"."providers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view resources they have access to" ON "public"."wellness_resources" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (("is_premium" = false) OR ("required_tier" = 'discovery'::"text") OR (("required_tier" = 'growth'::"text") AND (( SELECT "user_profiles"."subscription_tier"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."user_id" = "auth"."uid"())) = ANY (ARRAY['growth'::"text", 'transformation'::"text"]))) OR (("required_tier" = 'transformation'::"text") AND (( SELECT "user_profiles"."subscription_tier"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."user_id" = "auth"."uid"())) = 'transformation'::"text")))));



CREATE POLICY "Authenticated users can view voices" ON "public"."voices" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Chat messages are viewable by authenticated users" ON "public"."community_chat_messages" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Chat rooms are viewable by authenticated users" ON "public"."community_chat_rooms" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Everyone can view active categories" ON "public"."assessment_categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Everyone can view affirmations" ON "public"."affirmations" FOR SELECT USING (true);



CREATE POLICY "Everyone can view challenge templates" ON "public"."challenge_templates" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Gamification settings readable" ON "public"."gamification_settings" FOR SELECT USING (true);



CREATE POLICY "NewMe conversations viewable by admins only" ON "public"."newme_conversations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'ADMIN'::"text")))));



CREATE POLICY "Only admins can manage announcements" ON "public"."community_announcements" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."email" = 'admin@newomen.me'::"text")))));



CREATE POLICY "Only admins can manage chat rooms" ON "public"."community_chat_rooms" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."email" = 'admin@newomen.me'::"text")))));



CREATE POLICY "Only admins can manage session mutes" ON "public"."session_mutes" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."email" = 'admin@newomen.me'::"text")))));



CREATE POLICY "Service can read configurations" ON "public"."ai_configurations" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Service can read service configs" ON "public"."ai_service_configs" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Session history viewable by admins only" ON "public"."sessions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'ADMIN'::"text")))));



CREATE POLICY "System can insert user achievements" ON "public"."user_achievements" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create challenges" ON "public"."couples_challenges" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "couples_challenges"."initiator_id") AND ("user_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create connection requests" ON "public"."community_connections" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "community_connections"."requester_id") AND ("user_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create their own attempts" ON "public"."assessment_attempts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own memories" ON "public"."newme_user_memories" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can edit their own messages" ON "public"."community_chat_messages" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert messages in their conversations" ON "public"."newme_messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."newme_conversations"
  WHERE (("newme_conversations"."id" = "newme_messages"."conversation_id") AND ("newme_conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own assessment results" ON "public"."assessment_results" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "assessment_results"."user_id") AND ("user_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own subscriptions" ON "public"."subscriptions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "subscriptions"."user_id") AND ("user_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own assessment results" ON "public"."assessment_results" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own challenge responses" ON "public"."couples_challenge_responses" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own conversation messages" ON "public"."messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND ("conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own conversations" ON "public"."conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own conversations" ON "public"."newme_conversations" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own memories" ON "public"."newme_user_memories" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own memory profile" ON "public"."user_memory_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own messages" ON "public"."community_chat_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can join challenges" ON "public"."challenge_participants" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage own conversations" ON "public"."newme_conversations" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own memories" ON "public"."newme_user_memories" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own messages" ON "public"."newme_messages" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."newme_conversations"
  WHERE (("newme_conversations"."id" = "newme_messages"."conversation_id") AND ("newme_conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can manage own snapshots" ON "public"."newme_emotional_snapshots" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own tracking" ON "public"."newme_assessment_tracking" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their assessment tracking" ON "public"."newme_assessment_tracking" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their emotional snapshots" ON "public"."newme_emotional_snapshots" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own announcement reads" ON "public"."community_announcement_reads" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can manage their own assessments" ON "public"."assessments_enhanced" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can manage their own attempts" ON "public"."assessment_attempts" USING ((("auth"."role"() = 'authenticated'::"text") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can manage their own challenges" ON "public"."couples_challenges" USING ((("initiator_id" = "auth"."uid"()) OR ("partner_id" = "auth"."uid"())));



CREATE POLICY "Users can manage their own connections" ON "public"."community_connections" USING ((("requester_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"())));



CREATE POLICY "Users can manage their own progress" ON "public"."user_assessment_progress" USING ((("auth"."role"() = 'authenticated'::"text") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can manage their own rate limits" ON "public"."ai_rate_limits" USING ((("auth"."role"() = 'authenticated'::"text") AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can manage their own read status" ON "public"."community_announcement_reads" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own resource progress" ON "public"."user_resource_progress" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update challenges involving them" ON "public"."couples_challenges" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE ((("user_profiles"."id" = "couples_challenges"."initiator_id") OR ("user_profiles"."id" = "couples_challenges"."partner_id")) AND ("user_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update connections involving them" ON "public"."community_connections" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE ((("user_profiles"."id" = "community_connections"."requester_id") OR ("user_profiles"."id" = "community_connections"."receiver_id")) AND ("user_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own memory profile" ON "public"."user_memory_profiles" FOR UPDATE USING (("auth"."uid"() = ( SELECT "user_profiles"."user_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "user_memory_profiles"."user_id"))));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own subscriptions" ON "public"."subscriptions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "subscriptions"."user_id") AND ("user_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own attempts" ON "public"."assessment_attempts" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own conversations" ON "public"."newme_conversations" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own memories" ON "public"."newme_user_memories" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own memory profile" ON "public"."user_memory_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own messages" ON "public"."community_chat_messages" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view active AI assessment configs" ON "public"."ai_assessment_configs" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Users can view challenge responses they're part of" ON "public"."couples_challenge_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."couples_challenges"
  WHERE (("couples_challenges"."id" = "couples_challenge_responses"."challenge_id") AND (("couples_challenges"."initiator_id" = "auth"."uid"()) OR ("couples_challenges"."partner_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view challenges involving them" ON "public"."couples_challenges" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE ((("user_profiles"."id" = "couples_challenges"."initiator_id") OR ("user_profiles"."id" = "couples_challenges"."partner_id")) AND ("user_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view connections involving them" ON "public"."community_connections" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE ((("user_profiles"."id" = "community_connections"."requester_id") OR ("user_profiles"."id" = "community_connections"."receiver_id")) AND ("user_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view events from own sessions" ON "public"."session_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."sessions"
  WHERE (("sessions"."id" = "session_events"."session_id") AND ("sessions"."user_id" IN ( SELECT "user_profiles"."id"
           FROM "public"."user_profiles"
          WHERE ("user_profiles"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Users can view messages from own sessions" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."sessions"
  WHERE (("sessions"."id" = "messages"."session_id") AND ("sessions"."user_id" IN ( SELECT "user_profiles"."id"
           FROM "public"."user_profiles"
          WHERE ("user_profiles"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Users can view messages in their conversations" ON "public"."newme_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."newme_conversations"
  WHERE (("newme_conversations"."id" = "newme_messages"."conversation_id") AND ("newme_conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own achievements" ON "public"."user_achievements" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "user_achievements"."user_id") AND ("user_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own assessment results" ON "public"."assessment_results" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "assessment_results"."user_id") AND ("user_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own memory profile" ON "public"."user_memory_profiles" FOR SELECT USING (("auth"."uid"() = ( SELECT "user_profiles"."user_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "user_memory_profiles"."user_id"))));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own sessions" ON "public"."sessions" FOR SELECT USING (("auth"."uid"() = ( SELECT "user_profiles"."user_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "sessions"."user_id"))));



CREATE POLICY "Users can view own subscriptions" ON "public"."subscriptions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "subscriptions"."user_id") AND ("user_profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view public assessments" ON "public"."assessments_enhanced" FOR SELECT USING ((("is_public" = true) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Users can view their own achievements" ON "public"."user_achievements" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own assessment results" ON "public"."assessment_results" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own attempts" ON "public"."assessment_attempts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own challenges" ON "public"."challenge_participants" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("partner_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own challenges" ON "public"."couples_challenges" FOR SELECT USING ((("initiator_id" = "auth"."uid"()) OR ("partner_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own connections" ON "public"."community_connections" FOR SELECT USING ((("requester_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own conversation messages" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."conversations"
  WHERE (("conversations"."id" = "messages"."conversation_id") AND ("conversations"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own conversations" ON "public"."conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own conversations" ON "public"."newme_conversations" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own memories" ON "public"."newme_user_memories" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own memory profile" ON "public"."user_memory_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own progress" ON "public"."user_assessment_progress" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own rate limits" ON "public"."ai_rate_limits" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own session events" ON "public"."session_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."sessions"
  WHERE (("sessions"."id" = "session_events"."session_id") AND ("sessions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own sessions" ON "public"."sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own subscription transactions" ON "public"."subscription_transactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."subscriptions"
  WHERE (("subscriptions"."id" = "subscription_transactions"."subscription_id") AND ("subscriptions"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own transactions" ON "public"."crystal_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own usage logs" ON "public"."ai_usage_logs" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."affirmations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_assessment_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_behaviors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_configurations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_model_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_processing_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_service_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_use_cases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."api_configurations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessments_enhanced" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenge_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenge_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenge_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_announcement_reads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_assessment_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_challenge_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_chat_rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_quiz_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."couples_challenge_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."couples_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crystal_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gamification_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."level_thresholds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newme_assessment_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newme_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newme_emotional_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newme_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."newme_user_memories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompt_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_api_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."provider_credentials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_mutes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_assessment_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_memory_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_resource_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."voices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wellness_resources" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."_create_admin_policy_if_table_exists"("tbl" "regclass", "polname" "text", "for_ops" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."_create_admin_policy_if_table_exists"("tbl" "regclass", "polname" "text", "for_ops" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."_create_admin_policy_if_table_exists"("tbl" "regclass", "polname" "text", "for_ops" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ai_content_builder"("p_content_type" "text", "p_topic" "text", "p_style" "text", "p_length" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ai_content_builder"("p_content_type" "text", "p_topic" "text", "p_style" "text", "p_length" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ai_content_builder"("p_content_type" "text", "p_topic" "text", "p_style" "text", "p_length" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."award_crystals"("p_user_id" "uuid", "p_amount" integer, "p_source" "text", "p_description" "text", "p_related_entity_id" "uuid", "p_related_entity_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."award_crystals"("p_user_id" "uuid", "p_amount" integer, "p_source" "text", "p_description" "text", "p_related_entity_id" "uuid", "p_related_entity_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_crystals"("p_user_id" "uuid", "p_amount" integer, "p_source" "text", "p_description" "text", "p_related_entity_id" "uuid", "p_related_entity_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_achievements"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_achievements"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_achievements"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_ai_rate_limit"("p_user_id" "uuid", "p_provider_name" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_ai_rate_limit"("p_user_id" "uuid", "p_provider_name" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_ai_rate_limit"("p_user_id" "uuid", "p_provider_name" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_challenge_link"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_challenge_link"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_challenge_link"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ai_config_for_service"("service_type_param" "text", "service_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ai_config_for_service"("service_type_param" "text", "service_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ai_config_for_service"("service_type_param" "text", "service_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_newme_user_context"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_newme_user_context"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_newme_user_context"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_provider_api_key"("p_provider_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_provider_api_key"("p_provider_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_provider_api_key"("p_provider_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_provider_api_key"("p_provider_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_announcements_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_announcements_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_announcements_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_ai_rate_limit"("p_user_id" "uuid", "p_provider_name" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_ai_rate_limit"("p_user_id" "uuid", "p_provider_name" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_ai_rate_limit"("p_user_id" "uuid", "p_provider_name" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_message_count"("conv_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_message_count"("conv_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_message_count"("conv_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_announcement_read"("p_announcement_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_announcement_read"("p_announcement_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_announcement_read"("p_announcement_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."paypal_capture_order"("p_order_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."paypal_capture_order"("p_order_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."paypal_capture_order"("p_order_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."paypal_create_order"("p_amount" numeric, "p_currency" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."paypal_create_order"("p_amount" numeric, "p_currency" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."paypal_create_order"("p_amount" numeric, "p_currency" "text", "p_description" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."promote_user_to_admin"("p_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."promote_user_to_admin"("p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."promote_user_to_admin"("p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."promote_user_to_admin"("p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."provider_discovery"("p_service_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."provider_discovery"("p_service_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."provider_discovery"("p_service_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."realtime_token"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."realtime_token"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."realtime_token"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_created_by_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_created_by_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_created_by_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at_column"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."store_provider_api_key"("p_provider_id" "uuid", "p_api_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."store_provider_api_key"("p_provider_id" "uuid", "p_api_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."store_provider_api_key"("p_provider_id" "uuid", "p_api_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."store_provider_api_key"("p_provider_id" "uuid", "p_api_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ai_configurations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_ai_configurations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ai_configurations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_api_configurations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_api_configurations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_api_configurations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_newme_conversations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_newme_conversations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_newme_conversations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_newme_user_memories_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_newme_user_memories_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_newme_user_memories_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_subscription_minutes"("p_user_id" "uuid", "p_minutes_used" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_subscription_minutes"("p_user_id" "uuid", "p_minutes_used" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_subscription_minutes"("p_user_id" "uuid", "p_minutes_used" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."affirmations" TO "anon";
GRANT ALL ON TABLE "public"."affirmations" TO "authenticated";
GRANT ALL ON TABLE "public"."affirmations" TO "service_role";



GRANT ALL ON TABLE "public"."agents" TO "anon";
GRANT ALL ON TABLE "public"."agents" TO "authenticated";
GRANT ALL ON TABLE "public"."agents" TO "service_role";



GRANT ALL ON TABLE "public"."ai_assessment_configs" TO "anon";
GRANT ALL ON TABLE "public"."ai_assessment_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_assessment_configs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_behaviors" TO "anon";
GRANT ALL ON TABLE "public"."ai_behaviors" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_behaviors" TO "service_role";



GRANT ALL ON TABLE "public"."ai_configurations" TO "anon";
GRANT ALL ON TABLE "public"."ai_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_model_configs" TO "anon";
GRANT ALL ON TABLE "public"."ai_model_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_model_configs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_processing_queue" TO "anon";
GRANT ALL ON TABLE "public"."ai_processing_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_processing_queue" TO "service_role";



GRANT ALL ON TABLE "public"."ai_rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."ai_rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."ai_service_configs" TO "anon";
GRANT ALL ON TABLE "public"."ai_service_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_service_configs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_use_cases" TO "anon";
GRANT ALL ON TABLE "public"."ai_use_cases" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_use_cases" TO "service_role";



GRANT ALL ON TABLE "public"."api_configurations" TO "anon";
GRANT ALL ON TABLE "public"."api_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."api_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."api_integrations" TO "anon";
GRANT ALL ON TABLE "public"."api_integrations" TO "authenticated";
GRANT ALL ON TABLE "public"."api_integrations" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_attempts" TO "anon";
GRANT ALL ON TABLE "public"."assessment_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_categories" TO "anon";
GRANT ALL ON TABLE "public"."assessment_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_categories" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_results" TO "anon";
GRANT ALL ON TABLE "public"."assessment_results" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_results" TO "service_role";



GRANT ALL ON TABLE "public"."assessments" TO "anon";
GRANT ALL ON TABLE "public"."assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."assessments" TO "service_role";



GRANT ALL ON TABLE "public"."assessments_enhanced" TO "anon";
GRANT ALL ON TABLE "public"."assessments_enhanced" TO "authenticated";
GRANT ALL ON TABLE "public"."assessments_enhanced" TO "service_role";



GRANT ALL ON TABLE "public"."challenge_participants" TO "anon";
GRANT ALL ON TABLE "public"."challenge_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."challenge_participants" TO "service_role";



GRANT ALL ON TABLE "public"."challenge_templates" TO "anon";
GRANT ALL ON TABLE "public"."challenge_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."challenge_templates" TO "service_role";



GRANT ALL ON TABLE "public"."challenge_types" TO "anon";
GRANT ALL ON TABLE "public"."challenge_types" TO "authenticated";
GRANT ALL ON TABLE "public"."challenge_types" TO "service_role";



GRANT ALL ON TABLE "public"."community_announcement_reads" TO "anon";
GRANT ALL ON TABLE "public"."community_announcement_reads" TO "authenticated";
GRANT ALL ON TABLE "public"."community_announcement_reads" TO "service_role";



GRANT ALL ON TABLE "public"."community_announcements" TO "anon";
GRANT ALL ON TABLE "public"."community_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."community_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."community_assessment_announcements" TO "anon";
GRANT ALL ON TABLE "public"."community_assessment_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."community_assessment_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."community_challenge_announcements" TO "anon";
GRANT ALL ON TABLE "public"."community_challenge_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."community_challenge_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."community_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."community_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."community_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."community_chat_rooms" TO "anon";
GRANT ALL ON TABLE "public"."community_chat_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."community_chat_rooms" TO "service_role";



GRANT ALL ON TABLE "public"."community_connections" TO "anon";
GRANT ALL ON TABLE "public"."community_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."community_connections" TO "service_role";



GRANT ALL ON TABLE "public"."community_quiz_announcements" TO "anon";
GRANT ALL ON TABLE "public"."community_quiz_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."community_quiz_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."couples_challenge_responses" TO "anon";
GRANT ALL ON TABLE "public"."couples_challenge_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."couples_challenge_responses" TO "service_role";



GRANT ALL ON TABLE "public"."couples_challenges" TO "anon";
GRANT ALL ON TABLE "public"."couples_challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."couples_challenges" TO "service_role";



GRANT ALL ON TABLE "public"."crystal_transactions" TO "anon";
GRANT ALL ON TABLE "public"."crystal_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."crystal_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."gamification_settings" TO "anon";
GRANT ALL ON TABLE "public"."gamification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."gamification_settings" TO "service_role";



GRANT ALL ON TABLE "public"."level_thresholds" TO "anon";
GRANT ALL ON TABLE "public"."level_thresholds" TO "authenticated";
GRANT ALL ON TABLE "public"."level_thresholds" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."models" TO "anon";
GRANT ALL ON TABLE "public"."models" TO "authenticated";
GRANT ALL ON TABLE "public"."models" TO "service_role";



GRANT ALL ON TABLE "public"."newme_assessment_tracking" TO "anon";
GRANT ALL ON TABLE "public"."newme_assessment_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."newme_assessment_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."newme_conversations" TO "anon";
GRANT ALL ON TABLE "public"."newme_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."newme_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."newme_emotional_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."newme_emotional_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."newme_emotional_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."newme_messages" TO "anon";
GRANT ALL ON TABLE "public"."newme_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."newme_messages" TO "service_role";



GRANT ALL ON TABLE "public"."newme_user_memories" TO "anon";
GRANT ALL ON TABLE "public"."newme_user_memories" TO "authenticated";
GRANT ALL ON TABLE "public"."newme_user_memories" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_templates" TO "anon";
GRANT ALL ON TABLE "public"."prompt_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_templates" TO "service_role";



GRANT ALL ON TABLE "public"."prompts" TO "anon";
GRANT ALL ON TABLE "public"."prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."prompts" TO "service_role";



GRANT ALL ON TABLE "public"."provider_api_keys" TO "anon";
GRANT ALL ON TABLE "public"."provider_api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."provider_credentials" TO "anon";
GRANT ALL ON TABLE "public"."provider_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."providers" TO "anon";
GRANT ALL ON TABLE "public"."providers" TO "authenticated";
GRANT ALL ON TABLE "public"."providers" TO "service_role";



GRANT ALL ON TABLE "public"."session_events" TO "anon";
GRANT ALL ON TABLE "public"."session_events" TO "authenticated";
GRANT ALL ON TABLE "public"."session_events" TO "service_role";



GRANT ALL ON TABLE "public"."session_mutes" TO "anon";
GRANT ALL ON TABLE "public"."session_mutes" TO "authenticated";
GRANT ALL ON TABLE "public"."session_mutes" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_transactions" TO "anon";
GRANT ALL ON TABLE "public"."subscription_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."user_assessment_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_assessment_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_assessment_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_memory_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_memory_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_memory_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_resource_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_resource_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_resource_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."voices" TO "anon";
GRANT ALL ON TABLE "public"."voices" TO "authenticated";
GRANT ALL ON TABLE "public"."voices" TO "service_role";



GRANT ALL ON TABLE "public"."wellness_resources" TO "anon";
GRANT ALL ON TABLE "public"."wellness_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."wellness_resources" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
