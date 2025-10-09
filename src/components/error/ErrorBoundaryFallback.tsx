import React from 'react';
import { sanitizeError } from '@/lib/security/sanitization';

export interface ErrorBoundaryFallbackProps {
  error: Error;
  reset: () => void;
  retry?: () => void;
  retryCount?: number;
  maxRetries?: number;
  isRetrying?: boolean;
  onReportError?: () => void;
  environment?: 'development' | 'staging' | 'production';
}

export function ErrorBoundaryFallback({
  error,
  reset,
  retry,
  retryCount = 0,
  maxRetries = 3,
  isRetrying = false,
  onReportError,
  environment = 'production'
}: ErrorBoundaryFallbackProps) {
  const sanitizedError = sanitizeError(error);
  const canRetry = retry && retryCount < maxRetries;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Something went wrong
          </h2>
          
          <p className="text-gray-600 mb-6">
            {environment === 'development' 
              ? sanitizedError.message 
              : 'We apologize for the inconvenience. Please try again or contact support if the problem persists.'
            }
          </p>

          {environment === 'development' && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-auto max-h-32">
                {sanitizedError.stack}
              </pre>
            </details>
          )}

          <div className="space-y-3">
            {canRetry && (
              <button
                onClick={retry}
                disabled={isRetrying}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isRetrying ? 'Retrying...' : `Retry (${retryCount}/${maxRetries})`}
              </button>
            )}
            
            <button
              onClick={reset}
              className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset
            </button>

            {onReportError && (
              <button
                onClick={onReportError}
                className="w-full bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                Report Error
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundaryFallbackMinimal({
  error,
  reset,
  retry,
  retryCount = 0,
  maxRetries = 3,
  isRetrying = false,
  onReportError
}: ErrorBoundaryFallbackProps) {
  const canRetry = retry && retryCount < maxRetries;

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error.message}</p>
          </div>
          <div className="mt-4 flex space-x-3">
            {canRetry && (
              <button
                onClick={retry}
                disabled={isRetrying}
                className="text-sm font-medium text-red-800 hover:text-red-700 disabled:opacity-50"
              >
                {isRetrying ? 'Retrying...' : 'Retry'}
              </button>
            )}
            <button
              onClick={reset}
              className="text-sm font-medium text-red-800 hover:text-red-700"
            >
              Reset
            </button>
            {onReportError && (
              <button
                onClick={onReportError}
                className="text-sm font-medium text-red-800 hover:text-red-700"
              >
                Report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundaryFallbackCompact({
  error,
  reset,
  retry,
  retryCount = 0,
  maxRetries = 3,
  isRetrying = false
}: ErrorBoundaryFallbackProps) {
  const canRetry = retry && retryCount < maxRetries;

  return (
    <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-md p-3">
      <div className="flex items-center space-x-2">
        <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-red-700">{error.message}</span>
      </div>
      <div className="flex items-center space-x-2">
        {canRetry && (
          <button
            onClick={retry}
            disabled={isRetrying}
            className="text-xs text-red-800 hover:text-red-700 disabled:opacity-50"
          >
            {isRetrying ? '...' : 'Retry'}
          </button>
        )}
        <button
          onClick={reset}
          className="text-xs text-red-800 hover:text-red-700"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export function ErrorBoundaryFallbackInline({
  error,
  reset,
  retry,
  retryCount = 0,
  maxRetries = 3,
  isRetrying = false
}: ErrorBoundaryFallbackProps) {
  const canRetry = retry && retryCount < maxRetries;

  return (
    <span className="inline-flex items-center space-x-2 text-sm text-red-600">
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <span>{error.message}</span>
      {canRetry && (
        <button
          onClick={retry}
          disabled={isRetrying}
          className="text-red-800 hover:text-red-700 disabled:opacity-50"
        >
          {isRetrying ? '...' : 'Retry'}
        </button>
      )}
      <button
        onClick={reset}
        className="text-red-800 hover:text-red-700"
      >
        Reset
      </button>
    </span>
  );
}

// Loading fallback for retry states
export function ErrorBoundaryLoadingFallback({
  message = 'Retrying...'
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex items-center space-x-2 text-gray-600">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}

// Skeleton fallback for error states
export function ErrorBoundarySkeletonFallback() {
  return (
    <div className="animate-pulse">
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="h-5 w-5 bg-red-300 rounded"></div>
          </div>
          <div className="ml-3 flex-1">
            <div className="h-4 bg-red-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-red-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty state fallback
export function ErrorBoundaryEmptyFallback({
  title = 'Something went wrong',
  message = 'Please try again or contact support if the problem persists.',
  onRetry,
  onReset
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onReset?: () => void;
}) {
  return (
    <div className="text-center py-8">
      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      <div className="mt-6 space-x-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        )}
        {onReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}