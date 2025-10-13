// Comprehensive error handling system for Newomen platform
import { APIError, ValidationError } from '@/types/validation';

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  NETWORK = 'NETWORK_ERROR',
  AI_SERVICE = 'AI_SERVICE_ERROR',
  PAYMENT = 'PAYMENT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Custom error class
export class NewomenError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code?: string,
    statusCode: number = 500,
    details?: any,
    requestId?: string
  ) {
    super(message);
    this.name = 'NewomenError';
    this.type = type;
    this.severity = severity;
    this.code = code || type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NewomenError);
    }
  }
}

// Error factory functions
export const ErrorFactory = {
  validation: (message: string, field?: string, details?: any): NewomenError => {
    return new NewomenError(
      message,
      ErrorType.VALIDATION,
      ErrorSeverity.LOW,
      'VALIDATION_FAILED',
      400,
      { field, ...details }
    );
  },

  authentication: (message: string = 'Authentication required'): NewomenError => {
    return new NewomenError(
      message,
      ErrorType.AUTHENTICATION,
      ErrorSeverity.HIGH,
      'AUTH_REQUIRED',
      401
    );
  },

  authorization: (message: string = 'Insufficient permissions'): NewomenError => {
    return new NewomenError(
      message,
      ErrorType.AUTHORIZATION,
      ErrorSeverity.HIGH,
      'ACCESS_DENIED',
      403
    );
  },

  notFound: (resource: string, id?: string): NewomenError => {
    return new NewomenError(
      `${resource}${id ? ` with ID ${id}` : ''} not found`,
      ErrorType.NOT_FOUND,
      ErrorSeverity.MEDIUM,
      'RESOURCE_NOT_FOUND',
      404,
      { resource, id }
    );
  },

  conflict: (message: string, details?: any): NewomenError => {
    return new NewomenError(
      message,
      ErrorType.CONFLICT,
      ErrorSeverity.MEDIUM,
      'CONFLICT',
      409,
      details
    );
  },

  rateLimit: (message: string = 'Rate limit exceeded'): NewomenError => {
    return new NewomenError(
      message,
      ErrorType.RATE_LIMIT,
      ErrorSeverity.MEDIUM,
      'RATE_LIMIT_EXCEEDED',
      429
    );
  },

  network: (message: string, service?: string): NewomenError => {
    return new NewomenError(
      message,
      ErrorType.NETWORK,
      ErrorSeverity.HIGH,
      'NETWORK_ERROR',
      502,
      { service }
    );
  },

  aiService: (message: string, provider?: string, details?: any): NewomenError => {
    return new NewomenError(
      message,
      ErrorType.AI_SERVICE,
      ErrorSeverity.HIGH,
      'AI_SERVICE_ERROR',
      502,
      { provider, ...details }
    );
  },

  payment: (message: string, provider?: string, details?: any): NewomenError => {
    return new NewomenError(
      message,
      ErrorType.PAYMENT,
      ErrorSeverity.HIGH,
      'PAYMENT_ERROR',
      402,
      { provider, ...details }
    );
  },

  database: (message: string, operation?: string): NewomenError => {
    return new NewomenError(
      message,
      ErrorType.DATABASE,
      ErrorSeverity.CRITICAL,
      'DATABASE_ERROR',
      500,
      { operation }
    );
  },

  internal: (message: string, details?: any): NewomenError => {
    return new NewomenError(
      message,
      ErrorType.INTERNAL,
      ErrorSeverity.CRITICAL,
      'INTERNAL_ERROR',
      500,
      details
    );
  },
};

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ error: NewomenError; timestamp: string; context?: any }> = [];

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle and log errors
  public handle(error: Error | NewomenError, context?: any): NewomenError {
    const newomenError = error instanceof NewomenError ? error : this.wrapError(error);
    
    // Log error
    this.logError(newomenError, context);
    
    // Report to monitoring service if critical
    if (newomenError.severity === ErrorSeverity.CRITICAL) {
      this.reportCriticalError(newomenError, context);
    }

    return newomenError;
  }

  // Wrap generic errors
  private wrapError(error: Error): NewomenError {
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return ErrorFactory.validation(error.message);
    }
    
    if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
      return ErrorFactory.authentication(error.message);
    }
    
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      return ErrorFactory.notFound('Resource');
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return ErrorFactory.network(error.message);
    }
    
    return ErrorFactory.internal(error.message);
  }

  // Log error
  private logError(error: NewomenError, context?: any): void {
    this.errorLog.push({
      error,
      timestamp: new Date().toISOString(),
      context,
    });

    // Keep only last 1000 errors
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-1000);
    }

    // Console log based on severity
    const logLevel = this.getLogLevel(error.severity);
    console[logLevel](`[${error.type}] ${error.message}`, {
      code: error.code,
      severity: error.severity,
      details: error.details,
      context,
    });
  }

  // Get console log level based on severity
  private getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  }

  // Report critical errors
  private reportCriticalError(error: NewomenError, context?: any): void {
    // In production, this would send to monitoring service
    console.error('🚨 CRITICAL ERROR REPORTED:', {
      error: error.message,
      type: error.type,
      code: error.code,
      details: error.details,
      context,
      timestamp: error.timestamp,
    });
  }

  // Get error statistics
  public getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: Array<{ error: NewomenError; timestamp: string }>;
  } {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: this.errorLog.slice(-10).map(entry => ({
        error: entry.error,
        timestamp: entry.timestamp,
      })),
    };

    // Initialize counters
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });

    // Count errors
    this.errorLog.forEach(entry => {
      stats.byType[entry.error.type]++;
      stats.bySeverity[entry.error.severity]++;
    });

    return stats;
  }

  // Clear error log
  public clearLog(): void {
    this.errorLog = [];
  }
}

// Error boundary for React components
export class ErrorBoundary extends Error {
  public readonly component: string;
  public readonly props?: any;
  public readonly state?: any;

  constructor(
    message: string,
    component: string,
    props?: any,
    state?: any,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ErrorBoundary';
    this.component = component;
    this.props = props;
    this.state = state;

    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

// Utility functions
export const ErrorUtils = {
  // Check if error is retryable
  isRetryable: (error: NewomenError): boolean => {
    return [
      ErrorType.NETWORK,
      ErrorType.AI_SERVICE,
      ErrorType.DATABASE,
    ].includes(error.type) && error.severity !== ErrorSeverity.CRITICAL;
  },

  // Get user-friendly error message
  getUserMessage: (error: NewomenError): string => {
    switch (error.type) {
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.';
      case ErrorType.AUTHENTICATION:
        return 'Please log in to continue.';
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.';
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorType.CONFLICT:
        return 'This action conflicts with existing data.';
      case ErrorType.RATE_LIMIT:
        return 'Too many requests. Please wait a moment and try again.';
      case ErrorType.NETWORK:
        return 'Network error. Please check your connection and try again.';
      case ErrorType.AI_SERVICE:
        return 'AI service is temporarily unavailable. Please try again later.';
      case ErrorType.PAYMENT:
        return 'Payment processing error. Please try again or contact support.';
      case ErrorType.DATABASE:
        return 'Database error. Please try again later.';
      case ErrorType.INTERNAL:
        return 'An unexpected error occurred. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  },

  // Get error recovery suggestions
  getRecoverySuggestions: (error: NewomenError): string[] => {
    const suggestions: string[] = [];

    switch (error.type) {
      case ErrorType.VALIDATION:
        suggestions.push('Check all required fields are filled');
        suggestions.push('Ensure email format is correct');
        suggestions.push('Verify password meets requirements');
        break;
      case ErrorType.AUTHENTICATION:
        suggestions.push('Try logging in again');
        suggestions.push('Check your credentials');
        suggestions.push('Contact support if problem persists');
        break;
      case ErrorType.NETWORK:
        suggestions.push('Check your internet connection');
        suggestions.push('Try refreshing the page');
        suggestions.push('Wait a moment and try again');
        break;
      case ErrorType.AI_SERVICE:
        suggestions.push('Try again in a few minutes');
        suggestions.push('Check if the service is down');
        suggestions.push('Contact support if issue persists');
        break;
      case ErrorType.PAYMENT:
        suggestions.push('Check your payment method');
        suggestions.push('Try a different payment method');
        suggestions.push('Contact your bank if needed');
        break;
      default:
        suggestions.push('Try refreshing the page');
        suggestions.push('Contact support if problem persists');
    }

    return suggestions;
  },
};

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();

// Export types
export type { NewomenError, ErrorHandler };
