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
import { Loader2, Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Agents } from "@/integrations/supabase/tables/agents";
import { Prompts } from "@/integrations/supabase/tables/prompts";
import { Models } from "@/integrations/supabase/tables/models";
import { Voices } from "@/integrations/supabase/tables/voices";
import { Json, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Agent = Agents['Row'];
type Prompt = Prompts['Row'];
type Model = Models['Row'];
type Voice = Voices['Row'];

interface AgentFormState {
  id?: string;
  name: string;
  prompt_id: string | null;
  model_id: string | null;
  voice_id: string | null;
  status: 'active' | 'inactive';
  tool_policy: Json | null;
  vad_config: Json | null;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<AgentFormState>({
    name: "",
    prompt_id: null,
    model_id: null,
    voice_id: null,
    status: "active",
    tool_policy: {},
    vad_config: {},
  });
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; agentId: string | null }>({ open: false, agentId: null });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: agentsData, error: agentsError },
        { data: promptsData, error: promptsError },
        { data: modelsData, error: modelsError },
        { data: voicesData, error: voicesError },
      ] = await Promise.all([
        supabase.from("agents").select("*").order("created_at", { ascending: false }),
        supabase.from("prompts").select("*").order("created_at", { ascending: false }),
        supabase.from("models").select("*").order("created_at", { ascending: false }),
        supabase.from("voices").select("*").order("created_at", { ascending: false }),
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
      console.error("Error loading data:", error);
      toast.error("Failed to load agent data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleFormChange = (field: keyof AgentFormState, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: TablesInsert<'agents'> = {
        name: formState.name,
        prompt_id: formState.prompt_id,
        model_id: formState.model_id,
        voice_id: formState.voice_id,
        status: formState.status,
        tool_policy: formState.tool_policy,
        vad_config: formState.vad_config,
      };

      if (editingAgent) {
        const { error } = await supabase
          .from("agents")
          .update(payload as TablesUpdate<'agents'>)
          .eq("id", editingAgent.id);
        if (error) throw error;
        toast.success("Agent updated successfully!");
      } else {
        const { error } = await supabase.from("agents").insert(payload);
        if (error) throw error;
        toast.success("Agent created successfully!");
      }
      setFormState({
        name: "",
        prompt_id: null,
        model_id: null,
        voice_id: null,
        status: "active",
        tool_policy: {},
        vad_config: {},
      });
      setEditingAgent(null);
      await loadData();
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error("Failed to save agent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormState({
      id: agent.id,
      name: agent.name,
      prompt_id: agent.prompt_id,
      model_id: agent.model_id,
      voice_id: agent.voice_id,
      status: agent.status,
      tool_policy: agent.tool_policy,
      vad_config: agent.vad_config,
    });
  };

  const handleDelete = async () => {
    if (!dialogState.agentId) return;
    try {
      const { error } = await supabase.from("agents").delete().eq("id", dialogState.agentId);
      if (error) throw error;
      toast.success("Agent deleted successfully!");
      await loadData();
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent.");
    } finally {
      setDialogState({ open: false, agentId: null });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>{editingAgent ? "Edit Agent" : "Create New Agent"}</CardTitle>
          <CardDescription>Define the core personality and capabilities of your AI agents.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Agent Name"
              value={formState.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              required
              className="glass"
            />
            <Select
              value={formState.prompt_id || ""}
              onValueChange={(value) => handleFormChange("prompt_id", value)}
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Prompt Template" />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((prompt) => (
                  <SelectItem key={prompt.id} value={prompt.id}>
                    {prompt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formState.model_id || ""}
              onValueChange={(value) => handleFormChange("model_id", value)}
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select AI Model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.display_name} ({model.provider_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formState.voice_id || ""}
              onValueChange={(value) => handleFormChange("voice_id", value)}
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name} ({voice.locale})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                id="agent-status"
                checked={formState.status === "active"}
                onCheckedChange={(checked) => handleFormChange("status", checked ? "active" : "inactive")}
              />
              <Label htmlFor="agent-status">Status: {formState.status}</Label>
            </div>
            <Textarea
              placeholder="Tool Policy (JSON)"
              value={JSON.stringify(formState.tool_policy, null, 2)}
              onChange={(e) => {
                try {
                  handleFormChange("tool_policy", JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON, do nothing
                }
              }}
              className="glass"
              rows={5}
            />
            <Textarea
              placeholder="VAD Config (JSON)"
              value={JSON.stringify(formState.vad_config, null, 2)}
              onChange={(e) => {
                try {
                  handleFormChange("vad_config", JSON.parse(e.target.value));
                } catch {
                  // Invalid JSON, do nothing
                }
              }}
              className="glass"
              rows={5}
            />
            <Button type="submit" disabled={isSubmitting} className="clay-button">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingAgent ? "Update Agent" : "Create Agent"}
            </Button>
            {editingAgent && (
              <Button variant="outline" onClick={() => { setEditingAgent(null); setFormState({ name: "", prompt_id: null, model_id: null, voice_id: null, status: "active", tool_policy: {}, vad_config: {} }); }} className="ml-2">
                Cancel Edit
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Existing Agents</CardTitle>
          <CardDescription>Manage your deployed AI agents.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Voice</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>{agent.status}</TableCell>
                    <TableCell>{prompts.find(p => p.id === agent.prompt_id)?.name || "N/A"}</TableCell>
                    <TableCell>{models.find(m => m.id === agent.model_id)?.display_name || "N/A"}</TableCell>
                    <TableCell>{voices.find(v => v.id === agent.voice_id)?.name || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(agent)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDialogState({ open: true, agentId: agent.id })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {agents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No agents found.
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
        title="Delete Agent?"
        description="This action cannot be undone. The agent will be permanently removed."
      />
    </div>
  );
}