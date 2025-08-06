import React, { useState } from 'react';
import { ErrorBoundary, AsyncErrorBoundary } from '@/components/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Component that can throw errors for demonstration
const ErrorProneComponent = ({ shouldThrow, errorType }: { shouldThrow: boolean; errorType: string }) => {
  if (shouldThrow) {
    switch (errorType) {
      case 'network':
        throw new Error('Network error occurred');
      case 'database':
        throw new Error('Database connection failed');
      case 'timeout':
        throw new Error('Request timeout');
      default:
        throw new Error('Something went wrong');
    }
  }
  
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <p className="text-green-800">✅ Component is working correctly!</p>
    </div>
  );
};

// Async component that simulates API calls
const AsyncComponent = ({ shouldFail }: { shouldFail: boolean }) => {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (shouldFail) {
        throw new Error('API request failed');
      }
      
      setData('Data loaded successfully!');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (data) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">📊 {data}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Button onClick={fetchData}>Load Data</Button>
    </div>
  );
};

export function ErrorBoundaryExample() {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [errorType, setErrorType] = useState('network');
  const [shouldFailAsync, setShouldFailAsync] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setShouldThrow(false);
    setShouldFailAsync(false);
    setResetKey(prev => prev + 1);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Error Boundary Examples</h1>
        <p className="text-gray-600">
          Demonstration of error boundary components with different error types and recovery mechanisms.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
          <CardDescription>
            Use these controls to trigger different types of errors and test the error boundaries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant={shouldThrow ? 'destructive' : 'outline'}
              onClick={() => setShouldThrow(!shouldThrow)}
            >
              {shouldThrow ? 'Stop Error' : 'Trigger Error'}
            </Button>
            
            <select
              value={errorType}
              onChange={(e) => setErrorType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="network">Network Error</option>
              <option value="database">Database Error</option>
              <option value="timeout">Timeout Error</option>
              <option value="validation">Validation Error</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant={shouldFailAsync ? 'destructive' : 'outline'}
              onClick={() => setShouldFailAsync(!shouldFailAsync)}
            >
              {shouldFailAsync ? 'Fix Async' : 'Break Async'}
            </Button>
            
            <Button variant="secondary" onClick={handleReset}>
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Standard Error Boundary Example */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Error Boundary</CardTitle>
          <CardDescription>
            Catches JavaScript errors in child components and displays a fallback UI with retry functionality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorBoundary
            resetKeys={[resetKey]}
            showTechnicalDetails={true}
            maxRetries={3}
          >
            <ErrorProneComponent shouldThrow={shouldThrow} errorType={errorType} />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Async Error Boundary Example */}
      <Card>
        <CardHeader>
          <CardTitle>Async Error Boundary</CardTitle>
          <CardDescription>
            Handles errors from async operations with automatic retry and recovery mechanisms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AsyncErrorBoundary
            maxRetries={2}
            retryDelay={1000}
            showTechnicalDetails={true}
          >
            <AsyncComponent shouldFail={shouldFailAsync} />
          </AsyncErrorBoundary>
        </CardContent>
      </Card>

      {/* Custom Fallback Example */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Fallback UI</CardTitle>
          <CardDescription>
            Error boundary with a custom fallback component for branded error displays.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorBoundary
            resetKeys={[resetKey]}
            fallback={(error, retry) => (
              <div className="p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900">Oops! Something went wrong</h3>
                    <p className="text-red-700 text-sm">{error.userMessage}</p>
                  </div>
                </div>
                {error.retryable && (
                  <Button onClick={retry} variant="destructive" size="sm">
                    Try Again
                  </Button>
                )}
              </div>
            )}
          >
            <ErrorProneComponent shouldThrow={shouldThrow} errorType={errorType} />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Error Types Information */}
      <Card>
        <CardHeader>
          <CardTitle>Error Types & Behavior</CardTitle>
          <CardDescription>
            Different error types have different retry behaviors and user messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-green-700">Retryable Errors:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Network errors (connection issues)</li>
                <li>• Database errors (temporary failures)</li>
                <li>• Timeout errors (slow responses)</li>
                <li>• Rate limit errors (temporary blocks)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-red-700">Non-retryable Errors:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Validation errors (bad input)</li>
                <li>• Authentication errors (invalid credentials)</li>
                <li>• Authorization errors (insufficient permissions)</li>
                <li>• Not found errors (missing resources)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}