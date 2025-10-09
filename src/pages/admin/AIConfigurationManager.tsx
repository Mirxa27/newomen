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
import { Loader2, Edit, Trash2, TestTube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { AIConfigurations } from "@/integrations/supabase/tables/ai_configurations";
import { Providers } from "@/integrations/supabase/tables/providers";
import { Models } from "@/integrations/supabase/tables/models";
import { Json, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

// Define types based on Supabase table schemas
type AIConfig = AIConfigurations['Row'];
type Provider = Providers['Row'];
type Model = Models['Row'];

// Define a more specific type for the form state
interface AIConfigurationFormState {
  id?: string;
  name: string;
  description: string | null;
  provider_id: string | null;
  model_id: string | null;
  api_base_url: string | null;
  api_key_encrypted: string; // Keep this as string for input handling
  api_version: string | null;
  temperature: number;
  max_tokens: number;
  top_p: number | null;
  frequency_penalty: number | null;
  presence_penalty: number | null;
  system_prompt: string;
  user_prompt_template: string | null;
  is_default: boolean;
  custom_headers: Json;
  cost_per_1k_prompt_tokens: number | null;
  cost_per_1k_completion_tokens: number | null;
  is_active: boolean;
}

const initialFormData: AIConfigurationFormState = {
  name: "",
  description: null,
  provider_id: null,
  model_id: null,
  api_base_url: null,
  api_key_encrypted: "",
  api_version: null,
  temperature: 0.7,
  max_tokens: 1024,
  top_p: null,
  frequency_penalty: null,
  presence_penalty: null,
  system_prompt: "",
  user_prompt_template: null,
  is_default: false,
  custom_headers: {},
  cost_per_1k_prompt_tokens: null,
  cost_per_1k_completion_tokens: null,
  is_active: true,
};

export default function AIConfigurationManager() {
  const [configurations, setConfigurations] = useState<AIConfig[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AIConfigurationFormState>(initialFormData);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; configId: string | null }>({ open: false, configId: null });
  const [testResults, setTestResults] = useState<{ testing: boolean; configId: string | null }>({
    testing: false,
    configId: null,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configsRes, providersRes, modelsRes] = await Promise.all([
        supabase.from("ai_configurations").select("*, provider:providers(name), model:models(display_name)").order("created_at", { ascending: false }),
        supabase.from("providers").select("*").order("name"),
        supabase.from("models").select("*").order("display_name"),
      ]);

      if (configsRes.error) throw configsRes.error;
      if (providersRes.error) throw providersRes.error;
      if (modelsRes.error) throw modelsRes.error;

      setConfigurations(configsRes.data as any[] || []);
      setProviders(providersRes.data || []);
      setModels(modelsRes.data || []);
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
    const { id, value, type } = e.target;
    const isNumberInput = type === 'range' || type === 'number';
    setFormData((prev) => ({
      ...prev,
      [id]: isNumberInput ? parseFloat(value) : value,
    }));
  };

  const handleSwitchChange = (id: keyof AIConfigurationFormState, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [id]: checked }));
  };
  
  const handleSelectChange = (id: keyof AIConfigurationFormState, value: string) => {
    setFormData((prev) => {
      const newState = { ...prev, [id]: value };
      // Reset model if provider changes
      if (id === 'provider_id') {
        newState.model_id = null;
      }
      return newState;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provider_id || !formData.model_id) {
        toast.error("Please select a provider and a model.");
        return;
    }
    setIsSubmitting(true);

    const selectedProvider = providers.find(p => p.id === formData.provider_id);
    const selectedModel = models.find(m => m.id === formData.model_id);

    const payload: TablesInsert<'ai_configurations'> | TablesUpdate<'ai_configurations'> = {
        ...formData,
        provider_name: selectedProvider?.name || null,
        model_name: selectedModel?.model_id || null,
        // Ensure numeric fields are numbers
        temperature: Number(formData.temperature),
        max_tokens: Number(formData.max_tokens),
        top_p: formData.top_p ? Number(formData.top_p) : null,
        frequency_penalty: formData.frequency_penalty ? Number(formData.frequency_penalty) : null,
        presence_penalty: formData.presence_penalty ? Number(formData.presence_penalty) : null,
    };
    
    // Do not update the key if the input is empty during an edit
    if (editingConfig && !formData.api_key_encrypted) {
        delete (payload as any).api_key_encrypted;
    }

    try {
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
          .insert(payload as TablesInsert<'ai_configurations'>);
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
      description: config.description,
      provider_id: config.provider_id,
      model_id: config.model_id,
      api_base_url: config.api_base_url,
      api_key_encrypted: "", // Do not expose existing key
      api_version: config.api_version,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.max_tokens ?? 1024,
      top_p: config.top_p,
      frequency_penalty: config.frequency_penalty,
      presence_penalty: config.presence_penalty,
      system_prompt: config.system_prompt,
      user_prompt_template: config.user_prompt_template,
      is_default: config.is_default,
      custom_headers: config.custom_headers ?? {},
      cost_per_1k_prompt_tokens: config.cost_per_1k_prompt_tokens,
      cost_per_1k_completion_tokens: config.cost_per_1k_completion_tokens,
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

  const resetForm = () => {
    setEditingConfig(null);
    setFormData(initialFormData);
  };

  const testConfiguration = async (config: AIConfig) => {
    setTestResults({ testing: true, configId: config.id });
    toast.info(`Testing configuration: ${config.name}...`);
    let testStatus: 'success' | 'failed' = 'failed';
    try {
      // This API endpoint would use the config ID to securely fetch the configuration
      // on the server-side and run the test.
      const response = await fetch('/api/test-ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId: config.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Test failed with status: ' + response.status);
      }

      const result = await response.json();
      toast.success(`Test successful for ${config.name}!`);
      console.log("Test Response:", result.response);
      testStatus = 'success';

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during testing.';
      console.error("Error testing configuration:", errorMessage);
      toast.error(`Test failed for ${config.name}: ${errorMessage}`);
      testStatus = 'failed';
    } finally {
      setTestResults({ testing: false, configId: null });
      // Update Supabase with the latest test status
      const { error } = await supabase
        .from('ai_configurations')
        .update({ test_status: testStatus, last_tested: new Date().toISOString() })
        .eq('id', config.id);
      if (error) {
        toast.error("Failed to update test status.");
      } else {
        await loadData(); // Refresh data to show new status
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  const filteredModels = formData.provider_id ? models.filter(m => m.provider_id === formData.provider_id) : [];

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{editingConfig ? "Edit AI Configuration" : "Create New AI Configuration"}</CardTitle>
          <CardDescription>Define parameters for AI model interactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="name" placeholder="Configuration Name" value={formData.name} onChange={handleInputChange} required className="glass md:col-span-2" />
            <Textarea id="description" placeholder="Description" value={formData.description || ""} onChange={handleInputChange} className="glass md:col-span-2" rows={2} />
            
            <Select value={formData.provider_id || ""} onValueChange={(value) => handleSelectChange('provider_id', value)} required>
              <SelectTrigger className="glass"><SelectValue placeholder="Select Provider" /></SelectTrigger>
              <SelectContent>
                {providers.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
              </SelectContent>
            </Select>

            <Select value={formData.model_id || ""} onValueChange={(value) => handleSelectChange('model_id', value)} required disabled={!formData.provider_id}>
              <SelectTrigger className="glass"><SelectValue placeholder="Select Model" /></SelectTrigger>
              <SelectContent>
                {filteredModels.map((m) => (<SelectItem key={m.id} value={m.id}>{m.display_name}</SelectItem>))}
              </SelectContent>
            </Select>

            <Input id="api_base_url" placeholder="API Base URL (optional)" value={formData.api_base_url || ""} onChange={handleInputChange} className="glass" />
            <Input id="api_version" placeholder="API Version (optional)" value={formData.api_version || ""} onChange={handleInputChange} className="glass" />
            <Input id="api_key_encrypted" type="password" placeholder={editingConfig ? "Enter new API Key to update" : "API Key (will be encrypted)"} value={formData.api_key_encrypted} onChange={handleInputChange} className="glass md:col-span-2" />

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="temperature">Temperature: {formData.temperature}</Label>
              <Input id="temperature" type="range" min="0" max="2" step="0.1" value={formData.temperature} onChange={handleInputChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="max_tokens">Max Tokens: {formData.max_tokens}</Label>
              <Input id="max_tokens" type="range" min="100" max="8192" step="100" value={formData.max_tokens} onChange={handleInputChange} />
            </div>

            <Textarea id="system_prompt" placeholder="System Prompt" value={formData.system_prompt} onChange={handleInputChange} required className="glass md:col-span-2" rows={4} />
            <Textarea id="user_prompt_template" placeholder="User Prompt Template (optional)" value={formData.user_prompt_template || ""} onChange={handleInputChange} className="glass md:col-span-2" rows={3} />

            <div className="flex items-center space-x-2">
              <Switch id="is_default" checked={formData.is_default} onCheckedChange={(checked) => handleSwitchChange("is_default", checked)} />
              <Label htmlFor="is_default">Default Configuration</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => handleSwitchChange("is_active", checked)} />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={isSubmitting} className="clay-button">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingConfig ? "Update Configuration" : "Create Configuration"}
                </Button>
                {editingConfig && (
                  <Button variant="outline" type="button" onClick={resetForm}>Cancel Edit</Button>
                )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Existing AI Configurations</CardTitle>
          <CardDescription>Manage and test your deployed AI configurations.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configurations.length > 0 ? configurations.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell><Badge variant="outline">{config.provider?.name || 'N/A'}</Badge></TableCell>
                    <TableCell>{config.model?.display_name || 'N/A'}</TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            {config.is_active ? <Badge className="bg-green-500 w-fit">Active</Badge> : <Badge variant="destructive" className="w-fit">Inactive</Badge>}
                            {config.is_default && <Badge variant="secondary" className="mt-1 w-fit">Default</Badge>}
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.test_status === 'success' ? 'default' : config.test_status === 'failed' ? 'destructive' : 'secondary'}>
                        {config.test_status || 'Untested'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => testConfiguration(config)} disabled={testResults.testing && testResults.configId === config.id}>
                          {testResults.testing && testResults.configId === config.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(config)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDialogState({ open: true, configId: config.id })}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No AI configurations found.</TableCell>
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
        title="Are you sure you want to delete this configuration?"
        description="This action cannot be undone. The configuration will be permanently removed from the system."
      />
    </div>
  );
}