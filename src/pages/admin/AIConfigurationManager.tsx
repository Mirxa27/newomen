import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit2, TestTube, Save, Settings, Activity, DollarSign } from 'lucide-react';
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AIConfiguration {
  id: string;
  name: string;
  description?: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' | 'elevenlabs' | 'cartesia' | 'deepgram' | 'hume';
  provider_name?: string;
  model_name: string;
  api_base_url?: string;
  api_version?: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  system_prompt?: string;
  is_active: boolean;
  is_default: boolean;
  cost_per_1k_prompt_tokens?: number;
  cost_per_1k_completion_tokens?: number;
  test_status?: string;
  created_at: string;
  last_tested_at?: string;
}

interface ServiceConfig {
  id: string;
  service_type: string;
  service_name?: string;
  ai_configuration_id: string;
  priority: number;
  is_active: boolean;
  ai_configurations?: AIConfiguration;
}

export default function AIConfigurationManager() {
  const [configurations, setConfigurations] = useState<AIConfiguration[]>([]);
  const [serviceConfigs, setServiceConfigs] = useState<ServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<AIConfiguration | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [testResults, setTestResults] = useState<{
    testing: boolean;
    configId: string;
    success?: boolean;
    response?: string;
    usage?: any;
    time?: number;
    error?: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<AIConfiguration>>({
    name: "",
    description: "",
    provider: "openai",
    model_name: "",
    api_base_url: "",
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    system_prompt: "",
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    loadConfigurations();
    loadServiceConfigs();
  }, []);

  const loadConfigurations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigurations(data || []);
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load AI configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadServiceConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_service_configs')
        .select(`
          *,
          ai_configurations(name, model_name, provider)
        `)
        .order('service_type', { ascending: true });

      if (error) throw error;
      setServiceConfigs(data || []);
    } catch (error) {
      console.error('Error loading service configs:', error);
    }
  };

  const handleSave = async (config: Partial<AIConfiguration>) => {
    try {
      if (config.id) {
        const { error } = await supabase
          .from('ai_configurations')
          .update(config)
          .eq('id', config.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Configuration updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('ai_configurations')
          .insert([config as AIConfiguration]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Configuration created successfully',
        });
      }

      setEditingConfig(null);
      setShowNewForm(false);
      setFormData({
        name: "",
        description: "",
        provider: "openai",
        model_name: "",
        api_base_url: "",
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        system_prompt: "",
        is_active: true,
        is_default: false,
      });
      loadConfigurations();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!configToDelete) return;

    try {
      const { error } = await supabase
        .from('ai_configurations')
        .delete()
        .eq('id', configToDelete);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Configuration deleted successfully',
      });

      setConfigToDelete(null);
      setDeleteDialogOpen(false);
      loadConfigurations();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete configuration',
        variant: 'destructive',
      });
      setConfigToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleTest = async (config: AIConfiguration) => {
    setTestResults({ testing: true, configId: config.id });
    try {
      const testPrompt = "Hello! Please respond with a brief introduction of yourself.";
      const response = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          model: config.model_name,
          prompt: testPrompt,
          temperature: config.temperature,
          max_tokens: 100
        })
      });

      if (!response.ok) throw new Error('Test failed');
      const result = await response.json();
      setTestResults({
        testing: false,
        configId: config.id,
        success: true,
        response: result.content,
        usage: result.usage,
        time: result.processing_time_ms
      });
      toast({ title: "Success", description: "AI configuration test successful!" });
    } catch (error) {
      console.error("Error testing configuration:", error);
      setTestResults({
        testing: false,
        configId: config.id,
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
      toast({ title: "Error", description: "AI configuration test failed", variant: "destructive" });
    }
  };

  const startEdit = (config: AIConfiguration) => {
    setEditingConfig(config);
    setFormData(config);
    setShowNewForm(false);
  };

  const startNew = () => {
    setShowNewForm(true);
    setEditingConfig(null);
    setFormData({
      name: "",
      description: "",
      provider: "openai",
      model_name: "",
      api_base_url: "",
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      system_prompt: "",
      is_active: true,
      is_default: false,
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : (type === 'number' || type === 'range' ? parseFloat(value) : value)
    }));
  };

  const renderDialogContent = () => {
    if (!formState) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Configuration Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={handleFormChange}
              placeholder="e.g., GPT-4 Assessment Model"
              className="glass"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select
              value={formData.provider}
              onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value as AIConfiguration["provider"] }))}
            >
              <SelectTrigger className="glass">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="google">Google (Gemini)</SelectItem>
                <SelectItem value="azure">Azure OpenAI</SelectItem>
                <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                <SelectItem value="cartesia">Cartesia</SelectItem>
                <SelectItem value="deepgram">Deepgram</SelectItem>
                <SelectItem value="hume">Hume AI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="model_name">Model Name</Label>
            <Input
              id="model_name"
              value={formData.model_name || ''}
              onChange={handleFormChange}
              placeholder="e.g., gpt-4, claude-3-sonnet-20240229"
              className="glass"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api_base_url">API Base URL</Label>
            <Input
              id="api_base_url"
              value={formData.api_base_url || ''}
              onChange={handleFormChange}
              placeholder="e.g., https://api.openai.com"
              className="glass"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="temperature">Temperature: {formData.temperature}</Label>
            <Input
              id="temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={String(formData.temperature)}
              onChange={handleFormChange}
              className="glass"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_tokens">Max Tokens: {formData.max_tokens}</Label>
            <Input
              id="max_tokens"
              type="range"
              min="100"
              max="4000"
              step="100"
              value={String(formData.max_tokens)}
              onChange={handleFormChange}
              className="glass"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="system_prompt">System Prompt</Label>
          <Textarea
            id="system_prompt"
            value={formData.system_prompt || ''}
            onChange={handleFormChange}
            rows={3}
            className="glass"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Configuration Management</h1>
          <p className="text-muted-foreground">
            Configure AI models and prompts for assessments, quizzes, and challenges
          </p>
        </div>
        <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
          <DialogTrigger asChild>
            <Button className="clay-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass-card">
            <DialogHeader>
              <DialogTitle className="gradient-text">Create AI Configuration</DialogTitle>
              <DialogDescription>
                Configure a new AI model for assessments, quizzes, and challenges
              </DialogDescription>
            </DialogHeader>
            {renderDialogContent()}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowNewForm(false)} className="glass">
                Cancel
              </Button>
              <Button onClick={() => handleSave(formData)} className="clay-button">
                <Save className="w-4 h-4 mr-2" />
                Update Configuration
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 glass">
          <TabsTrigger value="configurations">
            <Settings className="w-4 h-4 mr-2" />
            AI Configurations
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <Activity className="w-4 h-4 mr-2" />
            Usage Monitoring
          </TabsTrigger>
          <TabsTrigger value="costs">
            <DollarSign className="w-4 h-4 mr-2" />
            Cost Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="gradient-text">AI Model Configurations</CardTitle>
              <CardDescription>
                Manage AI models and their settings for different types of content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {configurations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No AI configurations found</h3>
                  <p>Create your first AI configuration to get started</p>
                </div>
              ) : (
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Test</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {configurations.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold">{config.name}</div>
                              {config.description && (
                                <div className="text-sm text-muted-foreground">{config.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {config.provider}
                            </Badge>
                          </TableCell>
                          <TableCell>{config.model_name}</TableCell>
                          <TableCell>
                            <Badge variant={config.is_active ? "default" : "secondary"}>
                              {config.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTest(config)}
                              disabled={testResults?.testing && testResults?.configId === config.id}
                              className="glass"
                            >
                              <TestTube className="w-4 h-4" />
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(config)}
                                className="glass"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setConfigToDelete(config.id); setDeleteDialogOpen(true); }}
                                className="glass"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="gradient-text">AI Usage Monitoring</CardTitle>
              <CardDescription>
                Monitor AI API usage, performance, and error rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Usage monitoring dashboard will be displayed here</p>
                <p className="text-sm">Connect to AI usage logs for detailed analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="gradient-text">Cost Analysis</CardTitle>
              <CardDescription>
                Track AI API costs and usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Cost analysis dashboard will be displayed here</p>
                <p className="text-sm">Monitor API costs and optimize usage</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete AI Configuration?"
        description="Are you sure you want to delete this AI configuration? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
<dyad-problem-report summary="190 problems">
<problem file="src/services/NewMeMemoryService.ts" line="28" column="50" code="2345">Argument of type '&quot;get_newme_user_context&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/services/NewMeMemoryService.ts" line="146" column="26" code="2345">Argument of type '&quot;increment_message_count&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/services/NewMeMemoryService.ts" line="285" column="17" code="2769">No overload matches this call.
  Overload 1 of 2, '(values: { id?: string; user_id: string; conversation_id?: string; snapshot_date: string; primary_emotion: string; emotion_intensity: number; triggers?: string[]; coping_strategies?: string[]; notes?: string; metadata?: Json; }, options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Argument of type 'CreateEmotionalSnapshotInput' is not assignable to parameter of type '{ id?: string; user_id: string; conversation_id?: string; snapshot_date: string; primary_emotion: string; emotion_intensity: number; triggers?: string[]; coping_strategies?: string[]; notes?: string; metadata?: Json; }'.
      Property 'snapshot_date' is missing in type 'CreateEmotionalSnapshotInput' but required in type '{ id?: string; user_id: string; conversation_id?: string; snapshot_date: string; primary_emotion: string; emotion_intensity: number; triggers?: string[]; coping_strategies?: string[]; notes?: string; metadata?: Json; }'.
  Overload 2 of 2, '(values: { id?: string; user_id: string; conversation_id?: string; snapshot_date: string; primary_emotion: string; emotion_intensity: number; triggers?: string[]; coping_strategies?: string[]; notes?: string; metadata?: Json; }[], options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Argument of type 'CreateEmotionalSnapshotInput' is not assignable to parameter of type '{ id?: string; user_id: string; conversation_id?: string; snapshot_date: string; primary_emotion: string; emotion_intensity: number; triggers?: string[]; coping_strategies?: string[]; notes?: string; metadata?: Json; }[]'.
      Type 'CreateEmotionalSnapshotInput' is missing the following properties from type '{ id?: string; user_id: string; conversation_id?: string; snapshot_date: string; primary_emotion: string; emotion_intensity: number; triggers?: string[]; coping_strategies?: string[]; notes?: string; metadata?: Json; }[]': length, pop, push, concat, and 29 more.</problem>
<problem file="src/utils/AIService.ts" line="627" column="13" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/utils/AIService.ts" line="637" column="32" code="2339">Property 'title' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'title' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/utils/AIService.ts" line="638" column="26" code="2339">Property 'type' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'type' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/utils/AIService.ts" line="744" column="50" code="2345">Argument of type '&quot;get_ai_config_for_service&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/utils/AIService.ts" line="755" column="48" code="18047">'data' is possibly 'null'.</problem>
<problem file="src/pages/Chat.tsx" line="199" column="74" code="2589">Type instantiation is excessively deep and possibly infinite.</problem>
<problem file="src/pages/Chat.tsx" line="200" column="17" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;agents&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;agents&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/hooks/useUserProfile.ts" line="4" column="15" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/hooks/useUserProfile.ts" line="49" column="74" code="2589">Type instantiation is excessively deep and possibly infinite.</problem>
<problem file="src/hooks/useUserProfile.ts" line="50" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;user_achievements&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;user_achievements&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/hooks/useCouplesChallenge.ts" line="4" column="15" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/hooks/useCouplesChallenge.ts" line="41" column="17" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;couples_challenges&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;couples_challenges&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/hooks/useCouplesChallenge.ts" line="51" column="18" code="2339">Property 'initiator_id' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'initiator_id' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/hooks/useCouplesChallenge.ts" line="51" column="54" code="2339">Property 'partner_id' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'partner_id' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/hooks/useCouplesChallenge.ts" line="51" column="88" code="2339">Property 'partner_id' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'partner_id' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/hooks/useCouplesChallenge.ts" line="56" column="18" code="2339">Property 'initiator_id' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'initiator_id' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/hooks/useCouplesChallenge.ts" line="56" column="54" code="2339">Property 'partner_id' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'partner_id' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/hooks/useCouplesChallenge.ts" line="58" column="19" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;couples_challenges&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;couples_challenges&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/hooks/useCouplesChallenge.ts" line="129" column="13" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;couples_challenges&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;couples_challenges&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/hooks/useCouplesChallenge.ts" line="130" column="17" code="2353">Object literal may only specify known properties, and 'responses' does not exist in type '{ id?: string; user_id?: string; email?: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ...'.</problem>
<problem file="src/hooks/useCouplesChallenge.ts" line="160" column="19" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;couples_challenges&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;couples_challenges&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/hooks/useCouplesChallenge.ts" line="162" column="17" code="2769">No overload matches this call.
  Overload 1 of 2, '(values: { id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; ... 4 more ...; updated_at?: string; } | ... 8 more ... | { ...; }, options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'initiator_id' does not exist in type '{ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ....'.
  Overload 2 of 2, '(values: ({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; ... 4 more ...; updated_at?: string; } | ... 8 more ... | { ...; })[], options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'initiator_id' does not exist in type '({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ...'.</problem>
<problem file="src/pages/WellnessLibrary.tsx" line="40" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;wellness_resources&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;wellness_resources&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/WellnessLibrary.tsx" line="45" column="20" code="2345">Argument of type '({ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; })[]' is not assignable to parameter of type 'SetStateAction&lt;Resource[]&gt;'.
  Type '({ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; })[]' is not assignable to type 'Resource[]'.
    Type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }' is not assignable to type 'Resource'.
      Type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }' is missing the following properties from type 'Resource': title, category, duration, audio_url</problem>
<problem file="src/hooks/useCommunity.ts" line="3" column="15" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/hooks/useCommunity.ts" line="27" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;community_connections&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;community_connections&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/hooks/useCommunity.ts" line="78" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;community_connections&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;community_connections&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/hooks/useCommunity.ts" line="80" column="11" code="2769">No overload matches this call.
  Overload 1 of 2, '(values: { id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; ... 4 more ...; updated_at?: string; } | ... 8 more ... | { ...; }, options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'requester_id' does not exist in type '{ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ....'.
  Overload 2 of 2, '(values: ({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; ... 4 more ...; updated_at?: string; } | ... 8 more ... | { ...; })[], options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'requester_id' does not exist in type '({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ...'.</problem>
<problem file="src/hooks/useCommunity.ts" line="96" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;community_connections&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;community_connections&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/AccountSettings.tsx" line="15" column="15" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/pages/AccountSettings.tsx" line="51" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;subscriptions&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;subscriptions&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/AccountSettings.tsx" line="93" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;subscriptions&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;subscriptions&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/NarrativeIdentityExploration.tsx" line="73" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;user_memory_profiles&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;user_memory_profiles&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/NarrativeIdentityExploration.tsx" line="78" column="25" code="2339">Property 'narrative_identity_data' does not exist on type 'SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;'.
  Property 'narrative_identity_data' does not exist on type 'SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'user_profiles'.&quot;&gt;'.</problem>
<problem file="src/pages/NarrativeIdentityExploration.tsx" line="80" column="33" code="2339">Property 'narrative_identity_data' does not exist on type 'SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;'.
  Property 'narrative_identity_data' does not exist on type 'SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'user_profiles'.&quot;&gt;'.</problem>
<problem file="src/pages/NarrativeIdentityExploration.tsx" line="82" column="50" code="2339">Property 'narrative_identity_data' does not exist on type 'SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;'.
  Property 'narrative_identity_data' does not exist on type 'SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'user_profiles'.&quot;&gt;'.</problem>
<problem file="src/pages/NarrativeIdentityExploration.tsx" line="86" column="40" code="2339">Property 'narrative_identity_data' does not exist on type 'SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;'.
  Property 'narrative_identity_data' does not exist on type 'SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'user_profiles'.&quot;&gt;'.</problem>
<problem file="src/pages/NarrativeIdentityExploration.tsx" line="86" column="93" code="2339">Property 'narrative_identity_data' does not exist on type 'SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;'.
  Property 'narrative_identity_data' does not exist on type 'SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'user_profiles'.&quot;&gt;'.</problem>
<problem file="src/pages/NarrativeIdentityExploration.tsx" line="87" column="37" code="2339">Property 'narrative_identity_data' does not exist on type 'SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;'.
  Property 'narrative_identity_data' does not exist on type 'SelectQueryError&lt;&quot;column 'narrative_identity_data' does not exist on 'user_profiles'.&quot;&gt;'.</problem>
<problem file="src/pages/NarrativeIdentityExploration.tsx" line="181" column="27" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;user_memory_profiles&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;user_memory_profiles&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/services/AssessmentServiceOptimized.ts" line="2" column="10" code="2305">Module '&quot;@supabase/supabase-js&quot;' has no exported member 'PostgrestFilterBuilder'.</problem>
<problem file="src/services/AssessmentServiceOptimized.ts" line="2" column="34" code="2305">Module '&quot;@supabase/supabase-js&quot;' has no exported member 'PostgrestTransformBuilder'.</problem>
<problem file="src/services/AssessmentServiceOptimized.ts" line="28" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/services/AssessmentServiceOptimized.ts" line="65" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/services/AssessmentServiceOptimized.ts" line="112" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/services/AssessmentServiceOptimized.ts" line="135" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/services/AssessmentServiceOptimized.ts" line="138" column="10" code="2339">Property 'eq' does not exist on type 'PostgrestTransformBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; ... 6 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationshi...'.</problem>
<problem file="src/services/AssessmentServiceOptimized.ts" line="210" column="35" code="2552">Cannot find name 'Json'. Did you mean 'JSON'?</problem>
<problem file="src/services/AssessmentServiceOptimized.ts" line="252" column="10" code="2339">Property 'eq' does not exist on type 'PostgrestTransformBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; ... 6 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationshi...'.</problem>
<problem file="src/services/AssessmentServiceOptimized.ts" line="275" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/Analytics.tsx" line="8" column="15" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/pages/admin/Analytics.tsx" line="68" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/Analytics.tsx" line="73" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/Analytics.tsx" line="84" column="27" code="2352">Conversion of type '(SelectQueryError&lt;&quot;column 'user_id' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'user_id' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' to type 'Pick&lt;Tables&lt;&quot;sessions&quot;&gt;, &quot;user_id&quot; | &quot;status&quot; | &quot;duration_seconds&quot; | &quot;cost_usd&quot; | &quot;start_ts&quot;&gt;[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'SelectQueryError&lt;&quot;column 'user_id' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'user_id' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;' is not comparable to type 'Pick&lt;Tables&lt;&quot;sessions&quot;&gt;, &quot;user_id&quot; | &quot;status&quot; | &quot;duration_seconds&quot; | &quot;cost_usd&quot; | &quot;start_ts&quot;&gt;'.
    Type '{ error: true; } &amp; String' is missing the following properties from type 'Pick&lt;Tables&lt;&quot;sessions&quot;&gt;, &quot;user_id&quot; | &quot;status&quot; | &quot;duration_seconds&quot; | &quot;cost_usd&quot; | &quot;start_ts&quot;&gt;': user_id, status, duration_seconds, cost_usd, start_ts</problem>
<problem file="src/pages/admin/Agents.tsx" line="114" column="17" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;agents&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;agents&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/Agents.tsx" line="122" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;prompts&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;prompts&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/Agents.tsx" line="123" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;models&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;models&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/Agents.tsx" line="124" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;voices&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;voices&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/Agents.tsx" line="132" column="18" code="2352">Conversion of type '({ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 6 more ...; voices: SelectQueryError&lt;...&gt;; } | ... 98 more ... | { ...; })[]' to type 'AgentRow[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 6 more ...; voices: SelectQueryError&lt;...&gt;; } | ... 98 more ... | { ...; }' is not comparable to type 'AgentRow'.
    Type '{ id: string; user_id: string; assessment_name: string; suggested_in_conversation_id: string; suggested_at: string; completed_at: string; completion_status: string; key_insights: string[]; ... 4 more ...; voices: SelectQueryError&lt;...&gt;; }' is missing the following properties from type 'AgentRow': name, status, prompt_id, model_id, and 4 more.</problem>
<problem file="src/pages/admin/Agents.tsx" line="133" column="19" code="2352">Conversion of type '(SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' to type 'PromptSummary[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;' is not comparable to type 'PromptSummary'.
    Type '{ error: true; } &amp; String' is missing the following properties from type 'PromptSummary': id, name</problem>
<problem file="src/pages/admin/Agents.tsx" line="134" column="18" code="2352">Conversion of type '(SelectQueryError&lt;&quot;column 'model_id' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'model_id' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' to type 'ModelSummary[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'SelectQueryError&lt;&quot;column 'model_id' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'model_id' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;' is not comparable to type 'ModelSummary'.
    Type '{ error: true; } &amp; String' is missing the following properties from type 'ModelSummary': id, model_id, display_name, provider_id</problem>
<problem file="src/pages/admin/Agents.tsx" line="135" column="18" code="2352">Conversion of type '(SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' to type 'VoiceSummary[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;' is not comparable to type 'VoiceSummary'.
    Type '{ error: true; } &amp; String' is missing the following properties from type 'VoiceSummary': id, name, locale, provider_id</problem>
<problem file="src/pages/admin/Agents.tsx" line="196" column="17" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;agents&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;agents&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/Agents.tsx" line="202" column="47" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;agents&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;agents&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/Agents.tsx" line="202" column="64" code="2769">No overload matches this call.
  Overload 1 of 2, '(values: { id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; ... 4 more ...; updated_at?: string; } | ... 8 more ... | { ...; }, options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Argument of type '{ name: string; prompt_id: string; model_id: string; voice_id: string; status: &quot;active&quot; | &quot;inactive&quot;; tool_policy: any; vad_config: any; }' is not assignable to parameter of type '{ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ....'.
      Type '{ name: string; prompt_id: string; model_id: string; voice_id: string; status: &quot;active&quot; | &quot;inactive&quot;; tool_policy: any; vad_config: any; }' is missing the following properties from type '{ id?: string; name: string; description?: string; provider: string; provider_name?: string; model_name: string; api_base_url?: string; api_key_encrypted?: string; api_version?: string; temperature?: number; ... 20 more ...; test_status?: string; }': provider, model_name
  Overload 2 of 2, '(values: ({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; ... 4 more ...; updated_at?: string; } | ... 8 more ... | { ...; })[], options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Argument of type '{ name: string; prompt_id: string; model_id: string; voice_id: string; status: &quot;active&quot; | &quot;inactive&quot;; tool_policy: any; vad_config: any; }' is not assignable to parameter of type '({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ...'.
      Type '{ name: string; prompt_id: string; model_id: string; voice_id: string; status: &quot;active&quot; | &quot;inactive&quot;; tool_policy: any; vad_config: any; }' is missing the following properties from type '({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ...': length, pop, push, concat, and 29 more.</problem>
<problem file="src/pages/admin/Agents.tsx" line="227" column="45" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;agents&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;agents&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="15" column="46" code="2339">Property 'providers' does not exist on type '{ user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; ... 4 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more...'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="16" column="43" code="2339">Property 'models' does not exist on type '{ user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; ... 4 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more...'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="17" column="43" code="2339">Property 'voices' does not exist on type '{ user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; ... 4 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more...'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="37" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;providers&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;providers&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="38" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;models&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;models&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="39" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;voices&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;voices&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="91" column="17" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;providers&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;providers&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="92" column="12" code="2769">No overload matches this call.
  Overload 1 of 2, '(values: { id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; ... 4 more ...; updated_at?: string; } | ... 8 more ... | { ...; }, options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Argument of type '{ id: any; name: any; type: any; }' is not assignable to parameter of type '{ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ....'.
      Type '{ id: any; name: any; type: any; }' is missing the following properties from type '{ id?: string; name: string; description?: string; provider: string; provider_name?: string; model_name: string; api_base_url?: string; api_key_encrypted?: string; api_version?: string; temperature?: number; ... 20 more ...; test_status?: string; }': provider, model_name
  Overload 2 of 2, '(values: ({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; ... 4 more ...; updated_at?: string; } | ... 8 more ... | { ...; })[], options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'id' does not exist in type '({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ...'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="99" column="58" code="2345">Argument of type '&quot;store_provider_api_key&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="108" column="47" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;models&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;models&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="113" column="47" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;voices&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;voices&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="141" column="42" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;providers&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;providers&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="143" column="42" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;models&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;models&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIProviderManagement.tsx" line="145" column="42" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;voices&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;voices&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIConfigurationManager.tsx" line="127" column="25" code="2345">Argument of type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }[]' is not assignable to parameter of type 'SetStateAction&lt;AIConfiguration[]&gt;'.
  Type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }[]' is not assignable to type 'AIConfiguration[]'.
    Type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }' is not assignable to type 'AIConfiguration'.
      Types of property 'provider' are incompatible.
        Type 'string' is not assignable to type '&quot;openai&quot; | &quot;anthropic&quot; | &quot;google&quot; | &quot;azure&quot; | &quot;custom&quot; | &quot;elevenlabs&quot; | &quot;cartesia&quot; | &quot;deepgram&quot; | &quot;hume&quot;'.</problem>
<problem file="src/pages/admin/AIConfigurationManager.tsx" line="143" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;ai_service_configs&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;ai_service_configs&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIConfigurationManager.tsx" line="151" column="25" code="2345">Argument of type '({ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; ai_configurations: SelectQueryError&lt;...&gt;; } | ... 98 more ... | { ...; })[]' is not assignable to parameter of type 'SetStateAction&lt;ServiceConfig[]&gt;'.
  Type '({ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; ai_configurations: SelectQueryError&lt;...&gt;; } | ... 98 more ... | { ...; })[]' is not assignable to type 'ServiceConfig[]'.
    Type '{ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; ai_configurations: SelectQueryError&lt;...&gt;; } | ... 98 more ... | { ...; }' is not assignable to type 'ServiceConfig'.
      Type '{ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; ai_configurations: SelectQueryError&lt;...&gt;; }' is missing the following properties from type 'ServiceConfig': service_type, ai_configuration_id, priority, is_active</problem>
<problem file="src/pages/admin/AIConfigurationManager.tsx" line="335" column="16" code="2304">Cannot find name 'DialogDescription'.</problem>
<problem file="src/pages/admin/AIConfigurationManager.tsx" line="337" column="17" code="2304">Cannot find name 'DialogDescription'.</problem>
<problem file="src/pages/admin/AIPrompting.tsx" line="3" column="21" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/pages/admin/AIPrompting.tsx" line="40" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;prompts&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;prompts&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIPrompting.tsx" line="96" column="47" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;prompts&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;prompts&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIPrompting.tsx" line="96" column="65" code="2769">No overload matches this call.
  Overload 1 of 2, '(values: { id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; ... 4 more ...; updated_at?: string; } | ... 8 more ... | { ...; }, options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Argument of type '{ name: any; content: Json; status: any; version: any; hosted_prompt_id: any; }' is not assignable to parameter of type '{ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ....'.
      Type '{ name: any; content: Json; status: any; version: any; hosted_prompt_id: any; }' is missing the following properties from type '{ id?: string; conversation_id: string; role: string; content: string; timestamp?: string; audio_duration_ms?: number; sentiment_score?: number; emotion_detected?: string; metadata?: Json; }': conversation_id, role
  Overload 2 of 2, '(values: ({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; ... 4 more ...; updated_at?: string; } | ... 8 more ... | { ...; })[], options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Argument of type '{ name: any; content: Json; status: any; version: any; hosted_prompt_id: any; }' is not assignable to parameter of type '({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ...'.
      Type '{ name: any; content: Json; status: any; version: any; hosted_prompt_id: any; }' is missing the following properties from type '({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ...': length, pop, push, concat, and 29 more.</problem>
<problem file="src/pages/admin/AIPrompting.tsx" line="100" column="47" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;prompts&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;prompts&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIPrompting.tsx" line="122" column="45" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;prompts&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;prompts&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/types/assessment-types.ts" line="1" column="21" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/pages/admin/AIAssessmentManagement.tsx" line="49" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIAssessmentManagement.tsx" line="51" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;providers&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;providers&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIAssessmentManagement.tsx" line="52" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;models&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;models&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIAssessmentManagement.tsx" line="53" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;ai_use_cases&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;ai_use_cases&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIAssessmentManagement.tsx" line="54" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;ai_behaviors&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;ai_behaviors&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/AIAssessmentManagement.tsx" line="68" column="20" code="2345">Argument of type '(SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' is not assignable to parameter of type 'SetStateAction&lt;Provider[]&gt;'.
  Type '(SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' is not assignable to type 'Provider[]'.
    Type 'SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;' is not assignable to type 'Provider'.
      Type '{ error: true; } &amp; String' is missing the following properties from type 'Provider': id, name</problem>
<problem file="src/pages/admin/AIAssessmentManagement.tsx" line="69" column="17" code="2345">Argument of type '(SelectQueryError&lt;&quot;column 'display_name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'display_name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' is not assignable to parameter of type 'SetStateAction&lt;Model[]&gt;'.
  Type '(SelectQueryError&lt;&quot;column 'display_name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'display_name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' is not assignable to type 'Model[]'.
    Type 'SelectQueryError&lt;&quot;column 'display_name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'display_name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;' is not assignable to type 'Model'.
      Type '{ error: true; } &amp; String' is missing the following properties from type 'Model': id, display_name</problem>
<problem file="src/pages/admin/AIAssessmentManagement.tsx" line="70" column="19" code="2345">Argument of type '(SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' is not assignable to parameter of type 'SetStateAction&lt;UseCase[]&gt;'.
  Type '(SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' is not assignable to type 'UseCase[]'.
    Type 'SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;' is not assignable to type 'UseCase'.
      Type '{ error: true; } &amp; String' is missing the following properties from type 'UseCase': id, name</problem>
<problem file="src/pages/admin/AIAssessmentManagement.tsx" line="71" column="20" code="2345">Argument of type '(SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' is not assignable to parameter of type 'SetStateAction&lt;Behavior[]&gt;'.
  Type '(SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' is not assignable to type 'Behavior[]'.
    Type 'SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;' is not assignable to type 'Behavior'.
      Type '{ error: true; } &amp; String' is missing the following properties from type 'Behavior': id, name</problem>
<problem file="src/pages/admin/SessionsLive.tsx" line="65" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/SessionsLive.tsx" line="74" column="40" code="2352">Conversion of type '(SelectQueryError&lt;&quot;column 'agent_id' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'agent_id' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' to type 'SessionResponse[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'SelectQueryError&lt;&quot;column 'agent_id' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'agent_id' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;' is not comparable to type 'SessionResponse'.
    Type '{ error: true; } &amp; String' is missing the following properties from type 'SessionResponse': id, agent_id, start_ts, status, and 2 more.</problem>
<problem file="src/pages/admin/SessionsLive.tsx" line="93" column="35" code="2589">Type instantiation is excessively deep and possibly infinite.</problem>
<problem file="src/pages/admin/SessionsLive.tsx" line="94" column="13" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;messages&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;messages&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/SessionsLive.tsx" line="100" column="30" code="2352">Conversion of type '(SelectQueryError&lt;&quot;column 'sender' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'sender' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' to type 'MessageRow[]' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type 'SelectQueryError&lt;&quot;column 'sender' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'sender' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;' is not comparable to type 'MessageRow'.
    Type '{ error: true; } &amp; String' is missing the following properties from type 'MessageRow': id, sender, text_content, audio_url, ts</problem>
<problem file="src/pages/admin/SessionsLive.tsx" line="122" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/SessionsHistory.tsx" line="13" column="15" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/pages/admin/SessionsHistory.tsx" line="100" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/SessionsHistory.tsx" line="130" column="19" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;messages&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;messages&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/SessionsHistory.tsx" line="207" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/SessionsHistory.tsx" line="214" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;messages&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;messages&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/SessionsHistory.tsx" line="221" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;sessions&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/SessionsHistory.tsx" line="228" column="58" code="2339">Property 'duration_seconds' does not exist on type 'SelectQueryError&lt;&quot;column 'duration_seconds' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'duration_seconds' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;'.
  Property 'duration_seconds' does not exist on type 'SelectQueryError&lt;&quot;column 'duration_seconds' does not exist on 'user_profiles'.&quot;&gt;'.</problem>
<problem file="src/pages/admin/SessionsHistory.tsx" line="231" column="58" code="2339">Property 'status' does not exist on type 'SelectQueryError&lt;&quot;column 'duration_seconds' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'duration_seconds' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;'.
  Property 'status' does not exist on type 'SelectQueryError&lt;&quot;column 'duration_seconds' does not exist on 'user_profiles'.&quot;&gt;'.</problem>
<problem file="src/pages/admin/SessionsHistory.tsx" line="232" column="61" code="2339">Property 'status' does not exist on type 'SelectQueryError&lt;&quot;column 'duration_seconds' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'duration_seconds' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;'.
  Property 'status' does not exist on type 'SelectQueryError&lt;&quot;column 'duration_seconds' does not exist on 'user_profiles'.&quot;&gt;'.</problem>
<problem file="src/pages/admin/SessionsHistory.tsx" line="262" column="17" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;messages&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;messages&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/UserManagement.tsx" line="2" column="10" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/pages/admin/ContentManagement.tsx" line="14" column="10" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/pages/admin/ContentManagement.tsx" line="47" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ContentManagement.tsx" line="48" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;wellness_resources&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;wellness_resources&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ContentManagement.tsx" line="49" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;affirmations&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;affirmations&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ContentManagement.tsx" line="50" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;challenge_templates&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;challenge_templates&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ContentManagement.tsx" line="77" column="51" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;affirmations&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;affirmations&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ContentManagement.tsx" line="77" column="67" code="2769">No overload matches this call.
  Overload 1 of 2, '(values: { id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; ... 4 more ...; updated_at?: string; } | ... 8 more ... | { ...; }, options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'tone' does not exist in type '{ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ....'.
  Overload 2 of 2, '(values: ({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; ... 4 more ...; updated_at?: string; } | ... 8 more ... | { ...; })[], options?: { ...; }): PostgrestFilterBuilder&lt;...&gt;', gave the following error.
    Object literal may only specify known properties, and 'content' does not exist in type '({ id?: string; user_id?: string; email: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ...'.</problem>
<problem file="src/pages/admin/ContentManagement.tsx" line="106" column="51" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;challenge_templates&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;challenge_templates&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ContentManagement.tsx" line="124" column="42" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ContentManagement.tsx" line="127" column="42" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;affirmations&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;affirmations&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ContentManagement.tsx" line="130" column="42" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;challenge_templates&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;challenge_templates&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/APISettings.tsx" line="24" column="15" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/pages/admin/APISettings.tsx" line="24" column="23" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'TablesInsert'.</problem>
<problem file="src/pages/admin/APISettings.tsx" line="24" column="37" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'TablesUpdate'.</problem>
<problem file="src/pages/admin/APISettings.tsx" line="95" column="62" code="2589">Type instantiation is excessively deep and possibly infinite.</problem>
<problem file="src/pages/admin/APISettings.tsx" line="96" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;api_integrations&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;api_integrations&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/APISettings.tsx" line="142" column="17" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;api_integrations&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;api_integrations&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/APISettings.tsx" line="148" column="17" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;api_integrations&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;api_integrations&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/APISettings.tsx" line="258" column="19" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;api_integrations&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;api_integrations&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="46" column="35" code="2589">Type instantiation is excessively deep and possibly infinite.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="46" column="35" code="2589">Type instantiation is excessively deep and possibly infinite.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="46" column="35" code="2589">Type instantiation is excessively deep and possibly infinite.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="47" column="13" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;ai_model_configs&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;ai_model_configs&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="65" column="12" code="2352">Conversion of type 'SelectQueryError&lt;&quot;could not find the relation between user_profiles and providers&quot;&gt; | SelectQueryError&lt;&quot;could not find the relation between level_thresholds and providers&quot;&gt; | ... 17 more ... | ({ ...; } &amp; &quot;could not find the relation between newme_assessment_tracking and providers&quot;)' to type 'AIProviderConfig' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ error: true; } &amp; String' is missing the following properties from type 'AIProviderConfig': id, name, type, api_base, and 6 more.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="78" column="13" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;prompt_templates&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;prompt_templates&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="87" column="15" code="2589">Type instantiation is excessively deep and possibly infinite.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="100" column="12" code="2352">Conversion of type '{ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; use_case: SelectQueryError&lt;...&gt;; } | ... 98 more ... | { ...; }' to type 'PromptTemplate' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ id: string; user_id: string; assessment_name: string; suggested_in_conversation_id: string; suggested_at: string; completed_at: string; completion_status: string; key_insights: string[]; follow_up_discussed: boolean; metadata: Json; use_case: SelectQueryError&lt;...&gt;; }' is missing the following properties from type 'PromptTemplate': name, system_prompt, temperature, max_tokens</problem>
<problem file="src/lib/ai-provider-utils.ts" line="113" column="13" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;ai_behaviors&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;ai_behaviors&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="124" column="12" code="2352">Conversion of type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }' to type 'AIBehavior' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ id: string; assessment_id: string; user_id: string; attempt_number: number; started_at: string; completed_at: string; time_spent_minutes: number; status: string; raw_responses: Json; ... 5 more ...; created_at: string; }' is missing the following properties from type 'AIBehavior': name, personality_traits, communication_style, response_length, emotional_tone</problem>
<problem file="src/lib/ai-provider-utils.ts" line="161" column="13" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;ai_model_configs&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;ai_model_configs&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="179" column="22" code="2352">Conversion of type 'SelectQueryError&lt;&quot;could not find the relation between user_profiles and providers&quot;&gt; | SelectQueryError&lt;&quot;could not find the relation between level_thresholds and providers&quot;&gt; | ... 17 more ... | ({ ...; } &amp; &quot;could not find the relation between newme_assessment_tracking and providers&quot;)' to type 'AIProviderConfig' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ error: true; } &amp; String' is missing the following properties from type 'AIProviderConfig': id, name, type, api_base, and 6 more.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="180" column="22" code="2352">Conversion of type 'SelectQueryError&lt;&quot;could not find the relation between user_profiles and ai_behaviors&quot;&gt; | SelectQueryError&lt;&quot;could not find the relation between level_thresholds and ai_behaviors&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;' to type 'AIBehavior' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  Type '{ error: true; } &amp; String' is missing the following properties from type 'AIBehavior': id, name, personality_traits, communication_style, and 2 more.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="263" column="13" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;ai_use_cases&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;ai_use_cases&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="273" column="5" code="2322">Type '(SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;)[]' is not assignable to type '{ id: string; name: string; category: string; }[]'.
  Type 'SelectQueryError&lt;&quot;column 'name' does not exist on 'user_profiles'.&quot;&gt; | SelectQueryError&lt;&quot;column 'name' does not exist on 'level_thresholds'.&quot;&gt; | ... 7 more ... | SelectQueryError&lt;...&gt;' is not assignable to type '{ id: string; name: string; category: string; }'.
    Type '{ error: true; } &amp; String' is missing the following properties from type '{ id: string; name: string; category: string; }': id, name, category</problem>
<problem file="src/lib/ai-provider-utils.ts" line="286" column="13" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;ai_behaviors&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;ai_behaviors&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-provider-utils.ts" line="296" column="5" code="2322">Type '({ personality_traits: Record&lt;string, number&gt;; id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; ... 22 more ...; test_status: string; } | ... 8 more ... | { ...; })[]' is not assignable to type 'AIBehavior[]'.
  Type '{ personality_traits: Record&lt;string, number&gt;; id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; ... 22 more ...; test_status: string; } | ... 8 more ... | { ...; }' is not assignable to type 'AIBehavior'.
    Type '{ personality_traits: Record&lt;string, number&gt;; id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; ... 22 more ...; test_status: string; }' is missing the following properties from type 'AIBehavior': communication_style, response_length, emotional_tone</problem>
<problem file="src/lib/ai-provider-utils.ts" line="298" column="36" code="2339">Property 'personality_traits' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'personality_traits' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="130" column="48" code="2345">Argument of type '&quot;check_ai_rate_limit&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="150" column="42" code="2345">Argument of type '&quot;increment_ai_rate_limit&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="386" column="13" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;ai_usage_logs&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;ai_usage_logs&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="540" column="64" code="2589">Type instantiation is excessively deep and possibly infinite.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="541" column="13" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;user_assessment_progress&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;user_assessment_progress&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="550" column="69" code="2339">Property 'best_score' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'best_score' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="555" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;user_assessment_progress&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;user_assessment_progress&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="571" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;user_assessment_progress&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;user_assessment_progress&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="573" column="11" code="2353">Object literal may only specify known properties, and 'best_score' does not exist in type '{ id?: string; user_id?: string; email?: string; nickname?: string; avatar_url?: string; subscription_tier?: string; remaining_minutes?: number; current_level?: number; crystal_balance?: number; daily_streak?: number; last_streak_date?: string; role?: string; created_at?: string; updated_at?: string; } | ... 8 more ...'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="573" column="64" code="2339">Property 'best_score' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'best_score' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="574" column="73" code="2339">Property 'best_attempt_id' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'best_attempt_id' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="575" column="43" code="2339">Property 'total_attempts' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'total_attempts' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="577" column="56" code="2339">Property 'is_completed' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'is_completed' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="578" column="60" code="2339">Property 'is_completed' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'is_completed' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/lib/ai-assessment-utils.ts" line="578" column="118" code="2339">Property 'completion_date' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }'.
  Property 'completion_date' does not exist on type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }'.</problem>
<problem file="src/pages/AIAssessments.tsx" line="82" column="32" code="2589">Type instantiation is excessively deep and possibly infinite.</problem>
<problem file="src/pages/AIAssessments.tsx" line="83" column="17" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ProvidersManagement.tsx" line="70" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;providers&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;providers&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ProvidersManagement.tsx" line="71" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;models&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;models&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ProvidersManagement.tsx" line="72" column="23" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;voices&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;voices&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ProvidersManagement.tsx" line="79" column="20" code="2345">Argument of type '({ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; })[]' is not assignable to parameter of type 'SetStateAction&lt;Provider[]&gt;'.
  Type '({ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; })[]' is not assignable to type 'Provider[]'.
    Type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; } | ... 8 more ... | { ...; }' is not assignable to type 'Provider'.
      Type '{ id: string; name: string; description: string; provider: string; provider_name: string; model_name: string; api_base_url: string; api_key_encrypted: string; api_version: string; temperature: number; ... 20 more ...; test_status: string; }' is missing the following properties from type 'Provider': type, api_base, region, status, last_synced_at</problem>
<problem file="src/pages/admin/ProvidersManagement.tsx" line="80" column="17" code="2345">Argument of type '({ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; providers: SelectQueryError&lt;...&gt;; } | ... 98 more ... | { ...; })[]' is not assignable to parameter of type 'SetStateAction&lt;Model[]&gt;'.
  Type '({ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; providers: SelectQueryError&lt;...&gt;; } | ... 98 more ... | { ...; })[]' is not assignable to type 'Model[]'.
    Type '{ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; providers: SelectQueryError&lt;...&gt;; } | ... 98 more ... | { ...; }' is not assignable to type 'Model'.
      Type '{ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; providers: SelectQueryError&lt;...&gt;; }' is missing the following properties from type 'Model': provider_id, model_id, display_name, modality, and 4 more.</problem>
<problem file="src/pages/admin/ProvidersManagement.tsx" line="81" column="17" code="2345">Argument of type '({ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; providers: SelectQueryError&lt;...&gt;; } | ... 98 more ... | { ...; })[]' is not assignable to parameter of type 'SetStateAction&lt;Voice[]&gt;'.
  Type '({ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; providers: SelectQueryError&lt;...&gt;; } | ... 98 more ... | { ...; })[]' is not assignable to type 'Voice[]'.
    Type '{ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; providers: SelectQueryError&lt;...&gt;; } | ... 98 more ... | { ...; }' is not assignable to type 'Voice'.
      Type '{ id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; remaining_minutes: number; current_level: number; crystal_balance: number; daily_streak: number; ... 4 more ...; providers: SelectQueryError&lt;...&gt;; }' is missing the following properties from type 'Voice': provider_id, voice_id, name, locale, and 3 more.</problem>
<problem file="src/pages/Assessment.tsx" line="27" column="15" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/services/AIAssessmentService.ts" line="19" column="50" code="2345">Argument of type '&quot;get_ai_config_for_service&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/services/AIAssessmentService.ts" line="67" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/services/AIAssessmentService.ts" line="72" column="17" code="2589">Type instantiation is excessively deep and possibly infinite.</problem>
<problem file="src/services/AIAssessmentService.ts" line="75" column="17" code="2589">Type instantiation is excessively deep and possibly infinite.</problem>
<problem file="src/pages/MemberAssessments.tsx" line="14" column="21" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/pages/PublicAssessments.tsx" line="4" column="15" code="2305">Module '&quot;@/integrations/supabase/types&quot;' has no exported member 'Tables'.</problem>
<problem file="src/pages/PublicAssessments.tsx" line="101" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;assessments&quot;' is not assignable to parameter of type 'never'.</problem>
<problem file="src/pages/admin/ProviderManagement.tsx" line="47" column="15" code="2769">No overload matches this call.
  Overload 1 of 2, '(relation: &quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;): PostgrestQueryBuilder&lt;...&gt;', gave the following error.
    Argument of type '&quot;providers&quot;' is not assignable to parameter of type '&quot;user_profiles&quot; | &quot;level_thresholds&quot; | &quot;assessments_enhanced&quot; | &quot;assessment_attempts&quot; | &quot;ai_configurations&quot; | &quot;newme_conversations&quot; | &quot;newme_messages&quot; | &quot;newme_user_memories&quot; | &quot;newme_emotional_snapshots&quot; | &quot;newme_assessment_tracking&quot;'.
  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder&lt;{ PostgrestVersion: &quot;13.0.4&quot;; }, { Tables: { user_profiles: { Row: { id: string; user_id: string; email: string; nickname: string; avatar_url: string; subscription_tier: string; ... 7 more ...; updated_at: string; }; Insert: { ...; }; Update: { ...; }; Relationships: []; }; ... 8 more ...; newme_assessment_tracking: { ...; }; }; Views: {}; Functions: {}; Enums: {}; CompositeTypes: {}; }, never, never, never&gt;', gave the following error.
    Argument of type '&quot;providers&quot;' is not assignable to parameter of type 'never'.</problem>
</dyad-problem-report>```typescript
// src/services/NewMeMemoryService.ts
import { supabase } from "@/integrations/supabase/client";
import type {
  NewMeConversation,
  NewMeMessage,
  NewMeUserMemory,
  NewMeEmotionalSnapshot,
  NewMeAssessmentTracking,
  NewMeUserContext,
  CreateMemoryInput,
  CreateConversationInput,
  UpdateConversationInput,
  CreateMessageInput,
  CreateEmotionalSnapshotInput,
  UpdateAssessmentTrackingInput,
} from '@/types/newme-memory-types';
import { Database } from "@/integrations/supabase/types";

export class NewMeMemoryService {
  /**
   * Get user context for personalizing conversations
   */
  async getUserContext(userId: string): Promise<NewMeUserContext | null> {
    try {
      const { data, error } = await supabase.rpc<NewMeUserContext>('get_newme_user_context', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user context:', error);
      return null;
    }
  }

  /**
   * Create a new conversation session
   */
  async createConversation(input: CreateConversationInput): Promise<NewMeConversation | null> {
    try {
      const { data, error } = await supabase
        .from('newme_conversations')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as NewMeConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  /**
   * Update an existing conversation
   */
  async updateConversation(
    conversationId: string,
    updates: UpdateConversationInput
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('newme_conversations')
        .update(updates)
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating conversation:', error);
      return false;
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(
    userId: string,
    limit: number = 10
  ): Promise<NewMeConversation[]> {
    try {
      const { data, error } = await supabase
        .from('newme_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as NewMeConversation[];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  /**
   * Get the most recent active conversation
   */
  async getActiveConversation(userId: string): Promise<NewMeConversation | null> {
    try {
      const { data, error } = await supabase
        .from('newme_conversations')
        .select('*')
        .eq('user_id', userId)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }
      return data as NewMeConversation;
    } catch (error) {
      console.error('Error fetching active conversation:', error);
      return null;
    }
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(input: CreateMessageInput): Promise<NewMeMessage | null> {
    try {
      const { data, error } = await supabase
        .from('newme_messages')
        .insert(input)
        .select()
        .single();

      if (error) throw error;

      // Update message count in conversation
      await supabase.rpc('increment_message_count', { conv_id: input.conversation_id });

      return data as NewMeMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit?: number): Promise<NewMeMessage[]> {
    try {
      let query = supabase
        .from('newme_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as NewMeMessage[];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Create or update a user memory
   */
  async saveMemory(input: CreateMemoryInput): Promise<NewMeUserMemory | null> {
    try {
      // Check if memory already exists
      const { data: existing } = await supabase
        .from('newme_user_memories')
        .select('*')
        .eq('user_id', input.user_id)
        .eq('memory_type', input.memory_type)
        .eq('memory_key', input.memory_key)
        .eq('is_active', true)
        .single();

      if (existing) {
        // Update existing memory
        const { data, error } = await supabase
          .from('newme_user_memories')
          .update({
            memory_value: input.memory_value,
            context: input.context,
            importance_score: input.importance_score ?? existing.importance_score,
            last_referenced_at: new Date().toISOString(),
            reference_count: existing.reference_count + 1,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data as NewMeUserMemory;
      } else {
        // Create new memory
        const { data, error } = await supabase
          .from('newme_user_memories')
          .insert({
            ...input,
            importance_score: input.importance_score ?? 5,
          })
          .select()
          .single();

        if (error) throw error;
        return data as NewMeUserMemory;
      }
    } catch (error) {
      console.error('Error saving memory:', error);
      return null;
    }
  }

  /**
   * Get all active memories for a user
   */
  async getUserMemories(userId: string, memoryType?: string): Promise<NewMeUserMemory[]> {
    try {
      let query = supabase
        .from('newme_user_memories')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('importance_score', { ascending: false });

      if (memoryType) {
        query = query.eq('memory_type', memoryType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as NewMeUserMemory[];
    } catch (error) {
      console.error('Error fetching user memories:', error);
      return [];
    }
  }

  /**
   * Deactivate a memory (soft delete)
   */
  async deactivateMemory(memoryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('newme_user_memories')
        .update({ is_active: false })
        .eq('id', memoryId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deactivating memory:', error);
      return false;
    }
  }

  /**
   * Track emotional snapshot
   */
  async createEmotionalSnapshot(
    input: CreateEmotionalSnapshotInput
  ): Promise<NewMeEmotionalSnapshot | null> {
    try {
      const { data, error } = await supabase
        .from('newme_emotional_snapshots')
        .insert({
          ...input,
          snapshot_date: new Date().toISOString() // Ensure snapshot_date is provided
        })
        .select()
        .single();

      if (error) throw error;
      return data as NewMeEmotionalSnapshot;
    } catch (error) {
      console.error('Error creating emotional snapshot:', error);
      return null;
    }
  }

  /**
   * Get emotional journey for a user
   */
  async getEmotionalJourney(
    userId: string,
    limit: number = 30
  ): Promise<NewMeEmotionalSnapshot[]> {
    try {
      const { data, error } = await supabase
        .from('newme_emotional_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as NewMeEmotionalSnapshot[];
    } catch (error) {
      console.error('Error fetching emotional journey:', error);
      return [];
    }
  }

  /**
   * Track assessment suggestion and completion
   */
  async trackAssessmentSuggestion(
    userId: string,
    assessmentName: string,
    conversationId?: string
  ): Promise<NewMeAssessmentTracking | null> {
    try {
      const { data, error } = await supabase
        .from('newme_assessment_tracking')
        .insert({
          user_id: userId,
          assessment_name: assessmentName,
          suggested_in_conversation_id: conversationId,
          suggested_at: new Date().toISOString(),
          completion_status: 'suggested',
          follow_up_discussed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as NewMeAssessmentTracking;
    } catch (error) {
      console.error('Error tracking assessment suggestion:', error);
      return null;
    }
  }

  /**
   * Update assessment tracking status
   */
  async updateAssessmentTracking(
    trackingId: string,
    updates: UpdateAssessmentTrackingInput
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('newme_assessment_tracking')
        .update(updates)
        .eq('id', trackingId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating assessment tracking:', error);
      return false;
    }
  }

  /**
   * Get assessment suggestions for a user
   */
  async getAssessmentTracking(userId: string): Promise<NewMeAssessmentTracking[]> {
    try {
      const { data, error } = await supabase
        .from('newme_assessment_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('suggested_at', { ascending: false });

      if (error) throw error;
      return data as NewMeAssessmentTracking[];
    } catch (error) {
      console.error('Error fetching assessment tracking:', error);
      return [];
    }
  }

  /**
   * Calculate days since last conversation
   */
  calculateDaysSinceLastConversation(lastConversationDate?: string): number {
    if (!lastConversationDate) return 999;

    const lastDate = new Date(lastConversationDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Extract key insights from conversation messages
   */
  extractKeyInsights(messages: NewMeMessage[]): string[] {
    const insights: string[] = [];
    const assistantMessages = messages.filter((m) => m.role === 'assistant');

    const insightKeywords = [
      'realize',
      'discover',
      'understand',
      'insight',
      'pattern',
      'breakthrough',
      'aha',
      'makes sense',
    ];

    assistantMessages.forEach((msg) => {
      const lowerContent = msg.content.toLowerCase();
      if (insightKeywords.some((keyword) => lowerContent.includes(keyword))) {
        const sentences = msg.content.split(/[.!?]+/);
        sentences.forEach((sentence) => {
          if (
            sentence.length > 20 &&
            sentence.length < 150 &&
            insightKeywords.some((kw) => sentence.toLowerCase().includes(kw))
          ) {
            insights.push(sentence.trim());
          }
        });
      }
    });

    return insights.slice(0, 5);
  }
}

export const newMeMemoryService = new NewMeMemoryService();