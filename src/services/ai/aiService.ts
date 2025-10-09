import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import { AIConfigService, AIConfiguration } from './configService';
import { AIConfigurations } from '@/integrations/supabase/tables/ai_configurations';
import { AssessmentsEnhanced } from '@/integrations/supabase/tables/assessments_enhanced';
import { ChallengeTemplates } from '@/integrations/supabase/tables/challenge_templates';
import { Json, Tables } from '@/integrations/supabase/types';

export interface AIResponse {
  text?: string; // Made optional
  json?: Json;
  error?: string;
  tokensUsed?: number;
  cost?: number;
  processingTimeMs?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIServiceConfig extends AIConfiguration {
  // Add any AI-Service specific configurations here if needed
}

export class AIService {
  private static instance: AIService;
  public configService: AIConfigService;
  private configurations: Map<string, AIServiceConfig> = new Map();
  private defaultConfiguration: AIServiceConfig | null = null;

  private constructor() {
    this.configService = AIConfigService.getInstance();
    void this.loadConfigurations();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async loadConfigurations(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*');

      if (error) throw error;

      const configs = data as Tables<'ai_configurations'>['Row'][];

      this.configurations.clear();
      configs?.forEach(config => {
        this.configurations.set(config.id, {
          id: config.id,
          name: config.name,
          provider: config.provider as AIConfiguration['provider'],
          provider_name: config.provider_name,
          model: config.model_name,
          apiKey: config.api_key_encrypted,
          api_base_url: config.api_base_url,
          api_version: config.api_version,
          temperature: config.temperature,
          maxTokens: config.max_tokens,
          topP: config.top_p,
          frequencyPenalty: config.frequency_penalty,
          presencePenalty: config.presence_penalty,
          systemPrompt: config.system_prompt,
          isDefault: config.is_default,
          custom_headers: config.custom_headers,
          cost_per_1k_input_tokens: config.cost_per_1k_prompt_tokens,
          cost_per_1k_output_tokens: config.cost_per_1k_completion_tokens,
          user_prompt_template: config.user_prompt_template,
          created_by: config.created_by,
          test_status: config.test_status,
          last_tested: config.last_tested,
          is_active: config.is_active,
          description: config.description,
        });
      });

      // Also load the NewMe configuration with the system prompt
      const newMeConfig = configs?.find(c => c.name === 'NewMe Voice Agent');
      if (newMeConfig) {
        const baseConfig = this.configurations.get(newMeConfig.id);
        if (baseConfig) {
          this.defaultConfiguration = { ...baseConfig, systemPrompt: newMeConfig.system_prompt || baseConfig.systemPrompt };
        }
      }

      logger.info('AI configurations loaded successfully for AIService.');
    } catch (e) {
      logger.error('Failed to load AI configurations for AIService:', e);
    }
  }

  public getConfiguration(id: string): AIServiceConfig | undefined {
    return this.configurations.get(id);
  }

  public getDefaultConfiguration(): AIServiceConfig | null {
    return this.defaultConfiguration;
  }

  public async callAIProvider(config: AIServiceConfig, messages: AIMessage[], options?: { stream?: boolean; response_format?: 'json_object' | 'text' }): Promise<AIResponse> {
    logger.debug('Calling AI provider', { configId: config.id, model: config.model, provider: config.provider, stream: options?.stream });

    // This is a placeholder. In a real application, you would integrate with various AI providers.
    // For now, we'll simulate a response.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call delay

    const lastMessage = messages[messages.length - 1];
    let simulatedResponse = "I'm sorry, I don't have a real AI integration set up yet.";
    let jsonResponse: Json | undefined;

    if (options?.response_format === 'json_object') {
      jsonResponse = {
        message: "This is a simulated JSON response.",
        query: lastMessage.content,
        timestamp: new Date().toISOString()
      };
      simulatedResponse = JSON.stringify(jsonResponse);
    } else {
      simulatedResponse = `Echo: ${lastMessage.content}`;
    }

    return {
      text: simulatedResponse,
      json: jsonResponse,
      tokensUsed: Math.floor(Math.random() * 100) + 50,
      cost: parseFloat((Math.random() * 0.01).toFixed(4)),
      processingTimeMs: Math.floor(Math.random() * 500) + 200,
    };
  }

  public async checkRateLimit(userId: string, providerName: string): Promise<boolean> {
    // Placeholder for rate limiting logic
    logger.debug('Checking AI rate limit', { userId, providerName });
    return true; // Always allow for now
  }

  public async generateAssessmentAnalysis(
    assessment: AssessmentsEnhanced['Row'],
    submission: { answers: Record<string, string>; userId: string },
    aiConfigId?: string
  ): Promise<AIResponse> {
    const config = aiConfigId ? this.getConfiguration(aiConfigId) : this.getDefaultConfiguration();
    if (!config) {
      return { error: 'AI configuration not found for assessment analysis.' };
    }

    const prompt: AIMessage[] = [
      {
        role: 'system',
        content: config.systemPrompt || 'You are an expert psychological AI, providing insightful analysis of assessment responses.',
      },
      {
        role: 'user',
        content: `
      Please analyze the following assessment submission. Provide a comprehensive analysis, identify key insights, and offer actionable recommendations.
      ASSESSMENT: ${assessment.title} - ${assessment.description}
      QUESTIONS: ${JSON.stringify(assessment.questions, null, 2)}
      USER ANSWERS: ${JSON.stringify(submission.answers, null, 2)}
      
      Your response should be a JSON object with the following structure:
      {
        "overall_analysis": "string",
        "strengths_identified": ["string"],
        "growth_areas": ["string"],
        "ai_score": "number (0-100)",
        "ai_feedback": "string",
        "recommendations": ["string"]
      }
      `,
      },
    ];

    return this.callAIProvider(config, prompt, { response_format: 'json_object' });
  }

  public async generateQuizFeedback(
    quiz: AssessmentsEnhanced['Row'],
    submission: { answers: Record<string, string>; userId: string },
    aiConfigId?: string
  ): Promise<AIResponse> {
    const config = aiConfigId ? this.getConfiguration(aiConfigId) : this.getDefaultConfiguration();
    if (!config) {
      return { error: 'AI configuration not found for quiz feedback.' };
    }

    const metadata = {
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty_level,
      questions: quiz.questions,
    };

    const prompt: AIMessage[] = [
      {
        role: 'system',
        content: config.systemPrompt || 'You are an encouraging AI tutor, providing constructive feedback on quiz performance.',
      },
      {
        role: 'user',
        content: `
      Please provide feedback on the user's quiz submission. Highlight correct answers, explain incorrect ones, and offer tips for improvement.
      QUIZ METADATA: ${JSON.stringify(metadata, null, 2)}
      USER ANSWERS: ${JSON.stringify(submission.answers, null, 2)}
      `,
      },
    ];

    return this.callAIProvider(config, prompt);
  }

  public async generateChallengeInsights(
    challengeRecord: ChallengeTemplates['Row'],
    responses: Record<string, { initiator_response?: string; partner_response?: string }>,
    aiConfigId?: string
  ): Promise<AIResponse> {
    const config = aiConfigId ? this.getConfiguration(aiConfigId) : this.getDefaultConfiguration();
    if (!config) {
      return { error: 'AI configuration not found for challenge insights.' };
    }

    const challengeDetails = challengeRecord
      ? {
          title: challengeRecord.title,
          description: challengeRecord.description,
          category: challengeRecord.category,
          questions: challengeRecord.questions,
        }
      : null;

    const prompt: AIMessage[] = [
      {
        role: 'system',
        content: config.systemPrompt || 'You are a relationship expert AI, providing insights on couple\'s challenge responses.',
      },
      {
        role: 'user',
        content: `
      Please analyze the following couple's challenge responses. Provide insights into their communication, understanding, and areas for growth.
      CHALLENGE DETAILS: ${JSON.stringify(challengeDetails, null, 2)}
      COUPLE RESPONSES: ${JSON.stringify(responses, null, 2)}
      `,
      },
    ];

    return this.callAIProvider(config, prompt);
  }
}