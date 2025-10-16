import { supabase } from '@/integrations/supabase/client';

// --- Constants for better maintainability ---
const EDGE_FUNCTION_NAME = 'enhanced-conflict-resolution';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// --- Custom Error for more detailed reporting ---
class EdgeFunctionError extends Error {
  constructor(message: string, public functionName: string, public originalError?: any) {
    super(message);
    this.name = 'EdgeFunctionError';
  }
}

// --- Type Definitions for API Contracts ---

/**
 * Represents a detailed analysis of a conflict pattern.
 */
export interface ConflictAnalysis {
  patternType: 'escalation' | 'defensiveness' | 'stonewalling' | 'criticism' | 'contempt';
  severity: number; // Scale of 1-5
  triggerPhrases: string[];
  emotionalImpact: string;
  underlyingNeeds: string[];
  resolutionStrategies: string[];
  immediateAction: string;
  longTermSolution: string;
}

/**
 * Represents a suggested exercise to help resolve a conflict.
 */
export interface ConflictResolutionSuggestion {
  exerciseType: 'active_listening' | 'i_feel_statements' | 'perspective_taking' | 'de_escalation' | 'repair_attempt';
  suggestion: string;
  rationale: string;
  expectedOutcome: string;
  timeRequired: number; // in minutes
}

/**
 * Represents a real-time insight into an ongoing conversation.
 */
export interface ConflictInsight {
  insight: string;
  patternAnalysis: string;
  emotionalState: string;
  communicationBreakdown: string;
  growthOpportunity: string;
  immediateStep: string;
}

/**
 * Represents the progress in conflict resolution over time.
 */
export interface ConflictResolutionProgress {
  overallProgress: number; // Percentage
  patternImprovement: Record<ConflictAnalysis['patternType'], number>;
  recommendedNextSteps: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
}

/**
 * Represents user and partner profiles for personalized advice.
 */
export interface UserProfile {
  communicationStyle: string;
  emotionalTendencies: string[];
  conflictHistory: string[];
}

/**
 * Represents personalized advice generated based on user profiles and the current conflict.
 */
export interface PersonalizedConflictAdvice {
  personalizedAdvice: string;
  communicationTips: string[];
  emotionalRegulation: string[];
  relationshipStrengths: string[];
}

/**
 * Represents metrics for tracking conflict resolution.
 */
export interface ConflictResolutionMetrics {
  conflictFrequency: number;
  resolutionSuccessRate: number;
  emotionalRecoveryTime: number; // in hours
  communicationImprovement: number; // Percentage
}

// --- Types for Edge Function Payloads ---
type EdgeFunctionPayload =
  | { type: 'analyzeConflictPattern'; payload: { messages: Array<{ sender: string; content: string }>; challengeContext: string } }
  | { type: 'generateConflictResolutionSuggestion'; payload: { conflictAnalysis: ConflictAnalysis; previousExercises: Array<{ exerciseType: string; effectiveness: number }> } }
  | { type: 'provideRealTimeConflictInsight'; payload: { recentMessages: Array<{ sender: string; content: string }>; conflictPatterns: ConflictAnalysis[] } }
  | { type: 'assessConflictResolutionProgress'; payload: { challengeId: string; conflictPatterns: ConflictAnalysis[]; completedExercises: Array<{ exerciseType: string; effectiveness: number }> } }
  | { type: 'generatePersonalizedConflictAdvice'; payload: { userProfile: UserProfile; partnerProfile: UserProfile; currentConflict: ConflictAnalysis } };

export class AIConflictResolutionService {
  private retryCount = 0;

  /**
   * Invokes a Supabase edge function with robust error handling and retry logic.
   * @param functionName The name of the edge function.
   * @param payload The data to send to the function.
   * @returns The data returned from the edge function.
   * @throws {EdgeFunctionError} If the function call fails after retries.
   */
  private async callEdgeFunction<T>(functionName: string, payload: EdgeFunctionPayload): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: payload
        });

        if (error) {
          lastError = error;
          console.warn(`Attempt ${attempt + 1} failed:`, error);
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
            continue;
          }
          throw error;
        }

        if (!data) {
          throw new Error('Edge function returned no data');
        }

        if (data.success === false) {
          throw new Error(data.error || 'Edge function execution failed');
        }

        this.retryCount = 0;
        return data.data;
      } catch (error) {
        lastError = error;
        if (attempt === MAX_RETRIES - 1) {
          throw new EdgeFunctionError(
            `Failed to call edge function after ${MAX_RETRIES} attempts: ${functionName}`,
            functionName,
            error
          );
        }
      }
    }

    throw new EdgeFunctionError(
      `Failed to call edge function: ${functionName}`,
      functionName,
      lastError
    );
  }

  /**
   * Analyzes a conversation to identify conflict patterns.
   * @param messages A history of messages in the conversation.
   * @param challengeContext The context of the current couples' challenge.
   * @returns A detailed analysis of the conflict pattern.
   */
  async analyzeConflictPattern(
    messages: Array<{ sender: string; content: string; timestamp: string }>,
    challengeContext: string
  ): Promise<ConflictAnalysis> {
    try {
      if (!messages || messages.length === 0) {
        throw new Error('Messages array cannot be empty');
      }

      return await this.callEdgeFunction<ConflictAnalysis>(EDGE_FUNCTION_NAME, {
        type: 'analyzeConflictPattern',
        payload: { messages, challengeContext }
      });
    } catch (error) {
      console.error('Error analyzing conflict pattern:', error);
      return this.getFallbackConflictAnalysis(messages);
    }
  }

  /**
   * Generates a tailored suggestion to resolve an identified conflict.
   * @param conflictAnalysis The analysis of the current conflict.
   * @param previousExercises A history of previously completed exercises.
   * @returns A conflict resolution suggestion.
   */
  async generateConflictResolutionSuggestion(
    conflictAnalysis: ConflictAnalysis,
    previousExercises: Array<{ exerciseType: string; effectiveness: number }> = []
  ): Promise<ConflictResolutionSuggestion> {
    try {
      if (!conflictAnalysis || !conflictAnalysis.patternType) {
        throw new Error('Invalid conflict analysis provided');
      }

      return await this.callEdgeFunction<ConflictResolutionSuggestion>(EDGE_FUNCTION_NAME, {
        type: 'generateConflictResolutionSuggestion',
        payload: { conflictAnalysis, previousExercises }
      });
    } catch (error) {
      console.error('Error generating conflict resolution suggestion:', error);
      return this.getFallbackSuggestion(conflictAnalysis.patternType);
    }
  }

  /**
   * Provides a real-time insight into the current state of a conversation.
   * @param recentMessages The most recent messages in the conversation.
   * @param conflictPatterns A history of identified conflict patterns.
   * @returns A real-time conflict insight.
   */
  async provideRealTimeConflictInsight(
    recentMessages: Array<{ sender: string; content: string; timestamp: string }>,
    conflictPatterns: ConflictAnalysis[] = []
  ): Promise<ConflictInsight> {
    try {
      if (!recentMessages || recentMessages.length === 0) {
        throw new Error('Recent messages array cannot be empty');
      }

      return await this.callEdgeFunction<ConflictInsight>(EDGE_FUNCTION_NAME, {
        type: 'provideRealTimeConflictInsight',
        payload: { recentMessages, conflictPatterns }
      });
    } catch (error) {
      console.error('Error providing real-time conflict insight:', error);
      return {
        insight: "I notice some tension in your conversation. This is normal in relationships and can be an opportunity for growth.",
        patternAnalysis: "The conversation shows signs of escalation. Taking a moment to breathe can help.",
        emotionalState: "Both partners seem to be feeling frustrated or defensive.",
        communicationBreakdown: "The focus has shifted from understanding to winning the argument.",
        growthOpportunity: "This is a chance to practice active listening and empathy.",
        immediateStep: "Try taking a short break and returning to the conversation with fresh perspectives."
      };
    }
  }

  /**
   * Assesses the overall progress of conflict resolution for a given challenge.
   * @param challengeId The ID of the couples' challenge.
   * @param conflictPatterns A history of identified conflict patterns.
   * @param completedExercises A history of completed resolution exercises.
   * @returns An assessment of conflict resolution progress.
   */
  async assessConflictResolutionProgress(
    challengeId: string,
    conflictPatterns: ConflictAnalysis[] = [],
    completedExercises: Array<{ exerciseType: string; effectiveness: number }> = []
  ): Promise<ConflictResolutionProgress> {
    try {
      if (!challengeId) {
        throw new Error('Challenge ID is required');
      }

      return await this.callEdgeFunction<ConflictResolutionProgress>(EDGE_FUNCTION_NAME, {
        type: 'assessConflictResolutionProgress',
        payload: { challengeId, conflictPatterns, completedExercises }
      });
    } catch (error) {
      console.error('Error assessing conflict resolution progress:', error);
      return {
        overallProgress: 50,
        patternImprovement: {
          escalation: 40,
          defensiveness: 60,
          stonewalling: 30,
          criticism: 70,
          contempt: 20
        },
        recommendedNextSteps: [
          "Practice active listening exercises",
          "Use 'I feel' statements to express emotions",
          "Take regular breaks during difficult conversations"
        ],
        confidenceLevel: 'medium'
      };
    }
  }

  /**
   * Generates personalized advice based on user profiles and the current conflict.
   * @param userProfile The profile of the current user.
   * @param partnerProfile The profile of the partner.
   * @param currentConflict The current conflict analysis.
   * @returns Personalized advice and tips.
   */
  async generatePersonalizedConflictAdvice(
    userProfile: UserProfile,
    partnerProfile: UserProfile,
    currentConflict: ConflictAnalysis
  ): Promise<PersonalizedConflictAdvice> {
    try {
      if (!userProfile || !partnerProfile || !currentConflict) {
        throw new Error('User profile, partner profile, and current conflict are required');
      }

      return await this.callEdgeFunction<PersonalizedConflictAdvice>(EDGE_FUNCTION_NAME, {
        type: 'generatePersonalizedConflictAdvice',
        payload: { userProfile, partnerProfile, currentConflict }
      });
    } catch (error) {
      console.error('Error generating personalized conflict advice:', error);
      return {
        personalizedAdvice: "Based on your communication styles, focus on taking turns speaking without interruption and using 'I feel' statements to express your emotions clearly.",
        communicationTips: [
          "Use a talking stick or object to ensure only one person speaks at a time",
          "Practice summarizing what your partner said before responding",
          "Maintain eye contact and open body language"
        ],
        emotionalRegulation: [
          "Notice physical sensations when feeling triggered",
          "Practice deep breathing (4-7-8 technique) before responding",
          "Take a 10-minute walk to reset emotions"
        ],
        relationshipStrengths: [
          "You both value the relationship enough to work on conflicts",
          "You're willing to seek help and learn new skills",
          "You're committed to understanding each other better"
        ]
      };
    }
  }

  /**
   * Tracks key conflict resolution metrics in the database.
   * @param challengeId The ID of the couples' challenge.
   * @param metrics The metrics to track.
   * @param userId The ID of the user.
   * @throws {Error} If the database operation fails.
   */
  async trackConflictResolutionMetrics(challengeId: string, metrics: ConflictResolutionMetrics, userId: string): Promise<void> {
    try {
      if (!challengeId || !userId) {
        throw new Error('Challenge ID and User ID are required');
      }

      // Insert multiple metric records for different metric types
      const metricInserts = [
        {
          challenge_id: challengeId,
          user_id: userId,
          metric_type: 'escalation_frequency' as const,
          value: metrics.conflictFrequency,
          context: 'Conflict frequency tracking'
        },
        {
          challenge_id: challengeId,
          user_id: userId,
          metric_type: 'repair_success_rate' as const,
          value: metrics.resolutionSuccessRate,
          context: 'Resolution success rate tracking'
        },
        {
          challenge_id: challengeId,
          user_id: userId,
          metric_type: 'conflict_duration' as const,
          value: metrics.emotionalRecoveryTime,
          context: 'Emotional recovery time tracking'
        },
        {
          challenge_id: challengeId,
          user_id: userId,
          metric_type: 'communication_improvement' as const,
          value: metrics.communicationImprovement,
          context: 'Communication improvement tracking'
        }
      ];

      const { error } = await supabase
        .from('conflict_resolution_metrics')
        .insert(metricInserts);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error tracking conflict resolution metrics:', error);
      throw new Error('Failed to track conflict resolution metrics.');
    }
  }

  /**
   * Stores a conflict pattern in the database for future analysis.
   * @param challengeId The ID of the couples' challenge.
   * @param pattern The conflict pattern to store.
   */
  async storeConflictPattern(challengeId: string, pattern: ConflictAnalysis): Promise<void> {
    try {
      if (!challengeId || !pattern) {
        throw new Error('Challenge ID and pattern are required');
      }

      const { error } = await supabase
        .from('conflict_patterns')
        .insert({
          challenge_id: challengeId,
          pattern_type: pattern.patternType,
          severity: pattern.severity,
          trigger_message: pattern.triggerPhrases[0] || 'Unknown',
          context: JSON.stringify({
            triggers: pattern.triggerPhrases,
            needs: pattern.underlyingNeeds,
            strategies: pattern.resolutionStrategies
          }),
          resolution_suggested: false,
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error storing conflict pattern:', error);
    }
  }

  /**
   * Records a completed conflict resolution exercise.
   * @param challengeId The ID of the couples' challenge.
   * @param exerciseType The type of exercise completed.
   * @param effectivenessScore A score (1-5) indicating the effectiveness.
   */
  async recordCompletedExercise(
    challengeId: string,
    exerciseType: ConflictResolutionSuggestion['exerciseType'],
    effectivenessScore: number
  ): Promise<void> {
    try {
      if (!challengeId || !exerciseType || effectivenessScore < 1 || effectivenessScore > 5) {
        throw new Error('Invalid parameters for recording exercise');
      }

      const { error } = await supabase
        .from('conflict_resolution_exercises')
        .insert({
          challenge_id: challengeId,
          exercise_type: exerciseType,
          status: 'completed',
          exercise_data: JSON.stringify({ completedAt: new Date() }),
          effectiveness_score: effectivenessScore,
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error recording completed exercise:', error);
    }
  }

  // --- Private Fallback Methods ---

  private getFallbackConflictAnalysis(messages: Array<{ content?: string }>): ConflictAnalysis {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage?.content?.toLowerCase() || '';

    const defaultAnalysis: ConflictAnalysis = {
      patternType: 'escalation',
      severity: 2,
      triggerPhrases: [lastMessage?.content || 'Unable to determine trigger'],
      emotionalImpact: "Mild frustration",
      underlyingNeeds: ["Understanding", "Respect"],
      resolutionStrategies: ["Take a breath", "Use 'I feel' statements"],
      immediateAction: "Pause and reflect before responding",
      longTermSolution: "Practice active listening regularly"
    };

    // Refactored from if/else to a more scalable pattern detector array
    const patternDetectors = [
      {
        keywords: ['angry', 'furious', 'hate', 'disgusted', 'fed up'],
        analysis: {
          patternType: 'escalation' as const,
          severity: 4,
          emotionalImpact: "High emotional intensity",
          underlyingNeeds: ["Safety", "Respect", "Understanding"],
          resolutionStrategies: ["Take a timeout", "Use calming techniques"],
          immediateAction: "Take a 20-minute break to cool down",
          longTermSolution: "Learn de-escalation techniques"
        }
      },
      {
        keywords: ['but you', 'you always', 'you never', 'your fault', 'because of you'],
        analysis: {
          patternType: 'defensiveness' as const,
          severity: 3,
          emotionalImpact: "Defensive reactions creating distance",
          underlyingNeeds: ["Validation", "Appreciation"],
          resolutionStrategies: ["Practice non-defensive listening", "Validate partner's perspective"],
          immediateAction: "Acknowledge your partner's feelings without justification",
          longTermSolution: "Build trust through vulnerability"
        }
      },
      {
        keywords: ['whatever', 'fine', 'i don\'t care', 'shut up', 'leave me alone'],
        analysis: {
          patternType: 'stonewalling' as const,
          severity: 3,
          emotionalImpact: "Emotional withdrawal and disconnection",
          underlyingNeeds: ["Space", "Self-regulation", "Control"],
          resolutionStrategies: ["Take structured breaks", "Use 'timeout' signals"],
          immediateAction: "Use a timeout signal and set a specific time to return",
          longTermSolution: "Develop emotional regulation skills"
        }
      },
      {
        keywords: ['you\'re too', 'you never', 'you always fail', 'you\'re wrong', 'stupid', 'idiot'],
        analysis: {
          patternType: 'criticism' as const,
          severity: 4,
          emotionalImpact: "Personal attacks and blame",
          underlyingNeeds: ["Respect", "Understanding", "Support"],
          resolutionStrategies: ["Use 'I feel' statements", "Focus on behavior not character"],
          immediateAction: "Reframe as a specific complaint about behavior",
          longTermSolution: "Replace criticism with gentle complaints"
        }
      },
      {
        keywords: ['disgusting', 'pathetic', 'despicable', 'worthless', 'beneath me'],
        analysis: {
          patternType: 'contempt' as const,
          severity: 5,
          emotionalImpact: "Severe erosion of respect and fondness",
          underlyingNeeds: ["Respect", "Appreciation", "Shared values"],
          resolutionStrategies: ["Rebuild fondness", "Perspective taking"],
          immediateAction: "List 3 positive qualities in your partner",
          longTermSolution: "Actively rebuild respect and appreciation"
        }
      }
    ];

    for (const detector of patternDetectors) {
      if (detector.keywords.some(keyword => content.includes(keyword))) {
        return { ...defaultAnalysis, ...detector.analysis };
      }
    }

    return defaultAnalysis;
  }

  private getFallbackSuggestion(patternType: ConflictAnalysis['patternType']): ConflictResolutionSuggestion {
    const suggestions: Record<ConflictAnalysis['patternType'], ConflictResolutionSuggestion> = {
      escalation: {
        exerciseType: 'de_escalation',
        suggestion: "Take a 10-minute break. Each partner write down 3 things they appreciate about the other, then share.",
        rationale: "Breaking the escalation cycle allows emotions to settle and creates space for positive reconnection.",
        expectedOutcome: "Reduced emotional intensity and renewed positive perspective.",
        timeRequired: 15
      },
      defensiveness: {
        exerciseType: 'active_listening',
        suggestion: "Practice reflective listening. Partner A shares, Partner B repeats back what they heard without adding their perspective.",
        rationale: "Defensiveness often comes from feeling misunderstood. Active listening builds mutual understanding.",
        expectedOutcome: "Increased feeling of being heard and understood.",
        timeRequired: 10
      },
      stonewalling: {
        exerciseType: 'repair_attempt',
        suggestion: "Use a timeout signal. When feeling overwhelmed, say 'I need a break' and set a specific time to return.",
        rationale: "Stonewalling is often a response to feeling flooded. Structured breaks prevent complete withdrawal.",
        expectedOutcome: "More regulated emotional responses and maintained connection.",
        timeRequired: 5
      },
      criticism: {
        exerciseType: 'i_feel_statements',
        suggestion: "Rewrite your complaint as an 'I feel' statement focusing on specific behavior, not character.",
        rationale: "Criticism attacks character while complaints address specific behaviors. This shift reduces defensiveness.",
        expectedOutcome: "More productive problem-solving and reduced personal attacks.",
        timeRequired: 8
      },
      contempt: {
        exerciseType: 'perspective_taking',
        suggestion: "Each partner shares 3 positive qualities they see in the other, then discuss what might be causing the negative feelings.",
        rationale: "Contempt indicates eroded fondness. Rebuilding appreciation is essential for relationship health.",
        expectedOutcome: "Renewed positive regard and reduced hostile communication.",
        timeRequired: 12
      }
    };

    return suggestions[patternType] || suggestions.escalation;
  }
}

// Export a single instance for use throughout the application
export const aiConflictResolutionService = new AIConflictResolutionService();