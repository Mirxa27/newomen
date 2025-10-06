import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Search, Eye, MessageSquare, User, Clock, DollarSign, Download } from "lucide-react";
import { toast } from "sonner";

type SessionHistoryRow = Tables<"sessions"> & {
  user_profiles: Pick<Tables<"user_profiles">, "nickname" | "email" | "avatar_url" | "subscription_tier"> | null;
  agents: { name: string } | null;
};

type MessageHistoryRow = Pick<Tables<"messages">, "id" | "sender" | "text_content" | "audio_url" | "ts">;

export default function SessionsHistory() {
  const [sessions, setSessions] = useState<SessionHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<SessionHistoryRow | null>(null);
  const [conversationMessages, setConversationMessages] = useState<MessageHistoryRow[]>([]);
  const [viewingConversation, setViewingConversation] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select<SessionHistoryRow>(`
          *,
          user_profiles!inner(nickname, email, avatar_url, subscription_tier),
          agents(name)
        `)
        .neq("status", "active")
        .order("start_ts", { ascending: false })
        .limit(100);

      if (error) throw error;
      setSessions(data ?? []);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load session history");
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select<MessageHistoryRow>("id, sender, text_content, audio_url, ts")
        .eq("session_id", sessionId)
        .order("ts", { ascending: true });

      if (error) throw error;
      setConversationMessages(data ?? []);
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    }
  };

  const viewConversation = async (session: SessionHistoryRow) => {
    setSelectedSession(session);
    setViewingConversation(true);
    await loadConversation(session.id);
  };

  const downloadTranscript = () => {
    if (!selectedSession || conversationMessages.length === 0) return;
    
    const transcript = conversationMessages.map(msg => 
      `[${new Date(msg.ts).toLocaleString()}] ${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text_content || '[Audio message]'}`
    ).join('\n\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${selectedSession.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (durationSeconds: number | null) => {
    if (!durationSeconds) return "N/A";
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatCost = (costUsd: number | null) => {
    if (!costUsd) return "$0.00";
    return `$${costUsd.toFixed(4)}`;
  };

  const filteredSessions = sessions.filter((session) =>
    session.user_profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.user_profiles?.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>
            Review past conversations, transcripts, and analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No sessions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
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
                        {formatDuration(session.duration_seconds)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(session.start_ts).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{session.tokens_used || 0}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCost(session.cost_usd)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => viewConversation(session)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Viewer Dialog */}
      <Dialog open={viewingConversation} onOpenChange={setViewingConversation}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversation Transcript
            </DialogTitle>
            <DialogDescription>
              Complete conversation with {selectedSession?.user_profiles?.nickname || "User"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
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
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedSession ? formatDuration(selectedSession.duration_seconds) : "N/A"}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {selectedSession ? formatCost(selectedSession.cost_usd) : "$0.00"}
                  </div>
                  <Badge variant="outline">
                    {selectedSession?.user_profiles?.subscription_tier || "discovery"}
                  </Badge>
                </div>
              </div>
              <Button onClick={downloadTranscript} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            
            <ScrollArea className="h-[400px] border rounded-lg p-4">
              {conversationMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No messages found in this conversation.
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <div className="text-sm font-medium mb-1">
                          {message.sender === 'user' ? 'User' : 'AI Assistant'}
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
                          {new Date(message.ts).toLocaleString()}
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
