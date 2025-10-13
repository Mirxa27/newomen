import { useState, useMemo, useEffect } from 'react';
import { useCommunity } from '@/hooks/useCommunity';
import { useCommunityPosts } from '@/hooks/useCommunityPosts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, Search, Check, X, Mail, Send, Plus, Sparkles, TrendingUp, MessageSquare } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { Badge } from '@/components/ui/badge';
import { PostCard } from '@/components/community/PostCard';
import { PostComposer } from '@/components/community/PostComposer';
import { Announcements } from '@/components/community/Announcements';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Community() {
  const {
    loading,
    connections,
    searchResults,
    searching,
    searchUsers,
    sendConnectionRequest,
    updateConnectionStatus,
    currentUserId,
  } = useCommunity();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [activeTab, setActiveTab] = useState<'feed' | 'connections'>('feed');
  const [postFilter, setPostFilter] = useState<string>('all');
  const [showComposer, setShowComposer] = useState(false);

  const { 
    posts, 
    loading: postsLoading,
    createPost,
    likePost,
    unlikePost,
    commentOnPost,
    refreshPosts
  } = useCommunityPosts(postFilter);

  useEffect(() => {
    if (debouncedSearchQuery) {
      void searchUsers(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, searchUsers]);

  const pendingRequests = useMemo(() =>
    connections.filter(c => c.status === 'pending' && c.receiver.id === currentUserId),
    [connections, currentUserId]
  );

  const acceptedConnections = useMemo(() =>
    connections.filter(c => c.status === 'accepted'),
    [connections]
  );

  const sentRequests = useMemo(() =>
    connections.filter(c => c.status === 'pending' && c.requester.id === currentUserId),
    [connections, currentUserId]
  );

  const isAlreadyConnectedOrPending = (userId: string) => {
    return connections.some(c =>
      (c.requester.id === userId || c.receiver.id === userId)
    );
  };

  return (
    <div className="app-page-shell">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="glass rounded-3xl border border-white/10 p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Community
              </h1>
              <p className="text-white/60 mt-1">Connect, share, and grow together</p>
            </div>
            
            <Dialog open={showComposer} onOpenChange={setShowComposer}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2">
                  <Plus className="w-4 h-4" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Create a New Post</DialogTitle>
                </DialogHeader>
                <PostComposer 
                  onPostCreated={async (postData) => {
                    await createPost(postData);
                    setShowComposer(false);
                  }}
                  onCancel={() => setShowComposer(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'feed' | 'connections')} className="space-y-6">
          <TabsList className="glass border border-white/10 w-full sm:w-auto">
            <TabsTrigger value="feed" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Community Feed
            </TabsTrigger>
            <TabsTrigger value="connections" className="gap-2">
              <Users className="w-4 h-4" />
              Connections
              {pendingRequests.length > 0 && (
                <Badge className="ml-2 bg-pink-500 text-white">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Feed Tab */}
          <TabsContent value="feed" className="space-y-6">
            <div className="grid md:grid-cols-[1fr_300px] gap-6">
              {/* Posts Feed */}
              <div className="space-y-4">
                {/* Filter */}
                <div className="glass rounded-2xl border border-white/10 p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white/80 font-medium">Filter:</span>
                    {['all', 'story', 'question', 'achievement', 'resource'].map(filter => (
                      <Button
                        key={filter}
                        size="sm"
                        variant={postFilter === filter ? 'default' : 'ghost'}
                        onClick={() => setPostFilter(filter)}
                        className={postFilter === filter 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                          : 'text-white/60 hover:text-white'}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Posts */}
                {postsLoading ? (
                  <div className="glass rounded-3xl border border-white/10 p-12 text-center">
                    <div className="animate-pulse">
                      <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                      <p className="text-white/60">Loading posts...</p>
                    </div>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="glass rounded-3xl border border-white/10 p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-white/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Posts Yet</h3>
                    <p className="text-white/60 mb-6">Be the first to share your journey!</p>
                    <Button 
                      onClick={() => setShowComposer(true)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create First Post
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onLike={likePost}
                        onUnlike={unlikePost}
                        onComment={commentOnPost}
                        onClick={(postId) => {
                          // Navigate to post detail page
                          console.log('Open post:', postId);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Trending Topics */}
                <div className="glass rounded-2xl border border-white/10 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-white">Trending Topics</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['growth', 'mindfulness', 'self-love', 'breakthrough', 'journey'].map(tag => (
                      <Badge 
                        key={tag}
                        variant="secondary"
                        className="bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 cursor-pointer"
                        onClick={() => {
                          // Filter by tag
                          console.log('Filter by tag:', tag);
                        }}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Community Stats */}
                <div className="glass rounded-2xl border border-white/10 p-4">
                  <h3 className="font-semibold text-white mb-3">Community Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/70">
                      <span>Total Posts:</span>
                      <span className="font-semibold text-white">{posts.length}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Your Connections:</span>
                      <span className="font-semibold text-white">{acceptedConnections.length}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Pending Requests:</span>
                      <span className="font-semibold text-white">{pendingRequests.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Find New Connections
                </CardTitle>
                <CardDescription>Search for other members to connect with.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    type="text"
                    placeholder="Search by nickname..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="glass"
                  />
                </div>
                {searching && <div className="text-center p-4">Searching...</div>}
                <div className="space-y-2">
                  {searchResults.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/10">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>{user.nickname?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{user.nickname}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => sendConnectionRequest(user.id)}
                        disabled={isAlreadyConnectedOrPending(user.id)}
                        className="clay-button"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {connections.some(c => (c.requester.id === user.id || c.receiver.id === user.id) && c.status === 'pending') 
                          ? 'Pending' 
                          : connections.some(c => (c.requester.id === user.id || c.receiver.id === user.id) && c.status === 'accepted')
                          ? 'Connected'
                          : 'Connect'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {pendingRequests.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Pending Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/10">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={req.requester.avatar_url || undefined} />
                          <AvatarFallback>{req.requester.nickname?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{req.requester.nickname}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="outline" className="glass" onClick={() => updateConnectionStatus(req.id, 'declined')}>
                          <X className="w-4 h-4" />
                        </Button>
                        <Button size="icon" className="clay-button" onClick={() => updateConnectionStatus(req.id, 'accepted')}>
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="md:col-span-1">
            <Card className="glass-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Your Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && <div className="text-center">Loading connections...</div>}
                {!loading && acceptedConnections.length === 0 && sentRequests.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <p>You haven't made any connections yet.</p>
                  </div>
                )}
                <Tabs defaultValue="accepted">
                  <TabsList className="grid w-full grid-cols-2 glass">
                    <TabsTrigger value="accepted">Connected</TabsTrigger>
                    <TabsTrigger value="pending">Sent</TabsTrigger>
                  </TabsList>
                  <TabsContent value="accepted" className="space-y-2 mt-4">
                    {acceptedConnections.map(conn => {
                      const friend = conn.requester.id === currentUserId ? conn.receiver : conn.requester;
                      return (
                        <div key={conn.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10">
                          <Avatar>
                            <AvatarImage src={friend.avatar_url || undefined} />
                            <AvatarFallback>{friend.nickname?.[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{friend.nickname}</span>
                        </div>
                      );
                    })}
                  </TabsContent>
                  <TabsContent value="pending" className="space-y-2 mt-4">
                    {sentRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/10">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={req.receiver.avatar_url || undefined} />
                            <AvatarFallback>{req.receiver.nickname?.[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{req.receiver.nickname}</span>
                        </div>
                        <Badge variant="secondary" className="glass">
                          <Send className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
