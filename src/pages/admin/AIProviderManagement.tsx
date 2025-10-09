import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Edit, Trash2, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Providers } from "@/integrations/supabase/tables/providers";
import { Models } from "@/integrations/supabase/tables/models";
import { Voices } from "@/integrations/supabase/tables/voices";

type Provider = Providers;
type Model = Models;
type Voice = Voices;

interface ProviderFormState {
  id?: string;
  name: string;
  type: string;
  apiKey: string;
}

interface ModelFormState {
  id?: string;
  provider_id: string;
  model_id: string;
  display_name: string;
  modality: string;
  context_limit: number;
  latency_hint_ms: number;
  is_realtime: boolean;
  enabled: boolean;
}

interface VoiceFormState {
  id?: string;
  provider_id: string;
  voice_id: string;
  name: string;
  locale: string;
  gender: string;
  latency_hint_ms: number;
  enabled: boolean;
}

export default function AIProviderManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [providerForm, setProviderForm] = useState<ProviderFormState>({ name: "", type: "llm", apiKey: "" });
  const [modelForm, setModelForm] = useState<ModelFormState>({
    provider_id: "", model_id: "", display_name: "", modality: "text", context_limit: 4096, latency_hint_ms: 500, is_realtime: false, enabled: true
  });
  const [voiceForm, setVoiceForm] = useState<VoiceFormState>({
    provider_id: "", voice_id: "", name: "", locale: "en-US", gender: "female", latency_hint_ms: 200, enabled: true
  });

  const [dialogState, setDialogState] = useState<{ open: boolean; type: 'provider' | 'model' | 'voice'; id: string | null }>({ open: false, type: 'provider', id: null });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: providersData, error: providersError },
        { data: modelsData, error: modelsError },
        { data: voicesData, error: voicesError },
      ] = await Promise.all([
        supabase.from("providers").select("*").order("created_at", { ascending: false }),
        supabase.from("models").select("*").order("created_at", { ascending: false }),
        supabase.from("voices").select("*").order("created_at", { ascending: false }),
      ]);

      if (providersError) throw providersError;
      if (modelsError) throw modelsError;
      if (voicesError) throw voicesError;

      setProviders(providersData || []);
      setModels(modelsData || []);
      setVoices(voicesData || []);
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

  const handleProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const providerPayload: Providers['Insert'] = {
        id: providerForm.id,
        name: providerForm.name,
        type: providerForm.type,
      };

      const { data: insertedProvider, error } = await supabase
        .from("providers")
        .upsert(providerPayload, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;

      if (providerForm.apiKey && insertedProvider) {
        const { error: keyError } = await supabase.rpc("store_provider_api_key", {
          p_provider_id: insertedProvider.id,
          p_api_key: providerForm.apiKey,
        });
        if (keyError) throw keyError;
      }

      toast.success("AI Provider saved!");
      setProviderForm({ name: "", type: "llm", apiKey: "" });
      await loadData();
    } catch (error) {
      console.error("Error saving provider:", error);
      toast.error("Failed to save AI provider.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const modelPayload: Models['Insert'] = {
        id: modelForm.id,
        provider_id: modelForm.provider_id,
        model_id: modelForm.model_id,
        display_name: modelForm.display_name,
        modality: modelForm.modality,
        context_limit: modelForm.context_limit,
        latency_hint_ms: modelForm.latency_hint_ms,
        is_realtime: modelForm.is_realtime,
        enabled: modelForm.enabled,
      };
      if (!modelPayload.model_id || !modelPayload.provider_id || !modelPayload.display_name) throw new Error("Model ID, Display Name, and Provider are required.");
      const { error } = await supabase.from("models").upsert(modelPayload);
      if (error) throw error;
      toast.success("AI Model saved!");
      setModelForm({
        provider_id: "", model_id: "", display_name: "", modality: "text", context_limit: 4096, latency_hint_ms: 500, is_realtime: false, enabled: true
      });
      await loadData();
    } catch (error) {
      console.error("Error saving model:", error);
      toast.error("Failed to save AI model.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const voicePayload: Voices['Insert'] = {
        id: voiceForm.id,
        provider_id: voiceForm.provider_id,
        voice_id: voiceForm.voice_id,
        name: voiceForm.name,
        locale: voiceForm.locale,
        gender: voiceForm.gender,
        latency_hint_ms: voiceForm.latency_hint_ms,
        enabled: voiceForm.enabled,
      };
      if (!voicePayload.name || !voicePayload.voice_id || !voicePayload.provider_id) throw new Error("Voice name, ID, and provider are required.");
      const { error } = await supabase.from("voices").upsert(voicePayload);
      if (error) throw error;
      toast.success("AI Voice saved!");
      setVoiceForm({
        provider_id: "", voice_id: "", name: "", locale: "en-US", gender: "female", latency_hint_ms: 200, enabled: true
      });
      await loadData();
    } catch (error) {
      console.error("Error saving voice:", error);
      toast.error("Failed to save AI voice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!dialogState.id) return;
    try {
      let error;
      if (dialogState.type === 'provider') {
        ({ error } = await supabase.from("providers").delete().eq("id", dialogState.id));
      } else if (dialogState.type === 'model') {
        ({ error } = await supabase.from("models").delete().eq("id", dialogState.id));
      } else if (dialogState.type === 'voice') {
        ({ error } = await supabase.from("voices").delete().eq("id", dialogState.id));
      }
      if (error) throw error;
      toast.success(`${dialogState.type.charAt(0).toUpperCase() + dialogState.type.slice(1)} deleted!`);
      await loadData();
    } catch (error) {
      console.error(`Error deleting ${dialogState.type}:`, error);
      toast.error(`Failed to delete ${dialogState.type}.`);
    } finally {
      setDialogState({ open: false, type: 'provider', id: null });
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
          <CardTitle>Manage AI Providers</CardTitle>
          <CardDescription>Add, edit, and remove AI service providers.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProviderSubmit} className="space-y-4">
            <Input
              placeholder="Provider Name (e.g., OpenAI, Anthropic)"
              value={providerForm.name}
              onChange={(e) => setProviderForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="glass"
            />
            <Select
              value={providerForm.type}
              onValueChange={(value) => setProviderForm((prev) => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llm">LLM</SelectItem>
                <SelectItem value="tts">TTS</SelectItem>
                <SelectItem value="stt">STT</SelectItem>
                <SelectItem value="embedding">Embedding</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="password"
              placeholder="API Key (will be encrypted)"
              value={providerForm.apiKey}
              onChange={(e) => setProviderForm((prev) => ({ ...prev, apiKey: e.target.value }))}
              className="glass"
            />
            <Button type="submit" disabled={isSubmitting} className="clay-button">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Provider
            </Button>
          </form>
          <ResponsiveTable className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell>{provider.type}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setDialogState({ open: true, type: 'provider', id: provider.id })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {providers.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No providers found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Manage AI Models</CardTitle>
          <CardDescription>Configure models available from your providers.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleModelSubmit} className="space-y-4">
            <Select
              value={modelForm.provider_id}
              onValueChange={(value) => setModelForm((prev) => ({ ...prev, provider_id: value }))}
              required
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Model ID (e.g., gpt-4o, claude-3-opus-20240229)"
              value={modelForm.model_id}
              onChange={(e) => setModelForm((prev) => ({ ...prev, model_id: e.target.value }))}
              required
              className="glass"
            />
            <Input
              placeholder="Display Name"
              value={modelForm.display_name}
              onChange={(e) => setModelForm((prev) => ({ ...prev, display_name: e.target.value }))}
              required
              className="glass"
            />
            <Select
              value={modelForm.modality}
              onValueChange={(value) => setModelForm((prev) => ({ ...prev, modality: value }))}
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Modality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="vision">Vision</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Context Limit"
              value={modelForm.context_limit}
              onChange={(e) => setModelForm((prev) => ({ ...prev, context_limit: Number(e.target.value) }))}
              className="glass"
            />
            <Input
              type="number"
              placeholder="Latency Hint (ms)"
              value={modelForm.latency_hint_ms}
              onChange={(e) => setModelForm((prev) => ({ ...prev, latency_hint_ms: Number(e.target.value) }))}
              className="glass"
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="model-realtime"
                checked={modelForm.is_realtime}
                onCheckedChange={(checked) => setModelForm((prev) => ({ ...prev, is_realtime: checked }))}
              />
              <Label htmlFor="model-realtime">Realtime</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="model-enabled"
                checked={modelForm.enabled}
                onCheckedChange={(checked) => setModelForm((prev) => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="model-enabled">Enabled</Label>
            </div>
            <Button type="submit" disabled={isSubmitting} className="clay-button">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Model
            </Button>
          </form>
          <ResponsiveTable className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Model ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.display_name}</TableCell>
                    <TableCell>{model.model_id}</TableCell>
                    <TableCell>{providers.find(p => p.id === model.provider_id)?.name || "N/A"}</TableCell>
                    <TableCell>{model.modality}</TableCell>
                    <TableCell>{model.enabled ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setDialogState({ open: true, type: 'model', id: model.id })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {models.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No models found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Manage AI Voices</CardTitle>
          <CardDescription>Configure voices available from your providers.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVoiceSubmit} className="space-y-4">
            <Select
              value={voiceForm.provider_id}
              onValueChange={(value) => setVoiceForm((prev) => ({ ...prev, provider_id: value }))}
              required
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Voice ID (e.g., 'alloy', 'echo')"
              value={voiceForm.voice_id}
              onChange={(e) => setVoiceForm((prev) => ({ ...prev, voice_id: e.target.value }))}
              required
              className="glass"
            />
            <Input
              placeholder="Voice Name (e.g., 'Standard Female 1')"
              value={voiceForm.name}
              onChange={(e) => setVoiceForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              className="glass"
            />
            <Input
              placeholder="Locale (e.g., en-US)"
              value={voiceForm.locale}
              onChange={(e) => setVoiceForm((prev) => ({ ...prev, locale: e.target.value }))}
              className="glass"
            />
            <Select
              value={voiceForm.gender}
              onValueChange={(value) => setVoiceForm((prev) => ({ ...prev, gender: value }))}
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Latency Hint (ms)"
              value={voiceForm.latency_hint_ms}
              onChange={(e) => setVoiceForm((prev) => ({ ...prev, latency_hint_ms: Number(e.target.value) }))}
              className="glass"
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="voice-enabled"
                checked={voiceForm.enabled}
                onCheckedChange={(checked) => setVoiceForm((prev) => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="voice-enabled">Enabled</Label>
            </div>
            <Button type="submit" disabled={isSubmitting} className="clay-button">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Voice
            </Button>
          </form>
          <ResponsiveTable className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Voice ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Locale</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voices.map((voice) => (
                  <TableRow key={voice.id}>
                    <TableCell className="font-medium">{voice.name}</TableCell>
                    <TableCell>{voice.voice_id}</TableCell>
                    <TableCell>{providers.find(p => p.id === voice.provider_id)?.name || "N/A"}</TableCell>
                    <TableCell>{voice.locale}</TableCell>
                    <TableCell>{voice.enabled ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setDialogState({ open: true, type: 'voice', id: voice.id })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {voices.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No voices found.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState({ ...dialogState, open })}
        onConfirm={handleDelete}
        title={`Delete ${dialogState.type.charAt(0).toUpperCase() + dialogState.type.slice(1)}?`}
        description="This action cannot be undone."
      />
    </div>
  );
}