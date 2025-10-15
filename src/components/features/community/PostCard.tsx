import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Pin, Clock, Tag, Trophy, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { Badge } from '@/components/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { Textarea } from '@/components/shared/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { CommunityPost } from '@/hooks/features/community/useCommunityPosts';

interface PostCardProps {
  post: CommunityPost;
  onLike?: (postId: string) => void;
  onUnlike?: (postId: string) => void;
  onComment?: (postId: string, content: string) => Promise<any>;
  onShare?: (postId: string) => void;
  onClick?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onUnlike,
  onComment,
  onShare,
  onClick
}) => {
  const [isLiked, setIsLiked] = useState(post.is_liked_by_user || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
      onUnlike?.(post.id);
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      onLike?.(post.id);
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowCommentDialog(true);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !onComment) return;
    
    setIsSubmittingComment(true);
    try {
      await onComment(post.id, commentText.trim());
      setCommentText('');
      setShowCommentDialog(false);
      setCommentsCount(prev => prev + 1);
      toast.success('Comment added! +3 crystals 💎');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/community?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard! 📋');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleClick = () => {
    onClick?.(post.id);
  };

  const authorName = post.user_profiles?.nickname || post.author_name || 'Anonymous';
  const authorAvatar = post.user_profiles?.avatar_url || post.author_avatar;
  const authorInitial = authorName.charAt(0).toUpperCase();

  const postTypeColors = {
    general: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    question: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    story: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    achievement: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    resource: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  };

  return (
    <div 
      className="glass rounded-3xl border border-white/10 p-6 shadow-lg hover:border-white/20 transition-all cursor-pointer group"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <Avatar className="w-10 h-10 border-2 border-white/10">
            <AvatarImage src={authorAvatar} alt={authorName} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              {authorInitial}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                {authorName}
              </h3>
              {authorName === 'Katrina' && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-0.5">
                  ✨ Leader
                </Badge>
              )}
              <Badge variant="outline" className={postTypeColors[post.post_type]}>
                {post.post_type}
              </Badge>
              {post.is_pinned && (
                <Pin className="w-3 h-3 text-amber-400" />
              )}
            </div>
            <div className="flex items-center gap-3 text-xs mt-1">
              <span className="flex items-center gap-1 text-white/50">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
              <span className="flex items-center gap-1 text-purple-300 font-medium">
                <Trophy className="w-3 h-3" />
                Lvl {post.author_level || 1}
              </span>
              <span className="flex items-center gap-1 text-emerald-300 font-medium">
                <Sparkles className="w-3 h-3" />
                {post.author_crystals || 0} ✨
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-200 transition-colors">
          {post.title}
        </h2>
        <p className="text-white/80 text-sm leading-relaxed line-clamp-3">
          {post.content}
        </p>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 3).map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary"
              className="bg-white/5 text-white/60 hover:bg-white/10 text-xs"
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
          {post.tags.length > 3 && (
            <Badge variant="secondary" className="bg-white/5 text-white/60 text-xs">
              +{post.tags.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4 border-t border-white/10">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 ${isLiked ? 'text-pink-400' : 'text-white/60'} hover:text-pink-400 transition-colors`}
          onClick={handleLike}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">{likesCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-white/60 hover:text-blue-400 transition-colors"
          onClick={handleComment}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">{commentsCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-white/60 hover:text-purple-400 transition-colors"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">{post.shares_count || 0}</span>
        </Button>
      </div>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="glass border-white/10 max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="text-white">Add Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="glass rounded-2xl border border-white/10 p-4">
              <p className="text-sm text-white/80 mb-2 font-semibold">{post.title}</p>
              <p className="text-xs text-white/50 line-clamp-2">{post.content}</p>
            </div>
            
            <Textarea
              placeholder="Share your thoughts..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]"
              maxLength={1000}
            />
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/40">{commentText.length}/1000</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCommentDialog(false)}
                  disabled={isSubmittingComment}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmittingComment ? 'Posting...' : 'Post Comment (+3 crystals)'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

