import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Mic, MicOff, PhoneOff, Eye, MessageSquare, User, Clock } from "lucide-react";

type SessionRow = {
  id: string;
  agent_id: string | null;
  start_ts: string;
  status: string;
  user_profiles: {
    nickname: string | null;
    email: string;
    avatar_url: string | null;
    subscription_tier: string | null;
  } | null;
  agents: { name: string } | null;
  is_muted: boolean | null;
};

type SessionResponse = {
  id: string;
  agent_id: string | null;
  start_ts: string;
  status: string;
  is_muted: boolean | null;
  user_profiles: {
    nickname: string | null;
    email: string;
    avatar_url: string | null;
    subscription_tier: string | null;
  } | null;
  agents: { name: string } | null;
};

type MessageRow = {
  id: string;
  sender: string;
  text_content: string | null;
  audio_url: string | null;
  ts: string;
};

export default function SessionsLive() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);
  const [conversationMessages, setConversationMessages] = useState<MessageRow[]>([]);
  const [viewingConversation, setViewingConversation] = useState(false);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select(
          `id, agent_id, start_ts, status, is_muted, user_profiles!inner(nickname, email, avatar_url, subscription_tier), agents(name)`
        )
        .eq("status", "active")
        .order("start_ts", { ascending: false });
      
      if (error) throw error;
      
      const typedData: SessionRow[] = (data as SessionResponse[] || []).map((item) => ({
        id: item.id,
        agent_id: item.agent_id,
        start_ts: item.start_ts,
        status: item.status,
        user_profiles: item.user_profiles,
        agents: item.agents,
        is_muted: item.is_muted ?? false,
      }));
      
      setSessions(typedData);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (sessionId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender, text_content, audio_url, ts")
      .eq("session_id", sessionId)
      .order("ts", { ascending: true });

    if (error) throw error;
    setConversationMessages((data as MessageRow[]) || []);
  };

  const viewConversation = async (session: SessionRow) => {
    setSelectedSession(session);
    setViewingConversation(true);
    try {
      await loadConversation(session.id);
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

  const toggleMuteSession = async (session: SessionRow) => {
    const nextMuted = !session.is_muted;
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ is_muted: nextMuted })
        .eq("id", session.id);

      if (error) throw error;
      toast.success(nextMuted ? "Session muted" : "Session unmuted");
      loadSessions();
    } catch (error) {
      console.error("Error toggling mute:", error);
      toast.error("Failed to update mute state");
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ status: "ended", end_ts: new Date().toISOString() })
        .eq("id", sessionId);

      if (error) throw error;
      toast.success("Session ended");
      loadSessions();
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error("Failed to end session");
    }
  };

  const getDuration = (startTs: string) => {
    const start = new Date(startTs);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Live Sessions</CardTitle>
              <CardDescription>
                Monitor and control active conversations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500 animate-pulse" />
              <span className="font-semibold">{sessions.length} Active</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No active sessions
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Mute</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {session.user_profiles?.avatar_url ? (
                            <img
                              src={session.user_profiles.avatar_url}
                              alt="Avatar"
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-3 h-3" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">
                              {session.user_profiles?.nickname || "Anonymous"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {session.user_profiles?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{session.agents?.name || "Default"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getDuration(session.start_ts)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(session.start_ts).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {session.user_profiles?.subscription_tier || "discovery"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.is_muted ? "secondary" : "default"}>
                          {session.is_muted ? "Muted" : "Live"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <Activity className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewConversation(session)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMuteSession(session)}
                          >
                            {session.is_muted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => endSession(session.id)}
                          >
                            <PhoneOff className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewingConversation} onOpenChange={setViewingConversation}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Live Conversation
            </DialogTitle>
            <DialogDescription>
              Real-time conversation with {selectedSession?.user_profiles?.nickname || "User"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {selectedSession?.user_profiles?.avatar_url ? (
                  <img
                    src={selectedSession.user_profiles.avatar_url}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{selectedSession?.user_profiles?.nickname || "Anonymous"}</div>
                  <div className="text-sm text-muted-foreground">{selectedSession?.user_profiles?.email}</div>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedSession ? getDuration(selectedSession.start_ts) : "0:00"}
                </div>
                <Badge variant="outline">
                  {selectedSession?.user_profiles?.subscription_tier || "discovery"}
                </Badge>
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg p-4">
              {conversationMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No messages yet. Conversation is starting...
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {message.sender === "user" ? "User" : "AI Assistant"}
                        </div>
                        <div className="text-sm">
                          {message.text_content || "Audio message"}
                        </div>
                        {message.audio_url && (
                          <div className="mt-2">
                            <audio controls className="w-full">
                              <source src={message.audio_url} type="audio/mpeg" />
                            </audio>
                          </div>
                        )}
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(message.ts).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
