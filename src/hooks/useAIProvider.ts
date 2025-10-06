import { useState, useEffect, useCallback } from "react";
import { 
  getAIUseCases, 
  getAIBehaviors, 
  getAIConfiguration, 
  generateAIResponse,
  type AIProviderConfig,
  type PromptTemplate,
  type AIBehavior
} from "@/lib/ai-provider-utils";

export interface AIUseCase {
  id: string;
  name: string;
  category: string;
}

export function useAIProvider() {
  const [useCases, setUseCases] = useState<AIUseCase[]>([]);
  const [behaviors, setBehaviors] = useState<AIBehavior[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUseCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAIUseCases();
      setUseCases(data);
    } catch (err) {
      setError("Failed to load AI use cases");
      console.error("Error loading use cases:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBehaviors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAIBehaviors();
      setBehaviors(data);
    } catch (err) {
      setError("Failed to load AI behaviors");
      console.error("Error loading behaviors:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getConfiguration = useCallback(async (useCaseId: string) => {
    setLoading(true);
    setError(null);
    try {
      const config = await getAIConfiguration(useCaseId);
      return config;
    } catch (err) {
      setError("Failed to load AI configuration");
      console.error("Error loading configuration:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateResponse = useCallback(async (
    useCaseId: string,
    userMessage: string,
    variables: Record<string, any> = {}
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await generateAIResponse(useCaseId, userMessage, variables);
      return response;
    } catch (err) {
      setError("Failed to generate AI response");
      console.error("Error generating response:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUseCases();
    loadBehaviors();
  }, [loadUseCases, loadBehaviors]);

  return {
    useCases,
    behaviors,
    loading,
    error,
    getConfiguration,
    generateResponse,
    refreshUseCases: loadUseCases,
    refreshBehaviors: loadBehaviors
  };
}

export function useAIConfiguration(useCaseId: string) {
  const [config, setConfig] = useState<{
    provider: AIProviderConfig;
    template: PromptTemplate;
    behavior?: AIBehavior;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfiguration = useCallback(async () => {
    if (!useCaseId) return;

    setLoading(true);
    setError(null);
    try {
      const configuration = await getAIConfiguration(useCaseId);
      setConfig(configuration);
    } catch (err) {
      setError("Failed to load AI configuration");
      console.error("Error loading configuration:", err);
    } finally {
      setLoading(false);
    }
  }, [useCaseId]);

  useEffect(() => {
    loadConfiguration();
  }, [loadConfiguration]);

  return {
    config,
    loading,
    error,
    refresh: loadConfiguration
  };
}

export function useAIResponse(useCaseId: string) {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = useCallback(async (
    userMessage: string,
    variables: Record<string, any> = {}
  ) => {
    if (!useCaseId) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const aiResponse = await generateAIResponse(useCaseId, userMessage, variables);
      setResponse(aiResponse);
    } catch (err) {
      setError("Failed to generate AI response");
      console.error("Error generating response:", err);
    } finally {
      setLoading(false);
    }
  }, [useCaseId]);

  const clearResponse = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return {
    response,
    loading,
    error,
    generateResponse,
    clearResponse
  };
}
