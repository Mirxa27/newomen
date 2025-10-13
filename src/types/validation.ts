// Comprehensive DTOs and validation for Newomen platform
import { z } from 'zod';

// Base validation schemas
export const BaseValidation = {
  id: z.string().uuid(),
  email: z.string().email().min(1).max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  text: z.string().min(1).max(10000),
  url: z.string().url(),
  timestamp: z.string().datetime(),
  positiveInt: z.number().int().positive(),
  nonNegativeInt: z.number().int().min(0),
  score: z.number().min(0).max(100),
  boolean: z.boolean(),
  optionalString: z.string().optional(),
  optionalNumber: z.number().optional(),
  optionalBoolean: z.boolean().optional(),
};

// User DTOs
export const UserCreateDTO = z.object({
  email: BaseValidation.email,
  password: BaseValidation.password,
  full_name: BaseValidation.name,
  nickname: BaseValidation.optionalString,
  avatar_url: BaseValidation.optionalString,
  timezone: BaseValidation.optionalString,
  language: BaseValidation.optionalString,
});

export const UserUpdateDTO = z.object({
  full_name: BaseValidation.optionalString,
  nickname: BaseValidation.optionalString,
  avatar_url: BaseValidation.optionalString,
  timezone: BaseValidation.optionalString,
  language: BaseValidation.optionalString,
  bio: BaseValidation.optionalString,
  website: BaseValidation.optionalString,
});

export const UserProfileDTO = z.object({
  id: BaseValidation.id,
  email: BaseValidation.email,
  full_name: BaseValidation.name,
  nickname: BaseValidation.optionalString,
  avatar_url: BaseValidation.optionalString,
  bio: BaseValidation.optionalString,
  website: BaseValidation.optionalString,
  timezone: BaseValidation.optionalString,
  language: BaseValidation.optionalString,
  created_at: BaseValidation.timestamp,
  updated_at: BaseValidation.timestamp,
  is_premium: BaseValidation.boolean,
  subscription_status: BaseValidation.optionalString,
});

// Assessment DTOs
export const AssessmentQuestionDTO = z.object({
  id: BaseValidation.id,
  type: z.enum(['multiple_choice', 'text', 'rating', 'boolean', 'slider']),
  question: BaseValidation.text,
  options: z.array(z.string()).optional(),
  required: BaseValidation.boolean,
  order: BaseValidation.positiveInt,
  weight: BaseValidation.optionalNumber,
});

export const AssessmentCreateDTO = z.object({
  title: BaseValidation.name,
  description: BaseValidation.text,
  type: z.enum(['personality', 'emotional_intelligence', 'communication', 'leadership', 'custom']),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  time_limit_minutes: BaseValidation.positiveInt,
  questions: z.array(AssessmentQuestionDTO).min(1).max(50),
  ai_config_id: BaseValidation.optionalString,
  is_public: BaseValidation.boolean,
  tags: z.array(z.string()).optional(),
});

export const AssessmentAttemptDTO = z.object({
  id: BaseValidation.id,
  assessment_id: BaseValidation.id,
  user_id: BaseValidation.id,
  attempt_number: BaseValidation.positiveInt,
  started_at: BaseValidation.timestamp,
  completed_at: BaseValidation.optionalString,
  status: z.enum(['in_progress', 'completed', 'abandoned']),
  time_spent_minutes: BaseValidation.nonNegativeInt,
  raw_responses: z.record(z.any()),
});

export const AssessmentResponseDTO = z.object({
  question_id: BaseValidation.id,
  response: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
  time_spent_seconds: BaseValidation.nonNegativeInt,
});

export const AIAnalysisResultDTO = z.object({
  score: BaseValidation.score,
  feedback: BaseValidation.text,
  explanation: BaseValidation.text,
  insights: z.array(BaseValidation.text),
  recommendations: z.array(BaseValidation.text),
  strengths: z.array(BaseValidation.text),
  areas_for_improvement: z.array(BaseValidation.text),
  personality_traits: z.record(z.number()).optional(),
  emotional_patterns: z.array(BaseValidation.text).optional(),
  communication_style: BaseValidation.optionalString,
  leadership_potential: BaseValidation.optionalNumber,
});

// AI Provider DTOs
export const AIProviderCreateDTO = z.object({
  name: BaseValidation.name,
  type: z.enum(['openai', 'anthropic', 'google', 'zai', 'custom']),
  api_key: BaseValidation.text,
  api_base: BaseValidation.optionalString,
  region: BaseValidation.optionalString,
  is_active: BaseValidation.boolean,
  rate_limit: BaseValidation.optionalNumber,
  cost_per_token: BaseValidation.optionalNumber,
});

export const AIModelDTO = z.object({
  id: BaseValidation.id,
  provider_id: BaseValidation.id,
  model_id: BaseValidation.name,
  display_name: BaseValidation.name,
  modality: z.enum(['text', 'audio', 'image', 'video']),
  context_limit: BaseValidation.optionalNumber,
  latency_hint_ms: BaseValidation.optionalNumber,
  is_realtime: BaseValidation.boolean,
  enabled: BaseValidation.boolean,
  cost_per_token: BaseValidation.optionalNumber,
});

export const AIVoiceDTO = z.object({
  id: BaseValidation.id,
  provider_id: BaseValidation.id,
  voice_id: BaseValidation.name,
  name: BaseValidation.name,
  locale: BaseValidation.optionalString,
  gender: BaseValidation.optionalString,
  latency_hint_ms: BaseValidation.optionalNumber,
  enabled: BaseValidation.boolean,
});

// Community DTOs
export const CommunityPostCreateDTO = z.object({
  title: BaseValidation.name,
  content: BaseValidation.text,
  category: z.enum(['general', 'assessment', 'wellness', 'challenge', 'support']),
  tags: z.array(z.string()).optional(),
  is_anonymous: BaseValidation.boolean,
  allow_comments: BaseValidation.boolean,
});

export const CommunityPostDTO = z.object({
  id: BaseValidation.id,
  user_id: BaseValidation.id,
  title: BaseValidation.name,
  content: BaseValidation.text,
  category: z.enum(['general', 'assessment', 'wellness', 'challenge', 'support']),
  tags: z.array(z.string()),
  is_anonymous: BaseValidation.boolean,
  allow_comments: BaseValidation.boolean,
  likes_count: BaseValidation.nonNegativeInt,
  comments_count: BaseValidation.nonNegativeInt,
  created_at: BaseValidation.timestamp,
  updated_at: BaseValidation.timestamp,
  author: z.object({
    id: BaseValidation.id,
    full_name: BaseValidation.name,
    nickname: BaseValidation.optionalString,
    avatar_url: BaseValidation.optionalString,
  }),
});

export const CommunityCommentCreateDTO = z.object({
  post_id: BaseValidation.id,
  content: BaseValidation.text,
  parent_comment_id: BaseValidation.optionalString,
});

export const CommunityCommentDTO = z.object({
  id: BaseValidation.id,
  post_id: BaseValidation.id,
  user_id: BaseValidation.id,
  content: BaseValidation.text,
  parent_comment_id: BaseValidation.optionalString,
  likes_count: BaseValidation.nonNegativeInt,
  created_at: BaseValidation.timestamp,
  updated_at: BaseValidation.timestamp,
  author: z.object({
    id: BaseValidation.id,
    full_name: BaseValidation.name,
    nickname: BaseValidation.optionalString,
    avatar_url: BaseValidation.optionalString,
  }),
});

// Gamification DTOs
export const GamificationEventDTO = z.object({
  event_type: z.enum(['daily_login', 'assessment_complete', 'challenge_complete', 'community_post', 'streak_milestone']),
  user_id: BaseValidation.id,
  metadata: z.record(z.any()).optional(),
});

export const CrystalTransactionDTO = z.object({
  id: BaseValidation.id,
  user_id: BaseValidation.id,
  amount: z.number().int(),
  source: z.enum(['daily_login', 'assessment_complete', 'challenge_complete', 'community_post', 'purchase', 'bonus']),
  description: BaseValidation.text,
  created_at: BaseValidation.timestamp,
});

export const AchievementDTO = z.object({
  id: BaseValidation.id,
  user_id: BaseValidation.id,
  achievement_type: z.enum(['streak', 'assessment', 'community', 'challenge', 'special']),
  title: BaseValidation.name,
  description: BaseValidation.text,
  icon_url: BaseValidation.optionalString,
  unlocked_at: BaseValidation.timestamp,
});

// Payment DTOs
export const PaymentCreateDTO = z.object({
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  description: BaseValidation.text,
  user_id: BaseValidation.id,
  subscription_type: z.enum(['monthly', 'yearly', 'lifetime']),
});

export const PaymentDTO = z.object({
  id: BaseValidation.id,
  user_id: BaseValidation.id,
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']),
  payment_method: z.enum(['paypal', 'stripe', 'apple_pay', 'google_pay']),
  transaction_id: BaseValidation.optionalString,
  created_at: BaseValidation.timestamp,
  completed_at: BaseValidation.optionalString,
});

// Chat DTOs
export const ChatMessageCreateDTO = z.object({
  content: BaseValidation.text,
  message_type: z.enum(['text', 'audio', 'image', 'system']),
  conversation_id: BaseValidation.optionalString,
  parent_message_id: BaseValidation.optionalString,
  metadata: z.record(z.any()).optional(),
});

export const ChatMessageDTO = z.object({
  id: BaseValidation.id,
  user_id: BaseValidation.id,
  content: BaseValidation.text,
  message_type: z.enum(['text', 'audio', 'image', 'system']),
  conversation_id: BaseValidation.id,
  parent_message_id: BaseValidation.optionalString,
  metadata: z.record(z.any()),
  created_at: BaseValidation.timestamp,
  updated_at: BaseValidation.timestamp,
  author: z.object({
    id: BaseValidation.id,
    full_name: BaseValidation.name,
    nickname: BaseValidation.optionalString,
    avatar_url: BaseValidation.optionalString,
  }),
});

// Wellness DTOs
export const WellnessResourceCreateDTO = z.object({
  title: BaseValidation.name,
  content: BaseValidation.text,
  category: z.enum(['article', 'exercise', 'meditation', 'breathing', 'journaling']),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_minutes: BaseValidation.positiveInt,
  tags: z.array(z.string()).optional(),
  is_public: BaseValidation.boolean,
});

export const WellnessResourceDTO = z.object({
  id: BaseValidation.id,
  title: BaseValidation.name,
  content: BaseValidation.text,
  category: z.enum(['article', 'exercise', 'meditation', 'breathing', 'journaling']),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  duration_minutes: BaseValidation.positiveInt,
  tags: z.array(z.string()),
  is_public: BaseValidation.boolean,
  created_at: BaseValidation.timestamp,
  updated_at: BaseValidation.timestamp,
  author: z.object({
    id: BaseValidation.id,
    full_name: BaseValidation.name,
    nickname: BaseValidation.optionalString,
    avatar_url: BaseValidation.optionalString,
  }),
});

// API Response DTOs
export const APIResponseDTO = z.object({
  success: BaseValidation.boolean,
  data: z.any().optional(),
  error: BaseValidation.optionalString,
  message: BaseValidation.optionalString,
  timestamp: BaseValidation.timestamp,
});

export const PaginatedResponseDTO = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: BaseValidation.positiveInt,
    limit: BaseValidation.positiveInt,
    total: BaseValidation.nonNegativeInt,
    total_pages: BaseValidation.nonNegativeInt,
    has_next: BaseValidation.boolean,
    has_prev: BaseValidation.boolean,
  }),
});

// Error DTOs
export const ValidationErrorDTO = z.object({
  field: BaseValidation.name,
  message: BaseValidation.text,
  code: BaseValidation.optionalString,
});

export const APIErrorDTO = z.object({
  code: BaseValidation.name,
  message: BaseValidation.text,
  details: z.array(ValidationErrorDTO).optional(),
  timestamp: BaseValidation.timestamp,
  request_id: BaseValidation.optionalString,
});

// Type exports
export type UserCreate = z.infer<typeof UserCreateDTO>;
export type UserUpdate = z.infer<typeof UserUpdateDTO>;
export type UserProfile = z.infer<typeof UserProfileDTO>;
export type AssessmentCreate = z.infer<typeof AssessmentCreateDTO>;
export type AssessmentAttempt = z.infer<typeof AssessmentAttemptDTO>;
export type AssessmentResponse = z.infer<typeof AssessmentResponseDTO>;
export type AIAnalysisResult = z.infer<typeof AIAnalysisResultDTO>;
export type AIProviderCreate = z.infer<typeof AIProviderCreateDTO>;
export type AIModel = z.infer<typeof AIModelDTO>;
export type AIVoice = z.infer<typeof AIVoiceDTO>;
export type CommunityPostCreate = z.infer<typeof CommunityPostCreateDTO>;
export type CommunityPost = z.infer<typeof CommunityPostDTO>;
export type CommunityCommentCreate = z.infer<typeof CommunityCommentCreateDTO>;
export type CommunityComment = z.infer<typeof CommunityCommentDTO>;
export type GamificationEvent = z.infer<typeof GamificationEventDTO>;
export type CrystalTransaction = z.infer<typeof CrystalTransactionDTO>;
export type Achievement = z.infer<typeof AchievementDTO>;
export type PaymentCreate = z.infer<typeof PaymentCreateDTO>;
export type Payment = z.infer<typeof PaymentDTO>;
export type ChatMessageCreate = z.infer<typeof ChatMessageCreateDTO>;
export type ChatMessage = z.infer<typeof ChatMessageDTO>;
export type WellnessResourceCreate = z.infer<typeof WellnessResourceCreateDTO>;
export type WellnessResource = z.infer<typeof WellnessResourceDTO>;
export type APIResponse = z.infer<typeof APIResponseDTO>;
export type PaginatedResponse = z.infer<typeof PaginatedResponseDTO>;
export type ValidationError = z.infer<typeof ValidationErrorDTO>;
export type APIError = z.infer<typeof APIErrorDTO>;
