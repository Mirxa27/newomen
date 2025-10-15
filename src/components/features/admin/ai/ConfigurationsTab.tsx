import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shared/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/shared/ui/dialog';
import { Badge } from '@/components/shared/ui/badge';
import { Textarea } from '@/components/shared/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Switch } from '@/components/shared/ui/switch';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  TestTube,
  Settings,
  Brain,
  Mic,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Target,
  MessageSquare
} from 'lucide-react';

// Import services
import { aiProviderManager } from '@/services/features/ai/AIProviderManager';
import { supabase } from '@/integrations/supabase/client';
import type { AIProvider, AIModel, AIVoice } from '@/services/features/ai/providers/types';

interface AIConfiguration {
  id: string;
  name: string;
  description: string;
  type: 'assessment' | 'feedback' | 'scoring' | 'voice_result';
  modelId: string;
  voiceId?: string;
  promptId?: string;
  isActive: boolean;
  settings: {
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    scoringCriteria?: string;
    feedbackTone?: 'professional' | 'friendly' | 'encouraging';
    voiceSettings?: {
      speed: number;
      pitch: number;
      volume: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface ConfigurationFormData {
  name: string;
  description: string;
  type: 'assessment' | 'feedback' | 'scoring' | 'voice_result';
  modelId: string;
  voiceId: string;
  promptId: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  scoringCriteria: string;
  feedbackTone: 'professional' | 'friendly' | 'encouraging';
  voiceSpeed: number;
  voicePitch: number;
  voiceVolume: number;
}

interface ConfigurationsTabProps {
  onDataChange?: () => void;
}

export function ConfigurationsTab({ onDataChange }: ConfigurationsTabProps) {
  const [configurations, setConfigurations] = useState<AIConfiguration[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [voices, setVoices] = useState<AIVoice[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfiguration | null>(null);
  const [testingConfigs, setTestingConfigs] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<ConfigurationFormData>({
    name: '',
    description: '',
    type: 'assessment',
    modelId: '',
    voiceId: '',
    promptId: '',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 1000,
    scoringCriteria: '',
    feedbackTone: 'professional',
    voiceSpeed: 1.0,
    voicePitch: 1.0,
    voiceVolume: 1.0
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('assessment');

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [configsData, modelsData, voicesData, providersData] = await Promise.all([
        loadConfigurations(),
        aiProviderManager.getModels(),
        aiProviderManager.getVoices(),
        aiProviderManager.getProviders()
      ]);

      setConfigurations(configsData);
      setModels(modelsData);
      setVoices(voicesData);
      setProviders(providersData);
    } catch (error) {
      console.error('Failed to load configuration data:', error);
      toast.error('Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load configurations from database
  const loadConfigurations = async (): Promise<AIConfiguration[]> => {
    const { data, error } = await supabase
      .from('ai_configurations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      type: 'assessment',
      modelId: row.id, // placeholder mapping to model via mappings below if needed
      isActive: row.is_active,
      settings: {
        temperature: Number(row.temperature) ?? 0.7,
        maxTokens: row.max_tokens ?? 1000,
        systemPrompt: row.system_prompt || ''
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle form changes
  const handleFormChange = (field: keyof ConfigurationFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Open create dialog
  const handleCreate = () => {
    setEditingConfig(null);
    setFormData({
      name: '',
      description: '',
      type: 'assessment',
      modelId: '',
      voiceId: '',
      promptId: '',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 1000,
      scoringCriteria: '',
      feedbackTone: 'professional',
      voiceSpeed: 1.0,
      voicePitch: 1.0,
      voiceVolume: 1.0
    });
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (config: AIConfiguration) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      description: config.description,
      type: config.type,
      modelId: config.modelId,
      voiceId: config.voiceId || '',
      promptId: config.promptId || '',
      systemPrompt: config.settings.systemPrompt,
      temperature: config.settings.temperature,
      maxTokens: config.settings.maxTokens,
      scoringCriteria: config.settings.scoringCriteria || '',
      feedbackTone: config.settings.feedbackTone || 'professional',
      voiceSpeed: config.settings.voiceSettings?.speed || 1.0,
      voicePitch: config.settings.voiceSettings?.pitch || 1.0,
      voiceVolume: config.settings.voiceSettings?.volume || 1.0
    });
    setDialogOpen(true);
  };

  // Save configuration
  const handleSave = async () => {
    if (!formData.name || !formData.modelId) {
      toast.error('Name and model are required');
      return;
    }

    setSaving(true);
    try {
      if (editingConfig) {
        const { error } = await supabase.from('ai_configurations').update({
          name: formData.name,
          description: formData.description,
          temperature: formData.temperature,
          max_tokens: formData.maxTokens,
          system_prompt: formData.systemPrompt
        }).eq('id', editingConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ai_configurations').insert({
          name: formData.name,
          description: formData.description,
          temperature: formData.temperature,
          max_tokens: formData.maxTokens,
          system_prompt: formData.systemPrompt,
          is_active: true
        });
        if (error) throw error;
      }
      toast.success(editingConfig ? 'Configuration updated successfully' : 'Configuration created successfully');
      setDialogOpen(false);
      await loadData();
      onDataChange?.();
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Delete configuration
  const handleDelete = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      const { error } = await supabase.from('ai_configurations').delete().eq('id', configId);
      if (error) throw error;
      toast.success('Configuration deleted successfully');
      await loadData();
      onDataChange?.();
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      toast.error('Failed to delete configuration');
    }
  };

  // Test configuration
  const handleTest = async (config: AIConfiguration) => {
    setTestingConfigs(prev => new Set(prev).add(config.id));
    try {
      const model = models.find(m => m.id === config.modelId) || models[0];
      if (!model) throw new Error('Model not found for configuration');
      const response = await aiProviderManager.testModel(model.id, 'Health check: respond OK.', { maxTokens: 5 });
      if (!response.success) throw new Error(response.error || 'Test failed');
      toast.success('Configuration test completed');
    } catch (error) {
      console.error('Failed to test configuration:', error);
      toast.error('Failed to test configuration');
    } finally {
      setTestingConfigs(prev => {
        const newSet = new Set(prev);
        newSet.delete(config.id);
        return newSet;
      });
    }
  };

  // Toggle configuration status
  const handleToggleStatus = async (config: AIConfiguration) => {
    try {
      const { error } = await supabase
        .from('ai_configurations')
        .update({ is_active: !config.isActive })
        .eq('id', config.id);
      if (error) throw error;
      toast.success(`Configuration ${config.isActive ? 'deactivated' : 'activated'}`);
      await loadData();
      onDataChange?.();
    } catch (error) {
      console.error('Failed to toggle configuration status:', error);
      toast.error('Failed to update configuration status');
    }
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
          <h2 className="text-2xl font-bold">AI Configurations</h2>
          <p className="text-muted-foreground">
            Configure AI for assessments, feedback, scoring, and voice results
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Configuration
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="assessment">Assessment AI</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Generation</TabsTrigger>
          <TabsTrigger value="scoring">Scoring Models</TabsTrigger>
          <TabsTrigger value="voice">Voice Results</TabsTrigger>
        </TabsList>

        <TabsContent value="assessment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Assessment AI Configuration
              </CardTitle>
              <CardDescription>
                Configure AI models for assessment evaluation and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configurations.filter(c => c.type === 'assessment').map((config) => (
                  <Card key={config.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{config.name}</h4>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={config.isActive ? 'default' : 'secondary'}>
                            {config.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {models.find(m => m.id === config.modelId)?.displayName || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTest(config)}
                          disabled={testingConfigs.has(config.id)}
                        >
                          {testingConfigs.has(config.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Feedback Generation
              </CardTitle>
              <CardDescription>
                Configure AI for generating personalized feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configurations.filter(c => c.type === 'feedback').map((config) => (
                  <Card key={config.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{config.name}</h4>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={config.isActive ? 'default' : 'secondary'}>
                            {config.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {config.settings.feedbackTone || 'professional'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTest(config)}
                          disabled={testingConfigs.has(config.id)}
                        >
                          {testingConfigs.has(config.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Scoring Models
              </CardTitle>
              <CardDescription>
                Configure AI models for assessment scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configurations.filter(c => c.type === 'scoring').map((config) => (
                  <Card key={config.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{config.name}</h4>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={config.isActive ? 'default' : 'secondary'}>
                            {config.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {models.find(m => m.id === config.modelId)?.displayName || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTest(config)}
                          disabled={testingConfigs.has(config.id)}
                        >
                          {testingConfigs.has(config.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Results
              </CardTitle>
              <CardDescription>
                Configure AI for generating voice-based assessment results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configurations.filter(c => c.type === 'voice_result').map((config) => (
                  <Card key={config.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{config.name}</h4>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={config.isActive ? 'default' : 'secondary'}>
                            {config.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {voices.find(v => v.id === config.voiceId)?.name || 'No Voice'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTest(config)}
                          disabled={testingConfigs.has(config.id)}
                        >
                          {testingConfigs.has(config.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(config)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Edit Configuration' : 'Create New Configuration'}
            </DialogTitle>
            <DialogDescription>
              Configure AI for assessments, feedback, scoring, or voice results
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Configuration Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="e.g. Assessment Scoring AI"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleFormChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assessment">Assessment AI</SelectItem>
                    <SelectItem value="feedback">Feedback Generation</SelectItem>
                    <SelectItem value="scoring">Scoring Models</SelectItem>
                    <SelectItem value="voice_result">Voice Results</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Describe what this configuration does..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelId">AI Model</Label>
                <Select value={formData.modelId} onValueChange={(value) => handleFormChange('modelId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.type === 'voice_result' && (
                <div className="space-y-2">
                  <Label htmlFor="voiceId">Voice</Label>
                  <Select value={formData.voiceId} onValueChange={(value) => handleFormChange('voiceId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Voice</SelectItem>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) => handleFormChange('systemPrompt', e.target.value)}
                placeholder="You are an AI assistant that..."
                rows={4}
              />
            </div>

            {formData.type === 'scoring' && (
              <div className="space-y-2">
                <Label htmlFor="scoringCriteria">Scoring Criteria</Label>
                <Textarea
                  id="scoringCriteria"
                  value={formData.scoringCriteria}
                  onChange={(e) => handleFormChange('scoringCriteria', e.target.value)}
                  placeholder="Define how to score assessments..."
                  rows={3}
                />
              </div>
            )}

            {formData.type === 'feedback' && (
              <div className="space-y-2">
                <Label htmlFor="feedbackTone">Feedback Tone</Label>
                <Select value={formData.feedbackTone} onValueChange={(value) => handleFormChange('feedbackTone', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="encouraging">Encouraging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.type === 'voice_result' && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voiceSpeed">Voice Speed</Label>
                  <Input
                    id="voiceSpeed"
                    type="number"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={formData.voiceSpeed}
                    onChange={(e) => handleFormChange('voiceSpeed', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voicePitch">Voice Pitch</Label>
                  <Input
                    id="voicePitch"
                    type="number"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={formData.voicePitch}
                    onChange={(e) => handleFormChange('voicePitch', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voiceVolume">Voice Volume</Label>
                  <Input
                    id="voiceVolume"
                    type="number"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={formData.voiceVolume}
                    onChange={(e) => handleFormChange('voiceVolume', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleFormChange('temperature', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="100"
                  max="4000"
                  value={formData.maxTokens}
                  onChange={(e) => handleFormChange('maxTokens', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  editingConfig ? 'Update Configuration' : 'Create Configuration'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}