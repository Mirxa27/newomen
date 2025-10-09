import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Edit, Trash2, Plus, TestTube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { AIConfigurations } from "@/integrations/supabase/tables/ai_configurations";
import { Providers } from "@/integrations/supabase/tables/providers";
import { Models } from "@/integrations/supabase/tables/models";
import { Json, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { AIConfiguration } from "@/services/ai/configService"; // Import AIConfiguration interface
import { Badge } from "@/components/ui/badge";

type AIConfig = AIConfigurations['Row'];
type Provider = Providers['Row'];
type Model = Models['Row'];

interface AIConfigurationFormState {
  id?: string;
  name: string;
  description: string;
  provider: string;
  provider_name: string;
  model_name: string;
  api_base_url: string;
  api_key_encrypted: string;
  api_version: string;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  system_prompt: string;
  is_default: boolean;
  custom_headers: Json;
  cost_per_1k_prompt_tokens?: number;
  cost_per_1k_completion_tokens?: number;
  test_status: string;
  last_tested: string;
  is_active: boolean;
}

export default function AIConfigurationManager() {
  const [configurations, setConfigurations] = useState<AIConfig[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AIConfigurationFormState>({
    name: "",
    description: "",
    provider: "",
    provider_name: "",
    model_name: "",
    api_base_url: "",
    api_key_encrypted: "",
    api_version: "",
    temperature: 0.7,
    max_tokens: 1024,
    top_p: undefined,
    frequency_penalty: undefined,
    presence_penalty: undefined,
    system_prompt: "",
    is_default: false,
    custom_headers: {},
    cost_per_1k_prompt_tokens: undefined,
    cost_per_1k_completion_tokens: undefined,
    test_status: "",
    last_tested: "",
    is_active: true,
  });
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; configId: string | null }>({ open: false, configId: null });
  const [testResults, setTestResults] = useState<{ testing: boolean; configId: string | null; success: boolean | null; message: string | null }>({
    testing: false,
    configId: null,
    success: null,
    message: null,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: configsData, error: configsError },
        { data: providersData, error: providersError },
        { data: modelsData, error: modelsError },
      ] = await Promise.all([
        supabase.from("ai_configurations").select("*").order("created_at", { ascending: false }),
        supabase.from("providers").select("*").order("created_at", { ascending: false }),
        supabase.from("models").select("*").order("created_at", { ascending: false }),
      ]);

      if (configsError) throw configsError;
      if (providersError) throw providersError;
      if (modelsError) throw modelsError;

      setConfigurations(configsData || []);
      setProviders(providersData || []);
      setModels(modelsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load AI configurations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (id: string, value: string | boolean | number) => {
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        provider: formData.provider,
        provider_name: formData.provider_name,
        model_name: formData.model_name,
        api_base_url: formData.api_base_url,
        api_key_encrypted: formData.api_key_encrypted,
        api_version: formData.api_version,
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
        top_p: formData.top_p,
        frequency_penalty: formData.frequency_penalty,
        presence_penalty: formData.presence_penalty,
        system_prompt: formData.system_prompt,
        is_default: formData.is_default,
        custom_headers: formData.custom_headers,
        cost_per_1k_prompt_tokens: formData.cost_per_1k_prompt_tokens,
        cost_per_1k_completion_tokens: formData.cost_per_1k_completion_tokens,
        test_status: formData.test_status,
        last_tested: formData.last_tested,
        is_active: formData.is_active,
      } as any;

      if (editingConfig) {
        const { error } = await supabase
          .from('ai_configurations')
          .update(payload)
          .eq('id', editingConfig.id);
        if (error) throw error;
        toast.success("AI Configuration updated successfully!");
      } else {
        const { error } = await supabase
          .from('ai_configurations')
          .insert(payload);
        if (error) throw error;
        toast.success("AI Configuration created successfully!");
      }
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error saving AI configuration:", error);
      toast.error("Failed to save AI configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (config: AIConfig) => {
    setEditingConfig(config);
    setFormData({
      id: config.id,
      name: config.name,
      description: config.description || "",
      provider: config.provider,
      provider_name: config.provider_name || "",
      model_name: config.model_name,
      api_base_url: config.api_base_url || "",
      api_key_encrypted: config.api_key_encrypted || "",
      api_version: config.api_version || "",
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 1024,
      top_p: config.top_p || undefined,
      frequency_penalty: config.frequency_penalty || undefined,
      presence_penalty: config.presence_penalty || undefined,
      system_prompt: config.system_prompt || "",
      is_default: config.is_default,
      custom_headers: config.custom_headers || {},
      cost_per_1k_prompt_tokens: config.cost_per_1k_prompt_tokens || undefined,
      cost_per_1k_completion_tokens: config.cost_per_1k_completion_tokens || undefined,
      test_status: config.test_status || "",
      last_tested: config.last_tested || "",
      is_active: config.is_active || false,
    });
  };

  const handleDelete = async () => {
    if (!dialogState.configId) return;
    try {
      const { error } = await supabase.from("ai_configurations").delete().eq("id", dialogState.configId);
      if (error) throw error;
      toast.success("AI Configuration deleted successfully!");
      await loadData();
    } catch (error) {
      console.error("Error deleting AI configuration:", error);
      toast.error("Failed to delete AI configuration.");
    } finally {
      setDialogState({ open: false, configId: null });
    }
  };

  const resetForm = () => {
    setEditingConfig(null);
    setFormData({
      name: "",
      description: "",
      provider: "",
      provider_name: "",
      model_name: "",
      api_base_url: "",
      api_key_encrypted: "",
      api_version: "",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: undefined,
      frequency_penalty: undefined,
      presence_penalty: undefined,
      system_prompt: "",
      is_default: false,
      custom_headers: {},
      cost_per_1k_prompt_tokens: undefined,
      cost_per_1k_completion_tokens: undefined,
      test_status: "",
      last_tested: "",
      is_active: true,
    });
  };

  const testConfiguration = async (config: AIConfig) => {
    setTestResults({ testing: true, configId: config.id, success: null, message: null });
    toast.info(`Testing configuration ${config.name}...`);
    try {
      // Simulate API call to test the configuration
      const testPrompt = "Hello! Please respond with a brief introduction of yourself.";
      const response = await fetch('/api/test-ai-config', { // This would be an actual API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: config.provider,
          model: config.model_name,
          prompt: testPrompt,
          temperature: config.temperature,
          max_tokens: 100
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Test failed');
      }

      const result = await response.json();
      setTestResults({ testing: false, configId: config.id, success: true, message: result.response });
      toast.success("Configuration test successful!");

      // Update Supabase with test status
      const { error } = await supabase
        .from('ai_configurations')
        .update({ test_status: 'success', last_tested: new Date().toISOString() } as TablesUpdate<'ai_configurations'>)
        .eq('id', config.id);
      if (error) throw error;
      await loadData();

    } catch (e) {
      console.error("Error testing configuration:", e);
      setTestResults({ testing: false, configId: config.id, success: false, message: e instanceof Error ? e.message : 'Unknown error' });
      toast.error(e instanceof Error ? e.message : 'Configuration test failed.');

      // Update Supabase with test status
      const { error } = await supabase
        .from('ai_configurations')
        .update({ test_status: 'failed', last_tested: new Date().toISOString() } as TablesUpdate<'ai_configurations'>)
        .eq('id', config.id);
      if (error) throw error;
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{editingConfig ? "Edit AI Configuration" : "Create New AI Configuration"}</CardTitle>
          <CardDescription>Define parameters for AI model interactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              placeholder="Configuration Name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="glass"
            />
            <Textarea
              id="description"
              placeholder="Description"
              value={formData.description}
              onChange={handleInputChange}
              className="glass"
              rows={3}
            />
            <Select
              value={formData.provider}
              onValueChange={(value) => handleSelectChange('provider', value)}
              required
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.name}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.model_name}
              onValueChange={(value) => handleSelectChange('model_name', value)}
              required
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                {models.filter(m => providers.find(p => p.name === formData.provider)?.id === m.provider_id).map((model) => (
                  <SelectItem key={model.id} value={model.model_id}>
                    {model.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="api_base_url"
              placeholder="API Base URL (optional)"
              value={formData.api_base_url}
              onChange={handleInputChange}
              className="glass"
            />
            <Input
              id="api_key_encrypted"
              type="password"
              placeholder="API Key (optional, will be encrypted)"
              value={formData.api_key_encrypted}
              onChange={handleInputChange}
              className="glass"
            />
            <Input
              id="api_version"
              placeholder="API Version (optional)"
              value={formData.api_version}
              onChange={handleInputChange}
              className="glass"
            />
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature: {formData.temperature}</Label>
              <Input
                id="temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={String(formData.temperature)}
                onChange={handleInputChange}
                className="glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_tokens">Max Tokens: {formData.max_tokens}</Label>
              <Input
                id="max_tokens"
                type="range"
                min="100"
                max="4096"
                step="100"
                value={String(formData.max_tokens)}
                onChange={handleInputChange}
                className="glass"
              />
            </div>
            <Textarea
              id="system_prompt"
              placeholder="System Prompt"
              value={formData.system_prompt}
              onChange={handleInputChange}
              required
              className="glass"
              rows={5}
            />
            <Textarea
              id="user_prompt_template"
              placeholder="User Prompt Template (optional)"
              value={formData.user_prompt_template || ""}
              onChange={handleInputChange}
              className="glass"
              rows={3}
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => handleSelectChange("is_default", checked)}
              />
              <Label htmlFor="is_default">Is Default</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleSelectChange("is_active", checked)}
              />
              <Label htmlFor="is_active">Is Active</Label>
            </div>
            <Button type="submit" disabled={isSubmitting} className="clay-button">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingConfig ? "Update Configuration" : "Create Configuration"}
            </Button>
            {editingConfig && (
              <Button variant="outline" onClick={resetForm} className="ml-2">
                Cancel Edit
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Existing AI Configurations</CardTitle>
          <CardDescription>Manage your deployed AI configurations.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Temp</TableHead>
                  <TableHead>Max Tokens</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Test Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>{config.temperature}</TableCell>
                    <TableCell>{config.max_tokens}</TableCell>
                    <TableCell>{config.is_default ? "Yes" : "No"}</TableCell>
                    <TableCell>{config.is_active ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Badge variant={config.test_status === 'success' ? 'default' : 'destructive'}>
                        {config.test_status || 'Untested'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(config)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => testConfiguration(config)}
                          disabled={testResults?.testing && testResults?.configId === config.id}
                          className="glass"
                        >
                          {testResults?.testing && testResults?.configId === config.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <TestTube className="w-4 h-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setDialogState({ open: true, configId: config.id }); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {configurations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No AI configurations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState({ ...dialogState, open })}
        onConfirm={handleDelete}
        title="Delete AI Configuration?"
        description="This action cannot be undone. The configuration will be permanently removed."
      />
    </div>
  );
}