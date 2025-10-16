import { logger } from '@/lib/logging';
import { RateLimitError } from '@/lib/errors';

// Rate limiter configuration
export interface RateLimiterConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  store?: RateLimitStore;
  onLimitReached?: (key: string, rateLimitInfo: RateLimitInfo) => void;
}

// Rate limit information
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

// Rate limit store interface
export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitStoreResult>;
  decrement(key: string): Promise<void>;
  reset(key: string): Promise<void>;
  resetAll(): Promise<void>;
}

// Rate limit store result
export interface RateLimitStoreResult {
  total: number;
  remaining: number;
  reset: Date;
}

// Memory-based rate limit store
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async increment(key: string, windowMs: number): Promise<RateLimitStoreResult> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const existing = this.store.get(key);

    if (!existing || existing.resetTime <= now) {
      // New window or expired window
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      
      return {
        total: 1,
        remaining: 0, // Will be calculated by rate limiter
        reset: new Date(resetTime),
      };
    }

    // Existing window
    existing.count++;
    return {
      total: existing.count,
      remaining: 0,
      reset: new Date(existing.resetTime),
    };
  }

  async decrement(key: string): Promise<void> {
    const existing = this.store.get(key);
    if (existing && existing.count > 0) {
      existing.count--;
      if (existing.count === 0) {
        this.store.delete(key);
      }
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async resetAll(): Promise<void> {
    this.store.clear();
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.store) {
      if (data.resetTime <= now) {
        this.store.delete(key);
      }
    }
  }
}

// Redis-based rate limit store (for distributed systems)
export class RedisRateLimitStore implements RateLimitStore {
  private redis: { 
    pipeline: () => {
      zremrangebyscore: (key: string, min: number, max: number) => void;
      zadd: (key: string, score: number, member: string) => void;
      expire: (key: string, seconds: number) => void;
      zcard: (key: string) => void;
      exec: () => Promise<[Error | null, number][]>;
    };
    ttl: (key: string) => Promise<number>;
    zrange: (key: string, start: number, stop: number) => Promise<string[]>;
    zrem: (key: string, member: string) => Promise<void>;
    del: (key: string) => Promise<void>;
  };

  constructor(redisClient: { 
    pipeline: () => {
      zremrangebyscore: (key: string, min: number, max: number) => void;
      zadd: (key: string, score: number, member: string) => void;
      expire: (key: string, seconds: number) => void;
      zcard: (key: string) => void;
      exec: () => Promise<[Error | null, number][]>;
    };
    ttl: (key: string) => Promise<number>;
    zrange: (key: string, start: number, stop: number) => Promise<string[]>;
    zrem: (key: string, member: string) => Promise<void>;
    del: (key: string) => Promise<void>;
  }) {
    this.redis = redisClient;
  }

  async increment(key: string, windowMs: number): Promise<RateLimitStoreResult> {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline();
      
      // Remove expired entries
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Add current request
      pipeline.zadd(key, now, `${now}:${Math.random()}`);
      
      // Set expiration
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      
      // Get count
      pipeline.zcard(key);
      
      const results = await pipeline.exec();
      const count = results[3][1];
      const ttl = await this.redis.ttl(key);
      
      return {
        total: count,
        remaining: 0,
        reset: new Date(now + (ttl * 1000)),
      };
    } catch (error) {
      logger.error('Redis rate limit store error', { error, key });
      throw error;
    }
  }

  async decrement(key: string): Promise<void> {
    // Redis ZSET doesn't support direct decrement, so we remove one entry
    const members = await this.redis.zrange(key, 0, 0);
    if (members.length > 0) {
      await this.redis.zrem(key, members[0]);
    }
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async resetAll(): Promise<void> {
    // This would require pattern matching in Redis
    // Implementation depends on Redis client capabilities
    logger.warn('Redis resetAll not implemented for performance reasons');
  }
}

// Main rate limiter class
export class RateLimiter {
  private store: RateLimitStore;
  protected config: Required<Omit<RateLimiterConfig, 'store'>> & { store: RateLimitStore };

  constructor(config: RateLimiterConfig) {
    this.store = config.store || new MemoryRateLimitStore();
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      message: config.message || 'Too many requests, please try again later.',
      statusCode: config.statusCode || 429,
      headers: config.headers ?? true,
      store: this.store,
      onLimitReached: config.onLimitReached,
    };
  }

  private defaultKeyGenerator(identifier: string): string {
    return `rate_limit:${identifier}`;
  }

  protected getIdentifier(req: { ip: string }): string {
    return req.ip;
  }

  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    limitInfo: RateLimitInfo;
  }> {
    try {
      const key = this.config.keyGenerator(identifier);
      const result = await this.store.increment(key, this.config.windowMs);

      const remaining = Math.max(0, this.config.maxRequests - result.total);
      const allowed = result.total <= this.config.maxRequests;

      const limitInfo: RateLimitInfo = {
        limit: this.config.maxRequests,
        remaining,
        reset: result.reset,
        retryAfter: allowed ? undefined : Math.ceil((result.reset.getTime() - Date.now()) / 1000),
      };

      if (!allowed && this.config.onLimitReached) {
        this.config.onLimitReached(key, limitInfo);
      }

      return { allowed, limitInfo };
    } catch (error) {
      logger.error('Rate limit check failed', { error, identifier });
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        limitInfo: {
          limit: this.config.maxRequests,
          remaining: this.config.maxRequests,
          reset: new Date(Date.now() + this.config.windowMs),
        },
      };
    }
  }

  // Express middleware
  middleware() {
    return async (
      req: { ip: string; method: string; path: string },
      res: {
        setHeader: (key: string, value: string | number) => void;
        send: (body: unknown) => unknown;
        statusCode: number;
        status: (code: number) => {
          json: (body: {
            error: {
              code: string | undefined;
              message: string;
              retryAfter: number | undefined;
            };
          }) => void;
        };
      },
      next: (error?: Error) => void
    ) => {
      try {
        // Generate identifier based on request
        const identifier = this.getIdentifier(req);
        const { allowed, limitInfo } = await this.checkLimit(identifier);

        // Set rate limit headers
        if (this.config.headers) {
          res.setHeader('X-RateLimit-Limit', limitInfo.limit);
          res.setHeader('X-RateLimit-Remaining', limitInfo.remaining);
          res.setHeader('X-RateLimit-Reset', limitInfo.reset.toISOString());
          
          if (!allowed && limitInfo.retryAfter) {
            res.setHeader('Retry-After', limitInfo.retryAfter);
          }
        }

        if (!allowed) {
          const error = new RateLimitError(
            this.config.message,
            limitInfo.retryAfter
          );
          return res.status(this.config.statusCode).json({
            error: {
              code: error.code,
              message: error.message,
              retryAfter: limitInfo.retryAfter,
            },
          });
        }

        // Track response for skip options
        const originalSend = res.send;
        res.send = (body: unknown) => {
          res.send = originalSend;
          
          if (this.config.skipSuccessfulRequests && res.statusCode < 400) {
            this.store
              .decrement(this.config.keyGenerator(identifier))
              .catch(() => {});
          }
          
          if (this.config.skipFailedRequests && res.statusCode >= 400) {
            this.store
              .decrement(this.config.keyGenerator(identifier))
              .catch(() => {});
          }
          
          return res.send(body);
        };

        next();
      } catch (error) {
        logger.error('Rate limit middleware error', { error });
        next(error as Error);
      }
    };
  }
}

// Different rate limiting strategies

// Fixed window rate limiter
export class FixedWindowRateLimiter extends RateLimiter {
  constructor(config: RateLimiterConfig) {
    super(config);
  }
}

// Sliding window rate limiter
export class SlidingWindowRateLimiter extends RateLimiter {
  constructor(config: RateLimiterConfig) {
    super(config);
  }

  // Override checkLimit to implement sliding window logic
  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    limitInfo: RateLimitInfo;
  }> {
    // Implementation for sliding window would go here
    // This is more complex than fixed window but provides smoother rate limiting
    return super.checkLimit(identifier);
  }
}

// Token bucket rate limiter
export class TokenBucketRateLimiter {
  private tokens = new Map<string, { tokens: number; lastRefill: number }>();

  constructor(
    private bucketSize: number,
    private refillRate: number, // tokens per second
    private refillIntervalMs: number = 1000
  ) {}

  async consume(identifier: string, tokens: number = 1): Promise<{
    allowed: boolean;
    remainingTokens: number;
    resetTime: Date;
  }> {
    const now = Date.now();
    let bucket = this.tokens.get(identifier);

    if (!bucket) {
      bucket = { tokens: this.bucketSize, lastRefill: now };
      this.tokens.set(identifier, bucket);
    }

    // Refill tokens based on time elapsed
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(this.bucketSize, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      return {
        allowed: true,
        remainingTokens: bucket.tokens,
        resetTime: new Date(now + (this.bucketSize - bucket.tokens) / this.refillRate * 1000),
      };
    }

    return {
      allowed: false,
      remainingTokens: bucket.tokens,
      resetTime: new Date(now + (tokens - bucket.tokens) / this.refillRate * 1000),
    };
  }
}

// Advanced rate limiting features

// Per-user rate limiting
export class UserRateLimiter extends RateLimiter {
  constructor(config: RateLimiterConfig & { userIdHeader?: string }) {
    super({
      ...config,
      keyGenerator: (identifier: string) => `user:${identifier}`,
    });
  }

  getIdentifier(req: { user?: { id: string }; headers: { [key: string]: string }; ip: string }): string {
    return req.user?.id || req.headers['x-user-id'] || req.ip;
  }
}

// Per-API endpoint rate limiting
export class APIRateLimiter extends RateLimiter {
  constructor(config: RateLimiterConfig & { apiPrefix?: string }) {
    super({
      ...config,
      keyGenerator: (identifier: string) => `api:${identifier}`,
    });
  }

  getIdentifier(req: { method: string; path: string }): string {
    return `${req.method}:${req.path}`;
  }
}

// Geographic rate limiting
export class GeographicRateLimiter extends RateLimiter {
  constructor(config: RateLimiterConfig & { geoHeader?: string }) {
    super({
      ...config,
      keyGenerator: (identifier: string) => `geo:${identifier}`,
    });
  }

  getIdentifier(req: {
    headers: { [key: string]: string | string[] | undefined };
  }): string {
    return (
      (req.headers['cf-ipcountry'] as string) ||
      (req.headers['x-country-code'] as string) ||
      'unknown'
    );
  }
}

// Adaptive rate limiting based on system load
export class AdaptiveRateLimiter extends RateLimiter {
  private currentLimit: number;
  private lastAdjustment = Date.now();
  private adjustmentInterval = 60000; // 1 minute

  constructor(config: RateLimiterConfig & { minLimit?: number; maxLimit?: number }) {
    super(config);
    this.currentLimit = config.maxRequests;
  }

  async checkLimit(identifier: string): Promise<{
    allowed: boolean;
    limitInfo: RateLimitInfo;
  }> {
    // Adjust limit based on system load
    this.adjustLimit();

    // Temporarily update maxRequests for this check
    const originalMaxRequests = this.config.maxRequests;
    this.config.maxRequests = this.currentLimit;

    const result = await super.checkLimit(identifier);

    // Restore original maxRequests
    this.config.maxRequests = originalMaxRequests;

    return result;
  }

  private adjustLimit(): void {
    const now = Date.now();
    if (now - this.lastAdjustment < this.adjustmentInterval) return;

    // Simple load-based adjustment (in a real system, you'd use actual metrics)
    const load = this.getSystemLoad();
    
    if (load > 0.8) {
      // High load - decrease limit
      this.currentLimit = Math.max(
        (this.config as { minLimit?: number }).minLimit || 10,
        Math.floor(this.currentLimit * 0.9)
      );
    } else if (load < 0.3) {
      // Low load - increase limit
      this.currentLimit = Math.min(
        (this.config as { maxLimit?: number }).maxLimit || 1000,
        Math.floor(this.currentLimit * 1.1)
      );
    }

    this.lastAdjustment = now;

    logger.info('Adaptive rate limit adjusted', { 
      newLimit: this.currentLimit, 
      load: load.toFixed(2) 
    });
  }

  private getSystemLoad(): number {
    // Placeholder - in a real system, you'd get actual system metrics
    // This could be CPU usage, memory usage, request queue length, etc.
    return Math.random(); // Random for demonstration
  }
}

// Rate limiting utilities
export class RateLimitingUtils {
  static getClientIP(req: {
    headers: { [key: string]: string | string[] | undefined };
    connection?: { remoteAddress?: string };
    socket?: { remoteAddress?: string };
  }): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  static getUserAgent(req: {
    headers: { [key: string]: string | string[] | undefined };
  }): string {
    return (req.headers['user-agent'] as string) || 'unknown';
  }

  static createRateLimitKey(...parts: string[]): string {
    return parts.filter(Boolean).join(':');
  }

  static parseRateLimitHeaders(headers: {
    [key: string]: string | string[] | undefined;
  }): RateLimitInfo | null {
    if (!headers['x-ratelimit-limit']) return null;

    return {
      limit: parseInt(headers['x-ratelimit-limit'] as string, 10),
      remaining: parseInt(headers['x-ratelimit-remaining'] as string, 10),
      reset: new Date(headers['x-ratelimit-reset'] as string),
      retryAfter: headers['retry-after']
        ? parseInt(headers['retry-after'] as string, 10)
        : undefined,
    };
  }
}

// Predefined rate limiting configurations
export const rateLimitConfigs = {
  // Strict rate limiting for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.',
  },

  // Moderate rate limiting for general API usage
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many API requests, please try again later.',
  },

  // Lenient rate limiting for public endpoints
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Too many requests, please try again later.',
  },

  // Strict rate limiting for sensitive operations
  sensitive: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: 'Too many requests for this operation, please try again later.',
  },

  // Real-time features rate limiting
  realtime: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 1 request per second
    message: 'Too many real-time requests, please slow down.',
  },
};

// Export utilities and types
export const rateLimitingUtils = RateLimitingUtils;
export const memoryStore = MemoryRateLimitStore;
export const redisStore = RedisRateLimitStore;

// Export singleton rate limiters for common use cases
export const authRateLimiter = new RateLimiter(rateLimitConfigs.auth);
export const apiRateLimiter = new RateLimiter(rateLimitConfigs.api);
export const publicRateLimiter = new RateLimiter(rateLimitConfigs.public);
export const sensitiveRateLimiter = new RateLimiter(rateLimitConfigs.sensitive);
export const realtimeRateLimiter = new RateLimiter(rateLimitConfigs.realtime);