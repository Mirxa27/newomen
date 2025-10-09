// Export types from individual table files
export * from './tables/agents';
export * from './tables/ai_behaviors';
export * from './tables/ai_configurations';
export * from './tables/ai_model_configs';
export * from './tables/ai_usage_logs';
export * from './tables/ai_use_cases';
export * from './tables/api_integrations';
export * from './tables/assessment_attempts';
export * from './tables/assessments_enhanced';
export * from './tables/assessment_results';
export * from './tables/challenge_templates';
export * from './tables/community_connections';
export * from './tables/couples_challenges';
export * from './tables/gamification_settings';
export * from './tables/level_thresholds';
export * from './tables/models';
export * from './tables/newme_assessment_tracking';
export * from './tables/newme_conversations';
export * from './tables/newme_emotional_snapshots';
export * from './tables/newme_messages';
export * from './tables/newme_user_memories';
export * from './tables/providers';
export * from './tables/prompts';
export * from './tables/subscriptions';
export * from './tables/user_achievements';
export * from './tables/user_assessment_progress';
export * from './tables/user_memory_profiles';
export * from './tables/user_profiles';
export * from './tables/voices';
export * from './tables/wellness_resources';
export * from './tables/affirmations';
export * from './tables/sessions';
export * from './tables/messages';
export * from './tables/ai_assessment_configs';
export * from './tables/prompt_templates';
export * from './tables/achievements';
export * from './tables/user_assessment_stats';


export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      agents: import('./tables/agents').Agents['Row'];
      ai_behaviors: import('./tables/ai_behaviors').AiBehaviors['Row'];
      ai_configurations: import('./tables/ai_configurations').AIConfigurations['Row'];
      ai_model_configs: import('./tables/ai_model_configs').AiModelConfigs['Row'];
      ai_usage_logs: import('./tables/ai_usage_logs').AiUsageLogs['Row'];
      ai_use_cases: import('./tables/ai_use_cases').AiUseCases['Row'];
      api_integrations: import('./tables/api_integrations').ApiIntegrations['Row'];
      assessment_attempts: import('./tables/assessment_attempts').AssessmentAttempts['Row'];
      assessments_enhanced: import('./tables/assessments_enhanced').AssessmentsEnhanced['Row'];
      assessment_results: import('./tables/assessment_results').AssessmentResults['Row'];
      challenge_templates: import('./tables/challenge_templates').ChallengeTemplates['Row'];
      community_connections: import('./tables/community_connections').CommunityConnections['Row'];
      couples_challenges: import('./tables/couples_challenges').CouplesChallenges['Row'];
      gamification_settings: import('./tables/gamification_settings').GamificationSettings['Row'];
      level_thresholds: import('./tables/level_thresholds').LevelThresholds['Row'];
      models: import('./tables/models').Models['Row'];
      newme_assessment_tracking: import('./tables/newme_assessment_tracking').NewmeAssessmentTracking['Row'];
      newme_conversations: import('./tables/newme_conversations').NewmeConversations['Row'];
      newme_emotional_snapshots: import('./tables/newme_emotional_snapshots').NewmeEmotionalSnapshots['Row'];
      newme_messages: import('./tables/newme_messages').NewmeMessages['Row'];
      newme_user_memories: import('./tables/newme_user_memories').NewmeUserMemories['Row'];
      providers: import('./tables/providers').Providers['Row'];
      prompts: import('./tables/prompts').Prompts['Row'];
      subscriptions: import('./tables/subscriptions').Subscriptions['Row'];
      user_achievements: import('./tables/user_achievements').UserAchievements['Row'];
      user_assessment_progress: import('./tables/user_assessment_progress').UserAssessmentProgress['Row'];
      user_assessment_stats: import('./tables/user_assessment_stats').UserAssessmentStats['Row'];
      user_memory_profiles: import('./tables/user_memory_profiles').UserMemoryProfiles['Row'];
      user_profiles: import('./tables/user_profiles').UserProfiles['Row'];
      voices: import('./tables/voices').Voices['Row'];
      wellness_resources: import('./tables/wellness_resources').WellnessResources['Row'];
      affirmations: import('./tables/affirmations').Affirmations['Row'];
      sessions: import('./tables/sessions').Sessions['Row'];
      messages: import('./tables/messages').Messages['Row'];
      ai_assessment_configs: import('./tables/ai_assessment_configs').AiAssessmentConfigs['Row'];
      prompt_templates: import('./tables/prompt_templates').PromptTemplates['Row'];
      achievements: import('./tables/achievements').Achievements['Row'];
      schema_migrations: {
        Row: { version: string; dirty: boolean };
        Insert: { version: string; dirty?: boolean };
        Update: { version?: string; dirty?: boolean };
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      get_newme_user_context: {
        Args: { p_user_id: string };
        Returns: Json;
      };
      increment_message_count: {
        Args: { conv_id: string };
        Returns: void;
      };
      get_ai_config_for_service: {
        Args: { p_service_type: string; p_service_id?: string | null };
        Returns: import('./tables/ai_configurations').AIConfigurations['Row'] | null;
      };
      store_provider_api_key: {
        Args: { p_provider_id: string; p_api_key: string };
        Returns: void;
      };
      check_ai_rate_limit: {
        Args: { p_user_id: string; p_provider_name: string; p_max_requests?: number; p_window_minutes?: number; };
        Returns: boolean;
      };
      increment_ai_rate_limit: {
        Args: { p_user_id: string; p_provider_name: string; p_max_requests?: number; p_window_minutes?: number; };
        Returns: void;
      };
      admin_get_user_profiles: {
        Args: { limit_count?: number; offset_count?: number; search_term?: string };
        Returns: Json;
      };
      admin_update_user_profile: {
        Args: {
          target_user_id: string;
          new_role?: string;
          new_subscription_tier?: string;
          new_remaining_minutes?: number;
          new_nickname?: string
        };
        Returns: Json;
      };
      create_schema_migrations_table: {
        Args: Record<string, never>;
        Returns: void;
      };
      execute_sql: {
        Args: { query: string };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">]
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never
