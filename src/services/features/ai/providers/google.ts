import type { AIConfiguration, AIResponse } from '../aiTypes';

export async function callGoogle(config: AIConfiguration, prompt: string, startTime: number): Promise<AIResponse> {
  try {
    if (!config.apiKey) {
      throw new Error('Google AI API key not configured');
    }

    const apiBase = config.api_base_url || 'https://generativelanguage.googleapis.com/v1beta';
    const model = config.model || 'gemini-1.5-flash';
    
    const response = await fetch(`${apiBase}/models/${model}:generateContent?key=${config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: config.temperature || 0.7,
          maxOutputTokens: config.maxTokens || 2048,
          topP: config.topP || 0.95,
          topK: 40,
        },
        systemInstruction: {
          parts: [{ text: config.systemPrompt || 'You are a helpful assistant.' }],
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Google Gemini API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Google AI');
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error('Empty response from Google AI');
    }

    const content = candidate.content.parts[0].text;
    if (!content) {
      throw new Error('No text content in Google AI response');
    }

    // Calculate real usage and costs
    const usage = data.usageMetadata || {};
    const promptTokens = usage.promptTokenCount || 0;
    const completionTokens = usage.candidatesTokenCount || 0;
    const totalTokens = usage.totalTokenCount || (promptTokens + completionTokens);
    
    // Google Gemini pricing (as of 2024)
    const inputCostPer1K = 0.00075; // $0.00075 per 1K input tokens
    const outputCostPer1K = 0.003; // $0.003 per 1K output tokens
    const cost = (promptTokens / 1000 * inputCostPer1K) + (completionTokens / 1000 * outputCostPer1K);

    return {
      success: true,
      content,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
      },
      cost_usd: cost,
      model: model,
      processing_time_ms: Date.now() - startTime,
      finish_reason: candidate.finishReason || 'stop'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: Date.now() - startTime
    };
  }
}