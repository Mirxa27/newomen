import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Search, UserPlus, Check, X, Users } from "lucide-react";

interface UserProfile {
  id: string;
  user_id: string;
  nickname?: string;
  avatar_url?: string;
}

interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  requester?: UserProfile;
  receiver?: UserProfile;
}

export default function Community() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;
      setCurrentUserId(profile.id);

      // Load connections
      const { data: connectionsData } = await supabase
        .from("community_connections")
        .select(`
          *,
          requester:requester_id (id, nickname, avatar_url, email),
          receiver:receiver_id (id, nickname, avatar_url, email)
        `)
        .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .eq("status", "accepted");

      setConnections(connectionsData || []);

      // Load pending requests
      const { data: pendingData } = await supabase
        .from("community_connections")
        .select(`
          *,
          requester:requester_id (id, nickname, avatar_url, email)
        `)
        .eq("receiver_id", profile.id)
        .eq("status", "pending");

      setPendingRequests(pendingData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load community data");
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, nickname, avatar_url, email")
        .neq("id", currentUserId)
        .or(`nickname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchTerm]);

  const sendConnectionRequest = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("community_connections")
        .insert({
          requester_id: currentUserId,
          receiver_id: userId,
          status: "pending"
        });

      if (error) throw error;
      toast.success("Connection request sent!");
      searchUsers(); // Refresh results
    } catch (error) {
      console.error("Error sending request:", error);
      toast.error("Failed to send connection request");
    }
  };

  const handleConnectionRequest = async (connectionId: string, action: "accept" | "decline") => {
    try {
      const { error } = await supabase
        .from("community_connections")
        .update({ status: action === "accept" ? "accepted" : "declined" })
        .eq("id", connectionId);

      if (error) throw error;
      toast.success(`Connection request ${action}ed`);
      loadData(); // Refresh all data
    } catch (error) {
      console.error("Error handling request:", error);
      toast.error("Failed to handle connection request");
    }
  };

  const isConnected = (userId: string) => {
    return connections.some(c =>
      (c.requester_id === userId || c.receiver_id === userId) && c.status === "accepted"
    );
  };

  const hasPendingRequest = (userId: string) => {
    return connections.some(c =>
      c.requester_id === currentUserId &&
      c.receiver_id === userId &&
      c.status === "pending"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold gradient-text">Community</h1>
            <p className="text-muted-foreground">Connect with others on their growth journey</p>
          </div>
        </div>

        <Tabs defaultValue="connections">
          <TabsList>
            <TabsTrigger value="connections">
              My Connections ({connections.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Requests ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="search">Search Users</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Connections</CardTitle>
                <CardDescription>People you're connected with</CardDescription>
              </CardHeader>
              <CardContent>
                {connections.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Search for users to start building your community
                    </p>
                    <Button onClick={() => document.querySelector('[value="search"]')?.click()}>
                      Search Users
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {connections.map((connection) => {
                      const otherUser = connection.requester_id === currentUserId
                        ? connection.receiver
                        : connection.requester;

                      return (
                        <div key={connection.id} className="glass p-4 rounded-lg flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={otherUser?.avatar_url} />
                            <AvatarFallback>
                              {(otherUser?.nickname || otherUser?.email || "U")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">{otherUser?.nickname || "User"}</h4>
                            <p className="text-sm text-muted-foreground">{otherUser?.email}</p>
                          </div>
                          <Badge>Connected</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>Connection requests waiting for your response</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="glass p-4 rounded-lg flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.requester?.avatar_url} />
                          <AvatarFallback>
                            {(request.requester?.nickname || request.requester?.email || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{request.requester?.nickname || "User"}</h4>
                          <p className="text-sm text-muted-foreground">{request.requester?.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleConnectionRequest(request.id, "accept")}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConnectionRequest(request.id, "decline")}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Users</CardTitle>
                <CardDescription>Find and connect with other members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by nickname or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((user) => (
                      <div key={user.id} className="glass p-4 rounded-lg flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>
                            {(user.nickname || user.email || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold">{user.nickname || "User"}</h4>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        {isConnected(user.id) ? (
                          <Badge>Connected</Badge>
                        ) : hasPendingRequest(user.id) ? (
                          <Badge variant="secondary">Request Sent</Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => sendConnectionRequest(user.id)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {searchTerm && searchResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found matching "{searchTerm}"
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
