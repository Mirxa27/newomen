import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PromptExample = {
  input?: unknown;
  output?: unknown;
};

type PromptContent = {
  system?: unknown;
  instructions?: unknown;
  personality?: unknown;
  examples?: unknown;
};

type RealtimeTokenRequest = {
  agentId?: string;
  userId?: string;
  systemPrompt?: string;
  memoryContext?: string;
  voice?: string;
  model?: string;
  modalities?: Array<"audio" | "text">;
};

const DEFAULT_INSTRUCTIONS = "You are NewMe, an empathetic AI companion for personal growth. Help the user feel seen, heard, and encouraged while guiding them with warmth and curiosity.";

const parsePromptContent = (content: unknown): {
  sections: string[];
} => {
  if (!content || typeof content !== "object") {
    return { sections: [] };
  }

  const record = content as PromptContent;
  const sections: string[] = [];

  const maybePush = (label: string, value: unknown) => {
    if (typeof value === "string" && value.trim().length > 0) {
      sections.push(`${label}\n${value.trim()}`);
    }
  };

  maybePush("### SYSTEM", record.system);
  maybePush("### INSTRUCTIONS", record.instructions);
  maybePush("### PERSONALITY", record.personality);

  if (Array.isArray(record.examples) && record.examples.length > 0) {
    const formatted = record.examples
      .map((example, index) => {
        if (!example || typeof example !== "object") return null;
        const typed = example as PromptExample;
        const input = typeof typed.input === "string" ? typed.input.trim() : "";
        const output = typeof typed.output === "string" ? typed.output.trim() : "";
        if (!input && !output) return null;
        const lines: string[] = [`Example ${index + 1}:`];
        if (input) lines.push(`User: ${input}`);
        if (output) lines.push(`Agent: ${output}`);
        return lines.join("\n");
      })
      .filter((section): section is string => Boolean(section));

    if (formatted.length) {
      sections.push(["### EXAMPLE CONVERSATIONS", ...formatted].join("\n\n"));
    }
  }

  return { sections };
};

const buildInstructionString = (parts: Array<string | undefined | null>): string => {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join("\n\n");
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    console.log('Environment check:', {
      hasOpenAiKey: !!OPENAI_API_KEY,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
    });

    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      throw new Error('OPENAI_API_KEY is not configured. Please set it in Supabase Edge Function secrets.');
    }
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables missing:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
      throw new Error('Supabase environment variables are not set');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: RealtimeTokenRequest = {};
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        body = await req.json();
      } catch (_error) {
        body = {};
      }
    }

    const agentSelector = supabase
      .from('agents')
      .select(
        `id, name, status, prompt_id, model_id, voice_id,
        prompts:prompts(name, content),
        models:models(model_id, display_name),
        voices:voices(voice_id, name, locale)`
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    const agentResult = body.agentId
      ? await agentSelector.eq('id', body.agentId).maybeSingle()
      : await agentSelector.maybeSingle();

    if (agentResult.error) {
      console.error('Error fetching agent:', agentResult.error);
      throw agentResult.error;
    }

    const agent = agentResult.data ?? null;
    const promptContent = agent?.prompts?.content ?? null;
    const parsedPrompt = parsePromptContent(promptContent);

    const combinedInstructions = buildInstructionString([
      parsedPrompt.sections.join("\n\n"),
      body.systemPrompt,
      body.memoryContext,
    ]) || DEFAULT_INSTRUCTIONS;

    const selectedVoice = body.voice
      ?? (typeof agent?.voices?.voice_id === 'string' && agent.voices.voice_id.length > 0
        ? agent.voices.voice_id
        : typeof agent?.voices?.name === 'string' && agent.voices.name.length > 0
          ? agent.voices.name
          : undefined)
      ?? 'alloy';

    const selectedModel = body.model
      ?? (typeof agent?.models?.model_id === 'string' && agent.models.model_id.length > 0
        ? agent.models.model_id
        : undefined)
      ?? 'gpt-4o-realtime-preview-2024-12-17';

    const selectedModalities = Array.isArray(body.modalities) && body.modalities.length > 0
      ? body.modalities
      : ["audio", "text"];

    console.log('Requesting ephemeral token from OpenAI Realtime API');

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        voice: selectedVoice,
        instructions: combinedInstructions,
        modalities: selectedModalities,
        metadata: {
          agent_id: agent?.id ?? null,
          agent_name: agent?.name ?? null,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Session created successfully:", data.id);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error creating realtime session:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
