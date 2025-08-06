import React, { ReactNode, useCallback, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorDisplay, InlineError } from '@/components/ui/error-display';
import { AppError, createAppError } from '@/lib/errors/types';
import { ApiErrorType } from '@/types/api';
import { withRetry } from '@/lib/utils/retry';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => Promise<void>;
  fallbackComponent?: React.ComponentType<AsyncErrorFallbackProps>;
  showTechnicalDetails?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

interface AsyncErrorFallbackProps {
  error: AppError;
  retry: () => void;
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
}

interface AsyncErrorState {
  error: AppError | null;
  isRetrying: boolean;
  retryCount: number;
}

export function AsyncErrorBoundary({
  children,
  onRetry,
  fallbackComponent: FallbackComponent,
  showTechnicalDetails = false,
  maxRetries = 3,
  retryDelay = 1000,
}: AsyncErrorBoundaryProps) {
  const [asyncError, setAsyncError] = useState<AsyncErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
  });

  const handleAsyncError = useCallback((error: Error) => {
    const appError = createAppError(
      error.name === 'TypeError' ? ApiErrorType.NETWORK_ERROR : ApiErrorType.DATABASE_ERROR,
      error
    );

    setAsyncError(prev => ({
      error: appError,
      isRetrying: false,
      retryCount: prev.retryCount,
    }));
  }, []);

  const handleRetry = useCallback(async () => {
    if (!asyncError.error || asyncError.retryCount >= maxRetries) {
      return;
    }

    setAsyncError(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      if (onRetry) {
        await withRetry(onRetry, {
          maxAttempts: 1,
          backoffMs: retryDelay,
          exponential: false,
        });
      }

      // Clear error on successful retry
      setAsyncError({
        error: null,
        isRetrying: false,
        retryCount: 0,
      });
    } catch (error) {
      const retryError = createAppError(
        ApiErrorType.NETWORK_ERROR,
        error instanceof Error ? error : new Error('Retry failed')
      );

      setAsyncError(prev => ({
        error: retryError,
        isRetrying: false,
        retryCount: prev.retryCount,
      }));
    }
  }, [asyncError.error, asyncError.retryCount, maxRetries, onRetry, retryDelay]);

  const resetError = useCallback(() => {
    setAsyncError({
      error: null,
      isRetrying: false,
      retryCount: 0,
    });
  }, []);

  // Provide error context to children
  const errorContext = React.useMemo(() => ({
    captureError: handleAsyncError,
    resetError,
    hasError: !!asyncError.error,
    isRetrying: asyncError.isRetrying,
  }), [handleAsyncError, resetError, asyncError.error, asyncError.isRetrying]);

  // Render async error if present
  if (asyncError.error) {
    const canRetry = asyncError.error.retryable && asyncError.retryCount < maxRetries;

    if (FallbackComponent) {
      return (
        <FallbackComponent
          error={asyncError.error}
          retry={handleRetry}
          isRetrying={asyncError.isRetrying}
          retryCount={asyncError.retryCount}
          maxRetries={maxRetries}
        />
      );
    }

    return (
      <div className="p-4">
        <ErrorDisplay
          error={asyncError.error}
          onRetry={canRetry && !asyncError.isRetrying ? handleRetry : undefined}
          showTechnicalDetails={showTechnicalDetails}
        />
        {asyncError.retryCount > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Retry attempt {asyncError.retryCount} of {maxRetries}
          </p>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error) => handleAsyncError(new Error(error.message))}
      showTechnicalDetails={showTechnicalDetails}
      maxRetries={maxRetries}
    >
      <AsyncErrorContext.Provider value={errorContext}>
        {children}
      </AsyncErrorContext.Provider>
    </ErrorBoundary>
  );
}

// Context for async error handling
interface AsyncErrorContextValue {
  captureError: (error: Error) => void;
  resetError: () => void;
  hasError: boolean;
  isRetrying: boolean;
}

const AsyncErrorContext = React.createContext<AsyncErrorContextValue | null>(null);

export function useAsyncError() {
  const context = React.useContext(AsyncErrorContext);
  if (!context) {
    throw new Error('useAsyncError must be used within an AsyncErrorBoundary');
  }
  return context;
}

// Hook for handling async operations with error boundary
export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const { captureError } = useAsyncError();

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await operation();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setState(prev => ({ ...prev, loading: false, error: errorObj }));
      captureError(errorObj);
      throw errorObj;
    }
  }, [operation, captureError]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Default fallback component for async errors
export function DefaultAsyncErrorFallback({
  error,
  retry,
  isRetrying,
  retryCount,
  maxRetries,
}: AsyncErrorFallbackProps) {
  const canRetry = error.retryable && retryCount < maxRetries;

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
      <div className="max-w-md w-full space-y-4">
        <InlineError
          message={error.userMessage}
          onRetry={canRetry && !isRetrying ? retry : undefined}
        />
        
        {retryCount > 0 && (
          <p className="text-sm text-gray-500 text-center">
            {isRetrying ? 'Retrying...' : `Attempt ${retryCount} of ${maxRetries}`}
          </p>
        )}
        
        {!canRetry && retryCount >= maxRetries && (
          <p className="text-sm text-red-600 text-center">
            Maximum retry attempts reached. Please refresh the page or contact support.
          </p>
        )}
      </div>
    </div>
  );
}