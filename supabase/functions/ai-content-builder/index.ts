import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ZAI_API_KEY = Deno.env.get("ZAI_API_KEY");
const ZAI_API_BASE_URL = (Deno.env.get("ZAI_API_BASE_URL") ?? "https://api.zai.ai/v1").replace(/\/+$/, "");
const ZAI_MODEL = Deno.env.get("ZAI_MODEL") ?? "zai-insight-pro";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface ZaiResponse {
  output?: {
    choices?: Array<{ message?: { content?: string } }>;
    text?: string;
    usage?: Record<string, number>;
  };
  result?: {
    choices?: Array<{ message?: { content?: string } }>;
    text?: string;
    usage?: Record<string, number>;
  };
  choices?: Array<{ message?: { content?: string } }>;
  message?: { content?: string };
  usage?: Record<string, number>;
  metrics?: Record<string, number>;
  error?: { message?: string } | string;
}

const resolveZaiContent = (payload: ZaiResponse): string | null => {
  const candidates = [
    payload.output?.choices?.[0]?.message?.content,
    payload.output?.text,
    payload.result?.choices?.[0]?.message?.content,
    payload.result?.text,
    payload.choices?.[0]?.message?.content,
    payload.message?.content,
  ];

  for (const entry of candidates) {
    if (typeof entry === "string" && entry.trim().length > 0) return entry;
  }

  return null;
};

const resolveZaiUsage = (payload: ZaiResponse): Record<string, number> | undefined => {
  return (
    payload.usage ||
    payload.output?.usage ||
    payload.result?.usage ||
    payload.metrics
  );
};

async function callZai(params: {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json_object' | 'text';
  model?: string;
}) {
  if (!ZAI_API_KEY) throw new Error("ZAI_API_KEY not configured");

  const body = {
    model: params.model ?? ZAI_MODEL,
    input: [
      { role: "system", content: params.systemPrompt },
      { role: "user", content: params.userPrompt },
    ],
    parameters: {
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 1200,
    },
    ...(params.responseFormat === 'json_object'
      ? { response_format: { type: 'json_object' as const } }
      : {}),
  };

  const response = await fetch(`${ZAI_API_BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ZAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorPayload = (await response.json()) as ZaiResponse;
      if (typeof errorPayload.error === "string") message = errorPayload.error;
      else if (errorPayload.error?.message) message = errorPayload.error.message;
    } catch {
      message = await response.text();
    }
    throw new Error(`Z.ai request failed: ${message}`);
  }

  const data = (await response.json()) as ZaiResponse;
  const content = resolveZaiContent(data);
  if (!content) throw new Error("Z.ai returned an empty response");

  return {
    content,
    usage: resolveZaiUsage(data),
    raw: data,
  };
}

async function callOpenAI(params: {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json_object' | 'text';
}) {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 1200,
      ...(params.responseFormat ? { response_format: { type: params.responseFormat } } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("OpenAI API error:", error);
    throw new Error("Failed to call OpenAI");
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    usage: data.usage,
    raw: data,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, type, isPublic, context, analysisType: _analysisType } = await req.json();

    // Handle Narrative Identity Analysis
    if (topic === 'narrative-identity-analysis' && context) {
      const engine = ZAI_API_KEY ? callZai : callOpenAI;
      const isZai = Boolean(ZAI_API_KEY);

      const analysisPrompt = `Analyze this personal narrative exploration and provide a comprehensive psychological analysis.

NARRATIVE DATA:
${context}

Return a JSON object with this EXACT structure:
{
  "coreThemes": ["theme1", "theme2", "theme3", "theme4"],
  "limitingBeliefs": ["belief1", "belief2", "belief3"],
  "strengthPatterns": ["strength1", "strength2", "strength3", "strength4"],
  "transformationOpportunities": ["opportunity1", "opportunity2", "opportunity3"],
  "personalityArchetype": "Explorer | Healer | Builder | Warrior | Sage | Caregiver | Visionary | Nurturer",
  "narrativeCoherence": number (0-100),
  "transformationRoadmap": [
    {
      "title": "Step title",
      "description": "Detailed description",
      "actions": ["action1", "action2", "action3"]
    }
  ]
}`;

      const result = await engine({
        systemPrompt: "You are an expert narrative psychologist specializing in identity formation and personal transformation. Provide deep, actionable insights.",
        userPrompt: analysisPrompt,
        model: isZai ? ZAI_MODEL : "gpt-4o",
        temperature: 0.65,
        maxTokens: 1600,
        responseFormat: 'json_object',
      });

      const analysis = typeof result.content === "string" ? JSON.parse(result.content) : result.content;

      return new Response(
        JSON.stringify(analysis),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Original assessment generation code
    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generator = ZAI_API_KEY ? callZai : callOpenAI;
    const isZai = Boolean(ZAI_API_KEY);

    const systemPrompt = `You are ${isZai ? 'Z.ai' : 'an expert'} architect of psychological assessments and skill-building quizzes.
- Craft evidence-based content that balances insight with accessibility.
- Ensure all JSON responses strictly follow the requested structure.`;

    const normalizedType = type === 'quiz' ? 'quiz' : 'assessment';

const userPrompt = `Create a ${normalizedType} about: ${topic}

${context ? `ADDITIONAL CONTEXT:\n${context}\n` : ""}

Return a JSON object with this exact structure:
{
  "title": "Compelling title",
  "description": "Two sentences describing the experience",
  "category": "One concise category",
  "difficulty": "easy | medium | hard | expert",
  "time_limit_minutes": number,
  "questions": [
    {
      "id": "short identifier",
      "prompt": "Question text",
      "type": "single_choice | multi_choice | scale | reflection",
      "options": [
        { "label": "Option text", "value": "value", "score": number }
      ],
      "scoring_guidance": "How to interpret this question"
    }
  ],
  "outcomes": [
    {
      "label": "Outcome name",
      "description": "Short description",
      "score_range": "0-20"
    }
  ]
}

GUIDANCE:
- Produce 10-12 questions.
- Options should be empathetic and growth-focused.
- Include at least one self-reflection question with free-form guidance.
- Ensure scoring guidance helps a coach interpret responses.`;

    const generated = await generator({
      systemPrompt,
      userPrompt,
      model: isZai ? ZAI_MODEL : 'gpt-4o-mini',
      temperature: 0.65,
      maxTokens: 2200,
      responseFormat: 'json_object',
    });

    let content;
    try {
      content = typeof generated.content === 'string' ? JSON.parse(generated.content) : generated.content;
    } catch (err) {
      console.error('Failed to parse generated content', generated.content, err);
      throw new Error('Failed to parse generated content');
    }

    if (!Array.isArray(content?.questions) || content.questions.length === 0) {
      throw new Error('Generated content did not include questions.');
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const insertPayload = {
      title: content.title ?? `AI Generated ${normalizedType}`,
      description: content.description ?? null,
      type: normalizedType,
      category: content.category ?? 'Personal Growth',
      difficulty_level: content.difficulty ?? 'medium',
      time_limit_minutes: content.time_limit_minutes ?? 15,
      max_attempts: content.max_attempts ?? 3,
      is_public: Boolean(isPublic),
      is_active: true,
      questions: content.questions,
      scoring_rubric: content.scoring_rubric ?? content.outcomes ?? null,
      outcome_descriptions: content.outcomes ?? null,
      ai_config_id: null,
    };

    const { data: assessment, error: insertError } = await supabase
      .from("assessments_enhanced")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, assessment }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-content-builder:", error);
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
