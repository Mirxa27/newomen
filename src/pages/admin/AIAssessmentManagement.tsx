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
import { Loader2, Edit, Trash2, Plus, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { AssessmentsEnhanced } from "@/integrations/supabase/tables/assessments_enhanced";
import { AIConfigurations } from "@/integrations/supabase/tables/ai_configurations";
import { Json, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Assessment = AssessmentsEnhanced['Row'];
type AIConfiguration = AIConfigurations['Row'];

interface AssessmentFormState {
  id?: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  difficulty_level: string;
  time_limit_minutes: number | null;
  questions: Json;
  passing_score: number | null;
  ai_config_id: string | null;
  is_public: boolean;
  is_active: boolean;
}

export default function AIAssessmentManagement() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [aiConfigs, setAiConfigs] = useState<AIConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<AssessmentFormState>({
    title: "",
    description: null,
    type: "personality",
    category: "wellness",
    difficulty_level: "easy",
    time_limit_minutes: 30,
    questions: [],
    passing_score: 70,
    ai_config_id: null,
    is_public: false,
    is_active: true,
  });
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; type: 'assessment' | 'ai_config'; id: string | null }>({ open: false, type: 'assessment', id: null });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: assessmentsData, error: assessmentsError },
        { data: aiConfigsData, error: aiConfigsError },
      ] = await Promise.all([
        supabase.from("assessments_enhanced").select("*").order("created_at", { ascending: false }),
        supabase.from("ai_configurations").select("*").order("created_at", { ascending: false }),
      ]);

      if (assessmentsError) throw assessmentsError;
      if (aiConfigsError) throw aiConfigsError;

      setAssessments(assessmentsData || []);
      setAiConfigs(aiConfigsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load assessment data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleFormChange = (field: keyof AssessmentFormState, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: TablesInsert<'assessments_enhanced'> = {
        title: formState.title,
        description: formState.description,
        type: formState.type,
        category: formState.category,
        difficulty_level: formState.difficulty_level,
        time_limit_minutes: formState.time_limit_minutes,
        questions: formState.questions,
        passing_score: formState.passing_score,
        ai_config_id: formState.ai_config_id,
        is_public: formState.is_public,
        is_active: formState.is_active,
      };

      if (editingAssessment) {
        const { error } = await supabase
          .from("assessments_enhanced")
          .update(payload as TablesUpdate<'assessments_enhanced'>)
          .eq("id", editingAssessment.id);
        if (error) throw error;
        toast.success("Assessment updated successfully!");
      } else {
        const { error } = await supabase.from("assessments_enhanced").insert(payload);
        if (error) throw error;
        toast.success("Assessment created successfully!");
      }
      setFormState({
        title: "",
        description: null,
        type: "personality",
        category: "wellness",
        difficulty_level: "easy",
        time_limit_minutes: 30,
        questions: [],
        passing_score: 70,
        ai_config_id: null,
        is_public: false,
        is_active: true,
      });
      setEditingAssessment(null);
      await loadData();
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast.error("Failed to save assessment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setFormState({
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      type: assessment.type,
      category: assessment.category,
      difficulty_level: assessment.difficulty_level,
      time_limit_minutes: assessment.time_limit_minutes,
      questions: assessment.questions,
      passing_score: assessment.passing_score,
      ai_config_id: assessment.ai_config_id,
      is_public: assessment.is_public,
      is_active: assessment.is_active,
    });
  };

  const handleDelete = async () => {
    if (!dialogState.id || !dialogState.type) return;
    try {
      let error;
      if (dialogState.type === 'assessment') {
        ({ error } = await supabase.from("assessments_enhanced").delete().eq("id", dialogState.id));
        if (!error) setAssessments(prev => prev.filter(a => a.id !== dialogState.id));
      } else if (dialogState.type === 'ai_config') {
        ({ error } = await supabase.from("ai_configurations").delete().eq("id", dialogState.id));
        if (!error) setAiConfigs(prev => prev.filter(c => c.id !== dialogState.id));
      }
      if (error) throw error;
      toast.success(`${dialogState.type === 'assessment' ? 'Assessment' : 'AI Configuration'} deleted successfully!`);
      await loadData();
    } catch (error) {
      console.error(`Error deleting ${dialogState.type}:`, error);
      toast.error(`Failed to delete ${dialogState.type}.`);
    } finally {
      setDialogState({ open: false, type: 'assessment', id: null });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{editingAssessment ? "Edit AI Assessment" : "Create New AI Assessment"}</CardTitle>
          <CardDescription>Define and manage AI-powered assessments.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Assessment Title"
              value={formState.title}
              onChange={(e) => handleFormChange("title", e.target.value)}
              required
              className="glass"
            />
            <Textarea
              placeholder="Description"
              value={formState.description || ""}
              onChange={(e) => handleFormChange("description", e.target.value)}
              className="glass"
              rows={3}
            />
            <Select
              value={formState.type}
              onValueChange={(value) => handleFormChange("type", value)}
              required
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personality">Personality</SelectItem>
                <SelectItem value="skill">Skill</SelectItem>
                <SelectItem value="knowledge">Knowledge</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={formState.category}
              onValueChange={(value) => handleFormChange("category", value)}
              required
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wellness">Wellness</SelectItem>
                <SelectItem value="relationship">Relationship</SelectItem>
                <SelectItem value="career">Career</SelectItem>
                <SelectItem value="mental_health">Mental Health</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={formState.difficulty_level}
              onValueChange={(value) => handleFormChange("difficulty_level", value)}
              required
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Time Limit (minutes)"
              value={formState.time_limit_minutes || ""}
              onChange={(e) => handleFormChange("time_limit_minutes", parseInt(e.target.value))}
              className="glass"
            />
            <Textarea
              placeholder="Questions (JSON Array)"
              value={JSON.stringify(formState.questions, null, 2)}
              onChange={(e) => {
                try {
                  handleFormChange("questions", JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON, do nothing
                }
              }}
              required
              className="glass"
              rows={10}
            />
            <Input
              type="number"
              placeholder="Passing Score (0-100)"
              value={formState.passing_score || ""}
              onChange={(e) => handleFormChange("passing_score", parseInt(e.target.value))}
              className="glass"
            />
            <Select
              value={formState.ai_config_id || ""}
              onValueChange={(value) => handleFormChange("ai_config_id", value)}
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select AI Configuration" />
              </SelectTrigger>
              <SelectContent>
                {aiConfigs.map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    {config.name} ({config.model_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                id="is-public"
                checked={formState.is_public}
                onCheckedChange={(checked) => handleFormChange("is_public", checked)}
              />
              <Label htmlFor="is-public">Is Public</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={formState.is_active}
                onCheckedChange={(checked) => handleFormChange("is_active", checked)}
              />
              <Label htmlFor="is-active">Is Active</Label>
            </div>
            <Button type="submit" disabled={isSubmitting} className="clay-button">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingAssessment ? "Update Assessment" : "Create Assessment"}
            </Button>
            {editingAssessment && (
              <Button variant="outline" onClick={() => { setEditingAssessment(null); setFormState({ title: "", description: null, type: "personality", category: "wellness", difficulty_level: "easy", time_limit_minutes: 30, questions: [], passing_score: 70, ai_config_id: null, is_public: false, is_active: true }); }} className="ml-2">
                Cancel Edit
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Existing AI Assessments</CardTitle>
          <CardDescription>Manage your AI-powered assessments.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>AI Config</TableHead>
                  <TableHead>Public</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.title}</TableCell>
                    <TableCell>{assessment.category}</TableCell>
                    <TableCell>{assessment.difficulty_level}</TableCell>
                    <TableCell>{Array.isArray(assessment.questions) ? assessment.questions.length : 0}</TableCell>
                    <TableCell>{aiConfigs.find(c => c.id === assessment.ai_config_id)?.name || "N/A"}</TableCell>
                    <TableCell>{assessment.is_public ? "Yes" : "No"}</TableCell>
                    <TableCell>{assessment.is_active ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(assessment)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDialogState({ open: true, type: 'assessment', id: assessment.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => alert("View results not implemented yet")}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {assessments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No AI assessments found.
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
        title={`Delete ${dialogState.type === 'assessment' ? 'Assessment' : 'AI Configuration'}?`}
        description="This action cannot be undone. The item will be permanently removed."
      />
    </div>
  );
}