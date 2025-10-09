import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Clock, MessageSquare, BarChart, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

type Session = Tables<'sessions'>;
type NewMeConversation = Tables<'newme_conversations'>;
type UserProfile = Tables<'user_profiles'>;

type SessionWithUser = Session & { user_profiles: UserProfile | null };
type NewMeConversationWithUser = NewMeConversation & { user_profiles: UserProfile | null };

export default function Analytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    completedSessions: 0,
    avgDuration: 0,
    uniqueUsersSessions: 0,
    activeNewMe: 0,
    completedNewMe: 0,
    avgMessageCount: 0,
    uniqueUsersNewMe: 0,
  });
  const [recentSessions, setRecentSessions] = useState<SessionWithUser[]>([]);
  const [recentNewMe, setRecentNewMe] = useState<NewMeConversationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        { count: totalUsers, error: usersError },
        { data: sessionsData, error: sessionsError },
        { data: newMeConversationsData, error: newMeError },
      ] = await Promise.all([
        supabase.from("user_profiles").select("*", { count: "exact", head: true }),
        supabase.from("sessions").select("*, user_profiles(*)").gte("start_ts", thirtyDaysAgo.toISOString()),
        supabase.from("newme_conversations").select("*, user_profiles(*)").gte("created_at", thirtyDaysAgo.toISOString()),
      ]);

      if (usersError) throw usersError;
      if (sessionsError) throw sessionsError;
      if (newMeError) throw newMeError;

      // Process sessions data
      const totalSessions = sessionsData?.length || 0;
      const activeSessions = sessionsData?.filter(s => s.status === "active").length || 0;
      const completedSessions = sessionsData?.filter(s => s.status === "completed").length || 0;
      const avgDuration = totalSessions > 0
        ? (sessionsData?.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0) || 0) / totalSessions
        : 0;
      const uniqueUsersSessions = new Set(
        sessionsData
          ?.map((session) => session.user_id)
          .filter((value): value is string => Boolean(value))
      ).size;

      // Process NewMe conversations data
      const totalNewMeConversations = newMeConversationsData?.length || 0;
      const activeNewMe = newMeConversationsData?.filter(c => !c.ended_at).length || 0;
      const completedNewMe = newMeConversationsData?.filter(c => c.ended_at).length || 0;
      const avgMessageCount = totalNewMeConversations > 0
        ? (newMeConversationsData?.reduce((acc, curr) => acc + (curr.message_count || 0), 0) || 0) / totalNewMeConversations
        : 0;
      const uniqueUsersNewMe = new Set(
        newMeConversationsData
          ?.map((conv) => conv.user_id)
          .filter((value): value is string => Boolean(value))
      ).size;

      setStats({
        totalUsers: totalUsers || 0,
        activeSessions,
        completedSessions,
        avgDuration,
        uniqueUsersSessions,
        activeNewMe,
        completedNewMe,
        avgMessageCount,
        uniqueUsersNewMe,
      });

      setRecentSessions((sessionsData as SessionWithUser[]).sort((a, b) => new Date(b.start_ts!).getTime() - new Date(a.start_ts!).getTime()).slice(0, 5));
      setRecentNewMe((newMeConversationsData as NewMeConversationWithUser[]).sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()).slice(0, 5));

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      toast.error("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalyticsData();
  }, [loadAnalyticsData]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-destructive">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h2 className="text-2xl font-bold">Failed to load data</h2>
        <p>{error}</p>
        <Button onClick={loadAnalyticsData} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Users" value={stats.totalUsers} icon={<Users />} />
        <StatCard title="Avg. Session Duration" value={`${stats.avgDuration.toFixed(2)}s`} icon={<Clock />} />
        <StatCard title="Avg. NewMe Messages" value={stats.avgMessageCount.toFixed(2)} icon={<MessageSquare />} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Realtime Sessions</CardTitle>
            <CardDescription>Last 5 sessions initiated.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.user_profiles?.nickname || session.user_profiles?.email || 'N/A'}</TableCell>
                    <TableCell><Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>{session.status}</Badge></TableCell>
                    <TableCell>
                      {new Date(session.start_ts!).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent NewMe Conversations</CardTitle>
            <CardDescription>Last 5 conversations started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentNewMe.map((conv) => (
                  <TableRow key={conv.id}>
                    <TableCell>{conv.user_profiles?.nickname || conv.user_profiles?.email || 'N/A'}</TableCell>
                    <TableCell>{conv.message_count}</TableCell>
                    <TableCell>
                      {new Date(conv.created_at!).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}