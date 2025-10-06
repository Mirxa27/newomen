import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AIConfiguration {
  id: string;
  name: string;
  description: string | null;
  provider: string;
  model_name: string;
  api_base_url: string | null;
  temperature: number | null;
  max_tokens: number | null;
  system_prompt: string | null;
  user_prompt_template: string | null;
  scoring_prompt_template: string | null;
  feedback_prompt_template: string | null;
  is_active: boolean | null;
}

export interface Assessment {
  id: string;
  title: string;
  description: string | null;
  assessment_type: string;
  category: string;
  difficulty_level: string | null;
  estimated_duration_minutes: number | null;
  max_attempts: number | null;
  passing_score: number | null;
  is_ai_powered: boolean | null;
  ai_configuration_id: string | null;
  questions: any;
  scoring_rubric: any | null;
  is_public: boolean | null;
  is_active: boolean | null;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty_level: string | null;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  passing_score: number | null;
  is_ai_powered: boolean | null;
  ai_configuration_id: string | null;
  questions: any;
  ai_grading_prompt: string | null;
  is_public: boolean | null;
  is_active: boolean | null;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  category: string;
  difficulty_level: string | null;
  duration_days: number | null;
  max_participants: number | null;
  is_ai_powered: boolean | null;
  ai_configuration_id: string | null;
  instructions: string;
  success_criteria: any | null;
  ai_evaluation_prompt: string | null;
  reward_crystals: number | null;
  is_public: boolean | null;
  is_active: boolean | null;
  start_date: string | null;
  end_date: string | null;
}

export interface AIProcessingResult {
  success: boolean;
  score?: number;
  percentage_score?: number;
  feedback?: string;
  insights?: any;
  recommendations?: string;
  personality_traits?: any;
  strengths_identified?: any;
  areas_for_improvement?: any;
  detailed_explanations?: any;
  processing_time_ms?: number;
  ai_model_used?: string;
  error_message?: string;
}

export interface AIUsageLog {
  configuration_id: string | null;
  user_id: string | null;
  content_type: string;
  content_id: string | null;
  api_provider: string | null;
  model_name: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  processing_time_ms: number | null;
  cost_usd: number | null;
  success: boolean | null;
  error_message: string | null;
  request_payload: any | null;
  response_data: any | null;
}

class AIAssessmentService {
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // AI Configuration Management
  async getAIConfigurations(): Promise<AIConfiguration[]> {
    try {
      const { data, error } = await supabase
        .from("ai_configurations")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching AI configurations:", error);
      return [];
    }
  }

  async getAIConfiguration(id: string): Promise<AIConfiguration | null> {
    try {
      const { data, error } = await supabase
        .from("ai_configurations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching AI configuration:", error);
      return null;
    }
  }

  async createAIConfiguration(config: Partial<AIConfiguration>): Promise<AIConfiguration | null> {
    try {
      // Ensure required fields are present
      if (!config.name || !config.provider || !config.model_name) {
        throw new Error("Missing required fields: name, provider, model_name");
      }
      
      const { data, error } = await supabase
        .from("ai_configurations")
        .insert(config as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating AI configuration:", error);
      toast.error("Failed to create AI configuration");
      return null;
    }
  }

  async updateAIConfiguration(id: string, updates: Partial<AIConfiguration>): Promise<AIConfiguration | null> {
    try {
      const { data, error } = await supabase
        .from("ai_configurations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating AI configuration:", error);
      toast.error("Failed to update AI configuration");
      return null;
    }
  }

  async deleteAIConfiguration(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("ai_configurations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting AI configuration:", error);
      toast.error("Failed to delete AI configuration");
      return false;
    }
  }

  // Assessment Processing
  async processAssessmentWithAI(
    assessmentId: string,
    userId: string,
    answers: Record<string, any>
  ): Promise<AIProcessingResult> {
    const startTime = Date.now();
    let configuration: AIConfiguration | null = null;
    let assessment: Assessment | null = null;

    try {
      // Get assessment and AI configuration
      assessment = await this.getAssessment(assessmentId);
      if (!assessment || !assessment.is_ai_powered) {
        throw new Error("Assessment not found or AI not enabled");
      }

      if (assessment.ai_configuration_id) {
        configuration = await this.getAIConfiguration(assessment.ai_configuration_id);
      }

      if (!configuration) {
        // Use default configuration
        const configs = await this.getAIConfigurations();
        configuration = configs.find(c => c.provider === "openai") || configs[0];
      }

      if (!configuration) {
        throw new Error("No AI configuration available");
      }

      // Prepare the prompt
      const prompt = this.buildAssessmentPrompt(assessment, answers, configuration);

      // Call AI API
      const aiResponse = await this.callAIAPI(prompt, configuration);

      // Parse AI response
      const result = this.parseAIResponse(aiResponse, "assessment");

      const processingTime = Date.now() - startTime;

      // Log usage
      await this.logAIUsage({
        configuration_id: configuration.id,
        user_id: userId,
        content_type: "assessment",
        content_id: assessmentId,
        api_provider: configuration.provider,
        model_name: configuration.model_name,
        processing_time_ms: processingTime,
        success: true,
        request_payload: prompt,
        response_data: aiResponse
      });

      return {
        ...result,
        processing_time_ms: processingTime,
        ai_model_used: configuration.model_name
      };

    } catch (error) {
      console.error("Error processing assessment with AI:", error);
      
      const processingTime = Date.now() - startTime;

      // Log failed usage
      if (configuration) {
        await this.logAIUsage({
          configuration_id: configuration?.id || null,
          user_id: userId,
          content_type: "assessment",
          content_id: assessmentId,
          api_provider: configuration?.provider || null,
          model_name: configuration?.model_name || null,
          processing_time_ms: processingTime,
          success: false,
          error_message: error instanceof Error ? error.message : "Unknown error"
        });
      }

      return {
        success: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
        processing_time_ms: processingTime
      };
    }
  }

  // Quiz Processing
  async processQuizWithAI(
    quizId: string,
    userId: string,
    answers: Record<string, any>,
    timeTakenSeconds?: number
  ): Promise<AIProcessingResult> {
    const startTime = Date.now();
    let configuration: AIConfiguration | null = null;
    let quiz: Quiz | null = null;

    try {
      // Get quiz and AI configuration
      quiz = await this.getQuiz(quizId);
      if (!quiz || !quiz.is_ai_powered) {
        throw new Error("Quiz not found or AI not enabled");
      }

      if (quiz.ai_configuration_id) {
        configuration = await this.getAIConfiguration(quiz.ai_configuration_id);
      }

      if (!configuration) {
        const configs = await this.getAIConfigurations();
        configuration = configs.find(c => c.provider === "openai") || configs[0];
      }

      if (!configuration) {
        throw new Error("No AI configuration available");
      }

      // Prepare the prompt
      const prompt = this.buildQuizPrompt(quiz, answers, timeTakenSeconds, configuration);

      // Call AI API
      const aiResponse = await this.callAIAPI(prompt, configuration);

      // Parse AI response
      const result = this.parseAIResponse(aiResponse, "quiz");

      const processingTime = Date.now() - startTime;

      // Log usage
      await this.logAIUsage({
        configuration_id: configuration.id,
        user_id: userId,
        content_type: "quiz",
        content_id: quizId,
        api_provider: configuration.provider,
        model_name: configuration.model_name,
        processing_time_ms: processingTime,
        success: true,
        request_payload: prompt,
        response_data: aiResponse
      });

      return {
        ...result,
        processing_time_ms: processingTime,
        ai_model_used: configuration.model_name
      };

    } catch (error) {
      console.error("Error processing quiz with AI:", error);
      
      const processingTime = Date.now() - startTime;

      // Log failed usage
      if (configuration) {
        await this.logAIUsage({
          configuration_id: configuration?.id || null,
          user_id: userId,
          content_type: "quiz",
          content_id: quizId,
          api_provider: configuration?.provider || null,
          model_name: configuration?.model_name || null,
          processing_time_ms: processingTime,
          success: false,
          error_message: error instanceof Error ? error.message : "Unknown error"
        });
      }

      return {
        success: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
        processing_time_ms: processingTime
      };
    }
  }

  // Challenge Processing
  async processChallengeWithAI(
    challengeId: string,
    userId: string,
    progressData: any
  ): Promise<AIProcessingResult> {
    const startTime = Date.now();
    let configuration: AIConfiguration | null = null;
    let challenge: Challenge | null = null;

    try {
      // Get challenge and AI configuration
      challenge = await this.getChallenge(challengeId);
      if (!challenge || !challenge.is_ai_powered) {
        throw new Error("Challenge not found or AI not enabled");
      }

      if (challenge.ai_configuration_id) {
        configuration = await this.getAIConfiguration(challenge.ai_configuration_id);
      }

      if (!configuration) {
        const configs = await this.getAIConfigurations();
        configuration = configs.find(c => c.provider === "anthropic") || configs[0];
      }

      if (!configuration) {
        throw new Error("No AI configuration available");
      }

      // Prepare the prompt
      const prompt = this.buildChallengePrompt(challenge, progressData, configuration);

      // Call AI API
      const aiResponse = await this.callAIAPI(prompt, configuration);

      // Parse AI response
      const result = this.parseAIResponse(aiResponse, "challenge");

      const processingTime = Date.now() - startTime;

      // Log usage
      await this.logAIUsage({
        configuration_id: configuration.id,
        user_id: userId,
        content_type: "challenge",
        content_id: challengeId,
        api_provider: configuration.provider,
        model_name: configuration.model_name,
        processing_time_ms: processingTime,
        success: true,
        request_payload: prompt,
        response_data: aiResponse
      });

      return {
        ...result,
        processing_time_ms: processingTime,
        ai_model_used: configuration.model_name
      };

    } catch (error) {
      console.error("Error processing challenge with AI:", error);
      
      const processingTime = Date.now() - startTime;

      // Log failed usage
      if (configuration) {
        await this.logAIUsage({
          configuration_id: configuration?.id || null,
          user_id: userId,
          content_type: "challenge",
          content_id: challengeId,
          api_provider: configuration?.provider || null,
          model_name: configuration?.model_name || null,
          processing_time_ms: processingTime,
          success: false,
          error_message: error instanceof Error ? error.message : "Unknown error"
        });
      }

      return {
        success: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
        processing_time_ms: processingTime
      };
    }
  }

  // Helper methods
  private async getAssessment(id: string): Promise<Assessment | null> {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching assessment:", error);
      return null;
    }
  }

  private async getQuiz(id: string): Promise<Quiz | null> {
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching quiz:", error);
      return null;
    }
  }

  private async getChallenge(id: string): Promise<Challenge | null> {
    try {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching challenge:", error);
      return null;
    }
  }

  private buildAssessmentPrompt(
    assessment: Assessment,
    answers: Record<string, any>,
    config: AIConfiguration
  ): any {
    const basePrompt = config.user_prompt_template || config.scoring_prompt_template || 
      "Analyze the following assessment responses and provide detailed feedback.";

    return {
      model: config.model_name,
      messages: [
        {
          role: "system",
          content: config.system_prompt || "You are an expert assessment evaluator providing detailed psychological insights."
        },
        {
          role: "user",
          content: `${basePrompt}

Assessment: ${assessment.title}
Type: ${assessment.assessment_type}
Category: ${assessment.category}
Difficulty: ${assessment.difficulty_level}

Questions and Answers:
${JSON.stringify(assessment.questions, null, 2)}

User Responses:
${JSON.stringify(answers, null, 2)}

Please provide:
1. A numerical score (0-100)
2. Detailed feedback on the responses
3. Key insights about the user
4. Personalized recommendations
5. Strengths identified
6. Areas for improvement

Respond in JSON format with the following structure:
{
  "score": number,
  "feedback": "string",
  "insights": {},
  "recommendations": "string",
  "strengths_identified": [],
  "areas_for_improvement": [],
  "personality_traits": {}
}`
        }
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 1500
    };
  }

  private buildQuizPrompt(
    quiz: Quiz,
    answers: Record<string, any>,
    timeTakenSeconds: number | undefined,
    config: AIConfiguration
  ): any {
    const basePrompt = config.user_prompt_template || quiz.ai_grading_prompt || 
      "Grade the following quiz and provide detailed explanations.";

    return {
      model: config.model_name,
      messages: [
        {
          role: "system",
          content: config.system_prompt || "You are an expert quiz grader providing accurate scoring and explanations."
        },
        {
          role: "user",
          content: `${basePrompt}

Quiz: ${quiz.title}
Category: ${quiz.category}
Difficulty: ${quiz.difficulty_level}
Time Taken: ${timeTakenSeconds ? `${timeTakenSeconds} seconds` : "Not recorded"}

Questions and Answers:
${JSON.stringify(quiz.questions, null, 2)}

User Responses:
${JSON.stringify(answers, null, 2)}

Please provide:
1. A numerical score (0-100)
2. Maximum possible score
3. Detailed feedback on each answer
4. Explanations for correct/incorrect answers
5. Overall assessment

Respond in JSON format with the following structure:
{
  "score": number,
  "max_score": number,
  "percentage_score": number,
  "feedback": "string",
  "detailed_explanations": {},
  "is_passed": boolean
}`
        }
      ],
      temperature: config.temperature || 0.3,
      max_tokens: config.max_tokens || 1000
    };
  }

  private buildChallengePrompt(
    challenge: Challenge,
    progressData: any,
    config: AIConfiguration
  ): any {
    const basePrompt = config.user_prompt_template || challenge.ai_evaluation_prompt || 
      "Evaluate challenge progress and provide coaching feedback.";

    return {
      model: config.model_name,
      messages: [
        {
          role: "system",
          content: config.system_prompt || "You are an encouraging life coach providing motivational feedback."
        },
        {
          role: "user",
          content: `${basePrompt}

Challenge: ${challenge.title}
Type: ${challenge.challenge_type}
Category: ${challenge.category}
Difficulty: ${challenge.difficulty_level}

Instructions: ${challenge.instructions}

Success Criteria:
${JSON.stringify(challenge.success_criteria, null, 2)}

Progress Data:
${JSON.stringify(progressData, null, 2)}

Please provide:
1. Evaluation of current progress
2. Motivational coaching message
3. Specific recommendations for improvement
4. Recognition of achievements
5. Next steps suggestions

Respond in JSON format with the following structure:
{
  "feedback": "string",
  "insights": {},
  "recommendations": "string",
  "motivational_message": "string",
  "next_steps": []
}`
        }
      ],
      temperature: config.temperature || 0.8,
      max_tokens: config.max_tokens || 1200
    };
  }

  private async callAIAPI(prompt: any, config: AIConfiguration): Promise<any> {
    const apiKey = this.getAPIKey(config.provider);
    if (!apiKey) {
      throw new Error(`No API key configured for provider: ${config.provider}`);
    }

    const apiUrl = config.api_base_url || this.getDefaultAPIUrl(config.provider);
    
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(prompt)
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private getAPIKey(provider: string): string | null {
    // In a real implementation, these would be stored securely
    switch (provider) {
      case "openai":
        return process.env.VITE_OPENAI_API_KEY || null;
      case "anthropic":
        return process.env.VITE_ANTHROPIC_API_KEY || null;
      case "google":
        return process.env.VITE_GOOGLE_AI_API_KEY || null;
      default:
        return null;
    }
  }

  private getDefaultAPIUrl(provider: string): string {
    switch (provider) {
      case "openai":
        return "https://api.openai.com/v1";
      case "anthropic":
        return "https://api.anthropic.com/v1";
      case "google":
        return "https://generativelanguage.googleapis.com/v1";
      default:
        return "https://api.openai.com/v1";
    }
  }

  private parseAIResponse(response: any, type: string): AIProcessingResult {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content in AI response");
      }

      // Try to parse as JSON
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        // If not JSON, create a basic response
        parsed = {
          feedback: content,
          score: type === "quiz" ? 75 : 80
        };
      }

      return {
        success: true,
        score: parsed.score || parsed.percentage_score,
        percentage_score: parsed.percentage_score || parsed.score,
        feedback: parsed.feedback,
        insights: parsed.insights,
        recommendations: parsed.recommendations,
        personality_traits: parsed.personality_traits,
        strengths_identified: parsed.strengths_identified,
        areas_for_improvement: parsed.areas_for_improvement,
        detailed_explanations: parsed.detailed_explanations
      };

    } catch (error) {
      console.error("Error parsing AI response:", error);
      return {
        success: false,
        error_message: "Failed to parse AI response"
      };
    }
  }

  private async logAIUsage(log: Partial<AIUsageLog>): Promise<void> {
    try {
      // Ensure required fields are present
      if (!log.api_provider || !log.model_name) {
        console.warn("Missing required fields for AI usage log");
        return;
      }
      
      await supabase
        .from("ai_usage_logs")
        .insert({
          ...log,
          created_at: new Date().toISOString()
        } as any);
    } catch (error) {
      console.error("Error logging AI usage:", error);
    }
  }

  // Content Management
  async getAssessments(filters?: {
    category?: string;
    difficulty?: string;
    is_public?: boolean;
  }): Promise<Assessment[]> {
    try {
      let query = supabase
        .from("assessments")
        .select("*")
        .eq("is_active", true);

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.difficulty) {
        query = query.eq("difficulty_level", filters.difficulty);
      }
      if (filters?.is_public !== undefined) {
        query = query.eq("is_public", filters.is_public);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching assessments:", error);
      return [];
    }
  }

  async getQuizzes(filters?: {
    category?: string;
    difficulty?: string;
    is_public?: boolean;
  }): Promise<Quiz[]> {
    try {
      let query = supabase
        .from("quizzes")
        .select("*")
        .eq("is_active", true);

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.difficulty) {
        query = query.eq("difficulty_level", filters.difficulty);
      }
      if (filters?.is_public !== undefined) {
        query = query.eq("is_public", filters.is_public);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      return [];
    }
  }

  async getChallenges(filters?: {
    category?: string;
    type?: string;
    difficulty?: string;
    is_public?: boolean;
  }): Promise<Challenge[]> {
    try {
      let query = supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true);

      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.type) {
        query = query.eq("challenge_type", filters.type);
      }
      if (filters?.difficulty) {
        query = query.eq("difficulty_level", filters.difficulty);
      }
      if (filters?.is_public !== undefined) {
        query = query.eq("is_public", filters.is_public);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching challenges:", error);
      return [];
    }
  }
}

export const aiAssessmentService = new AIAssessmentService();
