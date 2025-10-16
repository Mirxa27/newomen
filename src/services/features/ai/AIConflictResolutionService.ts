import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { aiCouplesChallengeService } from './AICouplesChallengeService';

export interface ConflictAnalysis {
  patternType: 'escalation' | 'defensiveness' | 'stonewalling' | 'criticism' | 'contempt';
  severity: number;
  triggerPhrases: string[];
  emotionalImpact: string;
  underlyingNeeds: string[];
  resolutionStrategies: string[];
  immediateAction: string;
  longTermSolution: string;
}

export interface ConflictResolutionSuggestion {
  exerciseType: 'active_listening' | 'i_feel_statements' | 'perspective_taking' | 'de_escalation' | 'repair_attempt';
  suggestion: string;
  rationale: string;
  expectedOutcome: string;
  timeRequired: number; // in minutes
}

export interface ConflictInsight {
  insight: string;
  patternAnalysis: string;
  emotionalState: string;
  communicationBreakdown: string;
  growthOpportunity: string;
  immediateStep: string;
}

export class AIConflictResolutionService {
  private static instance: AIConflictResolutionService;

  private constructor() {}

  static getInstance(): AIConflictResolutionService {
    if (!AIConflictResolutionService.instance) {
      AIConflictResolutionService.instance = new AIConflictResolutionService();
    }
    return AIConflictResolutionService.instance;
  }

  private async callEdgeFunction<T>(functionName: string, payload: unknown): Promise<T> {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });

    if (error) throw error;
    if (!data) throw new Error(`Edge function ${functionName} returned no data`);

    if (data.success === false) {
      throw new Error(data.error || `Edge function ${functionName} failed`);
    }

    return data.data;
  }

  async analyzeConflictPattern(
    messages: Array<{ sender: string; content: string; timestamp: string }>,
    challengeContext: string
  ): Promise<ConflictAnalysis> {
    try {
      return await this.callEdgeFunction<ConflictAnalysis>('enhanced-conflict-resolution', {
        type: 'analyzeConflictPattern',
        payload: { messages, challengeContext }
      });
    } catch (error) {
      console.error('Error analyzing conflict pattern:', error);
      // Fallback analysis
      return this.getFallbackConflictAnalysis(messages);
    }
  }

  async generateConflictResolutionSuggestion(
    conflictAnalysis: ConflictAnalysis,
    previousExercises: Array<{ exerciseType: string; effectiveness: number }>
  ): Promise<ConflictResolutionSuggestion> {
    try {
      return await this.callEdgeFunction<ConflictResolutionSuggestion>('enhanced-conflict-resolution', {
        type: 'generateConflictResolutionSuggestion',
        payload: { conflictAnalysis, previousExercises }
      });
    } catch (error) {
      console.error('Error generating conflict resolution suggestion:', error);
      // Fallback suggestion based on pattern type
      return this.getFallbackSuggestion(conflictAnalysis.patternType);
    }
  }

  async provideRealTimeConflictInsight(
    recentMessages: Array<{ sender: string; content: string; timestamp: string }>,
    conflictPatterns: ConflictAnalysis[]
  ): Promise<ConflictInsight> {
    try {
      return await this.callEdgeFunction<ConflictInsight>('enhanced-conflict-resolution', {
        type: 'provideRealTimeConflictInsight',
        payload: { recentMessages, conflictPatterns }
      });
    } catch (error) {
      console.error('Error providing real-time conflict insight:', error);
      // Fallback insight
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

  async assessConflictResolutionProgress(
    challengeId: string,
    conflictPatterns: ConflictAnalysis[],
    completedExercises: Array<{ exerciseType: string; effectiveness: number }>
  ): Promise<{
    overallProgress: number;
    patternImprovement: Record<string, number>;
    recommendedNextSteps: string[];
    confidenceLevel: 'low' | 'medium' | 'high';
  }> {
    try {
      return await this.callEdgeFunction<{
        overallProgress: number;
        patternImprovement: Record<string, number>;
        recommendedNextSteps: string[];
        confidenceLevel: 'low' | 'medium' | 'high';
      }>('enhanced-conflict-resolution', {
        type: 'assessConflictResolutionProgress',
        payload: { challengeId, conflictPatterns, completedExercises }
      });
    } catch (error) {
      console.error('Error assessing conflict resolution progress:', error);
      // Fallback assessment
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

  private getFallbackConflictAnalysis(messages: Array<{ sender: string; content: string; timestamp: string }>): ConflictAnalysis {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage?.content.toLowerCase() || '';

    // Simple pattern detection based on keywords
    let patternType: ConflictAnalysis['patternType'] = 'escalation';
    let severity = 2;
    let emotionalImpact = "Mild frustration";
    let underlyingNeeds = ["Understanding", "Respect"];
    let resolutionStrategies = ["Take a breath", "Use 'I feel' statements"];
    let immediateAction = "Pause and reflect before responding";
    let longTermSolution = "Practice active listening regularly";

    if (content.includes('angry') || content.includes('furious') || content.includes('hate')) {
      patternType = 'escalation';
      severity = 4;
      emotionalImpact = "High emotional intensity";
      underlyingNeeds = ["Safety", "Respect", "Understanding"];
      resolutionStrategies = ["Take a timeout", "Use calming techniques", "Express needs clearly"];
      immediateAction = "Take a 20-minute break to cool down";
      longTermSolution = "Learn de-escalation techniques and emotional regulation";
    } else if (content.includes('but you') || content.includes('you always') || content.includes('you never')) {
      patternType = 'defensiveness';
      severity = 3;
      emotionalImpact = "Defensive reactions creating distance";
      underlyingNeeds = ["Validation", "Appreciation", "Fairness"];
      resolutionStrategies = ["Practice non-defensive listening", "Validate partner's perspective"];
      immediateAction = "Acknowledge your partner's feelings without justification";
      longTermSolution = "Build trust through vulnerability and understanding";
    } else if (content.includes('fine') || content.includes('whatever') || content.includes('not talking')) {
      patternType = 'stonewalling';
      severity = 3;
      emotionalImpact = "Emotional withdrawal and disconnection";
      underlyingNeeds = ["Space", "Safety", "Reassurance"];
      resolutionStrategies = ["Request a break explicitly", "Set a time to return"];
      immediateAction = "Express need for break clearly and set return time";
      longTermSolution = "Develop shared signals for needing space";
    } else if (content.includes('you are') || content.includes('you\'re so')) {
      patternType = 'criticism';
      severity = 3;
      emotionalImpact = "Personal attacks causing hurt";
      underlyingNeeds = ["Appreciation", "Respect", "Positive regard"];
      resolutionStrategies = ["Focus on behavior not character", "Use specific complaints"];
      immediateAction = "Apologize for criticism and reframe concern specifically";
      longTermSolution = "Practice giving constructive feedback";
    } else if (content.includes('sarcastic') || content.includes('mock') || content.includes('ridiculous')) {
      patternType = 'contempt';
      severity = 5;
      emotionalImpact = "Deep hurt and relationship damage";
      underlyingNeeds = ["Respect", "Safety", "Positive connection"];
      resolutionStrategies = ["Practice appreciation", "Rebuild respect", "Seek counseling"];
      immediateAction = "Stop conversation and express commitment to respect";
      longTermSolution = "Work on rebuilding fondness and admiration";
    }

    return {
      patternType,
      severity,
      triggerPhrases: [lastMessage?.content || ''],
      emotionalImpact,
      underlyingNeeds,
      resolutionStrategies,
      immediateAction,
      longTermSolution
    };
  }

  private getFallbackSuggestion(patternType: string): ConflictResolutionSuggestion {
    const suggestions: Record<string, ConflictResolutionSuggestion> = {
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

  async generatePersonalizedConflictAdvice(
    userProfile: {
      communicationStyle: string;
      emotionalTendencies: string[];
      conflictHistory: string[];
    },
    partnerProfile: {
      communicationStyle: string;
      emotionalTendencies: string[];
      conflictHistory: string[];
    },
    currentConflict: ConflictAnalysis
  ): Promise<{
    personalizedAdvice: string;
    communicationTips: string[];
    emotionalRegulation: string[];
    relationshipStrengths: string[];
  }> {
    try {
      return await this.callEdgeFunction<{
        personalizedAdvice: string;
        communicationTips: string[];
        emotionalRegulation: string[];
        relationshipStrengths: string[];
      }>('enhanced-conflict-resolution', {
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
          "Set a timer for 2 minutes of uninterrupted sharing each"
        ],
        emotionalRegulation: [
          "Notice physical sensations when feeling triggered",
          "Practice deep breathing before responding",
          "Identify the underlying need behind the anger"
        ],
        relationshipStrengths: [
          "You both value the relationship enough to work on conflicts",
          "You're willing to seek help and learn new skills",
          "You have shared goals for improvement"
        ]
      };
    }
  }

  async trackConflictResolutionMetrics(
    challengeId: string,
    metrics: {
      conflictFrequency: number;
      resolutionSuccessRate: number;
      emotionalRecoveryTime: number;
      communicationImprovement: number;
    }
  ): Promise<void> {
    try {
      await supabase
        .from('conflict_resolution_metrics')
        .insert([
          {
            challenge_id: challengeId,
            metric_type: 'escalation_frequency',
            value: metrics.conflictFrequency,
            context: 'Weekly conflict frequency measurement'
          },
          {
            challenge_id: challengeId,
            metric_type: 'repair_success_rate',
            value: metrics.resolutionSuccessRate,
            context: 'Success rate of conflict resolution attempts'
          },
          {
            challenge_id: challengeId,
            metric_type: 'conflict_duration',
            value: metrics.emotionalRecoveryTime,
            context: 'Time to emotional recovery after conflicts'
          },
          {
            challenge_id: challengeId,
            metric_type: 'communication_improvement',
            value: metrics.communicationImprovement,
            context: 'Measured improvement in communication patterns'
          }
        ]);
    } catch (error) {
      console.error('Error tracking conflict resolution metrics:', error);
    }
  }
}

export const aiConflictResolutionService = AIConflictResolutionService.getInstance();