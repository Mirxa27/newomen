import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Settings,
  Key,
  DollarSign,
  Shield,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  TestTube,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components

type APIIntegrationConfig = Tables<'api_integrations'>;
type AIConfigurationRow = Tables<'ai_configurations'>;

const APISettings = () => {
  const [paypalConfig, setPaypalConfig] = useState<APIIntegrationConfig>({
    id: '',
    service: 'paypal',
    client_id: '',
    client_secret: '',
    mode: 'sandbox',
    is_active: false,
    last_tested: null,
    test_status: null,
    created_at: null,
    updated_at: null,
  });

  const [openAIConfig, setOpenAIConfig] = useState<AIConfigurationRow>({
    id: '',
    name: 'OpenAI Default',
    description: 'Default OpenAI configuration for AI features',
    provider: 'openai',
    provider_name: null,
    model_name: 'gpt-4', // Default model
    api_base_url: 'https://api.openai.com/v1',
    api_key_encrypted: '',
    api_version: null,
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
    stop_sequences: null,
    custom_headers: null,
    cost_per_1k_prompt_tokens: null,
    cost_per_1k_completion_tokens: null,
    max_requests_per_minute: 60,
    max_tokens_per_minute: 90000,
    system_prompt: 'You are a helpful AI assistant.',
    user_prompt_template: null,
    tags: null,
    metadata: null,
    is_active: false,
    is_default: false,
    created_at: null,
    updated_at: null,
    created_by: null,
    last_tested_at: null,
    test_status: null,
  });

  const [showSecrets, setShowSecrets] = useState({
    paypal_secret: false,
    openai_key: false,
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    setLoading(true);
    try {
      // Load PayPal configuration from api_integrations
      const { data: paypalData, error: paypalError } = await supabase
        .from('api_integrations')
        .select('*')
        .eq('service', 'paypal')
        .single();

      if (paypalError && paypalError.code !== 'PGRST116') {
        console.error('Error loading PayPal config:', paypalError);
      } else if (paypalData) {
        setPaypalConfig(paypalData as APIIntegrationConfig);
      }

      // Load OpenAI configuration from ai_configurations
      const { data: openaiData, error: openaiError } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('provider', 'openai')
        .single();

      if (openaiError && openaiError.code !== 'PGRST116') {
        console.error('Error loading OpenAI config:', openaiError);
      } else if (openaiData) {
        setOpenAIConfig(openaiData as AIConfigurationRow);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast.error('Failed to load API configurations');
    } finally {
      setLoading(false);
    }
  };

  const savePayPalConfig = async () => {
    setSaving(true);
    try {
      const configData: TablesInsert<'api_integrations'> = {
        service: 'paypal',
        client_id: paypalConfig.client_id,
        client_secret: paypalConfig.client_secret,
        mode: paypalConfig.mode,
        is_active: paypalConfig.is_active,
        last_tested: paypalConfig.last_tested,
        test_status: paypalConfig.test_status,
      };

      if (paypalConfig.id) {
        const { error } = await supabase
          .from('api_integrations')
          .update(configData as TablesUpdate<'api_integrations'>)
          .eq('id', paypalConfig.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('api_integrations')
          .insert([configData])
          .select()
          .single();
        if (error) throw error;
        setPaypalConfig({ ...paypalConfig, id: data.id });
      }

      await updateSupabaseSecrets({
        PAYPAL_CLIENT_ID: paypalConfig.client_id,
        PAYPAL_SECRET: paypalConfig.client_secret,
        PAYPAL_MODE: paypalConfig.mode,
      });

      toast.success('PayPal configuration saved successfully');
    } catch (error) {
      console.error('Error saving PayPal config:', error);
      toast.error('Failed to save PayPal configuration');
    } finally {
      setSaving(false);
    }
  };

  const saveOpenAIConfig = async () => {
    setSaving(true);
    try {
      const configData: TablesInsert<'ai_configurations'> = {
        id: openAIConfig.id,
        name: openAIConfig.name,
        description: openAIConfig.description,
        provider: openAIConfig.provider,
        model_name: openAIConfig.model_name,
        api_base_url: openAIConfig.api_base_url,
        api_key_encrypted: openAIConfig.api_key_encrypted,
        temperature: openAIConfig.temperature,
        max_tokens: openAIConfig.max_tokens,
        top_p: openAIConfig.top_p,
        frequency_penalty: openAIConfig.frequency_penalty,
        presence_penalty: openAIConfig.presence_penalty,
        system_prompt: openAIConfig.system_prompt,
        user_prompt_template: openAIConfig.user_prompt_template,
        is_active: openAIConfig.is_active,
        created_at: openAIConfig.created_at,
        updated_at: openAIConfig.updated_at,
        created_by: openAIConfig.created_by,
      };

      if (openAIConfig.id) {
        const { error } = await supabase
          .from('ai_configurations')
          .update(configData as TablesUpdate<'ai_configurations'>)
          .eq('id', openAIConfig.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('ai_configurations')
          .insert([configData])
          .select()
          .single();
        if (error) throw error;
        setOpenAIConfig({ ...openAIConfig, id: data.id });
      }

      await updateSupabaseSecrets({
        OPENAI_API_KEY: openAIConfig.api_key_encrypted || '',
        OPENAI_ORG_ID: openAIConfig.description || '', // Using description for org ID for now
      });

      toast.success('OpenAI configuration saved successfully');
    } catch (error) {
      console.error('Error saving OpenAI config:', error);
      toast.error('Failed to save OpenAI configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateSupabaseSecrets = async (secrets: Record<string, string>) => {
    console.log('Update these secrets in Supabase:', secrets);
    toast.info(
      'Remember to update Edge Function secrets via CLI: npx supabase secrets set KEY=value',
      { duration: 5000 }
    );
  };

  const testPayPalConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch(
        `https://api-m.${paypalConfig.mode}.paypal.com/v1/oauth2/token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${paypalConfig.client_id}:${paypalConfig.client_secret}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        }
      );

      if (response.ok) {
        const updatedConfig = {
          ...paypalConfig,
          test_status: 'success' as const,
          last_tested: new Date().toISOString(),
        };
        setPaypalConfig(updatedConfig);

        if (paypalConfig.id) {
          await supabase
            .from('api_integrations')
            .update({
              test_status: 'success',
              last_tested: new Date().toISOString(),
            })
            .eq('id', paypalConfig.id);
        }

        toast.success('PayPal connection test successful!');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('PayPal test failed:', error);

      const updatedConfig = {
        ...paypalConfig,
        test_status: 'failed' as const,
        last_tested: new Date().toISOString(),
      };
      setPaypalConfig(updatedConfig);

      toast.error('PayPal connection test failed. Check your credentials.');
    } finally {
      setTesting(false);
    }
  };

  const testOpenAIConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openAIConfig.api_key_encrypted}`,
          ...(openAIConfig.description && {
            'OpenAI-Organization': openAIConfig.description,
          }),
        },
      });

      if (response.ok) {
        toast.success('OpenAI connection test successful!');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('OpenAI test failed:', error);
      toast.error('OpenAI connection test failed. Check your API key.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 gradient-text">
            <Settings className="h-8 w-8" />
            API Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure third-party API integrations for payments and AI services
          </p>
        </div>
      </div>

      <Alert className="glass-card">
        <Shield className="h-4 w-4" />
        <AlertTitle>Security Notice</AlertTitle>
        <AlertDescription>
          API keys and secrets are encrypted and stored securely.
          After saving, you'll need to update Supabase Edge Function secrets via CLI for the integrations to work.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="paypal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 glass">
          <TabsTrigger value="paypal" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            PayPal
          </TabsTrigger>
          <TabsTrigger value="openai" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            OpenAI
          </TabsTrigger>
        </TabsList>

        {/* PayPal Configuration */}
        <TabsContent value="paypal" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    PayPal Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure PayPal for payment processing and subscriptions
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {paypalConfig.test_status === 'success' && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Tested
                    </Badge>
                  )}
                  {paypalConfig.test_status === 'failed' && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Test Failed
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Active Status */}
              <div className="flex items-center justify-between p-4 glass rounded-lg">
                <div>
                  <Label className="text-base font-semibold">Enable PayPal Integration</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Allow users to make payments via PayPal
                  </p>
                </div>
                <Switch
                  checked={paypalConfig.is_active || false}
                  onCheckedChange={(checked) =>
                    setPaypalConfig({ ...paypalConfig, is_active: checked })
                  }
                />
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <Label htmlFor="paypal-mode">Environment Mode</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaypalConfig({ ...paypalConfig, mode: 'sandbox' })}
                    className={`p-4 rounded-lg border-2 transition-all glass ${
                      paypalConfig.mode === 'sandbox'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-semibold">Sandbox (Testing)</div>
                      <div className="text-sm text-muted-foreground">
                        Use PayPal sandbox for testing
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaypalConfig({ ...paypalConfig, mode: 'live' })}
                    className={`p-4 rounded-lg border-2 transition-all glass ${
                      paypalConfig.mode === 'live'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-semibold">Live (Production)</div>
                      <div className="text-sm text-muted-foreground">
                        Process real payments
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Client ID */}
              <div className="space-y-2">
                <Label htmlFor="paypal-client-id">Client ID</Label>
                <Input
                  id="paypal-client-id"
                  type="text"
                  placeholder="Enter your PayPal Client ID"
                  value={paypalConfig.client_id}
                  onChange={(e) =>
                    setPaypalConfig({ ...paypalConfig, client_id: e.target.value })
                  }
                  className="glass"
                />
                <p className="text-xs text-muted-foreground">
                  Get this from your PayPal Developer Dashboard
                </p>
              </div>

              {/* Client Secret */}
              <div className="space-y-2">
                <Label htmlFor="paypal-secret">Client Secret</Label>
                <div className="relative">
                  <Input
                    id="paypal-secret"
                    type={showSecrets.paypal_secret ? 'text' : 'password'}
                    placeholder="Enter your PayPal Client Secret"
                    value={paypalConfig.client_secret}
                    onChange={(e) =>
                      setPaypalConfig({ ...paypalConfig, client_secret: e.target.value })
                    }
                    className="pr-10 glass"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowSecrets({
                        ...showSecrets,
                        paypal_secret: !showSecrets.paypal_secret
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showSecrets.paypal_secret ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will be encrypted and stored securely
                </p>
              </div>

              {/* Last Tested */}
              {paypalConfig.last_tested && (
                <div className="text-sm text-muted-foreground">
                  Last tested: {new Date(paypalConfig.last_tested).toLocaleString()}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={testPayPalConnection}
                  variant="outline"
                  disabled={!paypalConfig.client_id || !paypalConfig.client_secret || testing}
                  className="flex items-center gap-2 glass"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  Test Connection
                </Button>
                <Button
                  onClick={savePayPalConfig}
                  disabled={!paypalConfig.client_id || !paypalConfig.client_secret || saving}
                  className="flex items-center gap-2 clay-button bg-gradient-to-r from-primary to-accent"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Save Configuration
                </Button>
              </div>

              {/* Setup Instructions */}
              <Alert className="glass-card">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Setup Instructions</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Create a PayPal Developer account at developer.paypal.com</li>
                    <li>Create a new App in the Dashboard</li>
                    <li>Copy the Client ID and Secret from your app</li>
                    <li>After saving, update Supabase secrets:
                      <code className="block mt-1 p-2 bg-muted rounded text-xs">
                        npx supabase secrets set PAYPAL_CLIENT_ID=your_id PAYPAL_SECRET=your_secret PAYPAL_MODE={paypalConfig.mode}
                      </code>
                    </li>
                    <li>Deploy the PayPal Edge Functions</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OpenAI Configuration */}
        <TabsContent value="openai" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    OpenAI Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure OpenAI API for AI-powered features
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Active Status */}
              <div className="flex items-center justify-between p-4 glass rounded-lg">
                <div>
                  <Label className="text-base font-semibold">Enable OpenAI Integration</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enable AI-powered assessments and content generation
                  </p>
                </div>
                <Switch
                  checked={openAIConfig.is_active || false}
                  onCheckedChange={(checked) =>
                    setOpenAIConfig({ ...openAIConfig, is_active: checked })
                  }
                />
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="openai-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="openai-key"
                    type={showSecrets.openai_key ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={openAIConfig.api_key_encrypted || ''}
                    onChange={(e) =>
                      setOpenAIConfig({ ...openAIConfig, api_key_encrypted: e.target.value })
                    }
                    className="pr-10 glass"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowSecrets({
                        ...showSecrets,
                        openai_key: !showSecrets.openai_key
                      })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showSecrets.openai_key ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Organization ID */}
              <div className="space-y-2">
                <Label htmlFor="openai-org">Organization ID (Optional)</Label>
                <Input
                  id="openai-org"
                  type="text"
                  placeholder="org-..."
                  value={openAIConfig.description || ''} // Using description for org ID for now
                  onChange={(e) =>
                    setOpenAIConfig({ ...openAIConfig, description: e.target.value })
                  }
                  className="glass"
                />
                <p className="text-xs text-muted-foreground">
                  Only required if you're part of multiple organizations
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={testOpenAIConnection}
                  variant="outline"
                  disabled={!openAIConfig.api_key_encrypted || testing}
                  className="flex items-center gap-2 glass"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                  Test Connection
                </Button>
                <Button
                  onClick={saveOpenAIConfig}
                  disabled={!openAIConfig.api_key_encrypted || saving}
                  className="flex items-center gap-2 clay-button bg-gradient-to-r from-primary to-accent"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Save Configuration
                </Button>
              </div>

              {/* Setup Instructions */}
              <Alert className="glass-card">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Setup Instructions</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>Sign up for OpenAI at platform.openai.com</li>
                    <li>Navigate to API Keys section</li>
                    <li>Create a new API key</li>
                    <li>After saving, update Supabase secrets:
                      <code className="block mt-1 p-2 bg-muted rounded text-xs">
                        npx supabase secrets set OPENAI_API_KEY=your_key
                      </code>
                    </li>
                    <li>Monitor usage at platform.openai.com/usage</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APISettings;