import { supabase } from "@/integrations/supabase/client";

/**
 * Track daily login for gamification
 * Awards crystals and updates daily streak
 */
export async function trackDailyLogin(userId: string): Promise<void> {
  try {
    // Get current profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("last_login, daily_streak")
      .eq("user_id", userId)
      .single();

    if (!profile) return;

    const now = new Date();
    const lastLogin = profile.last_login ? new Date(profile.last_login) : null;
    
    let newStreak = profile.daily_streak || 0;
    
    // Check if it's a new day
    if (lastLogin) {
      const daysDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Consecutive day - increment streak
        newStreak += 1;
      } else if (daysDiff > 1) {
        // Streak broken - reset to 1
        newStreak = 1;
      }
      // If daysDiff === 0, same day - no change
    } else {
      // First login
      newStreak = 1;
    }

    // Update profile
    await supabase
      .from("user_profiles")
      .update({
        last_login: now.toISOString(),
        daily_streak: newStreak
      })
      .eq("user_id", userId);

    // Award crystals for daily login (5 crystals)
    await supabase.rpc("award_crystals", {
      p_user_id: userId,
      p_amount: 5,
      p_source: "daily_login",
      p_description: "Daily login bonus"
    });

    // Check for streak achievements
    await supabase.rpc("check_achievements", { p_user_id: userId });
  } catch (error) {
    console.error("Error tracking daily login:", error);
  }
}

/**
 * Track assessment completion
 * Awards crystals and checks achievements
 */
export async function trackAssessmentCompletion(
  userId: string,
  assessmentId: string
): Promise<void> {
  try {
    // Award crystals (10 crystals per assessment)
    await supabase.rpc("award_crystals", {
      p_user_id: userId,
      p_amount: 10,
      p_source: "assessment",
      p_description: "Assessment completed",
      p_related_entity_id: assessmentId,
      p_related_entity_type: "assessment"
    });

    // Check for achievements
    await supabase.rpc("check_achievements", { p_user_id: userId });
  } catch (error) {
    console.error("Error tracking assessment completion:", error);
  }
}

/**
 * Track conversation completion
 * Awards crystals and checks achievements
 */
export async function trackConversationCompletion(
  userId: string,
  conversationId: string
): Promise<void> {
  try {
    // Award crystals (15 crystals per conversation)
    await supabase.rpc("award_crystals", {
      p_user_id: userId,
      p_amount: 15,
      p_source: "conversation",
      p_description: "Conversation completed",
      p_related_entity_id: conversationId,
      p_related_entity_type: "conversation"
    });

    // Check for achievements
    await supabase.rpc("check_achievements", { p_user_id: userId });
  } catch (error) {
    console.error("Error tracking conversation completion:", error);
  }
}

/**
 * Track narrative exploration completion
 * Awards crystals and checks achievements
 */
export async function trackNarrativeExplorationCompletion(
  userId: string
): Promise<void> {
  try {
    // Award crystals (30 crystals for narrative exploration)
    await supabase.rpc("award_crystals", {
      p_user_id: userId,
      p_amount: 30,
      p_source: "narrative_exploration",
      p_description: "Narrative Identity Exploration completed"
    });

    // Check for achievements
    await supabase.rpc("check_achievements", { p_user_id: userId });
  } catch (error) {
    console.error("Error tracking narrative exploration:", error);
  }
}

/**
 * Track wellness resource completion
 * Awards crystals and checks achievements
 */
export async function trackWellnessResourceCompletion(
  userId: string,
  resourceId: string
): Promise<void> {
  try {
    // Award crystals (8 crystals per wellness resource)
    await supabase.rpc("award_crystals", {
      p_user_id: userId,
      p_amount: 8,
      p_source: "wellness_resource",
      p_description: "Wellness resource completed",
      p_related_entity_id: resourceId,
      p_related_entity_type: "wellness_resource"
    });

    // Check for achievements
    await supabase.rpc("check_achievements", { p_user_id: userId });
  } catch (error) {
    console.error("Error tracking wellness resource completion:", error);
  }
}
