import { supabase } from '@/integrations/supabase/client';

export interface AIContentGenerationRequest {
  type: 'assessment' | 'wellness_resource' | 'couples_challenge';
  topic: string;
  description: string;
  targetAudience: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
  additionalInstructions?: string;
}

// Payload types returned by ai-content-builder
type AssessmentItem = {
  question: string;
  type: 'multiple_choice' | 'text' | 'scale' | 'yes_no';
  options?: string[];
  required: boolean;
  order: number;
};

type AIBuilderAssessmentPayload = {
  title: string;
  description: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  category: string;
  questions: AssessmentItem[];
};

type AIBuilderWellnessPayload = {
  title: string;
  description: string;
  content: string;
  type: 'article' | 'exercise' | 'meditation' | 'journal_prompt';
  category: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
};

type CouplesItem = {
  question: string;
  type: 'discussion' | 'activity' | 'reflection' | 'game';
  instructions?: string;
  estimatedTime: number;
  order: number;
};

type AIBuilderCouplesPayload = {
  title: string;
  description: string;
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  questions: CouplesItem[];
};

export interface GeneratedAssessment {
  id: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  estimatedDuration: number;
  difficulty: string;
  tags: string[];
  category: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'text' | 'scale' | 'yes_no';
  options?: string[];
  required: boolean;
  order: number;
}

export interface GeneratedWellnessResource {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'article' | 'exercise' | 'meditation' | 'journal_prompt';
  category: string;
  estimatedDuration: number;
  difficulty: string;
  tags: string[];
}

export interface GeneratedCouplesChallenge {
  id: string;
  title: string;
  description: string;
  questions: CouplesQuestion[];
  estimatedDuration: number;
  difficulty: string;
  category: string;
  tags: string[];
}

export interface CouplesQuestion {
  id: string;
  question: string;
  type: 'discussion' | 'activity' | 'reflection' | 'game';
  instructions?: string;
  estimatedTime: number;
  order: number;
}

export class AIContentGenerationService {
  private async callAIContentBuilder<T>(params: {
    type: 'assessment' | 'wellness_resource' | 'couples_challenge';
    topic: string;
    isPublic?: boolean;
    context?: string;
  }): Promise<T> {
    const { data, error } = await supabase.functions.invoke<T>('ai-content-builder', {
      body: {
        topic: params.topic,
        type: params.type,
        isPublic: Boolean(params.isPublic),
        context: params.context || ''
      }
    });

    if (error) {
      throw new Error(error.message || 'ai-content-builder invocation failed');
    }
    if (!data) {
      throw new Error('Empty response from ai-content-builder');
    }
    return data;
  }

  async generateAssessment(request: AIContentGenerationRequest): Promise<GeneratedAssessment> {
    // Real AI generation via edge function - no fallbacks
    const payload = await this.callAIContentBuilder<AIBuilderAssessmentPayload>({
      type: 'assessment',
      topic: request.topic,
      isPublic: false,
      context: request.description
    });

    const generatedData: Omit<GeneratedAssessment, 'id'> = {
      title: String(payload.title || `${request.topic} Assessment`).trim(),
      description: String(payload.description || request.description || '').trim(),
      questions: Array.isArray(payload.questions) ? payload.questions.map((q: AssessmentItem, idx: number) => ({
        id: `q_${Date.now()}_${idx + 1}`,
        question: String((q as AssessmentItem).question || (q as unknown as { text?: string }).text || '').trim(),
        type: (q.type as AssessmentQuestion['type']) || 'text',
        options: Array.isArray(q.options) ? q.options.map((o) => String(o)) : undefined,
        required: Boolean(q.required ?? true),
        order: typeof q.order === 'number' ? q.order : idx + 1,
      })) : [],
      estimatedDuration: Number(payload.estimatedDuration || request.duration || 15),
      difficulty: String(payload.difficulty || request.difficulty || 'intermediate'),
      tags: Array.isArray(payload.tags) ? payload.tags.map((t) => String(t)) : [request.topic.toLowerCase(), request.targetAudience.toLowerCase()],
      category: String(payload.category || 'Personal Development')
    };

    const assessmentId = await this.saveGeneratedAssessment(generatedData, request);
    return { ...generatedData, id: assessmentId };
  }

  async generateWellnessResource(request: AIContentGenerationRequest): Promise<GeneratedWellnessResource> {
    // Real AI generation via edge function - no fallbacks
    const payload = await this.callAIContentBuilder<AIBuilderWellnessPayload>({
      type: 'wellness_resource',
      topic: request.topic,
      isPublic: true,
      context: request.description
    });

    const generatedData: Omit<GeneratedWellnessResource, 'id'> = {
      title: String(payload.title || `${request.topic} Wellness Guide`).trim(),
      description: String(payload.description || request.description || '').trim(),
      content: String(payload.content || '').trim(),
      type: (payload.type as GeneratedWellnessResource['type']) || 'article',
      category: String(payload.category || 'Wellness'),
      estimatedDuration: Number(payload.estimatedDuration || request.duration || 10),
      difficulty: String(payload.difficulty || request.difficulty || 'intermediate'),
      tags: Array.isArray(payload.tags) ? payload.tags.map((t) => String(t)) : [request.topic.toLowerCase(), 'wellness', 'guide']
    };

    const resourceId = await this.saveGeneratedWellnessResource(generatedData, request);
    return { ...generatedData, id: resourceId };
  }

  async generateCouplesChallenge(request: AIContentGenerationRequest): Promise<GeneratedCouplesChallenge> {
    // Real AI generation via edge function - no fallbacks
    const payload = await this.callAIContentBuilder<AIBuilderCouplesPayload>({
      type: 'couples_challenge',
      topic: request.topic,
      isPublic: false,
      context: request.description
    });

    const questions = Array.isArray(payload.questions) ? payload.questions.map((q: CouplesItem, idx: number) => ({
      id: `cq_${Date.now()}_${idx + 1}`,
      question: String((q as CouplesItem).question || (q as unknown as { text?: string }).text || '').trim(),
      type: (q.type as CouplesQuestion['type']) || 'discussion',
      instructions: q.instructions ? String(q.instructions) : undefined,
      estimatedTime: Number(q.estimatedTime || 10),
      order: typeof q.order === 'number' ? q.order : idx + 1
    })) : [];

    const generatedData: Omit<GeneratedCouplesChallenge, 'id'> = {
      title: String(payload.title || `${request.topic} Couples Challenge`).trim(),
      description: String(payload.description || request.description || '').trim(),
      questions,
      estimatedDuration: Number(payload.estimatedDuration || request.duration || 30),
      difficulty: String(payload.difficulty || request.difficulty || 'intermediate'),
      category: String(payload.category || 'Relationship Building'),
      tags: Array.isArray(payload.tags) ? payload.tags.map((t) => String(t)) : [request.topic.toLowerCase(), 'couples', 'relationship']
    };

    const challengeId = await this.saveGeneratedCouplesChallenge(generatedData, request);
    return { ...generatedData, id: challengeId };
  }

  private async saveGeneratedAssessment(data: Omit<GeneratedAssessment, 'id'>, request: AIContentGenerationRequest): Promise<string> {
    const { data: assessment, error } = await supabase
      .from('assessments_enhanced')
      .insert({
        title: data.title,
        description: data.description,
        type: 'assessment', // Required field - must be 'assessment', 'quiz', or 'challenge'
        category: data.category,
        difficulty_level: data.difficulty === 'beginner' ? 'easy' : data.difficulty === 'intermediate' ? 'medium' : 'hard',
        estimated_duration: data.estimatedDuration,
        tags: data.tags,
        ai_generated: true,
        generation_prompt: JSON.stringify(request),
        is_active: true,
        is_public: false,
        questions: data.questions.map(q => ({
          question: q.question,
          type: q.type,
          options: q.options,
          required: q.required
        })),
        created_by: null
      })
      .select('id')
      .single();

    if (error) throw error;

    // Save questions separately
    const questionsToInsert = data.questions.map(q => ({
      assessment_id: assessment.id,
      question_text: q.question,
      question_type: q.type,
      options: q.options,
      required: q.required,
      order_index: q.order
    }));

    const { error: questionsError } = await supabase
      .from('assessment_questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    return assessment.id;
  }

  private async saveGeneratedWellnessResource(data: Omit<GeneratedWellnessResource, 'id'>, request: AIContentGenerationRequest): Promise<string> {
    const { data: resource, error } = await supabase
      .from('wellness_resources')
      .insert({
        title: data.title,
        description: data.description,
        category: data.category,
        duration: data.estimatedDuration,
        tags: data.tags,
        status: 'active',
        created_by: null
      })
      .select('id')
      .single();

    if (error) throw error;
    return resource.id;
  }

  private async saveGeneratedCouplesChallenge(data: Omit<GeneratedCouplesChallenge, 'id'>, request: AIContentGenerationRequest): Promise<string> {
    const { data: challenge, error } = await supabase
      .from('couples_challenges')
      .insert({
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        estimated_duration: data.estimatedDuration,
        tags: data.tags,
        ai_generated: true,
        generation_prompt: JSON.stringify(request),
        status: 'draft',
        created_by: 'ai_generator',
        question_set: data.questions.map(q => ({
          question: q.question,
          type: q.type,
          instructions: q.instructions,
          estimatedTime: q.estimatedTime
        }))
      })
      .select('id')
      .single();

    if (error) throw error;

    // Save questions separately
    const questionsToInsert = data.questions.map(q => ({
      challenge_id: challenge.id,
      question_text: q.question,
      question_type: q.type,
      instructions: q.instructions,
      estimated_time: q.estimatedTime,
      order_index: q.order
    }));

    const { error: questionsError } = await supabase
      .from('couples_challenge_questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    return challenge.id;
  }

  async getGeneratedContent(type: 'assessment' | 'wellness_resource' | 'couples_challenge', limit: number = 20) {
    const tableMap = {
      assessment: 'assessments_enhanced',
      wellness_resource: 'wellness_resources',
      couples_challenge: 'couples_challenges'
    };

    let query = supabase
      .from(tableMap[type])
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Only filter by ai_generated if the table has this column
    if (type === 'assessment') {
      query = query.eq('ai_generated', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async deleteGeneratedContent(type: 'assessment' | 'wellness_resource' | 'couples_challenge', id: string) {
    const tableMap = {
      assessment: 'assessments_enhanced',
      wellness_resource: 'wellness_resources',
      couples_challenge: 'couples_challenges'
    };

    const { error } = await supabase
      .from(tableMap[type])
      .delete()
      .eq('id', id)
      .eq('ai_generated', true);

    if (error) throw error;
  }
}

export const aiContentGenerationService = new AIContentGenerationService();
