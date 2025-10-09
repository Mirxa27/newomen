import { useState, useEffect, useCallback } from 'react';
import {
  getAIUseCases,
  getAIBehaviors,
  getAIConfiguration,
  generateAIResponse,
  type AIProviderConfig,
  type PromptTemplate,
  type AIBehavior
} from '@/lib/ai-provider-utils';

interface AIConfig {
  provider: AIProviderConfig;
  template: PromptTemplate;
  behavior?: AIBehavior;
}

export function useAIProvider() {
  const [useCases, setUseCases] = useState<any[]>([]);
  const [behaviors, setBehaviors] = useState<AIBehavior[]>([]);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [useCasesData, behaviorsData] = await Promise.all([
        getAIUseCases(),
        getAIBehaviors(),
      ]);
      setUseCases(useCasesData);
      setBehaviors(behaviorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize AI provider.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const selectUseCase = useCallback(async (useCaseId: string) => {
    setLoading(true);
    try {
      const configuration = await getAIConfiguration(useCaseId);
      if (configuration) {
        // Assuming a default/placeholder template
        const placeholderTemplate: PromptTemplate = { id: 'default', content: 'User input: {{input}}' };
        setConfig({ ...configuration, template: placeholderTemplate });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  const generateResponse = useCallback(async (inputs: Record<string, string>) => {
    if (!config) {
      throw new Error('AI provider is not configured.');
    }
    return await generateAIResponse(config, inputs);
  }, [config]);

  return {
    loading,
    error,
    useCases,
    behaviors,
    config,
    selectUseCase,
    generateResponse,
  };
}