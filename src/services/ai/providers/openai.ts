import type { AIConfiguration, AIResponse } from '../aiTypes';

function getOpenAICost(modelName: string): { prompt: number; completion: number } {
  const costs: Record<string, { prompt: number; completion: number }> = {
    'gpt-4': { prompt: 0.03, completion: 0.06 },
    'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
    'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 }
  };
  return costs[modelName] || { prompt: 0.001, completion: 0.002 };
}

export async function callOpenAI(config: AIConfiguration, prompt: string, startTime: number): Promise<AIResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || config.apiKey;
  if (!apiKey) throw new Error('OpenAI API key not configured.');

  const response = await fetch(`${config.api_base_url || 'https://api.openai.com'}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    const costPerToken = getOpenAICost(config.model);
    const promptCost = (data.usage?.prompt_tokens || 0) * costPerToken.prompt;
    const completionCost = (data.usage?.completion_tokens || 0) * costPerToken.completion;
    const totalCost = promptCost + completionCost;

    return {
      success: true,
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      cost_usd: totalCost,
      processing_time_ms: Date.now() - startTime
    };
}