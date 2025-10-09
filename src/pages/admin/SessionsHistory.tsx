import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, MessageCircle, Clock, DollarSign, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sessions } from "@/integrations/supabase/tables/sessions";
import { NewmeConversations } from "@/integrations/supabase/tables/newme_conversations";
import { UserProfiles } from "@/integrations/supabase/tables/user_profiles";
import { Agents } from "@/integrations/supabase/tables/agents";
import { Messages } from "@/integrations/supabase/tables/messages";
import { NewmeMessages } from "@/integrations/supabase/tables/newme_messages";
import { Input } from "@/components/ui/input";

// Define types for joined data
interface SessionWithUserAndAgent extends Sessions['Row'] {
  user_profiles: UserProfiles['Row'] | null;
  agents: Agents['Row'] | null;
  message_count: number;
}

interface NewMeConversationWithUserAndAgent extends NewmeConversations['Row'] {
  user_profiles: UserProfiles['Row'] | null;
  agents: Agents['Row'] | null;
}

interface MessageHistoryRow extends Messages['Row'] {
  // Add any specific relations if needed for 'messages' table
}

interface NewMeMessageRow extends NewmeMessages['Row'] {
  // Add any specific relations if needed for 'newme_messages' table
}

// Helper function to format duration
const formatDuration = (seconds: number | null) => {
  if (seconds === null) return "N/A";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

// Helper function to format cost
const formatCost = (cost: number | null) => {
  if (cost === null) return "$0.00";
  return `$${cost.toFixed(2)}`;
};

export default function SessionsHistory() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionWithUserAndAgent[]>([]);
  const [newMeConversations, setNewMeConversations] = useState<NewMeConversationWithUserAndAgent[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionWithUserAndAgent[]>([]);
  const [newMeConversationStats, setNewMeConversationStats] = useState<NewMeConversationWithUserAndAgent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isViewConversationOpen, setIsViewConversationOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionWithUserAndAgent | NewMeConversationWithUserAndAgent | null>(null);
  const [conversationTranscript, setConversationTranscript] = useState("");
  const [isNewMeConversation, setIsNewMeConversation] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: sessionsData, error: sessionsError },
        { data: newMeConversationsData, error: newMeConversationsError },
      ] = await Promise.all([
        supabase.from("sessions").select(`*, user_profiles(*), agents(*)`).order("created_at", { ascending: false }),
        supabase.from("newme_conversations").select(`*, user_profiles(*), agents(*)`).order("created_at", { ascending: false }),
      ]);

      if (sessionsError) throw sessionsError;
      if (newMeConversationsError) throw newMeConversationsError;

      setSessions(sessionsData as SessionWithUserAndAgent[] || []);
      setNewMeConversations(newMeConversationsData as NewMeConversationWithUserAndAgent[] || []);

      // For stats, we might want to process the raw data or fetch aggregated data
      setSessionStats(sessionsData as SessionWithUserAndAgent[] || []);
      setNewMeConversationStats(newMeConversationsData as NewMeConversationWithUserAndAgent[] || []);

    } catch (error) {
      console.error("Error loading analytics data:", error);
      toast.error("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const viewConversation = async (session: SessionWithUserAndAgent | NewMeConversationWithUserAndAgent, isNewMe: boolean) => {
    setSelectedSession(session);
    setIsNewMeConversation(isNewMe);
    setConversationTranscript("Loading transcript...");
    setIsViewConversationOpen(true);

    try {
      let transcript = "";
      if (isNewMe) {
        const { data: messagesData, error } = await supabase
          .from('newme_messages')
          .select('*')
          .eq('conversation_id', session.id)
          .order('ts', { ascending: true });

        if (error) throw error;
        const conversationMessages = messagesData as NewMeMessageRow[];
        transcript = conversationMessages.map(msg => {
          const timestamp = new Date(msg.ts || '').toLocaleString();
          const role = msg.sender === 'user' ? 'User' :
                       msg.sender === 'assistant' ? 'AI Assistant' : 'System';
          return `[${timestamp}] ${role}: ${msg.text_content || '[Audio message]'}`;
        }).join('\n\n');
      } else {
        const { data: messagesData, error } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', session.id)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        const conversationMessages = messagesData as MessageHistoryRow[];
        transcript = conversationMessages.map(msg => {
          const timestamp = new Date(msg.timestamp || '').toLocaleString();
          const role = msg.role === 'user' ? 'User' :
                       msg.role === 'assistant' ? 'AI Assistant' : 'System';
          return `[${timestamp}] ${role}: ${msg.content}`;
        }).join('\n\n');
      }
      setConversationTranscript(transcript);
    } catch (error) {
      console.error("Error loading conversation transcript:", error);
      setConversationTranscript("Failed to load transcript.");
    }
  };

  const downloadTranscript = () => {
    if (!selectedSession || !conversationTranscript) return;
    const blob = new Blob([conversationTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${selectedSession.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredSessions = sessions.filter((session) =>
    session.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.user_profiles?.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.agents?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const filteredNewMeConversations = newMeConversations.filter((conv) =>
    conv.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.user_profiles?.nickname?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const totalSessions = sessionStats.length;
  const activeSessions = sessionStats.filter(s => s.status === "active").length;
  const completedSessions = sessionStats.filter(s => s.status === "completed").length;
  const avgSessionDuration = totalSessions > 0
    ? sessionStats.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0) / totalSessions
    : 0;
  const uniqueSessionUsers = new Set(sessionStats.map(s => s.user_id)).size;

  const totalNewMeConversationsCount = newMeConversationStats.length;
  const activeNewMeConversationsCount = newMeConversationStats.filter(c => !c.ended_at).length;
  const completedNewMeConversationsCount = newMeConversationStats.filter(c => c.ended_at).length;
  const avgNewMeMessageCount = totalNewMeConversationsCount > 0
    ? newMeConversationStats.reduce((acc, curr) => acc + (curr.message_count || 0), 0) / totalNewMeConversationsCount
    : 0;
  const uniqueNewMeUsers = new Set(newMeConversationStats.map(c => c.user_id)).size;


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Overall Session Analytics</CardTitle>
          <CardDescription>High-level overview of all user sessions and conversations.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Realtime Sessions</h3>
            <div className="space-y-1">
              <p>Total Sessions: {totalSessions}</p>
              <p>Active Sessions: {activeSessions}</p>
              <p>Completed Sessions: {completedSessions}</p>
              <p>Average Duration: {avgSessionDuration.toFixed(2)} seconds</p>
              <p>Unique Users: {uniqueSessionUsers}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">NewMe Conversations</h3>
            <div className="space-y-1">
              <p>Total Conversations: {totalNewMeConversationsCount}</p>
              <p>Active Conversations: {activeNewMeConversationsCount}</p>
              <p>Completed Conversations: {completedNewMeConversationsCount}</p>
              <p>Average Message Count: {avgNewMeMessageCount.toFixed(2)}</p>
              <p>Unique Users: {uniqueNewMeUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Realtime Sessions</CardTitle>
          <CardDescription>Detailed history of interactions with AI agents.</CardDescription>
          <Input
            placeholder="Search sessions by user or agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-4 glass"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Cost/Tokens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                                className="h-6 w-6 rounded-full"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                {session.user_profiles?.nickname?.[0]?.toUpperCase() || session.user_profiles?.email?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="font-medium">
                                {session.user_profiles?.nickname || "Anonymous"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {session.user_profiles?.email}
                              </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="rounded-sm">Legacy</Badge> {session.agents?.name || "Default"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {session.message_count}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(session.duration_seconds)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.cost_usd !== null && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {formatCost(session.cost_usd)}
                            </div>
                          )}
                          {session.tokens_used !== null && (
                            <div className="text-xs text-muted-foreground">
                              {session.tokens_used || 0} tokens
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            session.status === "completed" ? "default" :
                            session.status === "active" ? "secondary" : "destructive"
                          }>
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(session.created_at).toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {new Date(session.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => viewConversation(session, false)} disabled={session.message_count === 0}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
              {filteredSessions.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No sessions found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent NewMe Conversations</CardTitle>
          <CardDescription>Latest conversations with the NewMe AI.</CardDescription>
          <Input
            placeholder="Search conversations by user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-4 glass"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Emotional Tone</TableHead>
                <TableHead>Topics Discussed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNewMeConversations.map((conversation) => (
                      <TableRow key={conversation.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {conversation.user_profiles?.avatar_url ? (
                              <img
                                src={conversation.user_profiles.avatar_url}
                                alt="Avatar"
                                className="h-6 w-6 rounded-full"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                {conversation.user_profiles?.nickname?.[0]?.toUpperCase() || conversation.user_profiles?.email?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="font-medium">
                                {conversation.user_profiles?.nickname || "Anonymous"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {conversation.user_profiles?.email}
                              </div>
                          </div>
                        </TableCell>
                        <TableCell>{conversation.title || "Untitled"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {conversation.message_count}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(conversation.created_at).toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {new Date(conversation.created_at).toLocaleTimeString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {conversation.emotional_tone && (
                              <Badge variant="outline" className="mb-1">
                                {conversation.emotional_tone}
                              </Badge>
                            )}
                            {conversation.topics_discussed && Array.isArray(conversation.topics_discussed) && conversation.topics_discussed.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {(conversation.topics_discussed as string[]).slice(0, 2).join(', ')}
                                {(conversation.topics_discussed as string[]).length > 2 && '...'}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            {conversation.topics_discussed && Array.isArray(conversation.topics_discussed) && conversation.topics_discussed.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {(conversation.topics_discussed as string[]).slice(0, 2).join(', ')}
                                {(conversation.topics_discussed as string[]).length > 2 && '...'}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={conversation.ended_at ? "default" : "secondary"}>
                            {conversation.ended_at ? "Completed" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => viewConversation(conversation, true)} disabled={conversation.message_count === 0}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
              {filteredNewMeConversations.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No NewMe conversations found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isViewConversationOpen} onOpenChange={setIsViewConversationOpen}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Conversation Transcript</DialogTitle>
            <DialogDescription>
              Complete conversation with {selectedSession?.user_profiles?.nickname || "User"} ({selectedSession?.user_profiles?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 border rounded-md bg-muted/20">
            {selectedSession && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {selectedSession.user_profiles?.avatar_url ? (
                    <img
                      src={selectedSession.user_profiles.avatar_url}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm">
                      {selectedSession.user_profiles?.nickname?.[0]?.toUpperCase() || selectedSession.user_profiles?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{selectedSession.user_profiles?.nickname || "Anonymous"}</div>
                    <div className="text-sm text-muted-foreground">{selectedSession.user_profiles?.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Session ID: <span className="font-mono text-xs">{selectedSession.id}</span></p>
                    <p className="text-muted-foreground">Agent: {selectedSession.agents?.name || "Default"}</p>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {selectedSession ? formatDuration(selectedSession.duration_seconds || null) : "N/A"}
                    </div>
                    {selectedSession && 'cost_usd' in selectedSession && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCost(selectedSession.cost_usd || null)}
                      </div>
                    )}
                    {selectedSession && 'tokens_used' in selectedSession && (
                      <div className="text-xs text-muted-foreground">
                        {selectedSession.tokens_used || 0} tokens
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status: <Badge variant={selectedSession.status === "completed" || selectedSession.ended_at ? "default" : "secondary"}>{selectedSession.status || (selectedSession.ended_at ? "Completed" : "Active")}</Badge></p>
                    <p className="text-muted-foreground">Started: {new Date(selectedSession.created_at).toLocaleString()}</p>
                    {selectedSession.ended_at && <p className="text-muted-foreground">Ended: {new Date(selectedSession.ended_at).toLocaleString()}</p>}
                    <Badge variant="outline">
                      {selectedSession.user_profiles?.subscription_tier || "discovery"}
                    </Badge>
                  </div>
                </div>
                {isNewMeConversation && (selectedSession as NewMeConversationWithUserAndAgent).emotional_tone && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    Emotional Tone: <Badge variant="outline">{(selectedSession as NewMeConversationWithUserAndAgent).emotional_tone}</Badge>
                  </div>
                )}
                {isNewMeConversation && (selectedSession as NewMeConversationWithUserAndAgent).topics_discussed && Array.isArray((selectedSession as NewMeConversationWithUserAndAgent).topics_discussed) && (
                  <div className="text-sm text-muted-foreground">
                    Topics: {((selectedSession as NewMeConversationWithUserAndAgent).topics_discussed as string[]).join(', ')}
                  </div>
                )}
              </div>
            )}
            <h3 className="text-lg font-semibold mt-4 mb-2">Conversation Log:</h3>
            {isNewMeConversation ? (
              <div className="space-y-4">
                {(conversationMessages as NewMeMessageRow[]).map((message, index) => (
                      <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : message.sender === 'system'
                            ? 'bg-muted/50 border border-border'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <div className="text-sm font-medium mb-1">
                            {message.sender === 'user' ? 'User' :
                             message.sender === 'assistant' ? 'AI Assistant' : 'System'}
                          </div>
                          <div className="text-sm whitespace-pre-wrap">
                            {message.text_content || "Audio message"}
                          </div>
                          {message.audio_url && (
                            <div className="mt-2">
                              <audio controls className="w-full">
                                <source src={message.audio_url} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}
                          <div className="text-xs opacity-70 mt-1">
                            {new Date(message.ts).toLocaleString()}
                          </div>
                          {message.emotion_detected && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                {message.emotion_detected}
                                {message.sentiment_score !== null && ` (${message.sentiment_score?.toFixed(2)})`}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(conversationMessages as MessageHistoryRow[]).map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : message.role === 'system'
                            ? 'bg-muted/50 border border-border'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <div className="text-sm font-medium mb-1">
                            {message.role === 'user' ? 'User' :
                             message.role === 'assistant' ? 'AI Assistant' : 'System'}
                          </div>
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                          <div className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp || '').toLocaleString()}
                          </div>
                          {message.emotion_detected && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                {message.emotion_detected}
                                {message.sentiment_score !== null && ` (${message.sentiment_score?.toFixed(2)})`}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={downloadTranscript} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Transcript
            </Button>
            <Button onClick={() => setIsViewConversationOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}