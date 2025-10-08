import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import type { AIConfiguration, Assessment, AssessmentAttempt } from "@/types/assessment-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Provider = { id: string; name: string };
type Model = { id: string; display_name: string };
type UseCase = { id: string; name: string };
type Behavior = { id: string; name: string };

// Enhanced types for relations
type AssessmentWithConfig = Assessment & {
  ai_configurations: { name: string } | null;
};

type AttemptWithRelations = AssessmentAttempt & {
  assessments_enhanced: { title: string } | null;
  user_profiles: { nickname: string | null } | null;
};

export default function AIAssessmentManagement() {
  const [configs, setConfigs] = useState<AIConfiguration[]>([]);
  const [assessments, setAssessments] = useState<AssessmentWithConfig[]>([]);
  const [attempts, setAttempts] = useState<AttemptWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formType, setFormType] = useState<"config" | "assessment">("config");
  const [formData, setFormData] = useState<Partial<AIConfiguration>>({});
  
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
        assessmentAttemptsData,
        providersData,
        modelsData,
        useCasesData,
        behaviorsData,
      ] = await Promise.all([
        supabase.from("ai_configurations").select("*"),
        supabase.from("assessments_enhanced").select("*, ai_configurations(name)"),
        supabase.from("assessment_attempts").select("*, assessments_enhanced(title), user_profiles(nickname)"),
        supabase.from("providers").select("id, name"),
        supabase.from("models").select("id, display_name"),
        supabase.from("ai_use_cases").select("id, name"),
        supabase.from("ai_behaviors").select("id, name"),
      ]);

      if (configsData.error) throw configsData.error;
      if (assessmentsData.error) throw assessmentsData.error;
      if (assessmentAttemptsData.error) throw assessmentAttemptsData.error;
      if (providersData.error) throw providersData.error;
      if (modelsData.error) throw modelsData.error;
      if (useCasesData.error) throw useCasesData.error;
      if (behaviorsData.error) throw behaviorsData.error;

      setConfigs(configsData.data || []);
      setAssessments((assessmentsData.data as unknown as AssessmentWithConfig[]) || []);
      setAttempts((assessmentAttemptsData.data as unknown as AttemptWithRelations[]) || []);
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
      is_active: true,
      provider: "openai", // Default provider
      model_name: "", // Default model name
    });
    setDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    const newConfig: Partial<AIConfiguration> = {
      name: formData.name,
      description: formData.description,
      provider: formData.provider,
      model_name: formData.model_name,
      temperature: Number(formData.temperature),
      max_tokens: Number(formData.max_tokens),
      system_prompt: formData.system_prompt,
      is_active: formData.is_active,
    };

    try {
      const { error } = await supabase.from("ai_configurations").insert(newConfig as any);
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
                      <TableCell>{assessment.ai_configurations?.name}</TableCell>
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
            {/* Form fields */}
            <div className="space-y-2">
              <Label htmlFor="config-name">Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Configuration Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-provider">Provider</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value as AIConfiguration["provider"] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google (Gemini)</SelectItem>
                  <SelectItem value="azure">Azure OpenAI</SelectItem>
                  <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                  <SelectItem value="cartesia">Cartesia</SelectItem>
                  <SelectItem value="deepgram">Deepgram</SelectItem>
                  <SelectItem value="hume">Hume AI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-model">Model Name</Label>
              <Input
                id="model_name"
                value={formData.model_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, model_name: e.target.value }))}
                placeholder="Model Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-max-tokens">Max Tokens</Label>
              <Input
                id="max_tokens"
                type="number"
                value={formData.max_tokens}
                onChange={(e) => setFormData(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Is Active</Label>
            </div>
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