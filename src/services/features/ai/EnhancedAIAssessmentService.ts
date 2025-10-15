import { aiIntegrationService } from './AIIntegrationService';
import { aiProviderManager } from './AIProviderManager';
import { supabase } from '@/integrations/supabase/client';
import type { AIProcessingResult } from '@/types/features/assessment/assessment-optimized';
import type { AIServiceMapping } from './AIIntegrationService';

export interface EnhancedAssessmentConfig {
  assessmentId: string;
  providerId: string;
  modelId: string;
  voiceId?: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  userPromptTemplate: string;
  enableVoiceFeedback: boolean;
  feedbackTone: 'supportive' | 'analytical' | 'encouraging' | 'professional';
}

export interface AssessmentAIAnalysis {
  score: number;
  feedback: string;
  explanation: string;
  insights: string[];
  recommendations: string[];
  strengths: string[];
  areasForImprovement: string[];
  isPassing: boolean;
  voiceFeedbackUrl?: string;
  tokensUsed: number;
  cost: number;
  processingTime: number;
}

export class EnhancedAIAssessmentService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await aiIntegrationService.initialize();
      this.initialized = true;
      console.log('Enhanced AI Assessment Service initialized');
    } catch (error) {
      console.error('Failed to initialize Enhanced AI Assessment Service:', error);
      throw error;
    }
  }

  // Configure AI for assessment
  async configureAssessmentAI(config: EnhancedAssessmentConfig): Promise<void> {
    try {
      await this.initialize();

      // Create service mapping
      await aiIntegrationService.configureAssessmentAI(
        config.assessmentId,
        config.providerId,
        config.modelId,
        {
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          systemPrompt: config.systemPrompt,
          userPromptTemplate: config.userPromptTemplate
        }
      );

      // Store additional configuration
      await supabase
        .from('assessment_ai_configs')
        .upsert({
          assessment_id: config.assessmentId,
          provider_id: config.providerId,
          model_id: config.modelId,
          voice_id: config.voiceId,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          system_prompt: config.systemPrompt,
          user_prompt_template: config.userPromptTemplate,
          enable_voice_feedback: config.enableVoiceFeedback,
          feedback_tone: config.feedbackTone,
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Failed to configure assessment AI:', error);
      throw error;
    }
  }

  // Get assessment AI configuration
  async getAssessmentAIConfig(assessmentId: string): Promise<EnhancedAssessmentConfig | null> {
    try {
      const { data, error } = await supabase
        .from('assessment_ai_configs')
        .select('*')
        .eq('assessment_id', assessmentId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        assessmentId: data.assessment_id,
        providerId: data.provider_id,
        modelId: data.model_id,
        voiceId: data.voice_id,
        temperature: data.temperature,
        maxTokens: data.max_tokens,
        systemPrompt: data.system_prompt,
        userPromptTemplate: data.user_prompt_template,
        enableVoiceFeedback: data.enable_voice_feedback,
        feedbackTone: data.feedback_tone
      };
    } catch (error) {
      console.error('Failed to get assessment AI config:', error);
      return null;
    }
  }

  // Process assessment with enhanced AI
  async processAssessmentWithEnhancedAI(
    assessmentId: string,
    answers: Record<string, unknown>,
    userId: string,
    attemptId: string
  ): Promise<AssessmentAIAnalysis> {
    try {
      await this.initialize();

      const startTime = Date.now();
      
      // Get AI configuration for this assessment
      const aiConfig = await this.getAssessmentAIConfig(assessmentId);
      if (!aiConfig) {
        throw new Error('No AI configuration found for this assessment');
      }

      // Get the provider service
      const providerService = aiProviderManager.getProviderService(aiConfig.providerId);
      if (!providerService) {
        throw new Error('AI provider not available');
      }

      // Prepare the prompt
      const systemPrompt = this.buildSystemPrompt(aiConfig);
      const userPrompt = this.buildUserPrompt(aiConfig, answers);

      // Generate AI analysis
      const aiResponse = await providerService.generateText({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: aiConfig.temperature,
        maxTokens: aiConfig.maxTokens
      });

      // Parse the AI response
      const analysis = this.parseAIResponse(aiResponse.content);

      // Generate voice feedback if enabled
      let voiceFeedbackUrl: string | undefined;
      if (aiConfig.enableVoiceFeedback && aiConfig.voiceId) {
        try {
          voiceFeedbackUrl = await this.generateVoiceFeedback(
            aiConfig.providerId,
            aiConfig.voiceId,
            analysis.feedback
          );
        } catch (error) {
          console.error('Failed to generate voice feedback:', error);
        }
      }

      const processingTime = Date.now() - startTime;

      // Track usage
      await aiIntegrationService.trackAIUsage(
        `assessment_${assessmentId}`,
        aiResponse.tokensUsed || 0,
        aiResponse.cost || 0,
        true
      );

      return {
        ...analysis,
        voiceFeedbackUrl,
        tokensUsed: aiResponse.tokensUsed || 0,
        cost: aiResponse.cost || 0,
        processingTime
      };

    } catch (error) {
      console.error('Failed to process assessment with enhanced AI:', error);
      
      // Track failed usage
      await aiIntegrationService.trackAIUsage(
        `assessment_${assessmentId}`,
        0,
        0,
        false
      );

      throw error;
    }
  }

  // Build system prompt based on configuration
  private buildSystemPrompt(config: EnhancedAssessmentConfig): string {
    const basePrompt = config.systemPrompt || `You are an expert assessment analyzer. Analyze the user's responses and provide comprehensive feedback.`;
    
    const toneInstructions = {
      supportive: "Use a warm, encouraging tone that focuses on strengths and growth opportunities.",
      analytical: "Use a professional, data-driven approach with clear insights and recommendations.",
      encouraging: "Use an uplifting, positive tone that motivates and inspires the user.",
      professional: "Use a formal, clinical tone appropriate for professional assessment feedback."
    };

    return `${basePrompt}\n\n${toneInstructions[config.feedbackTone]}`;
  }

  // Build user prompt with assessment data
  private buildUserPrompt(config: EnhancedAssessmentConfig, answers: Record<string, unknown>): string {
    const template = config.userPromptTemplate || `Analyze the following assessment responses and provide detailed feedback.`;
    
    return `${template}\n\nAssessment Responses:\n${JSON.stringify(answers, null, 2)}`;
  }

  // Parse AI response into structured format
  private parseAIResponse(content: string): Omit<AssessmentAIAnalysis, 'voiceFeedbackUrl' | 'tokensUsed' | 'cost' | 'processingTime'> {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      return {
        score: parsed.score || 0,
        feedback: parsed.feedback || content,
        explanation: parsed.explanation || '',
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        areasForImprovement: Array.isArray(parsed.areasForImprovement) ? parsed.areasForImprovement : [],
        isPassing: parsed.isPassing || (parsed.score || 0) >= 70
      };
    } catch {
      // Fallback to text parsing
      return {
        score: this.extractScore(content),
        feedback: content,
        explanation: '',
        insights: this.extractInsights(content),
        recommendations: this.extractRecommendations(content),
        strengths: this.extractStrengths(content),
        areasForImprovement: this.extractAreasForImprovement(content),
        isPassing: this.extractScore(content) >= 70
      };
    }
  }

  // Extract score from text
  private extractScore(content: string): number {
    const scoreMatch = content.match(/(?:score|rating|grade)[:\s]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 0;
  }

  // Extract insights from text
  private extractInsights(content: string): string[] {
    const insightsMatch = content.match(/insights?[:\s]*(.*?)(?:\n\n|\n-|$)/is);
    if (insightsMatch) {
      return insightsMatch[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•]\s*/, ''));
    }
    return [];
  }

  // Extract recommendations from text
  private extractRecommendations(content: string): string[] {
    const recMatch = content.match(/recommendations?[:\s]*(.*?)(?:\n\n|\n-|$)/is);
    if (recMatch) {
      return recMatch[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•]\s*/, ''));
    }
    return [];
  }

  // Extract strengths from text
  private extractStrengths(content: string): string[] {
    const strengthsMatch = content.match(/strengths?[:\s]*(.*?)(?:\n\n|\n-|$)/is);
    if (strengthsMatch) {
      return strengthsMatch[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•]\s*/, ''));
    }
    return [];
  }

  // Extract areas for improvement from text
  private extractAreasForImprovement(content: string): string[] {
    const areasMatch = content.match(/(?:areas?\s+for\s+improvement|improvement\s+areas?)[:\s]*(.*?)(?:\n\n|\n-|$)/is);
    if (areasMatch) {
      return areasMatch[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•]\s*/, ''));
    }
    return [];
  }

  // Generate voice feedback
  private async generateVoiceFeedback(providerId: string, voiceId: string, text: string): Promise<string> {
    try {
      const providerService = aiProviderManager.getProviderService(providerId);
      if (!providerService) {
        throw new Error('Provider service not available');
      }

      const audioResponse = await providerService.generateSpeech({
        text,
        voice: voiceId,
        format: 'mp3'
      });

      // Store the audio file and return URL
      const { data, error } = await supabase.storage
        .from('ai-voice-feedback')
        .upload(`${Date.now()}-feedback.mp3`, audioResponse.audio, {
          contentType: 'audio/mpeg'
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('ai-voice-feedback')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Failed to generate voice feedback:', error);
      throw error;
    }
  }

  // Get assessment AI usage statistics
  async getAssessmentAIStats(assessmentId: string): Promise<{
    totalProcessed: number;
    averageScore: number;
    successRate: number;
    totalCost: number;
    averageProcessingTime: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('assessment_ai_usage')
        .select('*')
        .eq('assessment_id', assessmentId);

      if (error) throw error;

      const stats = {
        totalProcessed: data?.length || 0,
        averageScore: 0,
        successRate: 0,
        totalCost: 0,
        averageProcessingTime: 0
      };

      if (data && data.length > 0) {
        const successful = data.filter(d => d.success);
        stats.averageScore = data.reduce((sum, d) => sum + (d.score || 0), 0) / data.length;
        stats.successRate = (successful.length / data.length) * 100;
        stats.totalCost = data.reduce((sum, d) => sum + (d.cost || 0), 0);
        stats.averageProcessingTime = data.reduce((sum, d) => sum + (d.processing_time || 0), 0) / data.length;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get assessment AI stats:', error);
      return {
        totalProcessed: 0,
        averageScore: 0,
        successRate: 0,
        totalCost: 0,
        averageProcessingTime: 0
      };
    }
  }
}

// Singleton instance
export const enhancedAIAssessmentService = new EnhancedAIAssessmentService();
