import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Edit, Trash2, Play, AlertTriangle } from 'lucide-react';
import ConfigurationFormDialog from '@/components/admin/ai-config/ConfigurationFormDialog';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type AIConfig = Tables<'ai_configurations'>;
type Provider = Tables<'providers'>;
type Model = Tables<'models'>;

export default function AIConfigurationManager() {
  const [configurations, setConfigurations] = useState<AIConfig[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: configsData, error: configsError },
        { data: providersData, error: providersError },
        { data: modelsData, error: modelsError },
      ] = await Promise.all([
        supabase.from('ai_configurations').select('*').order('name'),
        supabase.from('providers').select('*'),
        supabase.from('models').select('*'),
      ]);

      if (configsError) throw configsError;
      if (providersError) throw providersError;
      if (modelsError) throw modelsError;

      setConfigurations(configsData || []);
      setProviders(providersData || []);
      setModels(modelsData || []);
    } catch (error) {
      toast.error('Failed to load configuration data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleAddNew = () => {
    setEditingConfig(null);
    setDialogOpen(true);
  };

  const handleEdit = (config: AIConfig) => {
    setEditingConfig(config);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;
    try {
      const { error } = await supabase.from('ai_configurations').delete().eq('id', id);
      if (error) throw error;
      toast.success('Configuration deleted.');
      await loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleSave = async (formData: Partial<AIConfig>) => {
    setIsSaving(true);
    try {
      const payload = { ...formData };
      // Ensure numeric fields are numbers
      payload.temperature = Number(payload.temperature);
      payload.max_tokens = Number(payload.max_tokens);
      payload.top_p = Number(payload.top_p);
      payload.frequency_penalty = Number(payload.frequency_penalty);
      payload.presence_penalty = Number(payload.presence_penalty);

      if (editingConfig) {
        const { error } = await supabase
          .from('ai_configurations')
          .update(payload as TablesUpdate<'ai_configurations'>)
          .eq('id', editingConfig.id);
        if (error) throw error;
        toast.success('Configuration updated!');
      } else {
        const { error } = await supabase
          .from('ai_configurations')
          .insert(payload as TablesInsert<'ai_configurations'>);
        if (error) throw error;
        toast.success('Configuration created!');
      }
      setDialogOpen(false);
      await loadData();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (config: AIConfig) => {
    setIsTesting(config.id);
    try {
      // This would be a call to a serverless function that uses the config to make a test API call
      // For now, we'll simulate it.
      await new Promise(resolve => setTimeout(resolve, 1500));
      const isSuccess = Math.random() > 0.3; // Simulate 70% success rate

      if (isSuccess) {
        await supabase
          .from('ai_configurations')
          .update({ test_status: 'success', last_tested_at: new Date().toISOString() } as TablesUpdate<'ai_configurations'>)
          .eq('id', config.id);
        toast.success(`Test successful for ${config.name}`);
      } else {
        throw new Error("Simulated API call failed.");
      }
    } catch (error) {
      await supabase
        .from('ai_configurations')
        .update({ test_status: 'failed', last_tested_at: new Date().toISOString() } as TablesUpdate<'ai_configurations'>)
        .eq('id', config.id);
      toast.error(`Test failed for ${config.name}: ${(error as Error).message}`);
    } finally {
      setIsTesting(null);
      await loadData();
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>AI Configuration Management</CardTitle>
            <CardDescription>Manage and test AI model configurations for various features.</CardDescription>
          </div>
          <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" /> Add New</Button>
        </CardHeader>
        <CardContent>
          {/* Table of configurations */}
        </CardContent>
      </Card>
      <ConfigurationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        isSaving={isSaving}
        config={editingConfig}
        providers={providers}
        models={models}
      />
    </div>
  );
}