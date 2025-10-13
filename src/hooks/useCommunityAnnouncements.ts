import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CommunityAnnouncement {
  id: string;
  title: string;
  content: string;
  announcement_type: 'general' | 'challenge' | 'assessment' | 'quiz' | 'maintenance' | 'feature';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_audience: 'all' | 'discovery' | 'growth' | 'transformation' | 'premium';
  is_active: boolean;
  scheduled_at?: string;
  expires_at?: string;
  created_at: string;
  created_by?: string;
  author_info?: {
    nickname: string;
    avatar_url: string;
  };
}

export interface CommunityChallengeAnnouncement {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  reward_crystals: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  challenge_id?: string;
  challenge_type: 'daily' | 'weekly' | 'monthly' | 'special';
}

export interface AnnouncementFilters {
  type?: string;
  priority?: string;
  target?: string;
  active?: boolean;
}

export function useCommunityAnnouncements(filters?: AnnouncementFilters) {
  const [announcements, setAnnouncements] = useState<CommunityAnnouncement[]>([]);
  const [challenges, setChallenges] = useState<CommunityChallengeAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch regular announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('community_announcements')
        .select(`
          *,
          author_info:user_profiles!community_announcements_created_by_fkey(nickname, avatar_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Cast response into our local type for stronger typing
      const announcementsData = (data as unknown) as CommunityAnnouncement[];

      if (error) throw error;

      // Filter out expired announcements
      const now = new Date().toISOString();
      const validAnnouncements = (announcementsData || []).filter(ann => 
        !ann.expires_at || new Date(ann.expires_at) > new Date(now)
      );

      setAnnouncements(validAnnouncements);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch challenge announcements
  const fetchChallenges = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('community_challenge_announcements')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      // Cast to our local challenge announcement type
      const challengesData = (data as unknown) as CommunityChallengeAnnouncement[];

      if (error) throw error;

      // Filter current and upcoming challenges
      const now = new Date().toISOString();
      const validChallenges = (challengesData || []).filter(challenge => 
        !challenge.end_date || new Date(challenge.end_date) > new Date(now)
      );

      setChallenges(validChallenges);
    } catch (err) {
      console.error('Error fetching challenges:', err);
    }
  }, []);

  // Calculate unread announcements count
  const calculateUnreadCount = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: reads, error: readsError } = await supabase
        .from('community_announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id);

      const readsData = (reads as unknown) as { announcement_id: string }[] | null;

      if (readsError) throw readsError;

      const readIds = new Set((readsData || []).map(r => r.announcement_id));

      // Count unread announcements
      const unreadAnnouncements = announcements.filter(ann => 
        !readIds.has(ann.id) && (!readIds.has(ann.id) || ann.priority === 'high' || ann.priority === 'urgent')
      );

      setUnreadCount(unreadAnnouncements.length);
    } catch (err) {
      console.error('Error calculating unread count:', err);
    }
  }, [announcements]);

  const markAsRead = useCallback(async (announcementId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('community_announcement_reads')
        .insert({
          announcement_id: announcementId,
          user_id: user.id
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error marking announcement as read:', error);
      }
    } catch (err) {
      console.error('Error marking announcement as read:', err);
    }
  }, []);

  const participateInChallenge = useCallback(async (challengeId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Use a fallback URL if environment variable is not available
      const baseUrl = typeof import.meta.env !== 'undefined' && import.meta.env.VITE_SUPABASE_URL 
        ? import.meta.env.VITE_SUPABASE_URL 
        : 'https://your-project.supabase.co';

      const response = await fetch(`${baseUrl}/functions/v1/community-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: 'participate_challenge',
          challengeId: challengeId
        })
      });

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error participating in challenge:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to participate' };
    }
  }, []);

  useEffect(() => {
    void fetchAnnouncements();
    void fetchChallenges();
  }, [fetchAnnouncements, fetchChallenges]);

  useEffect(() => {
    if (announcements.length > 0) {
      void calculateUnreadCount();
    }
  }, [announcements, calculateUnreadCount]);

  return {
    announcements,
    challenges,
    loading,
    error,
    unreadCount,
    markAsRead,
    participateInChallenge,
    refreshAnnouncements: fetchAnnouncements,
    refreshChallenges: fetchChallenges
  };
}
