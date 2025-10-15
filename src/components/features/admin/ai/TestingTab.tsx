import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Input } from '@/components/shared/ui/input';
import { Label } from '@/components/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shared/ui/select';
import { Textarea } from '@/components/shared/ui/textarea';
import { Badge } from '@/components/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shared/ui/tabs';
import { Progress } from '@/components/shared/ui/progress';
import { Separator } from '@/components/shared/ui/separator';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  TestTube,
  Mic,
  MessageSquare,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Volume2,
  Brain,
  Settings,
  Download,
  Upload,
  BarChart3,
  Target,
  Gauge,
  Timer,
  TrendingUp,
  Activity,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react';

// Import services
import { aiProviderManager } from '@/services/features/ai/AIProviderManager';
import type { AIProvider, AIModel, AIVoice, ProviderTestResult } from '@/services/features/ai/providers/types';

interface TestResult {
  id: string;
  type: 'model' | 'voice' | 'agent' | 'configuration' | 'provider';
  name: string;
  status: 'success' | 'error' | 'running' | 'warning';
  responseTime: number;
  result?: string;
  error?: string;
  timestamp: string;
  metrics?: {
    tokensUsed?: number;
    cost?: number;
    quality?: number;
    latency?: number;
    throughput?: number;
  };
  details?: {
    modelId?: string;
    providerId?: string;
    testType?: string;
    inputLength?: number;
    outputLength?: number;
    capabilities?: string[];
  };
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  tests: TestScenario[];
}

interface TestScenario {
  id: string;
  name: string;
  description: string;
  prompt: string;
  expectedCapabilities: string[];
  testType: 'basic' | 'advanced' | 'stress' | 'quality';
  timeout: number;
}

interface TestingTabProps {
  onDataChange?: () => void;
}

export function TestingTab({ onDataChange }: TestingTabProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [voices, setVoices] = useState<AIVoice[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('models');
  const [testProgress, setTestProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  // Test configuration
  const [testConfig, setTestConfig] = useState({
    selectedModel: '',
    selectedVoice: '',
    testPrompt: 'Hello, this is a test message. Please respond to verify the AI is working correctly.',
    testText: 'This is a test of the voice synthesis system.',
    temperature: 0.7,
    maxTokens: 100,
    testSuite: 'comprehensive'
  });

  // Predefined test suites
  const testSuites: TestSuite[] = [
    {
      id: 'basic',
      name: 'Basic Functionality',
      description: 'Test basic model capabilities and responses',
      tests: [
        {
          id: 'simple-chat',
          name: 'Simple Chat',
          description: 'Basic conversational response',
          prompt: 'Hello! How are you today?',
          expectedCapabilities: ['chat', 'completion'],
          testType: 'basic',
          timeout: 10000
        },
        {
          id: 'math-problem',
          name: 'Math Problem',
          description: 'Test logical reasoning',
          prompt: 'What is 15 + 27? Show your work.',
          expectedCapabilities: ['completion', 'reasoning'],
          testType: 'basic',
          timeout: 15000
        }
      ]
    },
    {
      id: 'advanced',
      name: 'Advanced Capabilities',
      description: 'Test advanced model features',
      tests: [
        {
          id: 'creative-writing',
          name: 'Creative Writing',
          description: 'Test creative text generation',
          prompt: 'Write a short story about a robot learning to paint.',
          expectedCapabilities: ['completion', 'creativity'],
          testType: 'advanced',
          timeout: 30000
        },
        {
          id: 'code-generation',
          name: 'Code Generation',
          description: 'Test programming capabilities',
          prompt: 'Write a Python function to calculate the factorial of a number.',
          expectedCapabilities: ['completion', 'code'],
          testType: 'advanced',
          timeout: 20000
        },
        {
          id: 'json-response',
          name: 'JSON Response',
          description: 'Test structured output',
          prompt: 'Return a JSON object with your name, age, and favorite color.',
          expectedCapabilities: ['json', 'structured'],
          testType: 'advanced',
          timeout: 15000
        }
      ]
    },
    {
      id: 'stress',
      name: 'Stress Testing',
      description: 'Test model limits and performance',
      tests: [
        {
          id: 'long-context',
          name: 'Long Context',
          description: 'Test with long input',
          prompt: 'Repeat the word "test" 1000 times, then summarize what you just did.',
          expectedCapabilities: ['completion', 'context'],
          testType: 'stress',
          timeout: 60000
        },
        {
          id: 'rapid-requests',
          name: 'Rapid Requests',
          description: 'Test rate limiting and performance',
          prompt: 'Count from 1 to 10.',
          expectedCapabilities: ['completion'],
          testType: 'stress',
          timeout: 5000
        }
      ]
    },
    {
      id: 'quality',
      name: 'Quality Assessment',
      description: 'Test response quality and consistency',
      tests: [
        {
          id: 'consistency',
          name: 'Response Consistency',
          description: 'Test for consistent responses',
          prompt: 'What is the capital of France?',
          expectedCapabilities: ['completion', 'accuracy'],
          testType: 'quality',
          timeout: 10000
        },
        {
          id: 'factual-accuracy',
          name: 'Factual Accuracy',
          description: 'Test knowledge accuracy',
          prompt: 'What is the chemical formula for water?',
          expectedCapabilities: ['completion', 'knowledge'],
          testType: 'quality',
          timeout: 15000
        }
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
      console.error('Failed to load testing data:', error);
      toast.error('Failed to load testing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Test model with real API call
  const testModel = async (modelId: string, testScenario?: TestScenario) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;

    const testId = `model-${modelId}-${Date.now()}`;
    setRunningTests(prev => new Set(prev).add(testId));
    setCurrentTest(model.displayName);
    const startTime = Date.now();

    try {
      // Get the provider for this model
      const provider = providers.find(p => p.id === model.providerId);
      if (!provider) {
        throw new Error('Provider not found for model');
      }

      // Use the test prompt from scenario or default
      const prompt = testScenario?.prompt || testConfig.testPrompt;
      
      // Make actual API call through the provider manager
      const response = await aiProviderManager.testModel(
        modelId,
        prompt,
        {
          temperature: testConfig.temperature,
          maxTokens: testConfig.maxTokens,
          timeout: testScenario?.timeout || 30000
        }
      );

      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        id: testId,
        type: 'model',
        name: model.displayName,
        status: response.success ? 'success' : 'error',
        responseTime,
        result: response.success ? response.data?.content || 'Test completed successfully' : undefined,
        error: response.success ? undefined : response.error,
        timestamp: new Date().toISOString(),
        metrics: {
          tokensUsed: response.data?.usage?.totalTokens || 0,
          cost: response.data?.cost || 0,
          latency: responseTime,
          throughput: response.data?.usage?.totalTokens ? (response.data.usage.totalTokens / (responseTime / 1000)) : 0
        },
        details: {
          modelId: model.modelId,
          providerId: model.providerId,
          testType: testScenario?.testType || 'basic',
          inputLength: prompt.length,
          outputLength: response.data?.content?.length || 0,
          capabilities: testScenario?.expectedCapabilities || []
        }
      };

      setTestResults(prev => [result, ...prev]);
      
      if (response.success) {
        toast.success(`Model ${model.displayName} test completed (${responseTime}ms)`);
      } else {
        toast.error(`Model ${model.displayName} test failed: ${response.error}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        id: testId,
        type: 'model',
        name: model.displayName,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        details: {
          modelId: model.modelId,
          providerId: model.providerId,
          testType: testScenario?.testType || 'basic'
        }
      };

      setTestResults(prev => [result, ...prev]);
      toast.error(`Model ${model.displayName} test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(testId);
        return newSet;
      });
      setCurrentTest(null);
    }
  };

  // Test voice with real API call
  const testVoice = async (voiceId: string) => {
    const voice = voices.find(v => v.id === voiceId);
    if (!voice) return;

    const testId = `voice-${voiceId}-${Date.now()}`;
    setRunningTests(prev => new Set(prev).add(testId));
    setCurrentTest(voice.name);
    const startTime = Date.now();

    try {
      // Make actual voice synthesis API call
      const response = await aiProviderManager.testVoice(
        voiceId,
        testConfig.testText,
        {
          temperature: 0.7,
          stability: 0.5,
          similarityBoost: 0.5
        }
      );

      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        id: testId,
        type: 'voice',
        name: voice.name,
        status: response.success ? 'success' : 'error',
        responseTime,
        result: response.success ? 'Voice synthesis completed successfully' : undefined,
        error: response.success ? undefined : response.error,
        timestamp: new Date().toISOString(),
        metrics: {
          latency: responseTime,
          quality: response.data?.quality || 0
        },
        details: {
          voiceId: voice.voiceId,
          providerId: voice.providerId,
          testType: 'voice_synthesis',
          inputLength: testConfig.testText.length,
          outputLength: response.data?.audioLength || 0
        }
      };

      setTestResults(prev => [result, ...prev]);
      
      if (response.success) {
        toast.success(`Voice ${voice.name} test completed (${responseTime}ms)`);
        if (response.data?.audioUrl) {
          const audio = new Audio(response.data.audioUrl);
          audio.play().catch(console.error);
        }
      } else {
        toast.error(`Voice ${voice.name} test failed: ${response.error}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        id: testId,
        type: 'voice',
        name: voice.name,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        details: {
          voiceId: voice.voiceId,
          providerId: voice.providerId,
          testType: 'voice_synthesis'
        }
      };

      setTestResults(prev => [result, ...prev]);
      toast.error(`Voice ${voice.name} test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(testId);
        return newSet;
      });
      setCurrentTest(null);
    }
  };

  // Test provider health
  const testProvider = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;

    const testId = `provider-${providerId}-${Date.now()}`;
    setRunningTests(prev => new Set(prev).add(testId));
    setCurrentTest(provider.name);
    const startTime = Date.now();

    try {
      const testResult = await aiProviderManager.testProvider(providerId);
      const responseTime = Date.now() - startTime;
      
      const result: TestResult = {
        id: testId,
        type: 'provider',
        name: provider.name,
        status: testResult.isHealthy ? 'success' : 'error',
        responseTime,
        result: testResult.isHealthy ? 'Provider is healthy and responsive' : undefined,
        error: testResult.isHealthy ? undefined : testResult.error,
        timestamp: new Date().toISOString(),
        metrics: {
          latency: responseTime
        },
        details: {
          providerId: provider.id,
          testType: 'health_check'
        }
      };

      setTestResults(prev => [result, ...prev]);
      
      if (testResult.isHealthy) {
        toast.success(`Provider ${provider.name} is healthy (${responseTime}ms)`);
      } else {
        toast.error(`Provider ${provider.name} health check failed: ${testResult.error}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        id: testId,
        type: 'provider',
        name: provider.name,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        details: {
          providerId: provider.id,
          testType: 'health_check'
        }
      };

      setTestResults(prev => [result, ...prev]);
      toast.error(`Provider ${provider.name} health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRunningTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(testId);
        return newSet;
      });
      setCurrentTest(null);
    }
  };

  // Run test suite
  const runTestSuite = async (suiteId: string, modelId?: string) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    const targetModels = modelId ? [models.find(m => m.id === modelId)] : models.filter(m => m.enabled);
    const totalTests = suite.tests.length * targetModels.length;
    let completedTests = 0;

    setTestProgress(0);
    setCurrentTest(`Running ${suite.name} test suite`);

    for (const model of targetModels) {
      if (!model) continue;

      for (const test of suite.tests) {
        try {
          await testModel(model.id, test);
          completedTests++;
          setTestProgress((completedTests / totalTests) * 100);
          
          // Small delay between tests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Test failed for model ${model.displayName}:`, error);
          completedTests++;
          setTestProgress((completedTests / totalTests) * 100);
        }
      }
    }

    setCurrentTest(null);
    setTestProgress(100);
    toast.success(`${suite.name} test suite completed`);
  };

  // Run comprehensive test
  const runComprehensiveTest = async () => {
    const allModels = models.filter(m => m.enabled);
    const allVoices = voices.filter(v => v.enabled);
    const allProviders = providers.filter(p => p.status === 'active');

    const totalTests = allModels.length + allVoices.length + allProviders.length;
    let completedTests = 0;

    setTestProgress(0);
    setCurrentTest('Running comprehensive test suite');

    // Test all providers first
    for (const provider of allProviders) {
      await testProvider(provider.id);
      completedTests++;
      setTestProgress((completedTests / totalTests) * 100);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test all models
    for (const model of allModels) {
      await testModel(model.id);
      completedTests++;
      setTestProgress((completedTests / totalTests) * 100);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test all voices
    for (const voice of allVoices) {
      await testVoice(voice.id);
      completedTests++;
      setTestProgress((completedTests / totalTests) * 100);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setCurrentTest(null);
    setTestProgress(100);
    toast.success('Comprehensive test completed');
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
          <h2 className="text-2xl font-bold">AI Testing & Validation</h2>
          <p className="text-muted-foreground">
            Comprehensive testing interface for models, voices, and AI capabilities
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runComprehensiveTest} className="gap-2" disabled={runningTests.size > 0}>
            <TestTube className="h-4 w-4" />
            Run All Tests
          </Button>
          <Button variant="outline" onClick={() => setTestResults([])} className="gap-2">
            <Activity className="h-4 w-4" />
            Clear Results
          </Button>
        </div>
      </div>

      {/* Test Progress */}
      {(testProgress > 0 || currentTest) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {currentTest || 'Test Progress'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(testProgress)}%
                </span>
              </div>
              <Progress value={testProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="models">Model Testing</TabsTrigger>
          <TabsTrigger value="voices">Voice Testing</TabsTrigger>
          <TabsTrigger value="providers">Provider Health</TabsTrigger>
          <TabsTrigger value="suites">Test Suites</TabsTrigger>
          <TabsTrigger value="agents">Agent Testing</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Model Performance Testing
              </CardTitle>
              <CardDescription>
                Test AI models for response quality, speed, and reliability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="testPrompt">Test Prompt</Label>
                    <Textarea
                      id="testPrompt"
                      value={testConfig.testPrompt}
                      onChange={(e) => setTestConfig(prev => ({ ...prev, testPrompt: e.target.value }))}
                      placeholder="Enter a test prompt..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={testConfig.temperature}
                      onChange={(e) => setTestConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {models.map((model) => (
                    <Card key={model.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{model.displayName}</h4>
                          <p className="text-sm text-muted-foreground">{model.providerId}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={model.enabled ? 'default' : 'secondary'}>
                              {model.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            {model.isRealtime && (
                              <Badge variant="outline">Realtime</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testModel(model.id)}
                          disabled={runningTests.has(model.id) || !model.enabled}
                        >
                          {runningTests.has(model.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <TestTube className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Quality Testing
              </CardTitle>
              <CardDescription>
                Test voice synthesis for quality, speed, and naturalness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testText">Test Text</Label>
                  <Textarea
                    id="testText"
                    value={testConfig.testText}
                    onChange={(e) => setTestConfig(prev => ({ ...prev, testText: e.target.value }))}
                    placeholder="Enter text to synthesize..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {voices.map((voice) => (
                    <Card key={voice.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{voice.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {voice.locale} • {voice.gender}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant={voice.enabled ? 'default' : 'secondary'}>
                              {voice.enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                            {voice.latencyMs && (
                              <Badge variant="outline">{voice.latencyMs}ms</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testVoice(voice.id)}
                          disabled={runningTests.has(voice.id) || !voice.enabled}
                        >
                          {runningTests.has(voice.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Provider Health Monitoring
              </CardTitle>
              <CardDescription>
                Test provider connectivity, API health, and response times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider, index) => (
                  <Card key={`${provider.id}-test-${index}`} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{provider.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {provider.type} • {provider.baseUrl}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                            {provider.status}
                          </Badge>
                          <Badge variant="outline">{provider.capabilities.models ? 'Models' : 'No Models'}</Badge>
                          <Badge variant="outline">{provider.capabilities.voices ? 'Voices' : 'No Voices'}</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testProvider(provider.id)}
                        disabled={runningTests.has(provider.id)}
                      >
                        {runningTests.has(provider.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Activity className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suites" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Comprehensive Test Suites
              </CardTitle>
              <CardDescription>
                Run predefined test suites to validate different AI capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {testSuites.map((suite) => (
                  <Card key={suite.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{suite.name}</h4>
                          <p className="text-sm text-muted-foreground">{suite.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{suite.tests.length} tests</Badge>
                            <Badge variant="secondary">
                              {suite.tests.map(t => t.testType).join(', ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => runTestSuite(suite.id)}
                            disabled={runningTests.size > 0}
                          >
                            <Play className="h-4 w-4" />
                            Run Suite
                          </Button>
                          <Select onValueChange={(modelId) => runTestSuite(suite.id, modelId)}>
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                            <SelectContent>
                              {models.filter(m => m.enabled).map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Test Scenarios:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {suite.tests.map((test) => (
                            <div key={test.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">{test.name}</p>
                                  <p className="text-xs text-muted-foreground">{test.description}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {test.testType}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Agent Conversation Testing
              </CardTitle>
              <CardDescription>
                Test complete agent workflows with live conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">
                  Agent Testing Interface
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Interactive agent testing coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Test Results & Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive test results with performance metrics and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <div className="text-center py-8">
                  <TestTube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground">
                    No test results yet
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Run some tests to see results here
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Test Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Successful</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {testResults.filter(r => r.status === 'success').length}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">Failed</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        {testResults.filter(r => r.status === 'error').length}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Avg Response</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.round(testResults.reduce((acc, r) => acc + r.responseTime, 0) / testResults.length)}ms
                      </p>
                    </Card>
                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">Total Tests</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {testResults.length}
                      </p>
                    </Card>
                  </div>

                  <Separator />

                  {/* Detailed Results */}
                  <div className="space-y-4">
                    {testResults.map((result) => (
                      <Card key={result.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{result.name}</h4>
                                <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                                  {result.status}
                                </Badge>
                                <Badge variant="outline">{result.type}</Badge>
                                {result.details?.testType && (
                                  <Badge variant="secondary">{result.details.testType}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {result.result || result.error}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {result.responseTime}ms
                                </span>
                                <span>{new Date(result.timestamp).toLocaleString()}</span>
                                {result.details?.modelId && (
                                  <span>Model: {result.details.modelId}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center">
                              {result.status === 'success' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                          </div>

                          {/* Metrics */}
                          {result.metrics && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted rounded-lg">
                              {result.metrics.tokensUsed && (
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Tokens</p>
                                  <p className="text-sm font-semibold">{result.metrics.tokensUsed}</p>
                                </div>
                              )}
                              {result.metrics.cost && (
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Cost</p>
                                  <p className="text-sm font-semibold">${result.metrics.cost.toFixed(4)}</p>
                                </div>
                              )}
                              {result.metrics.latency && (
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Latency</p>
                                  <p className="text-sm font-semibold">{result.metrics.latency}ms</p>
                                </div>
                              )}
                              {result.metrics.throughput && (
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground">Throughput</p>
                                  <p className="text-sm font-semibold">{Math.round(result.metrics.throughput)} tok/s</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Capabilities */}
                          {result.details?.capabilities && result.details.capabilities.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {result.details.capabilities.map((capability) => (
                                <Badge key={capability} variant="outline" className="text-xs">
                                  {capability}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
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