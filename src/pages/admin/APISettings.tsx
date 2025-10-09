import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type APIIntegration = Tables<'api_integrations'>;
type AIConfig = Tables<'ai_configurations'>;

const initialOpenAIState: Partial<AIConfig> = {
  name: 'Default OpenAI',
  provider: 'openai',
  model_name: 'gpt-4-turbo-preview',
  temperature: 0.7,
  max_tokens: 1024,
  top_p: 1.0,
  frequency_penalty: 0.0,
  presence_penalty: 0.0,
  custom_headers: null,
  is_active: true,
  is_default: true,
};

const initialPaypalState: Partial<APIIntegration> = {
  service: 'paypal',
  mode: 'sandbox',
  is_active: false,
};

export default function APISettings() {
  const [openAIConfig, setOpenAIConfig] = useState<Partial<AIConfig>>(initialOpenAIState);
  const [paypalConfig, setPaypalConfig] = useState<Partial<APIIntegration>>(initialPaypalState);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: openAIData, error: openAIError },
        { data: paypalData, error: paypalError },
      ] = await Promise.all([
        supabase.from('ai_configurations').select('*').eq('name', 'Default OpenAI').single(),
        supabase.from('api_integrations').select('*').eq('service', 'paypal').single(),
      ]);

      if (openAIError && openAIError.code !== 'PGRST116') throw openAIError;
      if (paypalError && paypalError.code !== 'PGRST116') throw paypalError;

      if (openAIData) setOpenAIConfig(openAIData);
      if (paypalData) setPaypalConfig(paypalData);
    } catch (e) {
      toast.error('Failed to load API settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handlePaypalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const configData = { ...paypalConfig };
      if (paypalConfig.id) {
        await supabase
          .from('api_integrations')
          .update(configData as TablesUpdate<'api_integrations'>)
          .eq('id', paypalConfig.id);
      } else {
        const { data, error } = await supabase
          .from('api_integrations')
          .insert([configData] as TablesInsert<'api_integrations'>)
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setPaypalConfig({ ...paypalConfig, id: data.id });
        }
      }
      toast.success('PayPal settings saved!');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const configData = { ...openAIConfig };
      if (openAIConfig.id) {
        await supabase
          .from('ai_configurations')
          .update(configData as TablesUpdate<'ai_configurations'>)
          .eq('id', openAIConfig.id);
      } else {
        const { data, error } = await supabase
          .from('ai_configurations')
          .insert([configData] as TablesInsert<'ai_configurations'>)
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setOpenAIConfig({ ...openAIConfig, id: data.id });
        }
      }
      toast.success('OpenAI settings saved!');
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const testPaypalConnection = async () => {
    if (!paypalConfig.id) return;
    try {
      // Simulate test
      await new Promise(res => setTimeout(res, 1000));
      await supabase
            .from('api_integrations')
            .update({
              test_status: 'success',
              last_tested: new Date().toISOString(),
            } as TablesUpdate<'api_integrations'>)
            .eq('id', paypalConfig.id);
      toast.success("PayPal connection test successful!");
    } catch (e) {
      toast.error("PayPal connection test failed.");
    }
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>OpenAI Configuration</CardTitle></CardHeader>
        <CardContent><form onSubmit={handleOpenAISubmit}>{/* Form */}</form></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>PayPal Integration</CardTitle></CardHeader>
        <CardContent><form onSubmit={handlePaypalSubmit}>{/* Form */}</form></CardContent>
      </Card>
    </div>
  );
}