import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  post_type: 'general' | 'question' | 'story' | 'achievement' | 'resource';
  media_urls?: string[];
  tags?: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
  author_level?: number;
  author_crystals?: number;
  is_liked_by_user?: boolean;
  is_following_author?: boolean;
  user_profiles?: {
    nickname: string;
    avatar_url: string;
    email: string;
  };
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  likes_count: number;
  is_edited: boolean;
  created_at: string;
  user_profiles?: {
    nickname: string;
    avatar_url: string;
    email: string;
  };
}

export const useCommunityPosts = (filterType: string = 'all', tag?: string) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/community-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          operation: 'get_feed',
          filterType: filterType,
          tag: tag,
          limit: 50,
          offset: 0
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setPosts(result.posts || []);
      } else {
        throw new Error(result.error || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [filterType, tag]);

  useEffect(() => {
    fetchPosts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('community_posts_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts',
          filter: 'is_active=eq.true'
        },
        (payload) => {
          console.log('New post received:', payload);
          fetchPosts(); // Refresh posts
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const createPost = async (data: {
    title: string;
    content: string;
    postType?: string;
    tags?: string[];
    mediaUrls?: string[];
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/community-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          operation: 'create_post',
          ...data
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchPosts(); // Refresh list
        return { success: true, post: result.post };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to create post' };
    }
  };

  const likePost = async (postId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/community-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          operation: 'like_post',
          postId: postId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: post.likes_count + 1, is_liked_by_user: true }
            : post
        ));
        return { success: true };
      } else {
        throw new Error(result.error || result.message);
      }
    } catch (err) {
      console.error('Error liking post:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to like post' };
    }
  };

  const unlikePost = async (postId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/community-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          operation: 'unlike_post',
          postId: postId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: Math.max(0, post.likes_count - 1), is_liked_by_user: false }
            : post
        ));
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error unliking post:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to unlike post' };
    }
  };

  const commentOnPost = async (postId: string, content: string, parentCommentId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/community-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          operation: 'comment',
          postId: postId,
          content: content,
          parentCommentId: parentCommentId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update comment count
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        ));
        return { success: true, comment: result.comment };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error commenting on post:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to comment' };
    }
  };

  const followUser = async (targetUserId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/community-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          operation: 'follow',
          targetUserId: targetUserId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setPosts(prev => prev.map(post => 
          post.user_id === targetUserId 
            ? { ...post, is_following_author: true }
            : post
        ));
        return { success: true };
      } else {
        throw new Error(result.error || result.message);
      }
    } catch (err) {
      console.error('Error following user:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to follow user' };
    }
  };

  const unfollowUser = async (targetUserId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/community-operations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          operation: 'unfollow',
          targetUserId: targetUserId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setPosts(prev => prev.map(post => 
          post.user_id === targetUserId 
            ? { ...post, is_following_author: false }
            : post
        ));
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error unfollowing user:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to unfollow user' };
    }
  };

  return {
    posts,
    loading,
    error,
    createPost,
    likePost,
    unlikePost,
    commentOnPost,
    followUser,
    unfollowUser,
    refreshPosts: fetchPosts
  };
};

