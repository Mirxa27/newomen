import { supabase } from '@/integrations/supabase/client';
import { aiConflictResolutionService } from './AIConflictResolutionService';

export interface ConflictPattern {
  id: string;
  patternType: 'escalation' | 'defensiveness' | 'stonewalling' | 'criticism' | 'contempt';
  severity: number;
  detectedAt: string;
  triggerMessage: string;
  context: string;
  resolutionSuggested: boolean;
  resolvedAt?: string;
}

export interface ConflictExercise {
  id: string;
  exerciseType: 'active_listening' | 'i_feel_statements' | 'perspective_taking' | 'de_escalation' | 'repair_attempt';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  exerciseData: {
    title: string;
    description: string;
    instructions: string[];
    timeRequired: number;
    expectedOutcome: string;
  };
  userResponse?: Record<string, unknown>;
  partnerResponse?: Record<string, unknown>;
  effectivenessScore?: number;
  completedAt?: string;
}

export interface ConflictMetrics {
  conflictFrequency: number;
  resolutionSuccessRate: number;
  emotionalRecoveryTime: number;
  communicationImprovement: number;
  patternImprovement: Record<string, number>;
  overallScore: number;
}

export interface RealTimeConflictAlert {
  patternType: string;
  severity: number;
  message: string;
  suggestedAction: string;
  immediateExercise?: ConflictExercise;
  timestamp: string;
}

export class EnhancedConflictResolutionService {
  private static instance: EnhancedConflictResolutionService;
  private conflictDetectionEnabled = true;
  private realTimeAlerts: RealTimeConflictAlert[] = [];

  private constructor() {}

  static getInstance(): EnhancedConflictResolutionService {
    if (!EnhancedConflictResolutionService.instance) {
      EnhancedConflictResolutionService.instance = new EnhancedConflictResolutionService();
    }
    return EnhancedConflictResolutionService.instance;
  }

  /**
   * Enhanced conflict pattern detection with AI analysis
   */
  async detectConflictPatterns(
    challengeId: string,
    messages: Array<{ sender: string; content: string; timestamp: string }>
  ): Promise<ConflictPattern[]> {
    try {
      const detectedPatterns: ConflictPattern[] = [];

      // Use database function for basic pattern detection
      for (const message of messages) {
        const { data: patterns, error } = await supabase.rpc('detect_conflict_pattern', {
          challenge_id: challengeId,
          message_content: message.content,
          sender_role: message.sender
        });

        if (error) {
          console.error('Error detecting conflict patterns:', error);
          continue;
        }

        if (patterns && patterns.length > 0) {
          for (const pattern of patterns) {
            const conflictPattern: ConflictPattern = {
              id: crypto.randomUUID(),
              patternType: pattern.pattern_type,
              severity: pattern.severity,
              detectedAt: message.timestamp,
              triggerMessage: pattern.trigger_message,
              context: pattern.context,
              resolutionSuggested: false
            };

            detectedPatterns.push(conflictPattern);

            // Store in database
            await this.storeConflictPattern(challengeId, conflictPattern);
          }
        }
      }

      // Enhanced AI analysis for complex patterns
      if (detectedPatterns.length > 0) {
        const aiAnalysis = await aiConflictResolutionService.analyzeConflictPattern(
          messages,
          `Challenge ${challengeId}`
        );

        // Update patterns with AI insights
        for (const pattern of detectedPatterns) {
          if (pattern.patternType === aiAnalysis.patternType) {
            pattern.severity = Math.max(pattern.severity, aiAnalysis.severity);
            pattern.context = `${pattern.context} | AI: ${aiAnalysis.emotionalImpact}`;
          }
        }
      }

      return detectedPatterns;
    } catch (error) {
      console.error('Error in enhanced conflict detection:', error);
      return [];
    }
  }

  /**
   * Real-time conflict detection for live chat
   */
  async detectRealTimeConflict(
    challengeId: string,
    newMessage: { sender: string; content: string; timestamp: string }
  ): Promise<RealTimeConflictAlert | null> {
    if (!this.conflictDetectionEnabled) return null;

    try {
      // Quick pattern detection
      const { data: patterns, error } = await supabase.rpc('detect_conflict_pattern', {
        challenge_id: challengeId,
        message_content: newMessage.content,
        sender_role: newMessage.sender
      });

      if (error || !patterns || patterns.length === 0) return null;

      const pattern = patterns[0];
      
      // Create real-time alert
      const alert: RealTimeConflictAlert = {
        patternType: pattern.pattern_type,
        severity: pattern.severity,
        message: `Conflict pattern detected: ${pattern.context}`,
        suggestedAction: this.getImmediateAction(pattern.pattern_type, pattern.severity),
        timestamp: new Date().toISOString()
      };

      // Generate immediate exercise if severity is high
      if (pattern.severity >= 3) {
        const exercise = await this.generateImmediateExercise(pattern.pattern_type, challengeId);
        alert.immediateExercise = exercise;
      }

      // Store alert
      this.realTimeAlerts.push(alert);

      return alert;
    } catch (error) {
      console.error('Error in real-time conflict detection:', error);
      return null;
    }
  }

  /**
   * Generate interactive conflict resolution exercises
   */
  async generateConflictExercise(
    challengeId: string,
    patternType: string,
    severity: number
  ): Promise<ConflictExercise> {
    try {
      const exerciseType = this.getExerciseTypeForPattern(patternType);
      const exerciseData = await this.getExerciseData(exerciseType, severity);

      const exercise: ConflictExercise = {
        id: crypto.randomUUID(),
        exerciseType,
        status: 'pending',
        exerciseData,
        completedAt: undefined
      };

      // Store exercise in database
      await this.storeConflictExercise(challengeId, exercise);

      return exercise;
    } catch (error) {
      console.error('Error generating conflict exercise:', error);
      throw error;
    }
  }

  /**
   * Complete a conflict resolution exercise
   */
  async completeConflictExercise(
    exerciseId: string,
    userResponse: Record<string, unknown>,
    partnerResponse: Record<string, unknown>,
    effectivenessScore: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('conflict_resolution_exercises')
        .update({
          user_response: userResponse,
          partner_response: partnerResponse,
          effectiveness_score: effectivenessScore,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', exerciseId);

      if (error) throw error;

      // Update conflict resolution score
      await this.updateConflictResolutionScore(exerciseId);
    } catch (error) {
      console.error('Error completing conflict exercise:', error);
      throw error;
    }
  }

  /**
   * Get conflict resolution metrics for a challenge
   */
  async getConflictMetrics(challengeId: string): Promise<ConflictMetrics> {
    try {
      // Get conflict patterns
      const { data: patterns, error: patternsError } = await supabase
        .from('conflict_patterns')
        .select('*')
        .eq('challenge_id', challengeId);

      if (patternsError) throw patternsError;

      // Get exercises
      const { data: exercises, error: exercisesError } = await supabase
        .from('conflict_resolution_exercises')
        .select('*')
        .eq('challenge_id', challengeId);

      if (exercisesError) throw exercisesError;

      // Calculate metrics
      const totalPatterns = patterns?.length || 0;
      const resolvedPatterns = patterns?.filter(p => p.resolution_suggested).length || 0;
      const completedExercises = exercises?.filter(e => e.status === 'completed').length || 0;
      const totalExercises = exercises?.length || 0;

      const conflictFrequency = totalPatterns;
      const resolutionSuccessRate = totalPatterns > 0 ? (resolvedPatterns / totalPatterns) * 100 : 100;
      const communicationImprovement = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

      // Calculate pattern improvement
      const patternImprovement: Record<string, number> = {};
      const patternTypes = ['escalation', 'defensiveness', 'stonewalling', 'criticism', 'contempt'];
      
      for (const type of patternTypes) {
        const typePatterns = patterns?.filter(p => p.pattern_type === type) || [];
        const resolvedTypePatterns = typePatterns.filter(p => p.resolution_suggested);
        patternImprovement[type] = typePatterns.length > 0 
          ? (resolvedTypePatterns.length / typePatterns.length) * 100 
          : 100;
      }

      const overallScore = Math.round(
        (resolutionSuccessRate * 0.4 + communicationImprovement * 0.3 + 
         Object.values(patternImprovement).reduce((a, b) => a + b, 0) / patternTypes.length * 0.3)
      );

      // Calculate emotional recovery time (minutes):
      // Average time from each detected conflict pattern to the nearest completed exercise
      let emotionalRecoveryTime = 0;
      if (patterns && patterns.length > 0 && exercises && exercises.length > 0) {
        const deltas: number[] = [];
        for (const p of (patterns as Array<{ detected_at: string }>)) {
          const detectedAt = new Date((p as any).detected_at).getTime();
          if (isNaN(detectedAt)) continue;

          // Find the earliest completed exercise after the pattern was detected
          const completedAfter = (exercises as Array<{ completed_at: string | null }>)
            .filter((e: any) => e.completed_at)
            .map((e: any) => new Date(e.completed_at as string).getTime())
            .filter((t: number) => !isNaN(t) && t >= detectedAt)
            .sort((a: number, b: number) => a - b);

          if (completedAfter.length > 0) {
            const deltaMs = completedAfter[0] - detectedAt;
            // convert ms to minutes with 1 decimal precision
            deltas.push(deltaMs / 60000);
          }
        }

        if (deltas.length > 0) {
          emotionalRecoveryTime = Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10;
        }
      }

      return {
        conflictFrequency,
        resolutionSuccessRate,
        emotionalRecoveryTime,
        communicationImprovement,
        patternImprovement,
        overallScore
      };
    } catch (error) {
      console.error('Error getting conflict metrics:', error);
      throw error;
    }
  }

  /**
   * Get conflict resolution dashboard data
   */
  async getConflictDashboard(challengeId: string): Promise<{
    patterns: ConflictPattern[];
    exercises: ConflictExercise[];
    metrics: ConflictMetrics;
    insights: string[];
    recommendations: string[];
  }> {
    try {
      const patterns = await this.getConflictPatterns(challengeId);
      const exercises = await this.getConflictExercises(challengeId);
      const metrics = await this.getConflictMetrics(challengeId);
      
      const insights = await this.generateConflictInsights(patterns, exercises, metrics);
      const recommendations = await this.generateRecommendations(patterns, exercises, metrics);

      return {
        patterns,
        exercises,
        metrics,
        insights,
        recommendations
      };
    } catch (error) {
      console.error('Error getting conflict dashboard:', error);
      throw error;
    }
  }

  // Private helper methods
  private async storeConflictPattern(challengeId: string, pattern: ConflictPattern): Promise<void> {
    const { error } = await supabase
      .from('conflict_patterns')
      .insert({
        id: pattern.id,
        challenge_id: challengeId,
        pattern_type: pattern.patternType,
        severity: pattern.severity,
        trigger_message: pattern.triggerMessage,
        context: pattern.context,
        resolution_suggested: pattern.resolutionSuggested,
        detected_at: pattern.detectedAt
      });

    if (error) throw error;
  }

  private async storeConflictExercise(challengeId: string, exercise: ConflictExercise): Promise<void> {
    const { error } = await supabase
      .from('conflict_resolution_exercises')
      .insert({
        id: exercise.id,
        challenge_id: challengeId,
        exercise_type: exercise.exerciseType,
        status: exercise.status,
        exercise_data: exercise.exerciseData
      });

    if (error) throw error;
  }

  private async getConflictPatterns(challengeId: string): Promise<ConflictPattern[]> {
    const { data, error } = await supabase
      .from('conflict_patterns')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('detected_at', { ascending: false });

    if (error) throw error;

    return data?.map(pattern => ({
      id: pattern.id,
      patternType: pattern.pattern_type,
      severity: pattern.severity,
      detectedAt: pattern.detected_at,
      triggerMessage: pattern.trigger_message,
      context: pattern.context,
      resolutionSuggested: pattern.resolution_suggested,
      resolvedAt: pattern.resolved_at
    })) || [];
  }

  private async getConflictExercises(challengeId: string): Promise<ConflictExercise[]> {
    const { data, error } = await supabase
      .from('conflict_resolution_exercises')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(exercise => ({
      id: exercise.id,
      exerciseType: exercise.exercise_type,
      status: exercise.status,
      exerciseData: exercise.exercise_data,
      userResponse: exercise.user_response,
      partnerResponse: exercise.partner_response,
      effectivenessScore: exercise.effectiveness_score,
      completedAt: exercise.completed_at
    })) || [];
  }

  private getImmediateAction(patternType: string, severity: number): string {
    const actions: Record<string, string> = {
      escalation: severity >= 4 ? 'Take a 20-minute break to cool down' : 'Take a deep breath and pause before responding',
      defensiveness: 'Try to understand your partner\'s perspective before defending',
      stonewalling: 'Express your need for space clearly and set a return time',
      criticism: 'Reframe your concern to focus on behavior, not character',
      contempt: 'Stop the conversation and focus on rebuilding respect'
    };

    return actions[patternType] || 'Take a moment to reflect before continuing';
  }

  private getExerciseTypeForPattern(patternType: string): ConflictExercise['exerciseType'] {
    const mapping: Record<string, ConflictExercise['exerciseType']> = {
      escalation: 'de_escalation',
      defensiveness: 'active_listening',
      stonewalling: 'repair_attempt',
      criticism: 'i_feel_statements',
      contempt: 'perspective_taking'
    };

    return mapping[patternType] || 'active_listening';
  }

  private async getExerciseData(exerciseType: ConflictExercise['exerciseType'], severity: number): Promise<ConflictExercise['exerciseData']> {
    const exerciseTemplates: Record<ConflictExercise['exerciseType'], ConflictExercise['exerciseData']> = {
      active_listening: {
        title: 'Active Listening Exercise',
        description: 'Practice reflective listening to ensure understanding',
        instructions: [
          'Partner A shares their perspective for 2 minutes without interruption',
          'Partner B summarizes what they heard: "What I hear you saying is..."',
          'Partner A confirms if the summary is accurate',
          'Switch roles and repeat'
        ],
        timeRequired: 10,
        expectedOutcome: 'Both partners feel heard and understood'
      },
      i_feel_statements: {
        title: 'I Feel Statements Practice',
        description: 'Express feelings without blame using structured statements',
        instructions: [
          'Complete the sentence: "I feel [emotion] when [situation] because [reason]"',
          'Focus on your feelings, not your partner\'s behavior',
          'Avoid words like "always" or "never"',
          'End with a specific request for change'
        ],
        timeRequired: 8,
        expectedOutcome: 'Clearer communication of needs and feelings'
      },
      perspective_taking: {
        title: 'Perspective Taking Exercise',
        description: 'Try to see the situation from your partner\'s point of view',
        instructions: [
          'Each partner writes down their perspective on the issue',
          'Switch papers and read your partner\'s perspective',
          'Discuss what you learned about each other\'s viewpoint',
          'Find one thing you can agree on'
        ],
        timeRequired: 15,
        expectedOutcome: 'Increased empathy and understanding'
      },
      de_escalation: {
        title: 'De-escalation Techniques',
        description: 'Learn to calm intense emotions and reduce conflict intensity',
        instructions: [
          'Take 3 deep breaths together',
          'Use calming phrases: "I can see you\'re upset" or "Let\'s slow down"',
          'Take a 5-minute break if needed',
          'Return with a commitment to listen'
        ],
        timeRequired: 5,
        expectedOutcome: 'Reduced emotional intensity and clearer thinking'
      },
      repair_attempt: {
        title: 'Repair Attempt Exercise',
        description: 'Make a repair attempt to reconnect after conflict',
        instructions: [
          'Each partner shares one thing they appreciate about the other',
          'Acknowledge the effort: "I appreciate that you\'re trying to understand"',
          'Suggest a fresh start: "Can we try a different approach?"',
          'Commit to listening without interrupting'
        ],
        timeRequired: 12,
        expectedOutcome: 'Renewed connection and positive communication'
      }
    };

    return exerciseTemplates[exerciseType];
  }

  private async generateImmediateExercise(patternType: string, challengeId: string): Promise<ConflictExercise> {
    return this.generateConflictExercise(challengeId, patternType, 3);
  }

  private async updateConflictResolutionScore(challengeId: string): Promise<void> {
    const { error } = await supabase.rpc('calculate_conflict_score', {
      challenge_id: challengeId
    });

    if (error) throw error;
  }

  private async generateConflictInsights(
    patterns: ConflictPattern[],
    exercises: ConflictExercise[],
    metrics: ConflictMetrics
  ): Promise<string[]> {
    const insights: string[] = [];

    if (metrics.conflictFrequency > 0) {
      insights.push(`You've detected ${metrics.conflictFrequency} conflict patterns during your challenge.`);
    }

    if (metrics.resolutionSuccessRate > 80) {
      insights.push('Excellent conflict resolution rate! You\'re successfully working through disagreements.');
    } else if (metrics.resolutionSuccessRate > 50) {
      insights.push('Good progress on conflict resolution. There\'s room for improvement in how you handle disagreements.');
    } else {
      insights.push('Focus on developing better conflict resolution skills. Consider practicing active listening and empathy.');
    }

    const mostCommonPattern = this.getMostCommonPattern(patterns);
    if (mostCommonPattern) {
      insights.push(`The most common conflict pattern is ${mostCommonPattern}. Focus on exercises that address this pattern.`);
    }

    return insights;
  }

  private async generateRecommendations(
    patterns: ConflictPattern[],
    exercises: ConflictExercise[],
    metrics: ConflictMetrics
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (metrics.communicationImprovement < 70) {
      recommendations.push('Practice active listening exercises regularly to improve communication.');
    }

    if (metrics.patternImprovement.escalation < 60) {
      recommendations.push('Work on de-escalation techniques when emotions run high.');
    }

    if (metrics.patternImprovement.defensiveness < 60) {
      recommendations.push('Practice perspective-taking to reduce defensive responses.');
    }

    if (metrics.patternImprovement.contempt < 60) {
      recommendations.push('Focus on rebuilding respect and appreciation in your relationship.');
    }

    return recommendations;
  }

  private getMostCommonPattern(patterns: ConflictPattern[]): string | null {
    if (patterns.length === 0) return null;

    const patternCounts: Record<string, number> = {};
    patterns.forEach(pattern => {
      patternCounts[pattern.patternType] = (patternCounts[pattern.patternType] || 0) + 1;
    });

    return Object.entries(patternCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  // Public methods for real-time conflict detection
  enableConflictDetection(): void {
    this.conflictDetectionEnabled = true;
  }

  disableConflictDetection(): void {
    this.conflictDetectionEnabled = false;
  }

  getRealTimeAlerts(): RealTimeConflictAlert[] {
    return this.realTimeAlerts;
  }

  clearRealTimeAlerts(): void {
    this.realTimeAlerts = [];
  }
}

export const enhancedConflictResolutionService = EnhancedConflictResolutionService.getInstance();
