import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import type { AIAssessmentConfig, Assessment, AssessmentAttempt } from "@/types/assessment-types";

type Provider = { id: string; name: string };
type Model = { id: string; display_name: string };
type UseCase = { id: string; name: string };
type Behavior = { id: string; name: string };

export default function AIAssessmentManagement() {
  const [configs, setConfigs] = useState<AIAssessmentConfig[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formType, setFormType] = useState<"config" | "assessment">("config");
  const [formData, setFormData] = useState<Partial<AIAssessmentConfig & Assessment>>({});
  
  // Data for dropdowns
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        configsData,
        assessmentsData,
        attemptsData,
        providersData,
        modelsData,
        useCasesData,
        behaviorsData,
      ] = await Promise.all([
        supabase.from("ai_assessment_configs").select("*"),
        supabase.from("assessments").select("*, ai_assessment_configs(name)"),
        supabase.from("assessment_attempts").select("*, assessments(title), user_profiles(nickname)"),
        supabase.from("providers").select("id, name"),
        supabase.from("models").select("id, display_name"),
        supabase.from("ai_use_cases").select("id, name"),
        supabase.from("ai_behaviors").select("id, name"),
      ]);

      if (configsData.error) throw configsData.error;
      if (assessmentsData.error) throw assessmentsData.error;
      if (attemptsData.error) throw attemptsData.error;
      if (providersData.error) throw providersData.error;
      if (modelsData.error) throw modelsData.error;
      if (useCasesData.error) throw useCasesData.error;
      if (behaviorsData.error) throw behaviorsData.error;

      setConfigs((configsData.data as any[]) || []);
      setAssessments((assessmentsData.data as any[]) || []);
      setAttempts((attemptsData.data as any[]) || []);
      setProviders(providersData.data || []);
      setModels(modelsData.data || []);
      setUseCases(useCasesData.data || []);
      setBehaviors(behaviorsData.data || []);
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

  const handleNewConfig = () => {
    setFormType("config");
    setFormData({
      name: "",
      description: "",
      temperature: 0.7,
      max_tokens: 1024,
      system_prompt: "",
      evaluation_criteria: {},
      fallback_message: "I'm sorry, I couldn't process that.",
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    const newConfig = {
      name: formData.name,
      description: formData.description,
      provider_id: formData.provider_id,
      model_id: formData.model_id,
      use_case_id: formData.use_case_id,
      behavior_id: formData.behavior_id,
      temperature: Number(formData.temperature),
      max_tokens: Number(formData.max_tokens),
      system_prompt: formData.system_prompt,
      evaluation_criteria: typeof formData.evaluation_criteria === 'string' ? JSON.parse(formData.evaluation_criteria) : formData.evaluation_criteria,
      fallback_message: formData.fallback_message,
      is_active: formData.is_active,
    };

    try {
      const { error } = await supabase.from("ai_assessment_configs").insert(newConfig as any);
      if (error) throw error;
      toast.success("AI Config saved successfully!");
      setDialogOpen(false);
      void loadData();
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save config.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Assessment Management</h1>
          <p className="text-muted-foreground">
            Configure AI, manage assessments, and review user attempts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleNewConfig}><Plus className="w-4 h-4 mr-2" /> New AI Config</Button>
          {/* <Button onClick={handleNewAssessment}><Plus className="w-4 h-4 mr-2" /> New Assessment</Button> */}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>AI Configurations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>{config.name}</TableCell>
                      <TableCell>{config.description}</TableCell>
                      <TableCell>{config.is_active ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>AI Config</TableHead>
                    <TableHead>Public</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell>{assessment.title}</TableCell>
                      <TableCell>{assessment.category}</TableCell>
                      <TableCell>{(assessment as any).ai_assessment_configs?.name}</TableCell>
                      <TableCell>{assessment.is_public ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Create AI Configuration</DialogTitle>
            <DialogDescription>
              Set up a new configuration for AI-powered assessments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Form fields would go here */}
            <p>Form under construction.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveConfig}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}