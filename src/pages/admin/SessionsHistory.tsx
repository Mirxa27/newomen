import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Clock, User, Bot } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";

// Corrected types using intersections instead of invalid interface extensions
type SessionWithUser = Tables<'sessions'> & {
  user_profiles: Tables<'user_profiles'> | null;
};
type SessionWithUserAndAgent = SessionWithUser & {
  agents: Tables<'agents'> | null;
};
type NewMeConversationWithUser = Tables<'newme_conversations'> & {
  user_profiles: Tables<'user_profiles'> | null;
};
type NewMeConversationWithUserAndAgent = NewMeConversationWithUser & {
  agents: Tables<'agents'> | null;
};

// Define types for message rows based on schema
type NewMeMessageRow = Tables<'newme_messages'>;
type MessageHistoryRow = Tables<'messages'>;

type CombinedSession = SessionWithUserAndAgent | NewMeConversationWithUserAndAgent;

export default function SessionsHistory() {
  const [sessions, setSessions] = useState<CombinedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<CombinedSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<(NewMeMessageRow | MessageHistoryRow)[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: realtimeSessions, error: realtimeError } = await supabase
        .from("sessions")
        .select("*, user_profiles(*), agents(*)")
        .order("start_ts", { ascending: false });

      if (realtimeError) throw realtimeError;

      const { data: newmeConversations, error: newmeError } = await supabase
        .from("newme_conversations")
        .select("*, user_profiles(*), agents(*)")
        .order("created_at", { ascending: false });

      if (newmeError) throw newmeError;

      const combined = [...(realtimeSessions || []), ...(newmeConversations || [])] as CombinedSession[];
      combined.sort((a, b) => {
        const dateA = new Date('start_ts' in a ? a.start_ts || 0 : a.created_at || 0).getTime();
        const dateB = new Date('start_ts' in b ? b.start_ts || 0 : b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setSessions(combined);
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load session history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const handleSessionSelect = async (session: CombinedSession) => {
    setSelectedSession(session);
    setLoadingMessages(true);
    try {
      if ('start_ts' in session) { // It's a realtime session
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("session_id", session.id)
          .order("ts", { ascending: true });
        if (error) throw error;
        setSessionMessages(data || []);
      } else { // It's a NewMe conversation
        const { data, error } = await supabase
          .from("newme_messages")
          .select("*")
          .eq("conversation_id", session.id)
          .order("ts", { ascending: true });
        if (error) throw error;
        setSessionMessages(data || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages for the selected session.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const renderMessages = () => {
    if (loadingMessages) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    }
    if (sessionMessages.length === 0) {
      return <div className="text-center text-muted-foreground p-4">No messages in this session.</div>;
    }

    if (selectedSession && 'start_ts' in selectedSession) {
      // Realtime session messages
      return (sessionMessages as MessageHistoryRow[]).map((msg) => (
        <div key={msg.id} className="p-3 border-b">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            <span>{msg.sender === 'user' ? selectedSession.user_profiles?.nickname || 'User' : selectedSession.agents?.name || 'Agent'}</span>
            <span className="text-xs text-muted-foreground font-normal">{new Date(msg.ts).toLocaleString()}</span>
          </div>
          <p className="text-sm mt-1 ml-6">{msg.text_content}</p>
        </div>
      ));
    } else {
      // NewMe conversation messages
      return (sessionMessages as NewMeMessageRow[]).map((msg) => (
        <div key={msg.id} className="p-3 border-b">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            <span>{msg.sender === 'user' ? selectedSession?.user_profiles?.nickname || 'User' : selectedSession?.agents?.name || 'Agent'}</span>
            <span className="text-xs text-muted-foreground font-normal">{new Date(msg.ts || 0).toLocaleString()}</span>
          </div>
          <p className="text-sm mt-1 ml-6">{msg.text_content}</p>
        </div>
      ));
    }
  };

  const renderSessionDetails = () => {
    if (!selectedSession) return <div className="text-center text-muted-foreground p-4">Select a session to view details.</div>;

    const isRealtime = 'start_ts' in selectedSession;

    return (
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-semibold">Session Details</h3>
        {isRealtime ? (
          <>
            <p><strong>Type:</strong> Realtime Voice</p>
            <p><strong>Status:</strong> <Badge variant={selectedSession.status === 'completed' ? 'default' : 'secondary'}>{selectedSession.status}</Badge></p>
            <p><strong>Duration:</strong> {selectedSession.duration_seconds ? `${selectedSession.duration_seconds}s` : 'N/A'}</p>
            <p><strong>Cost:</strong> ${selectedSession.cost_usd?.toFixed(4) || '0.00'}</p>
            <p><strong>Tokens Used:</strong> {selectedSession.tokens_used || 0}</p>
            <p><strong>Started:</strong> {new Date(selectedSession.start_ts || 0).toLocaleString()}</p>
            <p><strong>Ended:</strong> {selectedSession.end_ts ? new Date(selectedSession.end_ts).toLocaleString() : 'N/A'}</p>
          </>
        ) : (
          <>
            <p><strong>Type:</strong> NewMe Chat</p>
            <p><strong>Title:</strong> {selectedSession.title}</p>
            <p><strong>Message Count:</strong> {selectedSession.message_count}</p>
            <p><strong>Started:</strong> {new Date(selectedSession.created_at || 0).toLocaleString()}</p>
            <p><strong>Last Message:</strong> {selectedSession.last_message_at ? new Date(selectedSession.last_message_at).toLocaleString() : 'N/A'}</p>
            <p><strong>Emotional Tone:</strong> {selectedSession.emotional_tone || 'N/A'}</p>
            <p><strong>Topics:</strong> {Array.isArray(selectedSession.topics_discussed) ? selectedSession.topics_discussed.join(', ') : 'N/A'}</p>
          </>
        )}
        <h3 className="text-lg font-semibold pt-4">User & Agent</h3>
        <p><strong>User:</strong> {selectedSession.user_profiles?.nickname || selectedSession.user_profiles?.email || 'N/A'}</p>
        <p><strong>Agent:</strong> {selectedSession.agents?.name || 'N/A'}</p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <Card className="lg:col-span-1 glass-card overflow-y-auto">
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>Review past user interactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSessionSelect(item)}
                  className={`p-3 rounded-lg cursor-pointer border ${selectedSession?.id === item.id ? 'bg-accent' : 'hover:bg-accent/50'}`}
                >
                  <div className="font-semibold">{item.user_profiles?.nickname || item.user_profiles?.email}</div>
                  <div className="text-sm text-muted-foreground flex items-center justify-between">
                    <span>{'start_ts' in item ? 'Realtime Voice' : 'NewMe Chat'}</span>
                    <span>{new Date('start_ts' in item ? item.start_ts || 0 : item.created_at || 0).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-2 grid grid-rows-2 gap-6 h-full">
        <Card className="glass-card overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Messages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {renderMessages()}
          </CardContent>
        </Card>
        <Card className="glass-card overflow-y-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Details</CardTitle>
          </CardHeader>
          <CardContent>
            {renderSessionDetails()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}