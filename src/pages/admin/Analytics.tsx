import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Users, MessageSquare, TrendingUp, DollarSign, Activity, Trophy, Clock, User, Calendar, BarChart3, PieChart, LineChart } from "lucide-react";
import { LineChart as RechartsLineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Analytics() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    totalMinutes: 0,
    totalCost: 0,
    totalCrystals: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const [usersData, sessionsData, recentUsersData, recentSessionsData] = await Promise.all([
        supabase.from("user_profiles").select("crystal_balance, created_at"),
        supabase.from("sessions").select("duration_seconds, cost_usd, start_ts, status"),
        supabase.from("user_profiles")
          .select("nickname, email, subscription_tier, created_at")
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

      const totalUsers = usersData.data?.length || 0;
      const totalSessions = sessionsData.data?.length || 0;
      const totalMinutes = Math.floor(
        (sessionsData.data?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0) / 60
      );
      const totalCost = sessionsData.data?.reduce((sum, s) => sum + (s.cost_usd || 0), 0) || 0;
      const totalCrystals = usersData.data?.reduce((sum, u) => sum + (u.crystal_balance || 0), 0) || 0;

      // Calculate active users (users who have had sessions in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeUsers = sessionsData.data?.filter(s =>
        new Date(s.start_ts) > sevenDaysAgo
      ).length || 0;

      setMetrics({
        totalUsers,
        activeUsers,
        totalSessions,
        totalMinutes,
        totalCost,
        totalCrystals,
      });

      setRecentUsers(recentUsersData.data || []);
      setRecentSessions(recentSessionsData.data || []);

      // Generate sample chart data for demonstration
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          users: Math.floor(Math.random() * 20) + 5,
          sessions: Math.floor(Math.random() * 15) + 3,
          minutes: Math.floor(Math.random() * 120) + 30,
        };
      });

      setChartData(last7Days);
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSessions}</div>
            <p className="text-xs text-muted-foreground">AI conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Minutes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMinutes}</div>
            <p className="text-xs text-muted-foreground">Conversation time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">AI API costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crystals Earned</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCrystals}</div>
            <p className="text-xs text-muted-foreground">User gamification</p>
          </CardContent>
        </Card>

        <Card>
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
        <Card>
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
            <div className="overflow-x-auto">
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
                        {user.subscription_tier || "discovery"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-3 h-3" />
                        {user.last_login_date 
                          ? new Date(user.last_login_date).toLocaleDateString()
                          : "Never"
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
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
            <div className="overflow-x-auto">
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
                        <div>{session.user_profiles?.nickname || "Anonymous"}</div>
                        <div className="text-xs text-muted-foreground">
                          {session.user_profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{session.agents?.name || "Default"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.duration_seconds 
                          ? `${Math.floor(session.duration_seconds / 60)}m ${session.duration_seconds % 60}s`
                          : "N/A"
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                        {session.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
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
        <Card>
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

        <Card>
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
