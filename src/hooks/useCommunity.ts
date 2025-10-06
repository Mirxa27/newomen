import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useUserProfile } from './useUserProfile';
import { toast } from 'sonner';

type ConnectionStatus = 'pending' | 'accepted' | 'declined';
type CommunityConnection = Tables<'community_connections'> & {
  requester: Pick<Tables<'user_profiles'>, 'id' | 'nickname' | 'avatar_url'>;
  receiver: Pick<Tables<'user_profiles'>, 'id' | 'nickname' | 'avatar_url'>;
};

export function useCommunity() {
  const { profile } = useUserProfile();
  const [connections, setConnections] = useState<CommunityConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Tables<'user_profiles'>[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchConnections = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_connections')
        .select(`
          *,
          requester:requester_id (id, nickname, avatar_url),
          receiver:receiver_id (id, nickname, avatar_url)
        `)
        .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

      if (error) throw error;
      setConnections(data as CommunityConnection[]);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Could not load community connections.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      void fetchConnections();
    }
  }, [profile, fetchConnections]);

  const searchUsers = useCallback(async (query: string) => {
    if (!profile || query.length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, nickname, avatar_url')
        .ilike('nickname', `%${query}%`)
        .not('id', 'eq', profile.id);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('User search failed.');
    } finally {
      setSearching(false);
    }
  }, [profile]);

  const sendConnectionRequest = useCallback(async (receiverId: string) => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from('community_connections')
        .insert({
          requester_id: profile.id,
          receiver_id: receiverId,
          status: 'pending',
        });
      if (error) throw error;
      toast.success('Connection request sent!');
      void fetchConnections();
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request.');
    }
  }, [profile, fetchConnections]);

  const updateConnectionStatus = useCallback(async (connectionId: number, status: ConnectionStatus) => {
    try {
      const { error } = await supabase
        .from('community_connections')
        .update({ status })
        .eq('id', connectionId);
      
      if (error) throw error;
      toast.success(`Connection ${status}.`);
      void fetchConnections();
    } catch (error) {
      console.error(`Error updating connection status to ${status}:`, error);
      toast.error('Could not update connection.');
    }
  }, [fetchConnections]);

  return {
    loading,
    connections,
    searchResults,
    searching,
    searchUsers,
    sendConnectionRequest,
    updateConnectionStatus,
    currentUserId: profile?.id,
  };
}