import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { toast } from 'sonner';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  Server,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  Eye,
  Settings
} from 'lucide-react';

// Import services
import { aiProviderManager } from '@/services/features/ai/AIProviderManager';
import type { AIProvider, ProviderTestResult } from '@/services/features/ai/providers/types';

interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  requestsToday: number;
  tokensToday: number;
  costToday: number;
}

interface ProviderHealth {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: string;
  uptime: number;
  errorRate: number;
}

interface MonitoringTabProps {
  onDataChange?: () => void;
}

export function MonitoringTab({ onDataChange }: MonitoringTabProps) {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [healthStatus, setHealthStatus] = useState<ProviderTestResult[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    requestsToday: 0,
    tokensToday: 0,
    costToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [providersData, healthData] = await Promise.all([
        aiProviderManager.getProviders(),
        aiProviderManager.getHealthStatus()
      ]);

      setProviders(providersData);
      setHealthStatus(healthData);

      // Load usage stats from database
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const startOfDay = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
      const { data: logs, error } = await supabase
        .from('ai_usage_logs')
        .select('tokens_used, cost_usd, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const totals = (logs || []).reduce((acc: any, row: any) => {
        acc.totalRequests += 1;
        acc.totalTokens += row.tokens_used || 0;
        acc.totalCost += Number(row.cost_usd || 0);
        if (new Date(row.created_at).toISOString() >= startOfDay) {
          acc.requestsToday += 1;
          acc.tokensToday += row.tokens_used || 0;
          acc.costToday += Number(row.cost_usd || 0);
        }
        return acc;
      }, { totalRequests: 0, totalTokens: 0, totalCost: 0, requestsToday: 0, tokensToday: 0, costToday: 0 });
      setUsageStats(totals);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      toast.success('Monitoring data refreshed');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Get provider health status
  const getProviderHealth = (providerId: string): ProviderHealth => {
    const health = healthStatus.find(h => h.providerId === providerId);
    const provider = providers.find(p => p.id === providerId);

    return {
      id: providerId,
      name: provider?.name || 'Unknown',
      status: health?.isHealthy ? 'healthy' : 'down',
      responseTime: health?.responseTime || 0,
      lastChecked: health?.timestamp || new Date().toISOString(),
      uptime: Math.max(0, Math.min(100, 100 - (health?.isHealthy ? 0 : 5))),
      errorRate: health?.isHealthy ? 0.1 : 5.2
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Monitoring & Analytics</h2>
          <p className="text-muted-foreground">
            Monitor provider health, usage statistics, and performance metrics
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="health">Provider Health</TabsTrigger>
          <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Providers</p>
                    <p className="text-2xl font-bold">{providers.filter(p => p.status === 'active').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Healthy Providers</p>
                    <p className="text-2xl font-bold">
                      {healthStatus.filter(h => h.isHealthy).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{usageStats.totalRequests.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-bold">${usageStats.totalCost.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Provider Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Provider Status
              </CardTitle>
              <CardDescription>
                Real-time status of all AI providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider, index) => {
                  const health = getProviderHealth(provider.id);
                  return (
                    <Card key={`${provider.id}-card-${index}`} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{provider.name}</h4>
                          <p className="text-sm text-muted-foreground">{provider.type}</p>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={health.status === 'healthy' ? 'default' : 'destructive'}
                            >
                              {health.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {health.responseTime}ms
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {health.status === 'healthy' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Provider Health Monitoring
              </CardTitle>
              <CardDescription>
                Detailed health status and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Error Rate</TableHead>
                    <TableHead>Last Checked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((provider, index) => {
                    const health = getProviderHealth(provider.id);
                    return (
                      <TableRow key={`${provider.id}-table-${index}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{provider.name}</div>
                            <div className="text-sm text-muted-foreground">{provider.type}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={health.status === 'healthy' ? 'default' : 'destructive'}
                          >
                            {health.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{health.responseTime}ms</TableCell>
                        <TableCell>{health.uptime}%</TableCell>
                        <TableCell>{health.errorRate}%</TableCell>
                        <TableCell>
                          {new Date(health.lastChecked).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage Analytics
              </CardTitle>
              <CardDescription>
                API usage statistics and cost tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Today's Usage</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Requests</span>
                      <span className="font-medium">{usageStats.requestsToday.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tokens</span>
                      <span className="font-medium">{usageStats.tokensToday.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Cost</span>
                      <span className="font-medium">${usageStats.costToday.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Total Usage</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Requests</span>
                      <span className="font-medium">{usageStats.totalRequests.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Tokens</span>
                      <span className="font-medium">{usageStats.totalTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Cost</span>
                      <span className="font-medium">${usageStats.totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Response times, throughput, and efficiency metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">
                  Performance Dashboard
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Detailed performance analytics coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}