import { supabase } from '@/integrations/supabase/client';
import { aiService } from './aiService';

export interface AIContentGenerationRequest {
  type: 'assessment' | 'wellness_resource' | 'couples_challenge';
  topic: string;
  description: string;
  targetAudience: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // in minutes
  additionalInstructions?: string;
}

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
  private async getAIConfiguration(serviceType: string) {
    // Map service types to configuration names
    const configMap: Record<string, string> = {
      'assessment_generation': 'Assessment Generation AI',
      'content_generation': 'Content Generation AI',
      'couples_challenge_generation': 'Couples Challenge Generation AI'
    };

    const configName = configMap[serviceType];
    if (!configName) {
      throw new Error(`Unknown service type: ${serviceType}`);
    }

    const { data: config, error } = await supabase
      .from('ai_configurations')
      .select('*')
      .eq('name', configName)
      .eq('is_active', true)
      .single();

    if (error || !config) {
      throw new Error(`AI configuration not found for service: ${serviceType}`);
    }
    return config;
  }

  async generateAssessment(request: AIContentGenerationRequest): Promise<GeneratedAssessment> {
    try {
      const config = await this.getAIConfiguration('assessment_generation');
      
      const prompt = this.buildAssessmentPrompt(request);
      const response = await aiService.callAIProvider({
        provider: config.provider,
        model: config.model_name,
        systemPrompt: config.system_prompt,
        maxTokens: config.max_tokens,
        temperature: config.temperature
      }, prompt);
      
      if (!response.success || !response.content) {
        throw new Error(response.error || 'Failed to generate assessment');
      }

      const generatedData = this.parseAssessmentResponse(response.content);
      
      // Save to database
      const assessmentId = await this.saveGeneratedAssessment(generatedData, request);
      
      return {
        ...generatedData,
        id: assessmentId
      };
    } catch (error) {
      console.error('Error generating assessment:', error);
      throw error;
    }
  }

  async generateWellnessResource(request: AIContentGenerationRequest): Promise<GeneratedWellnessResource> {
    try {
      const config = await this.getAIConfiguration('content_generation');
      
      const prompt = this.buildWellnessPrompt(request);
      const response = await aiService.callAIProvider({
        provider: config.provider,
        model: config.model_name,
        systemPrompt: config.system_prompt,
        maxTokens: config.max_tokens,
        temperature: config.temperature
      }, prompt);
      
      if (!response.success || !response.content) {
        throw new Error(response.error || 'Failed to generate wellness resource');
      }

      const generatedData = this.parseWellnessResponse(response.content);
      
      // Save to database
      const resourceId = await this.saveGeneratedWellnessResource(generatedData, request);
      
      return {
        ...generatedData,
        id: resourceId
      };
    } catch (error) {
      console.error('Error generating wellness resource:', error);
      throw error;
    }
  }

  async generateCouplesChallenge(request: AIContentGenerationRequest): Promise<GeneratedCouplesChallenge> {
    try {
      const config = await this.getAIConfiguration('couples_challenge_generation');
      
      const prompt = this.buildCouplesChallengePrompt(request);
      const response = await aiService.callAIProvider({
        provider: config.provider,
        model: config.model_name,
        systemPrompt: config.system_prompt,
        maxTokens: config.max_tokens,
        temperature: config.temperature
      }, prompt);
      
      if (!response.success || !response.content) {
        throw new Error(response.error || 'Failed to generate couples challenge');
      }

      const generatedData = this.parseCouplesChallengeResponse(response.content);
      
      // Save to database
      const challengeId = await this.saveGeneratedCouplesChallenge(generatedData, request);
      
      return {
        ...generatedData,
        id: challengeId
      };
    } catch (error) {
      console.error('Error generating couples challenge:', error);
      throw error;
    }
  }

  private buildAssessmentPrompt(request: AIContentGenerationRequest): string {
    return `
You are an expert assessment designer specializing in psychological and personal development assessments.

Create a comprehensive assessment based on the following requirements:

TOPIC: ${request.topic}
DESCRIPTION: ${request.description}
TARGET AUDIENCE: ${request.targetAudience}
DIFFICULTY: ${request.difficulty || 'intermediate'}
DURATION: ${request.duration || 15} minutes
ADDITIONAL INSTRUCTIONS: ${request.additionalInstructions || 'None'}

Please generate a complete assessment with the following structure:

1. ASSESSMENT OVERVIEW:
   - Title (engaging and descriptive)
   - Description (2-3 sentences explaining the purpose)
   - Estimated duration
   - Difficulty level
   - Category/tags

2. QUESTIONS (8-12 questions):
   For each question, provide:
   - Question text (clear and engaging)
   - Question type (multiple_choice, text, scale, yes_no)
   - Options (if multiple choice)
   - Whether it's required
   - Order number

Question types should be varied and appropriate for the topic. Include:
- Multiple choice questions for objective assessment
- Text questions for open-ended responses
- Scale questions (1-10) for rating/measurement
- Yes/No questions for binary choices

Make sure questions are:
- Psychologically sound
- Engaging and non-threatening
- Appropriate for the target audience
- Covering different aspects of the topic
- Progressive in complexity

Return the response in JSON format with this exact structure:
{
  "title": "Assessment Title",
  "description": "Assessment description",
  "estimatedDuration": 15,
  "difficulty": "intermediate",
  "category": "Category Name",
  "tags": ["tag1", "tag2", "tag3"],
  "questions": [
    {
      "question": "Question text?",
      "type": "multiple_choice",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "required": true,
      "order": 1
    }
  ]
}
`;
  }

  private buildWellnessPrompt(request: AIContentGenerationRequest): string {
    return `
You are an expert wellness content creator specializing in mental health, personal development, and therapeutic resources.

Create a comprehensive wellness resource based on the following requirements:

TOPIC: ${request.topic}
DESCRIPTION: ${request.description}
TARGET AUDIENCE: ${request.targetAudience}
DIFFICULTY: ${request.difficulty || 'intermediate'}
DURATION: ${request.duration || 10} minutes
ADDITIONAL INSTRUCTIONS: ${request.additionalInstructions || 'None'}

Please generate a complete wellness resource with the following structure:

1. RESOURCE OVERVIEW:
   - Title (engaging and descriptive)
   - Description (2-3 sentences explaining the purpose)
   - Type (article, exercise, meditation, journal_prompt)
   - Category
   - Estimated duration
   - Difficulty level
   - Tags

2. CONTENT:
   - Comprehensive, well-structured content
   - Practical and actionable
   - Evidence-based when applicable
   - Engaging and accessible
   - Appropriate for the target audience

Content should be:
- Therapeutically sound
- Easy to follow
- Practical and actionable
- Supportive and non-judgmental
- Scientifically grounded when applicable

Return the response in JSON format with this exact structure:
{
  "title": "Resource Title",
  "description": "Resource description",
  "content": "Full content here...",
  "type": "exercise",
  "category": "Category Name",
  "estimatedDuration": 10,
  "difficulty": "intermediate",
  "tags": ["tag1", "tag2", "tag3"]
}
`;
  }

  private buildCouplesChallengePrompt(request: AIContentGenerationRequest): string {
    return `
You are an expert relationship counselor and couples therapist specializing in relationship strengthening activities.

Create a comprehensive couples challenge based on the following requirements:

TOPIC: ${request.topic}
DESCRIPTION: ${request.description}
TARGET AUDIENCE: ${request.targetAudience}
DIFFICULTY: ${request.difficulty || 'intermediate'}
DURATION: ${request.duration || 30} minutes
ADDITIONAL INSTRUCTIONS: ${request.additionalInstructions || 'None'}

Please generate a complete couples challenge with the following structure:

1. CHALLENGE OVERVIEW:
   - Title (engaging and relationship-focused)
   - Description (2-3 sentences explaining the purpose)
   - Estimated duration
   - Difficulty level
   - Category
   - Tags

2. QUESTIONS/ACTIVITIES (6-10 items):
   For each item, provide:
   - Question/activity text
   - Type (discussion, activity, reflection, game)
   - Instructions (if needed)
   - Estimated time
   - Order number

Types should be varied and include:
- Discussion questions for deep conversation
- Activities for shared experiences
- Reflection prompts for individual insight
- Games for fun and connection

Make sure items are:
- Relationship-strengthening
- Safe and non-threatening
- Engaging and fun
- Progressive in intimacy
- Appropriate for the target audience

Return the response in JSON format with this exact structure:
{
  "title": "Challenge Title",
  "description": "Challenge description",
  "estimatedDuration": 30,
  "difficulty": "intermediate",
  "category": "Category Name",
  "tags": ["tag1", "tag2", "tag3"],
  "questions": [
    {
      "question": "Question/activity text",
      "type": "discussion",
      "instructions": "Specific instructions if needed",
      "estimatedTime": 5,
      "order": 1
    }
  ]
}
`;
  }

  private parseAssessmentResponse(content: string): Omit<GeneratedAssessment, 'id'> {
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title,
        description: parsed.description,
        questions: parsed.questions.map((q: any, index: number) => ({
          id: `q_${Date.now()}_${index}`,
          question: q.question,
          type: q.type,
          options: q.options,
          required: q.required !== false,
          order: q.order || index + 1
        })),
        estimatedDuration: parsed.estimatedDuration || 15,
        difficulty: parsed.difficulty || 'intermediate',
        tags: parsed.tags || [],
        category: parsed.category || 'General'
      };
    } catch (error) {
      console.error('Error parsing assessment response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private parseWellnessResponse(content: string): Omit<GeneratedWellnessResource, 'id'> {
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title,
        description: parsed.description,
        content: parsed.content,
        type: parsed.type || 'article',
        category: parsed.category || 'General',
        estimatedDuration: parsed.estimatedDuration || 10,
        difficulty: parsed.difficulty || 'intermediate',
        tags: parsed.tags || []
      };
    } catch (error) {
      console.error('Error parsing wellness response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private parseCouplesChallengeResponse(content: string): Omit<GeneratedCouplesChallenge, 'id'> {
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title,
        description: parsed.description,
        questions: parsed.questions.map((q: any, index: number) => ({
          id: `cq_${Date.now()}_${index}`,
          question: q.question,
          type: q.type,
          instructions: q.instructions,
          estimatedTime: q.estimatedTime || 5,
          order: q.order || index + 1
        })),
        estimatedDuration: parsed.estimatedDuration || 30,
        difficulty: parsed.difficulty || 'intermediate',
        category: parsed.category || 'General',
        tags: parsed.tags || []
      };
    } catch (error) {
      console.error('Error parsing couples challenge response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private async saveGeneratedAssessment(data: Omit<GeneratedAssessment, 'id'>, request: AIContentGenerationRequest): Promise<string> {
    const { data: assessment, error } = await supabase
      .from('assessments_enhanced')
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
        created_by: 'ai_generator'
      })
      .select('id')
      .single();

    if (error) throw error;

    // Save questions
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
        content: data.content,
        type: data.type,
        category: data.category,
        estimated_duration: data.estimatedDuration,
        difficulty: data.difficulty,
        tags: data.tags,
        ai_generated: true,
        generation_prompt: JSON.stringify(request),
        status: 'draft',
        created_by: 'ai_generator'
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
        created_by: 'ai_generator'
      })
      .select('id')
      .single();

    if (error) throw error;

    // Save questions
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

    const { data, error } = await supabase
      .from(tableMap[type])
      .select('*')
      .eq('ai_generated', true)
      .order('created_at', { ascending: false })
      .limit(limit);

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
