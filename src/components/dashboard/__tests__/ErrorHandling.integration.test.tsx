import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { 
  SectionErrorBoundary,
  DashboardErrorFallback,
  MetricsErrorFallback,
  ChartErrorFallback,
  RecentDealsErrorFallback,
  SectionErrorDisplay
} from '@/components/dashboard/ErrorFallbacks';
import { AppError, createAppError } from '@/lib/errors/types';
import { ApiErrorType } from '@/types/api';

// Mock the error display component
jest.mock('@/components/ui/error-display', () => ({
  ErrorDisplay: ({ error, onRetry, showTechnicalDetails, compact }: any) => (
    <div data-testid="error-display">
      <div data-testid="error-message">{error.userMessage || error.message}</div>
      <div data-testid="error-type">{error.type}</div>
      {onRetry && (
        <button data-testid="retry-button" onClick={onRetry}>
          Retry
        </button>
      )}
      {showTechnicalDetails && (
        <div data-testid="technical-details">{error.technicalDetails}</div>
      )}
      {compact && <div data-testid="compact-mode">Compact</div>}
    </div>
  ),
  InlineError: ({ message, onRetry }: any) => (
    <div data-testid="inline-error">
      <div data-testid="error-message">{message}</div>
      {onRetry && (
        <button data-testid="retry-button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  Database: () => <div data-testid="database-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Briefcase: () => <div data-testid="briefcase-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  Building: () => <div data-testid="building-icon" />,
  Newspaper: () => <div data-testid="newspaper-icon" />,
  PieChart: () => <div data-testid="pie-chart-icon" />,
}));

// Mock the error types
jest.mock('@/lib/errors/types', () => ({
  createAppError: jest.fn((type: ApiErrorType, error: Error | string) => ({
    type,
    message: typeof error === 'string' ? error : error.message,
    userMessage: typeof error === 'string' ? error : error.message,
    technicalDetails: typeof error === 'string' ? error : error.stack,
    retryable: true,
    timestamp: new Date(),
  })),
  ApiErrorType: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR'
  }
}));

const mockCreateAppError = createAppError as jest.MockedFunction<typeof createAppError>;

// Test component that throws errors
const ErrorThrowingComponent = ({ shouldThrow, errorMessage }: { shouldThrow: boolean; errorMessage?: string }) => {
  if (shouldThrow) {
    throw new Error(errorMessage || 'Test error');
  }
  return <div data-testid="success-component">Success</div>;
};

// Test component for section errors
const SectionComponent = ({ hasError, errorType }: { hasError: boolean; errorType?: ApiErrorType }) => {
  if (hasError) {
    const error = new Error('Section failed to load');
    throw error;
  }
  return <div data-testid="section-content">Section loaded successfully</div>;
};

describe('Dashboard Error Handling Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockCreateAppError.mockImplementation((type: ApiErrorType, error: Error | string) => ({
      type,
      message: typeof error === 'string' ? error : error.message,
      userMessage: typeof error === 'string' ? error : error.message,
      technicalDetails: typeof error === 'string' ? error : error.stack,
      retryable: true,
      timestamp: new Date(),
    }));
  });

  describe('ErrorBoundary Component', () => {
    it('should catch and display errors with retry functionality', async () => {
      const mockRetry = jest.fn();
      const mockOnError = jest.fn();

      render(
        <ErrorBoundary onError={mockOnError} maxRetries={3}>
          <ErrorThrowingComponent shouldThrow={true} errorMessage="Network connection failed" />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      });

      expect(screen.getByTestId('error-message')).toHaveTextContent('Network connection failed');
      expect(mockOnError).toHaveBeenCalled();
    });

    it('should recover from errors when component stops throwing', async () => {
      let shouldThrow = true;
      
      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div data-testid="success-component">Success</div>;
      };

      const { rerender } = render(
        <ErrorBoundary resetKeys={[shouldThrow]}>
          <TestComponent />
        </ErrorBoundary>
      );

      // Should show error
      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      });

      // Component stops throwing error
      shouldThrow = false;
      rerender(
        <ErrorBoundary resetKeys={[shouldThrow]}>
          <TestComponent />
        </ErrorBoundary>
      );

      // Should show success component
      await waitFor(() => {
        expect(screen.getByTestId('success-component')).toBeInTheDocument();
        expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
      });
    });

    it('should handle retry attempts correctly', async () => {
      const { rerender } = render(
        <ErrorBoundary maxRetries={2}>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);

      // Should attempt to re-render the component
      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      });
    });

    it('should use custom fallback when provided', async () => {
      const customFallback = (error: AppError, retry: () => void) => (
        <div data-testid="custom-fallback">
          <div data-testid="custom-error-message">{error.message}</div>
          <button data-testid="custom-retry" onClick={retry}>
            Custom Retry
          </button>
        </div>
      );

      render(
        <ErrorBoundary fallback={customFallback}>
          <ErrorThrowingComponent shouldThrow={true} errorMessage="Custom error" />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
        expect(screen.getByTestId('custom-error-message')).toHaveTextContent('Custom error');
        expect(screen.getByTestId('custom-retry')).toBeInTheDocument();
      });
    });

    it('should reset on prop changes when resetKeys change', async () => {
      const { rerender } = render(
        <ErrorBoundary resetKeys={['key1']}>
          <ErrorThrowingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      });

      // Change reset keys
      rerender(
        <ErrorBoundary resetKeys={['key2']}>
          <ErrorThrowingComponent shouldThrow={false} />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('success-component')).toBeInTheDocument();
        expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
      });
    });
  });

  describe('Section Error Boundaries', () => {
    it('should handle section-specific errors with appropriate fallbacks', async () => {
      const mockOnError = jest.fn();

      render(
        <SectionErrorBoundary 
          sectionName="Test Section" 
          onError={mockOnError}
        >
          <SectionComponent hasError={true} errorType={ApiErrorType.DATABASE_ERROR} />
        </SectionErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Section - Error')).toBeInTheDocument();
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Section failed to load',
        }),
        'Test Section'
      );
    });

    it('should use custom fallback for section errors', async () => {
      const customFallback = (error: AppError, retry: () => void) => (
        <div data-testid="custom-section-fallback">
          <div>Custom section error: {error.message}</div>
          <button onClick={retry}>Custom Section Retry</button>
        </div>
      );

      render(
        <SectionErrorBoundary 
          sectionName="Custom Section" 
          fallback={customFallback}
        >
          <SectionComponent hasError={true} />
        </SectionErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-section-fallback')).toBeInTheDocument();
        expect(screen.getByText('Custom section error: Section failed to load')).toBeInTheDocument();
      });
    });

    it('should render children when no error occurs', async () => {
      render(
        <SectionErrorBoundary sectionName="Working Section">
          <SectionComponent hasError={false} />
        </SectionErrorBoundary>
      );

      expect(screen.getByTestId('section-content')).toBeInTheDocument();
      expect(screen.getByText('Section loaded successfully')).toBeInTheDocument();
    });
  });

  describe('Specific Error Fallback Components', () => {
    const mockError: AppError = {
      type: ApiErrorType.DATABASE_ERROR,
      message: 'Database connection failed',
      userMessage: 'Unable to load data from the database',
      technicalDetails: 'Connection timeout after 30 seconds',
      retryable: true,
      timestamp: new Date(),
    };

    it('should render MetricsErrorFallback correctly', async () => {
      const mockRetry = jest.fn();

      render(<MetricsErrorFallback error={mockError} retry={mockRetry} />);

      expect(screen.getByText('Metrics - Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to Load Metrics')).toBeInTheDocument();
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();

      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });

    it('should render ChartErrorFallback correctly', async () => {
      const mockRetry = jest.fn();

      render(<ChartErrorFallback error={mockError} retry={mockRetry} />);

      expect(screen.getByText('Charts - Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to Load Charts')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument();
    });

    it('should render RecentDealsErrorFallback correctly', async () => {
      const mockRetry = jest.fn();

      render(<RecentDealsErrorFallback error={mockError} retry={mockRetry} />);

      expect(screen.getByText('Recent Deals - Error')).toBeInTheDocument();
      expect(screen.getByText('Unable to Load Recent Deals')).toBeInTheDocument();
      expect(screen.getByTestId('briefcase-icon')).toBeInTheDocument();
    });

    it('should handle non-retryable errors correctly', async () => {
      const nonRetryableError: AppError = {
        ...mockError,
        retryable: false,
      };

      render(<MetricsErrorFallback error={nonRetryableError} retry={jest.fn()} />);

      expect(screen.getByText('Unable to Load Metrics')).toBeInTheDocument();
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
    });
  });

  describe('Dashboard Error Fallback', () => {
    const mockError: AppError = {
      type: ApiErrorType.NETWORK_ERROR,
      message: 'Network connection failed',
      userMessage: 'Unable to connect to the server',
      technicalDetails: 'ERR_NETWORK_TIMEOUT',
      retryable: true,
      timestamp: new Date(),
    };

    it('should render dashboard-wide error fallback', async () => {
      const mockRetry = jest.fn();

      render(<DashboardErrorFallback error={mockError} retry={mockRetry} />);

      expect(screen.getByText('Dashboard Temporarily Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/We're experiencing technical difficulties/)).toBeInTheDocument();
      expect(screen.getByTestId('database-icon')).toBeInTheDocument();

      const retryButton = screen.getByText('Retry Dashboard');
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();

      const refreshButton = screen.getByText('Refresh Page');
      expect(refreshButton).toBeInTheDocument();
    });

    it('should handle refresh page functionality', async () => {
      // Store original reload function
      const originalReload = window.location.reload;
      
      // Mock window.location.reload
      const mockReload = jest.fn();
      
      // Mock the reload function
      const mockLocation = {
        ...window.location,
        reload: mockReload,
      };
      
      // Replace window.location with our mock
      delete (window as any).location;
      (window as any).location = mockLocation;

      render(<DashboardErrorFallback error={mockError} retry={jest.fn()} />);

      const refreshButton = screen.getByText('Refresh Page');
      fireEvent.click(refreshButton);

      expect(mockReload).toHaveBeenCalled();
      
      // Restore original reload function
      Object.defineProperty(window.location, 'reload', {
        writable: true,
        value: originalReload,
      });
    });

    it('should show technical details in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(<DashboardErrorFallback error={mockError} retry={jest.fn()} />);

      expect(screen.getByTestId('technical-details')).toBeInTheDocument();
      expect(screen.getByTestId('technical-details')).toHaveTextContent('ERR_NETWORK_TIMEOUT');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Section Error Display', () => {
    const mockError: AppError = {
      type: ApiErrorType.TIMEOUT_ERROR,
      message: 'Request timeout',
      userMessage: 'The request took too long to complete',
      technicalDetails: 'Timeout after 30000ms',
      retryable: true,
      timestamp: new Date(),
    };

    it('should render section error display with retry count', async () => {
      const mockRetry = jest.fn();

      render(
        <SectionErrorDisplay
          error={mockError}
          retry={mockRetry}
          retryCount={2}
          maxRetries={3}
          sectionName="Test Section"
        />
      );

      expect(screen.getByTestId('error-display')).toBeInTheDocument();
      expect(screen.getByText('Test Section retry attempt 2 of 3')).toBeInTheDocument();

      const retryButton = screen.getByTestId('retry-button');
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });

    it('should not show retry button when max retries exceeded', async () => {
      const mockRetry = jest.fn();

      render(
        <SectionErrorDisplay
          error={mockError}
          retry={mockRetry}
          retryCount={3}
          maxRetries={3}
          sectionName="Test Section"
        />
      );

      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
      expect(screen.getByText('Test Section retry attempt 3 of 3')).toBeInTheDocument();
    });

    it('should handle non-retryable errors', async () => {
      const nonRetryableError: AppError = {
        ...mockError,
        retryable: false,
      };

      render(
        <SectionErrorDisplay
          error={nonRetryableError}
          retry={jest.fn()}
          sectionName="Test Section"
        />
      );

      expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
    });
  });

  describe('Error Type Handling', () => {
    it('should handle different error types appropriately', async () => {
      const errorTypes = [
        'NETWORK_ERROR',
        'DATABASE_ERROR',
        'TIMEOUT_ERROR',
        'AUTHENTICATION_ERROR',
        'VALIDATION_ERROR',
      ];

      for (const errorType of errorTypes) {
        const error: AppError = {
          type: errorType as ApiErrorType,
          message: `${errorType} occurred`,
          userMessage: `User-friendly ${errorType} message`,
          technicalDetails: `Technical details for ${errorType}`,
          retryable: errorType !== 'AUTHENTICATION_ERROR',
          timestamp: new Date(),
        };

        const { unmount } = render(<MetricsErrorFallback error={error} retry={jest.fn()} />);

        // The MetricsErrorFallback doesn't use ErrorDisplay directly, it uses SectionErrorFallback
        expect(screen.getByText('Unable to Load Metrics')).toBeInTheDocument();

        if (error.retryable) {
          expect(screen.getByText('Try Again')).toBeInTheDocument();
        } else {
          expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
        }

        unmount();
      }
    });

    it('should handle unknown error types gracefully', async () => {
      const unknownError: AppError = {
        type: 'UNKNOWN_ERROR' as ApiErrorType,
        message: 'Unknown error occurred',
        userMessage: 'Something went wrong',
        technicalDetails: 'No additional details available',
        retryable: true,
        timestamp: new Date(),
      };

      render(<MetricsErrorFallback error={unknownError} retry={jest.fn()} />);

      expect(screen.getByText('Unable to Load Metrics')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle error recovery after successful retry', async () => {
      let shouldThrow = true;

      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Temporary error');
        }
        return <div data-testid="recovered-component">Recovered successfully</div>;
      };

      const { rerender } = render(
        <ErrorBoundary resetKeys={[shouldThrow]}>
          <TestComponent />
        </ErrorBoundary>
      );

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByTestId('error-display')).toBeInTheDocument();
      });

      // Simulate successful recovery by changing the reset key
      shouldThrow = false;
      rerender(
        <ErrorBoundary resetKeys={[shouldThrow]}>
          <TestComponent />
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByTestId('recovered-component')).toBeInTheDocument();
        expect(screen.queryByTestId('error-display')).not.toBeInTheDocument();
      });
    });

    it('should handle cascading errors in multiple sections', async () => {
      const Section1 = () => {
        throw new Error('Section 1 failed');
      };

      const Section2 = () => (
        <div data-testid="section-2-content">Section 2 loaded successfully</div>
      );

      const Section3 = () => {
        throw new Error('Section 3 failed');
      };

      const MultiSectionComponent = () => (
        <div>
          <SectionErrorBoundary sectionName="Section 1">
            <Section1 />
          </SectionErrorBoundary>
          <SectionErrorBoundary sectionName="Section 2">
            <Section2 />
          </SectionErrorBoundary>
          <SectionErrorBoundary sectionName="Section 3">
            <Section3 />
          </SectionErrorBoundary>
        </div>
      );

      render(<MultiSectionComponent />);

      // Section 1 should show error
      await waitFor(() => {
        expect(screen.getByText('Section 1 - Error')).toBeInTheDocument();
      });

      // Section 2 should work normally
      expect(screen.getByTestId('section-2-content')).toBeInTheDocument();

      // Section 3 should show error
      expect(screen.getByText('Section 3 - Error')).toBeInTheDocument();
    });
  });
});