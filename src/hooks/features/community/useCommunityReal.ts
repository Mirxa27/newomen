import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '../auth/useUserProfile';
import { toast } from 'sonner';

type ConnectionStatus = 'pending' | 'accepted' | 'declined';

// Community connection types with explicit structure
interface CommunityConnection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: ConnectionStatus;
  created_at: string;
}

interface UserProfile {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  full_name?: string | null;
}

interface ConnectionWithProfiles extends CommunityConnection {
  requester?: UserProfile;
  receiver?: UserProfile;
}

// Simplified interface for the hook
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

export function useCommunityReal() {
  const { profile } = useUserProfile();
  const [connections, setConnections] = useState<SimpleConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<SimpleUser[]>([]);
  const [searching, setSearching] = useState(false);

  // Fallback method using direct SQL queries
  const fetchConnectionsDirect = useCallback(async () => {
    if (!profile?.id) return;

    try {
      // Query connections directly without joins due to type issues
      const { data: connectionsData, error: connError } = await supabase
        .from('community_connections')
        .select('*')
        .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (connError) throw connError;

      interface DirectConnection {
        id: string;
        requester_id: string;
        receiver_id: string;
        status: string;
      }

      // Get unique user IDs to fetch user details separately
      const userIds = new Set<string>();
      (connectionsData || []).forEach((conn: DirectConnection) => {
        userIds.add(conn.requester_id);
        userIds.add(conn.receiver_id);
      });

      // Fetch user profiles separately
      const userProfiles: Record<string, UserProfile> = {};
      if (userIds.size > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('id, nickname, avatar_url, full_name')
          .in('id', Array.from(userIds));

        if (!usersError && usersData) {
          usersData.forEach((user: UserProfile) => {
            userProfiles[user.id] = user;
          });
        }
      }

      // Combine data
      const formattedConnections: SimpleConnection[] = (connectionsData || []).map((conn: DirectConnection) => ({
        id: conn.id,
        requester_id: conn.requester_id,
        receiver_id: conn.receiver_id,
        status: conn.status as ConnectionStatus,
        requester: userProfiles[conn.requester_id] ? {
          id: conn.requester_id,
          nickname: userProfiles[conn.requester_id].nickname,
          avatar_url: userProfiles[conn.requester_id].avatar_url
        } : undefined,
        receiver: userProfiles[conn.receiver_id] ? {
          id: conn.receiver_id,
          nickname: userProfiles[conn.receiver_id].nickname,
          avatar_url: userProfiles[conn.receiver_id].avatar_url
        } : undefined
      }));
      
      setConnections(formattedConnections);
      console.log(`Loaded ${formattedConnections.length} connections using fallback method`);
    } catch (error) {
      console.error('Error in fallback connection fetch:', error);
      setConnections([]);
    }
  }, [profile]);

  const fetchConnections = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    
    try {
      // Use RPC function to fetch connections with user details
      const { data, error } = await supabase.rpc('get_user_connections', {
        user_id: profile.id
      });

      if (error) {
        console.error('Database error fetching connections:', error);
        throw error;
      }

      interface RawConnection {
        id: string;
        requester_id: string;
        receiver_id: string;
        status: string;
        requester_nickname?: string;
        requester_avatar?: string;
        receiver_nickname?: string;
        receiver_avatar?: string;
      }
      const formattedConnections: SimpleConnection[] = (data || []).map((conn: RawConnection) => ({
        id: conn.id,
        requester_id: conn.requester_id,
        receiver_id: conn.receiver_id,
        status: conn.status as ConnectionStatus,
        requester: conn.requester_nickname ? {
          id: conn.requester_id,
          nickname: conn.requester_nickname,
          avatar_url: conn.requester_avatar
        } : undefined,
        receiver: conn.receiver_nickname ? {
          id: conn.receiver_id,
          nickname: conn.receiver_nickname,
          avatar_url: conn.receiver_avatar
        } : undefined
      }));
      
      setConnections(formattedConnections);
      console.log(`Loaded ${formattedConnections.length} connections from database`);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Could not load community connections.');
      // Fallback: try direct query if RPC fails
      await fetchConnectionsDirect();
    } finally {
      setLoading(false);
    }
  }, [profile, fetchConnectionsDirect]);

  useEffect(() => {
    if (profile) void fetchConnections();
  }, [profile, fetchConnections]);

  // Fallback user search
  const searchUsersDirect = useCallback(async (query: string) => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, nickname, avatar_url')
        .or(`nickname.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', profile.id)
        .limit(20);

      if (error) throw error;

      interface DirectSearchUser {
        id: string;
        nickname: string;
        avatar_url?: string;
      }
      const users: SimpleUser[] = (data || []).map((user: DirectSearchUser) => ({
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url
      }));
      
      setSearchResults(users);
      console.log(`Found ${users.length} users using fallback search`);
    } catch (error) {
      console.error('Error in fallback user search:', error);
      setSearchResults([]);
    }
  }, [profile]);

  const searchUsers = useCallback(async (query: string) => {
    if (!profile?.id || query.length < 3) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    
    try {
      // Use RPC for user search
      const { data, error } = await supabase.rpc('search_users', {
        search_term: query,
        current_user_id: profile.id,
        limit_count: 20
      });

      if (error) {
        console.error('Database error searching users:', error);
        throw error;
      }

      interface SearchUser {
        id: string;
        nickname: string;
        avatar_url?: string;
      }
      const users: SimpleUser[] = (data || []).map((user: SearchUser) => ({
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url
      }));
      
      setSearchResults(users);
      console.log(`Found ${users.length} users matching "${query}"`);
    } catch (error) {
      console.error('Error searching users:', error);
      // Fallback: direct query if RPC fails
      await searchUsersDirect(query);
    } finally {
      setSearching(false);
    }
  }, [profile, searchUsersDirect]);

  // Fallback connection request method - defined first to avoid dependency issue
  const sendConnectionRequestDirect = useCallback(async (receiverId: string) => {
    if (!profile?.id) return;

    try {
      // Check if connection already exists
      const { data: existingConnection, error: existingConnectionError } = await supabase
        .from('community_connections')
        .select('id, status')
        .or(`and(requester_id.eq.${profile.id},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${profile.id})`)
        .single();
      
      if(existingConnectionError && existingConnectionError.code !== 'PGRST116'){ // ignore no rows found
        throw existingConnectionError;
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
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Connection request sent!');
      void fetchConnections();
      setSearchResults(prev => prev.filter(user => user.id !== receiverId));
    } catch (error) {
      console.error('Error sending connection request (fallback):', error);
      toast.error('Failed to send connection request.');
    }
  }, [profile, fetchConnections]);

  const sendConnectionRequest = useCallback(async (receiverId: string) => {
    if (!profile?.id) return;
    
    try {
      // Use RPC for connection request
      const { data, error } = await supabase.rpc('send_connection_request', {
        sender_id: profile.id,
        receiver_id: receiverId
      });

      if (error) {
        if (error.message?.includes('already exists')) {
          toast.error('Connection already exists with this user.');
          return;
        }
        throw error;
      }

      toast.success('Connection request sent!');
      void fetchConnections();
      // Remove user from search results since connection is now pending
      setSearchResults(prev => prev.filter(user => user.id !== receiverId));
    } catch (error) {
      console.error('Error sending connection request:', error);
      // Fallback: direct insertion
      await sendConnectionRequestDirect(receiverId);
    }
  }, [profile, fetchConnections, sendConnectionRequestDirect]);


  // Fallback connection status update - defined first to avoid dependency issue
  const updateConnectionStatusDirect = useCallback(async (connectionId: string, status: ConnectionStatus) => {
    if (!profile?.id) return;

    try {
      // First verify that the current user is the receiver
      const { data: connection, error: fetchError } = await supabase
        .from('community_connections')
        .select('receiver_id')
        .eq('id', connectionId)
        .single();

      if (fetchError) throw fetchError;

      if (connection?.receiver_id !== profile.id) {
        toast.error('You can only update connection requests sent to you.');
        return;
      }

      const { error } = await supabase
        .from('community_connections')
        .update({ status })
        .eq('id', connectionId);

      if (error) throw error;

      const statusMessages = {
        accepted: 'Connection accepted!',
        declined: 'Connection declined.',
        pending: 'Connection set to pending.'
      };

      toast.success(statusMessages[status]);
      void fetchConnections();
    } catch (error) {
      console.error('Error updating connection status (fallback):', error);
      toast.error('Could not update connection.');
    }
  }, [profile, fetchConnections]);

  const updateConnectionStatus = useCallback(async (connectionId: string, status: ConnectionStatus) => {
    if (!profile?.id) return;
    
    try {
      // Use RPC for status update
      const { data, error } = await supabase.rpc('update_connection_status', {
        connection_id: connectionId,
        new_status: status,
        user_id: profile.id
      });

      if (error) {
        if (error.message?.includes('unauthorized')) {
          toast.error('You can only update connection requests sent to you.');
          return;
        }
        throw error;
      }

      const statusMessages = {
        accepted: 'Connection accepted!',
        declined: 'Connection declined.',
        pending: 'Connection set to pending.'
      };

      toast.success(statusMessages[status]);
      void fetchConnections();
    } catch (error) {
      console.error('Error updating connection status:', error);
      // Fallback: direct update
      await updateConnectionStatusDirect(connectionId, status);
    }
  }, [profile, fetchConnections, updateConnectionStatusDirect]);


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

