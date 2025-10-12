import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CommunityOperationPayload {
  operation: 'create_post' | 'like_post' | 'unlike_post' | 'comment' | 'follow' | 'unfollow' | 'get_feed' | 'get_post' | 'get_user_posts';
  postId?: string;
  userId?: string;
  targetUserId?: string;
  title?: string;
  content?: string;
  postType?: string;
  tags?: string[];
  mediaUrls?: string[];
  commentId?: string;
  parentCommentId?: string;
  filterType?: string;
  limit?: number;
  offset?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: CommunityOperationPayload = await req.json();
    const { operation } = payload;

    // Initialize Supabase client with user's auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    let result;

    switch (operation) {
      case 'create_post':
        const { title, content, postType, tags, mediaUrls } = payload;
        
        if (!title || !content) {
          throw new Error('Title and content are required');
        }

        const { data: newPost, error: postError } = await supabase
          .from('community_posts')
          .insert({
            user_id: user.id,
            title: title,
            content: content,
            post_type: postType || 'general',
            tags: tags || [],
            media_urls: mediaUrls || []
          })
          .select(`
            *,
            user_profiles!community_posts_user_id_fkey (
              nickname,
              avatar_url,
              email
            )
          `)
          .single();

        if (postError) throw postError;

        // Award crystals for creating a post
        try {
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/gamification-engine`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader
            },
            body: JSON.stringify({
              type: 'create_community_post',
              payload: {
                userId: user.id,
                postId: newPost.id
              }
            })
          });
        } catch (gamError) {
          console.error('Gamification error (non-critical):', gamError);
        }

        result = { success: true, post: newPost };
        break;

      case 'like_post':
        const { postId: likePostId } = payload;
        
        if (!likePostId) {
          throw new Error('Post ID is required');
        }

        // Check if already liked
        const { data: existingLike } = await supabase
          .from('community_post_likes')
          .select('id')
          .eq('post_id', likePostId)
          .eq('user_id', user.id)
          .single();

        if (existingLike) {
          result = { success: false, message: 'Post already liked' };
        } else {
          const { error: likeError } = await supabase
            .from('community_post_likes')
            .insert({
              post_id: likePostId,
              user_id: user.id
            });

          if (likeError) throw likeError;
          result = { success: true, message: 'Post liked' };
        }
        break;

      case 'unlike_post':
        const { postId: unlikePostId } = payload;
        
        if (!unlikePostId) {
          throw new Error('Post ID is required');
        }

        const { error: unlikeError } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', unlikePostId)
          .eq('user_id', user.id);

        if (unlikeError) throw unlikeError;
        result = { success: true, message: 'Post unliked' };
        break;

      case 'comment':
        const { postId: commentPostId, content: commentContent, parentCommentId } = payload;
        
        if (!commentPostId || !commentContent) {
          throw new Error('Post ID and content are required');
        }

        const { data: newComment, error: commentError } = await supabase
          .from('community_post_comments')
          .insert({
            post_id: commentPostId,
            user_id: user.id,
            content: commentContent,
            parent_comment_id: parentCommentId || null
          })
          .select(`
            *,
            user_profiles!community_post_comments_user_id_fkey (
              nickname,
              avatar_url,
              email
            )
          `)
          .single();

        if (commentError) throw commentError;
        result = { success: true, comment: newComment };
        break;

      case 'follow':
        const { targetUserId: followUserId } = payload;
        
        if (!followUserId) {
          throw new Error('Target user ID is required');
        }

        if (followUserId === user.id) {
          throw new Error('Cannot follow yourself');
        }

        // Get user profiles
        const { data: followerProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        const { data: followingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', followUserId)
          .single();

        if (!followerProfile || !followingProfile) {
          throw new Error('User profile not found');
        }

        const { error: followError } = await supabase
          .from('community_follows')
          .insert({
            follower_id: followerProfile.id,
            following_id: followingProfile.id
          });

        if (followError) {
          if (followError.code === '23505') { // Unique constraint violation
            result = { success: false, message: 'Already following this user' };
          } else {
            throw followError;
          }
        } else {
          result = { success: true, message: 'User followed' };
        }
        break;

      case 'unfollow':
        const { targetUserId: unfollowUserId } = payload;
        
        if (!unfollowUserId) {
          throw new Error('Target user ID is required');
        }

        // Get user profiles
        const { data: unfollowerProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        const { data: unfollowingProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', unfollowUserId)
          .single();

        if (!unfollowerProfile || !unfollowingProfile) {
          throw new Error('User profile not found');
        }

        const { error: unfollowError } = await supabase
          .from('community_follows')
          .delete()
          .eq('follower_id', unfollowerProfile.id)
          .eq('following_id', unfollowingProfile.id);

        if (unfollowError) throw unfollowError;
        result = { success: true, message: 'User unfollowed' };
        break;

      case 'get_feed':
        const { filterType, limit, offset } = payload;

        // Get user profile
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!userProfile) {
          throw new Error('User profile not found');
        }

        const { data: feedPosts, error: feedError } = await supabase
          .rpc('get_community_feed', {
            requesting_user_id: userProfile.id,
            filter_type: filterType || 'all',
            limit_count: limit || 20,
            offset_count: offset || 0
          });

        if (feedError) throw feedError;
        result = { success: true, posts: feedPosts };
        break;

      case 'get_post':
        const { postId: getPostId } = payload;
        
        if (!getPostId) {
          throw new Error('Post ID is required');
        }

        const { data: post, error: getPostError } = await supabase
          .from('community_posts')
          .select(`
            *,
            user_profiles!community_posts_user_id_fkey (
              nickname,
              avatar_url,
              email,
              id
            ),
            community_post_comments (
              *,
              user_profiles!community_post_comments_user_id_fkey (
                nickname,
                avatar_url,
                email
              )
            )
          `)
          .eq('id', getPostId)
          .single();

        if (getPostError) throw getPostError;

        // Check if user liked this post
        const { data: userLike } = await supabase
          .from('community_post_likes')
          .select('id')
          .eq('post_id', getPostId)
          .eq('user_id', user.id)
          .single();

        result = { 
          success: true, 
          post: {
            ...post,
            is_liked_by_user: !!userLike
          }
        };
        break;

      case 'get_user_posts':
        const { userId: getUserId } = payload;
        
        if (!getUserId) {
          throw new Error('User ID is required');
        }

        const { data: userPosts, error: userPostsError } = await supabase
          .from('community_posts')
          .select(`
            *,
            user_profiles!community_posts_user_id_fkey (
              nickname,
              avatar_url,
              email
            )
          `)
          .eq('user_id', getUserId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(payload.limit || 20);

        if (userPostsError) throw userPostsError;
        result = { success: true, posts: userPosts };
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in community operations:', error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

