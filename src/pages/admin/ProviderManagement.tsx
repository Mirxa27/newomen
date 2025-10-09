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
import { RefreshCw, Plus, Loader2, Search, ShieldCheck, Edit, Trash2 } from "lucide-react";
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

export default function ProvidersManagement() {
  const { toast } = useToast();
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<any>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadProviders = useCallback(async () => {
    setIsLoadingProviders(true);
    try {
      const [providersData, modelsData, voicesData] = await Promise.all([
        supabase.from("providers").select("*").order("name"),
        supabase.from("models").select("*, providers(name)").order("display_name"),
        supabase.from("voices").select("*, providers(name)").order("name"),
      ]);

      if (providersData.error) throw providersData.error;
      if (modelsData.error) throw modelsData.error;
      if (voicesData.error) throw voicesData.error;

      setProviders((providersData.data as any[]) || []);
      setModels((modelsData.data as any[]) || []);
      setVoices((voicesData.data as any[]) || []);
    } catch (error) {
      console.error("Error loading providers:", error);
      toast({
        title: "Unable to load providers",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProviders(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const handleDiscoverProviders = async () => {
    setIsDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke("provider-discovery", {
        body: { action: "sync" },
      });
      if (error) throw error;
      setDiscoveryResults(data.results);
      toast({
        title: "Discovery Complete!",
        description: `Synced ${data.results.providers} providers, ${data.results.models} models, ${data.results.voices} voices`,
      });
      loadProviders();
    } catch (error) {
      console.error("Error discovering providers:", error);
      toast({
        title: "Discovery Failed",
        description: error instanceof Error ? error.message : "Failed to discover providers",
        variant: "destructive",
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const openEditDialog = (item: Provider | Model | Voice, type: "provider" | "model" | "voice") => {
    console.log("Edit dialog open for", type, item);
  };

  const confirmDelete = (item: { id: string; name: string }, type: "provider" | "model" | "voice") => {
    console.log("Confirm delete for", type, item);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Provider Management</h2>
          <p className="text-muted-foreground mt-1">
            Discover and sync AI models and voices from providers
          </p>
        </div>
        <Button
          onClick={handleDiscoverProviders}
          disabled={isDiscovering}
          className="clay-button bg-gradient-to-r from-primary to-accent"
        >
          {isDiscovering ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Discovering...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Discover Providers
            </>
          )}
        </Button>
      </div>

      {discoveryResults && (
        <Card className="glass-card border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              Last Discovery Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">
                  {discoveryResults.providers}
                </div>
                <div className="text-sm text-muted-foreground">Providers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">
                  {discoveryResults.models}
                </div>
                <div className="text-sm text-muted-foreground">Models</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">
                  {discoveryResults.voices}
                </div>
                <div className="text-sm text-muted-foreground">Voices</div>
              </div>
            </div>
            {discoveryResults.errors && discoveryResults.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-yellow-500 mb-2">Errors:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {discoveryResults.errors.map((error: string, idx: number) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoadingProviders ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          providers.map((provider) => {
            const modelCount = providerStats.modelMap[provider.id] || 0;
            const voiceCount = providerStats.voiceMap[provider.id] || 0;
            return (
              <Card key={provider.id} className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{provider.name}</CardTitle>
                        <CardDescription>
                          Type: {provider.type.toUpperCase()} • 
                          Last synced: {provider.last_synced_at ? new Date(provider.last_synced_at).toLocaleDateString() : 'Never'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                      {provider.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Models:</span>
                      <Badge variant="outline">
                        {modelCount}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Voices:</span>
                      <Badge variant="outline">
                        {voiceCount}
                      </Badge>
                    </div>
                    {provider.api_base && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">API:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {provider.api_base}
                        </code>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}