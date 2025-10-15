import { supabase } from "@/integrations/supabase/client";
import { NEWME_SYSTEM_PROMPT, NEWME_GREETING_TEMPLATES } from "@/config/newme-system-prompt";
import { newMeMemoryService } from "@/services/features/ai/NewMeMemoryService";
import type {
  AssessmentAnswers,
  QuizAnswers,
  ProgressData,
  AssessmentResponseData,
  QuizResponseData
} from "@/types/features/ai/ai-types";
import { configService } from "./configService";
import { callOpenAI, callAnthropic, callGoogle, callCustomProvider, callZAI } from './providers';

export interface AIConfiguration {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' | 'elevenlabs' | 'cartesia' | 'deepgram' | 'hume' | 'zai';
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
  public configService = configService;
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
          provider: config.provider as 'openai' | 'anthropic' | 'google' | 'azure' | 'custom' | 'elevenlabs' | 'cartesia' | 'deepgram' | 'hume' | 'zai',
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

  private checkRateLimit(userId: string, limit = 100, windowMinutes = 60): boolean {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    const userTimestamps = this.rateLimitMap.get(userId) || [];

    const recentTimestamps = userTimestamps.filter(ts => now - ts < windowMs);
    this.rateLimitMap.set(userId, recentTimestamps);

    if (recentTimestamps.length >= limit) {
      return false;
    }

    recentTimestamps.push(now);
    this.rateLimitMap.set(userId, recentTimestamps);
    return true;
  }

  async callAIProvider(config: AIConfiguration, prompt: string): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      switch (config.provider) {
        case 'openai':
          return await callOpenAI(config, prompt, startTime);
        case 'anthropic':
          return await callAnthropic(config, prompt, startTime);
        case 'google':
          return await callGoogle(config, prompt, startTime);
        case 'azure':
        case 'custom':
          return await callCustomProvider(config, prompt, startTime);
        case 'zai':
            return await callZAI(config, prompt, startTime);
        default:
          throw new Error(`Unsupported provider: ${config.provider}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown AI provider error',
        processing_time_ms: Date.now() - startTime,
      };
    }
  }

  async generateAssessmentResult(submission: AssessmentSubmission, configId?: string): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      const config = configId
        ? this.configService.getConfiguration(configId)
        : await this.configService.getConfigurationForService('assessment_scoring', submission.assessment_id);

      if (!config) throw new Error('No suitable AI configuration found');
      if (!this.checkRateLimit(submission.user_id)) throw new Error('Rate limit exceeded.');

      const prompt = await this.buildAssessmentPrompt(submission);
      return await this.callAIProvider(config, prompt);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: Date.now() - startTime,
      };
    }
  }

  private async buildAssessmentPrompt(submission: AssessmentSubmission): Promise<string> {
    const { data: assessment } = await supabase
      .from('assessments_enhanced')
      .select('title, description, questions')
      .eq('id', submission.assessment_id)
      .single();

    if (!assessment) throw new Error('Assessment not found');

    return `
      You are an expert psychological assessment analyst.
      
      ASSESSMENT: ${assessment.title} - ${assessment.description}
      QUESTIONS: ${JSON.stringify(assessment.questions, null, 2)}
      USER ANSWERS: ${JSON.stringify(submission.answers, null, 2)}

      Please provide a JSON response with the following structure:
      {
        "score": number (0-100),
        "feedback": "string",
        "explanation": "string",
        "strengths": ["string"],
        "areas_for_improvement": ["string"],
        "recommendations": ["string"]
      }
    `;
  }
  
  async generateQuizResult(submission: QuizSubmission, configId?: string): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      const config = configId
        ? this.configService.getConfiguration(configId)
        : await this.configService.getConfigurationForService('quiz_scoring', submission.quiz_id);

      if (!config) throw new Error('No suitable AI configuration found');
      if (!this.checkRateLimit(submission.user_id)) throw new Error('Rate limit exceeded.');

      const prompt = await this.buildQuizPrompt(submission);
      return await this.callAIProvider(config, prompt);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: Date.now() - startTime,
      };
    }
  }

  async generateChallengeFeedback(submission: ChallengeSubmission, configId?: string): Promise<AIResponse> {
    const startTime = Date.now();
    try {
      const config = configId
        ? this.configService.getConfiguration(configId)
        : await this.configService.getConfigurationForService('challenge_coaching', submission.challenge_id);

      if (!config) throw new Error('No suitable AI configuration found');
      if (!this.checkRateLimit(submission.user_id)) throw new Error('Rate limit exceeded.');

      const prompt = await this.buildChallengePrompt(submission);
      return await this.callAIProvider(config, prompt);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: Date.now() - startTime,
      };
    }
  }

  private async buildQuizPrompt(submission: QuizSubmission): Promise<string> {
    const { data: assessmentRecord } = await supabase
      .from('assessments_enhanced')
      .select('title, description, category, difficulty_level, questions')
      .eq('id', submission.quiz_id)
      .maybeSingle();

    if (!assessmentRecord) {
      throw new Error('Quiz/Assessment metadata not found');
    }

    const quiz = assessmentRecord;

    const metadata = {
      title: quiz.title,
      description: quiz.description,
      category: quiz.category,
      difficulty: quiz.difficulty_level,
      questions: quiz.questions,
    };

    return `You are Z.ai, a rigorous quiz evaluation engine.

QUIZ METADATA:
${JSON.stringify(metadata, null, 2)}

USER RESPONSES:
${JSON.stringify(submission.answers, null, 2)}

EVALUATION TASK:
1. Score the quiz from 0-100 based on correctness and depth.
2. Provide a short overall feedback summary (2-3 sentences).
3. Offer a per-question explanation that references the question number and gives a coaching tip.

Return a JSON object with EXACTLY this structure:
{
  "score": number (0-100),
  "feedback": "string",
  "explanations": [
    {
      "question": "question identifier or number",
      "analysis": "what the user's answer shows",
      "suggestion": "practical coaching tip"
    }
  ]
}`;
  }

  private async buildChallengePrompt(submission: ChallengeSubmission): Promise<string> {
    const { data: challengeRecord } = await supabase
      .from('challenge_templates')
      .select('title, description, category, questions')
      .eq('id', submission.challenge_id)
      .maybeSingle();

    const metadata = challengeRecord
      ? {
          title: challengeRecord.title,
          description: challengeRecord.description,
          category: challengeRecord.category,
          questions: challengeRecord.questions,
        }
      : { title: submission.challenge_id };

    return `You are Z.ai, a transformation coach tracking user progress through a challenge experience.

CHALLENGE METADATA:
${JSON.stringify(metadata, null, 2)}

USER PROGRESS DATA:
${JSON.stringify(submission.progress_data, null, 2)}

Provide a JSON response with:
{
  "summary": "2-3 sentence acknowledgement",
  "momentumScore": number (0-100),
  "celebrations": ["bullet point of wins"],
  "nextActions": [
    {
      "title": "action name",
      "description": "detailed guidance",
      "timeline": "suggested timeframe"
    }
  ]
}`;
  }
}

export const aiService = new AIService();