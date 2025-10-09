import { z } from 'zod';

// Base validation schemas
export const idSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const timestampSchema = z.string().datetime();

// User schemas
export const userProfileSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  nickname: z.string().min(1).max(50),
  role: z.enum(['user', 'admin', 'superadmin', 'moderator']),
  subscription_tier: z.enum(['discovery', 'growth', 'transformation', 'enterprise']),
  remaining_minutes: z.number().int().min(0),
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

// AI Configuration schemas
export const aiConfigurationSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(100),
  provider: z.enum(['openai', 'anthropic', 'google', 'azure', 'custom', 'elevenlabs', 'cartesia', 'deepgram', 'hume', 'zai']),
  model: z.string().min(1).max(100),
  api_base_url: urlSchema.optional(),
  api_version: z.string().optional(),
  temperature: z.number().min(0).max(2),
  max_tokens: z.number().int().min(1).max(128000),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  system_prompt: z.string().max(10000).optional(),
  is_active: z.boolean(),
  is_default: z.boolean(),
  cost_per_1k_prompt_tokens: z.number().min(0).optional(),
  cost_per_1k_completion_tokens: z.number().min(0).optional(),
});

// Assessment schemas
export const assessmentSchema = z.object({
  id: idSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  type: z.enum(['personality', 'emotional_intelligence', 'stress', 'relationship', 'career', 'wellness']),
  category: z.string().min(1).max(50),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  time_limit_minutes: z.number().int().min(1).max(180).optional(),
  max_attempts: z.number().int().min(1).max(10).optional(),
  is_public: z.boolean(),
  is_active: z.boolean(),
  status: z.enum(['draft', 'published', 'archived']),
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum(['multiple_choice', 'text', 'scale', 'boolean']),
    question: z.string().min(1).max(1000),
    options: z.array(z.string()).optional(),
    required: z.boolean(),
    validation: z.object({
      min_length: z.number().int().min(0).optional(),
      max_length: z.number().int().min(1).optional(),
      pattern: z.string().optional(),
    }).optional(),
  })),
  scoring_logic: z.object({
    type: z.enum(['sum', 'average', 'weighted']),
    weights: z.record(z.number()).optional(),
    passing_score: z.number().min(0).max(100).optional(),
  }).optional(),
  outcome_descriptions: z.record(z.string()).optional(),
});

// Assessment attempt schemas
export const assessmentAttemptSchema = z.object({
  id: idSchema,
  assessment_id: idSchema,
  user_id: idSchema,
  attempt_number: z.number().int().min(1),
  status: z.enum(['in_progress', 'completed', 'abandoned']),
  started_at: timestampSchema,
  completed_at: timestampSchema.optional(),
  raw_responses: z.record(z.unknown()),
  ai_score: z.number().min(0).max(100).optional(),
  ai_feedback: z.string().max(5000).optional(),
});

// Real-time chat schemas
export const realtimeChatSchema = z.object({
  agentId: idSchema.optional(),
  userId: idSchema,
  systemPrompt: z.string().max(10000).optional(),
  memoryContext: z.string().max(5000).optional(),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'merin']).optional(),
  model: z.string().min(1).max(100).optional(),
  modalities: z.array(z.enum(['audio', 'text'])).optional(),
});

// Subscription schemas
export const subscriptionSchema = z.object({
  id: idSchema,
  user_id: idSchema,
  status: z.enum(['active', 'trialing', 'past_due', 'cancelled', 'expired']),
  tier: z.enum(['discovery', 'growth', 'transformation', 'enterprise']),
  renewal_date: timestampSchema.optional(),
  cancelled_at: timestampSchema.optional(),
  minutes_included: z.number().int().min(0).optional(),
  minutes_used: z.number().int().min(0).optional(),
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

// API response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }).optional(),
  metadata: z.object({
    timestamp: timestampSchema,
    request_id: z.string().optional(),
    version: z.string().optional(),
  }).optional(),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Search schemas
export const searchSchema = z.object({
  query: z.string().min(1).max(200).optional(),
  filters: z.record(z.unknown()).optional(),
  pagination: paginationSchema.optional(),
});

// Error schemas
export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
  stack: z.string().optional(),
  timestamp: timestampSchema,
  request_id: z.string().optional(),
  user_id: idSchema.optional(),
});

// Validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      throw new ValidationError('Validation failed', errorMessages);
    }
    throw error;
  }
}

export function validatePartial<T extends z.ZodRawShape>(schema: z.ZodObject<T>, data: unknown): Partial<z.infer<typeof schema>> {
  try {
    return schema.partial().parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      throw new ValidationError('Partial validation failed', errorMessages);
    }
    throw error;
  }
}

// Custom validation error
export class ValidationError extends Error {
  constructor(
    message: string,
    public details: unknown,
    public code = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Sanitization schemas
export const sanitizedStringSchema = z.string().transform((val) => {
  // Remove potential XSS payloads
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
});

export const sanitizedHtmlSchema = z.string().transform((val) => {
  // Basic HTML sanitization - allow only safe tags
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
});