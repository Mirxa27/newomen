import { logger } from '@/lib/logging';
import { CircuitBreakerError, ServiceUnavailableError } from '@/lib/errors';

// Circuit breaker states
export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes before closing
  timeout: number; // Timeout in milliseconds
  resetTimeout: number; // Time to wait before attempting reset
  onStateChange?: (state: CircuitBreakerState) => void;
  onFailure?: (error: Error) => void;
  onSuccess?: () => void;
  name?: string;
  enabled?: boolean;
}

// Circuit breaker statistics
export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failures: number;
  successes: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttemptTime?: Date;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
  failureRate: number;
}

// Circuit breaker options for individual calls
export interface CircuitBreakerOptions {
  timeout?: number;
  fallback?: () => Promise<any>;
  onTimeout?: () => void;
  onFailure?: (error: Error) => void;
  onSuccess?: () => void;
}

// Main circuit breaker class
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttemptTime?: Date;
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;

  constructor(private config: CircuitBreakerConfig) {
    this.config = {
      enabled: true,
      ...config,
    };
  }

  // Execute a function with circuit breaker protection
  async execute<T>(
    operation: () => Promise<T>,
    options: CircuitBreakerOptions = {}
  ): Promise<T> {
    if (!this.config.enabled) {
      return operation();
    }

    this.totalRequests++;

    // Check if circuit breaker is open
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
      } else {
        const retryAfter = this.nextAttemptTime 
          ? Math.ceil((this.nextAttemptTime.getTime() - Date.now()) / 1000)
          : Math.ceil(this.config.resetTimeout / 1000);

        throw new CircuitBreakerError(
          `Circuit breaker is OPEN. Try again in ${retryAfter} seconds.`,
          retryAfter
        );
      }
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(
        operation,
        options.timeout || this.config.timeout
      );

      this.onSuccess();
      if (options.onSuccess) options.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      if (options.onFailure) options.onFailure(error as Error);

      // Try fallback if available
      if (options.fallback) {
        logger.warn('Circuit breaker: Using fallback', { 
          error: (error as Error).message,
          name: this.config.name 
        });
        return options.fallback();
      }

      throw error;
    }
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new ServiceUnavailableError(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private onSuccess(): void {
    this.successes++;
    this.totalSuccesses++;
    this.lastSuccessTime = new Date();

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successes >= this.config.successThreshold) {
        this.transitionTo(CircuitBreakerState.CLOSED);
        this.resetCounts();
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Decay failure count on success
      this.failures = Math.max(0, this.failures - 1);
    }

    if (this.config.onSuccess) {
      this.config.onSuccess();
    }
  }

  private onFailure(error: Error): void {
    this.failures++;
    this.totalFailures++;
    this.lastFailureTime = new Date();

    if (this.config.onFailure) {
      this.config.onFailure(error);
    }

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.transitionTo(CircuitBreakerState.OPEN);
      this.scheduleReset();
    } else if (this.state === CircuitBreakerState.CLOSED) {
      if (this.failures >= this.config.failureThreshold) {
        this.transitionTo(CircuitBreakerState.OPEN);
        this.scheduleReset();
      }
    }
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime ? Date.now() >= this.nextAttemptTime.getTime() : false;
  }

  private scheduleReset(): void {
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);
  }

  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;

    logger.info('Circuit breaker state changed', {
      name: this.config.name,
      from: oldState,
      to: newState,
      failures: this.failures,
      successes: this.successes,
    });

    if (this.config.onStateChange) {
      this.config.onStateChange(newState);
    }
  }

  private resetCounts(): void {
    this.failures = 0;
    this.successes = 0;
  }

  // Get current statistics
  getStats(): CircuitBreakerStats {
    const failureRate = this.totalRequests > 0 
      ? (this.totalFailures / this.totalRequests) * 100 
      : 0;

    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      failureRate,
    };
  }

  // Reset circuit breaker
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.resetCounts();
    this.nextAttemptTime = undefined;
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;

    logger.info('Circuit breaker reset', { name: this.config.name });
  }

  // Force open circuit breaker
  forceOpen(): void {
    this.transitionTo(CircuitBreakerState.OPEN);
    this.scheduleReset();
  }

  // Force close circuit breaker
  forceClose(): void {
    this.transitionTo(CircuitBreakerState.CLOSED);
    this.resetCounts();
  }

  // Get current state
  getState(): CircuitBreakerState {
    return this.state;
  }

  // Check if circuit breaker is enabled
  isEnabled(): boolean {
    return this.config.enabled ?? true;
  }

  // Enable circuit breaker
  enable(): void {
    this.config.enabled = true;
  }

  // Disable circuit breaker
  disable(): void {
    this.config.enabled = false;
  }
}

// Circuit breaker manager for multiple services
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  create(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    const breaker = new CircuitBreaker({ ...config, name });
    this.breakers.set(name, breaker);
    return breaker;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  remove(name: string): boolean {
    return this.breakers.delete(name);
  }

  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  getStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }

    return stats;
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  forceOpenAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceOpen();
    }
  }

  forceCloseAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceClose();
    }
  }
}

// Predefined circuit breaker configurations
export const circuitBreakerConfigs = {
  // Strict circuit breaker for critical services
  strict: {
    failureThreshold: 3,
    successThreshold: 5,
    timeout: 5000,
    resetTimeout: 60000, // 1 minute
  },

  // Moderate circuit breaker for general services
  moderate: {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 10000,
    resetTimeout: 30000, // 30 seconds
  },

  // Lenient circuit breaker for non-critical services
  lenient: {
    failureThreshold: 10,
    successThreshold: 2,
    timeout: 15000,
    resetTimeout: 15000, // 15 seconds
  },

  // Fast circuit breaker for real-time services
  fast: {
    failureThreshold: 2,
    successThreshold: 3,
    timeout: 2000,
    resetTimeout: 5000, // 5 seconds
  },

  // Slow circuit breaker for batch services
  slow: {
    failureThreshold: 20,
    successThreshold: 10,
    timeout: 30000,
    resetTimeout: 300000, // 5 minutes
  },
};

// Circuit breaker factory
export class CircuitBreakerFactory {
  private static manager = new CircuitBreakerManager();

  static create(name: string, config: CircuitBreakerConfig): CircuitBreaker {
    return this.manager.create(name, config);
  }

  static get(name: string): CircuitBreaker | undefined {
    return this.manager.get(name);
  }

  static getManager(): CircuitBreakerManager {
    return this.manager;
  }

  static createFromPreset(
    name: string,
    preset: keyof typeof circuitBreakerConfigs,
    overrides?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    const config = {
      ...circuitBreakerConfigs[preset],
      ...overrides,
      name,
    };
    return this.create(name, config);
  }
}

// Circuit breaker middleware for Express
export function circuitBreakerMiddleware(breaker: CircuitBreaker) {
  return async (req: any, res: any, next: any) => {
    try {
      await breaker.execute(async () => {
        next();
      });
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        return res.status(503).json({
          error: {
            code: error.code,
            message: error.message,
            retryAfter: error.retryAfter,
          }
        });
      }
      next(error);
    }
  };
}

// Circuit breaker decorator for methods
export function CircuitBreakerDecorator(
  name: string,
  config?: Partial<CircuitBreakerConfig>
) {
  const breaker = CircuitBreakerFactory.createFromPreset(
    name,
    'moderate',
    config
  );

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return breaker.execute(async () => {
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}

// Health check for circuit breakers
export class CircuitBreakerHealthCheck {
  static async checkHealth(): Promise<{
    healthy: boolean;
    details: Record<string, any>;
  }> {
    const manager = CircuitBreakerFactory.getManager();
    const stats = manager.getStats();
    
    const details: Record<string, any> = {};
    let healthy = true;

    for (const [name, stat] of Object.entries(stats)) {
      details[name] = {
        state: stat.state,
        failureRate: stat.failureRate.toFixed(2) + '%',
        totalRequests: stat.totalRequests,
        totalFailures: stat.totalFailures,
      };

      // Consider unhealthy if too many failures or circuit is open
      if (stat.state === CircuitBreakerState.OPEN || stat.failureRate > 50) {
        healthy = false;
      }
    }

    return { healthy, details };
  }
}

// Export utilities
export const circuitBreakerManager = CircuitBreakerFactory.getManager();
export const createCircuitBreaker = CircuitBreakerFactory.create;
export const createCircuitBreakerFromPreset = CircuitBreakerFactory.createFromPreset;

// Common circuit breakers
export const databaseBreaker = CircuitBreakerFactory.createFromPreset(
  'database',
  'strict',
  { name: 'database' }
);

export const externalServiceBreaker = CircuitBreakerFactory.createFromPreset(
  'external-service',
  'moderate',
  { name: 'external-service' }
);

export const aiServiceBreaker = CircuitBreakerFactory.createFromPreset(
  'ai-service',
  'lenient',
  { name: 'ai-service' }
);

export const paymentServiceBreaker = CircuitBreakerFactory.createFromPreset(
  'payment-service',
  'strict',
  { name: 'payment-service' }
);

export const cacheBreaker = CircuitBreakerFactory.createFromPreset(
  'cache',
  'fast',
  { name: 'cache' }
);