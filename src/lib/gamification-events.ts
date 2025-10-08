import { supabase } from "@/integrations/supabase/client";

const triggerGamificationEvent = async (eventType: string, payload: Record<string, unknown> = {}) => {
  try {
    const { data, error } = await supabase.functions.invoke("gamification-engine", {
      body: {
        type: eventType,
        payload: payload,
      },
    });

    if (error) {
      console.error(`Error triggering gamification event ${eventType}:`, error);
      return { success: false, error };
    }

    console.log(`Gamification event ${eventType} triggered successfully:`, data);
    return { success: true, data };
  } catch (error: unknown) {
    console.error(`Exception triggering gamification event ${eventType}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const trackAssessmentCompletion = async (userId: string, assessmentId: string, score: number) => {
  return triggerGamificationEvent("complete_assessment", { userId, assessmentId, score });
};

export const trackDailyLogin = async (userId: string) => {
  return triggerGamificationEvent("daily_login", { userId });
};

export const trackConversationCompletion = async (userId: string, conversationId: string) => {
  return triggerGamificationEvent("complete_conversation", { userId, conversationId });
};

export const trackNarrativeExplorationCompletion = async (userId: string, explorationId: string) => {
  return triggerGamificationEvent("complete_narrative_exploration", { userId, explorationId });
};

export const trackCouplesChallengeCompletion = async (userId: string, challengeId: string) => {
  return triggerGamificationEvent("complete_couples_challenge", { userId, challengeId });
};

export const trackWellnessResourceCompletion = async (userId: string, resourceId: string) => {
  return triggerGamificationEvent("complete_wellness_resource", { userId, resourceId });
};

export const trackMakeConnection = async (userId: string, connectionId: string) => {
  return triggerGamificationEvent("make_connection", { userId, connectionId });
};
