// AI Service and Assessment Types

export interface AssessmentAnswer {
  question_id: string;
  answer: string | number | boolean | string[];
  question_text?: string;
  answer_text?: string;
}

export interface AssessmentAnswers {
  [questionId: string]: string | number | boolean | string[];
}

export interface QuizAnswers {
  [questionId: string]: string | number | boolean | string[];
}

export interface ProgressData {
  [key: string]: string | number | boolean | Date | object;
}

export interface AIVariables {
  [key: string]: string | number | boolean | object;
}

export interface CacheData {
  [key: string]: unknown;
}

export interface AIResponseData {
  response?: string;
  analysis?: string;
  recommendations?: string[];
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface ProviderConfiguration {
  api_key: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  [key: string]: unknown;
}

export interface AIConfiguration {
  id: string;
  provider: string;
  model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  use_case_id: string;
  is_active: boolean;
  configuration: ProviderConfiguration;
}

export interface AssessmentResponseData {
  raw_feedback: string;
  score: number;
  traits: string[];
  strengths: string[];
  improvements: string[];
}

export interface QuizResponseData {
  raw_feedback: string;
  score: number;
  explanations: string[];
}
