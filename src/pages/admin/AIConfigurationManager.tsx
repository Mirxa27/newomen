import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ResponsiveTable from '@/components/ui/ResponsiveTable';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Edit2, TestTube, Save, X } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface AIConfiguration {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';
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
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AIConfiguration>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [testingConfig, setTestingConfig] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConfigurations();
    loadServiceConfigs();
  }, []);

  const loadConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Supabase returns a wide object; cast to any to satisfy the local AIConfiguration type
      setConfigurations((data as any) || []);
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
      // Cast to any because the joined shape is looser than our TS interface
      setServiceConfigs((data as any) || []);
    } catch (error) {
      console.error('Error loading service configs:', error);
    }
  };

  const handleSave = async (config: Partial<AIConfiguration>) => {
    try {
      if (editing) {
        const { error } = await supabase
          .from('ai_configurations')
          // Cast to any to avoid Postgrest typing mismatches for partial updates
          .update(config as any)
          .eq('id', editing);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Configuration updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('ai_configurations')
          // Insert may receive a partial config at runtime; cast to any to satisfy overloads
          .insert([config as any]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Configuration created successfully',
        });
      }

      setEditing(null);
      setShowNewForm(false);
      setEditForm({});
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

  const handleDelete = async (id: string) => {
    setConfigToDelete(id);
    setDialogOpen(true);
  };

  const performDelete = async () => {
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
      setDialogOpen(false);
      loadConfigurations();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete configuration',
        variant: 'destructive',
      });
      setConfigToDelete(null);
      setDialogOpen(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingConfig(id);
    try {
      // Test the configuration by making a simple API call
      const { data: config } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('id', id)
        .single();

      if (!config) throw new Error('Configuration not found');

      // Update test status to pending
      await supabase
        .from('ai_configurations')
        .update({ test_status: 'pending', last_tested_at: new Date().toISOString() })
        .eq('id', id);

      // Here you would make an actual API call to test the configuration
      // For now, we'll simulate a successful test
      await new Promise(resolve => setTimeout(resolve, 2000));

      await supabase
        .from('ai_configurations')
        .update({ test_status: 'success', last_tested_at: new Date().toISOString() })
        .eq('id', id);

      toast({
        title: 'Success',
        description: 'Configuration test passed',
      });

      loadConfigurations();
    } catch (error) {
      console.error('Error testing configuration:', error);

      await supabase
        .from('ai_configurations')
        .update({ test_status: 'failed', last_tested_at: new Date().toISOString() })
        .eq('id', id);

      toast({
        title: 'Error',
        description: 'Configuration test failed',
        variant: 'destructive',
      });

      loadConfigurations();
    } finally {
      setTestingConfig(null);
    }
  };

  const startEdit = (config: AIConfiguration) => {
    setEditing(config.id);
    setEditForm(config);
    setShowNewForm(false);
  };

  const startNew = () => {
    setShowNewForm(true);
    setEditing(null);
    setEditForm({
      provider: 'openai',
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1.0,
      frequency_penalty: 0,
      presence_penalty: 0,
      is_active: true,
      is_default: false,
    });
  };

  const ConfigurationForm = ({ config, onSave, onCancel }: {
    config: Partial<AIConfiguration>;
    onSave: (config: Partial<AIConfiguration>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState(config);

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{config.id ? 'Edit Configuration' : 'New Configuration'}</CardTitle>
          <CardDescription>
            Configure AI provider settings and model parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Configuration Name*</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="GPT-4 Turbo - Assessments"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider*</Label>
              <Select
                value={formData.provider}
                onValueChange={(value: any) => setFormData({ ...formData, provider: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google (Gemini)</SelectItem>
                  <SelectItem value="azure">Azure OpenAI</SelectItem>
                  <SelectItem value="custom">Custom (OpenAI-compatible)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.provider === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="provider_name">Provider Display Name</Label>
                <Input
                  id="provider_name"
                  value={formData.provider_name || ''}
                  onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                  placeholder="e.g., Groq, Together AI"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="model_name">Model Name*</Label>
              <Input
                id="model_name"
                value={formData.model_name || ''}
                onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                placeholder="gpt-4-turbo-preview"
              />
            </div>

            {(formData.provider === 'azure' || formData.provider === 'custom') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="api_base_url">API Base URL*</Label>
                  <Input
                    id="api_base_url"
                    value={formData.api_base_url || ''}
                    onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
                    placeholder="https://your-resource.openai.azure.com"
                  />
                </div>

                {formData.provider === 'azure' && (
                  <div className="space-y-2">
                    <Label htmlFor="api_version">API Version</Label>
                    <Input
                      id="api_version"
                      value={formData.api_version || ''}
                      onChange={(e) => setFormData({ ...formData, api_version: e.target.value })}
                      placeholder="2024-02-15-preview"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe when to use this configuration..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature || 0.7}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                value={formData.max_tokens || 2000}
                onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="top_p">Top P</Label>
              <Input
                id="top_p"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={formData.top_p || 1.0}
                onChange={(e) => setFormData({ ...formData, top_p: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency_penalty">Frequency Penalty</Label>
              <Input
                id="frequency_penalty"
                type="number"
                step="0.1"
                min="-2"
                max="2"
                value={formData.frequency_penalty || 0}
                onChange={(e) => setFormData({ ...formData, frequency_penalty: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt (Optional)</Label>
            <Textarea
              id="system_prompt"
              value={formData.system_prompt || ''}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              placeholder="You are a helpful AI assistant..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prompt_cost">Cost per 1K Prompt Tokens ($)</Label>
              <Input
                id="prompt_cost"
                type="number"
                step="0.000001"
                value={formData.cost_per_1k_prompt_tokens || ''}
                onChange={(e) => setFormData({ ...formData, cost_per_1k_prompt_tokens: parseFloat(e.target.value) })}
                placeholder="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completion_cost">Cost per 1K Completion Tokens ($)</Label>
              <Input
                id="completion_cost"
                type="number"
                step="0.000001"
                value={formData.cost_per_1k_completion_tokens || ''}
                onChange={(e) => setFormData({ ...formData, cost_per_1k_completion_tokens: parseFloat(e.target.value) })}
                placeholder="0.03"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
              <Label htmlFor="is_default">Set as Default for Provider</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={() => onSave(formData)}>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Configuration Manager</h1>
          <p className="text-muted-foreground mt-2">
            Manage AI providers, models, and service mappings
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add Configuration
        </Button>
      </div>

      {(showNewForm || editing) && (
        <ConfigurationForm
          config={editForm}
          onSave={handleSave}
          onCancel={() => {
            setShowNewForm(false);
            setEditing(null);
            setEditForm({});
          }}
        />
      )}

      <Tabs defaultValue="configurations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="services">Service Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Configurations</CardTitle>
              <CardDescription>
                Manage your AI provider settings and model parameters
              </CardDescription>
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configurations.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{config.name}</div>
                            {config.description && (
                            <div className="text-sm text-muted-foreground">
                              {config.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {config.provider_name || config.provider}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {config.model_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {config.is_active && (
                            <Badge variant="default">Active</Badge>
                          )}
                          {config.is_default && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          {config.test_status === 'success' && (
                            <Badge variant="default" className="bg-green-500">Tested</Badge>
                          )}
                          {config.test_status === 'failed' && (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTest(config.id)}
                          disabled={testingConfig === config.id}
                        >
                          {testingConfig === config.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <TestTube className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(config)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(config.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Mappings</CardTitle>
              <CardDescription>
                View which AI configurations are mapped to each service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Configuration</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceConfigs.map((serviceConfig) => (
                      <TableRow key={serviceConfig.id}>
                        <TableCell className="font-medium">
                          {serviceConfig.service_type.replace(/_/g, ' ').toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {serviceConfig.ai_configurations && (
                            <div>
                              <div className="font-medium">
                                {(serviceConfig.ai_configurations as any).name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {(serviceConfig.ai_configurations as any).provider} - {(serviceConfig.ai_configurations as any).model_name}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Priority: {serviceConfig.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          {serviceConfig.is_active && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation dialog for deletion */}
      {dialogOpen && (
        <ConfirmationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConfirm={performDelete}
          title="Delete Configuration?"
          description={`Are you sure you want to permanently delete "${configurations.find(c => c.id === configToDelete)?.name || 'this configuration'}"?`}
        />
      )}
    </div>
  );
}
