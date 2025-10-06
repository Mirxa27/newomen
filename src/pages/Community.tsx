import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables, Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Search, UserPlus, Check, X, Users, MessageSquare, Send, Bell, Megaphone, Trophy, FileText, HelpCircle, Settings } from "lucide-react";

type UserProfile = Pick<
  Tables<"user_profiles">,
  "id" | "user_id" | "nickname" | "avatar_url" | "email"
>;

type Connection = Tables<"community_connections"> & {
  requester?: UserProfile | null;
  receiver?: UserProfile | null;
};

type ChatRoom = Tables<"community_chat_rooms">;

type ChatMessage = Tables<"community_chat_messages"> & {
  user_profiles?: UserProfile | null;
};

type Announcement = Tables<"community_announcements"> & {
  created_by?: UserProfile | null;
};

export default function Community() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  
  // Chat functionality
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    announcement_type: "general",
    priority: "normal",
    target_audience: "all"
  });
  
  // Admin functionality
  const [isAdmin, setIsAdmin] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      setIsAdmin(user.email === 'admin@newomen.me');

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return;
      setCurrentUserId(profile.id);

      // Load connections (with fallback if table doesn't exist yet)
      let connectionsData, pendingData;
      try {
        const [connectionsResult, pendingResult] = await Promise.all([
          supabase
            .from("community_connections")
            .select(`
              *,
              requester:requester_id (id, nickname, avatar_url, email),
              receiver:receiver_id (id, nickname, avatar_url, email)
            `)
            .or(`requester_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
            .eq("status", "accepted"),
          supabase
            .from("community_connections")
            .select(`
              *,
              requester:requester_id (id, nickname, avatar_url, email)
            `)
            .eq("receiver_id", profile.id)
            .eq("status", "pending")
        ]);

        connectionsData = connectionsResult.data;
        pendingData = pendingResult.data;
      } catch (error) {
        console.warn("Community connections table not available yet");
        connectionsData = [];
        pendingData = [];
      }

      setConnections(connectionsData || []);
      setPendingRequests(pendingData || []);

      // Load chat rooms (with fallback if table doesn't exist yet)
      let roomsData;
      try {
        const { data } = await supabase
          .from("community_chat_rooms")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: true });
        roomsData = data;
      } catch (error) {
        console.warn("Chat rooms table not available yet, using default rooms");
        roomsData = [
          { id: "1", name: "General Discussion", description: "Open discussion about personal growth", room_type: "general" },
          { id: "2", name: "Support Circle", description: "Get support and share experiences", room_type: "support" },
          { id: "3", name: "Announcements", description: "Official announcements and updates", room_type: "announcements" }
        ];
      }

      setChatRooms(roomsData || []);

      // Load announcements (with fallback if table doesn't exist yet)
      let announcementsData, unreadCount = 0;
      try {
        const [announcementsResult, unreadResult] = await Promise.all([
          supabase
            .from("community_announcements")
            .select(`
              *,
              created_by:created_by (id, nickname, avatar_url, email)
            `)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(10),
          // Skip RPC call until database functions are available
          Promise.resolve({ data: 0 })
        ]);

        announcementsData = announcementsResult.data;
        unreadCount = unreadResult.data || 0;
      } catch (error) {
        console.warn("Community announcements table not available yet");
        announcementsData = [];
        unreadCount = 0;
      }

      setAnnouncements(announcementsData || []);
      setUnreadCount(unreadCount);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load community data");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const searchUsers = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    if (!currentUserId) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, user_id, nickname, avatar_url, email")
        .neq("id", currentUserId)
        .or(`nickname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    }
  }, [currentUserId, searchTerm]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      void searchUsers();
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchUsers]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

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
      void searchUsers(); // Refresh results
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
      void loadData(); // Refresh all data
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

  // Chat functionality
  const loadMessages = async (roomId: string) => {
    try {
      let data;
      try {
        const result = await supabase
          .from("community_chat_messages")
          .select(`
            *,
            user_profiles:user_id (id, nickname, avatar_url, email)
          `)
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });
        data = result.data;
      } catch (dbError) {
        console.warn("Chat messages table not available yet, using sample data");
        data = [
          {
            id: "1",
            message: "Welcome to the community! Feel free to introduce yourself.",
            message_type: "text",
            created_at: new Date().toISOString(),
            user_profiles: { id: "1", nickname: "Community Bot", avatar_url: null, email: "bot@newomen.me" }
          }
        ];
      }
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const { error } = await supabase
        .from("community_chat_messages")
        .insert({
          room_id: selectedRoom.id,
          user_id: currentUserId,
          message: newMessage.trim(),
          message_type: "text"
        });

      if (error) throw error;
      setNewMessage("");
      loadMessages(selectedRoom.id);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const selectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    loadMessages(room.id);
  };

  // Announcement functionality
  const createAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Only allow admins to create announcements
      if (!isAdmin) {
        toast.error("Only administrators can create announcements");
        return;
      }

      // Try to create the announcement
      const { data, error } = await supabase
        .from("community_announcements")
        .insert([{
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          announcement_type: newAnnouncement.announcement_type,
          priority: newAnnouncement.priority,
          target_audience: newAnnouncement.target_audience,
          created_by: currentUserId
        }])
        .select()
        .single();

      if (error) {
        console.error("Error creating announcement:", error);
        if (error.code === "42P01") {
          toast.error("Database tables not found. Please run the migration first.");
        } else {
          toast.error("Failed to create announcement: " + error.message);
        }
        return;
      }

      toast.success("Announcement created successfully!");
      setNewAnnouncement({
        title: "",
        content: "",
        announcement_type: "general",
        priority: "normal",
        target_audience: "all"
      });
      setShowAnnouncementDialog(false);
      void loadData();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error("Failed to create announcement");
    }
  };

  const markAnnouncementRead = async (announcementId: string) => {
    try {
      // Only try to mark as read if the function exists
      try {
        // Skip RPC call until database functions are available
        console.log('Mark announcement read function not available yet');
      } catch (dbError) {
        console.warn("Mark announcement read function not available yet");
      }
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking announcement as read:", error);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

        <Tabs defaultValue="chat">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="announcements">
              <Bell className="w-4 h-4 mr-2" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
              Announcements
            </TabsTrigger>
            <TabsTrigger value="connections">
              <Users className="w-4 h-4 mr-2" />
              Connections ({connections.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="search">Search Users</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin">
                <Settings className="w-4 h-4 mr-2" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4 h-[600px]">
              {/* Chat Rooms Sidebar */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Chat Rooms</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-1 p-2">
                      {chatRooms.map((room) => (
                        <div
                          key={room.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedRoom?.id === room.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => selectRoom(room)}
                        >
                          <div className="flex items-center gap-2">
                            {room.room_type === "general" && <MessageSquare className="w-4 h-4" />}
                            {room.room_type === "support" && <HelpCircle className="w-4 h-4" />}
                            {room.room_type === "announcements" && <Megaphone className="w-4 h-4" />}
                            {room.room_type === "challenges" && <Trophy className="w-4 h-4" />}
                            {room.room_type === "assessments" && <FileText className="w-4 h-4" />}
                            {room.room_type === "quizzes" && <FileText className="w-4 h-4" />}
                            <div>
                              <div className="font-medium">{room.name}</div>
                              <div className="text-xs opacity-70">{room.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat Messages */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>
                    {selectedRoom ? selectedRoom.name : "Select a chat room"}
                  </CardTitle>
                  {selectedRoom && (
                    <CardDescription>{selectedRoom.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0 h-[500px] flex flex-col">
                  {selectedRoom ? (
                    <>
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.user_id === currentUserId ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[80%] p-3 rounded-lg ${
                                  message.user_id === currentUserId
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={message.user_profiles?.avatar_url} />
                                    <AvatarFallback>
                                      {(message.user_profiles?.nickname || "U")[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">
                                    {message.user_profiles?.nickname || "User"}
                                  </span>
                                  <span className="text-xs opacity-70">
                                    {new Date(message.created_at).toLocaleTimeString()}
                                  </span>
                                </div>
                                <div className="text-sm">{message.message}</div>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                      <div className="border-t p-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                          />
                          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>Select a chat room to start chatting</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Community Announcements</CardTitle>
                    <CardDescription>Stay updated with the latest news and updates</CardDescription>
                  </div>
                  {isAdmin && (
                    <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <Megaphone className="w-4 h-4 mr-2" />
                          Create Announcement
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New Announcement</DialogTitle>
                          <DialogDescription>
                            Share important updates with the community
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Title</label>
                            <Input
                              value={newAnnouncement.title}
                              onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Announcement title"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Content</label>
                            <Textarea
                              value={newAnnouncement.content}
                              onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                              placeholder="Announcement content"
                              rows={4}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Type</label>
                              <Select
                                value={newAnnouncement.announcement_type}
                                onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, announcement_type: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="general">General</SelectItem>
                                  <SelectItem value="challenge">Challenge</SelectItem>
                                  <SelectItem value="assessment">Assessment</SelectItem>
                                  <SelectItem value="quiz">Quiz</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                  <SelectItem value="feature">Feature</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Priority</label>
                              <Select
                                value={newAnnouncement.priority}
                                onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, priority: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="normal">Normal</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={createAnnouncement}>
                              Create Announcement
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No announcements yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => markAnnouncementRead(announcement.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{announcement.title}</h3>
                            <Badge variant={
                              announcement.priority === "urgent" ? "destructive" :
                              announcement.priority === "high" ? "default" : "secondary"
                            }>
                              {announcement.priority}
                            </Badge>
                            <Badge variant="outline">{announcement.announcement_type}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(announcement.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{announcement.content}</p>
                        {announcement.created_by && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={announcement.created_by.avatar_url} />
                              <AvatarFallback>
                                {(announcement.created_by.nickname || "A")[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>by {announcement.created_by.nickname || "Admin"}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                    <Button onClick={() => {
                      const searchTab = document.querySelector('[value="search"]') as HTMLButtonElement;
                      searchTab?.click();
                    }}>
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

          {isAdmin && (
            <TabsContent value="admin" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Tools</CardTitle>
                  <CardDescription>Manage community features and announcements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Quick Actions</h3>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => setShowAnnouncementDialog(true)}
                        >
                          <Megaphone className="w-4 h-4 mr-2" />
                          Create Announcement
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => navigate("/admin")}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Community Stats</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Connections:</span>
                          <Badge variant="outline">{connections.length}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending Requests:</span>
                          <Badge variant="outline">{pendingRequests.length}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Chat Rooms:</span>
                          <Badge variant="outline">{chatRooms.length}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Announcements:</span>
                          <Badge variant="outline">{announcements.length}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
