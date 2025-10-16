/// <reference lib="deno.ns" />
/// <reference lib="deno.window" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"; // Updated Deno std version
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"; // Updated Supabase JS version

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ProviderAction =
  | { action: "create"; provider: ProviderPayload }
  | { action: "sync"; providerId: string; providerType: string; apiKey?: string };

type ProviderPayload = {
  name: string;
  type: string;
  apiKey: string;
  apiBase?: string | null;
  region?: string | null;
};

type ModelRecord = {
  provider_id: string;
  model_id: string;
  display_name: string;
  modality: string | null;
  context_limit: number | null;
  latency_hint_ms: number | null;
  is_realtime: boolean;
  enabled: boolean;
};

type VoiceRecord = {
  provider_id: string;
  voice_id: string;
  name: string;
  locale: string | null;
  gender: string | null;
  latency_hint_ms: number | null;
  enabled: boolean;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = (await req.json()) as Partial<ProviderAction>;

    if (!body || !body.action) { // Safely check for body.action
      throw new Error("Action is required");
    }

    switch (body.action) {
      case "create":
        return await handleCreateProvider(supabase, body.provider);
      case "sync":
        return await handleSyncProvider(supabase, body.providerId, body.providerType, body.apiKey);
      default:
        throw new Error(`Unsupported action: ${body.action}`);
    }
  } catch (error) {
    console.error("provider-discovery error", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleCreateProvider(supabase: ReturnType<typeof createClient>, payload?: ProviderPayload) {
  if (!payload) {
    throw new Error("Provider payload is required");
  }

  const { name, type, apiKey } = payload;
  const apiBase = payload.apiBase || getDefaultApiBase(type);

  if (!name || !type || !apiKey) {
    throw new Error("Provider name, type, and API key are required");
  }

  const existing = await supabase
    .from("providers")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (existing.error) throw existing.error;

  const providerRecord = {
    name,
    type,
    api_base: apiBase,
    region: payload.region ?? null,
    status: "active",
    last_synced_at: new Date().toISOString(),
  } as const;

  let providerId: string;
  if (existing.data?.id) {
    providerId = existing.data.id;
    const { error } = await supabase
      .from("providers")
      .update(providerRecord)
      .eq("id", providerId);
    if (error) throw error;
  } else {
    const inserted = await supabase
      .from("providers")
      .insert(providerRecord)
      .select("id")
      .single();
    if (inserted.error) throw inserted.error;
    providerId = inserted.data.id;
  }

  await supabase.rpc("store_provider_api_key", {
    p_provider_id: providerId,
    p_api_key: apiKey,
  });

  const summary = await discoverAndPersistAssets(supabase, {
    providerId,
    providerType: type,
    apiKey,
    apiBase,
  });

  return new Response(JSON.stringify({ providerId, ...summary }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleSyncProvider(
  supabase: ReturnType<typeof createClient>,
  providerId?: string,
  providerType?: string,
  overrideApiKey?: string,
) {
  if (!providerId || !providerType) {
    throw new Error("providerId and providerType are required");
  }

  const providerRecord = await supabase
    .from("providers")
    .select("api_base, name")
    .eq("id", providerId)
    .maybeSingle();

  if (providerRecord.error) throw providerRecord.error;
  if (!providerRecord.data) throw new Error("Provider not found");

  let apiKey = overrideApiKey;
  if (!apiKey) {
    const keyResult = await supabase.rpc("get_provider_api_key", { p_provider_id: providerId });
    if (keyResult.error) throw keyResult.error;
    apiKey = keyResult.data as string | null;
  } else {
    await supabase.rpc("store_provider_api_key", {
      p_provider_id: providerId,
      p_api_key: apiKey,
    });
  }

  if (requiresApiKey(providerType) && !apiKey) {
    throw new Error("An API key is required to sync this provider");
  }

  const summary = await discoverAndPersistAssets(supabase, {
    providerId,
    providerType,
    apiKey: apiKey || undefined,
    apiBase: providerRecord.data.api_base || getDefaultApiBase(providerType),
  });

  return new Response(JSON.stringify(summary), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function discoverAndPersistAssets(
  supabase: ReturnType<typeof createClient>,
  options: {
    providerId: string;
    providerType: string;
    apiKey?: string;
    apiBase?: string | null;
  },
) {
  const { providerId, providerType, apiKey, apiBase } = options;

  const models = await discoverModels(providerType, apiKey, apiBase);
  if (models.length > 0) {
    const { error } = await supabase
      .from("models")
      .upsert(models.map((model) => ({ ...model, provider_id: providerId })), {
        onConflict: "provider_id,model_id",
        ignoreDuplicates: false,
      });
    if (error) throw error;
  }

  const voices = await discoverVoices(providerType, apiKey, apiBase);
  if (voices.length > 0) {
    const { error } = await supabase
      .from("voices")
      .upsert(voices.map((voice) => ({ ...voice, provider_id: providerId })), {
        onConflict: "provider_id,voice_id",
        ignoreDuplicates: false,
      });
    if (error) throw error;
  }

  await supabase
    .from("providers")
    .update({ last_synced_at: new Date().toISOString(), status: "active" })
    .eq("id", providerId);

  return { modelsCount: models.length, voicesCount: voices.length };
}

function requiresApiKey(providerType: string) {
  return ["openai", "elevenlabs", "azure", "deepgram", "hume"].includes(providerType);
}

function getDefaultApiBase(providerType: string) {
  const map: Record<string, string> = {
    openai: "https://api.openai.com/v1",
    anthropic: "https://api.anthropic.com/v1",
    google: "https://generativelanguage.googleapis.com/v1beta",
    elevenlabs: "https://api.elevenlabs.io/v1",
    azure: "",
    cartesia: "https://api.cartesia.ai",
    deepgram: "https://api.deepgram.com/v1",
    hume: "https://api.hume.ai",
  };
  return map[providerType] || "";
}

async function discoverModels(providerType: string, apiKey?: string, apiBase?: string | null): Promise<ModelRecord[]> {
  switch (providerType) {
    case "openai":
      if (!apiKey) return [];
      return discoverOpenAIModels(apiKey, apiBase ?? getDefaultApiBase("openai"));
    case "anthropic":
      return discoverAnthropicModels();
    case "google":
      return discoverGeminiModels();
    case "cartesia":
      return discoverCartesiaModels(); // Placeholder
    case "deepgram":
      return discoverDeepgramModels(); // Placeholder
    case "hume":
      return discoverHumeModels(); // Placeholder
    default:
      return [];
  }
}

async function discoverVoices(providerType: string, apiKey?: string, apiBase?: string | null): Promise<VoiceRecord[]> {
  switch (providerType) {
    case "elevenlabs":
      if (!apiKey) return [];
      return discoverElevenLabsVoices(apiKey, apiBase ?? getDefaultApiBase("elevenlabs"));
    case "cartesia":
      return discoverCartesiaVoices(); // Placeholder
    case "hume":
      return discoverHumeVoices(); // Placeholder
    default:
      return [];
  }
}

async function discoverOpenAIModels(apiKey: string, apiBase: string): Promise<ModelRecord[]> {
  try {
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      console.error("OpenAI discovery failed", await response.text());
      return [];
    }

    const payload = (await response.json()) as { data?: Array<Record<string, unknown>> };
    const models = Array.isArray(payload.data) ? payload.data : [];
    const results: ModelRecord[] = [];

    for (const entry of models) {
      const id = typeof entry.id === "string" ? entry.id : null;
      if (!id || id.startsWith("ft:")) continue;
      const contextLimit = typeof entry.context_length === "number"
        ? entry.context_length
        : typeof entry.quota === "number"
        ? entry.quota
        : null;

      results.push({
        provider_id: "",
        model_id: id,
        display_name: id,
        modality: id.includes("realtime") ? "multimodal" : "text",
        context_limit: contextLimit,
        latency_hint_ms: null,
        is_realtime: id.includes("realtime"),
        enabled: true,
      });
    }

    return results;
  } catch (error) {
    console.error("Error discovering OpenAI models", error);
    return [];
  }
}

async function discoverElevenLabsVoices(apiKey: string, apiBase: string): Promise<VoiceRecord[]> {
  try {
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/voices`, {
      headers: { "xi-api-key": apiKey },
    });

    if (!response.ok) {
      console.error("ElevenLabs discovery failed", await response.text());
      return [];
    }

    const payload = (await response.json()) as { voices?: Array<Record<string, unknown>> };
    const voices = Array.isArray(payload.voices) ? payload.voices : [];
    const results: VoiceRecord[] = [];

    for (const entry of voices) {
      const voiceId = typeof entry.voice_id === "string" ? entry.voice_id : null;
      const name = typeof entry.name === "string" ? entry.name : null;
      if (!voiceId || !name) continue;
      const labels = typeof entry.labels === "object" && entry.labels !== null ? (entry.labels as Record<string, unknown>) : {};
      const latency = typeof entry.latency === "number" ? entry.latency : null;

      results.push({
        provider_id: "",
        voice_id: voiceId,
        name,
        locale: typeof labels.language === "string" ? labels.language : null,
        gender: typeof labels.gender === "string" ? labels.gender : null,
        latency_hint_ms: latency,
        enabled: true,
      });
    }

    return results;
  } catch (error) {
    console.error("Error discovering ElevenLabs voices", error);
    return [];
  }
}

function discoverAnthropicModels(): ModelRecord[] {
  const MODELS = [
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
    { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
  ];

  return MODELS.map((model) => ({
    provider_id: "",
    model_id: model.id,
    display_name: model.name,
    modality: "text",
    context_limit: 200_000,
    latency_hint_ms: null,
    is_realtime: false,
    enabled: true,
  }));
}

function discoverGeminiModels(): ModelRecord[] {
  const MODELS = [
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", modality: "multimodal" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", modality: "multimodal" },
  ];

  return MODELS.map((model) => ({
    provider_id: "",
    model_id: model.id,
    display_name: model.name,
    modality: model.modality,
    context_limit: 1_000_000,
    latency_hint_ms: null,
    is_realtime: true,
    enabled: true,
  }));
}

// Real Cartesia API integration
async function discoverCartesiaModels(apiKey: string): Promise<ModelRecord[]> {
  try {
    const response = await fetch('https://api.cartesia.ai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Cartesia API error: ${response.status}`);
    }

    const data = await response.json();
    return data.models?.map((model: { id: string; name?: string; context_length?: number; latency_hint?: number; realtime?: boolean }) => ({
      provider_id: "", // Will be set by caller
      model_id: model.id,
      display_name: model.name || model.id,
      modality: "audio",
      context_limit: model.context_length || 1000,
      latency_hint_ms: model.latency_hint || 150,
      is_realtime: model.realtime || false,
      enabled: true
    })) || [];
  } catch (error) {
    console.error('Error discovering Cartesia models:', error);
    return [];
  }
}

async function discoverCartesiaVoices(apiKey: string): Promise<VoiceRecord[]> {
  try {
    const response = await fetch('https://api.cartesia.ai/v1/voices', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Cartesia API error: ${response.status}`);
    }

    const data = await response.json();
    return data.voices?.map((voice: { id: string; name?: string; locale?: string; gender?: string; latency_hint?: number }) => ({
      provider_id: "", // Will be set by caller
      voice_id: voice.id,
      name: voice.name || voice.id,
      locale: voice.locale || null,
      gender: voice.gender || null,
      latency_hint_ms: voice.latency_hint || 150,
      enabled: true
    })) || [];
  } catch (error) {
    console.error('Error discovering Cartesia voices:', error);
    return [];
  }
}

function discoverDeepgramModels(): ModelRecord[] {
  return [{
    provider_id: "", model_id: "nova-2", display_name: "Deepgram Nova-2",
    modality: "audio", context_limit: null, latency_hint_ms: 50, is_realtime: true, enabled: true
  }];
}

function discoverHumeModels(): ModelRecord[] {
  return [{
    provider_id: "", model_id: "empathic-voice-v1", display_name: "Hume AI Empathic Voice",
    modality: "multimodal", context_limit: 2000, latency_hint_ms: 200, is_realtime: true, enabled: true
  }];
}

function discoverHumeVoices(): VoiceRecord[] {
  return [{
    provider_id: "", voice_id: "hume-default-empathic", name: "Hume Empathic",
    locale: "en-US", gender: "female", latency_hint_ms: 200, enabled: true
  }];
}