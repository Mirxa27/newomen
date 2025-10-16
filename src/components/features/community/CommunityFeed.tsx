import React, { useState, useEffect, useCallback } from 'react';
import { CommunityService } from '@/services/features/community/CommunityService';
import type { CommunityPost } from '@/types/validation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/shared/ui/avatar';
import { MessageSquare, ThumbsUp, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const communityService = new CommunityService();
      const feedPosts = await communityService.getCommunityFeed({ limit: 20 });
      if (feedPosts.success) {
        setPosts(feedPosts.data as CommunityPost[]);
      }
    } catch (error) {
      console.error("Error loading community feed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const goToPost = (postId: string) => {
    navigate(`/community/post/${postId}`);
  };

  if (loading) {
    return <p>Loading community feed...</p>;
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <Card key={post.id} className="cursor-pointer" onClick={() => goToPost(post.id)}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={post.author?.avatar_url} />
                <AvatarFallback>{post.author?.full_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{post.title}</CardTitle>
                <CardDescription>by {post.author?.full_name || 'Anonymous'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-3">{post.content}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
              <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> {post.likes_count}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {post.comments_count}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}





