import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AIConfiguration, Assessment, AssessmentAttempt } from "@/types/assessment-types";

type ProviderInfo = {
  id: string;
  name: string | null;
  type: string | null;
};

type ModelInfo = {
  id: string;
  provider_id: string | null;
  model_id: string;
  display_name: string | null;
  providers?: { type: string | null } | null;
};

type AssessmentAttemptRow = AssessmentAttempt & {
  assessments_enhanced: { title: string | null } | null;
  user_profiles: { nickname: string | null } | null;
};

const FALLBACK_PROVIDER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google (Gemini)" },
  { value: "azure", label: "Azure OpenAI" },
  { value: "custom", label: "Custom Provider" },
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "cartesia", label: "Cartesia" },
  { value: "deepgram", label: "Deepgram" },
  { value: "hume", label: "Hume AI" },
  { value: "zai", label: "Z.ai" },
];

const DEFAULT_FORM_STATE: Partial<AIConfiguration> = {
  name: "",
  description: "",
  provider: "openai",
  model_name: "",
  api_base_url: "",
  temperature: 0.7,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  max_tokens: 1000,
  system_prompt: "",
  is_active: true,
  is_default: false,
};

export default function AIAssessmentManagement() {
  const [configs, setConfigs] = useState<AIConfiguration[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttemptRow[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<AIConfiguration>>(DEFAULT_FORM_STATE);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const providerOptions = useMemo(() => {
    const fromDb = providers
      .map((provider) => {
        const value = provider.type ?? provider.name?.toLowerCase() ?? "";
        if (!value) return null;
        const label = provider.name ?? value;
        return { value, label };
      })
      .filter((option): option is { value: string; label: string } => Boolean(option?.value));

    const merged = new Map<string, string>();
    [...FALLBACK_PROVIDER_OPTIONS, ...fromDb].forEach(({ value, label }) => {
      if (!merged.has(value)) merged.set(value, label);
    });

    return Array.from(merged.entries()).map(([value, label]) => ({ value, label }));
  }, [providers]);

  const configLookup = useMemo(() => {
    return configs.reduce<Record<string, AIConfiguration>>((map, config) => {
      if (config.id) map[config.id] = config;
      return map;
    }, {});
  }, [configs]);

  const filteredModels = useMemo(() => {
    if (!formData.provider) return models;

    const normalizedProvider = formData.provider.toLowerCase();
    const matches = models.filter((model) => {
      const providerType = model.providers?.type ?? "";
      return providerType.toLowerCase() === normalizedProvider || model.model_id.toLowerCase().includes(normalizedProvider);
    });

    return matches.length > 0 ? matches : models;
  }, [models, formData.provider]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        configsQuery,
        assessmentsQuery,
        attemptsQuery,
        providersQuery,
        modelsQuery,
      ] = await Promise.all([
        supabase.from("ai_configurations").select("*").order("created_at", { ascending: false }),
        supabase.from("assessments_enhanced").select("*").order("updated_at", { ascending: false }),
        supabase
          .from("assessment_attempts")
          .select("*, assessments_enhanced(title), user_profiles(nickname)")
          .order("created_at", { ascending: false })
          .limit(25),
        supabase.from("providers").select("id, name, type").order("name", { ascending: true }),
        supabase.from("models").select("id, provider_id, model_id, display_name, providers(type)").order("display_name", { ascending: true }),
      ]);

      if (configsQuery.error) throw configsQuery.error;
      if (assessmentsQuery.error) throw assessmentsQuery.error;
      if (attemptsQuery.error) throw attemptsQuery.error;
      if (providersQuery.error) throw providersQuery.error;
      if (modelsQuery.error) throw modelsQuery.error;

      setConfigs(configsQuery.data ?? []);
      setAssessments((assessmentsQuery.data as Assessment[]) ?? []);
      setAttempts((attemptsQuery.data as unknown as AssessmentAttemptRow[]) ?? []);
      setProviders((providersQuery.data as ProviderInfo[]) ?? []);
      setModels((modelsQuery.data as unknown as ModelInfo[]) ?? []);
    } catch (error) {
      console.error("Error loading assessment management data:", error);
      toast.error("Unable to load assessment configuration data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openCreateDialog = () => {
    setEditingConfigId(null);
    setFormData(DEFAULT_FORM_STATE);
    setDialogOpen(true);
  };

  const openEditDialog = (config: AIConfiguration) => {
    setEditingConfigId(config.id);
    setFormData({
      id: config.id,
      name: config.name,
      description: config.description ?? "",
      provider: config.provider,
      model_name: config.model_name,
      api_base_url: config.api_base_url ?? "",
      temperature: config.temperature ?? 0,
      top_p: config.top_p ?? 1,
      frequency_penalty: config.frequency_penalty ?? 0,
      presence_penalty: config.presence_penalty ?? 0,
      max_tokens: config.max_tokens ?? 0,
      system_prompt: config.system_prompt ?? "",
      is_active: config.is_active ?? true,
      is_default: config.is_default ?? false,
    });
    setDialogOpen(true);
  };

  const handleFormFieldChange = (field: keyof AIConfiguration, value: string | number | boolean | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveConfig = async () => {
    if (!formData.name || !formData.provider || !formData.model_name) {
      toast.error("Name, Provider, and Model are required.");
      return;
    }

    setSaving(true);

    const providerLabel =
      providerOptions.find((option) => option.value === formData.provider)?.label ?? formData.provider;

    const payload: Database["public"]["Tables"]["ai_configurations"]["Insert"] = {
      name: formData.name.trim(),
      description: (formData.description ?? "").trim() || null,
      provider: formData.provider,
      provider_name: providerLabel,
      model_name: formData.model_name,
      api_base_url: formData.api_base_url ? formData.api_base_url.trim() : null,
      temperature: formData.temperature ?? null,
      max_tokens: formData.max_tokens ?? null,
      top_p: formData.top_p ?? null,
      frequency_penalty: formData.frequency_penalty ?? null,
      presence_penalty: formData.presence_penalty ?? null,
      system_prompt: formData.system_prompt?.trim() || null,
      is_active: formData.is_active ?? true,
      is_default: formData.is_default ?? false,
    };

    try {
      let error;
      if (editingConfigId) {
        ({ error } = await supabase.from("ai_configurations").update(payload).eq("id", editingConfigId));
      } else {
        ({ error } = await supabase.from("ai_configurations").insert(payload));
      }

      if (error) throw error;

      toast.success(`AI configuration ${editingConfigId ? "updated" : "created"} successfully.`);
      setDialogOpen(false);
      setFormData(DEFAULT_FORM_STATE);
      setEditingConfigId(null);
      void loadData();
    } catch (error) {
      console.error("Error saving AI configuration:", error);
      toast.error("Failed to save AI configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (config: AIConfiguration) => {
    if (!config.id) return;
    const confirmed = window.confirm(`Delete configuration "${config.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const { error } = await supabase.from("ai_configurations").delete().eq("id", config.id);
      if (error) throw error;
      toast.success(`Configuration "${config.name}" deleted.`);
      setConfigs((prev) => prev.filter((item) => item.id !== config.id));
    } catch (error) {
      console.error("Error deleting configuration:", error);
      toast.error("Failed to delete configuration.");
    }
  };

  const handleToggleConfigActive = async (config: AIConfiguration, nextActive: boolean) => {
    if (!config.id) return;
    setConfigs((prev) => prev.map((item) => (item.id === config.id ? { ...item, is_active: nextActive } : item)));

    const { error } = await supabase
      .from("ai_configurations")
      .update({ is_active: nextActive })
      .eq("id", config.id);

    if (error) {
      console.error("Error toggling configuration active state:", error);
      toast.error("Failed to update configuration state.");
      void loadData();
    }
  };

  const handleAssessmentConfigChange = async (assessmentId: string, configId: string | null) => {
    setAssessments((prev) =>
      prev.map((assessment) =>
        assessment.id === assessmentId ? { ...assessment, ai_config_id: configId ?? null } : assessment
      )
    );

    const { error } = await supabase
      .from("assessments_enhanced")
      .update({ ai_config_id: configId ?? null })
      .eq("id", assessmentId);

    if (error) {
      console.error("Error updating assessment configuration:", error);
      toast.error("Failed to update assessment configuration.");
      void loadData();
    } else {
      toast.success("Assessment configuration updated.");
    }
  };

  const handleAssessmentVisibilityToggle = async (assessment: Assessment, nextPublic: boolean) => {
    setAssessments((prev) =>
      prev.map((item) => (item.id === assessment.id ? { ...item, is_public: nextPublic } : item))
    );

    const { error } = await supabase
      .from("assessments_enhanced")
      .update({ is_public: nextPublic })
      .eq("id", assessment.id);

    if (error) {
      console.error("Error toggling assessment visibility:", error);
      toast.error("Failed to update assessment visibility.");
      void loadData();
    }
  };

  const assessmentConfigLabel = (configId: string | null) => {
    if (!configId) return "Unassigned";
    return configLookup[configId]?.name ?? "Unknown";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Assessment & AI Management</h1>
          <p className="text-muted-foreground">
            Configure AI providers, link assessments to configurations, and review recent assessment attempts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
            <Loader2 className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : "opacity-0"}`} />
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New AI Config
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-72 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>AI Configurations</CardTitle>
              <CardDescription>Manage AI providers, models, and defaults used across automated assessments.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell>{providerOptions.find((option) => option.value === config.provider)?.label ?? config.provider}</TableCell>
                      <TableCell>{config.model_name}</TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(config.is_active)}
                          onCheckedChange={(value) => handleToggleConfigActive(config, value)}
                          aria-label={`Toggle ${config.name} active state`}
                        />
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(config)} aria-label="Edit configuration">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteConfig(config)}
                          aria-label="Delete configuration"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
              <CardDescription>Assign an AI configuration and manage visibility for each assessment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>AI Configuration</TableHead>
                    <TableHead>Public</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">{assessment.title}</TableCell>
                      <TableCell>{assessment.category ?? "General"}</TableCell>
                      <TableCell>
                        <Select
                          value={assessment.ai_config_id ?? ""}
                          onValueChange={(value) => handleAssessmentConfigChange(assessment.id, value || null)}
                        >
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Select AI Config">
                              {assessmentConfigLabel(assessment.ai_config_id ?? null)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {configs.map((config) => (
                              <SelectItem key={config.id} value={config.id}>
                                {config.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={Boolean(assessment.is_public)}
                          onCheckedChange={(value) => handleAssessmentVisibilityToggle(assessment, value)}
                          aria-label={`Toggle ${assessment.title} visibility`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Assessment Attempts</CardTitle>
              <CardDescription>Latest member submissions with AI scoring details.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell>{attempt.assessments_enhanced?.title ?? "Assessment"}</TableCell>
                      <TableCell>{attempt.user_profiles?.nickname ?? attempt.user_id ?? "Member"}</TableCell>
                      <TableCell>{attempt.status ?? "unknown"}</TableCell>
                      <TableCell>{attempt.ai_score ?? "—"}</TableCell>
                      <TableCell>
                        {attempt.completed_at
                          ? new Date(attempt.completed_at).toLocaleString()
                          : "In progress"}
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
        <DialogContent className="max-w-2xl space-y-4">
          <DialogHeader>
            <DialogTitle>{editingConfigId ? "Edit AI Configuration" : "Create AI Configuration"}</DialogTitle>
            <DialogDescription>
              Define the provider, model, and prompt defaults the platform will use when analysing assessments.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="config-name">Name</Label>
              <Input
                id="config-name"
                value={formData.name ?? ""}
                onChange={(event) => handleFormFieldChange("name", event.target.value)}
                placeholder="e.g. OpenAI GPT-4 Analysis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-provider">Provider</Label>
              <Select
                value={formData.provider ?? ""}
                onValueChange={(value) => {
                  handleFormFieldChange("provider", value);
                  if (!filteredModels.some((model) => model.model_id === formData.model_name)) {
                    handleFormFieldChange("model_name", "");
                  }
                }}
              >
                <SelectTrigger id="config-provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-model">Model</Label>
              <Select
                value={formData.model_name ?? ""}
                onValueChange={(value) => handleFormFieldChange("model_name", value)}
              >
                <SelectTrigger id="config-model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {filteredModels.map((model) => (
                    <SelectItem key={model.id} value={model.model_id}>
                      {model.display_name ?? model.model_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-api-base">API Base URL</Label>
              <Input
                id="config-api-base"
                value={formData.api_base_url ?? ""}
                onChange={(event) => handleFormFieldChange("api_base_url", event.target.value)}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-temperature">Temperature</Label>
              <Input
                id="config-temperature"
                type="number"
                step="0.1"
                value={formData.temperature ?? 0}
                onChange={(event) => handleFormFieldChange("temperature", event.target.value === "" ? null : Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-top-p">Top P</Label>
              <Input
                id="config-top-p"
                type="number"
                step="0.05"
                value={formData.top_p ?? 1}
                onChange={(event) => handleFormFieldChange("top_p", event.target.value === "" ? null : Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-frequency-penalty">Frequency Penalty</Label>
              <Input
                id="config-frequency-penalty"
                type="number"
                step="0.1"
                value={formData.frequency_penalty ?? 0}
                onChange={(event) => handleFormFieldChange("frequency_penalty", event.target.value === "" ? null : Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-presence-penalty">Presence Penalty</Label>
              <Input
                id="config-presence-penalty"
                type="number"
                step="0.1"
                value={formData.presence_penalty ?? 0}
                onChange={(event) => handleFormFieldChange("presence_penalty", event.target.value === "" ? null : Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-max-tokens">Max Tokens</Label>
              <Input
                id="config-max-tokens"
                type="number"
                value={formData.max_tokens ?? 0}
                onChange={(event) => handleFormFieldChange("max_tokens", event.target.value === "" ? null : Number(event.target.value))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="config-description">Description</Label>
              <Textarea
                id="config-description"
                value={formData.description ?? ""}
                onChange={(event) => handleFormFieldChange("description", event.target.value)}
                placeholder="Describe where this configuration should be used."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="config-system-prompt">System Prompt</Label>
              <Textarea
                id="config-system-prompt"
                value={formData.system_prompt ?? ""}
                onChange={(event) => handleFormFieldChange("system_prompt", event.target.value)}
                rows={6}
                placeholder="System prompt applied to assessments processed with this configuration."
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="config-is-active"
                checked={Boolean(formData.is_active ?? true)}
                onCheckedChange={(value) => handleFormFieldChange("is_active", value)}
              />
              <Label htmlFor="config-is-active">Active</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="config-is-default"
                checked={Boolean(formData.is_default)}
                onCheckedChange={(value) => handleFormFieldChange("is_default", value)}
              />
              <Label htmlFor="config-is-default">Default Choice</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
