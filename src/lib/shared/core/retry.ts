import { logger } from '@/lib/logging';
import { RetryError, TimeoutError } from '@/lib/errors';

// Retry configuration
export interface RetryConfig {
  maxAttempts: number; // Maximum number of retry attempts
  initialDelay: number; // Initial delay in milliseconds
  maxDelay: number; // Maximum delay in milliseconds
  backoffMultiplier: number; // Backoff multiplier
  jitter: boolean; // Add random jitter to delays
  exponential: boolean; // Use exponential backoff
  retryOn: (error: Error, attempt: number) => boolean; // Retry condition
  onRetry?: (error: Error, attempt: number, nextDelay: number) => void;
  onSuccess?: (attempt: number) => void;
  onFailure?: (error: Error, attempt: number) => void;
  timeout?: number; // Timeout per attempt
  abortSignal?: AbortSignal; // Abort signal
}

// Retry state
export interface RetryState {
  attempt: number;
  lastError?: Error;
  startTime: number;
  totalDelay: number;
}

// Default retry configuration
export const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  exponential: true,
  retryOn: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx errors
    return (
      error.name === 'NetworkError' ||
      error.name === 'TimeoutError' ||
      error.name === 'ServiceUnavailableError' ||
      error.name === 'DatabaseError' ||
      (error as { statusCode?: number }).statusCode >= 500
    );
  },
};

// Retry utility class
export class RetryUtil {
  private static defaultConfig = defaultRetryConfig;

  static withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...this.defaultConfig, ...config };
    return this.executeWithRetry(operation, retryConfig);
  }

  private static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    const state: RetryState = {
      attempt: 0,
      startTime: Date.now(),
      totalDelay: 0,
    };

    while (state.attempt < config.maxAttempts) {
      state.attempt++;

      try {
        // Check abort signal
        if (config.abortSignal?.aborted) {
          throw new Error('Operation aborted');
        }

        // Execute operation with timeout
        const result = await this.executeWithTimeout(
          operation,
          config.timeout,
          config.abortSignal
        );

        // Success
        if (config.onSuccess) {
          config.onSuccess(state.attempt);
        }

        logger.info('Retry operation succeeded', {
          attempt: state.attempt,
          totalDelay: state.totalDelay,
        });

        return result;
      } catch (error) {
        state.lastError = error as Error;

        // Check if we should retry
        const shouldRetry =
          state.attempt < config.maxAttempts &&
          config.retryOn(state.lastError, state.attempt);

        if (!shouldRetry) {
          if (config.onFailure) {
            config.onFailure(state.lastError, state.attempt);
          }
          throw state.lastError;
        }

        // Calculate next delay
        const nextDelay = this.calculateDelay(state, config);

        // Log retry attempt
        logger.warn('Retry operation failed, retrying', {
          attempt: state.attempt,
          error: state.lastError.message,
          nextDelay,
          maxAttempts: config.maxAttempts,
        });

        if (config.onRetry) {
          config.onRetry(state.lastError, state.attempt, nextDelay);
        }

        // Wait before next attempt
        await this.delay(nextDelay, config.abortSignal);
        state.totalDelay += nextDelay;
      }
    }

    // Max attempts reached
    if (config.onFailure) {
      config.onFailure(state.lastError!, state.attempt);
    }

    throw new RetryError(
      `Max retry attempts (${config.maxAttempts}) reached. Last error: ${state.lastError!.message}`,
      state.lastError!
    );
  }

  private static calculateDelay(state: RetryState, config: RetryConfig): number {
    let delay: number;

    if (config.exponential) {
      delay = config.initialDelay * Math.pow(config.backoffMultiplier, state.attempt - 1);
    } else {
      delay = config.initialDelay;
    }

    // Apply maximum delay
    delay = Math.min(delay, config.maxDelay);

    // Add jitter
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private static delay(ms: number, abortSignal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);

      if (abortSignal) {
        const abortHandler = () => {
          clearTimeout(timeout);
          reject(new Error('Delay aborted'));
        };

        if (abortSignal.aborted) {
          abortHandler();
        } else {
          abortSignal.addEventListener('abort', abortHandler, { once: true });
        }
      }
    });
  }

  private static executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout?: number,
    abortSignal?: AbortSignal
  ): Promise<T> {
    if (!timeout) {
      return operation();
    }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new TimeoutError('Operation', timeout));
      }, timeout);

      const cleanup = () => {
        clearTimeout(timer);
      };

      operation()
        .then(result => {
          cleanup();
          resolve(result);
        })
        .catch(error => {
          cleanup();
          reject(error);
        });

      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          cleanup();
          reject(new Error('Operation aborted'));
        });
      }
    });
  }

  // Retry with specific conditions
  static retryOnNetworkError<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.withRetry(operation, {
      ...config,
      retryOn: (error: Error) => error.name === 'NetworkError' || error.name === 'TypeError',
    });
  }

  static retryOnTimeout<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.withRetry(operation, {
      ...config,
      retryOn: (error: Error) => error instanceof TimeoutError,
    });
  }

  static retryOnDatabaseError<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.withRetry(operation, {
      ...config,
      retryOn: (error: Error) => error.name === 'DatabaseError',
    });
  }

  static retryOnServiceUnavailable<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.withRetry(operation, {
      ...config,
      retryOn: (error: Error) => error.name === 'ServiceUnavailableError',
    });
  }

  // Retry with exponential backoff
  static exponentialBackoff<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.withRetry(operation, {
      ...config,
      exponential: true,
      jitter: true,
    });
  }

  // Retry with linear backoff
  static linearBackoff<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.withRetry(operation, {
      ...config,
      exponential: false,
      jitter: false,
    });
  }

  // Retry with fixed delay
  static fixedDelay<T>(
    operation: () => Promise<T>,
    delay: number,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.withRetry(operation, {
      ...config,
      initialDelay: delay,
      exponential: false,
      jitter: false,
    });
  }

  // Retry with custom retry condition
  static retryIf<T>(
    operation: () => Promise<T>,
    condition: (error: Error, attempt: number) => boolean,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.withRetry(operation, {
      ...config,
      retryOn: condition,
    });
  }

  // Retry with fallback
  static withFallback<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.withRetry(operation, {
      ...config,
      onFailure: (error: Error, attempt: number) => {
        if (config.onFailure) config.onFailure(error, attempt);
        
        // Use fallback on final failure
        if (attempt === (config.maxAttempts || this.defaultConfig.maxAttempts)) {
          logger.info('Using fallback after retries exhausted', { error: error.message });
          return fallback();
        }
      },
    }).catch(() => fallback());
  }
}

// Retry policy class for more complex scenarios
export class RetryPolicy {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...defaultRetryConfig, ...config };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    return RetryUtil.withRetry(operation, this.config);
  }

  withConfig(config: Partial<RetryConfig>): RetryPolicy {
    return new RetryPolicy({ ...this.config, ...config });
  }

  withMaxAttempts(maxAttempts: number): RetryPolicy {
    return this.withConfig({ maxAttempts });
  }

  withDelay(initialDelay: number): RetryPolicy {
    return this.withConfig({ initialDelay });
  }

  withTimeout(timeout: number): RetryPolicy {
    return this.withConfig({ timeout });
  }

  withRetryOn(
    retryOn: (error: Error, attempt: number) => boolean
  ): RetryPolicy {
    return this.withConfig({ retryOn });
  }

  withAbortSignal(abortSignal: AbortSignal): RetryPolicy {
    return this.withConfig({ abortSignal });
  }
}

// Predefined retry policies
export const retryPolicies = {
  // Conservative policy for critical operations
  conservative: new RetryPolicy({
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    jitter: true,
    exponential: true,
  }),

  // Aggressive policy for fast operations
  aggressive: new RetryPolicy({
    maxAttempts: 3,
    initialDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 1.5,
    jitter: true,
    exponential: true,
  }),

  // Network policy for network operations
  network: new RetryPolicy({
    maxAttempts: 4,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    exponential: true,
    retryOn: (error: Error) => {
      return (
        error.name === 'NetworkError' ||
        error.name === 'TypeError' ||
        error.name === 'TimeoutError' ||
        (error as { code?: string }).code === 'ECONNREFUSED' ||
        (error as { code?: string }).code === 'ENOTFOUND'
      );
    },
  }),

  // Database policy for database operations
  database: new RetryPolicy({
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
    exponential: true,
    retryOn: (error: Error) => {
      return (
        error.name === 'DatabaseError' ||
        error.name === 'ConnectionError' ||
        error.name === 'QueryTimeoutError' ||
        (error as { code?: string }).code === 'ECONNREFUSED' ||
        (error as { code?: string }).code === 'ENOTFOUND'
      );
    },
  }),

  // AI service policy for AI operations
  aiService: new RetryPolicy({
    maxAttempts: 3,
    initialDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    exponential: true,
    retryOn: (error: Error) => {
      return (
        error.name === 'ServiceUnavailableError' ||
        error.name === 'RateLimitError' ||
        error.name === 'TimeoutError' ||
        (error as { statusCode?: number }).statusCode === 429 ||
        (error as { statusCode?: number }).statusCode >= 500
      );
    },
  }),

  // Payment policy for payment operations
  payment: new RetryPolicy({
    maxAttempts: 2,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: false,
    exponential: true,
    retryOn: (error: Error) => {
      // Only retry on specific payment errors
      return (
        error.name === 'NetworkError' ||
        error.name === 'TimeoutError' ||
        (error as { code?: string }).code === 'PAYMENT_NETWORK_ERROR'
      );
    },
  }),

  // No retry policy
  none: new RetryPolicy({
    maxAttempts: 1,
    initialDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
    jitter: false,
    exponential: false,
    retryOn: () => false,
  }),
};

// Retry utilities
export class RetryUtils {
  static policies = retryPolicies;

  static withPolicy<T>(
    policy: RetryPolicy,
    operation: () => Promise<T>
  ): Promise<T> {
    return policy.execute(operation);
  }

  static withConservative<T>(operation: () => Promise<T>): Promise<T> {
    return this.policies.conservative.execute(operation);
  }

  static withAggressive<T>(operation: () => Promise<T>): Promise<T> {
    return this.policies.aggressive.execute(operation);
  }

  static withNetwork<T>(operation: () => Promise<T>): Promise<T> {
    return this.policies.network.execute(operation);
  }

  static withDatabase<T>(operation: () => Promise<T>): Promise<T> {
    return this.policies.database.execute(operation);
  }

  static withAIService<T>(operation: () => Promise<T>): Promise<T> {
    return this.policies.aiService.execute(operation);
  }

  static withPayment<T>(operation: () => Promise<T>): Promise<T> {
    return this.policies.payment.execute(operation);
  }

  static noRetry<T>(operation: () => Promise<T>): Promise<T> {
    return this.policies.none.execute(operation);
  }

  // Create custom retry policy
  static createPolicy(config: Partial<RetryConfig>): RetryPolicy {
    return new RetryPolicy(config);
  }

  // Retry with timeout
  static withTimeout<T>(
    operation: () => Promise<T>,
    timeout: number,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    return RetryUtil.withRetry(operation, { ...config, timeout });
  }

  // Retry with circuit breaker
  static withCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitBreaker: { execute: (op: () => Promise<T>) => Promise<T> },
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    return circuitBreaker.execute(() => RetryUtil.withRetry(operation, config));
  }
}

// Retry decorator for methods
export function RetryDecorator(policy: RetryPolicy = retryPolicies.conservative) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

    descriptor.value = async function (...args: unknown[]) {
      return policy.execute(async () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}

// Retry with specific policy decorator
export function ConservativeRetry() {
  return RetryDecorator(retryPolicies.conservative);
}

export function AggressiveRetry() {
  return RetryDecorator(retryPolicies.aggressive);
}

export function NetworkRetry() {
  return RetryDecorator(retryPolicies.network);
}

export function DatabaseRetry() {
  return RetryDecorator(retryPolicies.database);
}

export function AIServiceRetry() {
  return RetryDecorator(retryPolicies.aiService);
}

export function PaymentRetry() {
  return RetryDecorator(retryPolicies.payment);
}

// Export utilities
export const retry = RetryUtil.withRetry;
export const retryWithPolicy = RetryUtils.withPolicy;
export const retryWithFallback = RetryUtil.withFallback;
export const retryIf = RetryUtil.retryIf;
export const exponentialBackoff = RetryUtil.exponentialBackoff;
export const linearBackoff = RetryUtil.linearBackoff;
export const fixedDelay = RetryUtil.fixedDelay;
export const retryOnNetworkError = RetryUtil.retryOnNetworkError;
export const retryOnTimeout = RetryUtil.retryOnTimeout;
export const retryOnDatabaseError = RetryUtil.retryOnDatabaseError;
export const retryOnServiceUnavailable = RetryUtil.retryOnServiceUnavailable;