import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary, useErrorBoundary } from '@/components/ErrorBoundary';
import { ApiErrorType } from '@/types/api';

// Mock component that throws an error
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Test component using the useErrorBoundary hook
const TestComponent = () => {
  const { captureError } = useErrorBoundary();
  
  return (
    <div>
      <span>Test Component</span>
      <button onClick={() => captureError(new Error('Manual error'))}>
        Trigger Error
      </button>
    </div>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error display when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Component error" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('The provided data is invalid. Please check your input.')).toBeInTheDocument();
  });

  it('shows retry button for retryable errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Network error" />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('handles retry functionality', async () => {
    let shouldThrow = true;
    
    const TestRetryComponent = () => {
      if (shouldThrow) {
        throw new Error('Network error');
      }
      return <div>No error</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <TestRetryComponent />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    
    // Simulate fixing the error
    shouldThrow = false;
    
    fireEvent.click(retryButton);

    // Wait for retry to complete and rerender with fixed component
    await waitFor(() => {
      rerender(
        <ErrorBoundary>
          <TestRetryComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  it('respects maxRetries prop', () => {
    render(
      <ErrorBoundary maxRetries={2}>
        <ThrowError shouldThrow={true} errorMessage="Network error" />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /try again/i });
    
    // First retry
    fireEvent.click(retryButton);
    expect(screen.getByText('Retry attempt 1 of 2')).toBeInTheDocument();
    
    // Second retry
    fireEvent.click(retryButton);
    expect(screen.getByText('Retry attempt 2 of 2')).toBeInTheDocument();
    
    // Should not show retry button after max retries
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} errorMessage="Callback test" />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Callback test'),
        type: ApiErrorType.VALIDATION_ERROR,
      }),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('uses custom fallback when provided', () => {
    const customFallback = (error: any, retry: () => void) => (
      <div>
        <span>Custom error: {error.userMessage}</span>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Custom error:/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom Retry' })).toBeInTheDocument();
  });

  it('resets error state when resetKeys change', () => {
    let resetKey = 'key1';
    
    const { rerender } = render(
      <ErrorBoundary resetKeys={[resetKey]}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error should be displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Change reset key
    resetKey = 'key2';
    rerender(
      <ErrorBoundary resetKeys={[resetKey]}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Error should be cleared
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('shows technical details when enabled', () => {
    render(
      <ErrorBoundary showTechnicalDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Technical Details:')).toBeInTheDocument();
  });
});

describe('useErrorBoundary', () => {
  it('provides error capture functionality', () => {
    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test Component')).toBeInTheDocument();

    // Trigger manual error
    const triggerButton = screen.getByRole('button', { name: 'Trigger Error' });
    fireEvent.click(triggerButton);

    // Error boundary should catch the error
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});