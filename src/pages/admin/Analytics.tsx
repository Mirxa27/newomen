import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sessions } from "@/integrations/supabase/tables/sessions";
import { NewmeConversations } from "@/integrations/supabase/tables/newme_conversations";
import { UserProfiles } from "@/integrations/supabase/tables/user_profiles";

interface SessionWithUser extends Sessions['Row'] {
  user_profiles: UserProfiles['Row'] | null;
}

interface NewMeConversationWithUser extends NewmeConversations['Row'] {
  user_profiles: UserProfiles['Row'] | null;
}

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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: sessionsData, error: sessionsError },
        { data: newMeConversationsData, error: newMeConversationsError },
      ] = await Promise.all([
        supabase.from("sessions").select(`*, user_profiles(*)`).order("created_at", { ascending: false }),
        supabase.from("newme_conversations").select(`*, user_profiles(*)`).order("created_at", { ascending: false }),
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
              {sessions.slice(0, 10).map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.user_profiles?.nickname || session.user_profiles?.email || "N/A"}</TableCell>
                  <TableCell>{session.agent_id || "N/A"}</TableCell>
                  <TableCell>{session.duration_seconds ? `${session.duration_seconds}s` : "N/A"}</TableCell>
                  <TableCell>{session.status}</TableCell>
                  <TableCell>{new Date(session.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {sessions.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No sessions found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent NewMe Conversations</CardTitle>
          <CardDescription>Latest conversations with the NewMe AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {newMeConversations.slice(0, 10).map((conv) => (
                <TableRow key={conv.id}>
                  <TableCell>{conv.user_profiles?.nickname || conv.user_profiles?.email || "N/A"}</TableCell>
                  <TableCell>{conv.title || "Untitled"}</TableCell>
                  <TableCell>{conv.message_count}</TableCell>
                  <TableCell>{conv.ended_at ? "Completed" : "Active"}</TableCell>
                  <TableCell>{conv.last_message_at ? new Date(conv.last_message_at).toLocaleString() : "N/A"}</TableCell>
                </TableRow>
              ))}
              {newMeConversations.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No NewMe conversations found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}