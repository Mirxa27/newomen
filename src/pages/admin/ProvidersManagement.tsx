import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Provider = {
  id: string;
  name: string;
  type: string;
  api_base: string;
  region: string | null;
  status: string;
  last_synced_at: string | null;
};

type Model = {
  id: string;
  provider_id: string;
  model_id: string;
  display_name: string;
  modality: string | null;
  context_limit: number | null;
  latency_hint_ms: number | null;
  is_realtime: boolean;
  enabled: boolean;
};

type Voice = {
  id: string;
  provider_id: string;
  voice_id: string;
  name: string;
  locale: string | null;
  gender: string | null;
  latency_hint_ms: number | null;
  enabled: boolean;
};

export default function ProvidersManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form states
  const [newProvider, setNewProvider] = useState({
    name: "",
    type: "openai",
    api_key: "",
    api_base: "",
    region: "",
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const { data: providersData, error: providersError } = await supabase
        .from("providers")
        .select("*")
        .order("name");

      if (providersError) throw providersError;
      setProviders(providersData || []);

      // Load models and voices
      const { data: modelsData } = await supabase
        .from("models")
        .select("*")
        .order("display_name");
      
      const { data: voicesData } = await supabase
        .from("voices")
        .select("*")
        .order("name");

      setModels(modelsData || []);
      setVoices(voicesData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addProvider = async () => {
    if (!newProvider.name || !newProvider.api_key) {
      toast({
        title: "Error",
        description: "Name and API key are required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Insert provider
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .insert({
          name: newProvider.name,
          type: newProvider.type,
          api_base: newProvider.api_base || getDefaultApiBase(newProvider.type),
          region: newProvider.region || null,
          status: "active",
        })
        .select()
        .single();

      if (providerError) throw providerError;

      // Call edge function to discover and sync models/voices
      const { data, error } = await supabase.functions.invoke("discover-provider", {
        body: {
          provider_id: providerData.id,
          provider_type: newProvider.type,
          api_key: newProvider.api_key,
          api_base: newProvider.api_base || getDefaultApiBase(newProvider.type),
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Provider added and ${data.models_count} models, ${data.voices_count} voices discovered`,
      });

      setDialogOpen(false);
      setNewProvider({ name: "", type: "openai", api_key: "", api_base: "", region: "" });
      loadProviders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const syncProvider = async (providerId: string, providerType: string) => {
    setSyncing(providerId);
    try {
      const { data, error } = await supabase.functions.invoke("sync-provider", {
        body: { provider_id: providerId, provider_type: providerType },
      });

      if (error) throw error;

      toast({
        title: "Sync Complete",
        description: `Synced ${data.models_count} models, ${data.voices_count} voices`,
      });

      loadProviders();
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message,
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
      polly: "",
    };
    return defaults[type] || "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Providers Section */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl gradient-text">AI Providers</CardTitle>
              <CardDescription>Manage AI service providers and credentials</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="clay-button">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/10">
                <DialogHeader>
                  <DialogTitle>Add AI Provider</DialogTitle>
                  <DialogDescription>
                    Configure a new AI provider. Models and voices will be auto-discovered.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Provider Name</Label>
                    <Input
                      id="name"
                      placeholder="My OpenAI Provider"
                      value={newProvider.name}
                      onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                      className="glass"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Provider Type</Label>
                    <Select
                      value={newProvider.type}
                      onValueChange={(value) => setNewProvider({ ...newProvider, type: value })}
                    >
                      <SelectTrigger className="glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="azure">Azure OpenAI</SelectItem>
                        <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                        <SelectItem value="polly">Amazon Polly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      type="password"
                      placeholder="sk-..."
                      value={newProvider.api_key}
                      onChange={(e) => setNewProvider({ ...newProvider, api_key: e.target.value })}
                      className="glass"
                    />
                  </div>
                  <div>
                    <Label htmlFor="api_base">API Base URL (Optional)</Label>
                    <Input
                      id="api_base"
                      placeholder="https://api.openai.com/v1"
                      value={newProvider.api_base}
                      onChange={(e) => setNewProvider({ ...newProvider, api_base: e.target.value })}
                      className="glass"
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">Region (Optional)</Label>
                    <Input
                      id="region"
                      placeholder="us-east-1"
                      value={newProvider.region}
                      onChange={(e) => setNewProvider({ ...newProvider, region: e.target.value })}
                      className="glass"
                    />
                  </div>
                  <Button onClick={addProvider} className="w-full clay-button">
                    Add & Discover Models
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
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
              {providers.map((provider) => {
                const providerModels = models.filter((m) => m.provider_id === provider.id);
                const providerVoices = voices.filter((v) => v.provider_id === provider.id);
                
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
                    <TableCell>{providerModels.length}</TableCell>
                    <TableCell>{providerVoices.length}</TableCell>
                    <TableCell>
                      {provider.last_synced_at
                        ? new Date(provider.last_synced_at).toLocaleDateString()
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
              {providers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No providers configured. Add your first provider to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Models Section */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="gradient-text">Discovered Models</CardTitle>
          <CardDescription>Models auto-discovered from configured providers</CardDescription>
        </CardHeader>
        <CardContent>
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
              {models.slice(0, 10).map((model) => {
                const provider = providers.find((p) => p.id === model.provider_id);
                
                return (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">{model.display_name}</TableCell>
                    <TableCell>{provider?.name}</TableCell>
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
                    No models discovered yet. Add a provider to auto-discover models.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {models.length > 10 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing 10 of {models.length} models
            </p>
          )}
        </CardContent>
      </Card>

      {/* Voices Section */}
      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="gradient-text">Discovered Voices</CardTitle>
          <CardDescription>Voices auto-discovered from configured providers</CardDescription>
        </CardHeader>
        <CardContent>
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
              {voices.slice(0, 10).map((voice) => {
                const provider = providers.find((p) => p.id === voice.provider_id);
                
                return (
                  <TableRow key={voice.id}>
                    <TableCell className="font-medium">{voice.name}</TableCell>
                    <TableCell>{provider?.name}</TableCell>
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
                    No voices discovered yet. Add a provider to auto-discover voices.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {voices.length > 10 && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Showing 10 of {voices.length} voices
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
