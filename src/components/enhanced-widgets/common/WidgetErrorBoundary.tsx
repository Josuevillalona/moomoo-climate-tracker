'use client';

import React from 'react';
import { ErrorBoundaryState, WidgetError } from '../../../types/enhanced-widgets';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';

interface WidgetErrorBoundaryProps {
  children: React.ReactNode;
  widgetName: string;
  onRetry?: () => void;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.widgetName}:`, error, errorInfo);
    
    // Log error to monitoring service
    this.logError({
      type: 'unknown',
      message: error.message,
      retryable: true,
      timestamp: new Date(),
    });

    this.setState({
      hasError: true,
      error,
      errorInfo,
    });
  }

  private logError = (widgetError: WidgetError) => {
    // TODO: Integrate with monitoring service
    console.error('Widget Error:', widgetError);
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error!} 
            retry={this.handleRetry} 
          />
        );
      }

      return (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="text-center">
            <div className="text-red-600 mb-2">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">
              {this.props.widgetName} Error
            </h3>
            <p className="text-red-600 mb-4">
              Something went wrong while loading this widget. 
              {this.state.error?.message && (
                <span className="block text-sm mt-1">
                  {this.state.error.message}
                </span>
              )}
            </p>
            <Button
              onClick={this.handleRetry}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default WidgetErrorBoundary;