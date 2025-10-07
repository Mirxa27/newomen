import type { AIConfiguration, AIResponse } from '../aiTypes';

function getAnthropicCost(modelName: string): { input: number; output: number } {
    const costs: Record<string, { input: number; output: number }> = {
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
    };
    return costs[modelName] || { input: 0.003, output: 0.015 };
}

export async function callAnthropic(config: AIConfiguration, prompt: string, startTime: number): Promise<AIResponse> {
    const response = await fetch(`${config.api_base_url || 'https://api.anthropic.com'}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          system: config.systemPrompt,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          top_p: config.topP,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      const costPerToken = getAnthropicCost(config.model);
      const inputCost = (data.usage?.input_tokens || 0) * costPerToken.input;
      const outputCost = (data.usage?.output_tokens || 0) * costPerToken.output;
      const totalCost = inputCost + outputCost;

      return {
        success: true,
        content: data.content[0]?.text || '',
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        cost_usd: totalCost,
        processing_time_ms: Date.now() - startTime
      };
}