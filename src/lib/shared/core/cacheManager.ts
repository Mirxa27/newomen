import { createClient, RedisClientType } from 'redis';
import { logger } from '@/lib/logging';
import { CacheError, ValidationError } from '@/lib/errors';
import { CircuitBreaker } from '@/lib/resilience/circuitBreaker';
import { RetryPolicy } from '@/lib/resilience/retry';
import { z } from 'zod';

// Cache configuration schema
export const CacheConfigSchema = z.object({
  redis: z.object({
    host: z.string().default('localhost'),
    port: z.number().int().min(1).max(65535).default(6379),
    password: z.string().optional(),
    db: z.number().int().min(0).max(15).default(0),
    connectTimeout: z.number().int().min(1000).default(10000),
    commandTimeout: z.number().int().min(1000).default(5000),
    retryDelayOnFailover: z.number().int().min(100).default(100),
    enableReadyCheck: z.boolean().default(true),
    maxRetriesPerRequest: z.number().int().min(0).default(3),
    lazyConnect: z.boolean().default(true),
    keepAlive: z.number().int().min(0).default(30000),
    family: z.number().int().min(4).max(6).default(4),
    tls: z.object({}).optional()
  }),
  cache: z.object({
    defaultTTL: z.number().int().min(1).default(3600),
    maxKeyLength: z.number().int().min(1).max(1024).default(250),
    maxValueSize: z.number().int().min(1024).default(10485760), // 10MB
    compressionThreshold: z.number().int().min(1024).default(8192), // 8KB
    enableCompression: z.boolean().default(true),
    keyPrefix: z.string().default('newme:'),
    namespaceSeparator: z.string().default(':'),
    enableMetrics: z.boolean().default(true),
    metricsInterval: z.number().int().min(1000).default(60000)
  }),
  circuitBreaker: z.object({
    failureThreshold: z.number().int().min(1).default(5),
    resetTimeout: z.number().int().min(1000).default(60000),
    monitoringPeriod: z.number().int().min(1000).default(300000)
  }),
  retry: z.object({
    maxAttempts: z.number().int().min(1).default(3),
    initialDelay: z.number().int().min(100).default(1000),
    maxDelay: z.number().int().min(1000).default(30000),
    backoffMultiplier: z.number().min(1).default(2),
    jitter: z.boolean().default(true)
  })
});

export type CacheConfig = z.infer<typeof CacheConfigSchema>;

export interface CacheEntry<T = unknown> {
  data: T;
  ttl: number;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  compressed?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalRequests: number;
  hitRate: number;
  avgResponseTime: number;
  memoryUsage: number;
  keyCount: number;
}

export class CacheManager {
  private client: RedisClientType | null = null;
  private config: CacheConfig;
  private circuitBreaker: CircuitBreaker;
  private retryPolicy: RetryPolicy;
  private metrics: CacheMetrics;
  private metricsTimer?: NodeJS.Timeout;
  private connected = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = CacheConfigSchema.parse({
      redis: { ...CacheConfigSchema.shape.redis.parse({}), ...config.redis },
      cache: { ...CacheConfigSchema.shape.cache.parse({}), ...config.cache },
      circuitBreaker: { ...CacheConfigSchema.shape.circuitBreaker.parse({}), ...config.circuitBreaker },
      retry: { ...CacheConfigSchema.shape.retry.parse({}), ...config.retry }
    });

    this.circuitBreaker = new CircuitBreaker(this.config.circuitBreaker);
    this.retryPolicy = new RetryPolicy(this.config.retry);
    
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalRequests: 0,
      hitRate: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      keyCount: 0
    };

    this.initializeMetrics();
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: this.config.redis.host,
          port: this.config.redis.port,
          connectTimeout: this.config.redis.connectTimeout,
          commandTimeout: this.config.redis.commandTimeout,
          retryDelayOnFailover: this.config.redis.retryDelayOnFailover,
          enableReadyCheck: this.config.redis.enableReadyCheck,
          keepAlive: this.config.redis.keepAlive,
          family: this.config.redis.family,
          tls: this.config.redis.tls
        },
        password: this.config.redis.password,
        database: this.config.redis.db,
        lazyConnect: this.config.redis.lazyConnect,
        maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest
      });

      await this.client.connect();
      this.connected = true;

      logger.info('Cache manager connected to Redis', {
        host: this.config.redis.host,
        port: this.config.redis.port,
        db: this.config.redis.db
      });

      this.startMetricsCollection();
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
      throw new CacheError('Redis connection failed', { cause: error });
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connected || !this.client) {
      return;
    }

    try {
      if (this.metricsTimer) {
        clearInterval(this.metricsTimer);
      }

      await this.client.disconnect();
      this.connected = false;
      this.client = null;

      logger.info('Cache manager disconnected from Redis');
    } catch (error) {
      logger.error('Error disconnecting from Redis', { error });
      throw new CacheError('Redis disconnection failed', { cause: error });
    }
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = Date.now();
    
    return this.circuitBreaker.execute(async () => {
      return this.retryPolicy.execute(async () => {
        if (!this.client) {
          throw new CacheError('Redis client not connected');
        }
        return await operation();
      });
    }).finally(() => {
      const responseTime = Date.now() - startTime;
      this.updateMetrics('responseTime', responseTime);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    const fullKey = this.buildKey(key);

    try {
      const result = await this.executeWithRetry(async () => {
        const value = await this.client!.get(fullKey);
        return value;
      }, 'get');

      this.metrics.totalRequests++;
      
      if (result === null) {
        this.metrics.misses++;
        logger.debug('Cache miss', { key: fullKey });
        return null;
      }

      this.metrics.hits++;
      const entry: CacheEntry<T> = JSON.parse(result);
      
      // Check if entry is expired
      if (this.isExpired(entry)) {
        await this.delete(key);
        this.metrics.misses++;
        return null;
      }

      // Update access metadata
      entry.lastAccessed = new Date();
      entry.accessCount++;

      // Update cache with new access metadata
      await this.set(key, entry.data, entry.ttl, entry.metadata);

      logger.debug('Cache hit', { key: fullKey, accessCount: entry.accessCount });
      return entry.data;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache get failed', { key: fullKey, error });
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttl = this.config.cache.defaultTTL,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    const fullKey = this.buildKey(key);

    try {
      // Validate key length
      if (fullKey.length > this.config.cache.maxKeyLength) {
        throw new ValidationError(`Key too long: ${fullKey.length} > ${this.config.cache.maxKeyLength}`);
      }

      const entry: CacheEntry<T> = {
        data: value,
        ttl,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 0,
        metadata
      };

      let serializedValue = JSON.stringify(entry);
      
      // Compress if enabled and value is large enough
      if (this.config.cache.enableCompression && 
          serializedValue.length > this.config.cache.compressionThreshold) {
        serializedValue = await this.compress(serializedValue);
        entry.compressed = true;
      }

      // Validate value size
      if (serializedValue.length > this.config.cache.maxValueSize) {
        throw new ValidationError(`Value too large: ${serializedValue.length} > ${this.config.cache.maxValueSize}`);
      }

      await this.executeWithRetry(async () => {
        await this.client!.setEx(fullKey, ttl, serializedValue);
      }, 'set');

      this.metrics.sets++;
      logger.debug('Cache set', { key: fullKey, ttl, compressed: entry.compressed });
      return true;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache set failed', { key: fullKey, error });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);

    try {
      const result = await this.executeWithRetry(async () => {
        return await this.client!.del(fullKey);
      }, 'delete');

      this.metrics.deletes++;
      logger.debug('Cache delete', { key: fullKey, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache delete failed', { key: fullKey, error });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);

    try {
      const result = await this.executeWithRetry(async () => {
        return await this.client!.exists(fullKey);
      }, 'exists');

      return result === 1;
    } catch (error) {
      logger.error('Cache exists check failed', { key: fullKey, error });
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      const pattern = this.buildKey('*');
      const keys = await this.executeWithRetry(async () => {
        return await this.client!.keys(pattern);
      }, 'keys');

      if (keys.length > 0) {
        await this.executeWithRetry(async () => {
          return await this.client!.del(keys);
        }, 'del');
      }

      logger.info('Cache cleared', { pattern, keysDeleted: keys.length });
      return true;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache clear failed', { error });
      return false;
    }
  }

  async increment(key: string, amount = 1): Promise<number | null> {
    const fullKey = this.buildKey(key);

    try {
      const result = await this.executeWithRetry(async () => {
        return await this.client!.incrBy(fullKey, amount);
      }, 'increment');

      // Set TTL if key didn't exist
      await this.client!.expire(fullKey, this.config.cache.defaultTTL);
      
      logger.debug('Cache increment', { key: fullKey, amount, result });
      return result;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache increment failed', { key: fullKey, error });
      return null;
    }
  }

  async decrement(key: string, amount = 1): Promise<number | null> {
    const fullKey = this.buildKey(key);

    try {
      const result = await this.executeWithRetry(async () => {
        return await this.client!.decrBy(fullKey, amount);
      }, 'decrement');

      // Set TTL if key didn't exist
      await this.client!.expire(fullKey, this.config.cache.defaultTTL);
      
      logger.debug('Cache decrement', { key: fullKey, amount, result });
      return result;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache decrement failed', { key: fullKey, error });
      return null;
    }
  }

  async getMany<T>(keys: string[]): Promise<Map<string, T | null>> {
    const fullKeys = keys.map(key => this.buildKey(key));
    const results = new Map<string, T | null>();

    try {
      const values = await this.executeWithRetry(async () => {
        return await this.client!.mGet(fullKeys);
      }, 'mget');

      for (let i = 0; i < keys.length; i++) {
        const value = values[i];
        if (value === null) {
          results.set(keys[i], null);
          this.metrics.misses++;
        } else {
          const entry: CacheEntry<T> = JSON.parse(value);
          if (this.isExpired(entry)) {
            results.set(keys[i], null);
            this.metrics.misses++;
            await this.delete(keys[i]);
          } else {
            results.set(keys[i], entry.data);
            this.metrics.hits++;
          }
        }
      }

      this.metrics.totalRequests += keys.length;
      return results;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache getMany failed', { keys, error });
      
      // Return null for all keys on error
      for (const key of keys) {
        results.set(key, null);
      }
      return results;
    }
  }

  async setMany(entries: Record<string, unknown>, ttl = this.config.cache.defaultTTL): Promise<boolean> {
    try {
      const pipeline = this.client!.multi();
      
      for (const [key, value] of Object.entries(entries)) {
        const fullKey = this.buildKey(key);
        const entry: CacheEntry = {
          data: value,
          ttl,
          createdAt: new Date(),
          lastAccessed: new Date(),
          accessCount: 0
        };

        const serializedValue = JSON.stringify(entry);
        pipeline.setEx(fullKey, ttl, serializedValue);
        this.metrics.sets++;
      }

      await this.executeWithRetry(async () => {
        await pipeline.exec();
      }, 'setMany');

      logger.debug('Cache setMany', { count: Object.keys(entries).length, ttl });
      return true;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache setMany failed', { error });
      return false;
    }
  }

  async getKeys(pattern = '*'): Promise<string[]> {
    const fullPattern = this.buildKey(pattern);

    try {
      const keys = await this.executeWithRetry(async () => {
        return await this.client!.keys(fullPattern);
      }, 'keys');

      // Remove prefix from keys
      return keys.map(key => key.replace(this.config.cache.keyPrefix, ''));
    } catch (error) {
      logger.error('Cache getKeys failed', { pattern, error });
      return [];
    }
  }

  async getTTL(key: string): Promise<number> {
    const fullKey = this.buildKey(key);

    try {
      const ttl = await this.executeWithRetry(async () => {
        return await this.client!.ttl(fullKey);
      }, 'ttl');

      return ttl;
    } catch (error) {
      logger.error('Cache getTTL failed', { key: fullKey, error });
      return -2; // Key doesn't exist
    }
  }

  async setTTL(key: string, ttl: number): Promise<boolean> {
    const fullKey = this.buildKey(key);

    try {
      const result = await this.executeWithRetry(async () => {
        return await this.client!.expire(fullKey, ttl);
      }, 'expire');

      return result === 1;
    } catch (error) {
      logger.error('Cache setTTL failed', { key: fullKey, error });
      return false;
    }
  }

  getMetrics(): CacheMetrics {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (this.metrics.hits / totalRequests) * 100 : 0;
    
    return {
      ...this.metrics,
      hitRate,
      totalRequests
    };
  }

  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalRequests: 0,
      hitRate: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      keyCount: 0
    };
  }

  private buildKey(key: string): string {
    if (key.startsWith(this.config.cache.keyPrefix)) {
      return key;
    }
    return `${this.config.cache.keyPrefix}${key}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    const now = new Date();
    const age = (now.getTime() - entry.createdAt.getTime()) / 1000;
    return age > entry.ttl;
  }

  private async compress(data: string): Promise<string> {
    // Simple compression placeholder - in production, use proper compression
    return Buffer.from(data).toString('base64');
  }

  private async decompress(data: string): Promise<string> {
    // Simple decompression placeholder - in production, use proper decompression
    return Buffer.from(data, 'base64').toString();
  }

  private updateMetrics(type: string, value: number): void {
    switch (type) {
      case 'responseTime':
        this.metrics.avgResponseTime = (this.metrics.avgResponseTime + value) / 2;
        break;
    }
  }

  private initializeMetrics(): void {
    if (this.config.cache.enableMetrics) {
      this.metricsTimer = setInterval(() => {
        this.collectMetrics();
      }, this.config.cache.metricsInterval);
    }
  }

  private async collectMetrics(): Promise<void> {
    if (!this.client) return;

    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      // Parse memory usage from info
      const memoryMatch = info.match(/used_memory:(\d+)/);
      if (memoryMatch) {
        this.metrics.memoryUsage = parseInt(memoryMatch[1], 10);
      }

      // Parse key count from keyspace
      const keyMatch = keyspace.match(/keys=(\d+)/);
      if (keyMatch) {
        this.metrics.keyCount = parseInt(keyMatch[1], 10);
      }

      logger.debug('Cache metrics collected', this.metrics);
    } catch (error) {
      logger.error('Failed to collect cache metrics', { error });
    }
  }
}

// Global cache instance
let globalCache: CacheManager | null = null;

export function createCacheManager(config?: Partial<CacheConfig>): CacheManager {
  if (!globalCache) {
    globalCache = new CacheManager(config);
  }
  return globalCache;
}

export function getCacheManager(): CacheManager {
  if (!globalCache) {
    throw new Error('Cache manager not initialized. Call createCacheManager() first.');
  }
  return globalCache;
}

// Cache decorators
export function Cacheable(options: {
  key?: string;
  ttl?: number;
  condition?: (args: unknown[]) => boolean;
  unless?: (result: unknown) => boolean;
}) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cache = getCacheManager();
      const cacheKey = options.key || `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      if (options.condition && !options.condition(args)) {
        return originalMethod.apply(this, args);
      }

      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      
      if (options.unless && options.unless(result)) {
        return result;
      }

      await cache.set(cacheKey, result, options.ttl);
      return result;
    };

    return descriptor;
  };
}

export function CacheEvict(options: {
  key?: string;
  allEntries?: boolean;
  condition?: (args: unknown[]) => boolean;
}) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const result = await originalMethod.apply(this, args);
      
      if (options.condition && !options.condition(args)) {
        return result;
      }

      const cache = getCacheManager();
      
      if (options.allEntries) {
        await cache.clear();
      } else if (options.key) {
        await cache.delete(options.key);
      }

      return result;
    };

    return descriptor;
  };
}