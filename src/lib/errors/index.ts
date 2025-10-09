// Base error class for all application errors
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }
}

// Custom Error Classes
export class AuditError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, 'AUDIT_ERROR', 500, details);
  }
}

export class HealthCheckError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, 'HEALTH_CHECK_ERROR', 503, details);
  }
}

export class RetryError extends ApplicationError {
  constructor(message: string, public lastError: Error) {
    super(message, 'RETRY_ERROR', 500, { lastError: lastError.message });
  }
}

export class SecurityError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, 'SECURITY_ERROR', 403, details);
  }
}

export class CircuitBreakerError extends ApplicationError {
  public retryAfter?: number;
  constructor(message: string, retryAfterInSeconds?: number) {
    super(message, 'CIRCUIT_BREAKER_ERROR', 503);
    this.retryAfter = retryAfterInSeconds;
  }
}

// Validation errors
export class ValidationError extends ApplicationError {
  constructor(message: string, public validationErrors: unknown[] = []) {
    super(message, 'VALIDATION_ERROR', 400, { validationErrors });
  }
}

// Authentication errors
export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication failed', details?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
  }
}

// Authorization errors
export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Access denied', details?: unknown) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
  }
}

// Not found errors
export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND_ERROR', 404, { resource, id });
  }
}

// Conflict errors
export class ConflictError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT_ERROR', 409, details);
  }
}

// Rate limit errors
export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR', 429, { retryAfter });
  }
}

// Service unavailable errors
export class ServiceUnavailableError extends ApplicationError {
  constructor(message: string = 'Service temporarily unavailable', public retryAfter?: number) {
    super(message, 'SERVICE_UNAVAILABLE_ERROR', 503, { retryAfter });
  }
}

// Database errors
export class DatabaseError extends ApplicationError {
  constructor(message: string, public query?: string, public parameters?: unknown[]) {
    super(message, 'DATABASE_ERROR', 500, { query, parameters });
  }
}

// External service errors
export class ExternalServiceError extends ApplicationError {
  constructor(
    service: string,
    message: string,
    public serviceError?: unknown,
    public retryAfter?: number
  ) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, { service, serviceError, retryAfter });
  }
}

// Encryption errors
export class EncryptionError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, 'ENCRYPTION_ERROR', 500, details);
  }
}

// Cache errors
export class CacheError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(message, 'CACHE_ERROR', 500, details);
  }
}

// File system errors
export class FileSystemError extends ApplicationError {
  constructor(message: string, public filePath?: string) {
    super(message, 'FILE_SYSTEM_ERROR', 500, { filePath });
  }
}

// Network errors
export class NetworkError extends ApplicationError {
  constructor(message: string, public url?: string, statusCode?: number) {
    super(message, 'NETWORK_ERROR', statusCode || 500, { url, statusCode });
  }
}

// Timeout errors
export class TimeoutError extends ApplicationError {
  constructor(operation: string, public timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms`, 'TIMEOUT_ERROR', 408, { operation, timeoutMs });
  }
}

// Business logic errors
export class BusinessLogicError extends ApplicationError {
  constructor(message: string, public businessCode?: string, details?: unknown) {
    super(message, businessCode || 'BUSINESS_LOGIC_ERROR', 400, details);
  }
}

// Resource exhausted errors
export class ResourceExhaustedError extends ApplicationError {
  constructor(resource: string, public limit?: number, public current?: number) {
    const message = limit ? `${resource} limit exceeded (${current}/${limit})` : `${resource} exhausted`;
    super(message, 'RESOURCE_EXHAUSTED_ERROR', 429, { resource, limit, current });
  }
}

// Invalid state errors
export class InvalidStateError extends ApplicationError {
  constructor(message: string, public expectedState?: string, public actualState?: string) {
    super(message, 'INVALID_STATE_ERROR', 400, { expectedState, actualState });
  }
}

// Configuration errors
export class ConfigurationError extends ApplicationError {
  constructor(message: string, public configKey?: string) {
    super(message, 'CONFIGURATION_ERROR', 500, { configKey });
  }
}

// Dependency errors
export class DependencyError extends ApplicationError {
  constructor(dependency: string, message: string, details?: unknown) {
    super(message, 'DEPENDENCY_ERROR', 503, { dependency, details });
  }
}

// Error handler utility
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: ApplicationError) => void> = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: unknown): ApplicationError {
    let appError: ApplicationError;

    if (error instanceof ApplicationError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new ApplicationError(
        error.message || 'An unexpected error occurred',
        'UNEXPECTED_ERROR',
        500,
        { originalError: error.message, stack: error.stack }
      );
    } else if (typeof error === 'string') {
      appError = new ApplicationError(error, 'UNEXPECTED_ERROR', 500);
    } else {
      appError = new ApplicationError(
        'An unexpected error occurred',
        'UNEXPECTED_ERROR',
        500,
        { originalError: error }
      );
    }

    // Notify error listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(appError);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });

    return appError;
  }

  addErrorListener(listener: (error: ApplicationError) => void): void {
    this.errorListeners.push(listener);
  }

  removeErrorListener(listener: (error: ApplicationError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  // HTTP status code helpers
  getHttpStatusCode(error: ApplicationError): number {
    return error.statusCode;
  }

  isClientError(error: ApplicationError): boolean {
    return error.statusCode >= 400 && error.statusCode < 500;
  }

  isServerError(error: ApplicationError): boolean {
    return error.statusCode >= 500;
  }

  isRetryable(error: ApplicationError): boolean {
    return (
      error instanceof NetworkError ||
      error instanceof TimeoutError ||
      error instanceof ExternalServiceError ||
      error instanceof ServiceUnavailableError ||
      error instanceof CircuitBreakerError
    );
  }

  shouldLogError(error: ApplicationError): boolean {
    return error.isOperational || this.isServerError(error);
  }
}

// Global error handler
export const globalErrorHandler = {
  handle: (error: unknown): ApplicationError => {
    return ErrorHandler.getInstance().handleError(error);
  },

  wrapAsync: <T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T => {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        throw ErrorHandler.getInstance().handleError(error);
      }
    }) as T;
  },

  // Express-style error handler
  expressHandler: (err: unknown, req: unknown, res: unknown, next: unknown) => {
    const error = ErrorHandler.getInstance().handleError(err);
    
    if (ErrorHandler.getInstance().shouldLogError(error)) {
      console.error('Error:', error.toJSON());
    }

    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
        requestId: req.id,
      }
    });
  }
};

// Retry utility with exponential backoff
export class RetryUtil {
  static async withExponentialBackoff<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelayMs?: number;
      maxDelayMs?: number;
      backoffFactor?: number;
      retryableErrors?: string[];
      onRetry?: (attempt: number, error: Error) => void;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelayMs = 1000,
      maxDelayMs = 30000,
      backoffFactor = 2,
      retryableErrors = [],
      onRetry,
    } = options;

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          break;
        }

        // Check if error is retryable
        const isRetryable = 
          retryableErrors.length === 0 ||
          retryableErrors.some(code => 
            error instanceof ApplicationError && error.code === code
          );

        if (!isRetryable && error instanceof ApplicationError) {
          throw error;
        }

        const delay = Math.min(
          initialDelayMs * Math.pow(backoffFactor, attempt),
          maxDelayMs
        );

        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw ErrorHandler.getInstance().handleError(lastError);
  }
}

// Circuit breaker implementation
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private successCount = 0;

  constructor(
    private name: string,
    private options: {
      failureThreshold?: number;
      resetTimeoutMs?: number;
      successThreshold?: number;
      timeoutMs?: number;
    } = {}
  ) {
    this.options = {
      failureThreshold: 5,
      resetTimeoutMs: 60000, // 1 minute
      successThreshold: 3,
      timeoutMs: 30000,
      ...options
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        const retryAfter = this.options.resetTimeoutMs ? Math.ceil((this.options.resetTimeoutMs - (Date.now() - (this.lastFailureTime || 0))) / 1000) : 60;
        throw new CircuitBreakerError(
          `Circuit breaker is OPEN. Try again in ${retryAfter} seconds.`,
          retryAfter
        );
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new TimeoutError(`${this.name} circuit breaker`, this.options.timeoutMs!)), this.options.timeoutMs);
        })
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime !== null &&
           Date.now() - this.lastFailureTime >= this.options.resetTimeoutMs!;
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold!) {
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.options.failureThreshold!) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

// Error tracking for external services
export class ErrorTracker {
  private static errors = new Map<string, number>();
  private static lastErrorTime = new Map<string, number>();

  static recordError(service: string, errorCode: string): void {
    const key = `${service}:${errorCode}`;
    const count = this.errors.get(key) || 0;
    this.errors.set(key, count + 1);
    this.lastErrorTime.set(key, Date.now());
  }

  static getErrorCount(service: string, errorCode: string): number {
    const key = `${service}:${errorCode}`;
    return this.errors.get(key) || 0;
  }

  static getLastErrorTime(service: string, errorCode: string): number | undefined {
    const key = `${service}:${errorCode}`;
    return this.lastErrorTime.get(key);
  }

  static clearErrors(service?: string): void {
    if (service) {
      for (const [key] of this.errors) {
        if (key.startsWith(`${service}:`)) {
          this.errors.delete(key);
          this.lastErrorTime.delete(key);
        }
      }
    } else {
      this.errors.clear();
      this.lastErrorTime.clear();
    }
  }

  static getErrorSummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const [key, count] of this.errors) {
      summary[key] = count;
    }
    return summary;
  }
}

// Export singleton instances
export const errorHandler = ErrorHandler.getInstance();
export const retryUtil = RetryUtil;
export const errorTracker = ErrorTracker;