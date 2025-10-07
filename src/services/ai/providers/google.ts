import type { AIConfiguration, AIResponse } from '../aiTypes';

export async function callGoogle(config: AIConfiguration, prompt: string, startTime: number): Promise<AIResponse> {
    const response = await fetch(`${config.api_base_url || 'https://generativelanguage.googleapis.com/v1beta'}/models/${config.model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
          topP: config.topP,
        },
        systemInstruction: {
          parts: [{ text: config.systemPrompt || 'You are a helpful assistant.' }],
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      success: true,
      content: content,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }, // Placeholder
      cost_usd: 0, // Placeholder
      processing_time_ms: Date.now() - startTime,
    };
}