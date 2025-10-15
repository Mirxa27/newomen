import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics/AnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Button } from '@/components/shared/ui/button';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Target, Clock } from 'lucide-react';

export default function UserAnalytics() {
  const [dateRange, setDateRange] = useState('30d');

  // Fetch engagement metrics
  const { data: engagementData = [] } = useQuery({
    queryKey: ['engagement-analytics'],
    queryFn: async () => {
      // Mock data
      return [
        { day: 'Mon', engagement: 42 },
        { day: 'Tue', engagement: 45 },
        { day: 'Wed', engagement: 51 },
        { day: 'Thu', engagement: 48 },
        { day: 'Fri', engagement: 62 },
        { day: 'Sat', engagement: 55 },
        { day: 'Sun', engagement: 38 },
      ];
    },
  });

  // Fetch retention data
  const { data: retentionData = [] } = useQuery({
    queryKey: ['retention-analytics', dateRange],
    queryFn: async () => {
      const startDate = new Date(Date.now() - (parseInt(dateRange) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      return analyticsService.getRetentionRates(startDate, endDate);
    },
  });

  // Mock cohort data
  const cohortData = [
    { name: 'Week 1', retention: 100, users: 1200 },
    { name: 'Week 2', retention: 85, users: 1020 },
    { name: 'Week 3', retention: 72, users: 864 },
    { name: 'Week 4', retention: 65, users: 780 },
    { name: 'Week 5', retention: 58, users: 696 },
  ];

  // Mock user demographics
  const demographicsData = [
    { name: 'Lite Tier', value: 45, color: '#3b82f6' },
    { name: 'Pro Tier', value: 35, color: '#10b981' },
    { name: 'Free Tier', value: 20, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Analytics</h1>
          <p className="text-gray-500 mt-2">Detailed user behavior and retention analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDateRange('7d')} className={dateRange === '7d' ? 'bg-primary text-white' : ''}>7d</Button>
          <Button variant="outline" onClick={() => setDateRange('30d')} className={dateRange === '30d' ? 'bg-primary text-white' : ''}>30d</Button>
          <Button variant="outline" onClick={() => setDateRange('90d')} className={dateRange === '90d' ? 'bg-primary text-white' : ''}>90d</Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,543</div>
            <p className="text-xs text-green-600">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Active Users (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,234</div>
            <p className="text-xs text-gray-600">65.6% engagement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.2%</div>
            <p className="text-xs text-green-600">+2.3% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5%</div>
            <p className="text-xs text-red-600">-1.2% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        {/* Engagement Tab */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="engagement" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention">
          <Card>
            <CardHeader>
              <CardTitle>User Retention Rates</CardTitle>
            </CardHeader>
            <CardContent>
              {retentionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={retentionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="day_1_retention" fill="#3b82f6" />
                    <Bar dataKey="day_7_retention" fill="#10b981" />
                    <Bar dataKey="day_30_retention" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No retention data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cohorts Tab */}
        <TabsContent value="cohorts">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cohortData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="retention" fill="#3b82f6" name="Retention %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={demographicsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {demographicsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Month-over-Month Growth</p>
                    <p className="text-2xl font-bold text-green-600">+12%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Week-over-Week Growth</p>
                    <p className="text-2xl font-bold text-green-600">+3.2%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Projected Monthly Users (60d)</p>
                    <p className="text-2xl font-bold">15,820</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
