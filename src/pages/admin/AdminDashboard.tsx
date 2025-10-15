import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminPanelService } from '@/services/admin/AdminPanelService';
import { analyticsService } from '@/services/analytics/AnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Users, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [dateRange, setDateRange] = useState('7d');

  // Fetch dashboard metrics
  const { data: metrics = [] } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => adminPanelService.getDashboardMetrics(),
  });

  // Fetch moderation queue
  const { data: moderationQueue = [] } = useQuery({
    queryKey: ['moderation-queue', 'pending'],
    queryFn: () => adminPanelService.getModerationQueue('pending'),
  });

  // Fetch revenue data
  const { data: revenueMetrics = [] } = useQuery({
    queryKey: ['revenue-metrics', dateRange],
    queryFn: () => {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (parseInt(dateRange) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      return analyticsService.getRevenueMetrics(startDate, endDate);
    },
  });

  // Calculate key metrics
  const totalUsers = metrics.find(m => m.metric_type === 'users')?.metric_value || 0;
  const totalRevenue = revenueMetrics.reduce((sum, m) => sum + (m.total_revenue || 0), 0);
  const pendingReports = moderationQueue.length;
  const avgEngagement = metrics.find(m => m.metric_type === 'engagement')?.metric_value || 0;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 mt-2">Platform overview and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDateRange('7d')} className={dateRange === '7d' ? 'bg-primary text-white' : ''}>7d</Button>
          <Button variant="outline" onClick={() => setDateRange('30d')} className={dateRange === '30d' ? 'bg-primary text-white' : ''}>30d</Button>
          <Button variant="outline" onClick={() => setDateRange('90d')} className={dateRange === '90d' ? 'bg-primary text-white' : ''}>90d</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active platform users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All-time revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Moderation</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReports}</div>
            <p className="text-xs text-muted-foreground">Items awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagement.toFixed(1)}/100</div>
            <p className="text-xs text-muted-foreground">User engagement score</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Activity Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.slice(0, 7)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="metric_value" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">New Users Today</span>
                  <span className="font-semibold">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Sessions</span>
                  <span className="font-semibold">156</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Content Moderated</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Payment Success Rate</span>
                  <span className="font-semibold text-green-600">99.2%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_revenue" fill="#10b981" name="Total Revenue" />
                  <Bar dataKey="subscription_revenue" fill="#3b82f6" name="Subscription Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation">
          <Card>
            <CardHeader>
              <CardTitle>Pending Moderation Items</CardTitle>
              <p className="text-sm text-gray-500">{moderationQueue.length} items awaiting review</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {moderationQueue.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.content_type}</h4>
                      <p className="text-sm text-gray-600">{item.reason}</p>
                    </div>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500">User management interface</p>
                <Button className="mt-4">View All Users</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
