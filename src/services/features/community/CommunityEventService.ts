import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/lib/logging";

export interface CommunityEvent {
  id: string;
  community_id: string;
  created_by_user_id: string;
  title: string;
  description: string;
  event_type: string;
  image_url?: string;
  start_date: string;
  end_date: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  max_attendees?: number;
  is_online: boolean;
  online_meeting_url?: string;
  is_approved: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  rsvp_status: 'going' | 'interested' | 'declined' | 'maybe';
  is_checked_in: boolean;
  created_at: string;
}

export interface CommunityChallenge {
  id: string;
  community_id: string;
  title: string;
  description: string;
  challenge_type: string;
  goal: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface ChallengeParticipant {
    id: string;
    challenge_id: string;
    user_id: string;
    current_value: number;
    created_at: string;
}

export interface UserProfileBasic {
    first_name: string;
    last_name: string;
    avatar_url: string;
}

export interface ChallengeParticipantWithProfile extends ChallengeParticipant {
    user_profiles: UserProfileBasic;
}

export interface CommunityResource {
    id: string;
    community_id: string;
    created_by_user_id: string;
    title: string;
    description: string;
    resource_type: string;
    resource_url: string;
    is_approved: boolean;
    created_at: string;
}

export interface CommunityGuideline {
    id: string;
    community_id: string;
    title: string;
    content: string;
    is_active: boolean;
    display_order: number;
    created_at: string;
}

class CommunityEventService {
  /**
   * Get community events
   */
  async getEvents(communityId: string): Promise<CommunityEvent[]> {
    try {
      const { data, error } = await supabase
        .from("community_events")
        .select("*")
        .eq("community_id", communityId)
        .eq("is_approved", true)
        .eq("status", "upcoming")
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching events for community ${communityId}`, error as Error);
      throw error;
    }
  }

  /**
   * Create event
   */
  async createEvent(
    communityId: string,
    userId: string,
    eventData: Partial<CommunityEvent>
  ): Promise<CommunityEvent> {
    try {
      const { data, error } = await supabase
        .from("community_events")
        .insert({
          community_id: communityId,
          created_by_user_id: userId,
          ...eventData
        })
        .select()
        .single();

      if (error) throw error;

      logInfo(`Event created: ${eventData.title}`);
      return data;
    } catch (error) {
      logError("Error creating event", error as Error);
      throw error;
    }
  }

  /**
   * RSVP to event
   */
  async rsvpEvent(userId: string, eventId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("event_attendees")
        .upsert({
          user_id: userId,
          event_id: eventId,
          rsvp_status: status
        });

      if (error) throw error;

      logInfo(`User ${userId} RSVPd to event ${eventId}: ${status}`);
    } catch (error) {
      logError("Error RSVPing to event", error as Error);
      throw error;
    }
  }

  /**
   * Get event attendees
   */
  async getEventAttendees(eventId: string): Promise<EventAttendee[]> {
    try {
      const { data, error } = await supabase
        .from("event_attendees")
        .select("*")
        .eq("event_id", eventId)
        .eq("rsvp_status", "going");

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching attendees for event ${eventId}`, error as Error);
      throw error;
    }
  }

  /**
   * Check in to event
   */
  async checkInEvent(userId: string, eventId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("event_attendees")
        .update({
          is_checked_in: true,
          check_in_time: new Date().toISOString()
        })
        .eq("user_id", userId)
        .eq("event_id", eventId);

      if (error) throw error;

      logInfo(`User ${userId} checked in to event ${eventId}`);
    } catch (error) {
      logError("Error checking in to event", error as Error);
      throw error;
    }
  }

  /**
   * Get community challenges
   */
  async getChallenges(communityId: string): Promise<CommunityChallenge[]> {
    try {
      const { data, error } = await supabase
        .from("community_challenges")
        .select("*")
        .eq("community_id", communityId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching challenges for community ${communityId}`, error as Error);
      throw error;
    }
  }

  /**
   * Join challenge
   */
  async joinChallenge(userId: string, challengeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("challenge_participants")
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          current_value: 0
        });

      if (error) throw error;

      logInfo(`User ${userId} joined challenge ${challengeId}`);
    } catch (error) {
      logError("Error joining challenge", error as Error);
      throw error;
    }
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(userId: string, challengeId: string, value: number): Promise<void> {
    try {
      const { error } = await supabase
        .from("challenge_participants")
        .update({ current_value: value })
        .eq("user_id", userId)
        .eq("challenge_id", challengeId);

      if (error) throw error;

      logInfo(`Challenge progress updated for user ${userId}`);
    } catch (error) {
      logError("Error updating challenge progress", error as Error);
      throw error;
    }
  }

  /**
   * Get challenge leaderboard
   */
  async getChallengeLeaderboard(challengeId: string): Promise<ChallengeParticipantWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from("challenge_participants")
        .select("*, user_profiles!inner(first_name, last_name, avatar_url)")
        .eq("challenge_id", challengeId)
        .order("current_value", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching leaderboard for challenge ${challengeId}`, error as Error);
      throw error;
    }
  }

  /**
   * Review event
   */
  async reviewEvent(userId: string, eventId: string, rating: number, review: string): Promise<void> {
    try {
      if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");

      const { error } = await supabase
        .from("event_reviews")
        .upsert({
          user_id: userId,
          event_id: eventId,
          rating,
          review_text: review
        });

      if (error) throw error;

      logInfo(`Event reviewed by user ${userId}`);
    } catch (error) {
      logError("Error reviewing event", error as Error);
      throw error;
    }
  }

  /**
   * Report community content
   */
  async reportContent(
    userId: string,
    contentType: string,
    contentId: string,
    reason: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("community_reports")
        .insert({
          reported_by_user_id: userId,
          reported_content_type: contentType,
          reported_content_id: contentId,
          reason
        });

      if (error) throw error;

      logInfo(`Content reported by user ${userId}`);
    } catch (error) {
      logError("Error reporting content", error as Error);
      throw error;
    }
  }

  /**
   * Get community resources
   */
  async getResources(communityId: string): Promise<CommunityResource[]> {
    try {
      const { data, error } = await supabase
        .from("community_resources")
        .select("*")
        .eq("community_id", communityId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching resources for community ${communityId}`, error as Error);
      throw error;
    }
  }

  /**
   * Get community guidelines
   */
  async getGuidelines(communityId: string): Promise<CommunityGuideline[]> {
    try {
      const { data, error } = await supabase
        .from("community_guidelines")
        .select("*")
        .eq("community_id", communityId)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching guidelines for community ${communityId}`, error as Error);
      throw error;
    }
  }
}

export const communityEventService = new CommunityEventService();
