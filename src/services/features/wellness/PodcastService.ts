import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/lib/logging";

export interface Podcast {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  author: string;
  category: string;
  requires_premium: boolean;
  total_episodes: number;
  average_rating: number;
}

export interface PodcastEpisode {
  id: string;
  podcast_id: string;
  title: string;
  description: string;
  audio_url: string;
  duration_seconds: number;
  episode_number: number;
  release_date: string;
  is_free: boolean;
  requires_premium: boolean;
  average_rating: number;
  transcript?: string;
}

interface UserSubscription {
  podcasts: Podcast;
}

interface PlaybackHistoryItem {
  podcast_episodes: PodcastEpisode;
}

interface FavoriteEpisode {
  podcast_episodes: PodcastEpisode;
}

interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  is_public: boolean;
  episode_ids: string[];
}

interface Download {
  id: string;
  user_id: string;
  episode_id: string;
  download_status: 'pending' | 'downloading' | 'completed' | 'failed';
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
}


class PodcastService {
  /**
   * Get all featured podcasts
   */
  async getFeaturedPodcasts(): Promise<Podcast[]> {
    try {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("is_active", true)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError("Error fetching featured podcasts", error);
      throw error;
    }
  }

  /**
   * Get podcasts by category
   */
  async getPodcastsByCategory(category: string): Promise<Podcast[]> {
    try {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .order("total_downloads", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching podcasts for category ${category}`, error);
      throw error;
    }
  }

  /**
   * Search podcasts and episodes
   */
  async searchPodcasts(query: string): Promise<Podcast[]> {
    try {
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq("is_active", true)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error searching podcasts with query: ${query}`, error);
      throw error;
    }
  }

  /**
   * Get podcast episodes
   */
  async getEpisodes(podcastId: string): Promise<PodcastEpisode[]> {
    try {
      const { data, error } = await supabase
        .from("podcast_episodes")
        .select("*")
        .eq("podcast_id", podcastId)
        .eq("is_published", true)
        .order("release_date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logError(`Error fetching episodes for podcast ${podcastId}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to podcast
   */
  async subscribePodcast(userId: string, podcastId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_podcast_subscriptions")
        .upsert({
          user_id: userId,
          podcast_id: podcastId,
          is_active: true,
          notify_on_new: true
        });

      if (error) throw error;

      logInfo(`User ${userId} subscribed to podcast ${podcastId}`);
    } catch (error) {
      logError(`Error subscribing to podcast`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from podcast
   */
  async unsubscribePodcast(userId: string, podcastId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("user_podcast_subscriptions")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("podcast_id", podcastId);

      if (error) throw error;

      logInfo(`User ${userId} unsubscribed from podcast ${podcastId}`);
    } catch (error) {
      logError(`Error unsubscribing from podcast`, error);
      throw error;
    }
  }

  /**
   * Get user's podcast subscriptions
   */
  async getUserSubscriptions(userId: string): Promise<Podcast[]> {
    try {
      const { data, error } = await supabase
        .from("user_podcast_subscriptions")
        .select("podcasts(*)")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;

      return data?.map((sub: UserSubscription) => sub.podcasts).filter(Boolean) || [];
    } catch (error) {
      logError(`Error fetching podcast subscriptions for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Record episode playback
   */
  async recordPlayback(userId: string, episodeId: string, podcastId: string, positionSeconds: number): Promise<void> {
    try {
      const { error } = await supabase
        .from("podcast_playback")
        .upsert({
          user_id: userId,
          episode_id: episodeId,
          podcast_id: podcastId,
          last_position_seconds: positionSeconds,
          last_played_at: new Date().toISOString()
        });

      if (error) throw error;

      logInfo(`Playback recorded for user ${userId} episode ${episodeId}`);
    } catch (error) {
      logError(`Error recording playback`, error);
    }
  }

  /**
   * Mark episode as completed
   */
  async markEpisodeCompleted(userId: string, episodeId: string, podcastId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("podcast_playback")
        .upsert({
          user_id: userId,
          episode_id: episodeId,
          podcast_id: podcastId,
          is_completed: true,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;

      logInfo(`Episode ${episodeId} marked as completed for user ${userId}`);
    } catch (error) {
      logError(`Error marking episode as completed`, error);
    }
  }

  /**
   * Get playback history
   */
  async getPlaybackHistory(userId: string, limit: number = 50): Promise<PlaybackHistoryItem[]> {
    try {
      const { data, error } = await supabase
        .from("podcast_playback")
        .select("*, podcast_episodes(*)")
        .eq("user_id", userId)
        .order("last_played_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as PlaybackHistoryItem[]) || [];
    } catch (error) {
      logError(`Error fetching playback history for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Rate an episode
   */
  async rateEpisode(userId: string, episodeId: string, rating: number, review?: string): Promise<void> {
    try {
      if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");

      const { error } = await supabase
        .from("podcast_episode_ratings")
        .upsert({
          user_id: userId,
          episode_id: episodeId,
          rating,
          review_text: review
        });

      if (error) throw error;

      logInfo(`Episode ${episodeId} rated by user ${userId}`);
    } catch (error) {
      logError(`Error rating episode`, error);
      throw error;
    }
  }

  /**
   * Add episode to favorites
   */
  async addToFavorites(userId: string, episodeId: string, podcastId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("podcast_favorites")
        .insert({
          user_id: userId,
          episode_id: episodeId,
          podcast_id: podcastId,
          is_favorite: true
        });

      if (error && error.code !== "23505") throw error; // Ignore duplicate key errors

      logInfo(`Episode ${episodeId} added to favorites for user ${userId}`);
    } catch (error) {
      logError(`Error adding episode to favorites`, error);
    }
  }

  /**
   * Remove episode from favorites
   */
  async removeFromFavorites(userId: string, episodeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("podcast_favorites")
        .delete()
        .eq("user_id", userId)
        .eq("episode_id", episodeId);

      if (error) throw error;

      logInfo(`Episode ${episodeId} removed from favorites for user ${userId}`);
    } catch (error) {
      logError(`Error removing episode from favorites`, error);
    }
  }

  /**
   * Get user's favorite episodes
   */
  async getFavoriteEpisodes(userId: string): Promise<PodcastEpisode[]> {
    try {
      const { data, error } = await supabase
        .from("podcast_favorites")
        .select("podcast_episodes(*)")
        .eq("user_id", userId)
        .eq("is_favorite", true);

      if (error) throw error;

      return data?.map((fav: FavoriteEpisode) => fav.podcast_episodes).filter(Boolean) || [];
    } catch (error) {
      logError(`Error fetching favorite episodes for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Create podcast playlist
   */
  async createPlaylist(userId: string, title: string, description: string): Promise<Playlist | null> {
    try {
      const { data, error } = await supabase
        .from("podcast_playlists")
        .insert({
          user_id: userId,
          title,
          description,
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;

      logInfo(`Playlist created by user ${userId}`);
      return data as Playlist;
    } catch (error) {
      logError(`Error creating playlist`, error);
      throw error;
    }
  }

  /**
   * Add episode to playlist
   */
  async addToPlaylist(playlistId: string, episodeId: string): Promise<void> {
    try {
      const { data: playlist } = await supabase
        .from("podcast_playlists")
        .select("episode_ids")
        .eq("id", playlistId)
        .single();

      if (playlist) {
        const episodeIds = playlist.episode_ids || [];
        if (!episodeIds.includes(episodeId)) {
          episodeIds.push(episodeId);

          const { error } = await supabase
            .from("podcast_playlists")
            .update({ episode_ids: episodeIds })
            .eq("id", playlistId);

          if (error) throw error;
        }
      }

      logInfo(`Episode ${episodeId} added to playlist ${playlistId}`);
    } catch (error) {
      logError(`Error adding episode to playlist`, error);
    }
  }

  /**
   * Download episode for offline listening
   */
  async downloadEpisode(userId: string, episodeId: string): Promise<Download | null> {
    try {
      const { data, error } = await supabase
        .from("podcast_downloads")
        .insert({
          user_id: userId,
          episode_id: episodeId,
          download_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      logInfo(`Episode ${episodeId} queued for download by user ${userId}`);
      return data as Download;
    } catch (error) {
      logError(`Error downloading episode`, error);
      throw error;
    }
  }

  /**
   * Get podcast categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from("podcast_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data as Category[]) || [];
    } catch (error) {
      logError("Error fetching podcast categories", error);
      throw error;
    }
  }

  /**
   * Update playback quality preference
   */
  async setPlaybackQuality(userId: string, episodeId: string, quality: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("podcast_playback")
        .update({ playback_quality: quality })
        .eq("user_id", userId)
        .eq("episode_id", episodeId);

      if (error) throw error;

      logInfo(`Playback quality set to ${quality} for user ${userId}`);
    } catch (error) {
      logError(`Error setting playback quality`, error);
    }
  }

  /**
   * Get episode transcript
   */
  async getTranscript(episodeId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("podcast_episodes")
        .select("transcript")
        .eq("id", episodeId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data?.transcript || null;
    } catch (error) {
      logError(`Error fetching transcript for episode ${episodeId}`, error);
      return null;
    }
  }
}

export const podcastService = new PodcastService();
