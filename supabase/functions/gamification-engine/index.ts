import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

console.log("Gamification Engine Function Started");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, payload } = await req.json();
    const supabaseClient = createClient(
      Deno.env.get("PROJECT_SUPABASE_URL") ?? "",
      Deno.env.get("PROJECT_SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      },
    );

    console.log(`Received event: ${type} with payload:`, payload);

    let userId: string;
    if (payload.userId) {
      userId = payload.userId;
    } else if (payload.record && payload.record.user_id) {
      userId = payload.record.user_id;
    } else {
      throw new Error("User ID not found in payload");
    }

    switch (type) {
      case "complete_assessment":
        await handleAssessmentCompletion(supabaseClient, userId, payload);
        break;
      case "daily_login":
        await handleDailyLogin(supabaseClient, userId);
        break;
      case "complete_conversation":
        await handleConversationCompletion(supabaseClient, userId, payload);
        break;
      case "complete_narrative_exploration":
        await handleNarrativeExplorationCompletion(supabaseClient, userId, payload);
        break;
      case "complete_couples_challenge":
        await handleCouplesChallengeCompletion(supabaseClient, userId, payload);
        break;
      case "complete_wellness_resource":
        await handleWellnessResourceCompletion(supabaseClient, userId, payload);
        break;
      case "make_connection":
        await handleMakeConnection(supabaseClient, userId, payload);
        break;
      default:
        console.warn(`Unhandled event type: ${type}`);
        return new Response(JSON.stringify({ message: "Unhandled event type" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // After any event, check for achievements
    await checkAndAwardAchievements(supabaseClient, userId);

    return new Response(JSON.stringify({ message: "Gamification event processed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing gamification event:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleAssessmentCompletion(supabase: any, userId: string, payload: any) {
  const { assessmentId, score } = payload;
  const crystalReward = 20; // Example reward

  console.log(`Handling assessment completion for user ${userId}, assessment ${assessmentId}`);

  // Award crystals
  const { error: crystalError } = await supabase.rpc("award_crystals", {
    p_user_id: userId,
    p_amount: crystalReward,
    p_source: "assessment_completion",
    p_description: `Completed assessment: ${assessmentId}`,
    p_related_entity_id: assessmentId,
    p_related_entity_type: "assessment",
  });

  if (crystalError) {
    console.error("Error awarding crystals for assessment:", crystalError);
    throw crystalError;
  }

  // Update user's assessment count for achievement tracking
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("assessment_count")
    .eq("user_id", userId)
    .single();

  if (profileError) {
    console.error("Error fetching user profile for assessment count:", profileError);
    throw profileError;
  }

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ assessment_count: (userProfile?.assessment_count || 0) + 1 })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error updating assessment count:", updateError);
    throw updateError;
  }

  console.log(`User ${userId} awarded ${crystalReward} crystals for assessment completion.`);
}

async function handleDailyLogin(supabase: any, userId: string) {
  const crystalReward = 10; // Example reward for daily login
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("last_login_at, daily_streak")
    .eq("user_id", userId)
    .single();

  if (profileError) {
    console.error("Error fetching user profile for daily login:", profileError);
    throw profileError;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastLogin = userProfile?.last_login_at ? new Date(userProfile.last_login_at) : null;
  lastLogin?.setHours(0, 0, 0, 0);

  let newDailyStreak = userProfile?.daily_streak || 0;
  let awardedBonus = false;

  if (!lastLogin || lastLogin.toDateString() !== today.toDateString()) {
    // Not logged in today yet
    if (lastLogin && (today.getTime() - lastLogin.getTime()) === (24 * 60 * 60 * 1000)) {
      // Consecutive day
      newDailyStreak++;
    } else {
      // First login or streak broken
      newDailyStreak = 1;
    }

    // Award crystals for daily login
    const { error: crystalError } = await supabase.rpc("award_crystals", {
      p_user_id: userId,
      p_amount: crystalReward,
      p_source: "daily_login",
      p_description: `Daily login bonus. Streak: ${newDailyStreak} days`,
    });

    if (crystalError) {
      console.error("Error awarding crystals for daily login:", crystalError);
      throw crystalError;
    }
    awardedBonus = true;
  }

  // Update last_login_at and daily_streak
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({
      last_login_at: new Date().toISOString(),
      daily_streak: newDailyStreak,
    })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error updating user profile for daily login:", updateError);
    throw updateError;
  }

  console.log(`User ${userId} daily login processed. Streak: ${newDailyStreak}. Bonus awarded: ${awardedBonus}`);
}

async function handleConversationCompletion(supabase: any, userId: string, payload: any) {
  const { conversationId } = payload;
  const crystalReward = 15; // Example reward

  console.log(`Handling conversation completion for user ${userId}, conversation ${conversationId}`);

  const { error: crystalError } = await supabase.rpc("award_crystals", {
    p_user_id: userId,
    p_amount: crystalReward,
    p_source: "conversation_completion",
    p_description: `Completed conversation: ${conversationId}`,
    p_related_entity_id: conversationId,
    p_related_entity_type: "conversation",
  });

  if (crystalError) {
    console.error("Error awarding crystals for conversation:", crystalError);
    throw crystalError;
  }

  // Update user's conversation count for achievement tracking
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("conversation_count")
    .eq("user_id", userId)
    .single();

  if (profileError) {
    console.error("Error fetching user profile for conversation count:", profileError);
    throw profileError;
  }

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ conversation_count: (userProfile?.conversation_count || 0) + 1 })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error updating conversation count:", updateError);
    throw updateError;
  }

  console.log(`User ${userId} awarded ${crystalReward} crystals for conversation completion.`);
}

async function handleNarrativeExplorationCompletion(supabase: any, userId: string, payload: any) {
  const { explorationId } = payload;
  const crystalReward = 30; // Example reward

  console.log(`Handling narrative exploration completion for user ${userId}, exploration ${explorationId}`);

  const { error: crystalError } = await supabase.rpc("award_crystals", {
    p_user_id: userId,
    p_amount: crystalReward,
    p_source: "narrative_exploration_completion",
    p_description: `Completed narrative exploration: ${explorationId}`,
    p_related_entity_id: explorationId,
    p_related_entity_type: "narrative_exploration",
  });

  if (crystalError) {
    console.error("Error awarding crystals for narrative exploration:", crystalError);
    throw crystalError;
  }

  // Update user's narrative exploration count for achievement tracking
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("narrative_exploration_count")
    .eq("user_id", userId)
    .single();

  if (profileError) {
    console.error("Error fetching user profile for narrative exploration count:", profileError);
    throw profileError;
  }

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ narrative_exploration_count: (userProfile?.narrative_exploration_count || 0) + 1 })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error updating narrative exploration count:", updateError);
    throw updateError;
  }

  console.log(`User ${userId} awarded ${crystalReward} crystals for narrative exploration completion.`);
}

async function handleCouplesChallengeCompletion(supabase: any, userId: string, payload: any) {
  const { challengeId } = payload;
  const crystalReward = 25; // Example reward

  console.log(`Handling couples challenge completion for user ${userId}, challenge ${challengeId}`);

  const { error: crystalError } = await supabase.rpc("award_crystals", {
    p_user_id: userId,
    p_amount: crystalReward,
    p_source: "couples_challenge_completion",
    p_description: `Completed couples challenge: ${challengeId}`,
    p_related_entity_id: challengeId,
    p_related_entity_type: "couples_challenge",
  });

  if (crystalError) {
    console.error("Error awarding crystals for couples challenge:", crystalError);
    throw crystalError;
  }

  // Update user's couples challenge count for achievement tracking
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("couples_challenge_count")
    .eq("user_id", userId)
    .single();

  if (profileError) {
    console.error("Error fetching user profile for couples challenge count:", profileError);
    throw profileError;
  }

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ couples_challenge_count: (userProfile?.couples_challenge_count || 0) + 1 })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error updating couples challenge count:", updateError);
    throw updateError;
  }

  console.log(`User ${userId} awarded ${crystalReward} crystals for couples challenge completion.`);
}

async function handleWellnessResourceCompletion(supabase: any, userId: string, payload: any) {
  const { resourceId } = payload;
  const crystalReward = 10; // Example reward

  console.log(`Handling wellness resource completion for user ${userId}, resource ${resourceId}`);

  const { error: crystalError } = await supabase.rpc("award_crystals", {
    p_user_id: userId,
    p_amount: crystalReward,
    p_source: "wellness_resource_completion",
    p_description: `Completed wellness resource: ${resourceId}`,
    p_related_entity_id: resourceId,
    p_related_entity_type: "wellness_resource",
  });

  if (crystalError) {
    console.error("Error awarding crystals for wellness resource:", crystalError);
    throw crystalError;
  }

  // Update user's wellness resource count for achievement tracking
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("wellness_resource_count")
    .eq("user_id", userId)
    .single();

  if (profileError) {
    console.error("Error fetching user profile for wellness resource count:", profileError);
    throw profileError;
  }

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ wellness_resource_count: (userProfile?.wellness_resource_count || 0) + 1 })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error updating wellness resource count:", updateError);
    throw updateError;
  }

  console.log(`User ${userId} awarded ${crystalReward} crystals for wellness resource completion.`);
}

async function handleMakeConnection(supabase: any, userId: string, payload: any) {
  const { connectionId } = payload;
  const crystalReward = 5; // Example reward

  console.log(`Handling new connection for user ${userId}, connection ${connectionId}`);

  const { error: crystalError } = await supabase.rpc("award_crystals", {
    p_user_id: userId,
    p_amount: crystalReward,
    p_source: "make_connection",
    p_description: `Made a new connection: ${connectionId}`,
    p_related_entity_id: connectionId,
    p_related_entity_type: "connection",
  });

  if (crystalError) {
    console.error("Error awarding crystals for connection:", crystalError);
    throw crystalError;
  }

  // Update user's connection count for achievement tracking
  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("connection_count")
    .eq("user_id", userId)
    .single();

  if (profileError) {
    console.error("Error fetching user profile for connection count:", profileError);
    throw profileError;
  }

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ connection_count: (userProfile?.connection_count || 0) + 1 })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Error updating connection count:", updateError);
    throw updateError;
  }

  console.log(`User ${userId} awarded ${crystalReward} crystals for making a connection.`);
}

async function checkAndAwardAchievements(supabase: any, userId: string) {
  console.log(`Checking achievements for user: ${userId}`);
  const { error } = await supabase.rpc("check_achievements", { p_user_id: userId });
  if (error) {
    console.error("Error checking and awarding achievements:", error);
    throw error;
  }
  console.log(`Achievements checked for user: ${userId}`);
}
