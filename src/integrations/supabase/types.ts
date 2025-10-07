export * from './tables/user_profiles';
export * from './tables/level_thresholds';
export * from './tables/assessments_enhanced';
export * from './tables/assessment_attempts';
export * from './tables/ai_configurations';
export * from './tables/newme_conversations';
export * from './tables/newme_messages';
export * from './tables/newme_user_memories';
export * from './tables/newme_emotional_snapshots';
export * from './tables/newme_assessment_tracking';
export * from './tables/couples_challenges';
export * from './tables/community_connections';
export * from './tables/wellness_resources';
export * from './tables/subscriptions';
export * from './tables/providers';
export * from './tables/models';
export * from './tables/voices';
export * from './tables/prompts';
export * from './tables/agents';
export * from './tables/api_integrations';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4";
  };
  public: {
    Tables: {
      user_profiles: import('./tables/user_profiles').UserProfiles;
      level_thresholds: import('./tables/level_thresholds').LevelThresholds;
      assessments_enhanced: import('./tables/assessments_enhanced').AssessmentsEnhanced;
      assessment_attempts: import('./tables/assessment_attempts').AssessmentAttempts;
      ai_configurations: import('./tables/ai_configurations').AIConfigurations;
      newme_conversations: import('./tables/newme_conversations').NewMeConversations;
      newme_messages: import('./tables/newme_messages').NewMeMessages;
      newme_user_memories: import('./tables/newme_user_memories').NewMeUserMemories;
      newme_emotional_snapshots: import('./tables/newme_emotional_snapshots').NewMeEmotionalSnapshots;
      newme_assessment_tracking: import('./tables/newme_assessment_tracking').NewMeAssessmentTracking;
      couples_challenges: import('./tables/couples_challenges').CouplesChallenges;
      community_connections: import('./tables/community_connections').CommunityConnections;
      wellness_resources: import('./tables/wellness_resources').WellnessResources;
      subscriptions: import('./tables/subscriptions').Subscriptions;
      providers: import('./tables/providers').Providers;
      models: import('./tables/models').Models;
      voices: import('./tables/voices').Voices;
      prompts: import('./tables/prompts').Prompts;
      agents: import('./tables/agents').Agents;
      api_integrations: import('./tables/api_integrations').ApiIntegrations;
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};