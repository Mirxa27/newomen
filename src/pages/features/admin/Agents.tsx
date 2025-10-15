import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Badge } from "@/components/shared/ui/badge";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import { Textarea } from "@/components/shared/ui/textarea";
import { Switch } from "@/components/shared/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shared/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shared/ui/table";
import ResponsiveTable from "@/components/shared/ui/ResponsiveTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/shared/ui/dialog";
import { ConfirmationDialog } from "@/components/shared/ui/ConfirmationDialog";
import { useToast } from "@/hooks/shared/ui/use-toast";
import { Loader2, Plus, Edit, Trash2, Wand2, Search, RefreshCw } from "lucide-react";

interface AgentRow {
  id: string;
  name: string;
  status: string | null;
  prompt_id: string | null;
  model_id: string | null;
  voice_id: string | null;
  created_at: string | null;
  tool_policy: Record<string, unknown> | null;
  vad_config: Record<string, unknown> | null;
  prompts?: {
    id: string;
    name: string;
  } | null;
  models?: {
    id: string;
    model_id: string;
    display_name: string | null;
    provider_id: string;
  } | null;
  voices?: {
    id: string;
    name: string;
    locale: string | null;
    provider_id: string;
  } | null;
}

interface PromptSummary {
  id: string;
  name: string;
}

interface ModelSummary {
  id: string;
  model_id: string;
  display_name: string | null;
  provider_id: string;
}

interface VoiceSummary {
  id: string;
  name: string;
  locale: string | null;
  provider_id: string;
}

interface AgentFormState {
  id?: string;
  name: string;
  prompt_id: string;
  model_id: string;
  voice_id: string;
  status: "active" | "inactive";
  tool_policy: string;
  vad_config: string;
}

const blankForm: AgentFormState = {
  name: "",
  prompt_id: "",
  model_id: "",
  voice_id: "",
  status: "active",
  tool_policy: JSON.stringify({ tools: [], allow_unregistered: false }, null, 2),
  vad_config: JSON.stringify({ sensitivity: 0.9, silence_ms: 400, start_threshold: 0.3 }, null, 2),
};

const safeParseJson = (value: string) => {
  if (!value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error("Invalid JSON. Please ensure the policy fields contain valid JSON.");
  }
};

export default function Agents() {
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [prompts, setPrompts] = useState<PromptSummary[]>([]);
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [voices, setVoices] = useState<VoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formState, setFormState] = useState<AgentFormState>(blankForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<AgentRow | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [agentsRes, promptsRes, modelsRes, voicesRes] = await Promise.all([
        supabase
          .from("agents")
          .select(
            `*,
            prompts:prompts(id, name),
            models:models(id, model_id, display_name, provider_id),
            voices:voices(id, name, locale, provider_id)
          `)
          .order("created_at", { ascending: false }),
        supabase.from("prompts").select("id, name").order("created_at", { ascending: false }),
        supabase.from("models").select("id, model_id, display_name, provider_id").order("display_name"),
        supabase.from("voices").select("id, name, locale, provider_id").order("name"),
      ]);

      if (agentsRes.error) throw agentsRes.error;
      if (promptsRes.error) throw promptsRes.error;
      if (modelsRes.error) throw modelsRes.error;
      if (voicesRes.error) throw voicesRes.error;

      setAgents((agentsRes.data as any[]) ?? []);
      setPrompts((promptsRes.data as PromptSummary[]) ?? []);
      setModels((modelsRes.data as ModelSummary[]) ?? []);
      setVoices((voicesRes.data as VoiceSummary[]) ?? []);
    } catch (error) {
      console.error("Error loading agents", error);
      toast({ title: "Unable to load agents", description: "Please try again later", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openNewDialog = () => {
    setFormState(blankForm);
    setDialogOpen(true);
  };

  const openEditDialog = (agent: AgentRow) => {
    setFormState({
      id: agent.id,
      name: agent.name,
      prompt_id: agent.prompt_id ?? "",
      model_id: agent.model_id ?? "",
      voice_id: agent.voice_id ?? "",
      status: agent.status === "inactive" ? "inactive" : "active",
      tool_policy: agent.tool_policy ? JSON.stringify(agent.tool_policy, null, 2) : blankForm.tool_policy,
      vad_config: agent.vad_config ? JSON.stringify(agent.vad_config, null, 2) : blankForm.vad_config,
    });
    setDialogOpen(true);
  };

  const saveAgent = async () => {
    if (!formState.name.trim()) {
      toast({ title: "Name is required", description: "Please provide an agent name", variant: "destructive" });
      return;
    }

    if (!formState.prompt_id || !formState.model_id || !formState.voice_id) {
      toast({
        title: "Missing associations",
        description: "Prompt, model, and voice are required to create an agent",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formState.name.trim(),
        prompt_id: formState.prompt_id,
        model_id: formState.model_id,
        voice_id: formState.voice_id,
        status: formState.status,
        tool_policy: safeParseJson(formState.tool_policy),
        vad_config: safeParseJson(formState.vad_config),
      };

      if (formState.id) {
        const { error } = await supabase
          .from("agents")
          .update(payload)
          .eq("id", formState.id);
        if (error) throw error;
        toast({ title: "Agent updated", description: `${formState.name} saved successfully.` });
      } else {
        const { error } = await supabase.from("agents").insert(payload);
        if (error) throw error;
        toast({ title: "Agent created", description: `${formState.name} is ready for realtime sessions.` });
      }

      setDialogOpen(false);
      setFormState(blankForm);
      void loadData();
    } catch (error) {
      console.error("Error saving agent", error);
      const description = error instanceof Error ? error.message : "Unable to save agent";
      toast({ title: "Save failed", description, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (agent: AgentRow) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  const deleteAgent = async () => {
    if (!agentToDelete) return;
    try {
      const { error } = await supabase.from("agents").delete().eq("id", agentToDelete.id);
      if (error) throw error;
      toast({ title: "Agent deleted", description: `${agentToDelete.name} has been removed.` });
      setAgentToDelete(null);
      setDeleteDialogOpen(false);
      void loadData();
    } catch (error) {
      console.error("Error deleting agent", error);
      toast({ title: "Delete failed", description: "Unable to delete agent", variant: "destructive" });
    }
  };

  const testAgent = async (agent: AgentRow) => {
    try {
      const { error } = await supabase.functions.invoke("realtime-agent-test", {
        body: { agentId: agent.id },
      });
      if (error) throw error;
      toast({ title: "Test triggered", description: `${agent.name} test session requested.` });
    } catch (error) {
      console.error("Error testing agent", error);
      toast({
        title: "Test failed",
        description: "Could not trigger agent test. Ensure the realtime function is deployed.",
        variant: "destructive",
      });
    }
  };

  const filteredAgents = useMemo(() => {
    if (!searchTerm.trim()) return agents;
    const query = searchTerm.toLowerCase();
    return agents.filter((agent) =>
      agent.name.toLowerCase().includes(query) ||
      agent.prompts?.name?.toLowerCase().includes(query) ||
      agent.models?.display_name?.toLowerCase().includes(query)
    );
  }, [agents, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Realtime Agents</h1>
          <p className="text-muted-foreground max-w-2xl">
            Configure agents that power the realtime voice and chat experiences. Every agent binds a prompt, model, voice, and tool policies.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={openNewDialog} className="clay-button">
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Button>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Configured Agents</CardTitle>
          <CardDescription>
            {filteredAgents.length} agent{filteredAgents.length === 1 ? "" : "s"} ready for realtime sessions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No agents configured yet.</p>
              <p className="text-sm">Create your first agent to unlock realtime conversations.</p>
            </div>
          ) : (
            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Voice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>{agent.prompts?.name || "—"}</TableCell>
                      <TableCell>{agent.models?.display_name || agent.models?.model_id || "—"}</TableCell>
                      <TableCell>
                        {agent.voices?.name}
                        {agent.voices?.locale && <span className="text-xs text-muted-foreground ml-1">({agent.voices.locale})</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.status === "inactive" ? "secondary" : "default"}>
                          {agent.status || "active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => testAgent(agent)}>
                            <Wand2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEditDialog(agent)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => confirmDelete(agent)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl glass-card">
          <DialogHeader>
            <DialogTitle>{formState.id ? "Edit Agent" : "Create Agent"}</DialogTitle>
            <DialogDescription>
              Bind prompts, models, and voices into a deployable realtime agent. Adjust tool policies and VAD thresholds as needed.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g., NewMe Primary, Couples Concierge"
                />
              </div>

              <div>
                <Label htmlFor="agent-status">Status</Label>
                <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2">
                  <Switch
                    id="agent-status"
                    checked={formState.status === "active"}
                    onCheckedChange={(checked) =>
                      setFormState((prev) => ({ ...prev, status: checked ? "active" : "inactive" }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {formState.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div>
                <Label>Prompt</Label>
                <Select
                  value={formState.prompt_id}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, prompt_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select prompt" />
                  </SelectTrigger>
                  <SelectContent>
                    {prompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Model</Label>
                <Select
                  value={formState.model_id}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, model_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.display_name || model.model_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Voice</Label>
                <Select
                  value={formState.voice_id}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, voice_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}{voice.locale ? ` • ${voice.locale}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="tool-policy">Tool Policy JSON</Label>
                <Textarea
                  id="tool-policy"
                  value={formState.tool_policy}
                  onChange={(event) => setFormState((prev) => ({ ...prev, tool_policy: event.target.value }))}
                  className="min-h-[180px] font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Define allowed tools and safeguards. Ensure valid JSON.
                </p>
              </div>

              <div>
                <Label htmlFor="vad-config">VAD Configuration JSON</Label>
                <Textarea
                  id="vad-config"
                  value={formState.vad_config}
                  onChange={(event) => setFormState((prev) => ({ ...prev, vad_config: event.target.value }))}
                  className="min-h-[180px] font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Configure voice activity detection (sensitivity, silence thresholds) for realtime sessions.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAgent} disabled={saving} className="clay-button">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Agent
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete agent"
        description={`Are you sure you want to delete ${agentToDelete?.name}? This action cannot be undone.`}
        onConfirm={deleteAgent}
      />
    </div>
  );
}