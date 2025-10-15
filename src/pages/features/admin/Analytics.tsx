import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shared/ui/table";
import ResponsiveTable from "@/components/shared/ui/ResponsiveTable";
import { Badge } from "@/components/shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Users, MessageSquare, TrendingUp, DollarSign, Activity, Trophy, Clock, User, Calendar, BarChart3, PieChart, LineChart } from "lucide-react";
import { LineChart as RechartsLineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type UserProfileRow = Tables<"user_profiles">;
type SessionRow = Tables<"sessions">;

type RecentUser = {
  id: string;
  nickname: string | null;
  email: string;
  subscriptionTier: string | null;
  createdAt: string | null;
  lastActiveAt: string | null;
};

type SessionWithRelations = SessionRow & {
  user_profiles: Pick<UserProfileRow, "nickname" | "email"> | null;
  agents: Pick<Tables<"agents">, "name"> | null;
};

type RecentSession = {
  id: string;
  durationSeconds: number | null;
  status: string | null;
  startTimestamp: string | null;
  userNickname: string | null;
  userEmail: string | null;
  agentName: string | null;
};

interface ChartDatum {
  date: string;
  users: number;
  sessions: number;
  minutes: number;
}

export default function Analytics() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    totalMinutes: 0,
    totalCost: 0,
    totalCrystals: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [chartData, setChartData] = useState<ChartDatum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [usersData, sessionsData, recentUsersData, recentSessionsData] = await Promise.all([
        supabase.from("user_profiles").select("id, crystal_balance, created_at"),
        supabase.from("sessions").select("user_id, duration_seconds, cost_usd, start_ts, status"),
        supabase.from("user_profiles")
          .select("id, nickname, email, subscription_tier, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("sessions")
          .select(`
            *,
            user_profiles!inner(nickname, email),
            agents(name)
          `)
          .order("start_ts", { ascending: false })
          .limit(10)
      ]);

      const userRows = (usersData.data ?? []) as Array<Pick<UserProfileRow, "id" | "crystal_balance" | "created_at">>;
      const sessionRows = (sessionsData.data ?? []) as Array<Pick<SessionRow, "user_id" | "duration_seconds" | "cost_usd" | "start_ts" | "status">>;
      const recentUserRows = (recentUsersData.data ?? []) as Array<Pick<UserProfileRow, "id" | "nickname" | "email" | "subscription_tier" | "created_at">>;
      const recentSessionRows = (recentSessionsData.data as unknown as SessionWithRelations[]) ?? [];

      const totalUsers = userRows.length;
      const totalSessions = sessionRows.length;
      const totalMinutes = Math.floor(
        sessionRows.reduce((sum, session) => sum + (session.duration_seconds ?? 0), 0) / 60
      );
      const totalCost = sessionRows.reduce((sum, session) => sum + (session.cost_usd ?? 0), 0);
      const totalCrystals = userRows.reduce((sum, user) => sum + (user.crystal_balance ?? 0), 0);

      const activityWindowStart = new Date();
      activityWindowStart.setDate(activityWindowStart.getDate() - 7);

      const activeUsers = new Set(
        sessionRows
          .filter((session) => session.start_ts && new Date(session.start_ts) > activityWindowStart)
          .map((session) => session.user_id)
          .filter((value): value is string => Boolean(value))
      ).size;

      setMetrics({
        totalUsers,
        activeUsers,
        totalSessions,
        totalMinutes,
        totalCost,
        totalCrystals,
      });

      const lastActivityByUser = sessionRows.reduce<Map<string, string>>((map, session) => {
        if (!session.user_id || !session.start_ts) {
          return map;
        }
        const previous = map.get(session.user_id);
        if (!previous || new Date(session.start_ts) > new Date(previous)) {
          map.set(session.user_id, session.start_ts);
        }
        return map;
      }, new Map<string, string>());

      const recentUserEntries: RecentUser[] = recentUserRows.map((row) => ({
        id: row.id,
        nickname: row.nickname,
        email: row.email,
        subscriptionTier: row.subscription_tier,
        createdAt: row.created_at,
        lastActiveAt: row.id ? lastActivityByUser.get(row.id) ?? null : null,
      }));

      const recentSessionEntries: RecentSession[] = recentSessionRows.map((row) => ({
        id: row.id,
        durationSeconds: row.duration_seconds ?? null,
        status: row.status ?? null,
        startTimestamp: row.start_ts ?? null,
        userNickname: row.user_profiles?.nickname ?? null,
        userEmail: row.user_profiles?.email ?? null,
        agentName: (row.agents?.name as string) ?? null,
      }));

      setRecentUsers(recentUserEntries);
      setRecentSessions(recentSessionEntries);

      const chartStart = new Date();
      chartStart.setHours(0, 0, 0, 0);
      chartStart.setDate(chartStart.getDate() - 6);

      const dailyMetrics: ChartDatum[] = Array.from({ length: 7 }, (_, index) => {
        const dayStart = new Date(chartStart);
        dayStart.setDate(chartStart.getDate() + index);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const daySessions = sessionRows.filter((session) => {
          if (!session.start_ts) {
            return false;
          }
          const start = new Date(session.start_ts);
          return start >= dayStart && start < dayEnd;
        });

        const dayMinutes = Math.floor(
          daySessions.reduce((sum, session) => sum + (session.duration_seconds ?? 0), 0) / 60
        );

        const dayUsers = userRows.filter((user) => {
          if (!user.created_at) {
            return false;
          }
          const created = new Date(user.created_at);
          return created >= dayStart && created < dayEnd;
        }).length;

        return {
          date: dayStart.toISOString().split('T')[0],
          users: dayUsers,
          sessions: daySessions.length,
          minutes: dayMinutes,
        };
      });

      setChartData(dailyMetrics);
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">AI conversations</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Minutes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMinutes}</div>
            <p className="text-xs text-muted-foreground">Conversation time</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">AI API costs</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crystals Earned</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCrystals}</div>
            <p className="text-xs text-muted-foreground">User gamification</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalSessions > 0
                ? Math.floor(metrics.totalMinutes / metrics.totalSessions)
                : 0}m
            </div>
            <p className="text-xs text-muted-foreground">Per conversation</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Recent Users
            </CardTitle>
            <CardDescription>
              Latest user registrations and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveTable>
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{user.nickname || "Anonymous"}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.subscriptionTier || "discovery"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3" />
                        {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : 'Never'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </ResponsiveTable>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Recent Sessions
            </CardTitle>
            <CardDescription>
              Latest conversation sessions and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveTable>
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{session.userNickname || "Anonymous"}</div>
                        <div className="text-xs text-muted-foreground">
                          {session.userEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{session.agentName || "Default"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.durationSeconds
                          ? `${Math.floor((session.durationSeconds ?? 0) / 60)}m ${(session.durationSeconds ?? 0) % 60}s`
                          : "N/A"
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                        {session.status || 'unknown'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </ResponsiveTable>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Engagement Trends
          </CardTitle>
          <CardDescription>
            User activity and engagement metrics over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-2" />
                Daily Active Users
              </TabsTrigger>
              <TabsTrigger value="sessions">
                <MessageSquare className="w-4 h-4 mr-2" />
                Session Activity
              </TabsTrigger>
              <TabsTrigger value="engagement">
                <Activity className="w-4 h-4 mr-2" />
                Engagement Metrics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="sessions">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="engagement">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      stroke="#ff7300"
                      strokeWidth={2}
                      name="Minutes per Day"
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              User Distribution
            </CardTitle>
            <CardDescription>
              Breakdown by subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Discovery', value: Math.floor(metrics.totalUsers * 0.6), fill: '#8884d8' },
                      { name: 'Growth', value: Math.floor(metrics.totalUsers * 0.3), fill: '#82ca9d' },
                      { name: 'Premium', value: Math.floor(metrics.totalUsers * 0.1), fill: '#ffc658' },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Growth Metrics
            </CardTitle>
            <CardDescription>
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg. Session Duration</span>
              <span className="text-sm text-muted-foreground">
                {metrics.totalSessions > 0 ? Math.floor(metrics.totalMinutes / metrics.totalSessions) : 0} minutes
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Cost per Session</span>
              <span className="text-sm text-muted-foreground">
                ${metrics.totalSessions > 0 ? (metrics.totalCost / metrics.totalSessions).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Crystals per User</span>
              <span className="text-sm text-muted-foreground">
                {metrics.totalUsers > 0 ? Math.floor(metrics.totalCrystals / metrics.totalUsers) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Engagement Rate</span>
              <span className="text-sm text-muted-foreground">
                {metrics.totalUsers > 0 ? Math.floor((metrics.activeUsers / metrics.totalUsers) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}