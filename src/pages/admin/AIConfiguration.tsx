import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { toast } from "sonner";
import { Settings, Plus, Edit, Trash2, TestTube, Activity, DollarSign, Zap, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";

export interface AIConfiguration {
  id: string;
  name: string;
  description?: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' | 'elevenlabs' | 'cartesia' | 'deepgram' | 'hume' | 'zai';
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
  user_prompt_template?: string;
  is_active: boolean;
  is_default?: boolean;
  cost_per_1k_prompt_tokens?: number;
  cost_per_1k_completion_tokens?: number;
  test_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAIConfigurationData {
  name: string;
  description?: string;
  provider: AIConfiguration['provider'];
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
  user_prompt_template?: string;
  is_active: boolean;
}


export default function AIConfigurationPage() {
  const [configurations, setConfigurations] = useState<AIConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfiguration | null>(null);
  const [testResults, setTestResults] = useState<{
    testing: boolean;
    configId: string;
    success?: boolean;
    response?: string;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    time?: number;
    error?: string;
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAIConfigurationData>({
    name: "",
    description: "",
    provider: "openai" as AIConfiguration["provider"],
    model_name: "",
    api_base_url: "",
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    system_prompt: "",
    user_prompt_template: "",
    is_active: true
  });

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_configurations")
        .select("*")
        .order("name");
      if (error) throw error;
      setConfigurations((data || []) as AIConfiguration[]);
    } catch (error) {
      console.error("Error loading configurations:", error);
      toast.error("Failed to load AI configurations");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
      user_prompt_template: "",
      is_active: true
    });
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase.from("ai_configurations").insert(formData);
      if (error) throw error;
      toast.success("AI configuration created successfully!");
      setShowCreateDialog(false);
      resetForm();
      loadConfigurations();
    } catch (error) {
      console.error("Error creating configuration:", error);
      toast.error("Failed to create AI configuration");
    }
  };

  const handleUpdate = async () => {
    if (!editingConfig) return;
    try {
      const { error } = await supabase.from("ai_configurations").update(formData).eq("id", editingConfig.id);
      if (error) throw error;
      toast.success("AI configuration updated successfully!");
      setEditingConfig(null);
      resetForm();
      loadConfigurations();
    } catch (error) {
      console.error("Error updating configuration:", error);
      toast.error("Failed to update AI configuration");
    }
  };

  const handleDelete = async () => {
    if (!configToDelete) return;
    try {
      const { error } = await supabase.from("ai_configurations").delete().eq("id", configToDelete);
      if (error) throw error;
      toast.success("AI configuration deleted successfully!");
      loadConfigurations();
    } catch (error) {
      console.error("Error deleting configuration:", error);
      toast.error("Failed to delete AI configuration");
    } finally {
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  const handleEdit = (config: AIConfiguration) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      description: config.description || "",
      provider: config.provider,
      provider_name: config.provider_name,
      model_name: config.model_name,
      api_base_url: config.api_base_url || "",
      api_version: config.api_version,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      top_p: config.top_p,
      frequency_penalty: config.frequency_penalty,
      presence_penalty: config.presence_penalty,
      system_prompt: config.system_prompt || "",
      user_prompt_template: config.user_prompt_template || "",
      is_active: config.is_active
    });
  };

  const testConfiguration = async (config: AIConfiguration) => {
    try {
      setTestResults({ testing: true, configId: config.id });
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
      toast.success("AI configuration test successful!");
    } catch (error) {
      console.error("Error testing configuration:", error);
      setTestResults({
        testing: false,
        configId: config.id,
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
      toast.error("AI configuration test failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">AI Configuration Management</h1>
          <p className="text-muted-foreground">
            Configure AI models and prompts for assessments, quizzes, and challenges
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Configuration Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                      <SelectItem value="custom">Custom Provider</SelectItem>
                      <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                      <SelectItem value="cartesia">Cartesia</SelectItem>
                      <SelectItem value="deepgram">Deepgram</SelectItem>
                      <SelectItem value="hume">Hume AI</SelectItem>
                      <SelectItem value="zai">Z.ai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model_name">Model Name</Label>
                  <Input
                    id="model_name"
                    value={formData.model_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, model_name: e.target.value }))}
                    placeholder="e.g., gpt-4, claude-3-sonnet-20240229"
                    className="glass"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_base_url">API Base URL (Optional)</Label>
                  <Input
                    id="api_base_url"
                    value={formData.api_base_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, api_base_url: e.target.value }))}
                    placeholder="e.g., https://api.openai.com"
                    className="glass"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose and use case of this configuration"
                  className="glass"
                />
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
                    value={formData.temperature}
                    onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
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
                    value={formData.max_tokens}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                    className="glass"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                  placeholder="Define the AI's role and behavior"
                  rows={3}
                  className="glass"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="glass">
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="clay-button">
                  Create Configuration
                </Button>
              </div>
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
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testConfiguration(config)}
                              disabled={testResults?.testing && testResults?.configId === config.id}
                              className="glass"
                            >
                              <TestTube className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(config)}
                              className="glass"
                            >
                              <Edit className="w-4 h-4" />
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

      {/* Edit Configuration Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass-card">
          <DialogHeader>
            <DialogTitle className="gradient-text">Edit AI Configuration</DialogTitle>
            <DialogDescription>
              Modify the AI model configuration settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Configuration Name</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_provider">AI Provider</Label>
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
                    <SelectItem value="custom">Custom Provider</SelectItem>
                    <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                    <SelectItem value="cartesia">Cartesia</SelectItem>
                    <SelectItem value="deepgram">Deepgram</SelectItem>
                    <SelectItem value="hume">Hume AI</SelectItem>
                    <SelectItem value="zai">Z.ai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_model_name">Model Name</Label>
                <Input
                  id="edit_model_name"
                  value={formData.model_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, model_name: e.target.value }))}
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_api_base_url">API Base URL</Label>
                <Input
                  id="edit_api_base_url"
                  value={formData.api_base_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, api_base_url: e.target.value }))}
                  className="glass"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_temperature">Temperature: {formData.temperature}</Label>
                <Input
                  id="edit_temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_max_tokens">Max Tokens: {formData.max_tokens}</Label>
                <Input
                  id="edit_max_tokens"
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={formData.max_tokens}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                  className="glass"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_system_prompt">System Prompt</Label>
              <Textarea
                id="edit_system_prompt"
                value={formData.system_prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                rows={3}
                className="glass"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingConfig(null)} className="glass">
                Cancel
              </Button>
              <Button onClick={handleUpdate} className="clay-button">
                <Save className="w-4 h-4 mr-2" />
                Update Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Results Display */}
      {testResults && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gradient-text">
              <TestTube className="w-5 h-5" />
              Test Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.testing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span>Testing AI configuration...</span>
              </div>
            ) : testResults.success ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">✓ Test Successful</Badge>
                  <span className="text-sm text-muted-foreground">
                    Response time: {testResults.time}ms
                  </span>
                </div>
                {testResults.usage && (
                  <div className="text-sm text-muted-foreground">
                    Tokens: {testResults.usage.prompt_tokens} prompt + {testResults.usage.completion_tokens} completion = {testResults.usage.total_tokens} total
                  </div>
                )}
                <div className="glass p-3 rounded-lg">
                  <p className="text-sm">{testResults.response}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500">
                <Badge variant="destructive">✗ Test Failed</Badge>
                <span className="text-sm">{testResults.error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete AI Configuration?"
        description="Are you sure you want to delete this AI configuration? This action cannot be undone."
      />
    </div>
  );
}
