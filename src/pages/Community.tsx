import { useState, useMemo, useEffect } from 'react';
import { useCommunity } from '@/hooks/useCommunity';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, Search, Check, X, Mail, Send } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { Badge } from '@/components/ui/badge';

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
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold gradient-text">Community</h1>

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
      </div>
    </div>
  );
}