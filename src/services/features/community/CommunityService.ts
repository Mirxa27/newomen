// Comprehensive community service for Newomen platform
import { supabase } from '@/integrations/supabase/client';
import { errorHandler, ErrorFactory } from '@/utils/shared/core/error-handling';
import type { 
  CommunityPostCreate, 
  CommunityPost, 
  CommunityCommentCreate, 
  CommunityComment,
  APIResponse 
} from '@/types/validation';
import type { Database } from '@/integrations/supabase/types';
import { Json } from '@/integrations/supabase/types';

type CommunityPostWithAuthor = Database['public']['Tables']['community_posts']['Row'] & {
    author: Pick<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'full_name' | 'nickname' | 'avatar_url'> | null;
};
type CommunityCommentWithAuthor = Database['public']['Tables']['community_comments']['Row'] & {
    author: Pick<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'full_name' | 'nickname' | 'avatar_url'> | null;
};

export interface CommunityStats {
  totalPosts: number;
  totalComments: number;
  activeUsers: number;
  popularTags: string[];
  recentActivity: Array<{
    type: 'post' | 'comment' | 'like';
    user: string;
    content: string;
    timestamp: string;
  }>;
}

export interface PostFilters {
  category?: string;
  tags?: string[];
  author?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'trending';
}

export interface CommentFilters {
  postId?: string;
  author?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  sortBy?: 'newest' | 'oldest' | 'popular';
}

export class CommunityService {
  private static instance: CommunityService;

  private constructor() {}

  public static getInstance(): CommunityService {
    if (!CommunityService.instance) {
      CommunityService.instance = new CommunityService();
    }
    return CommunityService.instance;
  }

  // Create new post
  public async createPost(
    postData: CommunityPostCreate,
    userId: string
  ): Promise<APIResponse<CommunityPost>> {
    try {
      // Validate post content
      const validation = this.validatePostContent(postData);
      if (!validation.isValid) {
        throw ErrorFactory.validation(validation.error);
      }

      // Check user permissions
      const hasPermission = await this.checkUserPermission(userId, 'create_post');
      if (!hasPermission) {
        throw ErrorFactory.authorization('Insufficient permissions to create posts');
      }

      // Create post
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          ...postData,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          likes_count: 0,
          comments_count: 0,
        })
        .select(`
          *,
          author:user_profiles!community_posts_user_id_fkey (
            id,
            full_name,
            nickname,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Log post creation
      await this.logCommunityEvent('post_created', {
        post_id: data.id,
        user_id: userId,
        title: postData.title,
        category: postData.category,
        tags: postData.tags,
      });

      // Trigger gamification for community participation
      await this.triggerGamificationEvent('community_post', userId, {
        post_id: data.id,
        category: postData.category,
      });

      return {
        success: true,
        data: this.formatPostData(data),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'createPost',
        userId,
        title: postData.title,
      });
    }
  }

  // Get posts with filtering and pagination
  public async getPosts(
    filters: PostFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<APIResponse<{ posts: CommunityPost[]; total: number; hasMore: boolean }>> {
    try {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          author:user_profiles!community_posts_user_id_fkey (
            id,
            full_name,
            nickname,
            avatar_url
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.author) {
        query = query.eq('user_id', filters.author);
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      // Apply sorting
      const sortColumn = this.getSortColumn(filters.sortBy);
      query = query.order(sortColumn.column, { ascending: sortColumn.ascending });

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: posts, error, count } = await query;

      if (error) throw error;

      const total = count || 0;
      const hasMore = offset + limit < total;

      return {
        success: true,
        data: {
          posts: posts?.map(this.formatPostData) || [],
          total,
          hasMore,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'getPosts',
        filters,
        page,
        limit,
      });
    }
  }

  // Get single post
  public async getPost(postId: string): Promise<APIResponse<CommunityPost>> {
    try {
      const { data: post, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          author:user_profiles!community_posts_user_id_fkey (
            id,
            full_name,
            nickname,
            avatar_url
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.formatPostData(post),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'getPost',
        postId,
      });
    }
  }

  // Create comment
  public async createComment(
    commentData: CommunityCommentCreate,
    userId: string
  ): Promise<APIResponse<CommunityComment>> {
    try {
      // Validate comment content
      const validation = this.validateCommentContent(commentData);
      if (!validation.isValid) {
        throw ErrorFactory.validation(validation.error);
      }

      // Check if post exists
      const { data: post, error: postError } = await supabase
        .from('community_posts')
        .select('id, allow_comments')
        .eq('id', commentData.post_id)
        .single();

      if (postError || !post) {
        throw ErrorFactory.notFound('Post', commentData.post_id);
      }

      if (!post.allow_comments) {
        throw ErrorFactory.authorization('Comments are not allowed on this post');
      }

      // Create comment
      const { data, error } = await supabase
        .from('community_comments')
        .insert({
          ...commentData,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          likes_count: 0,
        })
        .select(`
          *,
          author:user_profiles!community_comments_user_id_fkey (
            id,
            full_name,
            nickname,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update post comment count
      await supabase.rpc('increment', {
        table_name: 'community_posts',
        column_name: 'comments_count',
        id: commentData.post_id,
      });

      // Log comment creation
      await this.logCommunityEvent('comment_created', {
        comment_id: data.id,
        post_id: commentData.post_id,
        user_id: userId,
      });

      return {
        success: true,
        data: this.formatCommentData(data),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'createComment',
        userId,
        postId: commentData.post_id,
      });
    }
  }

  // Get comments for a post
  public async getComments(
    postId: string,
    filters: CommentFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<APIResponse<{ comments: CommunityComment[]; total: number; hasMore: boolean }>> {
    try {
      let query = supabase
        .from('community_comments')
        .select(`
          *,
          author:user_profiles!community_comments_user_id_fkey (
            id,
            full_name,
            nickname,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('post_id', postId);

      // Apply filters
      if (filters.author) {
        query = query.eq('user_id', filters.author);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      // Apply sorting
      const sortColumn = this.getCommentSortColumn(filters.sortBy);
      query = query.order(sortColumn.column, { ascending: sortColumn.ascending });

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: comments, error, count } = await query;

      if (error) throw error;

      const total = count || 0;
      const hasMore = offset + limit < total;

      return {
        success: true,
        data: {
          comments: comments?.map(this.formatCommentData) || [],
          total,
          hasMore,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'getComments',
        postId,
        filters,
        page,
        limit,
      });
    }
  }

  // Like/unlike post
  public async togglePostLike(postId: string, userId: string): Promise<APIResponse<{ liked: boolean; likesCount: number }>> {
    try {
      // Check if user already liked the post
      const { data: existingLike, error: likeError } = await supabase
        .from('community_post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (likeError && likeError.code !== 'PGRST116') {
        throw likeError;
      }

      let liked = false;
      let likesCount = 0;

      if (existingLike) {
        // Unlike the post
        const { error: deleteError } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;

        // Decrement likes count
        await supabase.rpc('decrement', {
          table_name: 'community_posts',
          column_name: 'likes_count',
          id: postId,
        });

        liked = false;
      } else {
        // Like the post
        const { error: insertError } = await supabase
          .from('community_post_likes')
          .insert({
            post_id: postId,
            user_id: userId,
            created_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;

        // Increment likes count
        await supabase.rpc('increment', {
          table_name: 'community_posts',
          column_name: 'likes_count',
          id: postId,
        });

        liked = true;
      }

      // Get updated likes count
      const { data: post, error: postError } = await supabase
        .from('community_posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      likesCount = post.likes_count;

      // Log like action
      await this.logCommunityEvent(liked ? 'post_liked' : 'post_unliked', {
        post_id: postId,
        user_id: userId,
      });

      return {
        success: true,
        data: { liked, likesCount },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'togglePostLike',
        postId,
        userId,
      });
    }
  }

  // Get community statistics
  public async getCommunityStats(): Promise<APIResponse<CommunityStats>> {
    try {
      // Get total posts
      const { count: totalPosts } = await supabase
        .from('community_posts')
        .select('*', { count: 'exact', head: true });

      // Get total comments
      const { count: totalComments } = await supabase
        .from('community_comments')
        .select('*', { count: 'exact', head: true });

      // Get active users (users who posted in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: activeUsers } = await supabase
        .from('community_posts')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

      // Get popular tags
      const { data: tagData } = await supabase
        .from('community_posts')
        .select('tags')
        .not('tags', 'is', null);

      const tagCounts: Record<string, number> = {};
      tagData?.forEach(post => {
        post.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const popularTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('community_posts')
        .select(`
          title,
          created_at,
          author:user_profiles!community_posts_user_id_fkey (
            full_name,
            nickname
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const activity = recentActivity?.map(post => ({
        type: 'post' as const,
        user: post.author?.nickname || post.author?.full_name || 'Anonymous',
        content: post.title,
        timestamp: post.created_at,
      })) || [];

      return {
        success: true,
        data: {
          totalPosts: totalPosts || 0,
          totalComments: totalComments || 0,
          activeUsers: activeUsers || 0,
          popularTags,
          recentActivity: activity,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return errorHandler.handle(error as Error, {
        operation: 'getCommunityStats',
      });
    }
  }

  // Private helper methods
  private validatePostContent(postData: CommunityPostCreate): { isValid: boolean; error?: string } {
    if (!postData.title || postData.title.trim().length < 3) {
      return { isValid: false, error: 'Post title must be at least 3 characters' };
    }

    if (!postData.content || postData.content.trim().length < 10) {
      return { isValid: false, error: 'Post content must be at least 10 characters' };
    }

    if (postData.tags && postData.tags.length > 5) {
      return { isValid: false, error: 'Maximum 5 tags allowed' };
    }

    return { isValid: true };
  }

  private validateCommentContent(commentData: CommunityCommentCreate): { isValid: boolean; error?: string } {
    if (!commentData.content || commentData.content.trim().length < 1) {
      return { isValid: false, error: 'Comment cannot be empty' };
    }

    if (commentData.content.length > 1000) {
      return { isValid: false, error: 'Comment must be less than 1000 characters' };
    }

    return { isValid: true };
  }

  private async checkUserPermission(userId: string, permission: string): Promise<boolean> {
    // Implement permission checking logic
    // For now, return true for all users
    return true;
  }

  private getSortColumn(sortBy?: string): { column: string; ascending: boolean } {
    switch (sortBy) {
      case 'oldest':
        return { column: 'created_at', ascending: true };
      case 'popular':
        return { column: 'likes_count', ascending: false };
      case 'trending':
        return { column: 'comments_count', ascending: false };
      case 'newest':
      default:
        return { column: 'created_at', ascending: false };
    }
  }

  private getCommentSortColumn(sortBy?: string): { column: string; ascending: boolean } {
    switch (sortBy) {
      case 'oldest':
        return { column: 'created_at', ascending: true };
      case 'popular':
        return { column: 'likes_count', ascending: false };
      case 'newest':
      default:
        return { column: 'created_at', ascending: false };
    }
  }

  private formatPostData(post: CommunityPostWithAuthor): CommunityPost {
    return {
      id: post.id,
      user_id: post.user_id,
      title: post.title,
      content: post.content,
      category: post.category,
      tags: post.tags || [],
      is_anonymous: post.is_anonymous,
      allow_comments: post.allow_comments,
      likes_count: post.likes_count || 0,
      comments_count: post.comments_count || 0,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author: {
        id: post.author?.id,
        full_name: post.author?.full_name,
        nickname: post.author?.nickname,
        avatar_url: post.author?.avatar_url,
      },
    };
  }

  private formatCommentData(comment: CommunityCommentWithAuthor): CommunityComment {
    return {
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      content: comment.content,
      parent_comment_id: comment.parent_comment_id,
      likes_count: comment.likes_count || 0,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      author: {
        id: comment.author?.id,
        full_name: comment.author?.full_name,
        nickname: comment.author?.nickname,
        avatar_url: comment.author?.avatar_url,
      },
    };
  }

  private async logCommunityEvent(eventType: string, data: Json): Promise<void> {
    try {
      await supabase
        .from('community_events')
        .insert({
          event_type: eventType,
          data,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log community event:', error);
    }
  }

  private async triggerGamificationEvent(eventType: string, userId: string, metadata: Json): Promise<void> {
    try {
      await supabase.functions.invoke('gamification-engine', {
        body: {
          event_type: eventType,
          user_id: userId,
          metadata,
        },
      });
    } catch (error) {
      console.error('Failed to trigger gamification event:', error);
    }
  }
}

// Export singleton instance
export const communityService = CommunityService.getInstance();
