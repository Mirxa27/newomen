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
type SessionWithUserAndAgent = Sessions['Row'] & {
  user_profiles: UserProfiles['Row'] | null;
  agents: Agents['Row'] | null;
  message_count: number;
};

type NewMeConversationWithUserAndAgent = NewmeConversations['Row'] & {
  user_profiles: UserProfiles['Row'] | null;
  agents: Agents['Row'] | null;
};

type MessageHistoryRow = Messages['Row'];
type NewMeMessageRow = NewmeMessages['Row'];

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
  const [conversationMessages, setConversationMessages] = useState<(MessageHistoryRow | NewMeMessageRow)[]>([]);
  const [isNewMeConversation, setIsNewMeConversation] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: sessionsData, error: sessionsError },
        { data: newMeConversationsData, error: newMeConversationsError },
      ] = await Promise.all([
        supabase.from("sessions").select(`*, user_profiles(*), agents(*)`).order("start_ts", { ascending: false }),
        supabase.from("newme_conversations").select(`*, user_profiles(*)`).order("started_at", { ascending: false }),
      ]);

      if (sessionsError) throw sessionsError;
      if (newMeConversationsError) throw newMeConversationsError;

      setSessions(sessionsData as SessionWithUserAndAgent[] || []);
      setNewMeConversations(newMeConversationsData as NewMeConversationWithUserAndAgent[] || []);

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
    setConversationMessages([]);
    setIsViewConversationOpen(true);

    try {
      if (isNewMe) {
        const { data: messagesData, error } = await supabase
          .from('newme_messages')
          .select('*')
          .eq('conversation_id', session.id)
          .order('timestamp', { ascending: true });

        if (error) throw error;
        setConversationMessages(messagesData as NewMeMessageRow[]);
      } else {
        const { data: messagesData, error } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', session.id)
          .order('ts', { ascending: true });

        if (error) throw error;
        setConversationMessages(messagesData as MessageHistoryRow[]);
      }
    } catch (error) {
      console.error("Error loading conversation transcript:", error);
      toast.error("Failed to load transcript.");
    }
  };

  const downloadTranscript = () => {
    if (!selectedSession || conversationMessages.length === 0) return;
    
    const transcript = conversationMessages.map(msg => {
      if ('role' in msg && 'content' in msg) { // NewMeMessageRow
        const timestamp = new Date(msg.timestamp || '').toLocaleString();
        const role = msg.role === 'user' ? 'User' : 'AI Assistant';
        return `[${timestamp}] ${role}: ${msg.content}`;
      }
      if ('sender' in msg && 'text_content' in msg) { // MessageHistoryRow
        const timestamp = new Date(msg.ts || '').toLocaleString();
        const role = msg.sender === 'user' ? 'User' : 'AI Assistant';
        return `[${timestamp}] ${role}: ${msg.text_content || '[Audio message]'}`;
      }
      return '';
    }).join('\n\n');

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
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.slice(0, 10).map((session) => (
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
                      <Clock className="w-3 h-3" />
                      {formatDuration(session.duration_seconds)}
                    </div>
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
                    {new Date(session.start_ts || '').toLocaleDateString()}
                    <div className="text-xs text-muted-foreground">
                      {new Date(session.start_ts || '').toLocaleTimeString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSessions.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No sessions found.</TableCell></TableRow>}
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
              {filteredNewMeConversations.slice(0, 10).map((conversation) => (
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
                    {new Date(conversation.started_at || '').toLocaleDateString()}
                    <div className="text-xs text-muted-foreground">
                      {new Date(conversation.started_at || '').toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {conversation.emotional_tone && (
                        <Badge variant="outline" className="mb-1">
                          {conversation.emotional_tone}
                        </Badge>
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
                    {'agents' in selectedSession && <p className="text-muted-foreground">Agent: {selectedSession.agents?.name || "Default"}</p>}
                    {'duration_seconds' in selectedSession && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDuration(selectedSession.duration_seconds || null)}
                      </div>
                    )}
                    {'cost_usd' in selectedSession && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCost(selectedSession.cost_usd || null)}
                      </div>
                    )}
                    {'tokens_used' in selectedSession && (
                      <div className="text-xs text-muted-foreground">
                        {selectedSession.tokens_used || 0} tokens
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status: <Badge variant={'status' in selectedSession && selectedSession.status === "completed" || 'ended_at' in selectedSession && selectedSession.ended_at ? "default" : "secondary"}>{'status' in selectedSession ? selectedSession.status : ('ended_at' in selectedSession && selectedSession.ended_at ? "Completed" : "Active")}</Badge></p>
                    <p className="text-muted-foreground">Started: {new Date('start_ts' in selectedSession ? selectedSession.start_ts || '' : selectedSession.started_at || '').toLocaleString()}</p>
                    {'ended_at' in selectedSession && selectedSession.ended_at && <p className="text-muted-foreground">Ended: {new Date(selectedSession.ended_at).toLocaleString()}</p>}
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
            <Textarea
              readOnly
              value={conversationTranscript}
              className="w-full h-64 bg-background"
              rows={20}
            />
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