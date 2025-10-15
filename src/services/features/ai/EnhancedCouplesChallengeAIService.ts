import { aiIntegrationService } from './AIIntegrationService';
import { aiProviderManager } from './AIProviderManager';
import { supabase } from '@/integrations/supabase/client';

export interface CouplesChallengeAIConfig {
  challengeId: string;
  providerId: string;
  modelId: string;
  voiceId?: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  userPromptTemplate: string;
  enableVoiceResponses: boolean;
  conversationStyle: 'supportive' | 'analytical' | 'playful' | 'professional';
}

export interface CouplesChallengeAnalysis {
  compatibilityScore: number;
  relationshipInsights: string[];
  communicationPatterns: string[];
  strengths: string[];
  areasForGrowth: string[];
  recommendations: string[];
  nextSteps: string[];
  voiceAnalysisUrl?: string;
  tokensUsed: number;
  cost: number;
  processingTime: number;
}

export interface ChallengeQuestion {
  id: string;
  question: string;
  category: string;
  importance: 'low' | 'medium' | 'high';
}

export class EnhancedCouplesChallengeAIService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await aiIntegrationService.initialize();
      this.initialized = true;
      console.log('Enhanced Couples Challenge AI Service initialized');
    } catch (error) {
      console.error('Failed to initialize Enhanced Couples Challenge AI Service:', error);
      throw error;
    }
  }

  // Configure AI for couples challenge
  async configureCouplesChallengeAI(config: CouplesChallengeAIConfig): Promise<void> {
    try {
      await this.initialize();

      // Create service mapping
      await aiIntegrationService.configureCouplesChallengeAI(
        config.challengeId,
        config.providerId,
        config.modelId,
        config.voiceId,
        {
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          systemPrompt: config.systemPrompt,
          userPromptTemplate: config.userPromptTemplate
        }
      );

      // Store additional configuration
      await supabase
        .from('couples_challenge_ai_configs')
        .upsert({
          challenge_id: config.challengeId,
          provider_id: config.providerId,
          model_id: config.modelId,
          voice_id: config.voiceId,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          system_prompt: config.systemPrompt,
          user_prompt_template: config.userPromptTemplate,
          enable_voice_responses: config.enableVoiceResponses,
          conversation_style: config.conversationStyle,
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Failed to configure couples challenge AI:', error);
      throw error;
    }
  }

  // Get couples challenge AI configuration
  async getCouplesChallengeAIConfig(challengeId: string): Promise<CouplesChallengeAIConfig | null> {
    try {
      const { data, error } = await supabase
        .from('couples_challenge_ai_configs')
        .select('*')
        .eq('challenge_id', challengeId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        challengeId: data.challenge_id,
        providerId: data.provider_id,
        modelId: data.model_id,
        voiceId: data.voice_id,
        temperature: data.temperature,
        maxTokens: data.max_tokens,
        systemPrompt: data.system_prompt,
        userPromptTemplate: data.user_prompt_template,
        enableVoiceResponses: data.enable_voice_responses,
        conversationStyle: data.conversation_style
      };
    } catch (error) {
      console.error('Failed to get couples challenge AI config:', error);
      return null;
    }
  }

  // Generate AI response for couples challenge
  async generateChallengeResponse(
    challengeId: string,
    question: string,
    userResponse: string,
    partnerResponse: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): Promise<{
    response: string;
    voiceResponseUrl?: string;
    tokensUsed: number;
    cost: number;
  }> {
    try {
      await this.initialize();

      const aiConfig = await this.getCouplesChallengeAIConfig(challengeId);
      if (!aiConfig) {
        throw new Error('No AI configuration found for this challenge');
      }

      const providerService = aiProviderManager.getProviderService(aiConfig.providerId);
      if (!providerService) {
        throw new Error('AI provider not available');
      }

      // Build conversation context
      const messages = [
        { role: 'system', content: this.buildSystemPrompt(aiConfig) },
        ...conversationHistory,
        { role: 'user', content: this.buildUserPrompt(aiConfig, question, userResponse, partnerResponse) }
      ];

      // Generate AI response
      const aiResponse = await providerService.generateText({
        messages,
        temperature: aiConfig.temperature,
        maxTokens: aiConfig.maxTokens
      });

      // Generate voice response if enabled
      let voiceResponseUrl: string | undefined;
      if (aiConfig.enableVoiceResponses && aiConfig.voiceId) {
        try {
          voiceResponseUrl = await this.generateVoiceResponse(
            aiConfig.providerId,
            aiConfig.voiceId,
            aiResponse.content
          );
        } catch (error) {
          console.error('Failed to generate voice response:', error);
        }
      }

      // Track usage
      await aiIntegrationService.trackAIUsage(
        `couples_challenge_${challengeId}`,
        aiResponse.tokensUsed || 0,
        aiResponse.cost || 0,
        true
      );

      return {
        response: aiResponse.content,
        voiceResponseUrl,
        tokensUsed: aiResponse.tokensUsed || 0,
        cost: aiResponse.cost || 0
      };

    } catch (error) {
      console.error('Failed to generate challenge response:', error);
      
      // Track failed usage
      await aiIntegrationService.trackAIUsage(
        `couples_challenge_${challengeId}`,
        0,
        0,
        false
      );

      throw error;
    }
  }

  // Analyze completed couples challenge
  async analyzeCouplesChallenge(
    challengeId: string,
    responses: Array<{
      question: string;
      userResponse: string;
      partnerResponse: string;
    }>
  ): Promise<CouplesChallengeAnalysis> {
    try {
      await this.initialize();

      const startTime = Date.now();
      const aiConfig = await this.getCouplesChallengeAIConfig(challengeId);
      if (!aiConfig) {
        throw new Error('No AI configuration found for this challenge');
      }

      const providerService = aiProviderManager.getProviderService(aiConfig.providerId);
      if (!providerService) {
        throw new Error('AI provider not available');
      }

      // Build analysis prompt
      const systemPrompt = this.buildAnalysisSystemPrompt(aiConfig);
      const userPrompt = this.buildAnalysisUserPrompt(aiConfig, responses);

      // Generate analysis
      const aiResponse = await providerService.generateText({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: aiConfig.temperature,
        maxTokens: aiConfig.maxTokens
      });

      // Parse analysis
      const analysis = this.parseAnalysisResponse(aiResponse.content);

      // Generate voice analysis if enabled
      let voiceAnalysisUrl: string | undefined;
      if (aiConfig.enableVoiceResponses && aiConfig.voiceId) {
        try {
          const analysisSummary = this.buildAnalysisSummary(analysis);
          voiceAnalysisUrl = await this.generateVoiceResponse(
            aiConfig.providerId,
            aiConfig.voiceId,
            analysisSummary
          );
        } catch (error) {
          console.error('Failed to generate voice analysis:', error);
        }
      }

      const processingTime = Date.now() - startTime;

      // Track usage
      await aiIntegrationService.trackAIUsage(
        `couples_challenge_${challengeId}`,
        aiResponse.tokensUsed || 0,
        aiResponse.cost || 0,
        true
      );

      return {
        ...analysis,
        voiceAnalysisUrl,
        tokensUsed: aiResponse.tokensUsed || 0,
        cost: aiResponse.cost || 0,
        processingTime
      };

    } catch (error) {
      console.error('Failed to analyze couples challenge:', error);
      throw error;
    }
  }

  // Build system prompt for conversation
  private buildSystemPrompt(config: CouplesChallengeAIConfig): string {
    const basePrompt = config.systemPrompt || `You are a relationship counselor facilitating a couples challenge. Guide the conversation with empathy and insight.`;
    
    const styleInstructions = {
      supportive: "Use a warm, encouraging tone that focuses on understanding and connection.",
      analytical: "Use a thoughtful, analytical approach that helps couples understand their patterns.",
      playful: "Use a light, fun tone that makes the challenge engaging and enjoyable.",
      professional: "Use a formal, clinical tone appropriate for professional relationship counseling."
    };

    return `${basePrompt}\n\n${styleInstructions[config.conversationStyle]}`;
  }

  // Build user prompt for conversation
  private buildUserPrompt(
    config: CouplesChallengeAIConfig,
    question: string,
    userResponse: string,
    partnerResponse: string
  ): string {
    const template = config.userPromptTemplate || `Based on the question and both responses, provide guidance and insights.`;
    
    return `${template}\n\nQuestion: ${question}\n\nUser Response: ${userResponse}\n\nPartner Response: ${partnerResponse}`;
  }

  // Build system prompt for analysis
  private buildAnalysisSystemPrompt(config: CouplesChallengeAIConfig): string {
    return `You are an expert relationship analyst. Analyze the couples' responses to provide comprehensive insights about their relationship dynamics, communication patterns, and compatibility. Provide specific, actionable recommendations.`;
  }

  // Build user prompt for analysis
  private buildAnalysisUserPrompt(
    config: CouplesChallengeAIConfig,
    responses: Array<{ question: string; userResponse: string; partnerResponse: string }>
  ): string {
    const responsesText = responses.map((r, index) => 
      `Question ${index + 1}: ${r.question}\nUser: ${r.userResponse}\nPartner: ${r.partnerResponse}`
    ).join('\n\n');

    return `Analyze the following couples challenge responses and provide comprehensive relationship insights:\n\n${responsesText}`;
  }

  // Parse analysis response
  private parseAnalysisResponse(content: string): Omit<CouplesChallengeAnalysis, 'voiceAnalysisUrl' | 'tokensUsed' | 'cost' | 'processingTime'> {
    try {
      const parsed = JSON.parse(content);
      return {
        compatibilityScore: parsed.compatibilityScore || 0,
        relationshipInsights: Array.isArray(parsed.relationshipInsights) ? parsed.relationshipInsights : [],
        communicationPatterns: Array.isArray(parsed.communicationPatterns) ? parsed.communicationPatterns : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        areasForGrowth: Array.isArray(parsed.areasForGrowth) ? parsed.areasForGrowth : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : []
      };
    } catch {
      // Fallback to text parsing
      return {
        compatibilityScore: this.extractCompatibilityScore(content),
        relationshipInsights: this.extractRelationshipInsights(content),
        communicationPatterns: this.extractCommunicationPatterns(content),
        strengths: this.extractStrengths(content),
        areasForGrowth: this.extractAreasForGrowth(content),
        recommendations: this.extractRecommendations(content),
        nextSteps: this.extractNextSteps(content)
      };
    }
  }

  // Extract compatibility score
  private extractCompatibilityScore(content: string): number {
    const scoreMatch = content.match(/(?:compatibility|compatibility score)[:\s]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 0;
  }

  // Extract relationship insights
  private extractRelationshipInsights(content: string): string[] {
    const insightsMatch = content.match(/relationship insights?[:\s]*(.*?)(?:\n\n|\n-|$)/is);
    if (insightsMatch) {
      return insightsMatch[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•]\s*/, ''));
    }
    return [];
  }

  // Extract communication patterns
  private extractCommunicationPatterns(content: string): string[] {
    const patternsMatch = content.match(/communication patterns?[:\s]*(.*?)(?:\n\n|\n-|$)/is);
    if (patternsMatch) {
      return patternsMatch[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•]\s*/, ''));
    }
    return [];
  }

  // Extract strengths
  private extractStrengths(content: string): string[] {
    const strengthsMatch = content.match(/strengths?[:\s]*(.*?)(?:\n\n|\n-|$)/is);
    if (strengthsMatch) {
      return strengthsMatch[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•]\s*/, ''));
    }
    return [];
  }

  // Extract areas for growth
  private extractAreasForGrowth(content: string): string[] {
    const areasMatch = content.match(/(?:areas?\s+for\s+growth|growth\s+areas?)[:\s]*(.*?)(?:\n\n|\n-|$)/is);
    if (areasMatch) {
      return areasMatch[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•]\s*/, ''));
    }
    return [];
  }

  // Extract recommendations
  private extractRecommendations(content: string): string[] {
    const recMatch = content.match(/recommendations?[:\s]*(.*?)(?:\n\n|\n-|$)/is);
    if (recMatch) {
      return recMatch[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•]\s*/, ''));
    }
    return [];
  }

  // Extract next steps
  private extractNextSteps(content: string): string[] {
    const stepsMatch = content.match(/next steps?[:\s]*(.*?)(?:\n\n|\n-|$)/is);
    if (stepsMatch) {
      return stepsMatch[1].split('\n').filter(line => line.trim()).map(line => line.replace(/^[-•]\s*/, ''));
    }
    return [];
  }

  // Build analysis summary for voice
  private buildAnalysisSummary(analysis: Omit<CouplesChallengeAnalysis, 'voiceAnalysisUrl' | 'tokensUsed' | 'cost' | 'processingTime'>): string {
    return `Your compatibility score is ${analysis.compatibilityScore}%. ${analysis.relationshipInsights.join(' ')} Your main strengths include ${analysis.strengths.slice(0, 2).join(' and ')}. Consider working on ${analysis.areasForGrowth.slice(0, 2).join(' and ')}.`;
  }

  // Generate voice response
  private async generateVoiceResponse(providerId: string, voiceId: string, text: string): Promise<string> {
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
        .from('ai-voice-responses')
        .upload(`${Date.now()}-response.mp3`, audioResponse.audio, {
          contentType: 'audio/mpeg'
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('ai-voice-responses')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Failed to generate voice response:', error);
      throw error;
    }
  }

  // Get challenge AI usage statistics
  async getChallengeAIStats(challengeId: string): Promise<{
    totalResponses: number;
    averageCompatibilityScore: number;
    successRate: number;
    totalCost: number;
    averageProcessingTime: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('couples_challenge_ai_usage')
        .select('*')
        .eq('challenge_id', challengeId);

      if (error) throw error;

      const stats = {
        totalResponses: data?.length || 0,
        averageCompatibilityScore: 0,
        successRate: 0,
        totalCost: 0,
        averageProcessingTime: 0
      };

      if (data && data.length > 0) {
        const successful = data.filter(d => d.success);
        stats.averageCompatibilityScore = data.reduce((sum, d) => sum + (d.compatibility_score || 0), 0) / data.length;
        stats.successRate = (successful.length / data.length) * 100;
        stats.totalCost = data.reduce((sum, d) => sum + (d.cost || 0), 0);
        stats.averageProcessingTime = data.reduce((sum, d) => sum + (d.processing_time || 0), 0) / data.length;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get challenge AI stats:', error);
      return {
        totalResponses: 0,
        averageCompatibilityScore: 0,
        successRate: 0,
        totalCost: 0,
        averageProcessingTime: 0
      };
    }
  }
}

// Singleton instance
export const enhancedCouplesChallengeAIService = new EnhancedCouplesChallengeAIService();
