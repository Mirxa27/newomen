import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, MessageCircle, Clock, DollarSign, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sessions } from "@/integrations/supabase/tables/sessions";
import { NewmeConversations } from "@/integrations/supabase/tables/newme_conversations";
import { UserProfiles } from "@/integrations/supabase/tables/user_profiles";
import { Agents } from "@/integrations/supabase/tables/agents"; // Import Agents table
import { Badge } from "@/components/ui/badge"; // Import Badge
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SessionWithUser = Sessions['Row'] & {
  user_profiles: UserProfiles['Row'] | null;
  agents: Agents['Row'] | null;
  message_count: number;
};

type NewMeConversationWithUser = NewmeConversations['Row'] & {
  user_profiles: UserProfiles['Row'] | null;
  agents: Agents['Row'] | null;
};

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

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionWithUser[]>([]);
  const [newMeConversations, setNewMeConversations] = useState<NewMeConversationWithUser[]>([]);
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    completedSessions: 0,
    avgDuration: 0,
    totalUsers: 0,
  });
  const [newMeStats, setNewMeStats] = useState({
    totalConversations: 0,
    activeConversations: 0,
    completedConversations: 0,
    avgMessageCount: 0,
    totalUsers: 0,
  });
  const [searchTerm, setSearchTerm] = useState(""); // Added search term state

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

      setSessions(sessionsData as SessionWithUser[] || []);
      setNewMeConversations(newMeConversationsData as NewMeConversationWithUser[] || []);

      // Calculate Session Stats
      const totalSessions = sessionsData?.length || 0;
      const activeSessions = sessionsData?.filter(s => s.status === "active").length || 0;
      const completedSessions = sessionsData?.filter(s => s.status === "completed").length || 0;
      const avgDuration = totalSessions > 0
        ? (sessionsData?.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0) || 0) / totalSessions
        : 0;
      const uniqueSessionUsers = new Set(
        sessionsData
          ?.map((session) => session.user_id)
          .filter((value): value is string => Boolean(value)) // Correctly filter out null/undefined
      ).size;

      setSessionStats({
        totalSessions,
        activeSessions,
        completedSessions,
        avgDuration: parseFloat(avgDuration.toFixed(2)),
        totalUsers: uniqueSessionUsers,
      });

      // Calculate NewMe Conversation Stats
      const totalNewMeConversations = newMeConversationsData?.length || 0;
      const activeNewMeConversations = newMeConversationsData?.filter(c => !c.ended_at).length || 0;
      const completedNewMeConversations = newMeConversationsData?.filter(c => c.ended_at).length || 0;
      const avgMessageCount = totalNewMeConversations > 0
        ? (newMeConversationsData?.reduce((acc, curr) => acc + (curr.message_count || 0), 0) || 0) / totalNewMeConversations
        : 0;
      const uniqueNewMeUsers = new Set(
        newMeConversationsData
          ?.map((conv) => conv.user_id)
          .filter((value): value is string => Boolean(value)) // Correctly filter out null/undefined
      ).size;

      setNewMeStats({
        totalConversations: totalNewMeConversations,
        activeConversations: activeNewMeConversations,
        completedConversations: completedNewMeConversations,
        avgMessageCount: parseFloat(avgMessageCount.toFixed(2)),
        totalUsers: uniqueNewMeUsers,
      });

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

  const filteredSessions = sessions.filter((session) =>
    session.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.user_profiles?.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.agents?.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const filteredNewMeConversations = newMeConversations.filter((conv) =>
    conv.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (conv.user_profiles?.nickname?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

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
          <CardTitle>Overall Analytics</CardTitle>
          <CardDescription>High-level overview of platform activity.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Realtime Sessions</h3>
            <div className="space-y-1">
              <p>Total Sessions: {sessionStats.totalSessions}</p>
              <p>Active Sessions: {sessionStats.activeSessions}</p>
              <p>Completed Sessions: {sessionStats.completedSessions}</p>
              <p>Average Duration: {sessionStats.avgDuration} seconds</p>
              <p>Unique Users: {sessionStats.totalUsers}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">NewMe Conversations</h3>
            <div className="space-y-1">
              <p>Total Conversations: {newMeStats.totalConversations}</p>
              <p>Active Conversations: {newMeStats.activeConversations}</p>
              <p>Completed Conversations: {newMeStats.completedConversations}</p>
              <p>Average Message Count: {newMeStats.avgMessageCount}</p>
              <p>Unique Users: {newMeStats.totalUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Realtime Sessions</CardTitle>
          <CardDescription>Latest interactions with AI agents.</CardDescription>
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
                    {new Date(session.created_at).toLocaleDateString()}
                    <div className="text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleTimeString()}
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
                    <Button variant="ghost" size="sm" onClick={() => alert("View conversation not implemented yet")} disabled={conversation.message_count === 0}>
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
    </div>
  );
}