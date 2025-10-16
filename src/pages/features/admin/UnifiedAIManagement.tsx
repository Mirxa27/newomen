// Unified AI Management Dashboard
// Single comprehensive interface for all AI management tasks

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { toast } from 'sonner';
import { 
  Settings, 
  Server, 
  Cpu, 
  Mic, 
  Bot, 
  TestTube, 
  Activity, 
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus
} from 'lucide-react';

// Import tab components
import { ProvidersTab } from '@/components/features/admin/ai/ProvidersTab';
import { ModelsTab } from '@/components/features/admin/ai/ModelsTab';
import { VoicesTab } from '@/components/features/admin/ai/VoicesTab';
import { AgentsTab } from '@/components/features/admin/ai/AgentsTab';
import { ConfigurationsTab } from '@/components/features/admin/ai/ConfigurationsTab';
import { TestingTab } from '@/components/features/admin/ai/TestingTab';
import { MonitoringTab } from '@/components/features/admin/ai/MonitoringTab';
import { AgentBuilder } from '@/components/features/admin/ai/AgentBuilder';
import { AssessmentAIConfig } from '@/components/features/admin/ai/AssessmentAIConfig';

// Import services
import { aiProviderManager } from '@/services/features/ai/AIProviderManager';
import type { AIProvider, ProviderTestResult } from '@/services/features/ai/providers/types';

interface DashboardStats {
  totalProviders: number;
  activeProviders: number;
  totalModels: number;
  totalVoices: number;
  totalAgents: number;
  healthyProviders: number;
  lastSync?: string;
}

export default function UnifiedAIManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalProviders: 0,
    activeProviders: 0,
    totalModels: 0,
    totalVoices: 0,
    totalAgents: 0,
    healthyProviders: 0
  });
  const [healthStatus, setHealthStatus] = useState<ProviderTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      const [providers, models, voices, healthChecks] = await Promise.all([
        aiProviderManager.getProviders().catch(() => []),
        aiProviderManager.getModels().catch(() => []),
        aiProviderManager.getVoices().catch(() => []),
        aiProviderManager.getHealthStatus().catch(() => [])
      ]);

      const activeProviders = (providers || []).filter(p => p.status === 'active');
      const healthyProviders = (healthChecks || [])
        .filter(h => h && h.isHealthy)
        .map(h => h.providerId);

      setStats({
        totalProviders: (providers || []).length,
        activeProviders: activeProviders.length,
        totalModels: (models || []).length,
        totalVoices: (voices || []).length,
        totalAgents: 0, // Will be loaded by AgentsTab component
        healthyProviders: new Set(healthyProviders).size,
        lastSync: (healthChecks || [])[0]?.timestamp
      });

      setHealthStatus(healthChecks || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  }, []);

  // Initialize AI Provider Manager
  const initializeAIManager = useCallback(async () => {
    try {
      await aiProviderManager.initialize();
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to initialize AI manager:', error);
      toast.error('Failed to initialize AI management system');
    } finally {
      setLoading(false);
    }
  }, [loadDashboardData]);

  // Handle sync all providers
  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const results = await aiProviderManager.syncAllProviders();
      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'failed').length;
      
      if (failed === 0) {
        toast.success(`Successfully synced ${successful} providers`);
      } else {
        toast.warning(`Synced ${successful} providers, ${failed} failed`);
      }
      
      await loadDashboardData();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync providers');
    } finally {
      setSyncing(false);
    }
  };

  // Handle test all providers
  const handleTestAll = async () => {
    try {
      const results = await aiProviderManager.testAllProviders();
      const healthy = results.filter(r => r.isHealthy).length;
      const unhealthy = results.filter(r => !r.isHealthy).length;
      
      toast.success(`Health check complete: ${healthy} healthy, ${unhealthy} unhealthy`);
      await loadDashboardData();
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Failed to run health checks');
    }
  };

  useEffect(() => {
    void initializeAIManager();
  }, [initializeAIManager]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing AI Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Management System</h1>
          <p className="text-muted-foreground">
            Unified dashboard for managing AI providers, models, voices, and agents
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleTestAll}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Test All
          </Button>
          <Button 
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-2"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync All
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Providers</p>
                <p className="text-2xl font-bold">
                  {stats.activeProviders}/{stats.totalProviders}
                </p>
              </div>
              <Server className="h-8 w-8 text-primary opacity-60" />
            </div>
            <div className="mt-2 flex items-center gap-2">
              {stats.healthyProviders === stats.activeProviders ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {stats.healthyProviders} healthy
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Models</p>
                <p className="text-2xl font-bold">{stats.totalModels}</p>
              </div>
              <Cpu className="h-8 w-8 text-primary opacity-60" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">Available models</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Voices</p>
                <p className="text-2xl font-bold">{stats.totalVoices}</p>
              </div>
              <Mic className="h-8 w-8 text-primary opacity-60" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">Voice options</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agents</p>
                <p className="text-2xl font-bold">{stats.totalAgents}</p>
              </div>
              <Bot className="h-8 w-8 text-primary opacity-60" />
            </div>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">Configured agents</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Health Status */}
      {healthStatus && healthStatus.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Provider Health Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {healthStatus.slice(0, 6).map((health) => {
                if (!health || !health.providerId) return null;
                return (
                  <div 
                    key={health.providerId} 
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {health.isHealthy ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        Provider {health.providerId.slice(0, 8)}
                      </span>
                    </div>
                    <Badge variant={health.isHealthy ? 'default' : 'destructive'}>
                      {health.responseTime || 0}ms
                    </Badge>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Card className="glass-card">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-9 lg:grid-cols-9">
            <TabsTrigger value="providers" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">Providers</span>
            </TabsTrigger>
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span className="hidden sm:inline">Models</span>
            </TabsTrigger>
            <TabsTrigger value="voices" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Voices</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="agent-builder" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Builder</span>
            </TabsTrigger>
            <TabsTrigger value="assessment-ai" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Assessment</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">Testing</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Monitor</span>
            </TabsTrigger>
            <TabsTrigger value="configs" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="providers">
              <ProvidersTab onDataChange={loadDashboardData} />
            </TabsContent>

            <TabsContent value="models">
              <ModelsTab />
            </TabsContent>

            <TabsContent value="voices">
              <VoicesTab />
            </TabsContent>

            <TabsContent value="agents">
              <AgentsTab />
            </TabsContent>

            <TabsContent value="agent-builder">
              <AgentBuilder onAgentCreated={loadDashboardData} />
            </TabsContent>

            <TabsContent value="assessment-ai">
              <AssessmentAIConfig onConfigSaved={loadDashboardData} />
            </TabsContent>

            <TabsContent value="testing">
              <TestingTab onDataChange={loadDashboardData} />
            </TabsContent>

            <TabsContent value="monitoring">
              <MonitoringTab />
            </TabsContent>

            <TabsContent value="configs">
              <ConfigurationsTab />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
