import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import { Json, Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { AIAssessmentService } from './AIAssessmentService';
import { AIService } from './ai/aiService';

type AssessmentFull = Tables<'assessments_enhanced'> & {
  ai_configurations: Tables<'ai_configurations'> | null;
};
type AssessmentInsert = TablesInsert<'assessments_enhanced'>;
type AttemptFull = Tables<'assessment_attempts'>;

export class AssessmentServiceOptimized {
  private static instance: AssessmentServiceOptimized;
  private assessmentsTable = 'assessments_enhanced';
  private attemptsTable = 'assessment_attempts';
  private resultsTable = 'assessment_results';
  private progressTable = 'user_assessment_progress';
  private aiService: AIService;
  private aiAssessmentService: AIAssessmentService;

  private constructor() {
    this.aiService = AIService.getInstance();
    this.aiAssessmentService = AIAssessmentService.getInstance();
  }

  public static getInstance(): AssessmentServiceOptimized {
    if (!AssessmentServiceOptimized.instance) {
      AssessmentServiceOptimized.instance = new AssessmentServiceOptimized();
    }
    return AssessmentServiceOptimized.instance;
  }

  public async getAssessmentById(id: string): Promise<AssessmentFull | null> {
    const { data, error } = await supabase
      .from(this.assessmentsTable)
      .select('*, ai_configurations(*)')
      .eq('id', id)
      .single();
    if (error) {
      logger.error('Error fetching assessment by ID:', error);
      return null;
    }
    return data as AssessmentFull | null;
  }

  public async getAllActiveAssessments(): Promise<AssessmentFull[]> {
    const { data, error } = await supabase
      .from(this.assessmentsTable)
      .select('*, ai_configurations(*)')
      .eq('is_active', true);
    if (error) {
      logger.error('Error fetching all active assessments:', error);
      return [];
    }
    return (data as AssessmentFull[]) || [];
  }

  public async createAssessment(assessment: AssessmentInsert): Promise<AssessmentFull | null> {
    const { data, error } = await supabase
      .from(this.assessmentsTable)
      .insert(assessment)
      .select()
      .single();
    if (error) {
      logger.error('Error creating assessment:', error);
      return null;
    }
    return data as AssessmentFull | null;
  }

  public async updateAssessment(id: string, updates: Partial<Omit<AssessmentFull, 'id' | 'created_at' | 'updated_at'>>): Promise<AssessmentFull | null> {
    const { data, error } = await supabase
      .from(this.assessmentsTable)
      .update(updates as TablesUpdate<'assessments_enhanced'>)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      logger.error('Error updating assessment:', error);
      return null;
    }
    return data as AssessmentFull | null;
  }

  public async startAttempt(assessmentId: string, userId: string, rawResponses: Json): Promise<AttemptFull | null> {
    const { data: latestAttempt, error: latestError } = await supabase
      .from(this.attemptsTable)
      .select('attempt_number')
      .eq('assessment_id', assessmentId)
      .eq('user_id', userId)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .single();

    if (latestError && latestError.code !== 'PGRST116') {
      logger.error('Error fetching latest attempt number:', latestError);
      return null;
    }

    const newAttemptNumber = (latestAttempt?.attempt_number || 0) + 1;

    const attempt: TablesInsert<'assessment_attempts'> = {
      assessment_id: assessmentId,
      user_id: userId,
      raw_responses: rawResponses,
      attempt_number: newAttemptNumber,
      status: 'in-progress',
      started_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(this.attemptsTable)
      .insert(attempt)
      .select()
      .single();

    if (error) {
      logger.error('Error starting new attempt:', error);
      return null;
    }
    return data;
  }

  public async finishAttempt(attemptId: string, score: number, feedback: string): Promise<AttemptFull | null> {
    const { data, error } = await supabase
      .from(this.attemptsTable)
      .update({
          ai_score: score,
          ai_feedback: feedback,
          status: 'completed',
          completed_at: new Date().toISOString(),
      } as TablesUpdate<'assessment_attempts'>)
      .eq('id', attemptId)
      .select()
      .single();

    if (error) {
      logger.error('Error finishing attempt:', error);
      return null;
    }
    return data;
  }
}