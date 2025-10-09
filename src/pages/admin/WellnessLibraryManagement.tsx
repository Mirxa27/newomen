import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type WellnessResource = Tables<'wellness_resources'>;

export default function WellnessLibraryManagement() {
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingResource, setEditingResource] = useState<WellnessResource | null>(null);

  const [formData, setFormData] = useState<Partial<WellnessResource>>({
    title: '',
    description: '',
    category: 'meditation',
    is_active: true,
  });

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('wellness_resources').select('*');
      if (error) throw error;
      setResources(data || []);
    } catch (e) {
      toast.error('Failed to load wellness resources.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const resourceData = { ...formData };
      if (editingResource) {
        const { error } = await supabase
          .from("wellness_resources")
          .update(resourceData as TablesUpdate<'wellness_resources'>)
          .eq("id", editingResource.id);
        if (error) throw error;
        toast.success("Resource updated!");
      } else {
        const { error } = await supabase
          .from("wellness_resources")
          .insert(resourceData as TablesInsert<'wellness_resources'>);
        if (error) throw error;
        toast.success("Resource created!");
      }
      resetForm();
      await loadResources();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (resource: WellnessResource) => {
    setEditingResource(resource);
    setFormData(resource);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('wellness_resources').delete().eq('id', id);
      if (error) throw error;
      toast.success('Resource deleted.');
      await loadResources();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const resetForm = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      description: '',
      category: 'meditation',
      is_active: true,
    });
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingResource ? 'Edit' : 'Create'} Wellness Resource</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields */}
          </form>
        </CardContent>
      </Card>
      {/* Table of resources */}
    </div>
  );
}