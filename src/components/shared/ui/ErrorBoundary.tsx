import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logging';
import { ErrorBoundaryFallback } from './ErrorBoundaryFallback';
import { ErrorReportDialog } from './ErrorReportDialog';

// Helper function to sanitize error objects for logging
function sanitizeError(error: Error): Error {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  } as Error;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ 
    error: Error; 
    reset: () => void;
    retry?: () => void;
    retryCount?: number;
    maxRetries?: number;
    isRetrying?: boolean;
    onReportError?: () => void;
    environment?: 'development' | 'staging' | 'production';
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetOnPropsChange?: boolean;
  resetOnLocationChange?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  showErrorReport?: boolean;
  environment?: 'development' | 'staging' | 'production';
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  showReportDialog: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeout: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private location: string = '';

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      showReportDialog: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const sanitizedError = sanitizeError(error);
    
    logger.error('ErrorBoundary caught an error', {
      error: sanitizedError,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      maxRetries: this.props.maxRetries,
      environment: this.props.environment
    });

    this.setState({ errorInfo });

    // Report to error tracking service
    this.reportError(sanitizedError, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(sanitizedError, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset on props change if enabled
    if (this.props.resetOnPropsChange && prevProps.children !== this.props.children) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: 0,
        isRetrying: false,
        showReportDialog: false
      });
    }

    // Reset on location change if enabled
    if (this.props.resetOnLocationChange && this.location !== window.location.href) {
      this.location = window.location.href;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: 0,
        isRetrying: false,
        showReportDialog: false
      });
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo): void {
    // In a real application, this would integrate with Sentry, Bugsnag, etc.
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: this.props.environment || 'production',
      retryCount: this.state.retryCount
    };

    // Send to error tracking service
    logger.info('Error report prepared', errorReport);

    // In production, you would send this to your error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  private handleRetry = async (): Promise<void> => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      logger.warn('Max retries reached', { maxRetries, retryCount });
      return;
    }

    this.setState({ isRetrying: true });

    try {
      // Wait before retrying
      await new Promise(resolve => {
        this.retryTimeout = setTimeout(resolve, retryDelay * Math.pow(2, retryCount));
      });

      this.setState(prevState => ({
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
        hasError: false,
        error: null,
        errorInfo: null
      }));

      logger.info('Error boundary retrying', { retryCount: retryCount + 1 });
    } catch (error) {
      logger.error('Error during retry', { error });
      this.setState({ isRetrying: false });
    }
  };

  private handleReset = (): void => {
    const { onReset } = this.props;

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      showReportDialog: false
    });

    if (onReset) {
      onReset();
    }

    logger.info('Error boundary reset');
  };

  private handleReportError = (): void => {
    this.setState({ showReportDialog: true });
  };

  private handleCloseReportDialog = (): void => {
    this.setState({ showReportDialog: false });
  };

  private handleSubmitErrorReport = (report: {
    email: string;
    description: string;
    allowContact: boolean;
  }): void => {
    // Submit error report
    const errorReport = {
      email: report.email,
      description: report.description,
      allowContact: report.allowContact,
      error: this.state.error,
      errorInfo: this.state.errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    logger.info('Error report submitted', errorReport);

    // In production, send this to your backend
    // Example: await fetch('/api/error-reports', { method: 'POST', body: JSON.stringify(errorReport) });

    this.setState({ showReportDialog: false });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo, retryCount, isRetrying, showReportDialog } = this.state;
    const { children, fallback, maxRetries = 3, showErrorReport = true } = this.props;

    if (hasError && error) {
      const FallbackComponent = fallback || ErrorBoundaryFallback;

      return (
        <>
          <FallbackComponent
            error={error}
            reset={this.handleReset}
            retry={this.handleRetry}
            retryCount={retryCount}
            maxRetries={maxRetries}
            isRetrying={isRetrying}
            onReportError={showErrorReport ? this.handleReportError : undefined}
            environment={this.props.environment}
          />
          
          {showReportDialog && (
            <ErrorReportDialog
              error={error}
              onClose={this.handleCloseReportDialog}
              onSubmit={this.handleSubmitErrorReport}
            />
          )}
        </>
      );
    }

    return children;
  }
}

// Global error boundary for the entire application
export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      showReportDialog: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Global error boundary caught an error', {
      error: sanitizeError(error),
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });

    // Critical error handling - could show a full-page error
    this.setState({ errorInfo });
  }

  render(): ReactNode {
    const { hasError, error } = this.state;

    if (hasError && error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Application Error</h2>
              <p className="text-gray-600 mb-4">
                Something went wrong. Please refresh the page or contact support if the problem persists.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary context
// eslint-disable-next-line react-refresh/only-export-components
export function useErrorBoundary(): {
  reset: () => void;
  reportError: (error: Error) => void;
} {
  const reset = () => {
    // This would be implemented with React Context in a real app
    window.location.reload();
  };

  const reportError = (error: Error) => {
    logger.error('Error reported from hook', { error: sanitizeError(error) });
  };

  return { reset, reportError };
}

// Error boundary wrapper for async components
// eslint-disable-next-line react-refresh/only-export-components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Error boundary for specific routes
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Route Error</h2>
            <p className="text-gray-600 mb-4">This page encountered an error.</p>
            <button
              onClick={reset}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      environment={import.meta.env.MODE as 'development' | 'staging' | 'production'}
    >
      {children}
    </ErrorBoundary>
  );
}

// Error boundary for API calls
export function APIErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">API Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Failed to load data. Please try again later.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Error boundary for form components
export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Form Error</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Something went wrong with this form. Please refresh and try again.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={reset}
                  className="text-sm font-medium text-yellow-800 hover:text-yellow-700"
                >
                  Try again →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Error boundary for real-time features
export function RealtimeErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800">Connection Error</h3>
              <div className="mt-2 text-sm text-purple-700">
                <p>Real-time connection lost. Reconnecting...</p>
              </div>
            </div>
          </div>
        </div>
      )}
      maxRetries={5}
      retryDelay={2000}
    >
      {children}
    </ErrorBoundary>
  );
}

// Error boundary for AI features
export function AIErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-indigo-800">AI Service Error</h3>
              <div className="mt-2 text-sm text-indigo-700">
                <p>The AI service is temporarily unavailable. Please try again in a few moments.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={reset}
                  className="text-sm font-medium text-indigo-800 hover:text-indigo-700"
                >
                  Retry →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      maxRetries={3}
      retryDelay={3000}
    >
      {children}
    </ErrorBoundary>
  );
}

// Error boundary for payment features
export function PaymentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Payment Error</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Payment processing failed. Please try a different payment method or contact support.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      maxRetries={1}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;