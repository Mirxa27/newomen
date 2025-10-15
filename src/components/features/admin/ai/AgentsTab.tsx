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
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  TestTube,
  Bot,
  Mic,
  MessageSquare,
  Settings,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';

// Import services
import { aiProviderManager } from '@/services/features/ai/AIProviderManager';
import { supabase } from '@/integrations/supabase/client';
import type { AIProvider, AIModel, AIVoice } from '@/services/features/ai/providers/types';

interface Agent {
  id: string;
  name: string;
  description: string;
  modelId: string;
  voiceId?: string;
  promptId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AgentFormData {
  name: string;
  description: string;
  modelId: string;
  voiceId: string;
  promptId: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

interface AgentsTabProps {
  onDataChange?: () => void;
}

export function AgentsTab({ onDataChange }: AgentsTabProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [voices, setVoices] = useState<AIVoice[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [testingAgents, setTestingAgents] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    description: '',
    modelId: '',
    voiceId: '',
    promptId: '',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 1000
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [agentsData, modelsData, voicesData, providersData] = await Promise.all([
        loadAgents(),
        aiProviderManager.getModels(),
        aiProviderManager.getVoices(),
        aiProviderManager.getProviders()
      ]);

      setAgents(agentsData);
      setModels(modelsData);
      setVoices(voicesData);
      setProviders(providersData);
    } catch (error) {
      console.error('Failed to load agent data:', error);
      toast.error('Failed to load agent data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load agents from database
  const loadAgents = async (): Promise<Agent[]> => {
    const { data, error } = await supabase
      .from('agents')
      .select('id, name, description, model_id, voice_id, prompt_id, status, created_at, last_tested_at');
    if (error) throw error;
    return (data || []).map((row: {
      id: string;
      name: string;
      description: string | null;
      model_id: string;
      voice_id: string | null;
      prompt_id: string | null;
      status: string;
      created_at: string;
      last_tested_at: string | null;
    }) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      modelId: row.model_id,
      voiceId: row.voice_id || undefined,
      promptId: row.prompt_id || undefined,
      isActive: row.status === 'active',
      createdAt: row.created_at,
      updatedAt: row.last_tested_at || row.created_at
    }));
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle form changes
  const handleFormChange = (field: keyof AgentFormData, value: string | number) => {
    // Handle special case for voiceId - convert "none" to empty string
    if (field === 'voiceId' && value === 'none') {
      value = '';
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Open create dialog
  const handleCreate = () => {
    setEditingAgent(null);
    setFormData({
      name: '',
      description: '',
      modelId: '',
      voiceId: '',
      promptId: '',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 1000
    });
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description,
      modelId: agent.modelId,
      voiceId: agent.voiceId || '',
      promptId: agent.promptId || '',
      systemPrompt: agent.systemPrompt || 'You are a helpful AI assistant.',
      temperature: 0.7,
      maxTokens: 1000
    });
    setDialogOpen(true);
  };

  // Save agent
  const handleSave = async () => {
    if (!formData.name || !formData.modelId) {
      toast.error('Name and model are required');
      return;
    }

    setSaving(true);
    try {
      if (editingAgent) {
        const { error } = await supabase.from('agents').update({
          name: formData.name,
          description: formData.description,
          model_id: formData.modelId,
          voice_id: formData.voiceId || null,
          prompt_id: formData.promptId || null,
          status: 'active'
        }).eq('id', editingAgent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('agents').insert({
          name: formData.name,
          description: formData.description,
          model_id: formData.modelId,
          voice_id: formData.voiceId || null,
          prompt_id: formData.promptId || null,
          status: 'active'
        });
        if (error) throw error;
      }
      toast.success(editingAgent ? 'Agent updated successfully' : 'Agent created successfully');
      setDialogOpen(false);
      await loadData();
      onDataChange?.();
    } catch (error) {
      console.error('Failed to save agent:', error);
      toast.error('Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  // Delete agent
  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      const { error } = await supabase.from('agents').delete().eq('id', agentId);
      if (error) throw error;
      toast.success('Agent deleted successfully');
      await loadData();
      onDataChange?.();
    } catch (error) {
      console.error('Failed to delete agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  // Test agent
  const handleTest = async (agent: Agent) => {
    setTestingAgents(prev => new Set(prev).add(agent.id));
    try {
      // Fetch prompt
      const { data: agentRow, error } = await supabase
        .from('agents')
        .select('id, model_id, voice_id, prompt_id')
        .eq('id', agent.id)
        .single();
      if (error) throw error;
      let systemPrompt = '';
      if (agentRow.prompt_id) {
        const { data: prompt, error: pErr } = await supabase
          .from('prompts')
          .select('system_prompt')
          .eq('id', agentRow.prompt_id)
          .single();
        if (pErr) throw pErr;
        systemPrompt = prompt?.system_prompt || '';
      }
      const response = await aiProviderManager.testModel(agent.modelId, 'Say hello in one sentence.', { temperature: 0.7, maxTokens: 60 });
      if (!response.success) throw new Error(response.error || 'Agent test failed');
      toast.success('Agent test completed');
    } catch (error) {
      console.error('Failed to test agent:', error);
      toast.error('Failed to test agent');
    } finally {
      setTestingAgents(prev => {
        const newSet = new Set(prev);
        newSet.delete(agent.id);
        return newSet;
      });
    }
  };

  // Toggle agent status
  const handleToggleStatus = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ status: agent.isActive ? 'inactive' : 'active' })
        .eq('id', agent.id);
      if (error) throw error;
      toast.success(`Agent ${agent.isActive ? 'deactivated' : 'activated'}`);
      await loadData();
      onDataChange?.();
    } catch (error) {
      console.error('Failed to toggle agent status:', error);
      toast.error('Failed to update agent status');
    }
  };

  // Create agent from form
  const handleCreateAgent = async () => {
    try {
      if (!formData.name || !formData.modelId) {
        toast.error('Please fill in required fields');
        return;
      }

      const { error } = await supabase.from('agents').insert({
        name: formData.name,
        description: formData.description,
        model_id: formData.modelId,
        voice_id: formData.voiceId || null,
        prompt_id: formData.promptId || null,
        status: 'active'
      });
      if (error) throw error;
      toast.success('Agent created successfully');
      resetForm();
      await loadData();
      onDataChange?.();
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast.error('Failed to create agent');
    }
  };

  // Test agent
  const handleTestAgent = async () => {
    try {
      if (!formData.modelId) {
        toast.error('Please select a model first');
        return;
      }

      const response = await aiProviderManager.testModel(formData.modelId, 'Quick test: respond with OK.', { maxTokens: 10 });
      if (!response.success) throw new Error(response.error || 'Test failed');
      toast.success('Agent test succeeded');
    } catch (error) {
      console.error('Failed to test agent:', error);
      toast.error('Failed to test agent');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      modelId: '',
      voiceId: '',
      promptId: '',
      systemPrompt: '',
      temperature: 0.7
    });
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
          <h2 className="text-2xl font-bold">AI Agents</h2>
          <p className="text-muted-foreground">
            Create and manage AI agents by combining models, voices, and prompts
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="builder">Agent Builder</TabsTrigger>
          <TabsTrigger value="list">All Agents</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Visual Agent Builder
              </CardTitle>
              <CardDescription>
                Create AI agents by combining models, voices, and prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Agent Configuration Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input
                      id="agent-name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Enter agent name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="agent-description">Description</Label>
                    <Textarea
                      id="agent-description"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      placeholder="Describe what this agent does"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="model-select">AI Model</Label>
                    <Select value={formData.modelId} onValueChange={(value) => handleFormChange('modelId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4" />
                              <span>{model.displayName}</span>
                              <Badge variant="outline" className="text-xs">
                                {model.providerId}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="voice-select">Voice (Optional)</Label>
                    <Select value={formData.voiceId || 'none'} onValueChange={(value) => handleFormChange('voiceId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Voice</SelectItem>
                        {voices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            <div className="flex items-center gap-2">
                              <Mic className="h-4 w-4" />
                              <span>{voice.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {voice.providerId}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* System Prompt */}
              <div>
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={formData.systemPrompt}
                  onChange={(e) => handleFormChange('systemPrompt', e.target.value)}
                  placeholder="Enter the system prompt that defines the agent's behavior..."
                  rows={4}
                />
              </div>

              {/* Agent Preview */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-semibold mb-2">Agent Preview</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {formData.name || 'Untitled Agent'}</div>
                  <div><strong>Model:</strong> {models.find(m => m.id === formData.modelId)?.displayName || 'Not selected'}</div>
                  <div><strong>Voice:</strong> {voices.find(v => v.id === formData.voiceId)?.name || 'No voice'}</div>
                  <div><strong>System Prompt:</strong> {formData.systemPrompt ? 'Configured' : 'Not set'}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={handleCreateAgent} disabled={!formData.name || !formData.modelId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
                <Button variant="outline" onClick={handleTestAgent} disabled={!formData.modelId}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Agent
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Agents</CardTitle>
              <CardDescription>
                Manage your AI agents and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    No agents created yet
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create your first AI agent to get started
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Voice</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {agent.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {models.find(m => m.id === agent.modelId)?.displayName || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {agent.voiceId ? (
                            <Badge variant="outline">
                              {voices.find(v => v.id === agent.voiceId)?.name || 'Unknown'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(agent.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTest(agent)}
                              disabled={testingAgents.has(agent.id)}
                            >
                              {testingAgents.has(agent.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(agent)}
                            >
                              {agent.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(agent)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(agent.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Agent Testing
              </CardTitle>
              <CardDescription>
                Test your agents with live conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">
                  Live Agent Testing
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Interactive testing interface coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Agent Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAgent ? 'Edit Agent' : 'Create New Agent'}
            </DialogTitle>
            <DialogDescription>
              Configure your AI agent with models, voices, and prompts
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="e.g. Customer Support Bot"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelId">Model</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Describe what this agent does..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voiceId">Voice (Optional)</Label>
                <Select value={formData.voiceId || 'none'} onValueChange={(value) => handleFormChange('voiceId', value)}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) => handleFormChange('systemPrompt', e.target.value)}
                placeholder="You are a helpful AI assistant..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  editingAgent ? 'Update Agent' : 'Create Agent'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}