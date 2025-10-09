import { useState, useCallback } from 'react';
import { aiService, AIMessage } from '@/services/AIService';
import { toast } from 'sonner';

export function useAIResponse(serviceType: string) {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = useCallback(async (userMessage: string, variables: Record<string, string>) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // In a real scenario, we'd use the serviceType to get a specific config
      const config = aiService.getDefaultConfiguration();
      if (!config) {
        throw new Error('Default AI configuration is not available.');
      }

      // Simple variable replacement
      let processedMessage = config.user_prompt_template || userMessage;
      for (const key in variables) {
        processedMessage = processedMessage.replace(`{{${key}}}`, variables[key]);
      }

      const messages: AIMessage[] = [
        { role: 'system', content: config.systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: processedMessage },
      ];

      const aiResult = await aiService.callAIProvider(config, messages);

      if (aiResult.error) {
        throw new Error(aiResult.error);
      }

      setResponse(aiResult.text || null);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast.error(`AI analysis failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [serviceType]);

  const clearResponse = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return { response, loading, error, generateResponse, clearResponse };
}