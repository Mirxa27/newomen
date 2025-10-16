import { useState, useEffect } from 'react';
import { monitoringService, SystemHealth as SystemHealthType, MetricsSummary } from '@/lib/monitoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { AlertTriangle, CheckCircle, AlertCircle, RefreshCw, Activity } from 'lucide-react';

export default function SystemHealth() {
  const [health, setHealth] = useState<SystemHealthType | null>(null);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const systemHealth = await monitoringService.getSystemHealth();
      const summary = monitoringService.getMetricsSummary();
      setHealth(systemHealth);
      setMetrics(summary);
    } catch (error) {
      console.error('Failed to check system health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Track page metrics
    monitoringService.trackPageMetrics();
    // Check health on mount
    checkHealth();
    // Set up interval to check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      default:
        return <Activity className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      healthy: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-gray-500 mt-2">Real-time platform monitoring</p>
        </div>
        <Button onClick={checkHealth} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {health && (
        <>
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle>Overall System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(health.status)}
                  <div>
                    <h3 className="text-lg font-semibold">{health.status === 'healthy' ? 'All Systems Operational' : health.status === 'warning' ? 'Minor Issues Detected' : 'Critical Issues'}</h3>
                    <p className="text-sm text-gray-600">
                      Last checked: {new Date(health.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(health.status)}
              </div>
            </CardContent>
          </Card>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">API Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.metrics.apiLatency?.toFixed(0) || 0}ms</div>
                <p className="text-xs text-gray-600 mt-2">
                  {health.metrics.apiLatency > 2000 ? '⚠️ Elevated' : '✓ Normal'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.metrics.errorRate?.toFixed(2) || 0}%</div>
                <p className="text-xs text-gray-600 mt-2">
                  {health.metrics.errorRate > 5 ? '⚠️ Elevated' : '✓ Normal'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.metrics.activeUsers || 0}</div>
                <p className="text-xs text-gray-600 mt-2">Currently online</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Avg Page Load Time</p>
                    <p className="text-2xl font-bold">{metrics.averagePageLoadTime}ms</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Metrics Collected</p>
                    <p className="text-2xl font-bold">{metrics.totalMetricsCollected}</p>
                  </div>
                </div>
                {metrics.lastMetric && (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p className="font-semibold">Last Metric</p>
                    <p className="text-gray-600">
                      {metrics.lastMetric.name}: {metrics.lastMetric.value} {metrics.lastMetric.unit}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Health Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {health.metrics.apiLatency > 2000 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  ⚠️ API latency is elevated. Consider optimizing database queries or scaling resources.
                </div>
              )}
              {health.metrics.errorRate > 5 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  ⚠️ Error rate is above threshold. Check logs for details.
                </div>
              )}
              {health.status === 'healthy' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                  ✓ All systems operating within normal parameters.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
