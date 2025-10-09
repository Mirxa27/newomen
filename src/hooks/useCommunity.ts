import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserProfile } from './useUserProfile';
import { CommunityConnections, CommunityConnectionWithProfiles } from '@/integrations/supabase/tables/community_connections';
import { UserProfiles } from '@/integrations/supabase/tables/user_profiles';
import { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type ConnectionStatus = CommunityConnections['Row']['status'];

export function useCommunity() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [connections, setConnections] = useState<CommunityConnectionWithProfiles[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfiles['Row'][]>([]); // Added missing state
  const [searching, setSearching] = useState(false); // Added missing state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_connections')
        .select(`*, requester:requester_id(*), receiver:receiver_id(*)`)
        .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`);

      if (error) throw error;
      setConnections(data as CommunityConnectionWithProfiles[] || []);
    } catch (e) {
      console.error('Error fetching connections:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch connections.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const searchUsers = useCallback(async (searchTerm: string) => { // Added missing function
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('nickname', `%${searchTerm}%`)
        .neq('id', profile?.id) // Exclude current user
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (e) {
      console.error('Error searching users:', e);
      toast.error('Failed to search users.');
    } finally {
      setSearching(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!profileLoading) {
      void fetchConnections();
    }
  }, [profileLoading, fetchConnections]);

  const sendConnectionRequest = useCallback(async (receiverId: string) => {
    if (!profile) {
      toast.error('You must be logged in to send connection requests.');
      return;
    }
    try {
      const insertPayload: TablesInsert<'community_connections'> = {
        requester_id: profile.id,
        receiver_id: receiverId,
        status: 'pending',
      };
      const { data, error } = await supabase
        .from('community_connections')
        .insert(insertPayload)
        .select(`*, requester:requester_id(*), receiver:receiver_id(*)`)
        .single();

      if (error) throw error;
      setConnections(prev => [...prev, data as CommunityConnectionWithProfiles]);
      toast.success('Connection request sent!');
    } catch (e) {
      console.error('Error sending connection request:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to send connection request.');
    }
  }, [profile]);

  const updateConnectionStatus = useCallback(async (connectionId: string, status: ConnectionStatus) => {
    try {
      const updatePayload: TablesUpdate<'community_connections'> = { status };
      const { data, error } = await supabase
        .from('community_connections')
        .update(updatePayload)
        .eq('id', connectionId)
        .select(`*, requester:requester_id(*), receiver:receiver_id(*)`)
        .single();

      if (error) throw error;
      setConnections(prev => prev.map(conn => (conn.id === connectionId ? data as CommunityConnectionWithProfiles : conn)));
      toast.success(`Connection ${status}!`);
    } catch (e) {
      console.error('Error updating connection status:', e);
      toast.error(e instanceof Error ? e.message : 'Failed to update connection status.');
    }
  }, []);

  return {
    connections,
    loading,
    error,
    sendConnectionRequest,
    updateConnectionStatus,
    refetchConnections: fetchConnections,
    searchResults,
    searching,
    searchUsers,
    currentUserId: profile?.id || null, // Added currentUserId
  };
}