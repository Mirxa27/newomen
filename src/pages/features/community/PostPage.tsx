import { useParams, useNavigate } from 'react-router-dom';
import { useCommunityPost } from '@/hooks/features/community/useCommunityPost';
import { PostCard } from '@/components/features/community/PostCard';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { Card, CardContent } from '@/components/shared/ui/card';
import { ArrowLeft, Send } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/features/auth/useAuth';

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { post, comments, loading, error, addComment } = useCommunityPost(postId || '');

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim() || !postId) return;
    setIsSubmitting(true);
    await addComment(newComment);
    setNewComment('');
    setIsSubmitting(false);
  };

  if (loading) {
    return <div className="app-page-shell">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
            Loading post...
        </div>
    </div>;
  }

  if (error) {
    return <div className="app-page-shell">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-red-500">
            Error: {error}
        </div>
    </div>;
  }

  if (!post) {
    return <div className="app-page-shell">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
            Post not found.
        </div>
    </div>;
  }

  return (
    <div className="app-page-shell">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/80 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Community
        </Button>
        
        <PostCard post={post} />

        <h2 className="text-2xl font-bold text-white pt-6">Comments ({post.comments_count})</h2>
        
        <div className="space-y-4">
          {comments.map(comment => (
            <Card key={comment.id} className="glass-card">
              <CardContent className="p-4 flex gap-4">
                <Avatar>
                  <AvatarImage src={comment.user_profiles?.avatar_url} />
                  <AvatarFallback>{comment.user_profiles?.nickname?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-white">{comment.user_profiles?.nickname}</p>
                  <p className="text-white/80 text-sm">{comment.content}</p>
                  <p className="text-xs text-white/50 mt-1">{new Date(comment.created_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {user && (
          <Card className="glass-card mt-6">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Leave a comment</h3>
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={user.user_metadata.avatar_url} />
                  <AvatarFallback>{user.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="glass"
                  />
                  <Button onClick={handleAddComment} disabled={isSubmitting || !newComment.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}





