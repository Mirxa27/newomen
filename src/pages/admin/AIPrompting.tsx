import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Prompt = Tables<'prompts'>;

export default function AIPrompting() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const [formData, setFormData] = useState<Partial<Prompt>>({
    name: '',
    content: {},
    status: 'active',
  });

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('prompts').select('*');
      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      toast.error('Failed to load prompts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPrompts();
  }, [loadPrompts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    if (id === 'content') {
      try {
        const parsedJson = JSON.parse(value);
        setFormData((prev) => ({ ...prev, content: parsedJson }));
      } catch (e) {
        // Handle invalid JSON, maybe show an error to the user
        console.warn("Invalid JSON in prompt content");
      }
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const isNew = !editingPrompt;
      const payload = { ...formData };

      if (isNew) {
        const { error } = await supabase.from("prompts").insert(payload as TablesInsert<'prompts'>);
        if (error) throw error;
        toast.success("Prompt created!");
      } else {
        const { error } = await supabase.from("prompts").update(payload as TablesUpdate<'prompts'>).eq("id", editingPrompt.id);
        if (error) throw error;
        toast.success("Prompt updated!");
      }
      resetForm();
      await loadPrompts();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData(prompt);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Prompt deleted.');
      await loadPrompts();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const resetForm = () => {
    setEditingPrompt(null);
    setFormData({ name: '', content: {}, status: 'active' });
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingPrompt ? 'Edit' : 'Create'} Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields */}
          </form>
        </CardContent>
      </Card>
      {/* Table of prompts */}
    </div>
  );
}