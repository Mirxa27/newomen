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
import { Json } from "@/integrations/supabase/types";

type AIConfiguration = AIConfigurations;
type Provider = Providers;
type Model = Models;

interface CreateAIConfigurationData {
  id?: string;
  name: string;
  description?: string;
  provider: string;
  provider_name?: string;
  model_name: string;
  api_base_url?: string;
  api_key_encrypted?: string;
  api_version?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  system_prompt?: string;
  is_default?: boolean;
  custom_headers?: Json;
  cost_per_1k_prompt_tokens?: number;
  cost_per_1k_completion_tokens?: number;
  test_status?: string;
  last_tested?: string;
  is_active?: boolean;
}

export default function AIConfigurationManager() {
  const [configurations, setConfigurations] = useState<AIConfiguration[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateAIConfigurationData>({
    name: "",
    provider: "",
    model_name: "",
    temperature: 0.7,
    max_tokens: 1024,
    is_default: false,
    is_active: true,
  });
  const [editingConfig, setEditingConfig] = useState<AIConfiguration | null>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; configId: string | null }>({ open: false, configId: null });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: configsData, error: configsError },
        { data: providersData, error: providersError },
        { data: modelsData, error: modelsError },
      ] = await Promise.all([
        supabase.from("ai_configurations").select("*").order("created_at", { ascending: false }),
        supabase.from("providers").select("*"),
        supabase.from("models").select("*"),
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

  const handleFormChange = (field: keyof CreateAIConfigurationData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingConfig) {
        const { error } = await supabase
          .from('ai_configurations')
          .update(formData as AIConfigurations['Update'])
          .eq('id', editingConfig.id);
        if (error) throw error;
        toast.success("AI Configuration updated successfully!");
      } else {
        const { error } = await supabase
          .from('ai_configurations')
          .insert(formData as AIConfigurations['Insert']);
        if (error) throw error;
        toast.success("AI Configuration created successfully!");
      }
      setFormData({
        name: "",
        provider: "",
        model_name: "",
        temperature: 0.7,
        max_tokens: 1024,
        is_default: false,
        is_active: true,
      });
      setEditingConfig(null);
      await loadData();
    } catch (error) {
      console.error("Error saving AI configuration:", error);
      toast.error("Failed to save AI configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (config: AIConfiguration) => {
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
      is_active: config.is_active,
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

  const handleTestConfig = async (config: AIConfiguration) => {
    toast.info(`Testing configuration ${config.name}...`);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = Math.random() > 0.2; // 80% success rate
    const status = success ? 'success' : 'failed';
    const message = success ? 'Test successful!' : 'Test failed. Check API key/URL.';

    try {
      const { error } = await supabase
        .from('ai_configurations')
        .update({ test_status: status, last_tested: new Date().toISOString() })
        .eq('id', config.id);
      if (error) throw error;
      toast[success ? 'success' : 'error'](message);
      await loadData();
    } catch (error) {
      console.error('Error updating test status:', error);
      toast.error('Failed to update test status.');
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
              placeholder="Configuration Name"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              required
              className="glass"
            />
            <Textarea
              placeholder="Description"
              value={formData.description || ""}
              onChange={(e) => handleFormChange("description", e.target.value)}
              className="glass"
              rows={3}
            />
            <Select
              value={formData.provider}
              onValueChange={(value) => handleFormChange("provider", value)}
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
              onValueChange={(value) => handleFormChange("model_name", value)}
              required
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                {models.filter(m => providers.find(p => p.id === m.provider_id)?.name === formData.provider).map((model) => (
                  <SelectItem key={model.id} value={model.model_id}>
                    {model.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              step="0.1"
              placeholder="Temperature"
              value={formData.temperature}
              onChange={(e) => handleFormChange("temperature", parseFloat(e.target.value))}
              className="glass"
            />
            <Input
              type="number"
              placeholder="Max Tokens"
              value={formData.max_tokens}
              onChange={(e) => handleFormChange("max_tokens", parseInt(e.target.value))}
              className="glass"
            />
            <Textarea
              placeholder="System Prompt"
              value={formData.system_prompt || ""}
              onChange={(e) => handleFormChange("system_prompt", e.target.value)}
              className="glass"
              rows={5}
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="is-default"
                checked={formData.is_default}
                onCheckedChange={(checked) => handleFormChange("is_default", checked)}
              />
              <Label htmlFor="is-default">Is Default</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleFormChange("is_active", checked)}
              />
              <Label htmlFor="is-active">Is Active</Label>
            </div>
            <Button type="submit" disabled={isSubmitting} className="clay-button">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingConfig ? "Update Configuration" : "Create Configuration"}
            </Button>
            {editingConfig && (
              <Button variant="outline" onClick={() => { setEditingConfig(null); setFormData({ name: "", provider: "", model_name: "", temperature: 0.7, max_tokens: 1024, is_default: false, is_active: true }); }} className="ml-2">
                Cancel Edit
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Existing AI Configurations</CardTitle>
          <CardDescription>Manage your AI model configurations.</CardDescription>
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
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell>{config.provider}</TableCell>
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
                        <Button variant="ghost" size="sm" onClick={() => handleTestConfig(config)}>
                          <TestTube className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(config)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDialogState({ open: true, configId: config.id })}>
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