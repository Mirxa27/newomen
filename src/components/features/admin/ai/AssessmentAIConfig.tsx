// Assessment AI Configuration Component
// Configure AI for assessment scoring, feedback, and result analysis

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
import { Switch } from '@/components/shared/ui/switch';
import { toast } from 'sonner';
import {
  Brain,
  Target,
  MessageSquare,
  BarChart3,
  Mic,
  Settings,
  Save,
  TestTube,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
  TrendingUp,
  Users,
  Award,
  Lightbulb
} from 'lucide-react';

// Import services
import { aiProviderManager } from '@/services/features/ai/AIProviderManager';
import type { AIProvider, AIModel, AIVoice } from '@/services/features/ai/providers/types';

interface AssessmentAIConfig {
  id?: string;
  name: string;
  description: string;
  assessmentType: 'personality' | 'relationship' | 'wellness' | 'career' | 'custom';
  scoringModel: string;
  feedbackModel: string;
  voiceModel?: string;
  enabled: boolean;
  
  // Scoring configuration
  scoringPrompt: string;
  scoringCriteria: ScoringCriteria[];
  scoringWeights: Record<string, number>;
  
  // Feedback configuration
  feedbackPrompt: string;
  feedbackTone: 'supportive' | 'analytical' | 'encouraging' | 'neutral';
  includeRecommendations: boolean;
  
  // Voice configuration
  voiceEnabled: boolean;
  voiceSettings: {
    stability: number;
    similarityBoost: number;
    speed: number;
  };
  
  // Advanced settings
  temperature: number;
  maxTokens: number;
  timeout: number;
}

interface ScoringCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  minScore: number;
  maxScore: number;
  prompt: string;
}

interface AssessmentAIConfigProps {
  onConfigSaved?: (config: AssessmentAIConfig) => void;
  onConfigUpdated?: (config: AssessmentAIConfig) => void;
}

export function AssessmentAIConfig({ onConfigSaved, onConfigUpdated }: AssessmentAIConfigProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [voices, setVoices] = useState<AIVoice[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scoring');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  // Assessment AI configuration
  const [config, setConfig] = useState<AssessmentAIConfig>({
    name: '',
    description: '',
    assessmentType: 'personality',
    scoringModel: '',
    feedbackModel: '',
    voiceModel: '',
    enabled: true,
    scoringPrompt: 'Analyze the following assessment responses and provide detailed scoring based on the criteria.',
    scoringCriteria: [],
    scoringWeights: {},
    feedbackPrompt: 'Generate personalized feedback based on the assessment results.',
    feedbackTone: 'supportive',
    includeRecommendations: true,
    voiceEnabled: false,
    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.5,
      speed: 1.0
    },
    temperature: 0.3,
    maxTokens: 2000,
    timeout: 30000
  });

  // Predefined assessment types
  const assessmentTypes = [
    {
      id: 'personality',
      name: 'Personality Assessment',
      description: 'AI scoring for personality tests and behavioral assessments',
      criteria: [
        { id: 'openness', name: 'Openness', description: 'Openness to experience', weight: 0.2 },
        { id: 'conscientiousness', name: 'Conscientiousness', description: 'Level of organization and responsibility', weight: 0.2 },
        { id: 'extraversion', name: 'Extraversion', description: 'Social energy and assertiveness', weight: 0.2 },
        { id: 'agreeableness', name: 'Agreeableness', description: 'Cooperation and trust', weight: 0.2 },
        { id: 'neuroticism', name: 'Neuroticism', description: 'Emotional stability', weight: 0.2 }
      ]
    },
    {
      id: 'relationship',
      name: 'Relationship Assessment',
      description: 'AI analysis for couples and relationship compatibility',
      criteria: [
        { id: 'communication', name: 'Communication', description: 'Quality of communication patterns', weight: 0.3 },
        { id: 'intimacy', name: 'Intimacy', description: 'Emotional and physical intimacy', weight: 0.25 },
        { id: 'conflict_resolution', name: 'Conflict Resolution', description: 'How conflicts are handled', weight: 0.25 },
        { id: 'shared_values', name: 'Shared Values', description: 'Alignment of core values', weight: 0.2 }
      ]
    },
    {
      id: 'wellness',
      name: 'Wellness Assessment',
      description: 'AI evaluation for mental health and wellness assessments',
      criteria: [
        { id: 'stress_level', name: 'Stress Level', description: 'Current stress indicators', weight: 0.3 },
        { id: 'mood', name: 'Mood', description: 'Emotional state and stability', weight: 0.25 },
        { id: 'coping_strategies', name: 'Coping Strategies', description: 'Effectiveness of coping mechanisms', weight: 0.25 },
        { id: 'life_satisfaction', name: 'Life Satisfaction', description: 'Overall life satisfaction', weight: 0.2 }
      ]
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
      console.error('Failed to load assessment AI data:', error);
      toast.error('Failed to load assessment AI data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Update assessment type
  const updateAssessmentType = (type: string) => {
    const assessmentType = assessmentTypes.find(t => t.id === type);
    if (assessmentType) {
      setConfig(prev => ({
        ...prev,
        assessmentType: type as AssessmentAIConfig['assessmentType'],
        scoringCriteria: assessmentType.criteria.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          weight: c.weight,
          minScore: 0,
          maxScore: 10,
          prompt: `Evaluate ${c.name.toLowerCase()}: ${c.description}`
        })),
        scoringWeights: assessmentType.criteria.reduce((acc, c) => ({
          ...acc,
          [c.id]: c.weight
        }), {})
      }));
    }
  };

  // Test scoring
  const testScoring = async () => {
    if (!config.scoringModel) {
      toast.error('Please select a scoring model');
      return;
    }

    setTesting(true);
    setTestResult('');

    try {
      const testResponse = "I enjoy trying new things and meeting new people. I prefer to plan ahead and like to have structure in my life.";
      const prompt = `${config.scoringPrompt}\n\nAssessment Response: "${testResponse}"\n\nCriteria: ${config.scoringCriteria.map(c => `${c.name}: ${c.description}`).join(', ')}`;
      
      const response = await aiProviderManager.testModel(
        config.scoringModel,
        prompt,
        {
          temperature: config.temperature,
          maxTokens: config.maxTokens
        }
      );

      if (response.success && response.data) {
        setTestResult(response.data.content);
        toast.success('Scoring test completed successfully');
      } else {
        setTestResult(`Error: ${response.error || 'Test failed'}`);
        toast.error('Scoring test failed');
      }
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Scoring test failed');
    } finally {
      setTesting(false);
    }
  };

  // Test feedback
  const testFeedback = async () => {
    if (!config.feedbackModel) {
      toast.error('Please select a feedback model');
      return;
    }

    setTesting(true);
    setTestResult('');

    try {
      const testScores = { openness: 8, conscientiousness: 6, extraversion: 7, agreeableness: 9, neuroticism: 4 };
      const prompt = `${config.feedbackPrompt}\n\nAssessment Scores: ${JSON.stringify(testScores)}\n\nTone: ${config.feedbackTone}`;
      
      const response = await aiProviderManager.testModel(
        config.feedbackModel,
        prompt,
        {
          temperature: config.temperature,
          maxTokens: config.maxTokens
        }
      );

      if (response.success && response.data) {
        setTestResult(response.data.content);
        toast.success('Feedback test completed successfully');
      } else {
        setTestResult(`Error: ${response.error || 'Test failed'}`);
        toast.error('Feedback test failed');
      }
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Feedback test failed');
    } finally {
      setTesting(false);
    }
  };

  // Save configuration
  const saveConfig = async () => {
    if (!config.name || !config.scoringModel || !config.feedbackModel) {
      toast.error('Please provide a name and select models');
      return;
    }

    try {
      // TODO: Implement actual save to database
      console.log('Saving assessment AI config:', config);
      
      toast.success('Assessment AI configuration saved successfully');
      onConfigSaved?.(config);
    } catch (error) {
      console.error('Failed to save assessment AI config:', error);
      toast.error('Failed to save configuration');
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
          <h2 className="text-2xl font-bold">Assessment AI Configuration</h2>
          <p className="text-muted-foreground">
            Configure AI models for assessment scoring, feedback, and analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={testScoring} disabled={testing || !config.scoringModel}>
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            Test Scoring
          </Button>
          <Button onClick={saveConfig} className="gap-2">
            <Save className="h-4 w-4" />
            Save Config
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scoring">Scoring AI</TabsTrigger>
          <TabsTrigger value="feedback">Feedback AI</TabsTrigger>
          <TabsTrigger value="voice">Voice AI</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="scoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Assessment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="configName">Configuration Name</Label>
                  <Input
                    id="configName"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter configuration name..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={config.description}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this assessment AI configuration..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assessmentType">Assessment Type</Label>
                  <Select
                    value={config.assessmentType}
                    onValueChange={updateAssessmentType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assessmentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scoringModel">Scoring Model</Label>
                  <Select
                    value={config.scoringModel}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, scoringModel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select scoring model..." />
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
              </CardContent>
            </Card>

            {/* Scoring Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Scoring Criteria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scoringPrompt">Scoring Prompt</Label>
                  <Textarea
                    id="scoringPrompt"
                    value={config.scoringPrompt}
                    onChange={(e) => setConfig(prev => ({ ...prev, scoringPrompt: e.target.value }))}
                    placeholder="Define how the AI should score assessments..."
                    rows={4}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Scoring Criteria</Label>
                  {config.scoringCriteria.map((criterion, index) => (
                    <div key={criterion.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{criterion.name}</span>
                        <Badge variant="outline">{criterion.weight * 100}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{criterion.description}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Min Score</Label>
                          <Input
                            type="number"
                            value={criterion.minScore}
                            onChange={(e) => {
                              const newCriteria = [...config.scoringCriteria];
                              newCriteria[index].minScore = parseInt(e.target.value);
                              setConfig(prev => ({ ...prev, scoringCriteria: newCriteria }));
                            }}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Score</Label>
                          <Input
                            type="number"
                            value={criterion.maxScore}
                            onChange={(e) => {
                              const newCriteria = [...config.scoringCriteria];
                              newCriteria[index].maxScore = parseInt(e.target.value);
                              setConfig(prev => ({ ...prev, scoringCriteria: newCriteria }));
                            }}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feedback Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Feedback Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feedbackModel">Feedback Model</Label>
                  <Select
                    value={config.feedbackModel}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, feedbackModel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select feedback model..." />
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
                  <Label htmlFor="feedbackPrompt">Feedback Prompt</Label>
                  <Textarea
                    id="feedbackPrompt"
                    value={config.feedbackPrompt}
                    onChange={(e) => setConfig(prev => ({ ...prev, feedbackPrompt: e.target.value }))}
                    placeholder="Define how the AI should generate feedback..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedbackTone">Feedback Tone</Label>
                  <Select
                    value={config.feedbackTone}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, feedbackTone: value as AssessmentAIConfig['feedbackTone'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supportive">Supportive</SelectItem>
                      <SelectItem value="analytical">Analytical</SelectItem>
                      <SelectItem value="encouraging">Encouraging</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeRecommendations"
                    checked={config.includeRecommendations}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeRecommendations: checked }))}
                  />
                  <Label htmlFor="includeRecommendations">Include Recommendations</Label>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      min="100"
                      max="4000"
                      value={config.maxTokens}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="5000"
                    max="60000"
                    value={config.timeout}
                    onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                  <Label htmlFor="enabled">Enable Configuration</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice AI Configuration
              </CardTitle>
              <CardDescription>
                Configure voice synthesis for assessment results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="voiceEnabled"
                  checked={config.voiceEnabled}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, voiceEnabled: checked }))}
                />
                <Label htmlFor="voiceEnabled">Enable Voice Synthesis</Label>
              </div>

              {config.voiceEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="voiceModel">Voice Model</Label>
                    <Select
                      value={config.voiceModel}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, voiceModel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice model..." />
                      </SelectTrigger>
                      <SelectContent>
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

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stability">Stability</Label>
                      <Input
                        id="stability"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.voiceSettings.stability}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          voiceSettings: {
                            ...prev.voiceSettings,
                            stability: parseFloat(e.target.value)
                          }
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="similarityBoost">Similarity Boost</Label>
                      <Input
                        id="similarityBoost"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.voiceSettings.similarityBoost}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          voiceSettings: {
                            ...prev.voiceSettings,
                            similarityBoost: parseFloat(e.target.value)
                          }
                        }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="speed">Speed</Label>
                      <Input
                        id="speed"
                        type="number"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={config.voiceSettings.speed}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          voiceSettings: {
                            ...prev.voiceSettings,
                            speed: parseFloat(e.target.value)
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                AI Testing
              </CardTitle>
              <CardDescription>
                Test your assessment AI configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={testScoring} disabled={testing || !config.scoringModel} className="w-full">
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Testing Scoring...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Test Scoring AI
                    </>
                  )}
                </Button>

                <Button onClick={testFeedback} disabled={testing || !config.feedbackModel} className="w-full">
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Testing Feedback...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Test Feedback AI
                    </>
                  )}
                </Button>
              </div>

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
      </Tabs>
    </div>
  );
}
