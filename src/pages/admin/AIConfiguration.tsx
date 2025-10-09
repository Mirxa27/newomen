import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Edit, Trash2, Plus } from 'lucide-react';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type AIConfig = Tables<'ai_configurations'>;
type Provider = Tables<'providers'>;
type Model = Tables<'models'>;

export type CreateAIConfigurationData = Omit<AIConfig, 'id' | 'created_at' | 'updated_at'>;

export default function AIConfiguration() {
  const [configurations, setConfigurations] = useState<AIConfig[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);

  const [formData, setFormData] = useState<Partial<AIConfig>>({
    name: '',
    description: '',
    provider: 'openai',
    model_name: '',
    temperature: 0.7,
    max_tokens: 1024,
    is_active: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: configsData, error: configsError },
        { data: providersData, error: providersError },
        { data: modelsData, error: modelsError },
      ] = await Promise.all([
        supabase.from('ai_configurations').select('*'),
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
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof AIConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingConfig) {
        const { error } = await supabase
          .from('ai_configurations')
          .update(formData as TablesUpdate<'ai_configurations'>)
          .eq('id', editingConfig.id);
        if (error) throw error;
        toast.success('Configuration updated!');
      } else {
        const { error } = await supabase
          .from('ai_configurations')
          .insert(formData as TablesInsert<'ai_configurations'>);
        if (error) throw error;
        toast.success('Configuration created!');
      }
      resetForm();
      await loadData();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (config: AIConfig) => {
    setEditingConfig(config);
    setFormData(config);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('ai_configurations').delete().eq('id', id);
      if (error) throw error;
      toast.success('Configuration deleted.');
      await loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const resetForm = () => {
    setEditingConfig(null);
    setFormData({
      name: '',
      description: '',
      provider: 'openai',
      model_name: '',
      temperature: 0.7,
      max_tokens: 1024,
      is_active: true,
    });
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingConfig ? 'Edit' : 'Create'} AI Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields go here, similar to AIConfigurationManager */}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingConfig ? 'Update' : 'Create'}
            </Button>
            {editingConfig && <Button variant="ghost" onClick={resetForm}>Cancel</Button>}
          </form>
        </CardContent>
      </Card>
      {/* Table of configurations */}
    </div>
  );
}