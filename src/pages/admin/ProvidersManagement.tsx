import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCw, Plus, Loader2, Search, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Provider {
  id: string;
  name: string;
  type: string;
  api_base: string | null;
  region: string | null;
  status: string;
  last_synced_at: string | null;
}

interface Model {
  id: string;
  provider_id: string;
  model_id: string;
  display_name: string;
  modality: string | null;
  context_limit: number | null;
  latency_hint_ms: number | null;
  is_realtime: boolean;
  enabled: boolean;
}

interface Voice {
  id: string;
  provider_id: string;
  voice_id: string;
  name: string;
  locale: string | null;
  gender: string | null;
  latency_hint_ms: number | null;
  enabled: boolean;
}

type ProviderFormState = {
  name: string;
  type: string;
  api_key: string;
  api_base: string;
  region: string;
};


const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unexpected error";
};

const PROVIDER_TYPES = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Google Gemini" },
  { value: "azure", label: "Azure OpenAI" },
  { value: "elevenlabs", label: "ElevenLabs" },
];

export default function ProvidersManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [newProvider, setNewProvider] = useState<ProviderFormState>({
    name: "",
    type: "openai",
    api_key: "",
    api_base: "",
    region: "",
  });

  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const [providersData, modelsData, voicesData] = await Promise.all([
        supabase.from("providers").select("*").order("name"),
        supabase.from("models").select("*").order("display_name"),
        supabase.from("voices").select("*").order("name"),
      ]);

      if (providersData.error) throw providersData.error;
      if (modelsData.error) throw modelsData.error;
      if (voicesData.error) throw voicesData.error;

      setProviders(providersData.data || []);
      setModels(modelsData.data || []);
      setVoices(voicesData.data || []);
    } catch (error: unknown) {
      console.error("Error loading providers:", error);
      toast({
        title: "Unable to load providers",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const invokeProviderFunction = async (payload: Record<string, unknown>) => {
    try {
      // Try the main provider-discovery function first
      return await supabase.functions.invoke("provider-discovery", {
        body: payload,
      });
    } catch (error) {
      console.warn("Main provider-discovery failed, trying simplified version:", error);
      // Fallback to simplified version
      return await supabase.functions.invoke("provider-discovery-simple", {
        body: payload,
      });
    }
  };

  const addProvider = async () => {
    if (!newProvider.name.trim() || !newProvider.api_key.trim()) {
      toast({
        title: "Missing details",
        description: "Provider name and API key are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await invokeProviderFunction({
        action: "create",
        provider: {
          name: newProvider.name.trim(),
          type: newProvider.type,
          apiKey: newProvider.api_key.trim(),
          apiBase: newProvider.api_base.trim() || getDefaultApiBase(newProvider.type),
          region: newProvider.region.trim() || null,
        },
      });

      if (response.error) throw response.error;

      const summary = response.data as { providerId: string; modelsCount: number; voicesCount: number };
      toast({
        title: "Provider connected",
        description: `Discovered ${summary.modelsCount} models and ${summary.voicesCount} voices`,
      });

      setDialogOpen(false);
      setNewProvider({ name: "", type: "openai", api_key: "", api_base: "", region: "" });
      loadProviders();
    } catch (error: unknown) {
      console.error("Error adding provider:", error);
      toast({
        title: "Failed to connect provider",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const syncProvider = async (providerId: string, providerType: string) => {
    setSyncing(providerId);
    try {
      const response = await invokeProviderFunction({
        action: "sync",
        providerId,
        providerType,
      });

      if (response.error) throw response.error;
      const summary = response.data as { modelsCount: number; voicesCount: number };

      toast({
        title: "Provider synced",
        description: `Found ${summary.modelsCount} models and ${summary.voicesCount} voices`,
      });

      loadProviders();
    } catch (error: unknown) {
      console.error("Error syncing provider:", error);
      toast({
        title: "Sync failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSyncing(null);
    }
  };

  const getDefaultApiBase = (type: string) => {
    const defaults: Record<string, string> = {
      openai: "https://api.openai.com/v1",
      anthropic: "https://api.anthropic.com",
      gemini: "https://generativelanguage.googleapis.com/v1beta",
      azure: "",
      elevenlabs: "https://api.elevenlabs.io/v1",
    };
    return defaults[type] || "";
  };

  const filteredProviders = useMemo(() => {
    if (!searchTerm.trim()) return providers;
    const term = searchTerm.toLowerCase();
    return providers.filter((provider) => provider.name.toLowerCase().includes(term));
  }, [providers, searchTerm]);

  const providerStats = useMemo(() => {
    const modelMap = models.reduce<Record<string, number>>((acc, model) => {
      acc[model.provider_id] = (acc[model.provider_id] || 0) + 1;
      return acc;
    }, {});
    const voiceMap = voices.reduce<Record<string, number>>((acc, voice) => {
      acc[voice.provider_id] = (acc[voice.provider_id] || 0) + 1;
      return acc;
    }, {});
    return { modelMap, voiceMap };
  }, [models, voices]);

  return (
    <div className="space-y-6">
      <Card className="glass-card border-white/10">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl gradient-text">AI Providers</CardTitle>
              <CardDescription>
                Connect and monitor the third-party AI services powering Newomen
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search providers..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="clay-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Provider
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-white/10 max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="gradient-text">Connect a new provider</DialogTitle>
                    <DialogDescription>
                      API credentials are encrypted at rest using your Supabase database key.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="provider-name">Provider Name</Label>
                      <Input
                        id="provider-name"
                        placeholder="e.g. Primary OpenAI workspace"
                        value={newProvider.name}
                        onChange={(event) => setNewProvider((prev) => ({ ...prev, name: event.target.value }))}
                        className="glass"
                      />
                    </div>
                    <div>
                      <Label htmlFor="provider-type">Provider Type</Label>
                      <Select
                        value={newProvider.type}
                        onValueChange={(value) => setNewProvider((prev) => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="glass">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVIDER_TYPES.map((provider) => (
                            <SelectItem key={provider.value} value={provider.value}>
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="provider-key">API Key</Label>
                      <Input
                        id="provider-key"
                        type="password"
                        placeholder="sk-..."
                        value={newProvider.api_key}
                        onChange={(event) => setNewProvider((prev) => ({ ...prev, api_key: event.target.value }))}
                        className="glass"
                      />
                    </div>
                    <div>
                      <Label htmlFor="provider-base">API Base URL (optional)</Label>
                      <Input
                        id="provider-base"
                        placeholder={getDefaultApiBase(newProvider.type) || "https://"}
                        value={newProvider.api_base}
                        onChange={(event) => setNewProvider((prev) => ({ ...prev, api_base: event.target.value }))}
                        className="glass"
                      />
                    </div>
                    <div>
                      <Label htmlFor="provider-region">Region (optional)</Label>
                      <Input
                        id="provider-region"
                        placeholder="us-east-1"
                        value={newProvider.region}
                        onChange={(event) => setNewProvider((prev) => ({ ...prev, region: event.target.value }))}
                        className="glass"
                      />
                    </div>
                    <div className="rounded-lg border border-dashed border-white/20 bg-muted/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
                      <span>
                        Keys are encrypted with the database secret (<code>app.settings.provider_encryption_key</code>). Make
                        sure this value is configured before connecting providers.
                      </span>
                    </div>
                    <Button onClick={addProvider} className="w-full" disabled={loading}>
                      Connect & Discover
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Models</TableHead>
                    <TableHead>Voices</TableHead>
                    <TableHead>Last Synced</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.map((provider) => {
                    const modelCount = providerStats.modelMap[provider.id] || 0;
                    const voiceCount = providerStats.voiceMap[provider.id] || 0;
                    return (
                      <TableRow key={provider.id}>
                        <TableCell className="font-medium">{provider.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{provider.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={provider.status === "active" ? "default" : "secondary"}>
                            {provider.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{modelCount}</TableCell>
                        <TableCell>{voiceCount}</TableCell>
                        <TableCell>
                          {provider.last_synced_at
                            ? new Date(provider.last_synced_at).toLocaleString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => syncProvider(provider.id, provider.type)}
                            disabled={syncing === provider.id}
                          >
                            {syncing === provider.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredProviders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No providers yet. Connect one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="gradient-text">Discovered Models</CardTitle>
          <CardDescription>Models available from connected providers</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead>Context</TableHead>
                  <TableHead>Realtime</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.slice(0, 15).map((model) => {
                  const provider = providers.find((p) => p.id === model.provider_id);
                  return (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.display_name}</TableCell>
                      <TableCell>{provider?.name ?? "-"}</TableCell>
                      <TableCell>{model.modality || "text"}</TableCell>
                      <TableCell>{model.context_limit?.toLocaleString() || "N/A"}</TableCell>
                      <TableCell>
                        {model.is_realtime ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={model.enabled ? "default" : "secondary"}>
                          {model.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {models.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Models will appear here after connecting a provider.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>

      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="gradient-text">Discovered Voices</CardTitle>
          <CardDescription>Voices fetched from connected TTS providers</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveTable>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voice</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Locale</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voices.slice(0, 15).map((voice) => {
                  const provider = providers.find((p) => p.id === voice.provider_id);
                  return (
                    <TableRow key={voice.id}>
                      <TableCell className="font-medium">{voice.name}</TableCell>
                      <TableCell>{provider?.name ?? "-"}</TableCell>
                      <TableCell>{voice.locale || "N/A"}</TableCell>
                      <TableCell>{voice.gender || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={voice.enabled ? "default" : "secondary"}>
                          {voice.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {voices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Connect a TTS provider to sync voices.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ResponsiveTable>
        </CardContent>
      </Card>
    </div>
  );
}
