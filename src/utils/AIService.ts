import { supabase } from "@/integrations/supabase/client";
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
  provider: 'openai' | 'anthropic' | 'google' | 'azure';
  model_name: string;
  api_base_url?: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  system_prompt?: string;
  user_prompt_template?: string;
  scoring_prompt_template?: string;
  feedback_prompt_template?: string;
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
      // Try to load from database, fallback to default configurations
      try {
        const { data, error } = await supabase
          .from('ai_configurations')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;

        this.configurations.clear();
        data?.forEach(config => {
          this.configurations.set(config.id, config as AIConfiguration);
        });
      } catch (dbError) {
        console.warn('AI configurations table not available yet, using default configurations');
        // Set up default configurations
        this.configurations.set('default-assessment', {
          id: 'default-assessment',
          name: 'OpenAI GPT-4 Assessment',
          provider: 'openai',
          model_name: 'gpt-4',
          temperature: 0.7,
          max_tokens: 1500,
          top_p: 1.0,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
          system_prompt: 'You are an expert psychologist and assessment evaluator. Provide detailed, constructive feedback.'
        });

        this.configurations.set('default-quiz', {
          id: 'default-quiz',
          name: 'OpenAI GPT-3.5 Quiz Grading',
          provider: 'openai',
          model_name: 'gpt-3.5-turbo',
          temperature: 0.3,
          max_tokens: 1000,
          top_p: 1.0,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
          system_prompt: 'You are a precise quiz grader. Provide accurate scoring and clear explanations.'
        });
      }
    } catch (error) {
      console.error('Error loading AI configurations:', error);
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
    // Get API key from Supabase secrets (in production)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(`${config.api_base_url || 'https://api.openai.com'}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || 'your-api-key'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model_name,
          messages: [
            { role: 'system', content: config.system_prompt || 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          top_p: config.top_p,
          frequency_penalty: config.frequency_penalty,
          presence_penalty: config.presence_penalty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      // Calculate cost (approximate)
      const costPerToken = this.getOpenAICost(config.model_name);
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
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY || 'your-api-key',
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model_name,
          system: config.system_prompt,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.max_tokens,
          temperature: config.temperature,
          top_p: config.top_p,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      // Calculate cost (approximate)
      const costPerToken = this.getAnthropicCost(config.model_name);
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

  private async buildAssessmentPrompt(submission: AssessmentSubmission, config: AIConfiguration): Promise<string> {
    // Get assessment details
    const { data: assessment } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', submission.assessment_id)
      .single();

    if (!assessment) throw new Error('Assessment not found');

    const template = config.user_prompt_template || `
      Please analyze the following assessment responses and provide detailed feedback:

      Assessment: ${assessment.title}
      Type: ${assessment.assessment_type}

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

    return template;
  }

  private async buildQuizPrompt(submission: QuizSubmission, config: AIConfiguration): Promise<string> {
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', submission.quiz_id)
      .single();

    if (!quiz) throw new Error('Quiz not found');

    const template = config.user_prompt_template || `
      Please grade the following quiz submission:

      Quiz: ${quiz.title}
      Category: ${quiz.category}

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

    return template;
  }

  private async buildChallengePrompt(submission: ChallengeSubmission, config: AIConfiguration): Promise<string> {
    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', submission.challenge_id)
      .single();

    if (!challenge) throw new Error('Challenge not found');

    const template = config.user_prompt_template || `
      Please provide feedback for the following challenge progress:

      Challenge: ${challenge.title}
      Type: ${challenge.challenge_type}

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

    return template;
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
    try {
      // Try to get configuration from database, fallback to default
      try {
        const { data } = await supabase
          .from('assessments')
          .select('ai_configuration_id')
          .eq('id', assessmentId)
          .single();

        if (data?.ai_configuration_id) {
          return this.configurations.get(data.ai_configuration_id) || null;
        }
      } catch (dbError) {
        console.warn('Assessments table not available yet');
      }

      // Fallback to default configuration
      return Array.from(this.configurations.values())[0] || null;
    } catch {
      return null;
    }
  }

  private async getBestConfigurationForQuiz(quizId: string): Promise<AIConfiguration | null> {
    try {
      // Try to get configuration from database, fallback to default
      try {
        const { data } = await supabase
          .from('quizzes')
          .select('ai_configuration_id')
          .eq('id', quizId)
          .single();

        if (data?.ai_configuration_id) {
          return this.configurations.get(data.ai_configuration_id) || null;
        }
      } catch (dbError) {
        console.warn('Quizzes table not available yet');
      }

      return Array.from(this.configurations.values())[0] || null;
    } catch {
      return null;
    }
  }

  private async getBestConfigurationForChallenge(challengeId: string): Promise<AIConfiguration | null> {
    try {
      // Try to get configuration from database, fallback to default
      try {
        const { data } = await supabase
          .from('challenges')
          .select('ai_configuration_id')
          .eq('id', challengeId)
          .single();

        if (data?.ai_configuration_id) {
          return this.configurations.get(data.ai_configuration_id) || null;
        }
      } catch (dbError) {
        console.warn('Challenges table not available yet');
      }

      return Array.from(this.configurations.values())[0] || null;
    } catch {
      return null;
    }
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
      const { error } = await supabase
        .from('ai_configurations')
        .insert(config);

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
}

// Singleton instance
export const aiService = new AIService();
