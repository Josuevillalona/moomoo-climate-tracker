import React from 'react';
import { AlertTriangle, RefreshCw, Wifi, Database, Clock, Shield, Search, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppError } from '@/lib/errors/types';
import { ApiErrorType } from '@/types/api';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showTechnicalDetails?: boolean;
  className?: string;
  compact?: boolean;
}

const ERROR_ICONS: Record<ApiErrorType, React.ComponentType<{ className?: string }>> = {
  [ApiErrorType.NETWORK_ERROR]: Wifi,
  [ApiErrorType.DATABASE_ERROR]: Database,
  [ApiErrorType.VALIDATION_ERROR]: AlertTriangle,
  [ApiErrorType.TIMEOUT_ERROR]: Clock,
  [ApiErrorType.AUTHENTICATION_ERROR]: Shield,
  [ApiErrorType.AUTHORIZATION_ERROR]: Shield,
  [ApiErrorType.NOT_FOUND_ERROR]: Search,
  [ApiErrorType.RATE_LIMIT_ERROR]: Zap,
};

const ERROR_COLORS: Record<ApiErrorType, string> = {
  [ApiErrorType.NETWORK_ERROR]: 'text-blue-500',
  [ApiErrorType.DATABASE_ERROR]: 'text-red-500',
  [ApiErrorType.VALIDATION_ERROR]: 'text-yellow-500',
  [ApiErrorType.TIMEOUT_ERROR]: 'text-orange-500',
  [ApiErrorType.AUTHENTICATION_ERROR]: 'text-purple-500',
  [ApiErrorType.AUTHORIZATION_ERROR]: 'text-purple-500',
  [ApiErrorType.NOT_FOUND_ERROR]: 'text-gray-500',
  [ApiErrorType.RATE_LIMIT_ERROR]: 'text-indigo-500',
};

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  showTechnicalDetails = false,
  className,
  compact = false
}: ErrorDisplayProps) {
  const IconComponent = ERROR_ICONS[error.type] || AlertTriangle;
  const iconColor = ERROR_COLORS[error.type] || 'text-red-500';

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg',
        className
      )}>
        <IconComponent className={cn('h-5 w-5 flex-shrink-0', iconColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{error.userMessage}</p>
        </div>
        {error.retryable && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('border-red-200 bg-red-50', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <IconComponent className={cn('h-6 w-6', iconColor)} />
          <div>
            <CardTitle className="text-lg text-gray-900">
              Something went wrong
            </CardTitle>
            <CardDescription className="text-gray-600">
              {error.userMessage}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {showTechnicalDetails && error.technicalDetails && (
          <div className="mb-4 p-3 bg-gray-100 rounded-md">
            <p className="text-xs font-medium text-gray-700 mb-1">Technical Details:</p>
            <p className="text-xs text-gray-600">{error.technicalDetails}</p>
            {error.statusCode && (
              <p className="text-xs text-gray-500 mt-1">Status Code: {error.statusCode}</p>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-3">
          {error.retryable && onRetry && (
            <Button
              variant="default"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          
          {onDismiss && (
            <Button
              variant="outline"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          )}
        </div>
        
        <p className="text-xs text-gray-500 mt-3">
          Error occurred at {error.timestamp.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div className={cn(
      'flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md',
      className
    )}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-700">{message}</span>
      </div>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="text-red-600 hover:text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

interface ErrorAlertProps {
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  onClose?: () => void;
  className?: string;
}

export function ErrorAlert({ 
  title, 
  message, 
  type = 'error', 
  onClose, 
  className 
}: ErrorAlertProps) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconStyles = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  return (
    <div className={cn(
      'p-4 border rounded-lg',
      styles[type],
      className
    )}>
      <div className="flex items-start">
        <AlertTriangle className={cn('h-5 w-5 mt-0.5 mr-3', iconStyles[type])} />
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          <p className="mt-1 text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}