import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Settings, Mic } from "lucide-react";

export default function AIConfiguration() {
  const [providers, setProviders] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [voices, setVoices] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [providersData, modelsData, voicesData, agentsData] = await Promise.all([
        supabase.from("providers").select("*"),
        supabase.from("models").select("*, providers(name)"),
        supabase.from("voices").select("*, providers(name)"),
        supabase.from("agents").select("*, prompts(name), models(display_name), voices(name)")
      ]);

      setProviders(providersData.data || []);
      setModels(modelsData.data || []);
      setVoices(voicesData.data || []);
      setAgents(agentsData.data || []);
    } catch (error) {
      console.error("Error loading AI configuration:", error);
      toast.error("Failed to load AI configuration");
    } finally {
      setLoading(false);
    }
  };

  const syncProvider = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;
    
    toast.loading(`Syncing ${provider.name}...`);
    
    try {
      // Simulate API call to sync provider data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update last_synced timestamp
      const { error } = await supabase
        .from("providers")
        .update({ 
          last_synced: new Date().toISOString(),
          is_active: true 
        })
        .eq("id", providerId);
      
      if (error) throw error;
      
      toast.success(`${provider.name} synced successfully`);
      loadProviders();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error(`Failed to sync ${provider.name}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Providers</CardTitle>
          <CardDescription>Manage AI provider integrations and credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Synced</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell>{provider.type}</TableCell>
                  <TableCell>{provider.region || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={provider.status === "active" ? "default" : "secondary"}>
                      {provider.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {provider.last_synced_at
                      ? new Date(provider.last_synced_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => syncProvider(provider.id)}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Models</CardTitle>
          <CardDescription>Available AI models from connected providers</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Modality</TableHead>
                <TableHead>Realtime</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.display_name}</TableCell>
                  <TableCell>{model.providers?.name}</TableCell>
                  <TableCell>{model.modality}</TableCell>
                  <TableCell>
                    <Badge variant={model.is_realtime ? "default" : "secondary"}>
                      {model.is_realtime ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={model.enabled ? "default" : "secondary"}>
                      {model.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Voices</CardTitle>
          <CardDescription>Available voices for text-to-speech</CardDescription>
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
              {voices.map((voice) => (
                <TableRow key={voice.id}>
                  <TableCell className="font-medium">{voice.name}</TableCell>
                  <TableCell>{voice.providers?.name}</TableCell>
                  <TableCell>{voice.locale || "N/A"}</TableCell>
                  <TableCell>{voice.gender || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={voice.enabled ? "default" : "secondary"}>
                      {voice.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agents</CardTitle>
          <CardDescription>Configure AI agents with models, voices, and prompts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Voice</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.models?.display_name || "N/A"}</TableCell>
                  <TableCell>{agent.voices?.name || "N/A"}</TableCell>
                  <TableCell>{agent.prompts?.name || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
