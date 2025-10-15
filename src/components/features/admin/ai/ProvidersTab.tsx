// Providers Tab Component
// Manages AI providers with API key integration and auto-discovery

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { Badge } from '@/components/shared/ui/badge';
import { Textarea } from '@/components/shared/ui/textarea';
import { Alert, AlertDescription } from '@/components/shared/ui/alert';
import { Separator } from '@/components/shared/ui/separator';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  TestTube,
  Key,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Server,
  Zap,
  Clock,
  Shield,
  Info,
  ExternalLink
} from 'lucide-react';

// Import services and types
import { aiProviderManager } from '@/services/features/ai/AIProviderManager';
import type { AIProvider } from '@/services/features/ai/providers/types';

// Enhanced type definitions
interface HealthStatus {
  providerId: string;
  isHealthy: boolean;
  responseTime?: number;
  error?: string;
  lastChecked?: Date;
  modelsCount?: number;
  voicesCount?: number;
}

interface EnhancedAIProvider extends AIProvider {
  healthStatus?: HealthStatus;
  isAvailable?: boolean;
  lastSynced?: string;
}

interface ProvidersTabProps {
  onDataChange?: () => void;
}

interface ProviderFormData {
  name: string;
  type: string;
  baseUrl: string;
  description: string;
  apiKey: string;
}

interface ProviderTypeConfig {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultUrl: string;
  requiresApiKey: boolean;
  documentation?: string;
}

const PROVIDER_TYPES: ProviderTypeConfig[] = [
  { 
    value: 'openai', 
    label: 'OpenAI', 
    description: 'GPT models and TTS',
    icon: <Zap className="h-4 w-4" />,
    defaultUrl: 'https://api.openai.com',
    requiresApiKey: true,
    documentation: 'https://platform.openai.com/docs'
  },
  { 
    value: 'anthropic', 
    label: 'Anthropic', 
    description: 'Claude models',
    icon: <Shield className="h-4 w-4" />,
    defaultUrl: 'https://api.anthropic.com',
    requiresApiKey: true,
    documentation: 'https://docs.anthropic.com'
  },
  { 
    value: 'elevenlabs', 
    label: 'ElevenLabs', 
    description: 'Voice synthesis',
    icon: <Server className="h-4 w-4" />,
    defaultUrl: 'https://api.elevenlabs.io',
    requiresApiKey: true,
    documentation: 'https://docs.elevenlabs.io'
  },
  { 
    value: 'google', 
    label: 'Google', 
    description: 'Gemini models',
    icon: <Server className="h-4 w-4" />,
    defaultUrl: 'https://generativelanguage.googleapis.com',
    requiresApiKey: true,
    documentation: 'https://ai.google.dev/docs'
  },
  { 
    value: 'azure', 
    label: 'Azure OpenAI', 
    description: 'Azure-hosted OpenAI',
    icon: <Server className="h-4 w-4" />,
    defaultUrl: '',
    requiresApiKey: true,
    documentation: 'https://docs.microsoft.com/azure/cognitive-services/openai'
  },
  { 
    value: 'custom', 
    label: 'Custom', 
    description: 'OpenAI-compatible API',
    icon: <Server className="h-4 w-4" />,
    defaultUrl: '',
    requiresApiKey: true
  },
];

const DEFAULT_BASE_URLS: Record<string, string> = PROVIDER_TYPES.reduce((acc, type) => {
  acc[type.value] = type.defaultUrl;
  return acc;
}, {} as Record<string, string>);

export function ProvidersTab({ onDataChange }: ProvidersTabProps) {
  const [providers, setProviders] = useState<EnhancedAIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<EnhancedAIProvider | null>(null);
  const [testingProviders, setTestingProviders] = useState<Set<string>>(new Set());
  const [syncingProviders, setSyncingProviders] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<ProviderFormData>({
    name: '',
    type: 'openai',
    baseUrl: DEFAULT_BASE_URLS.openai,
    description: '',
    apiKey: ''
  });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<ProviderFormData>>({});

  // Memoized provider type configuration
  const selectedProviderType = useMemo(() => 
    PROVIDER_TYPES.find(type => type.value === formData.type),
    [formData.type]
  );

  // Enhanced form validation
  const validateForm = useCallback((): boolean => {
    const errors: Partial<ProviderFormData> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Provider name is required';
    }
    
    if (!formData.type) {
      errors.type = 'Provider type is required';
    }
    
    if (!formData.baseUrl.trim() && formData.type !== 'custom') {
      errors.baseUrl = 'Base URL is required';
    }
    
    if (formData.baseUrl && !formData.baseUrl.match(/^https?:\/\/.+/)) {
      errors.baseUrl = 'Base URL must be a valid HTTP/HTTPS URL';
    }
    
    if (!formData.apiKey.trim() && selectedProviderType?.requiresApiKey) {
      errors.apiKey = 'API key is required for this provider type';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, selectedProviderType]);

  // Load providers with enhanced error handling
  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      const [providersData, healthStatus] = await Promise.all([
        aiProviderManager.getProviders(),
        aiProviderManager.getHealthStatus().catch(() => []) // Graceful fallback
      ]);
      
      const healthMap = new Map(healthStatus.map((h: HealthStatus) => [h.providerId, h] as [string, HealthStatus]));
      
      // Enhanced providers with availability and health info
      const enhancedProviders: EnhancedAIProvider[] = providersData.map(provider => ({
        ...provider,
        healthStatus: healthMap.get(provider.id),
        isAvailable: aiProviderManager.isProviderAvailable(provider.id)
      } as EnhancedAIProvider));
      
      setProviders(enhancedProviders);
    } catch (error) {
      console.error('Failed to load providers:', error);
      toast.error('Failed to load providers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  // Enhanced form change handler with validation
  const handleFormChange = useCallback((field: keyof ProviderFormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-update base URL when type changes
      if (field === 'type') {
        const providerType = PROVIDER_TYPES.find(t => t.value === value);
        if (providerType?.defaultUrl) {
          updated.baseUrl = providerType.defaultUrl;
        }
      }
      
      return updated;
    });
    
    // Clear specific field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  // Enhanced create handler
  const handleCreate = useCallback(() => {
    setEditingProvider(null);
    setFormData({
      name: '',
      type: 'openai',
      baseUrl: DEFAULT_BASE_URLS.openai,
      description: '',
      apiKey: ''
    });
    setFormErrors({});
    setDialogOpen(true);
  }, []);

  // Enhanced edit handler
  const handleEdit = useCallback((provider: EnhancedAIProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      type: provider.type,
      baseUrl: provider.baseUrl,
      description: '', // We don't have description in the current schema
      apiKey: '' // Never pre-fill API keys for security
    });
    setFormErrors({});
    setDialogOpen(true);
  }, []);

  // Enhanced save handler with better error handling
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors before saving');
      return;
    }

    setSaving(true);
    try {
      if (editingProvider) {
        // Update existing provider
        await aiProviderManager.updateProviderApiKey(editingProvider.id, formData.apiKey);
        toast.success(`${formData.name} updated successfully`);
      } else {
        // Create new provider
        await aiProviderManager.addProvider({
          name: formData.name,
          type: formData.type,
          apiBase: formData.baseUrl
        }, formData.apiKey);
        
        toast.success(`${formData.name} created successfully`);
      }

      setDialogOpen(false);
      await loadProviders();
      onDataChange?.();
    } catch (error) {
      console.error('Failed to save provider:', error);
      const action = editingProvider ? 'update' : 'create';
      toast.error(`Failed to ${action} provider. Please check your configuration and try again.`);
    } finally {
      setSaving(false);
    }
  }, [formData, editingProvider, validateForm, loadProviders, onDataChange]);

  // Enhanced delete handler
  const handleDelete = useCallback(async (provider: EnhancedAIProvider) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${provider.name}"?\n\nThis action cannot be undone and will remove all associated models and configurations.`
    );
    
    if (!confirmed) return;

    try {
      await aiProviderManager.removeProvider(provider.id);
      toast.success(`${provider.name} deleted successfully`);
      await loadProviders();
      onDataChange?.();
    } catch (error) {
      console.error('Failed to delete provider:', error);
      toast.error(`Failed to delete ${provider.name}. Please try again.`);
    }
  }, [loadProviders, onDataChange]);

  // Enhanced test handler with better feedback
  const handleTest = useCallback(async (provider: EnhancedAIProvider) => {
    if (!provider.isAvailable) {
      toast.error(`${provider.name} is not available for testing (no API key configured)`);
      return;
    }

    setTestingProviders(prev => new Set(prev).add(provider.id));
    
    try {
      const result = await aiProviderManager.testProvider(provider.id);
      
      if (result.isHealthy) {
        toast.success(
          `✅ ${provider.name} connection successful`,
          { description: `Response time: ${result.responseTime}ms` }
        );
      } else {
        toast.error(
          `❌ ${provider.name} connection failed`,
          { description: result.error || 'Unknown error occurred' }
        );
      }
      
      await loadProviders();
    } catch (error) {
      console.error('Provider test failed:', error);
      toast.error(`Failed to test ${provider.name}`, {
        description: 'Please check your network connection and try again'
      });
    } finally {
      setTestingProviders(prev => {
        const updated = new Set(prev);
        updated.delete(provider.id);
        return updated;
      });
    }
  }, [loadProviders]);

  // Enhanced sync handler with detailed feedback
  const handleSync = useCallback(async (provider: EnhancedAIProvider) => {
    if (!provider.isAvailable) {
      toast.error(`${provider.name} is not available for sync (no API key configured)`);
      return;
    }

    setSyncingProviders(prev => new Set(prev).add(provider.id));
    
    try {
      const result = await aiProviderManager.syncProvider(provider.id);
      
      if (result.status === 'success') {
        toast.success(
          `🔄 ${provider.name} synced successfully`,
          { 
            description: `Discovered: ${result.modelsDiscovered} models, ${result.voicesDiscovered} voices` 
          }
        );
      } else {
        toast.warning(
          `⚠️ ${provider.name} sync partially failed`,
          { description: result.errors.join(', ') }
        );
      }
      
      await loadProviders();
      onDataChange?.();
    } catch (error) {
      console.error('Provider sync failed:', error);
      toast.error(`Failed to sync ${provider.name}`, {
        description: 'Please check your API key and try again'
      });
    } finally {
      setSyncingProviders(prev => {
        const updated = new Set(prev);
        updated.delete(provider.id);
        return updated;
      });
    }
  }, [loadProviders, onDataChange]);

  // Enhanced status badge with more information
  const getStatusBadge = useCallback((provider: EnhancedAIProvider) => {
    const health = provider.healthStatus;
    
    if (!provider.isAvailable) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Key className="h-3 w-3" />
          No API Key
        </Badge>
      );
    }
    
    if (!health) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Unknown
        </Badge>
      );
    }
    
    if (health.isHealthy) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3" />
          Healthy
          {health.responseTime && (
            <span className="text-xs">({health.responseTime}ms)</span>
          )}
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Error
        </Badge>
      );
    }
  }, []);

  // Enhanced provider stats
  const providerStats = useMemo(() => {
    const total = providers.length;
    const healthy = providers.filter(p => p.healthStatus?.isHealthy).length;
    const available = providers.filter(p => p.isAvailable).length;
    
    return { total, healthy, available };
  }, [providers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading AI providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">AI Providers</h2>
          <p className="text-muted-foreground">
            Manage AI provider connections and API keys
          </p>
          {providers.length > 0 && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Server className="h-4 w-4" />
                {providerStats.total} total
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                {providerStats.healthy} healthy
              </span>
              <span className="flex items-center gap-1">
                <Key className="h-4 w-4" />
                {providerStats.available} configured
              </span>
            </div>
          )}
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </div>

      {/* Enhanced Providers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Base URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="rounded-full bg-muted p-4">
                        <Server className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-medium">No providers configured</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          Add your first AI provider to start using language models, text-to-speech, and other AI services.
                        </p>
                      </div>
                      <Button onClick={handleCreate} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add your first provider
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((provider, index) => (
                  <TableRow key={`${provider.id}-${index}`} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {PROVIDER_TYPES.find(t => t.value === provider.type)?.icon || <Server className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="font-medium">{provider.name}</div>
                          {provider.healthStatus?.modelsCount !== undefined && (
                            <div className="text-xs text-muted-foreground">
                              {provider.healthStatus.modelsCount} models
                              {provider.healthStatus.voicesCount ? `, ${provider.healthStatus.voicesCount} voices` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {PROVIDER_TYPES.find(t => t.value === provider.type)?.label || provider.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {provider.baseUrl || 'Not configured'}
                      </code>
                    </TableCell>
                    <TableCell>{getStatusBadge(provider)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTest(provider)}
                          disabled={testingProviders.has(provider.id) || !provider.isAvailable}
                          title={provider.isAvailable ? "Test Connection" : "No API key configured"}
                        >
                          {testingProviders.has(provider.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSync(provider)}
                          disabled={syncingProviders.has(provider.id) || !provider.isAvailable}
                          title={provider.isAvailable ? "Sync Models/Voices" : "No API key configured"}
                        >
                          {syncingProviders.has(provider.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(provider)}
                          title="Edit Provider"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(provider)}
                          title="Delete Provider"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Enhanced Provider Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProviderType?.icon}
              {editingProvider ? 'Edit Provider' : 'Add New Provider'}
            </DialogTitle>
            <DialogDescription>
              Configure AI provider connection and API credentials.
              {selectedProviderType?.documentation && (
                <a 
                  href={selectedProviderType.documentation} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-2 text-primary hover:underline"
                >
                  View documentation <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            {/* Provider Type Selection */}
            <div className="space-y-3">
              <Label htmlFor="type">Provider Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleFormChange('type', value)}
                disabled={!!editingProvider}
              >
                <SelectTrigger className={formErrors.type ? 'border-destructive' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-3">
                        {type.icon}
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.type && (
                <p className="text-sm text-destructive">{formErrors.type}</p>
              )}
            </div>

            {/* Provider Name and Base URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Provider Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="e.g. My OpenAI Account"
                  className={formErrors.name ? 'border-destructive' : ''}
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={formData.baseUrl}
                  onChange={(e) => handleFormChange('baseUrl', e.target.value)}
                  placeholder={selectedProviderType?.defaultUrl || "https://api.example.com"}
                  className={formErrors.baseUrl ? 'border-destructive' : ''}
                />
                {formErrors.baseUrl && (
                  <p className="text-sm text-destructive">{formErrors.baseUrl}</p>
                )}
              </div>
            </div>

            {/* API Key Section */}
            <div className="space-y-3">
              <Label htmlFor="apiKey" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Key
                {selectedProviderType?.requiresApiKey && (
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                )}
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) => handleFormChange('apiKey', e.target.value)}
                placeholder={editingProvider ? "Enter new API key to update" : "Enter your API key"}
                className={formErrors.apiKey ? 'border-destructive' : ''}
              />
              {formErrors.apiKey && (
                <p className="text-sm text-destructive">{formErrors.apiKey}</p>
              )}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  API keys are encrypted and stored securely. They are never logged or transmitted in plain text.
                </AlertDescription>
              </Alert>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Additional notes about this provider configuration"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Provider Type Info */}
            {selectedProviderType && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedProviderType.label}:</strong> {selectedProviderType.description}
                  {selectedProviderType.documentation && (
                    <>
                      {' '}
                      <a 
                        href={selectedProviderType.documentation} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Learn more <ExternalLink className="h-3 w-3" />
                      </a>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingProvider ? 'Update' : 'Create'} Provider
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
