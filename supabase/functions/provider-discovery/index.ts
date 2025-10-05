import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Provider {
  name: string;
  type: string;
  api_base?: string;
  status: string;
}

interface Model {
  provider_id: string;
  model_id: string;
  display_name: string;
  modality: string;
  context_limit?: number;
  supports_streaming: boolean;
  supports_functions: boolean;
}

interface Voice {
  provider_id: string;
  voice_id: string;
  display_name: string;
  gender?: string;
  language: string;
  preview_url?: string;
}

async function discoverOpenAIModels(providerId: string): Promise<Model[]> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) return [];

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
    });

    if (!response.ok) return [];

    const data = await response.json();
    
    // Filter for relevant models
    const relevantModels = data.data.filter((m: any) => 
      m.id.includes('gpt-4') || 
      m.id.includes('gpt-3.5') || 
      m.id.includes('realtime')
    );

    return relevantModels.map((m: any) => ({
      provider_id: providerId,
      model_id: m.id,
      display_name: m.id,
      modality: m.id.includes('realtime') ? 'multimodal' : 'text',
      context_limit: m.id.includes('gpt-4-turbo') ? 128000 : 
                     m.id.includes('gpt-4') ? 8192 : 4096,
      supports_streaming: true,
      supports_functions: !m.id.includes('realtime'),
    }));
  } catch (error) {
    console.error("Error discovering OpenAI models:", error);
    return [];
  }
}

async function discoverElevenLabsVoices(providerId: string): Promise<Voice[]> {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!ELEVENLABS_API_KEY) return [];

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
    });

    if (!response.ok) return [];

    const data = await response.json();

    return data.voices.map((v: any) => ({
      provider_id: providerId,
      voice_id: v.voice_id,
      display_name: v.name,
      gender: v.labels?.gender,
      language: v.labels?.language || 'en',
      preview_url: v.preview_url,
    }));
  } catch (error) {
    console.error("Error discovering ElevenLabs voices:", error);
    return [];
  }
}

async function discoverAnthropicModels(providerId: string): Promise<Model[]> {
  // Anthropic doesn't have a models list endpoint, so we'll use known models
  return [
    {
      provider_id: providerId,
      model_id: "claude-3-opus-20240229",
      display_name: "Claude 3 Opus",
      modality: "text",
      context_limit: 200000,
      supports_streaming: true,
      supports_functions: true,
    },
    {
      provider_id: providerId,
      model_id: "claude-3-sonnet-20240229",
      display_name: "Claude 3 Sonnet",
      modality: "text",
      context_limit: 200000,
      supports_streaming: true,
      supports_functions: true,
    },
    {
      provider_id: providerId,
      model_id: "claude-3-haiku-20240307",
      display_name: "Claude 3 Haiku",
      modality: "text",
      context_limit: 200000,
      supports_streaming: true,
      supports_functions: true,
    },
  ];
}

async function discoverGoogleModels(providerId: string): Promise<Model[]> {
  // Google Gemini known models
  return [
    {
      provider_id: providerId,
      model_id: "gemini-1.5-pro",
      display_name: "Gemini 1.5 Pro",
      modality: "multimodal",
      context_limit: 1000000,
      supports_streaming: true,
      supports_functions: true,
    },
    {
      provider_id: providerId,
      model_id: "gemini-1.5-flash",
      display_name: "Gemini 1.5 Flash",
      modality: "multimodal",
      context_limit: 1000000,
      supports_streaming: true,
      supports_functions: true,
    },
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Define providers
    const providers: Provider[] = [
      { name: "OpenAI", type: "llm", api_base: "https://api.openai.com/v1", status: "active" },
      { name: "Anthropic", type: "llm", api_base: "https://api.anthropic.com/v1", status: "active" },
      { name: "Google", type: "llm", api_base: "https://generativelanguage.googleapis.com/v1beta", status: "active" },
      { name: "ElevenLabs", type: "tts", api_base: "https://api.elevenlabs.io/v1", status: "active" },
    ];

    const results = {
      providers: 0,
      models: 0,
      voices: 0,
      errors: [] as string[],
    };

    // Upsert providers
    for (const provider of providers) {
      const { data: existingProvider, error: selectError } = await supabase
        .from("providers")
        .select("id")
        .eq("name", provider.name)
        .single();

      let providerId: string;

      if (existingProvider) {
        providerId = existingProvider.id;
        await supabase
          .from("providers")
          .update({ ...provider, last_synced_at: new Date().toISOString() })
          .eq("id", providerId);
      } else {
        const { data: newProvider, error: insertError } = await supabase
          .from("providers")
          .insert({ ...provider, last_synced_at: new Date().toISOString() })
          .select()
          .single();

        if (insertError || !newProvider) {
          results.errors.push(`Failed to create provider: ${provider.name}`);
          continue;
        }
        providerId = newProvider.id;
      }

      results.providers++;

      // Discover models/voices based on provider type
      if (provider.name === "OpenAI") {
        const models = await discoverOpenAIModels(providerId);
        if (models.length > 0) {
          // Delete existing models for this provider
          await supabase.from("models").delete().eq("provider_id", providerId);
          // Insert new models
          const { error } = await supabase.from("models").insert(models);
          if (!error) results.models += models.length;
        }
      } else if (provider.name === "Anthropic") {
        const models = await discoverAnthropicModels(providerId);
        await supabase.from("models").delete().eq("provider_id", providerId);
        const { error } = await supabase.from("models").insert(models);
        if (!error) results.models += models.length;
      } else if (provider.name === "Google") {
        const models = await discoverGoogleModels(providerId);
        await supabase.from("models").delete().eq("provider_id", providerId);
        const { error } = await supabase.from("models").insert(models);
        if (!error) results.models += models.length;
      } else if (provider.name === "ElevenLabs") {
        const voices = await discoverElevenLabsVoices(providerId);
        if (voices.length > 0) {
          await supabase.from("voices").delete().eq("provider_id", providerId);
          const { error } = await supabase.from("voices").insert(voices);
          if (!error) results.voices += voices.length;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Provider discovery completed",
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in provider-discovery:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
