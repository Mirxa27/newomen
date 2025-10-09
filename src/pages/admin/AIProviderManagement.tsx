import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Provider = Tables<'providers'>;
type Model = Tables<'models'>;
type Voice = Tables<'voices'>;

export default function AIProviderManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);

  const [providerForm, setProviderForm] = useState<Partial<Provider> & { apiKey?: string }>({});
  const [modelForm, setModelForm] = useState<Partial<Model>>({});
  const [voiceForm, setVoiceForm] = useState<Partial<Voice>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: providersData, error: pError },
        { data: modelsData, error: mError },
        { data: voicesData, error: vError },
      ] = await Promise.all([
        supabase.from('providers').select('*'),
        supabase.from('models').select('*'),
        supabase.from('voices').select('*'),
      ]);
      if (pError) throw pError;
      if (mError) throw mError;
      if (vError) throw vError;
      setProviders(providersData || []);
      setModels(modelsData || []);
      setVoices(voicesData || []);
    } catch (e) {
      toast.error('Failed to load provider data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { apiKey, ...providerData } = providerForm;
      const providerPayload = providerData as TablesInsert<'providers'>;
      if (!providerPayload.name || !providerPayload.type) throw new Error("Provider Name and Type are required.");

      const { data: insertedProvider, error } = await supabase
        .from("providers")
        .upsert(providerPayload, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;

      if (apiKey && insertedProvider) {
        const { error: keyError } = await supabase.rpc("store_provider_api_key", {
          p_provider_id: insertedProvider.id,
          p_api_key: apiKey,
        });
        if (keyError) throw keyError;
      }
      toast.success("Provider saved!");
      await loadData();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const modelPayload = modelForm as TablesInsert<'models'>;
      if (!modelPayload.model_id || !modelPayload.provider_id || !modelPayload.display_name) throw new Error("Model ID, Display Name, and Provider are required.");
      const { error } = await supabase.from("models").upsert(modelPayload);
      if (error) throw error;
      toast.success("Model saved!");
      await loadData();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleVoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const voicePayload = voiceForm as TablesInsert<'voices'>;
      if (!voicePayload.name || !voicePayload.voice_id || !voicePayload.provider_id) throw new Error("Voice name, ID, and provider are required.");
      const { error } = await supabase.from("voices").upsert(voicePayload);
      if (error) throw error;
      toast.success("Voice saved!");
      await loadData();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Manage Providers</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleProviderSubmit}>{/* Form fields */}</form>
          {/* Table of providers */}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Manage Models</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleModelSubmit}>{/* Form fields */}</form>
          {/* Table of models */}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Manage Voices</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleVoiceSubmit}>{/* Form fields */}</form>
          {/* Table of voices */}
        </CardContent>
      </Card>
    </div>
  );
}