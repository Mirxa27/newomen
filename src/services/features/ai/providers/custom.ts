import type { AIConfiguration, AIResponse } from '../aiTypes';

export async function callCustomProvider(config: AIConfiguration, prompt: string, startTime: number): Promise<AIResponse> {
    if (!config.api_base_url) {
      throw new Error('Custom provider requires api_base_url to be configured');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.custom_headers || {})
    };

    if (config.apiKey) {
      if (config.provider === 'azure') headers['api-key'] = config.apiKey;
      else if (config.provider === 'deepgram') headers['Authorization'] = `Token ${config.apiKey}`;
      else if (config.provider === 'hume') headers['X-Hume-Api-Key'] = config.apiKey;
      else if (config.provider === 'cartesia') headers['X-Cartesia-API-Key'] = config.apiKey;
      else headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    let url = config.api_base_url;
    if (config.provider === 'azure' && config.api_version) {
      url = `${config.api_base_url}/openai/deployments/${config.model}/chat/completions?api-version=${config.api_version}`;
    } else if (!url.includes('/chat/completions') && !['elevenlabs', 'deepgram', 'hume', 'cartesia'].includes(config.provider)) {
      url = `${url}/v1/chat/completions`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        ...(config.topP && { top_p: config.topP }),
        ...(config.frequencyPenalty && { frequency_penalty: config.frequencyPenalty }),
        ...(config.presencePenalty && { presence_penalty: config.presencePenalty }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = response.statusText;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.message || errorText;
      } catch {
        errorMessage = errorText;
      }
      throw new Error(`Custom provider API error: ${errorMessage}`);
    }

    const data = await response.json();

    let totalCost = 0;
    if (config.cost_per_1k_input_tokens && config.cost_per_1k_output_tokens && data.usage) {
      const promptCost = (data.usage.prompt_tokens || 0) * (config.cost_per_1k_input_tokens / 1000);
      const completionCost = (data.usage.completion_tokens || 0) * (config.cost_per_1k_output_tokens / 1000);
      totalCost = promptCost + completionCost;
    }

    return {
      success: true,
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      cost_usd: totalCost,
      processing_time_ms: Date.now() - startTime
    };
}