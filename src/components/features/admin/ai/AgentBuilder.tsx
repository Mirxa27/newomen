// Visual Agent Builder Component
// Combines models, voices, and prompts to create AI agents

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Textarea } from '@/components/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Badge } from '@/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Separator } from '@/components/shared/ui/separator';
import { toast } from 'sonner';
import {
  Bot,
  Mic,
  Brain,
  Settings,
  Play,
  Save,
  Trash2,
  Copy,
  Download,
  Upload,
  MessageSquare,
  Volume2,
  Zap,
  Target,
  Wand2,
  TestTube,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Import services
import { aiProviderManager } from '@/services/features/ai/AIProviderManager';
import type { AIProvider, AIModel, AIVoice } from '@/services/features/ai/providers/types';

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'conversational' | 'assessment' | 'wellness' | 'couples' | 'custom';
  modelId: string;
  voiceId?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
  capabilities: string[];
}

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

interface AgentBuilderProps {
  onAgentCreated?: (agent: Agent) => void;
  onAgentUpdated?: (agent: Agent) => void;
}

export function AgentBuilder({ onAgentCreated, onAgentUpdated }: AgentBuilderProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [voices, setVoices] = useState<AIVoice[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('builder');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  // Agent configuration
  const [agentConfig, setAgentConfig] = useState({
    name: '',
    description: '',
    category: 'conversational' as AgentTemplate['category'],
    modelId: '',
    voiceId: '',
    systemPrompt: 'You are a helpful AI assistant.',
    userPrompt: 'Hello! How can I help you today?',
    temperature: 0.7,
    maxTokens: 1000,
    capabilities: [] as string[]
  });

  // Predefined agent templates
  const agentTemplates: AgentTemplate[] = [
    {
      id: 'conversational-assistant',
      name: 'Conversational Assistant',
      description: 'General purpose conversational AI',
      category: 'conversational',
      modelId: '',
      systemPrompt: 'You are a helpful, friendly, and knowledgeable AI assistant. Provide clear, accurate, and helpful responses.',
      userPrompt: 'Hello! How can I help you today?',
      temperature: 0.7,
      maxTokens: 1000,
      capabilities: ['chat', 'completion', 'reasoning']
    },
    {
      id: 'assessment-scorer',
      name: 'Assessment Scorer',
      description: 'AI for scoring and analyzing assessments',
      category: 'assessment',
      modelId: '',
      systemPrompt: 'You are an expert assessment evaluator. Analyze responses objectively and provide detailed scoring with constructive feedback.',
      userPrompt: 'Please score this assessment response and provide feedback.',
      temperature: 0.3,
      maxTokens: 2000,
      capabilities: ['analysis', 'scoring', 'feedback']
    },
    {
      id: 'wellness-coach',
      name: 'Wellness Coach',
      description: 'AI wellness and mental health coach',
      category: 'wellness',
      modelId: '',
      voiceId: '',
      systemPrompt: 'You are a compassionate wellness coach. Provide supportive, evidence-based guidance for mental health and wellness.',
      userPrompt: 'I need some guidance on my wellness journey.',
      temperature: 0.8,
      maxTokens: 1500,
      capabilities: ['coaching', 'empathy', 'wellness']
    },
    {
      id: 'couples-mediator',
      name: 'Couples Mediator',
      description: 'AI for couples relationship guidance',
      category: 'couples',
      modelId: '',
      voiceId: '',
      systemPrompt: 'You are a skilled relationship mediator. Help couples communicate effectively and resolve conflicts with empathy and understanding.',
      userPrompt: 'We need help with our relationship.',
      temperature: 0.7,
      maxTokens: 2000,
      capabilities: ['mediation', 'communication', 'relationships']
    }
  ];

  // Load data
  const loadData = useCallback(async () => {
    try {
      const [modelsData, voicesData, providersData] = await Promise.all([
        aiProviderManager.getModels(),
        aiProviderManager.getVoices(),
        aiProviderManager.getProviders()
      ]);

      setModels(modelsData);
      setVoices(voicesData);
      setProviders(providersData);
    } catch (error) {
      console.error('Failed to load agent builder data:', error);
      toast.error('Failed to load agent builder data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Apply template
  const applyTemplate = (template: AgentTemplate) => {
    setAgentConfig({
      name: template.name,
      description: template.description,
      category: template.category,
      modelId: template.modelId || agentConfig.modelId,
      voiceId: template.voiceId || agentConfig.voiceId,
      systemPrompt: template.systemPrompt,
      userPrompt: template.userPrompt,
      temperature: template.temperature,
      maxTokens: template.maxTokens,
      capabilities: template.capabilities
    });
    toast.success(`Applied ${template.name} template`);
  };

  // Test agent
  const testAgent = async () => {
    if (!agentConfig.modelId) {
      toast.error('Please select a model first');
      return;
    }

    setTesting(true);
    setTestResult('');

    try {
      const response = await aiProviderManager.testModel(
        agentConfig.modelId,
        `${agentConfig.systemPrompt}\n\nUser: ${agentConfig.userPrompt}`,
        {
          temperature: agentConfig.temperature,
          maxTokens: agentConfig.maxTokens
        }
      );

      if (response.success && response.data) {
        setTestResult(response.data.content);
        toast.success('Agent test completed successfully');
      } else {
        setTestResult(`Error: ${response.error || 'Test failed'}`);
        toast.error('Agent test failed');
      }
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Agent test failed');
    } finally {
      setTesting(false);
    }
  };

  // Test voice
  const testVoice = async () => {
    if (!agentConfig.voiceId || agentConfig.voiceId === 'none') {
      toast.error('Please select a voice first');
      return;
    }

    try {
      const response = await aiProviderManager.testVoice(
        agentConfig.voiceId,
        agentConfig.userPrompt,
        {
          stability: 0.5,
          similarityBoost: 0.5
        }
      );

      if (response.success && response.data?.audioUrl) {
        const audio = new Audio(response.data.audioUrl);
        audio.play().catch(console.error);
        toast.success('Voice test completed');
      } else {
        toast.error('Voice test failed');
      }
    } catch (error) {
      toast.error('Voice test failed');
    }
  };

  // Save agent
  const saveAgent = async () => {
    if (!agentConfig.name || !agentConfig.modelId) {
      toast.error('Please provide a name and select a model');
      return;
    }

    try {
      // 1. Save the prompt configuration
      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .insert({
          name: `${agentConfig.name} - Prompt`,
          content: {
            system_prompt: agentConfig.systemPrompt,
            user_prompt: agentConfig.userPrompt,
            temperature: agentConfig.temperature,
            max_tokens: agentConfig.maxTokens,
            category: agentConfig.category,
            capabilities: agentConfig.capabilities,
          },
          status: 'active',
        })
        .select('id')
        .single();

      if (promptError) throw promptError;

      // 2. Save the agent with the new prompt_id
      const agentToSave = {
        name: agentConfig.name,
        description: agentConfig.description,
        model_id: agentConfig.modelId,
        voice_id: agentConfig.voiceId || null,
        prompt_id: promptData.id,
        status: 'active',
      };

      const { data: savedAgent, error: agentError } = await supabase
        .from('agents')
        .insert(agentToSave)
        .select()
        .single();

      if (agentError) throw agentError;

      toast.success('Agent saved successfully');
      
      if (onAgentCreated && savedAgent) {
        onAgentCreated({
          id: savedAgent.id,
          name: savedAgent.name,
          description: savedAgent.description || '',
          modelId: savedAgent.model_id,
          voiceId: savedAgent.voice_id || undefined,
          promptId: savedAgent.prompt_id || undefined,
          isActive: savedAgent.status === 'active',
          createdAt: savedAgent.created_at,
          updatedAt: savedAgent.updated_at || savedAgent.created_at,
        });
      }
    } catch (error) {
      console.error('Failed to save agent:', error);
      toast.error('Failed to save agent');
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
          <h2 className="text-2xl font-bold">AI Agent Builder</h2>
          <p className="text-muted-foreground">
            Create and configure AI agents by combining models, voices, and prompts
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={testAgent} disabled={testing || !agentConfig.modelId}>
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            Test Agent
          </Button>
          <Button onClick={saveAgent} className="gap-2">
            <Save className="h-4 w-4" />
            Save Agent
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="builder">Agent Builder</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="testing">Live Testing</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Basic Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentName">Agent Name</Label>
                  <Input
                    id="agentName"
                    value={agentConfig.name}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter agent name..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentDescription">Description</Label>
                  <Textarea
                    id="agentDescription"
                    value={agentConfig.description}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the agent's purpose..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={agentConfig.category}
                    onValueChange={(value) => setAgentConfig(prev => ({ ...prev, category: value as AgentTemplate['category'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="wellness">Wellness</SelectItem>
                      <SelectItem value="couples">Couples</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Model & Voice Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Model & Voice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model">AI Model</Label>
                  <Select
                    value={agentConfig.modelId}
                    onValueChange={(value) => setAgentConfig(prev => ({ ...prev, modelId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model..." />
                    </SelectTrigger>
                    <SelectContent>
                      {models.filter(m => m.enabled).map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
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

                <div className="space-y-2">
                  <Label htmlFor="voice">Voice (Optional)</Label>
                  <Select
                    value={agentConfig.voiceId}
                    onValueChange={(value) => setAgentConfig(prev => ({ ...prev, voiceId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Voice</SelectItem>
                      {voices.filter(v => v.enabled).map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex items-center gap-2">
                            <span>{voice.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {voice.locale}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {agentConfig.voiceId && (
                  <Button onClick={testVoice} variant="outline" className="w-full">
                    <Volume2 className="h-4 w-4 mr-2" />
                    Test Voice
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Prompts Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Prompts & Behavior
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={agentConfig.systemPrompt}
                  onChange={(e) => setAgentConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder="Define the agent's role and behavior..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userPrompt">User Prompt Template</Label>
                <Textarea
                  id="userPrompt"
                  value={agentConfig.userPrompt}
                  onChange={(e) => setAgentConfig(prev => ({ ...prev, userPrompt: e.target.value }))}
                  placeholder="Template for user interactions..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={agentConfig.temperature}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="4000"
                    value={agentConfig.maxTokens}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Agent Templates
              </CardTitle>
              <CardDescription>
                Pre-configured agent setups for different use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agentTemplates.map((template) => (
                  <Card key={template.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {template.capabilities.map((capability) => (
                            <Badge key={capability} variant="secondary" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => applyTemplate(template)}
                        className="w-full"
                        variant="outline"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Live Agent Testing
              </CardTitle>
              <CardDescription>
                Test your agent with real interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testInput">Test Input</Label>
                <Textarea
                  id="testInput"
                  value={agentConfig.userPrompt}
                  onChange={(e) => setAgentConfig(prev => ({ ...prev, userPrompt: e.target.value }))}
                  placeholder="Enter test message..."
                  rows={3}
                />
              </div>

              <Button onClick={testAgent} disabled={testing || !agentConfig.modelId} className="w-full">
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Test Agent
                  </>
                )}
              </Button>

              {testResult && (
                <div className="space-y-2">
                  <Label>Test Result</Label>
                  <div className="p-4 border rounded-lg bg-muted">
                    <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Agent Preview
              </CardTitle>
              <CardDescription>
                Preview your agent configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{agentConfig.name || 'Unnamed Agent'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm text-muted-foreground capitalize">{agentConfig.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Model</Label>
                  <p className="text-sm text-muted-foreground">
                    {models.find(m => m.id === agentConfig.modelId)?.displayName || 'Not selected'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Voice</Label>
                  <p className="text-sm text-muted-foreground">
                    {agentConfig.voiceId && agentConfig.voiceId !== 'none' ? voices.find(v => v.id === agentConfig.voiceId)?.name : 'No voice'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">System Prompt</Label>
                <div className="p-3 border rounded-lg bg-muted">
                  <p className="text-sm">{agentConfig.systemPrompt}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">User Prompt Template</Label>
                <div className="p-3 border rounded-lg bg-muted">
                  <p className="text-sm">{agentConfig.userPrompt}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Temperature</Label>
                  <p className="text-sm text-muted-foreground">{agentConfig.temperature}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Tokens</Label>
                  <p className="text-sm text-muted-foreground">{agentConfig.maxTokens}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Capabilities</Label>
                  <p className="text-sm text-muted-foreground">{agentConfig.capabilities.length} configured</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
