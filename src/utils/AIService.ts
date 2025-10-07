import { supabase } from "@/integrations/supabase/client";
import { NEWME_SYSTEM_PROMPT, NEWME_GREETING_TEMPLATES } from "@/config/newme-system-prompt";
import { newMeMemoryService } from "@/services/NewMeMemoryService";
import type {
  AssessmentAnswers,
  QuizAnswers,
  ProgressData,
  CacheData,
  AIResponseData,
  ProviderConfiguration,
  AssessmentResponseData,
  QuizResponseData
} from "@/types/ai-types";

export interface AIConfiguration {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' | 'elevenlabs' | 'cartesia' | 'deepgram' | 'hume';
  provider_name?: string;
  model: string;  // Note: using 'model' to match other parts of code
  apiKey: string;
  api_base_url?: string;
  api_version?: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  isDefault?: boolean;
  custom_headers?: Record<string, string>;
  cost_per_1k_input_tokens?: number;
  cost_per_1k_output_tokens?: number;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost_usd?: number;
  processing_time_ms: number;
  error?: string;
}

export interface AssessmentSubmission {
  assessment_id: string;
  answers: AssessmentAnswers;
  user_id: string;
}

export interface QuizSubmission {
  quiz_id: string;
  answers: QuizAnswers;
  user_id: string;
  time_taken_seconds?: number;
}

export interface ChallengeSubmission {
  challenge_id: string;
  progress_data: ProgressData;
  user_id: string;
}

export class AIService {
  private configurations: Map<string, AIConfiguration> = new Map();
  private rateLimitMap: Map<string, number[]> = new Map();
  private cache: Map<string, { data: AIResponse; timestamp: number }> = new Map();

  constructor() {
    this.loadConfigurations();
  }

  private async loadConfigurations() {
    try {
      const { data, error } = await supabase
        .from('ai_configurations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      this.configurations.clear();
      data?.forEach(config => {
        this.configurations.set(config.id, {
          id: config.id,
          name: config.name,
          provider: config.provider as 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' | 'elevenlabs' | 'cartesia' | 'deepgram' | 'hume',
          provider_name: config.provider_name || undefined,
          model: config.model_name,
          apiKey: config.api_key_encrypted || '', // Note: This should be decrypted in production
          api_base_url: config.api_base_url || undefined,
          api_version: config.api_version || undefined,
          temperature: Number(config.temperature),
          maxTokens: config.max_tokens,
          topP: config.top_p ? Number(config.top_p) : undefined,
          frequencyPenalty: config.frequency_penalty ? Number(config.frequency_penalty) : undefined,
          presencePenalty: config.presence_penalty ? Number(config.presence_penalty) : undefined,
          systemPrompt: config.system_prompt || undefined,
          isDefault: config.is_default || false,
          custom_headers: (config.custom_headers as Record<string, string>) || undefined,
          cost_per_1k_input_tokens: config.cost_per_1k_prompt_tokens ? Number(config.cost_per_1k_prompt_tokens) : undefined,
          cost_per_1k_output_tokens: config.cost_per_1k_completion_tokens ? Number(config.cost_per_1k_completion_tokens) : undefined,
        });
      });

      // Also load the NewMe configuration with the system prompt
      const newMeConfig = data?.find(c => c.name === 'NewMe Voice Agent');
      if (newMeConfig) {
        const baseConfig = this.configurations.get(newMeConfig.id);
        if (baseConfig) {
          this.configurations.set('newme-voice-agent', {
            ...baseConfig,
            systemPrompt: NEWME_SYSTEM_PROMPT,
          });
        }
      } else {
        // Fallback NewMe configuration
        this.configurations.set('newme-voice-agent', {
          id: 'newme-voice-agent',
          name: 'NewMe Voice Agent',
          provider: 'openai',
          model: 'gpt-4-turbo-preview',
          apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
          temperature: 0.8,
          maxTokens: 2000,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.6,
          systemPrompt: NEWME_SYSTEM_PROMPT,
        });
      }
    } catch (dbError) {
      console.warn('Could not load AI configurations from database:', dbError);
      // Set up fallback NewMe configuration
      this.configurations.set('newme-voice-agent', {
        id: 'newme-voice-agent',
        name: 'NewMe Voice Agent',
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
        temperature: 0.8,
        maxTokens: 2000,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.6,
        systemPrompt: NEWME_SYSTEM_PROMPT,
      });
    }
  }

  async generateAssessmentResult(submission: AssessmentSubmission, configId?: string): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const config = configId
        ? this.configurations.get(configId)
        : await this.getBestConfigurationForAssessment(submission.assessment_id);

      if (!config) {
        throw new Error('No suitable AI configuration found');
      }

      // Check rate limiting
      if (!this.checkRateLimit(submission.user_id)) {
        throw new Error('Rate limit exceeded. Please wait before submitting again.');
      }

      // Check cache
      const cacheKey = `assessment_${submission.assessment_id}_${submission.user_id}_${JSON.stringify(submission.answers)}`;
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return { ...cached, processing_time_ms: Date.now() - startTime };
      }

      const prompt = await this.buildAssessmentPrompt(submission, config);

      const response = await this.callAIProvider(config, prompt);

      if (!response.success) {
        throw new Error(response.error || 'AI processing failed');
      }

      // Parse AI response
      const result = this.parseAssessmentResponse(response.content!);

      // Log usage (skip until database functions are available)
      console.log('AI usage logging skipped until database is set up');

      const aiResponse: AIResponse = {
        success: true,
        content: response.content,
        usage: response.usage,
        cost_usd: response.cost_usd,
        processing_time_ms: Date.now() - startTime
      };

      // Cache result
      this.setCachedResult(cacheKey, aiResponse);

      return aiResponse;

    } catch (error) {
      console.error('Error generating assessment result:', error);

      await this.logAIUsage(
        this.configurations.get(configId || '')!,
        submission.user_id,
        'assessment',
        submission.assessment_id,
        0, 0, 0, 0, false,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  async generateQuizResult(submission: QuizSubmission, configId?: string): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const config = configId
        ? this.configurations.get(configId)
        : await this.getBestConfigurationForQuiz(submission.quiz_id);

      if (!config) {
        throw new Error('No suitable AI configuration found');
      }

      // Check rate limiting
      if (!this.checkRateLimit(submission.user_id)) {
        throw new Error('Rate limit exceeded. Please wait before submitting again.');
      }

      const prompt = await this.buildQuizPrompt(submission, config);
      const response = await this.callAIProvider(config, prompt);

      if (!response.success) {
        throw new Error(response.error || 'AI processing failed');
      }

      const result = this.parseQuizResponse(response.content!);

      // Log usage (skip until database functions are available)
      console.log('AI usage logging skipped until database is set up');

      return {
        success: true,
        content: response.content,
        usage: response.usage,
        cost_usd: response.cost_usd,
        processing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error generating quiz result:', error);

      await this.logAIUsage(
        this.configurations.get(configId || '')!,
        submission.user_id,
        'quiz',
        submission.quiz_id,
        0, 0, 0, 0, false,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  async generateChallengeFeedback(submission: ChallengeSubmission, configId?: string): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      const config = configId
        ? this.configurations.get(configId)
        : await this.getBestConfigurationForChallenge(submission.challenge_id);

      if (!config) {
        throw new Error('No suitable AI configuration found');
      }

      const prompt = await this.buildChallengePrompt(submission, config);
      const response = await this.callAIProvider(config, prompt);

      if (!response.success) {
        throw new Error(response.error || 'AI processing failed');
      }

      // Log usage (skip until database functions are available)
      console.log('AI usage logging skipped until database is set up');

      return {
        success: true,
        content: response.content,
        usage: response.usage,
        cost_usd: response.cost_usd,
        processing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error generating challenge feedback:', error);

      await this.logAIUsage(
        this.configurations.get(configId || '')!,
        submission.user_id,
        'challenge',
        submission.challenge_id,
        0, 0, 0, 0, false,
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  private async callAIProvider(config: AIConfiguration, prompt: string): Promise<AIResponse> {
    const startTime = Date.now();

    try {
      switch (config.provider) {
        case 'openai':
          return await this.callOpenAI(config, prompt, startTime);
        case 'anthropic':
          return await this.callAnthropic(config, prompt, startTime);
        case 'google':
          return await this.callGoogle(config, prompt, startTime);
        case 'elevenlabs':
          return await this.callElevenLabs(config, prompt, startTime);
        case 'cartesia':
        case 'deepgram':
        case 'hume':
        case 'azure':
        case 'custom':
          return await this.callCustomProvider(config, prompt, startTime);
        default:
          throw new Error(`Unsupported AI provider: ${config.provider}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI provider call failed',
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  private async callOpenAI(config: AIConfiguration, prompt: string, startTime: number): Promise<AIResponse> {
    // Use VITE_OPENAI_API_KEY for client-side calls
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

      // Calculate cost (approximate)
      const costPerToken = this.getOpenAICost(config.model);
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

  private async callAnthropic(config: AIConfiguration, prompt: string, startTime: number): Promise<AIResponse> {
    const response = await fetch(`${config.api_base_url || 'https://api.anthropic.com'}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey || 'your-api-key', // Anthropic uses x-api-key
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

      // Calculate cost (approximate)
      const costPerToken = this.getAnthropicCost(config.model);
      const inputCost = (data.usage?.input_tokens || 0) * costPerToken.input;
      const outputCost = (data.usage?.output_tokens || 0) * costPerToken.output;
      const totalCost = inputCost + outputCost;

      return {
        success: true,
        content: data.content[0]?.text || '',
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens: data.usage?.input_tokens + data.usage?.output_tokens || 0
        },
        cost_usd: totalCost,
        processing_time_ms: Date.now() - startTime
      };
  }

  private async callGoogle(config: AIConfiguration, prompt: string, startTime: number): Promise<AIResponse> {
    // Google Gemini API
    const response = await fetch(`${config.api_base_url || 'https://generativelanguage.googleapis.com/v1beta'}/models/${config.model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': config.apiKey || 'your-api-key', // Google uses x-goog-api-key
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

    // Placeholder for usage and cost calculation for Gemini
    return {
      success: true,
      content: content,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost_usd: 0,
      processing_time_ms: Date.now() - startTime,
    };
  }

  private async callElevenLabs(config: AIConfiguration, prompt: string, startTime: number): Promise<AIResponse> {
    // ElevenLabs TTS API
    const voiceId = config.model; // Assuming model field stores voice_id for ElevenLabs
    const response = await fetch(`${config.api_base_url || 'https://api.elevenlabs.io/v1'}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': config.apiKey || 'your-api-key', // ElevenLabs uses xi-api-key
      },
      body: JSON.stringify({
        text: prompt,
        model_id: 'eleven_multilingual_v2', // Default model for TTS
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`ElevenLabs API error: ${errorData.detail?.[0]?.msg || response.statusText}`);
    }

    // ElevenLabs returns audio stream, not text content directly
    // For this AIResponse, we'll return a placeholder or a URL to the audio
    return {
      success: true,
      content: `Audio generated for prompt: "${prompt}"`, // Placeholder text
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      cost_usd: 0,
      processing_time_ms: Date.now() - startTime,
    };
  }

  /**
   * Call custom OpenAI-compatible provider (Azure OpenAI, Groq, Together AI, etc.)
   * Supports custom base URLs, API versions, and headers
   */
  private async callCustomProvider(config: AIConfiguration, prompt: string, startTime: number): Promise<AIResponse> {
    if (!config.api_base_url) {
      throw new Error('Custom provider requires api_base_url to be configured');
    }

    // Build headers - merge custom headers with authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.custom_headers || {})
    };

    // Add API key - support different auth header formats
    if (config.apiKey) {
      // Azure uses different auth, others typically use Bearer token
      if (config.provider === 'azure') {
        headers['api-key'] = config.apiKey;
      } else if (config.provider === 'deepgram') {
        headers['Authorization'] = `Token ${config.apiKey}`; // Deepgram uses Token
      } else if (config.provider === 'hume') {
        headers['X-Hume-Api-Key'] = config.apiKey; // Hume AI uses X-Hume-Api-Key
      } else if (config.provider === 'cartesia') {
        headers['X-Cartesia-API-Key'] = config.apiKey; // Cartesia uses X-Cartesia-API-Key
      }
      else {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
    }

    // Build URL - handle Azure's special URL structure with API version
    let url = config.api_base_url;
    if (config.provider === 'azure' && config.api_version) {
      // Azure URL format: {base_url}/openai/deployments/{model}/chat/completions?api-version={version}
      url = `${config.api_base_url}/openai/deployments/${config.model}/chat/completions?api-version=${config.api_version}`;
    } else if (!url.includes('/chat/completions') && config.provider !== 'elevenlabs' && config.provider !== 'deepgram' && config.provider !== 'hume' && config.provider !== 'cartesia') {
      // Standard OpenAI-compatible endpoint
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

    // Calculate cost if available from config
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

  private async buildAssessmentPrompt(submission: AssessmentSubmission, config: AIConfiguration): Promise<string> {
    // Get assessment details
    const { data: assessment } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', submission.assessment_id)
      .single();

    if (!assessment) throw new Error('Assessment not found');

    return `
      Please analyze the following assessment responses and provide detailed feedback:

      Assessment: ${assessment.title}
      Type: ${assessment.type}

      Responses:
      ${JSON.stringify(submission.answers, null, 2)}

      Please provide:
      1. Overall score (0-100)
      2. Personality traits identified
      3. Strengths discovered
      4. Areas for improvement
      5. Detailed explanations for each response
      6. Personalized recommendations

      Format your response as JSON.
    `;
  }

  private async buildQuizPrompt(submission: QuizSubmission, config: AIConfiguration): Promise<string> {
    // Note: Quizzes table not yet implemented in database
    // Using basic prompt template for now
    return `
      Please grade the following quiz submission:

      Quiz ID: ${submission.quiz_id}

      Answers:
      ${JSON.stringify(submission.answers, null, 2)}

      Please provide:
      1. Score for each question (0-100)
      2. Overall percentage score
      3. Correct/incorrect status for each answer
      4. Explanations for each question
      5. Learning recommendations

      Format your response as JSON.
    `;
  }

  private async buildChallengePrompt(submission: ChallengeSubmission, config: AIConfiguration): Promise<string> {
    // Note: Challenges table not yet implemented in database
    // Using basic prompt template for now
    return `
      Please provide feedback for the following challenge progress:

      Challenge ID: ${submission.challenge_id}

      Progress Data:
      ${JSON.stringify(submission.progress_data, null, 2)}

      Please provide:
      1. Progress assessment (0-100)
      2. Encouraging feedback
      3. Specific suggestions for improvement
      4. Motivational message
      5. Next steps recommendation

      Format your response as JSON.
    `;
  }

  private parseAssessmentResponse(content: string): AssessmentResponseData {
    try {
      return JSON.parse(content);
    } catch {
      // Fallback parsing for non-JSON responses
      return {
        raw_feedback: content,
        score: 75,
        traits: ['Adaptable'],
        strengths: ['Good communication'],
        improvements: ['Continue developing skills']
      };
    }
  }

  private parseQuizResponse(content: string): QuizResponseData {
    try {
      return JSON.parse(content);
    } catch {
      return {
        raw_feedback: content,
        score: 75,
        explanations: ['Good effort on this quiz']
      };
    }
  }

  private async getBestConfigurationForAssessment(assessmentId: string): Promise<AIConfiguration | null> {
    return this.getConfigurationForService('assessment_generation', assessmentId);
  }

  private async getBestConfigurationForQuiz(quizId: string): Promise<AIConfiguration | null> {
    return this.getConfigurationForService('quiz_generation', quizId);
  }

  private async getBestConfigurationForChallenge(challengeId: string): Promise<AIConfiguration | null> {
    return this.getConfigurationForService('challenge_generation', challengeId);
  }

  private async getConfigurationForService(
    serviceType: string,
    serviceId?: string
  ): Promise<AIConfiguration | null> {
    try {
      // Use database function to get best config with service mappings
      const { data, error } = await supabase.rpc('get_ai_config_for_service', {
        p_service_type: serviceType,
        p_service_id: serviceId || null
      });

      if (error) {
        console.warn(`Error getting config for ${serviceType}:`, error);
        return this.getDefaultConfiguration();
      }

      // RPC returns an array, get first element
      const configData = Array.isArray(data) ? data[0] : data;

      if (!configData) {
        return this.getDefaultConfiguration();
      }

      // Map database row to AIConfiguration interface
      const config: AIConfiguration = {
        id: configData.config_id,
        name: configData.config_name,
        provider: configData.provider as 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' | 'elevenlabs' | 'cartesia' | 'deepgram' | 'hume',
        model: configData.model_name,
        apiKey: '', // API key should be fetched securely, not from this function
        temperature: Number(configData.temperature),
        maxTokens: configData.max_tokens,
        topP: configData.top_p ? Number(configData.top_p) : undefined,
        frequencyPenalty: configData.frequency_penalty ? Number(configData.frequency_penalty) : undefined,
        presencePenalty: configData.presence_penalty ? Number(configData.presence_penalty) : undefined,
        systemPrompt: configData.system_prompt || undefined,
        isDefault: configData.is_default || false,
        provider_name: configData.provider_name || undefined,
        api_base_url: configData.api_base_url || undefined,
        api_version: configData.api_version || undefined,
        custom_headers: (configData.custom_headers as Record<string, string>) || undefined,
        cost_per_1k_input_tokens: configData.cost_per_1k_input_tokens ? Number(configData.cost_per_1k_input_tokens) : undefined,
        cost_per_1k_output_tokens: configData.cost_per_1k_output_tokens ? Number(configData.cost_per_1k_output_tokens) : undefined
      };

      // Get API key from main configurations map
      const storedConfig = Array.from(this.configurations.values()).find(c => c.id === config.id);
      if (storedConfig) {
        config.apiKey = storedConfig.apiKey;
      }

      return config;
    } catch (error) {
      console.error(`Error in getConfigurationForService(${serviceType}):`, error);
      return this.getDefaultConfiguration();
    }
  }

  private getDefaultConfiguration(): AIConfiguration | null {
    // Return first active configuration or NewMe config
    for (const config of this.configurations.values()) {
      if (config.id === 'newme' || config.isDefault) {
        return config;
      }
    }
    return Array.from(this.configurations.values())[0] || null;
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    if (!this.rateLimitMap.has(userId)) {
      this.rateLimitMap.set(userId, []);
    }

    const userRequests = this.rateLimitMap.get(userId)!;
    const recentRequests = userRequests.filter(time => time > windowStart);

    // Allow max 10 requests per minute
    if (recentRequests.length >= 10) {
      return false;
    }

    recentRequests.push(now);
    this.rateLimitMap.set(userId, recentRequests);
    return true;
  }

  private getCachedResult(key: string): AIResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
      return cached.data;
    }
    return null;
  }

  private setCachedResult(key: string, data: AIResponse): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async logAIUsage(
    config: AIConfiguration,
    userId: string,
    contentType: string,
    contentId: string,
    promptTokens: number,
    completionTokens: number,
    totalTokens: number,
    costUsd: number,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      // Skip logging until database functions are available
      console.log('AI usage logging skipped until database is set up');
    } catch (error) {
      console.error('Error logging AI usage:', error);
    }
  }

  private getOpenAICost(modelName: string): { prompt: number; completion: number } {
    const costs: Record<string, { prompt: number; completion: number }> = {
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
      'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 }
    };
    return costs[modelName] || { prompt: 0.001, completion: 0.002 };
  }

  private getAnthropicCost(modelName: string): { input: number; output: number } {
    const costs: Record<string, { input: number; output: number }> = {
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
    };
    return costs[modelName] || { input: 0.003, output: 0.015 };
  }

  // Admin methods for configuration management
  async createConfiguration(config: Omit<AIConfiguration, 'id'>): Promise<boolean> {
    try {
      // Map AIConfiguration to database schema
      const dbConfig = {
        name: config.name,
        provider: config.provider,
        provider_name: config.provider_name,
        model_name: config.model,
        api_key_encrypted: config.apiKey, // Note: Should encrypt before storing
        api_base_url: config.api_base_url,
        api_version: config.api_version,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
        system_prompt: config.systemPrompt,
        custom_headers: config.custom_headers,
        is_default: config.isDefault,
        cost_per_1k_prompt_tokens: config.cost_per_1k_input_tokens,
        cost_per_1k_completion_tokens: config.cost_per_1k_output_tokens,
      };

      const { error } = await supabase
        .from('ai_configurations')
        .insert(dbConfig);

      if (error) throw error;

      await this.loadConfigurations(); // Reload configurations
      return true;
    } catch (error) {
      console.error('Error creating AI configuration:', error);
      return false;
    }
  }

  async updateConfiguration(id: string, updates: Partial<AIConfiguration>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_configurations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await this.loadConfigurations();
      return true;
    } catch (error) {
      console.error('Error updating AI configuration:', error);
      return false;
    }
  }

  async deleteConfiguration(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.configurations.delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting AI configuration:', error);
      return false;
    }
  }

  getConfigurations(): AIConfiguration[] {
    return Array.from(this.configurations.values());
  }

  getConfiguration(id: string): AIConfiguration | null {
    return this.configurations.get(id) || null;
  }

  /**
   * NewMe Voice Agent - Generate conversational response with memory integration
   */
  async generateNewMeResponse(
    userMessage: string,
    userId: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    conversationId?: string
  ): Promise<AIResponse & { conversationId?: string }> {
    const startTime = Date.now();

    try {
      const config = this.configurations.get('newme-voice-agent');
      if (!config) {
        throw new Error('NewMe Voice Agent configuration not found');
      }

      // Check rate limiting
      if (!this.checkRateLimit(userId)) {
        throw new Error('Rate limit exceeded. Please wait before continuing the conversation.');
      }

      // Get or create active conversation
      let activeConversation = conversationId
        ? null
        : await newMeMemoryService.getActiveConversation(userId);

      if (!activeConversation && !conversationId) {
        activeConversation = await newMeMemoryService.createConversation({
          user_id: userId,
          topics_discussed: [],
          emotional_tone: 'neutral'
        });
      }

      const currentConversationId = conversationId || activeConversation?.id;

      // Load user context from memory system
      const userContext = await newMeMemoryService.getUserContext(userId);

      // Build context-aware prompt
      let contextPrompt = '';
      if (userContext) {
        contextPrompt = `\n\n### CURRENT USER CONTEXT:\n`;

        // Add nickname if available
        if (userContext.nickname) {
          contextPrompt += `- User's preferred nickname: ${userContext.nickname}\n`;
        }

        // Add important memories
        if (userContext.important_memories && userContext.important_memories.length > 0) {
          contextPrompt += `- Important memories:\n`;
          userContext.important_memories.slice(0, 5).forEach(memory => {
            contextPrompt += `  * ${memory.type}: ${memory.key} = ${memory.value}\n`;
          });
        }

        // Add last conversation info
        if (userContext.last_conversation_date) {
          const daysSince = newMeMemoryService.calculateDaysSinceLastConversation(
            userContext.last_conversation_date
          );
          contextPrompt += `- Last conversation: ${daysSince} days ago\n`;
          if (userContext.last_conversation_topic) {
            contextPrompt += `- Last topic: ${userContext.last_conversation_topic}\n`;
          }
        }

        // Add emotional patterns
        if (userContext.emotional_patterns && userContext.emotional_patterns.length > 0) {
          contextPrompt += `- Emotional patterns: ${userContext.emotional_patterns.slice(0, 3).join(', ')}\n`;
        }

        // Add completed assessments
        if (userContext.completed_assessments && userContext.completed_assessments.length > 0) {
          contextPrompt += `- Completed assessments: ${userContext.completed_assessments.join(', ')}\n`;
        }
      }

      // Build conversation messages as a string prompt
      let fullPrompt = (config.systemPrompt || '') + contextPrompt + '\n\n';

      // Add conversation history
      if (conversationHistory.length > 0) {
        fullPrompt += '### CONVERSATION HISTORY:\n';
        conversationHistory.forEach(msg => {
          fullPrompt += `${msg.role.toUpperCase()}: ${msg.content}\n`;
        });
        fullPrompt += '\n';
      }

      // Add current user message
      fullPrompt += `### CURRENT USER MESSAGE:\nUSER: ${userMessage}\n\n`;
      fullPrompt += 'Respond as NewMe, staying fully in character:';

      const response = await this.callAIProvider(config, fullPrompt);

      if (!response.success) {
        throw new Error(response.error || 'AI processing failed');
      }

      // Store message in memory if we have a conversation ID
      if (currentConversationId) {
        await newMeMemoryService.addMessage({
          conversation_id: currentConversationId,
          role: 'user',
          content: userMessage
        });

        if (response.content) {
          await newMeMemoryService.addMessage({
            conversation_id: currentConversationId,
            role: 'assistant',
            content: response.content
          });
        }
      }

      // Log usage
      try {
        await this.logAIUsage(
          config,
          userId,
          'voice_conversation',
          'newme-voice-agent',
          response.usage?.prompt_tokens || 0,
          response.usage?.completion_tokens || 0,
          response.usage?.total_tokens || 0,
          response.cost_usd || 0,
          true,
          undefined
        );
      } catch (logError) {
        console.warn('Failed to log AI usage:', logError);
      }

      return {
        success: true,
        content: response.content,
        usage: response.usage,
        cost_usd: response.cost_usd,
        processing_time_ms: Date.now() - startTime,
        conversationId: currentConversationId
      };

    } catch (error) {
      console.error('Error generating NewMe response:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Get NewMe greeting based on user context from memory system
   */
  async getNewMeGreeting(userId: string): Promise<string> {
    try {
      // Load user context from memory
      const userContext = await newMeMemoryService.getUserContext(userId);

      // Check if first time user
      if (!userContext || !userContext.last_conversation_date) {
        const templates = NEWME_GREETING_TEMPLATES.firstTime;
        return templates[Math.floor(Math.random() * templates.length)];
      }

      // Calculate days since last conversation
      const daysSince = newMeMemoryService.calculateDaysSinceLastConversation(
        userContext.last_conversation_date
      );

      // Get nickname if available
      const nickname = userContext.nickname;

      // After long break
      if (daysSince > 7) {
        const templates = NEWME_GREETING_TEMPLATES.afterLongBreak;
        let greeting = templates[Math.floor(Math.random() * templates.length)];
        if (nickname) {
          greeting = greeting.replace('[nickname]', nickname);
        }
        // Use last conversation topic if available
        if (userContext.last_conversation_topic) {
          greeting = greeting.replace('[last topic]', userContext.last_conversation_topic);
        } else {
          greeting = greeting.replace(' about [last topic]', '');
        }
        return greeting;
      }

      // Returning user
      const templates = NEWME_GREETING_TEMPLATES.returning;
      let greeting = templates[Math.floor(Math.random() * templates.length)];
      if (nickname) {
        greeting = greeting.replace('[nickname]', nickname);
      }
      return greeting;
    } catch (error) {
      console.error('Error getting NewMe greeting:', error);
      // Fallback to generic greeting
      return NEWME_GREETING_TEMPLATES.firstTime[0];
    }
  }
}

// Singleton instance
export const aiService = new AIService();