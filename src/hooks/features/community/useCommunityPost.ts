import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { CommunityPost, PostComment } from './useCommunityPosts';

export const useCommunityPost = (postId: string) => {
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!postId) return;
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
          operation: 'get_post',
          postId: postId,
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setPost(result.post || null);
        // The get_post operation returns comments within the post object.
        // Let's assume the property is named 'community_post_comments' based on the edge function
        setComments(result.post?.community_post_comments || []);
      } else {
        throw new Error(result.error || 'Failed to fetch post');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);
  
  const addComment = async (content: string, parentCommentId?: string) => {
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
        // Add new comment to the list
        setComments(prev => [...prev, result.comment]);
        // Also update comment count on post
        if (post) {
            setPost(p => p ? ({...p, comments_count: p.comments_count + 1}) : null)
        }
        return { success: true, comment: result.comment };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error commenting on post:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to comment' };
    }
  };


  return {
    post,
    comments,
    loading,
    error,
    addComment,
    refreshPost: fetchPost
  };
};





