/**
 * Comprehensive Error Handling Service
 * Production-ready error management with logging, reporting, and user feedback
 */

import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  UI = 'ui',
  INTEGRATION = 'integration',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorDetails {
  message: string;
  stack?: string;
  code?: string | number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  userFriendlyMessage?: string;
  suggestedAction?: string;
  isRetryable: boolean;
  shouldReport: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorQueue: ErrorDetails[] = [];
  private isReporting = false;
  private retryConfigs = new Map<ErrorCategory, RetryConfig>();

  static getInstance(): ErrorHandlingService {
    if (!this.instance) {
      this.instance = new ErrorHandlingService();
    }
    return this.instance;
  }

  constructor() {
    this.setupDefaultRetryConfigs();
    this.setupGlobalErrorHandlers();
    this.startErrorReporting();
  }

  private setupDefaultRetryConfigs(): void {
    // Network errors are often transient
    this.retryConfigs.set(ErrorCategory.NETWORK, {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2
    });

    // Database errors might be due to temporary issues
    this.retryConfigs.set(ErrorCategory.DATABASE, {
      maxAttempts: 2,
      baseDelayMs: 2000,
      maxDelayMs: 8000,
      backoffMultiplier: 2
    });

    // Auth errors usually need user intervention
    this.retryConfigs.set(ErrorCategory.AUTHENTICATION, {
      maxAttempts: 1,
      baseDelayMs: 0,
      maxDelayMs: 0,
      backoffMultiplier: 1
    });

    // Integration errors might recover
    this.retryConfigs.set(ErrorCategory.INTEGRATION, {
      maxAttempts: 2,
      baseDelayMs: 1500,
      maxDelayMs: 6000,
      backoffMultiplier: 2
    });

    // Default config for other error types
    const defaultConfig: RetryConfig = {
      maxAttempts: 1,
      baseDelayMs: 1000,
      maxDelayMs: 3000,
      backoffMultiplier: 1.5
    };

    [ErrorCategory.VALIDATION, ErrorCategory.BUSINESS_LOGIC, ErrorCategory.UI, 
     ErrorCategory.PERFORMANCE, ErrorCategory.SECURITY, ErrorCategory.UNKNOWN]
      .forEach(category => {
        this.retryConfigs.set(category, defaultConfig);
      });
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        component: 'Global',
        action: 'unhandled_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        component: 'Global',
        action: 'unhandled_rejection'
      });
    });
  }

  private startErrorReporting(): void {
    // Process error queue every 30 seconds
    setInterval(() => {
      this.processErrorQueue();
    }, 30000);
  }

  // Main error handling method
  handleError(error: Error | unknown, context: Partial<ErrorContext> = {}): ErrorDetails {
    const errorDetails = this.analyzeError(error, context);
    
    // Log error locally
    this.logError(errorDetails);
    
    // Show user-friendly message
    this.showUserFeedback(errorDetails);
    
    // Queue for reporting if necessary
    if (errorDetails.shouldReport) {
      this.queueErrorForReporting(errorDetails);
    }

    return errorDetails;
  }

  // Analyze error and categorize it
  private analyzeError(error: Error | unknown, context: Partial<ErrorContext>): ErrorDetails {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    // Determine category and severity
    const { category, severity } = this.categorizeError(errorMessage, stack);
    
    // Build context
    const fullContext: ErrorContext = {
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      ...context
    };

    // Generate user-friendly message
    const { userFriendlyMessage, suggestedAction } = this.generateUserFriendlyMessage(category, errorMessage);

    return {
      message: errorMessage,
      stack,
      severity,
      category,
      context: fullContext,
      userFriendlyMessage,
      suggestedAction,
      isRetryable: this.isRetryableError(category, errorMessage),
      shouldReport: this.shouldReportError(severity, category)
    };
  }

  private categorizeError(message: string, stack?: string): { category: ErrorCategory; severity: ErrorSeverity } {
    const lowerMessage = message.toLowerCase();
    const lowerStack = stack?.toLowerCase() || '';
    
    // Network errors
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || 
        lowerMessage.includes('timeout') || lowerMessage.includes('connection')) {
      return { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM };
    }

    // Database errors
    if (lowerMessage.includes('database') || lowerMessage.includes('sql') || 
        lowerMessage.includes('supabase') || lowerMessage.includes('postgres')) {
      return { category: ErrorCategory.DATABASE, severity: ErrorSeverity.HIGH };
    }

    // Authentication errors
    if (lowerMessage.includes('auth') || lowerMessage.includes('login') || 
        lowerMessage.includes('unauthorized') || lowerMessage.includes('forbidden')) {
      return { category: ErrorCategory.AUTHENTICATION, severity: ErrorSeverity.MEDIUM };
    }

    // Validation errors
    if (lowerMessage.includes('validation') || lowerMessage.includes('required') || 
        lowerMessage.includes('invalid') || lowerMessage.includes('format')) {
      return { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.LOW };
    }

    // Integration errors (AI services, etc.)
    if (lowerMessage.includes('openai') || lowerMessage.includes('api key') || 
        lowerMessage.includes('rate limit') || lowerMessage.includes('quota')) {
      return { category: ErrorCategory.INTEGRATION, severity: ErrorSeverity.MEDIUM };
    }

    // Security errors
    if (lowerMessage.includes('csrf') || lowerMessage.includes('xss') || 
        lowerMessage.includes('security') || lowerMessage.includes('permission')) {
      return { category: ErrorCategory.SECURITY, severity: ErrorSeverity.CRITICAL };
    }

    // Performance errors
    if (lowerMessage.includes('memory') || lowerMessage.includes('performance') || 
        lowerMessage.includes('slow') || lowerMessage.includes('timeout')) {
      return { category: ErrorCategory.PERFORMANCE, severity: ErrorSeverity.MEDIUM };
    }

    // UI errors
    if (lowerStack.includes('react') || lowerMessage.includes('render') || 
        lowerMessage.includes('component')) {
      return { category: ErrorCategory.UI, severity: ErrorSeverity.LOW };
    }

    // Default categorization
    return { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM };
  }

  private generateUserFriendlyMessage(category: ErrorCategory, originalMessage: string): {
    userFriendlyMessage: string;
    suggestedAction: string;
  } {
    switch (category) {
      case ErrorCategory.NETWORK:
        return {
          userFriendlyMessage: 'Connection issue detected. Please check your internet connection.',
          suggestedAction: 'Try again in a moment or check your network settings.'
        };

      case ErrorCategory.DATABASE:
        return {
          userFriendlyMessage: 'We\'re experiencing a temporary issue saving your data.',
          suggestedAction: 'Your work has been saved locally. Please try again shortly.'
        };

      case ErrorCategory.AUTHENTICATION:
        return {
          userFriendlyMessage: 'Authentication issue detected.',
          suggestedAction: 'Please log out and sign back in.'
        };

      case ErrorCategory.VALIDATION:
        return {
          userFriendlyMessage: 'Please check your input and try again.',
          suggestedAction: 'Make sure all required fields are filled correctly.'
        };

      case ErrorCategory.INTEGRATION:
        return {
          userFriendlyMessage: 'External service temporarily unavailable.',
          suggestedAction: 'Some features may be limited. Please try again later.'
        };

      case ErrorCategory.PERFORMANCE:
        return {
          userFriendlyMessage: 'The app is running slowly.',
          suggestedAction: 'Try refreshing the page or closing other browser tabs.'
        };

      case ErrorCategory.SECURITY:
        return {
          userFriendlyMessage: 'Security issue detected.',
          suggestedAction: 'Please refresh the page and try again.'
        };

      default:
        return {
          userFriendlyMessage: 'Something went wrong. We\'re working to fix it.',
          suggestedAction: 'Please try again or contact support if the issue persists.'
        };
    }
  }

  private isRetryableError(category: ErrorCategory, message: string): boolean {
    const retryableCategories = [ErrorCategory.NETWORK, ErrorCategory.DATABASE, ErrorCategory.INTEGRATION];
    
    if (retryableCategories.includes(category)) {
      // Check for specific non-retryable messages
      const nonRetryableKeywords = ['invalid', 'unauthorized', 'forbidden', 'not found'];
      return !nonRetryableKeywords.some(keyword => message.toLowerCase().includes(keyword));
    }

    return false;
  }

  private shouldReportError(severity: ErrorSeverity, category: ErrorCategory): boolean {
    // Always report critical errors
    if (severity === ErrorSeverity.CRITICAL) return true;
    
    // Report high severity errors except for known client-side issues
    if (severity === ErrorSeverity.HIGH && category !== ErrorCategory.UI) return true;
    
    // Report medium severity errors for important categories
    if (severity === ErrorSeverity.MEDIUM && 
        [ErrorCategory.DATABASE, ErrorCategory.INTEGRATION, ErrorCategory.SECURITY].includes(category)) {
      return true;
    }

    return false;
  }

  private logError(errorDetails: ErrorDetails): void {
    const logLevel = this.getLogLevel(errorDetails.severity);
    
    console.group(`🚨 ${errorDetails.severity.toUpperCase()} Error - ${errorDetails.category}`);
    console[logLevel]('Message:', errorDetails.message);
    if (errorDetails.stack) {
      console[logLevel]('Stack:', errorDetails.stack);
    }
    console.log('Context:', errorDetails.context);
    console.log('User Message:', errorDetails.userFriendlyMessage);
    console.log('Suggested Action:', errorDetails.suggestedAction);
    console.groupEnd();
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
      default:
        return 'info';
    }
  }

  private showUserFeedback(errorDetails: ErrorDetails): void {
    const toastConfig = {
      description: errorDetails.suggestedAction,
      duration: this.getToastDuration(errorDetails.severity),
    };

    switch (errorDetails.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        toast.error(errorDetails.userFriendlyMessage, toastConfig);
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(errorDetails.userFriendlyMessage, toastConfig);
        break;
      case ErrorSeverity.LOW:
        toast.info(errorDetails.userFriendlyMessage, toastConfig);
        break;
    }
  }

  private getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 10000; // 10 seconds
      case ErrorSeverity.HIGH:
        return 7000;  // 7 seconds
      case ErrorSeverity.MEDIUM:
        return 5000;  // 5 seconds
      case ErrorSeverity.LOW:
      default:
        return 3000;  // 3 seconds
    }
  }

  private queueErrorForReporting(errorDetails: ErrorDetails): void {
    this.errorQueue.push(errorDetails);
    
    // If queue is getting large, process immediately
    if (this.errorQueue.length > 10) {
      this.processErrorQueue();
    }
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isReporting || this.errorQueue.length === 0) return;
    
    this.isReporting = true;
    const errorsToReport = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await this.reportErrors(errorsToReport);
    } catch (reportingError) {
      console.error('Failed to report errors:', reportingError);
      // Re-queue errors for next attempt
      this.errorQueue.unshift(...errorsToReport);
    } finally {
      this.isReporting = false;
    }
  }

  private async reportErrors(errors: ErrorDetails[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_reports')
        .insert(
          errors.map(errorDetails => ({
            message: errorDetails.message,
            stack: errorDetails.stack,
            severity: errorDetails.severity,
            category: errorDetails.category,
            context: errorDetails.context,
            user_id: errorDetails.context.userId,
            session_id: errorDetails.context.sessionId,
            created_at: errorDetails.context.timestamp
          }))
        );

      if (error) {
        console.error('Failed to report errors to database:', error);
      } else {
        console.log(`Successfully reported ${errors.length} errors`);
      }
    } catch (error) {
      console.error('Error reporting failed:', error);
      throw error;
    }
  }

  // Retry mechanism with exponential backoff
  async retry<T>(
    operation: () => Promise<T>,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    const retryConfig = this.retryConfigs.get(category)!;
    let lastError: Error;
    
    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry if it's not a retryable error
        if (!this.isRetryableError(category, lastError.message)) {
          throw lastError;
        }
        
        // Don't wait after the last attempt
        if (attempt < retryConfig.maxAttempts) {
          const delay = Math.min(
            retryConfig.baseDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1),
            retryConfig.maxDelayMs
          );
          
          console.log(`Retry attempt ${attempt}/${retryConfig.maxAttempts} in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed, handle the final error
    this.handleError(lastError!, {
      ...context,
      component: context.component || 'RetryMechanism',
      action: 'max_retries_exceeded',
      metadata: {
        attempts: retryConfig.maxAttempts,
        category
      }
    });
    
    throw lastError!;
  }

  // Utility methods
  private getCurrentUserId(): string | undefined {
    try {
      // Synchronously get cached user session from Supabase
      const session = supabase.auth.getSession();
      // If session is available synchronously (from cache), return user ID
      if (session && typeof session === 'object' && 'then' in session) {
        // It's a promise, return undefined and let async context handle it
        return undefined;
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server-side';
    
    let sessionId = sessionStorage.getItem('error-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error-session-id', sessionId);
    }
    return sessionId;
  }

  // Public utility methods
  captureException(error: Error, context?: Partial<ErrorContext>): void {
    this.handleError(error, context);
  }

  captureMessage(message: string, severity: ErrorSeverity = ErrorSeverity.LOW, context?: Partial<ErrorContext>): void {
    this.handleError(new Error(message), {
      ...context,
      metadata: { ...context?.metadata, severity }
    });
  }

  // Health check
  getHealthStatus(): {
    isHealthy: boolean;
    queueSize: number;
    isReporting: boolean;
    lastReportTime?: string;
  } {
    return {
      isHealthy: this.errorQueue.length < 50, // Arbitrary threshold
      queueSize: this.errorQueue.length,
      isReporting: this.isReporting,
      lastReportTime: localStorage.getItem('last-error-report-time') || undefined
    };
  }
}

// Export singleton instance
export const errorHandler = ErrorHandlingService.getInstance();

// Convenience functions
export const handleError = (error: Error | unknown, context?: Partial<ErrorContext>) => 
  errorHandler.handleError(error, context);

export const captureException = (error: Error, context?: Partial<ErrorContext>) => 
  errorHandler.captureException(error, context);

export const captureMessage = (message: string, severity?: ErrorSeverity, context?: Partial<ErrorContext>) => 
  errorHandler.captureMessage(message, severity, context);

export const retryOperation = <T>(
  operation: () => Promise<T>, 
  category?: ErrorCategory, 
  context?: Partial<ErrorContext>
) => errorHandler.retry(operation, category, context);
