import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, UserPlus, Check, X, MessageCircle } from "lucide-react";
import { useCommunity, ConnectionStatus } from "@/hooks/useCommunity";
import { useUserProfile } from "@/hooks/useUserProfile";
import { CommunityConnectionWithProfiles } from "@/integrations/supabase/tables/community_connections";
import { UserProfiles } from "@/integrations/supabase/tables/user_profiles";
import { Badge } from "@/components/ui/badge"; // Import Badge

export default function Community() {
  const {
    connections,
    loading,
    error,
    searchResults,
    searching,
    searchUsers,
    sendConnectionRequest,
    updateConnectionStatus,
    currentUserId,
  } = useCommunity();
  const { profile } = useUserProfile(); // Get current user's profile for display name

  const [searchTerm, setSearchTerm] = useState("");

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

  const isConnectedOrPending = (userId: string) => {
    return connections.some(c =>
      (c.requester.id === userId || c.receiver.id === userId) && (c.status === 'pending' || c.status === 'accepted')
    );
  };

  const getStatusBadge = (user: UserProfiles['Row']) => {
    const connection = connections.find(c => (c.requester.id === user.id || c.receiver.id === user.id));
    if (!connection) return null;

    switch (connection.status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'accepted':
        return <Badge variant="default">Connected</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive text-center mt-8">{error}</div>;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold gradient-text">Community</h1>
        <p className="text-muted-foreground">Connect with other users on their personal growth journey.</p>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Find New Connections</CardTitle>
            <CardDescription>Search for users by nickname to send connection requests.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search by nickname..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void searchUsers(searchTerm);
                  }
                }}
                className="flex-1 glass"
              />
              <Button onClick={() => void searchUsers(searchTerm)} disabled={searching}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Search Results:</h3>
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/10">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.nickname?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{user.nickname || user.email}</span>
                    </div>
                    {user.id !== currentUserId && (
                      <Button
                        size="sm"
                        onClick={() => void sendConnectionRequest(user.id)}
                        disabled={isConnectedOrPending(user.id)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        {connections.some(c => (c.requester.id === user.id || c.receiver.id === user.id) && c.status === 'pending')
                          ? 'Pending'
                          : connections.some(c => (c.requester.id === user.id || c.receiver.id === user.id) && c.status === 'accepted')
                          ? 'Connected'
                          : 'Connect'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>Requests sent to you from other users.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.length === 0 ? (
              <p className="text-muted-foreground">No pending requests.</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/10">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={req.requester.avatar_url || undefined} />
                        <AvatarFallback>{req.requester.nickname?.[0]?.toUpperCase() || req.requester.email?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{req.requester.nickname || req.requester.email}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" className="glass" onClick={() => void updateConnectionStatus(req.id, 'declined')}>
                        <X className="w-4 h-4" />
                      </Button>
                      <Button size="icon" className="clay-button" onClick={() => void updateConnectionStatus(req.id, 'accepted')}>
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Your Connections</CardTitle>
            <CardDescription>Users you are connected with.</CardDescription>
          </CardHeader>
          <CardContent>
            {acceptedConnections.length === 0 ? (
              <p className="text-muted-foreground">You have no active connections.</p>
            ) : (
              <div className="space-y-2">
                {acceptedConnections.map(conn => {
                  const friend = conn.requester.id === currentUserId ? conn.receiver : conn.requester;
                  return (
                    <div key={conn.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10">
                      <Avatar>
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback>{friend.nickname?.[0]?.toUpperCase() || friend.email?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{friend.nickname || friend.email}</span>
                      <Link to={`/chat/${conn.id}`} className="ml-auto">
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Sent Requests</CardTitle>
            <CardDescription>Requests you have sent to other users.</CardDescription>
          </CardHeader>
          <CardContent>
            {sentRequests.length === 0 ? (
              <p className="text-muted-foreground">You have no sent requests.</p>
            ) : (
              <div className="space-y-2">
                {sentRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/10">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={req.receiver.avatar_url || undefined} />
                        <AvatarFallback>{req.receiver.nickname?.[0]?.toUpperCase() || req.receiver.email?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{req.receiver.nickname || req.receiver.email}</span>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}