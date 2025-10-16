/**
 * Integration Service for Couples Compatibility Scoring
 * Connects the scoring service with the database and UI
 */

import { supabase } from '@/integrations/supabase/client';
import { compatibilityScoringService, type ResponsePair, type CompatibilityBreakdown } from './CompatibilityScoringService';
import { aiCouplesChallengeService } from './AICouplesChallengeService';
import type { Json } from '@/integrations/supabase/types';

export interface ChallengeResponse {
  question: string;
  userResponse: string;
  partnerResponse: string;
  timestamp: string;
}

export class CouplesCompatibilityIntegrationService {
  private static instance: CouplesCompatibilityIntegrationService;

  private constructor() {}

  static getInstance(): CouplesCompatibilityIntegrationService {
    if (!CouplesCompatibilityIntegrationService.instance) {
      CouplesCompatibilityIntegrationService.instance = new CouplesCompatibilityIntegrationService();
    }
    return CouplesCompatibilityIntegrationService.instance;
  }

  /**
   * Analyze a couples challenge and calculate comprehensive compatibility scores
   */
  async analyzeChallenge(challengeId: string): Promise<CompatibilityBreakdown> {
    try {
      // 1. Fetch challenge data
      const { data: challenge, error: challengeError } = await supabase
        .from('couples_challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;
      if (!challenge) throw new Error('Challenge not found');

      // 2. Extract responses
      const responses = this.extractResponses(challenge.messages as Json, challenge.responses as Json);
      
      if (responses.length === 0) {
        throw new Error('No responses found to analyze');
      }

      // 3. Get AI insights (optional, for enhanced scoring)
      let aiInsights;
      try {
        const aiAnalysis = challenge.ai_analysis;
        if (aiAnalysis && typeof aiAnalysis === 'object') {
          aiInsights = {
            attachmentStyles: aiAnalysis['attachmentStyles' as keyof typeof aiAnalysis] as { user: string; partner: string } | undefined,
            loveLanguages: aiAnalysis['loveLanguages' as keyof typeof aiAnalysis] as { user: string; partner: string } | undefined,
            conflictStyles: aiAnalysis['conflictStyles' as keyof typeof aiAnalysis] as { user: string; partner: string } | undefined,
          };
        }
      } catch (err) {
        console.warn('Could not extract AI insights:', err);
      }

      // 4. Calculate compatibility breakdown
      const breakdown = await compatibilityScoringService.calculateCompatibility(responses, aiInsights);

      // 5. Save to database
      await this.saveCompatibilityBreakdown(challengeId, breakdown);

      return breakdown;
    } catch (error) {
      console.error('Error analyzing challenge compatibility:', error);
      throw error;
    }
  }

  /**
   * Get the latest compatibility breakdown for a challenge
   */
  async getLatestBreakdown(challengeId: string): Promise<CompatibilityBreakdown | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_latest_compatibility_breakdown', { p_challenge_id: challengeId });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const result = data[0];
      return this.transformDbToBreakdown(result);
    } catch (error) {
      console.error('Error fetching compatibility breakdown:', error);
      return null;
    }
  }

  /**
   * Get compatibility trend over time
   */
  async getCompatibilityTrend(challengeId: string, dimension: string = 'overall'): Promise<Array<{ date: string; score: number }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_compatibility_trend', {
          p_challenge_id: challengeId,
          p_dimension: dimension
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching compatibility trend:', error);
      return [];
    }
  }

  /**
   * Check if a challenge has compatibility analysis
   */
  async hasCompatibilityAnalysis(challengeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('couples_challenges')
        .select('compatibility_score, calculated_at')
        .eq('id', challengeId)
        .single();

      if (error) throw error;
      return !!(data?.compatibility_score && data?.calculated_at);
    } catch (error) {
      console.error('Error checking compatibility analysis:', error);
      return false;
    }
  }

  /**
   * Trigger automatic compatibility analysis when challenge is completed
   */
  async triggerAutoAnalysis(challengeId: string): Promise<void> {
    try {
      // Check if challenge is completed
      const { data: challenge } = await supabase
        .from('couples_challenges')
        .select('status, messages, responses')
        .eq('id', challengeId)
        .single();

      if (!challenge) return;

      // Only analyze if status is 'completed' and not already analyzed
      if (challenge.status === 'completed') {
        const hasAnalysis = await this.hasCompatibilityAnalysis(challengeId);
        if (!hasAnalysis) {
          await this.analyzeChallenge(challengeId);
        }
      }
    } catch (error) {
      console.error('Error triggering auto analysis:', error);
    }
  }

  // ========== Private Helper Methods ==========

  /**
   * Extract response pairs from challenge data
   */
  private extractResponses(messages: Json, responsesData: Json): ResponsePair[] {
    const responses: ResponsePair[] = [];
    
    try {
      // Try to extract from messages
      if (Array.isArray(messages)) {
        const messageArray = messages as Array<{ sender: string; content: string; timestamp: string; question?: string }>;
        
        // Group messages by question
        const questionGroups = new Map<string, { user?: string; partner?: string }>();
        
        messageArray.forEach((msg) => {
          if (msg.question && msg.content) {
            const question = msg.question;
            if (!questionGroups.has(question)) {
              questionGroups.set(question, {});
            }
            
            const group = questionGroups.get(question)!;
            if (msg.sender === 'user') {
              group.user = msg.content;
            } else if (msg.sender === 'partner') {
              group.partner = msg.content;
            }
          }
        });

        // Convert to ResponsePair format
        questionGroups.forEach((group, question) => {
          if (group.user && group.partner) {
            responses.push({
              question,
              userResponse: group.user,
              partnerResponse: group.partner,
            });
          }
        });
      }

      // Try to extract from responses object as fallback
      if (responses.length === 0 && responsesData && typeof responsesData === 'object') {
        const responsesObj = responsesData as Record<string, { user: string; partner: string }>;
        Object.entries(responsesObj).forEach(([question, answers]) => {
          if (answers.user && answers.partner) {
            responses.push({
              question,
              userResponse: answers.user,
              partnerResponse: answers.partner,
            });
          }
        });
      }
    } catch (error) {
      console.error('Error extracting responses:', error);
    }

    return responses;
  }

  /**
   * Save compatibility breakdown to database
   */
  private async saveCompatibilityBreakdown(challengeId: string, breakdown: CompatibilityBreakdown): Promise<void> {
    try {
      const { error } = await supabase.rpc('save_compatibility_analysis', {
        p_challenge_id: challengeId,
        p_overall_score: breakdown.overallScore,
        p_communication_score: breakdown.dimensions.communication.score,
        p_emotional_connection_score: breakdown.dimensions.emotionalConnection.score,
        p_values_alignment_score: breakdown.dimensions.valuesAlignment.score,
        p_conflict_resolution_score: breakdown.dimensions.conflictResolution.score,
        p_intimacy_score: breakdown.dimensions.intimacy.score,
        p_future_vision_score: breakdown.dimensions.futureVision.score,
        p_trust_security_score: breakdown.dimensions.trustAndSecurity.score,
        p_growth_mindset_score: breakdown.dimensions.growthMindset.score,
        p_compatibility_level: breakdown.compatibilityLevel,
        p_relationship_stage: breakdown.relationshipStage,
        p_strength_areas: breakdown.strengthAreas,
        p_growth_areas: breakdown.growthAreas,
        p_recommendations: breakdown.recommendations,
        p_breakdown: breakdown as unknown as Json,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving compatibility breakdown:', error);
      throw error;
    }
  }

  /**
   * Transform database result to CompatibilityBreakdown
   */
  private transformDbToBreakdown(dbResult: {
    overall_score: number;
    dimensions: Json;
    strength_areas: string[];
    growth_areas: string[];
    compatibility_level: string;
    relationship_stage: string;
    recommendations: string[];
    calculated_at: string;
  }): CompatibilityBreakdown {
    const dimensions = dbResult.dimensions as Record<string, { score: number; dimension: string }>;
    
    // Helper to create dimensional score
    const createDimScore = (key: string, name: string, weight: number) => ({
      dimension: name,
      score: dimensions[key]?.score || 0,
      weight,
      insights: [],
      strength: this.getStrengthLevel(dimensions[key]?.score || 0),
    });

    return {
      overallScore: dbResult.overall_score,
      dimensions: {
        communication: createDimScore('communication', 'Communication', 0.20),
        emotionalConnection: createDimScore('emotionalConnection', 'Emotional Connection', 0.18),
        valuesAlignment: createDimScore('valuesAlignment', 'Values Alignment', 0.16),
        conflictResolution: createDimScore('conflictResolution', 'Conflict Resolution', 0.14),
        intimacy: createDimScore('intimacy', 'Intimacy', 0.12),
        futureVision: createDimScore('futureVision', 'Future Vision', 0.10),
        trustAndSecurity: createDimScore('trustSecurity', 'Trust & Security', 0.06),
        growthMindset: createDimScore('growthMindset', 'Growth Mindset', 0.04),
      },
      strengthAreas: dbResult.strength_areas,
      growthAreas: dbResult.growth_areas,
      compatibilityLevel: dbResult.compatibility_level as 'Low' | 'Moderate' | 'Good' | 'Very Good' | 'Excellent',
      relationshipStage: dbResult.relationship_stage as 'Exploring' | 'Building' | 'Deepening' | 'Thriving',
      recommendations: dbResult.recommendations,
      calculatedAt: dbResult.calculated_at,
    };
  }

  private getStrengthLevel(score: number): 'low' | 'moderate' | 'high' | 'excellent' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'high';
    if (score >= 50) return 'moderate';
    return 'low';
  }
}

export const couplesCompatibilityIntegrationService = CouplesCompatibilityIntegrationService.getInstance();

