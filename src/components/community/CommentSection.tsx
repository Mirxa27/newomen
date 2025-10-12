import React, { useState } from 'react';
import { Send, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { PostComment } from '@/hooks/useCommunityPosts';

interface CommentSectionProps {
  postId: string;
  comments: PostComment[];
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  currentUserAvatar?: string;
  currentUserName?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  comments,
  onAddComment,
  currentUserAvatar,
  currentUserName = 'You'
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async (parentId?: string) => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment, parentId);
      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const getReplies = (commentId: string) => comments.filter(c => c.parent_comment_id === commentId);

  const CommentItem: React.FC<{ comment: PostComment; isReply?: boolean }> = ({ comment, isReply = false }) => {
    const authorName = comment.user_profiles?.nickname || 'Anonymous';
    const authorAvatar = comment.user_profiles?.avatar_url;
    const authorInitial = authorName.charAt(0).toUpperCase();
    const replies = getReplies(comment.id);

    return (
      <div className={`${isReply ? 'ml-12' : ''}`}>
        <div className="flex gap-3 group">
          <Avatar className="w-8 h-8 border-2 border-white/10 shrink-0">
            <AvatarImage src={authorAvatar} alt={authorName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
              {authorInitial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="glass rounded-2xl border border-white/10 p-3 group-hover:border-white/20 transition-all">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-sm">{authorName}</span>
                <span className="text-xs text-white/40">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
                {comment.is_edited && (
                  <span className="text-xs text-white/30">(edited)</span>
                )}
              </div>
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2 ml-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-white/50 hover:text-pink-400 h-7 px-2"
              >
                <Heart className="w-3 h-3 mr-1" />
                {comment.likes_count || 0}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-white/50 hover:text-blue-400 h-7 px-2"
                onClick={() => setReplyingTo(comment.id)}
              >
                Reply
              </Button>
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-3 ml-3">
                <div className="flex gap-2">
                  <Textarea
                    placeholder={`Reply to ${authorName}...`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-sm min-h-[60px] resize-none"
                    maxLength={500}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSubmitComment(comment.id)}
                      disabled={isSubmitting || !newComment.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null);
                        setNewComment('');
                      }}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Replies */}
            {replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {replies.map(reply => (
                  <CommentItem key={reply.id} comment={reply} isReply />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Add Comment Form */}
      <div className="glass rounded-2xl border border-white/10 p-4">
        <div className="flex gap-3">
          <Avatar className="w-8 h-8 border-2 border-white/10 shrink-0">
            <AvatarImage src={currentUserAvatar} alt={currentUserName} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
              {currentUserName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 text-sm min-h-[60px] resize-none"
              maxLength={500}
            />
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/40">
                {newComment.length}/500 characters
              </span>
              <Button
                size="sm"
                onClick={() => handleSubmitComment()}
                disabled={isSubmitting || !newComment.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2"
              >
                <Send className="w-3 h-3" />
                Comment
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white/80">
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </h4>
          
          {topLevelComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white/40 text-sm">
          No comments yet. Be the first to share your thoughts!
        </div>
      )}
    </div>
  );
};

