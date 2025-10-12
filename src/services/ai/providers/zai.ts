import type { AIConfiguration, AIResponse } from '../aiTypes';

const DEFAULT_BASE_URL = 'https://api.z.ai/api/coding/paas/v4';

interface ZaiResponse {
  output?: {
    choices?: Array<{ message?: { content?: string } }>;
    text?: string;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
  result?: {
    choices?: Array<{ message?: { content?: string } }>;
    text?: string;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
  choices?: Array<{ message?: { content?: string } }>;
  message?: { content?: string };
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  metrics?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string } | string;
}

const resolveContent = (payload: ZaiResponse): string | null => {
  const sources = [
    payload.output?.choices?.[0]?.message?.content,
    payload.output?.text,
    payload.result?.choices?.[0]?.message?.content,
    payload.result?.text,
    payload.choices?.[0]?.message?.content,
    payload.message?.content,
  ];

  for (const candidate of sources) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return null;
};

const resolveUsage = (payload: ZaiResponse) => {
  const usage =
    payload.usage ||
    payload.output?.usage ||
    payload.result?.usage || {
      prompt_tokens: payload.metrics?.prompt_tokens ?? 0,
      completion_tokens: payload.metrics?.completion_tokens ?? 0,
      total_tokens: payload.metrics?.total_tokens ?? 0,
    };

  return usage;
};

export async function callZAI(config: AIConfiguration, prompt: string, startTime: number): Promise<AIResponse> {
  const apiKey = config.apiKey || import.meta.env.VITE_ZAI_API_KEY;
  if (!apiKey) {
    throw new Error('Z.ai API key not configured. Set it in the configuration or VITE_ZAI_API_KEY.');
  }

  const baseUrl = (config.api_base_url || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const endpoint = `${baseUrl}/chat/completions`;

  const body = {
    model: config.model || 'GLM-4.6',
    messages: [
      {
        role: 'system',
        content:
          config.systemPrompt ??
          'You are NewMe, a wise, warm, and deeply perceptive AI companion. Guide the user through profound self-discovery with empathy and structure.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    top_p: config.topP,
    frequency_penalty: config.frequencyPenalty,
    presence_penalty: config.presencePenalty,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(config.custom_headers || {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorPayload = (await response.json()) as ZaiResponse;
      message = typeof errorPayload.error === 'string' ? errorPayload.error : errorPayload.error?.message || message;
    } catch {
      const errorText = await response.text();
      if (errorText) message = errorText;
    }
    throw new Error(`Z.ai API error: ${message}`);
  }

  const data = (await response.json()) as ZaiResponse;
  const content = resolveContent(data);
  const usage = resolveUsage(data);

  let totalCost = 0;
  if (config.cost_per_1k_input_tokens && config.cost_per_1k_output_tokens) {
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    totalCost =
      promptTokens * (config.cost_per_1k_input_tokens / 1000) +
      completionTokens * (config.cost_per_1k_output_tokens / 1000);
  }

  return {
    success: true,
    content: content ?? JSON.stringify(data),
    usage: {
      prompt_tokens: usage?.prompt_tokens ?? 0,
      completion_tokens: usage?.completion_tokens ?? 0,
      total_tokens:
        usage?.total_tokens ??
        (usage?.prompt_tokens ?? 0) + (usage?.completion_tokens ?? 0),
    },
    cost_usd: totalCost,
    processing_time_ms: Date.now() - startTime,
  };
}
