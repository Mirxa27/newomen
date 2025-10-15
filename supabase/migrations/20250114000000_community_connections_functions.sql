-- Add community_connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.community_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.community_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_connections
DROP POLICY IF EXISTS "Users can view their own connections" ON public.community_connections;
CREATE POLICY "Users can view their own connections"
  ON public.community_connections
  FOR SELECT
  USING (requester_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Users can create connection requests" ON public.community_connections;
CREATE POLICY "Users can create connection requests"
  ON public.community_connections
  FOR INSERT
  WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "Users can update connection requests sent to them" ON public.community_connections;
CREATE POLICY "Users can update connection requests sent to them"
  ON public.community_connections
  FOR UPDATE
  USING (receiver_id = auth.uid());

-- Function to get user connections with profile information
CREATE OR REPLACE FUNCTION get_user_connections(user_id UUID)
RETURNS TABLE (
  id UUID,
  requester_id UUID,
  receiver_id UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  requester_nickname TEXT,
  requester_avatar TEXT,
  receiver_nickname TEXT,
  receiver_avatar TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.id,
    cc.requester_id,
    cc.receiver_id,
    cc.status,
    cc.created_at,
    up_req.nickname as requester_nickname,
    up_req.avatar_url as requester_avatar,
    up_rec.nickname as receiver_nickname,
    up_rec.avatar_url as receiver_avatar
  FROM community_connections cc
  LEFT JOIN user_profiles up_req ON cc.requester_id = up_req.id
  LEFT JOIN user_profiles up_rec ON cc.receiver_id = up_rec.id
  WHERE cc.requester_id = user_id OR cc.receiver_id = user_id
  ORDER BY cc.created_at DESC;
END;
$$;

-- Function to search users (excluding current user and existing connections)
CREATE OR REPLACE FUNCTION search_users(
  search_term TEXT,
  current_user_id UUID,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  nickname TEXT,
  avatar_url TEXT,
  full_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.nickname,
    up.avatar_url,
    up.full_name
  FROM user_profiles up
  WHERE up.id != current_user_id
    AND (
      up.nickname ILIKE '%' || search_term || '%' 
      OR up.full_name ILIKE '%' || search_term || '%'
    )
    AND NOT EXISTS (
      SELECT 1 FROM community_connections cc
      WHERE (cc.requester_id = current_user_id AND cc.receiver_id = up.id)
         OR (cc.requester_id = up.id AND cc.receiver_id = current_user_id)
    )
  ORDER BY up.nickname
  LIMIT limit_count;
END;
$$;

-- Function to send connection request
CREATE OR REPLACE FUNCTION send_connection_request(
  sender_id UUID,
  receiver_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_connection UUID;
  new_connection UUID;
BEGIN
  -- Check if connection already exists
  SELECT id INTO existing_connection
  FROM community_connections
  WHERE (requester_id = sender_id AND receiver_id = receiver_id)
     OR (requester_id = receiver_id AND receiver_id = sender_id);
  
  IF existing_connection IS NOT NULL THEN
    RAISE EXCEPTION 'Connection already exists between these users';
  END IF;
  
  -- Create new connection request
  INSERT INTO community_connections (requester_id, receiver_id, status)
  VALUES (sender_id, receiver_id, 'pending')
  RETURNING id INTO new_connection;
  
  RETURN json_build_object('success', true, 'connection_id', new_connection);
END;
$$;

-- Function to update connection status
CREATE OR REPLACE FUNCTION update_connection_status(
  connection_id UUID,
  new_status TEXT,
  user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  connection_receiver_id UUID;
BEGIN
  -- Verify that the user is the receiver of the connection request
  SELECT receiver_id INTO connection_receiver_id
  FROM community_connections
  WHERE id = connection_id;
  
  IF connection_receiver_id IS NULL THEN
    RAISE EXCEPTION 'Connection not found';
  END IF;
  
  IF connection_receiver_id != user_id THEN
    RAISE EXCEPTION 'Unauthorized: only the receiver can update connection status';
  END IF;
  
  -- Update the connection status
  UPDATE community_connections
  SET status = new_status, updated_at = NOW()
  WHERE id = connection_id;
  
  RETURN json_build_object('success', true, 'status', new_status);
END;
$$;

-- Function to get connection statistics for a user
CREATE OR REPLACE FUNCTION get_user_connection_stats(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_connections INTEGER;
  pending_requests INTEGER;
  accepted_connections INTEGER;
BEGIN
  -- Count total connections where user is involved
  SELECT COUNT(*) INTO total_connections
  FROM community_connections
  WHERE requester_id = user_id OR receiver_id = user_id;
  
  -- Count pending requests sent TO the user
  SELECT COUNT(*) INTO pending_requests
  FROM community_connections
  WHERE receiver_id = user_id AND status = 'pending';
  
  -- Count accepted connections
  SELECT COUNT(*) INTO accepted_connections
  FROM community_connections
  WHERE (requester_id = user_id OR receiver_id = user_id) AND status = 'accepted';
  
  RETURN json_build_object(
    'total_connections', total_connections,
    'pending_requests', pending_requests,
    'accepted_connections', accepted_connections
  );
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_connections_requester ON community_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_community_connections_receiver ON community_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_community_connections_status ON community_connections(status);
CREATE INDEX IF NOT EXISTS idx_community_connections_created_at ON community_connections(created_at);

-- Create compound indexes
CREATE INDEX IF NOT EXISTS idx_community_connections_users_status 
ON community_connections(requester_id, receiver_id, status);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_connections(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_users(TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION send_connection_request(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_connection_status(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_connection_stats(UUID) TO authenticated;
