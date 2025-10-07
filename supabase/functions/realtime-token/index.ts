import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Enhanced TypeScript interfaces for better type safety
interface PromptExample {
  input?: string;
  output?: string;
}

interface PromptContent {
  system?: string;
  instructions?: string;
  personality?: string;
  examples?: PromptExample[];
}

interface Agent {
  id: string;
  name: string;
  status: string;
  prompt_id?: string;
  model_id?: string;
  voice_id?: string;
  prompts?: {
    name: string;
    content: PromptContent | string;
  } | null;
  models?: {
    model_id: string;
    display_name: string;
  } | null;
  voices?: {
    voice_id: string;
    name: string;
    locale: string;
  } | null;
  created_at: string;
}

interface RealtimeTokenRequest {
  agentId?: string;
  userId?: string;
  systemPrompt?: string;
  memoryContext?: string;
  voice?: string;
  model?: string;
  modalities?: Array<"audio" | "text">;
}

interface OpenAISessionRequest {
  model: string;
  voice: string;
  instructions: string;
  modalities: Array<"audio" | "text">;
  metadata?: {
    agent_id?: string | null;
    agent_name?: string | null;
    user_id?: string | null;
  };
}

const DEFAULT_INSTRUCTIONS = "You are NewMe, an empathetic AI companion for personal growth. Help the user feel seen, heard, and encouraged while guiding them with warmth and curiosity.";

// Enhanced logging utility
const logRequest = (message: string, data?: Record<string, unknown>) => {
  console.log(`[REALTIME-TOKEN] ${message}`, data ? JSON.stringify(data) : '');
};

const logError = (message: string, error?: unknown) => {
  console.error(`[REALTIME-TOKEN-ERROR] ${message}`, error instanceof Error ? error.stack : error);
};

// Enhanced prompt parsing with better error handling
const parsePromptContent = (content: unknown): { sections: string[] } => {
  try {
    if (!content) {
      return { sections: [] };
    }

    // Handle string content directly
    if (typeof content === "string") {
      return { sections: [content.trim()] };
    }

    if (typeof content !== "object") {
      return { sections: [] };
    }

    const record = content as PromptContent;
    const sections: string[] = [];

    const maybePush = (label: string, value?: string) => {
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
  } catch (error) {
    logError('Error parsing prompt content', error);
    return { sections: [] };
  }
};

const buildInstructionString = (parts: Array<string | undefined | null>): string => {
  try {
    return parts
      .map((part) => part?.trim())
      .filter((part): part is string => Boolean(part && part.length > 0))
      .join("\n\n");
  } catch (error) {
    logError('Error building instruction string', error);
    return DEFAULT_INSTRUCTIONS;
  }
};

// Safe database query with error handling
const fetchAgent = async (supabase: any, agentId?: string): Promise<Agent | null> => {
  try {
    // Simplified query to avoid relation projection errors
    const baseQuery = supabase
      .from('agents')
      .select('id, name, status, prompt_id, model_id, voice_id, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    const query = agentId ? baseQuery.eq('id', agentId) : baseQuery;
    const result = await query.maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  } catch (error) {
    logError('Error fetching agent', error);
    throw error;
  }
};

// Safe OpenAI API call with retry logic
const createOpenAISession = async (
  apiKey: string,
  sessionRequest: OpenAISessionRequest,
  maxRetries = 2
): Promise<Response> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "User-Agent": "NewMe-Realtime-Token/1.0",
        },
        body: JSON.stringify(sessionRequest),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (response.ok) {
        return response;
      }

      // If it's a client error (4xx), don't retry
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // For server errors (5xx), retry if we have attempts left
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        logRequest(`Retrying OpenAI API call (attempt ${attempt + 1}) after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      logRequest(`OpenAI API call failed, retrying (attempt ${attempt + 1})`);
    }
  }

  throw new Error('Failed to create OpenAI session after all retries');
};

serve(async (req) => {
  const startTime = Date.now();

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  // Only allow POST for session creation
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: 'Method not allowed. Use POST.'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    logRequest('Starting realtime token request', {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent')
    });

    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    const envStatus = {
      hasOpenAiKey: !!OPENAI_API_KEY,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
    };

    logRequest('Environment variables check', envStatus);

    if (!OPENAI_API_KEY) {
      logError('OPENAI_API_KEY is not configured');
      return new Response(JSON.stringify({
        error: 'OPENAI_API_KEY is not configured. Please set it in Supabase Edge Function secrets.',
        code: 'MISSING_OPENAI_KEY'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!supabaseUrl || !supabaseKey) {
      logError('Supabase environment variables missing', envStatus);
      return new Response(JSON.stringify({
        error: 'Supabase environment variables are not set',
        code: 'MISSING_SUPABASE_CONFIG'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse and validate request body
    let body: RealtimeTokenRequest = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        const rawBody = await req.json();
        body = {
          agentId: typeof rawBody.agentId === 'string' ? rawBody.agentId : undefined,
          userId: typeof rawBody.userId === 'string' ? rawBody.userId : undefined,
          systemPrompt: typeof rawBody.systemPrompt === 'string' ? rawBody.systemPrompt : undefined,
          memoryContext: typeof rawBody.memoryContext === 'string' ? rawBody.memoryContext : undefined,
          voice: typeof rawBody.voice === 'string' ? rawBody.voice : undefined,
          model: typeof rawBody.model === 'string' ? rawBody.model : undefined,
          modalities: Array.isArray(rawBody.modalities) && rawBody.modalities.every((m: unknown) => typeof m === 'string' && ['audio', 'text'].includes(m))
            ? rawBody.modalities as Array<"audio" | "text">
            : undefined,
        };
      } catch (parseError) {
        logError('Failed to parse JSON body', parseError);
        return new Response(JSON.stringify({
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    logRequest('Parsed request body', {
      hasAgentId: !!body.agentId,
      hasUserId: !!body.userId,
      hasSystemPrompt: !!body.systemPrompt,
      requestedVoice: body.voice,
      requestedModel: body.model,
      requestedModalities: body.modalities
    });

    // Fetch agent data with error handling
    let agent: Agent | null = null;
    try {
      agent = await fetchAgent(supabase, body.agentId);
      logRequest('Agent fetched successfully', {
        agentId: agent?.id,
        agentName: agent?.name,
        hasAgent: !!agent
      });
    } catch (agentError) {
      logError('Failed to fetch agent', agentError);
      // Continue without agent - use defaults
    }

    // Build instructions with fallbacks
    let promptContent: unknown = null;
    if (agent?.prompt_id) {
      try {
        const { data: promptData } = await supabase
          .from('prompts')
          .select('content')
          .eq('id', agent.prompt_id)
          .single();

        promptContent = promptData?.content ?? null;
      } catch (promptError) {
        logError('Failed to fetch prompt content', promptError);
        // Continue with default instructions
      }
    }

    const parsedPrompt = parsePromptContent(promptContent);
    const combinedInstructions = buildInstructionString([
      parsedPrompt.sections.join("\n\n"),
      body.systemPrompt,
      body.memoryContext,
    ]) || DEFAULT_INSTRUCTIONS;

    // Determine voice, model, and modalities with fallbacks
    const selectedVoice = body.voice ?? 'alloy';
    const selectedModel = body.model ?? 'gpt-4o-realtime-preview-2024-12-17';
    const selectedModalities = Array.isArray(body.modalities) && body.modalities.length > 0
      ? body.modalities as Array<"audio" | "text">
      : ["audio", "text"];

    logRequest('Creating OpenAI session', {
      model: selectedModel,
      voice: selectedVoice,
      modalities: selectedModalities,
      hasCustomInstructions: combinedInstructions !== DEFAULT_INSTRUCTIONS
    });

    // Create OpenAI session with retry logic
    const sessionRequest: OpenAISessionRequest = {
      model: selectedModel,
      voice: selectedVoice,
      instructions: combinedInstructions,
      modalities: selectedModalities,
      metadata: {
        agent_id: agent?.id ?? null,
        agent_name: agent?.name ?? null,
        user_id: body.userId ?? null,
      },
    };

    const response = await createOpenAISession(OPENAI_API_KEY, sessionRequest);

    if (!response.ok) {
      const errorText = await response.text();
      logError(`OpenAI API error: ${response.status}`, errorText);

      return new Response(JSON.stringify({
        error: `OpenAI API error: ${response.status}`,
        details: errorText,
        code: 'OPENAI_API_ERROR'
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    logRequest(`Session created successfully`, {
      sessionId: data.id,
      processingTimeMs: processingTime,
      model: selectedModel,
      agentId: agent?.id
    });

    return new Response(JSON.stringify({
      ...data,
      metadata: {
        processingTimeMs: processingTime,
        agentUsed: !!agent,
        fallbackInstructions: combinedInstructions === DEFAULT_INSTRUCTIONS
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logError(`Unhandled error after ${processingTime}ms`, error);

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
      code: 'INTERNAL_SERVER_ERROR',
      processingTimeMs: processingTime
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
