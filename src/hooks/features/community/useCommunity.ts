import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useUserProfile } from './useUserProfile';
import { toast } from 'sonner';
import { safeUpdate } from '@/lib/shared/core/supabase-utils';

type ConnectionStatus = 'pending' | 'accepted' | 'declined';

// Use a simplified type for community functionality
interface SimpleUser {
  id: string;
  nickname?: string | null;
  avatar_url?: string | null;
}

interface SimpleConnection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: ConnectionStatus;
  requester?: SimpleUser;
  receiver?: SimpleUser;
}

export function useCommunity() {
  const { profile } = useUserProfile();
  const [connections, setConnections] = useState<SimpleConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SimpleUser[]>([]);
  const [searching, setSearching] = useState(false);

  // Helper function to handle Supabase errors
  const handleSupabaseError = (error: Error, context: string) => {
    console.error(`Supabase error in ${context}:`, error);
    toast.error(`An error occurred while ${context}.`);
  };

  const fetchConnections = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false); // Ensure loading is set to false if no profile
      setConnections([]); // Clear connections if no profile
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_connections')
        .select(`
          id,
          requester_id,
          receiver_id,
          status,
          requester:user_profiles!community_connections_requester_id_fkey (
            id,
            nickname,
            avatar_url
          ),
          receiver:user_profiles!community_connections_receiver_id_fkey (
            id,
            nickname,
            avatar_url
          )
        `)
        .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, 'fetching connections');
        setConnections([]); // Clear connections on error
        return;
      }

      if (!data) {
        setConnections([]); // Ensure connections is an empty array if data is null/undefined
        return;
      }

      const formattedConnections: SimpleConnection[] = data.map(conn => ({
        id: conn.id,
        requester_id: conn.requester_id,
        receiver_id: conn.receiver_id,
        status: conn.status as ConnectionStatus,
        requester: conn.requester
          ? {
              id: conn.requester.id,
              nickname: conn.requester.nickname,
              avatar_url: conn.requester.avatar_url,
            }
          : undefined,
        receiver: conn.receiver
          ? {
              id: conn.receiver.id,
              nickname: conn.receiver.nickname,
              avatar_url: conn.receiver.avatar_url,
            }
          : undefined,
      }));

      setConnections(formattedConnections);
      console.log(`Loaded ${formattedConnections.length} connections from database`);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Could not load community connections.');
      setConnections([]); // Clear connections on error
    } finally {
      setLoading(false);
    }
  }, [profile?.id]); // Dependency on profile?.id only

  useEffect(() => {
    if (profile) {
      void fetchConnections();
    }
  }, [profile, fetchConnections]); // Include fetchConnections in the dependency array

  const searchUsers = useCallback(async (query: string) => {
    if (!profile?.id || query.length < 3) {
      setSearchResults([]);
      setSearching(false); // Ensure searching is false when query is too short
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, nickname, avatar_url')
        .or(`nickname.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', profile.id) // Exclude current user
        .limit(20);

      if (error) {
        handleSupabaseError(error, 'searching users');
        setSearchResults([]);
        return;
      }

      const users: SimpleUser[] = (data || []).map(user => ({
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
      }));

      setSearchResults(users);
      console.log(`Found ${users.length} users matching "${query}"`);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('User search failed.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [profile?.id]); // Dependency on profile?.id only

  const sendConnectionRequest = useCallback(async (receiverId: string) => {
    if (!profile?.id) return;

    try {
      // Check if connection already exists
      const { data: existingConnection, error: existingConnectionError } = await supabase
        .from('community_connections')
        .select('id, status')
        .or(`and(requester_id.eq.${profile.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${profile.id})`)
        .single();

      if (existingConnectionError) {
        handleSupabaseError(existingConnectionError, 'checking existing connection');
        return;
      }

      if (existingConnection) {
        toast.error('Connection already exists with this user.');
        return;
      }

      const { error } = await supabase
        .from('community_connections')
        .insert({
          requester_id: profile.id,
          receiver_id: receiverId,
          status: 'pending',
        });

      if (error) {
        handleSupabaseError(error, 'sending connection request');
        return;
      }

      toast.success('Connection request sent!');
      void fetchConnections();
      // Remove user from search results since connection is now pending
      setSearchResults(prev => prev.filter(user => user.id !== receiverId));
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request.');
    }
  }, [profile?.id, fetchConnections]); // Dependency on profile?.id and fetchConnections

  const updateConnectionStatus = useCallback(async (connectionId: string, status: ConnectionStatus) => {
    if (!profile?.id) return;

    try {
      // First verify that the current user is the receiver (only receivers can accept/decline)
      const { data: connection, error: fetchError } = await supabase
        .from('community_connections')
        .select('receiver_id')
        .eq('id', connectionId)
        .single();

      if (fetchError) {
        handleSupabaseError(fetchError, 'fetching connection for update');
        return;
      }

      if (!connection || connection.receiver_id !== profile.id) {
        toast.error('You can only update connection requests sent to you.');
        return;
      }

      const { error } = await supabase
        .from('community_connections')
        .update({ status })
        .eq('id', connectionId);

      if (error) {
        handleSupabaseError(error, 'updating connection status');
        return;
      }

      const statusMessages = {
        accepted: 'Connection accepted!',
        declined: 'Connection declined.',
        pending: 'Connection set to pending.',
      };

      toast.success(statusMessages[status]);
      void fetchConnections();
    } catch (error) {
      console.error(`Error updating connection status to ${status}:`, error);
      toast.error('Could not update connection.');
    }
  }, [profile?.id, fetchConnections]); // Dependency on profile?.id and fetchConnections

  return {
    loading,
    connections,
    searchResults,
    searching,
    searchUsers,
    sendConnectionRequest,
    updateConnectionStatus,
    currentUserId: profile?.id || null,
  };
}