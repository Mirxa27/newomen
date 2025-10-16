import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/lib/logging";

export interface BuddyRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
}

export interface BuddyPair {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: 'active' | 'paused' | 'ended';
  started_at: string;
  goals: string[];
  check_in_frequency: 'daily' | 'weekly' | 'monthly';
}

export interface BuddyMessage {
    id: string;
    from_user_id: string;
    to_user_id: string;
    message_text: string;
    is_read: boolean;
    created_at: string;
}

export interface BuddyChallenge {
    id: string;
    user_a_id: string;
    user_b_id: string;
    goal: string;
    duration_days: number;
    start_date: string;
    end_date: string;
    status: 'active' | 'completed' | 'cancelled';
}

export interface BuddyCheckin {
    id: string;
    challenge_id: string;
    user_id: string;
    notes: string;
    check_in_date: string;
}

export interface BuddyChallengeWithCheckins extends BuddyChallenge {
    buddy_checkins: BuddyCheckin[];
}

export interface BuddyInsights {
    totalChallenges: number;
    completedChallenges: number;
    completionRate: number;
    totalCheckIns: number;
    avgCheckInsPerChallenge: number;
}

export interface BuddyRecommendation {
    user_id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    goals: string[];
}

class BuddyService {
  /**
   * Send buddy request
   */
  async sendBuddyRequest(fromUserId: string, toUserId: string): Promise<BuddyRequest> {
    try {
      if (fromUserId === toUserId) {
        throw new Error("Cannot send buddy request to yourself");
      }

      const { data, error } = await supabase
        .from("buddy_requests")
        .insert({
          requester_id: fromUserId,
          receiver_id: toUserId,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      logInfo(`Buddy request sent from ${fromUserId} to ${toUserId}`);
      return data;
    } catch (error) {
      logError("Error sending buddy request", error);
      throw error;
    }
  }

  /**
   * Accept buddy request
   */
  async acceptBuddyRequest(requestId: string, userId: string): Promise<void> {
    try {
      const { data: request } = await supabase
        .from("buddy_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (!request || request.receiver_id !== userId) {
        throw new Error("Invalid buddy request");
      }

      // Update request status
      await supabase
        .from("buddy_requests")
        .update({ status: 'accepted' })
        .eq("id", requestId);

      // Create buddy pair
      await supabase
        .from("buddy_pairs")
        .insert({
          user_a_id: request.requester_id,
          user_b_id: request.receiver_id,
          status: 'active',
          check_in_frequency: 'weekly'
        });

      logInfo(`Buddy request ${requestId} accepted`);
    } catch (error) {
      logError("Error accepting buddy request", error);
      throw error;
    }
  }

  /**
   * Reject buddy request
   */
  async rejectBuddyRequest(requestId: string, userId: string): Promise<void> {
    try {
      const { data: request } = await supabase
        .from("buddy_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (!request || request.receiver_id !== userId) {
        throw new Error("Invalid buddy request");
      }

      await supabase
        .from("buddy_requests")
        .update({ status: 'rejected' })
        .eq("id", requestId);

      logInfo(`Buddy request ${requestId} rejected`);
    } catch (error) {
      logError("Error rejecting buddy request", error);
      throw error;
    }
  }

  /**
   * Get pending buddy requests
   */
  async getPendingRequests(userId: string): Promise<BuddyRequest[]> {
    try {
      const { data, error } = await supabase
        .from("buddy_requests")
        .select("*")
        .eq("receiver_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching pending requests for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get user's buddy pairs
   */
  async getBuddyPairs(userId: string): Promise<BuddyPair[]> {
    try {
      const { data, error } = await supabase
        .from("buddy_pairs")
        .select("*")
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .eq("status", "active");

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching buddy pairs for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Send message to buddy
   */
  async sendMessage(fromUserId: string, toUserId: string, message: string): Promise<BuddyMessage> {
    try {
      const { data, error } = await supabase
        .from("buddy_messages")
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          message_text: message,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      logInfo(`Message sent from ${fromUserId} to ${toUserId}`);
      return data;
    } catch (error) {
      logError("Error sending buddy message", error);
      throw error;
    }
  }

  /**
   * Get messages with buddy
   */
  async getMessages(userId: string, buddyId: string): Promise<BuddyMessage[]> {
    try {
      const { data, error } = await supabase
        .from("buddy_messages")
        .select("*")
        .or(`and(from_user_id.eq.${userId},to_user_id.eq.${buddyId}),and(from_user_id.eq.${buddyId},to_user_id.eq.${userId})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching messages between users`, error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("buddy_messages")
        .update({ is_read: true })
        .eq("id", messageId);

      if (error) throw error;

      logInfo(`Message ${messageId} marked as read`);
    } catch (error) {
      logError("Error marking message as read", error);
    }
  }

  /**
   * Create accountability challenge
   */
  async createChallenge(userId: string, buddyId: string, goal: string, durationDays: number): Promise<BuddyChallenge> {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      const { data, error } = await supabase
        .from("buddy_challenges")
        .insert({
          user_a_id: userId,
          user_b_id: buddyId,
          goal,
          duration_days: durationDays,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      logInfo(`Challenge created between ${userId} and ${buddyId}`);
      return data;
    } catch (error) {
      logError("Error creating buddy challenge", error);
      throw error;
    }
  }

  /**
   * Check in on challenge
   */
  async checkInChallenge(challengeId: string, userId: string, notes: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("buddy_checkins")
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          notes,
          check_in_date: new Date().toISOString()
        });

      if (error) throw error;

      logInfo(`Check-in recorded for user ${userId} on challenge ${challengeId}`);
    } catch (error) {
      logError("Error recording check-in", error);
      throw error;
    }
  }

  /**
   * Get challenge progress
   */
  async getChallengeProgress(challengeId: string): Promise<BuddyChallengeWithCheckins> {
    try {
      const { data, error } = await supabase
        .from("buddy_challenges")
        .select("*, buddy_checkins(*)")
        .eq("id", challengeId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logError(`Error fetching challenge progress for ${challengeId}`, error);
      throw error;
    }
  }

  /**
   * End buddy partnership
   */
  async endBuddyPartnership(pairId: string, userId: string): Promise<void> {
    try {
      const { data: pair } = await supabase
        .from("buddy_pairs")
        .select("*")
        .eq("id", pairId)
        .single();

      if (!pair || (pair.user_a_id !== userId && pair.user_b_id !== userId)) {
        throw new Error("Invalid buddy pair");
      }

      await supabase
        .from("buddy_pairs")
        .update({ status: 'ended' })
        .eq("id", pairId);

      logInfo(`Buddy partnership ${pairId} ended by user ${userId}`);
    } catch (error) {
      logError("Error ending buddy partnership", error);
      throw error;
    }
  }

  /**
   * Get buddy insights/statistics
   */
  async getBuddyInsights(userId: string, buddyId: string): Promise<BuddyInsights> {
    try {
      const { data: challenges } = await supabase
        .from("buddy_challenges")
        .select("*, buddy_checkins(*)")
        .or(`and(user_a_id.eq.${userId},user_b_id.eq.${buddyId}),and(user_a_id.eq.${buddyId},user_b_id.eq.${userId})`);

      const totalChallenges = challenges?.length || 0;
      const completedChallenges = challenges?.filter(c => c.status === 'completed').length || 0;
      const totalCheckIns = challenges?.reduce((sum, c) => sum + (c.buddy_checkins?.length || 0), 0) || 0;

      return {
        totalChallenges,
        completedChallenges,
        completionRate: totalChallenges > 0 ? (completedChallenges / totalChallenges) * 100 : 0,
        totalCheckIns,
        avgCheckInsPerChallenge: totalChallenges > 0 ? totalCheckIns / totalChallenges : 0
      };
    } catch (error) {
      logError("Error fetching buddy insights", error);
      throw error;
    }
  }

  /**
   * Recommend buddy matches (based on goals, interests)
   */
  async getBuddyRecommendations(userId: string): Promise<BuddyRecommendation[]> {
    try {
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("goals")
        .eq("user_id", userId)
        .single();

      if (!userProfile?.goals) return [];

      // Find users with similar goals
      const { data: recommendations } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name, avatar_url, goals")
        .neq("user_id", userId)
        .contains("goals", userProfile.goals)
        .limit(10);

      return recommendations || [];
    } catch (error) {
      logError(`Error fetching buddy recommendations for user ${userId}`, error);
      throw error;
    }
  }
}

export const buddyService = new BuddyService();
