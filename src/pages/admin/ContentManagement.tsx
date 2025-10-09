import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type Affirmation = Tables<'affirmations'>;

export default function ContentManagement() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAffirmation, setNewAffirmation] = useState({
    content: '',
    category: 'growth' as const,
    tone: 'empowering',
  });

  const loadAffirmations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('affirmations').select('*');
      if (error) throw error;
      setAffirmations(data || []);
    } catch (e) {
      toast.error('Failed to load affirmations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAffirmations();
  }, [loadAffirmations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewAffirmation(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof typeof newAffirmation, value: string) => {
    setNewAffirmation(prev => ({ ...prev, [id]: value as any }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAffirmation.content.trim()) {
      toast.error("Affirmation content cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from("affirmations").insert({
        content: newAffirmation.content.trim(),
        category: newAffirmation.category,
        tone: newAffirmation.tone,
      } as TablesInsert<'affirmations'>);
      if (error) throw error;
      toast.success("Affirmation added!");
      setNewAffirmation({ content: '', category: 'growth', tone: 'empowering' });
      await loadAffirmations();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from('affirmations').delete().eq('id', id);
      if (error) throw error;
      toast.success('Affirmation deleted.');
      await loadAffirmations();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Affirmations</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields */}
          </form>
        </CardContent>
      </Card>
      {/* Table of affirmations */}
    </div>
  );
}