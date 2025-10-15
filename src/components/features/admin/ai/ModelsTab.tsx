// Models Tab Component
// Displays and manages AI models from all providers

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Badge } from '@/components/shared/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Eye,
  EyeOff,
  Cpu,
  Zap,
  DollarSign,
  Clock,
  Image,
  MessageSquare,
  Settings,
  Loader2
} from 'lucide-react';

// Import services and types
import { aiProviderManager } from '@/services/features/ai/AIProviderManager';
import type { AIModel } from '@/services/features/ai/providers/types';

interface ExtendedModel extends AIModel {
  providerName?: string;
  providerType?: string;
}

export function ModelsTab() {
  const [models, setModels] = useState<ExtendedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [providers, setProviders] = useState<Array<{id: string; name: string; type: string}>>([]);

  // Load models and providers
  const loadData = useCallback(async () => {
    try {
      const [modelsData, providersData] = await Promise.all([
        aiProviderManager.getModels(),
        aiProviderManager.getProviders()
      ]);

      // Enhance models with provider info
      const enhancedModels = modelsData.map(model => {
        const modelWithProvider = model as typeof model & {
          providers?: { name: string; type: string };
        };
        return {
          ...model,
          providerName: modelWithProvider.providers?.name || 'Unknown',
          providerType: modelWithProvider.providers?.type || 'unknown'
        };
      });

      setModels(enhancedModels);
      setProviders(providersData);
    } catch (error) {
      console.error('Failed to load models:', error);
      toast.error('Failed to load models');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filter models
  const filteredModels = models.filter(model => {
    const matchesSearch = model.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.modelId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (model.description && model.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesModality = modalityFilter === 'all' || model.modality === modalityFilter;
    
    const matchesProvider = providerFilter === 'all' || model.providerId === providerFilter;

    return matchesSearch && matchesModality && matchesProvider;
  });

  // Toggle model enabled status
  const toggleModelEnabled = async (modelId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('models')
        .update({ enabled })
        .eq('id', modelId);
      if (error) throw error;
      setModels(prev => prev.map(model => model.id === modelId ? { ...model, enabled } : model));
      
      toast.success(`Model ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to toggle model:', error);
      toast.error('Failed to update model status');
    }
  };

  // Get capability badges
  const getCapabilityBadges = (model: AIModel) => {
    const badges = [];
    
    if (model.capabilities.chat) badges.push(
      <Badge key="chat" variant="secondary" className="text-xs">
        <MessageSquare className="h-3 w-3 mr-1" />
        Chat
      </Badge>
    );
    
    if (model.capabilities.vision) badges.push(
      <Badge key="vision" variant="secondary" className="text-xs">
        <Eye className="h-3 w-3 mr-1" />
        Vision
      </Badge>
    );
    
    if (model.capabilities.tools) badges.push(
      <Badge key="tools" variant="secondary" className="text-xs">
        <Settings className="h-3 w-3 mr-1" />
        Tools
      </Badge>
    );
    
    if (model.capabilities.streaming) badges.push(
      <Badge key="streaming" variant="secondary" className="text-xs">
        <Zap className="h-3 w-3 mr-1" />
        Stream
      </Badge>
    );

    return badges;
  };

  // Format pricing
  const formatPricing = (model: AIModel) => {
    if (!model.inputPricing && !model.outputPricing) {
      return <span className="text-muted-foreground">-</span>;
    }

    const input = model.inputPricing?.per1kTokens || 0;
    const output = model.outputPricing?.per1kTokens || 0;

    return (
      <div className="text-xs">
        <div>In: ${input.toFixed(4)}/1k</div>
        <div>Out: ${output.toFixed(4)}/1k</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Models</h2>
          <p className="text-muted-foreground">
            Available models from all configured providers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {filteredModels.length} models
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Modality</label>
              <Select value={modalityFilter} onValueChange={setModalityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modalities</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="multimodal">Multimodal</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="embedding">Embedding</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setModalityFilter('all');
                  setProviderFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Models Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Modality</TableHead>
                <TableHead>Context</TableHead>
                <TableHead>Capabilities</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Cpu className="h-8 w-8 opacity-50" />
                      <p>No models found</p>
                      <p className="text-sm">Try adjusting your filters or sync providers</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredModels.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{model.displayName}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {model.modelId}
                        </div>
                        {model.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {model.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {model.providerName}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {model.modality === 'multimodal' && (
                          <Image className="h-4 w-4 text-purple-500" />
                        )}
                        <Badge 
                          variant="secondary" 
                          className={`capitalize ${
                            model.modality === 'multimodal' ? 'text-purple-700' : ''
                          }`}
                        >
                          {model.modality}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {(model.contextLimit || 0).toLocaleString()}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {getCapabilityBadges(model)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {model.latencyMs ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {model.latencyMs}ms
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {formatPricing(model)}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={model.enabled ? 'default' : 'secondary'}>
                        {model.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      {model.isRealtime && (
                        <Badge variant="outline" className="ml-1 text-xs">
                          Realtime
                        </Badge>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleModelEnabled(model.id, !model.enabled)}
                        title={model.enabled ? 'Disable Model' : 'Enable Model'}
                      >
                        {model.enabled ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Models</p>
                <p className="text-2xl font-bold">{models.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Chat Models</p>
                <p className="text-2xl font-bold">
                  {models.filter(m => m.capabilities.chat).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Vision Models</p>
                <p className="text-2xl font-bold">
                  {models.filter(m => m.capabilities.vision).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Realtime</p>
                <p className="text-2xl font-bold">
                  {models.filter(m => m.isRealtime).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
