import React, { Component, ReactNode } from 'react';
import { ErrorDisplay } from '@/components/ui/error-display';
import { AppError, ErrorBoundaryState, ErrorInfo, createAppError } from '@/lib/errors/types';
import { ApiErrorType } from '@/types/api';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, retry: () => void) => ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  showTechnicalDetails?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundarySnapshot {
  resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Convert the error to our AppError format
    const appError = createAppError(
      ApiErrorType.VALIDATION_ERROR, // Default type, can be refined based on error analysis
      error
    );

    return {
      hasError: true,
      error: appError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const appError = this.analyzeError(error);
    const customErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack || '',
      errorBoundary: this.constructor.name,
    };

    this.setState({
      error: appError,
      errorInfo: customErrorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(appError, customErrorInfo);
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  getSnapshotBeforeUpdate(prevProps: ErrorBoundaryProps): ErrorBoundarySnapshot | null {
    const { resetKeys } = this.props;
    const { resetKeys: prevResetKeys } = prevProps;
    
    if (resetKeys && prevResetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => key !== prevResetKeys[index]);
      if (hasResetKeyChanged) {
        return { resetKeys };
      }
    }
    
    return null;
  }

  componentDidUpdate(_prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState, snapshot: ErrorBoundarySnapshot | null) {
    const { hasError } = this.state;
    const { hasError: prevHasError } = prevState;
    
    // Reset error state if resetKeys changed
    if (snapshot?.resetKeys && hasError && prevHasError) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private analyzeError(error: Error): AppError {
    // Analyze the error to determine the appropriate type
    let errorType = ApiErrorType.VALIDATION_ERROR;

    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      errorType = ApiErrorType.NETWORK_ERROR;
    } else if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Network error')) {
      errorType = ApiErrorType.NETWORK_ERROR;
    } else if (error.message.includes('timeout')) {
      errorType = ApiErrorType.TIMEOUT_ERROR;
    } else if (error.message.includes('database') || error.message.includes('sql')) {
      errorType = ApiErrorType.DATABASE_ERROR;
    } else if (error.message.includes('auth')) {
      errorType = ApiErrorType.AUTHENTICATION_ERROR;
    }

    return createAppError(errorType, error);
  }

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
    }));

    // Reset the error boundary after a short delay
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, 100);
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, showTechnicalDetails = false, maxRetries = 3 } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Check if we've exceeded max retries
      const canRetry = error.retryable && retryCount < maxRetries;

      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <ErrorDisplay
              error={error}
              onRetry={canRetry ? this.handleRetry : undefined}
              showTechnicalDetails={showTechnicalDetails}
            />
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Retry attempt {retryCount} of {maxRetries}
              </p>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

// Hook-based error boundary for functional components
interface UseErrorBoundaryReturn {
  resetError: () => void;
  captureError: (error: Error) => void;
}

export function useErrorBoundary(): UseErrorBoundaryReturn {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { resetError, captureError };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}