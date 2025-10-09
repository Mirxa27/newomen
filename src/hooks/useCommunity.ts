import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserProfile } from './useUserProfile';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type UserProfile = Tables<'user_profiles'>;
export type CommunityConnection = Tables<'community_connections'> & {
  requester: UserProfile;
  receiver: UserProfile;
};
export type ConnectionStatus = Tables<'community_connections'>['status'];

export function useCommunity() {
  const { profile } = useUserProfile();
  const [connections, setConnections] = useState<CommunityConnection[]>([]);
  const [potentialFriends, setPotentialFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchCommunityData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('community_connections')
        .select(`*, requester:requester_id(*), receiver:receiver_id(*)`)
        .or(`requester_id.eq.${profile.user_id},receiver_id.eq.${profile.user_id}`);

      if (connectionsError) throw connectionsError;
      const typedConnections = connectionsData as CommunityConnection[] || [];
      setConnections(typedConnections);

      const connectedUserIds = typedConnections.flatMap(c => [c.requester_id, c.receiver_id]);
      const idsToExclude = [...new Set([profile.user_id, ...connectedUserIds])];

      const { data: potentialFriendsData, error: friendsError } = await supabase
        .from('user_profiles')
        .select('*')
        .not('user_id', 'in', `(${idsToExclude.join(',')})`);

      if (friendsError) throw friendsError;
      setPotentialFriends(potentialFriendsData || []);

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load community data.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void fetchCommunityData();
  }, [fetchCommunityData]);

  const sendConnectionRequest = useCallback(async (receiverId: string) => {
    if (!profile) return;
    try {
      const insertPayload: TablesInsert<'community_connections'> = {
        requester_id: profile.user_id,
        receiver_id: receiverId,
        status: 'pending',
      };
      const { data, error: insertError } = await supabase
        .from('community_connections')
        .insert(insertPayload)
        .select(`*, requester:requester_id(*), receiver:receiver_id(*)`)
        .single();

      if (insertError) throw insertError;
      setConnections(prev => [...prev, data as CommunityConnection]);
      setPotentialFriends(prev => prev.filter(p => p.user_id !== receiverId));
      toast.success('Friend request sent!');
    } catch (e) {
      toast.error('Failed to send friend request.');
    }
  }, [profile]);

  const updateConnectionStatus = useCallback(async (connectionId: string, status: ConnectionStatus) => {
    try {
      const updatePayload: TablesUpdate<'community_connections'> = { status };
      const { data, error: updateError } = await supabase
        .from('community_connections')
        .update(updatePayload)
        .eq('id', connectionId)
        .select(`*, requester:requester_id(*), receiver:receiver_id(*)`)
        .single();

      if (updateError) throw updateError;
      setConnections(prev => prev.map(c => c.id === connectionId ? data as CommunityConnection : c));
      toast.success(`Request ${status}.`);
    } catch (e) {
      toast.error('Failed to update connection status.');
    }
  }, []);

  const searchUsers = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error: searchError } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`email.ilike.%${searchTerm}%,nickname.ilike.%${searchTerm}%`)
        .limit(10);
      if (searchError) throw searchError;
      setSearchResults(data || []);
    } catch (e) {
      toast.error('Failed to search for users.');
    } finally {
      setSearching(false);
    }
  }, []);

  return {
    connections,
    potentialFriends,
    loading,
    error,
    searchResults,
    searching,
    searchUsers,
    sendConnectionRequest,
    updateConnectionStatus,
    refetch: fetchCommunityData,
    currentUserId: profile?.user_id,
  };
}