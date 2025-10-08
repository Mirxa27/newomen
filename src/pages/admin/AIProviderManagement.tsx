import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { toast } from "sonner";
import { Loader2, Plus, Edit, Trash2, KeyRound, Server, Cpu, CaseSensitive } from "lucide-react";

type Provider = Database["public"]["Tables"]["providers"]["Row"];
type Model = Database["public"]["Tables"]["models"]["Row"];
type Voice = Database["public"]["Tables"]["voices"]["Row"];

type FormState<T> = Partial<T> & { type: "provider" | "model" | "voice" };

export default function AIProviderManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: "provider" | "model" | "voice" } | null>(null);
  const [formState, setFormState] = useState<FormState<Provider | Model | Voice> | null>(null);
  const [apiKey, setApiKey] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [providersRes, modelsRes, voicesRes] = await Promise.all([
        supabase.from("providers").select("*").order("name"),
        supabase.from("models").select("*, providers(name)").order("display_name"),
        supabase.from("voices").select("*, providers(name)").order("name"),
      ]);

      if (providersRes.error) throw providersRes.error;
      if (modelsRes.error) throw modelsRes.error;
      if (voicesRes.error) throw voicesRes.error;

      setProviders(providersRes.data || []);
      setModels(modelsRes.data || []);
      setVoices(voicesRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load AI provider data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openNewDialog = (type: "provider" | "model" | "voice") => {
    setApiKey("");
    if (type === "provider") {
      setFormState({ type: "provider", name: "" });
    } else if (type === "model") {
      setFormState({ type: "model", model_id: "", display_name: "", provider_id: "" });
    } else {
      setFormState({ type: "voice", name: "", voice_id: "", provider_id: "", gender: "female", enabled: true });
    }
    setDialogOpen(true);
  };

  const openEditDialog = (item: Provider | Model | Voice, type: "provider" | "model" | "voice") => {
    setApiKey("");
    setFormState({ ...item, type });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formState) return;
    setSaving(true);

    try {
      const { type, ...payload } = formState;

      if (type === "provider") {
        const providerPayload = payload as Partial<Provider>;
        if (!providerPayload.name) throw new Error("Provider name is required.");

        const { data: insertedProvider, error } = await supabase
          .from("providers")
          .upsert({ id: providerPayload.id, name: providerPayload.name, type: providerPayload.type || 'llm' })
          .select()
          .single();

        if (error) throw error;

        if (apiKey && insertedProvider) {
          const { error: keyError } = await supabase.rpc("store_provider_api_key", {
            p_provider_id: insertedProvider.id,
            p_api_key: apiKey,
          });
          if (keyError) throw new Error(`Failed to save API key: ${keyError.message}`);
        }
      } else if (type === "model") {
        const modelPayload = payload as Partial<Model>;
        if (!modelPayload.model_id || !modelPayload.provider_id || !modelPayload.display_name) throw new Error("Model ID, Display Name, and Provider are required.");
        const { error } = await supabase.from("models").upsert(modelPayload as Model);
        if (error) throw error;
      } else if (type === "voice") {
        const voicePayload = payload as Partial<Voice>;
        if (!voicePayload.name || !voicePayload.voice_id || !voicePayload.provider_id) throw new Error("Voice name, ID, and provider are required.");
        const { error } = await supabase.from("voices").upsert(voicePayload as Voice);
        if (error) throw error;
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} saved successfully!`);
      setDialogOpen(false);
      void loadData();
    } catch (error) {
      console.error("Error saving:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Save failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: { id: string; name: string }, type: "provider" | "model" | "voice") => {
    setItemToDelete({ ...item, type });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    const { id, name, type } = itemToDelete;

    try {
      let error;
      if (type === "provider") {
        ({ error } = await supabase.from("providers").delete().eq("id", id));
      } else if (type === "model") {
        ({ error } = await supabase.from("models").delete().eq("id", id));
      } else {
        ({ error } = await supabase.from("voices").delete().eq("id", id));
      }
      if (error) throw error;
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} '${name}' deleted successfully!`);
      void loadData();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(`Failed to delete ${type}.`);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const renderDialogContent = () => {
    if (!formState) return null;

    switch (formState.type) {
      case "provider": {
        const providerState = formState as Partial<Provider>;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider-name">Provider Name</Label>
              <Input
                id="provider-name"
                value={providerState.name || ""}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="e.g., OpenAI"
              />
            </div>
            <div>
              <Label htmlFor="api-key">API Key (Optional)</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Leave blank to keep existing key"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Key is write-only and will be encrypted at rest.
              </p>
            </div>
          </div>
        );
      }
      case "model": {
        const modelState = formState as Partial<Model>;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="model-provider">Provider</Label>
              <select
                id="model-provider"
                value={modelState.provider_id || ""}
                onChange={(e) => setFormState({ ...formState, provider_id: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Select a provider</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="model-id">Model ID</Label>
              <Input
                id="model-id"
                value={modelState.model_id || ""}
                onChange={(e) => setFormState({ ...formState, model_id: e.target.value })}
                placeholder="e.g., gpt-4o"
              />
            </div>
            <div>
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={modelState.display_name || ""}
                onChange={(e) => setFormState({ ...formState, display_name: e.target.value })}
                placeholder="e.g., GPT-4 Omni"
              />
            </div>
          </div>
        );
      }
      case "voice": {
        const voiceState = formState as Partial<Voice>;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="voice-provider">Provider</Label>
              <select
                id="voice-provider"
                value={voiceState.provider_id || ""}
                onChange={(e) => setFormState({ ...formState, provider_id: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="">Select a provider</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="voice-name">Voice Name</Label>
              <Input
                id="voice-name"
                value={voiceState.name || ""}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder="e.g., Nova"
              />
            </div>
            <div>
              <Label htmlFor="voice-id">Voice ID</Label>
              <Input
                id="voice-id"
                value={voiceState.voice_id || ""}
                onChange={(e) => setFormState({ ...formState, voice_id: e.target.value })}
                placeholder="e.g., a_voice_id_from_provider"
              />
            </div>
            <div>
              <Label htmlFor="voice-gender">Gender</Label>
              <select
                id="voice-gender"
                value={voiceState.gender || "female"}
                onChange={(e) => setFormState({ ...formState, gender: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="voice-enabled"
                checked={voiceState.enabled}
                onCheckedChange={(checked) => setFormState({ ...formState, enabled: checked })}
              />
              <Label htmlFor="voice-enabled">Enabled</Label>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold gradient-text">AI Provider Management</h1>
      <p className="text-muted-foreground">
        Manage AI providers, models, and voices available to the platform.
      </p>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Providers */}
          <Card className="glass-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5 text-primary" /> Providers</CardTitle>
              <Button onClick={() => openNewDialog("provider")} size="sm" className="absolute top-4 right-4">
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(p, "provider")}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete({ id: p.id, name: p.name || '' }, "provider")}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Models */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cpu className="w-5 h-5 text-primary" /> Models</CardTitle>
              <Button onClick={() => openNewDialog("model")} size="sm" className="absolute top-4 right-4">
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Model ID</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.display_name}</TableCell>
                      <TableCell className="font-mono text-xs">{m.model_id}</TableCell>
                      <TableCell>{(m as { providers?: { name: string } }).providers?.name}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(m, "model")}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete({ id: m.id, name: m.display_name || m.model_id || '' }, "model")}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Voices */}
          <Card className="glass-card lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CaseSensitive className="w-5 h-5 text-primary" /> Voices</CardTitle>
              <Button onClick={() => openNewDialog("voice")} size="sm" className="absolute top-4 right-4">
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Voice ID</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voices.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.name}</TableCell>
                      <TableCell className="font-mono text-xs">{v.voice_id}</TableCell>
                      <TableCell>{(v as { providers?: { name: string } }).providers?.name}</TableCell>
                      <TableCell>{v.gender}</TableCell>
                      <TableCell>{v.enabled ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(v, "voice")}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete({ id: v.id, name: v.name || '' }, "voice")}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>
              {formState?.id ? "Edit" : "Create"} {formState?.type}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for the AI resource.
            </DialogDescription>
          </DialogHeader>
          {renderDialogContent()}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Delete ${itemToDelete?.type}`}
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}