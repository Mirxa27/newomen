import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Edit, Trash2, Plus } from 'lucide-react';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Agent = Tables<'agents'>;
type Prompt = Tables<'prompts'>;
type Model = Tables<'models'>;
type Voice = Tables<'voices'>;

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '',
    status: 'active',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: agentsData, error: agentsError },
        { data: promptsData, error: promptsError },
        { data: modelsData, error: modelsError },
        { data: voicesData, error: voicesError },
      ] = await Promise.all([
        supabase.from('agents').select('*'),
        supabase.from('prompts').select('*'),
        supabase.from('models').select('*'),
        supabase.from('voices').select('*'),
      ]);

      if (agentsError) throw agentsError;
      if (promptsError) throw promptsError;
      if (modelsError) throw modelsError;
      if (voicesError) throw voicesError;

      setAgents(agentsData || []);
      setPrompts(promptsData || []);
      setModels(modelsData || []);
      setVoices(voicesData || []);
    } catch (error) {
      toast.error('Failed to load agent data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Agent, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = { ...formData };

    try {
      if (editingAgent) {
        const { error } = await supabase
          .from("agents")
          .update(payload as TablesUpdate<'agents'>)
          .eq("id", editingAgent.id);
        if (error) throw error;
        toast.success("Agent updated!");
      } else {
        const { error } = await supabase.from("agents").insert(payload as TablesInsert<'agents'>);
        if (error) throw error;
        toast.success("Agent created!");
      }
      resetForm();
      await loadData();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData(agent);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('agents').delete().eq('id', id);
      if (error) throw error;
      toast.success('Agent deleted.');
      await loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const resetForm = () => {
    setEditingAgent(null);
    setFormData({
      name: '',
      status: 'active',
    });
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingAgent ? 'Edit' : 'Create'} Agent</CardTitle>
          <CardDescription>Configure an AI agent for user interactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields here */}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAgent ? 'Update Agent' : 'Create Agent'}
            </Button>
            {editingAgent && <Button variant="ghost" onClick={resetForm}>Cancel</Button>}
          </form>
        </CardContent>
      </Card>
      {/* Table of agents */}
    </div>
  );
}