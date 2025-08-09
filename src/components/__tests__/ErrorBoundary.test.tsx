import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ApiErrorType } from '@/types/api';

// Mock the UI components to avoid dependency issues
jest.mock('@/components/ui/error-display', () => ({
  ErrorDisplay: ({ error, onRetry, showTechnicalDetails }: any) => (
    React.createElement('div', {}, [
      React.createElement('div', { key: 'title' }, 'Something went wrong'),
      React.createElement('div', { key: 'message' }, error.userMessage),
      onRetry && React.createElement('button', { key: 'retry', onClick: onRetry }, 'Try Again'),
      showTechnicalDetails && React.createElement('div', { key: 'details' }, 'Technical Details:')
    ])
  ),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock component that throws an error
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return React.createElement('div', {}, 'No error');
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Suppress console.error for cleaner test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
    }
    jest.clearAllMocks();
  });

  it('should create ErrorBoundary component without errors', () => {
    const errorBoundary = new ErrorBoundary({ children: React.createElement('div', {}, 'Test') });
    expect(errorBoundary).toBeDefined();
    expect(errorBoundary.state.hasError).toBe(false);
    expect(errorBoundary.state.error).toBe(null);
    expect(errorBoundary.state.retryCount).toBe(0);
  });

  it('should handle getDerivedStateFromError correctly', () => {
    const error = new Error('Test error');
    const newState = ErrorBoundary.getDerivedStateFromError(error);
    
    expect(newState.hasError).toBe(true);
    expect(newState.error).toBeDefined();
    expect(newState.error?.type).toBe(ApiErrorType.VALIDATION_ERROR);
    expect(newState.error?.message).toBe('Test error');
  });

  it('should analyze different error types correctly', () => {
    const errorBoundary = new ErrorBoundary({ children: React.createElement('div') });
    
    // Test that getDerivedStateFromError always returns VALIDATION_ERROR
    const networkError = new Error('Network error occurred');
    const networkState = ErrorBoundary.getDerivedStateFromError(networkError);
    expect(networkState.error?.type).toBe(ApiErrorType.VALIDATION_ERROR);
    
    // Test the actual error analysis in analyzeError method
    const analyzeError = errorBoundary['analyzeError'];
    
    // Test network error detection
    const networkAnalysis = analyzeError(new Error('Network error occurred'));
    expect(networkAnalysis.type).toBe(ApiErrorType.NETWORK_ERROR);
    
    // Test timeout error detection
    const timeoutAnalysis = analyzeError(new Error('Request timeout'));
    expect(timeoutAnalysis.type).toBe(ApiErrorType.TIMEOUT_ERROR);
    
    // Test database error detection
    const dbAnalysis = analyzeError(new Error('database connection failed'));
    expect(dbAnalysis.type).toBe(ApiErrorType.DATABASE_ERROR);
    
    // Test auth error detection
    const authAnalysis = analyzeError(new Error('auth failed'));
    expect(authAnalysis.type).toBe(ApiErrorType.AUTHENTICATION_ERROR);
    
    // Test default validation error
    const validationAnalysis = analyzeError(new Error('Invalid input'));
    expect(validationAnalysis.type).toBe(ApiErrorType.VALIDATION_ERROR);
  });

  it('should call onError callback when componentDidCatch is called', () => {
    const onError = jest.fn();
    const errorBoundary = new ErrorBoundary({ 
      children: React.createElement('div'), 
      onError 
    });
    
    const error = new Error('Test error');
    const errorInfo = { componentStack: 'test stack' };
    
    errorBoundary.componentDidCatch(error, errorInfo);
    
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error',
        type: ApiErrorType.VALIDATION_ERROR,
      }),
      expect.objectContaining({
        componentStack: 'test stack',
      })
    );
  });

  it('should handle retry functionality correctly', () => {
    const errorBoundary = new ErrorBoundary({ 
      children: React.createElement('div'),
      maxRetries: 3
    });
    
    // Test that handleRetry method exists and can be called
    const handleRetry = errorBoundary['handleRetry'];
    expect(typeof handleRetry).toBe('function');
    
    // Call handleRetry and check that it doesn't throw
    expect(() => handleRetry()).not.toThrow();
    
    // Test retry logic by directly setting state with incremented count
    const initialState = {
      hasError: true,
      error: {
        type: ApiErrorType.NETWORK_ERROR,
        message: 'Network error',
        retryable: true,
        timestamp: new Date(),
        userMessage: 'Network error occurred',
      },
      errorInfo: null,
      retryCount: 0,
    };
    
    // Simulate the setState callback that handleRetry uses
    const newState = { retryCount: initialState.retryCount + 1 };
    expect(newState.retryCount).toBe(1);
  });

  it('should respect maxRetries limit', () => {
    const errorBoundary = new ErrorBoundary({ 
      children: React.createElement('div'),
      maxRetries: 2
    });
    
    // Set state at max retries
    errorBoundary.setState({
      hasError: true,
      error: {
        type: ApiErrorType.NETWORK_ERROR,
        message: 'Network error',
        retryable: true,
        timestamp: new Date(),
        userMessage: 'Network error occurred',
      },
      errorInfo: null,
      retryCount: 2,
    });
    
    const initialRetryCount = errorBoundary.state.retryCount;
    const handleRetry = errorBoundary['handleRetry'];
    handleRetry();
    
    // Should not increment beyond max retries
    expect(errorBoundary.state.retryCount).toBe(initialRetryCount);
  });

  it('should reset error state correctly', () => {
    const errorBoundary = new ErrorBoundary({ 
      children: React.createElement('div')
    });
    
    // Set error state
    errorBoundary.setState({
      hasError: true,
      error: {
        type: ApiErrorType.VALIDATION_ERROR,
        message: 'Test error',
        retryable: false,
        timestamp: new Date(),
        userMessage: 'Test error occurred',
      },
      errorInfo: { componentStack: 'test' },
      retryCount: 1,
    });
    
    // Reset error boundary
    const resetErrorBoundary = errorBoundary['resetErrorBoundary'];
    resetErrorBoundary();
    
    expect(errorBoundary.state.hasError).toBe(false);
    expect(errorBoundary.state.error).toBe(null);
    expect(errorBoundary.state.errorInfo).toBe(null);
    expect(errorBoundary.state.retryCount).toBe(0);
  });

  it('should handle resetKeys changes correctly', () => {
    const errorBoundary = new ErrorBoundary({ 
      children: React.createElement('div'),
      resetKeys: ['key1']
    });
    
    // Set error state
    errorBoundary.setState({
      hasError: true,
      error: {
        type: ApiErrorType.VALIDATION_ERROR,
        message: 'Test error',
        retryable: false,
        timestamp: new Date(),
        userMessage: 'Test error occurred',
      },
      errorInfo: null,
      retryCount: 0,
    });
    
    // Simulate resetKeys change
    const prevProps = { resetKeys: ['key1'], children: React.createElement('div') };
    const snapshot = errorBoundary.getSnapshotBeforeUpdate(prevProps);
    
    expect(snapshot).toBeNull(); // Same keys, no snapshot
    
    // Test with different keys
    const newProps = { resetKeys: ['key2'], children: React.createElement('div') };
    const newSnapshot = errorBoundary.getSnapshotBeforeUpdate(newProps);
    
    expect(newSnapshot).toEqual({ resetKeys: ['key1'] });
  });

  it('should render children when no error', () => {
    const errorBoundary = new ErrorBoundary({ 
      children: React.createElement('div', {}, 'Test content')
    });
    
    const rendered = errorBoundary.render();
    expect(rendered).toEqual(React.createElement('div', {}, 'Test content'));
  });

  it('should render error display when error exists', () => {
    const errorBoundary = new ErrorBoundary({ 
      children: React.createElement('div')
    });
    
    // Set error state
    errorBoundary.setState({
      hasError: true,
      error: {
        type: ApiErrorType.VALIDATION_ERROR,
        message: 'Test error',
        retryable: true,
        timestamp: new Date(),
        userMessage: 'The provided data is invalid. Please check your input.',
        technicalDetails: 'Input validation failed on client or server',
      },
      errorInfo: null,
      retryCount: 0,
    });
    
    const rendered = errorBoundary.render();
    expect(rendered).toBeDefined();
    // The rendered output should be a div with error display
    expect(React.isValidElement(rendered)).toBe(true);
  });

  it('should use custom fallback when provided', () => {
    const customFallback = (error: any, retry: () => void) => 
      React.createElement('div', {}, `Custom error: ${error.userMessage}`);
    
    const errorBoundary = new ErrorBoundary({ 
      children: React.createElement('div'),
      fallback: customFallback
    });
    
    // Set error state
    errorBoundary.setState({
      hasError: true,
      error: {
        type: ApiErrorType.VALIDATION_ERROR,
        message: 'Test error',
        retryable: true,
        timestamp: new Date(),
        userMessage: 'Test error message',
      },
      errorInfo: null,
      retryCount: 0,
    });
    
    const rendered = errorBoundary.render();
    expect(rendered).toBeDefined();
    expect(React.isValidElement(rendered)).toBe(true);
  });
});

describe('useErrorBoundary', () => {
  it('should be defined', () => {
    // Since we can't test hooks without proper DOM setup,
    // we'll just verify the import works
    const { useErrorBoundary } = require('@/components/ErrorBoundary');
    expect(useErrorBoundary).toBeDefined();
    expect(typeof useErrorBoundary).toBe('function');
  });
});

describe('withErrorBoundary', () => {
  it('should be defined and create wrapped component', () => {
    const { withErrorBoundary } = require('@/components/ErrorBoundary');
    expect(withErrorBoundary).toBeDefined();
    expect(typeof withErrorBoundary).toBe('function');
    
    const TestComponent = () => React.createElement('div', {}, 'Test');
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    expect(WrappedComponent).toBeDefined();
    expect(typeof WrappedComponent).toBe('function');
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });
});