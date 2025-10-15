import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card";
import { useToast } from "@/hooks/shared/ui/use-toast";
import { Loader2, RefreshCw, Database, Sparkles } from "lucide-react";
import { Badge } from "@/components/shared/ui/badge";

export default function ProviderManagement() {
  const { toast } = useToast();
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);

  const handleDiscoverProviders = async () => {
    setIsDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('provider-discovery');

      if (error) throw error;

      setDiscoveryResults(data.results);
      toast({
        title: "Discovery Complete!",
        description: `Synced ${data.results.providers} providers, ${data.results.models} models, ${data.results.voices} voices`,
      });

      // Refresh providers list
      loadProviders();
    } catch (error) {
      console.error('Error discovering providers:', error);
      toast({
        title: "Discovery Failed",
        description: error instanceof Error ? error.message : "Failed to discover providers",
        variant: "destructive",
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const loadProviders = async () => {
    setIsLoadingProviders(true);
    try {
      const { data, error } = await supabase
        .from('providers')
        .select(`
          *,
          models:models(count),
          voices:voices(count)
        `)
        .order('name');

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  useState(() => {
    loadProviders();
  });

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
              <Sparkles className="h-5 w-5 text-green-500" />
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
          providers.map((provider) => (
            <Card key={provider.id} className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Database className="h-6 w-6 text-primary" />
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
                      {provider.models?.[0]?.count || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Voices:</span>
                    <Badge variant="outline">
                      {provider.voices?.[0]?.count || 0}
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
          ))
        )}
      </div>
    </div>
  );
}
