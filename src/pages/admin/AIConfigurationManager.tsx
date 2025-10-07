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

const AIConfigurationManager = () => {
  const [configurations, setConfigurations] = useState<AIConfiguration[]>([]);
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
  }, []);

  const loadConfigurations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigurations((data as any[]) || []);
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

  const handleSave = async () => {
    try {
      if (editingConfig) {
        const { error } = await supabase
          .from('ai_configurations')
          .update(formData)
          .eq('id', editingConfig.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Configuration updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('ai_configurations')
          .insert([formData as AIConfiguration]);

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
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Configuration Name</Label>
            <Input
              id="name"
              value={formData.name || ""}
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
              value={formData.model_name || ""}
              onChange={handleFormChange}
              placeholder="e.g., gpt-4, claude-3-sonnet-20240229"
              className="glass"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api_base_url">API Base URL (Optional)</Label>
            <Input
              id="api_base_url"
              value={formData.api_base_url || ""}
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
            value={formData.system_prompt || ""}
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
              <Button onClick={handleSave} className="clay-button">
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
  );
};

export default AIConfigurationManager;