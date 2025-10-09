import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Assessment = Tables<'assessments_enhanced'>;
type AIConfig = Tables<'ai_configurations'>;

export default function AIAssessmentManagement() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);

  const [formData, setFormData] = useState<Partial<Assessment>>({
    title: '',
    description: '',
    type: 'personality',
    category: 'self-awareness',
    difficulty_level: 'medium',
    is_active: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: assessmentsData, error: aError },
        { data: configsData, error: cError },
      ] = await Promise.all([
        supabase.from('assessments_enhanced').select('*'),
        supabase.from('ai_configurations').select('id, name'),
      ]);
      if (aError) throw aError;
      if (cError) throw cError;
      setAssessments(assessmentsData || []);
      setAiConfigs(configsData || []);
    } catch (e) {
      toast.error('Failed to load assessment data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      // Ensure questions is valid JSON
      if (typeof payload.questions === 'string') {
        try {
          payload.questions = JSON.parse(payload.questions);
        } catch {
          toast.error("Questions field contains invalid JSON.");
          setIsSubmitting(false);
          return;
        }
      }

      if (editingAssessment) {
        const { error } = await supabase
          .from("assessments_enhanced")
          .update(payload as TablesUpdate<'assessments_enhanced'>)
          .eq("id", editingAssessment.id);
        if (error) throw error;
        toast.success("Assessment updated!");
      } else {
        const { error } = await supabase.from("assessments_enhanced").insert(payload as TablesInsert<'assessments_enhanced'>);
        if (error) throw error;
        toast.success("Assessment created!");
      }
      resetForm();
      await loadData();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      ...assessment,
      questions: JSON.stringify(assessment.questions, null, 2), // Pretty print for editing
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('assessments_enhanced').delete().eq('id', id);
      if (error) throw error;
      toast.success('Assessment deleted.');
      await loadData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const resetForm = () => {
    setEditingAssessment(null);
    setFormData({
      title: '',
      description: '',
      type: 'personality',
      category: 'self-awareness',
      difficulty_level: 'medium',
      is_active: true,
    });
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingAssessment ? 'Edit' : 'Create'} Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields */}
          </form>
        </CardContent>
      </Card>
      {/* Table of assessments */}
    </div>
  );
}