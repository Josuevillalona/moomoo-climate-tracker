import { ApiErrorType } from '@/types/api';

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface AppError {
  type: ApiErrorType;
  message: string;
  retryable: boolean;
  statusCode?: number;
  timestamp: Date;
  userMessage: string;
  technicalDetails?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export interface RetryOptions {
  maxAttempts: number;
  backoffMs: number;
  exponential: boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  backoffMs: 1000,
  exponential: true,
};

// Error message mappings for user-friendly display
export const ERROR_MESSAGES: Record<ApiErrorType, string> = {
  [ApiErrorType.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection.',
  [ApiErrorType.DATABASE_ERROR]: 'There was an issue accessing the data. Please try again.',
  [ApiErrorType.VALIDATION_ERROR]: 'The provided data is invalid. Please check your input.',
  [ApiErrorType.TIMEOUT_ERROR]: 'The request took too long to complete. Please try again.',
  [ApiErrorType.AUTHENTICATION_ERROR]: 'Authentication failed. Please log in again.',
  [ApiErrorType.AUTHORIZATION_ERROR]: 'You do not have permission to access this resource.',
  [ApiErrorType.NOT_FOUND_ERROR]: 'The requested resource was not found.',
  [ApiErrorType.RATE_LIMIT_ERROR]: 'Too many requests. Please wait a moment before trying again.',
};

// Technical error details for debugging
export const TECHNICAL_ERROR_DETAILS: Record<ApiErrorType, string> = {
  [ApiErrorType.NETWORK_ERROR]: 'Network connectivity issue or server unreachable',
  [ApiErrorType.DATABASE_ERROR]: 'Database query failed or connection lost',
  [ApiErrorType.VALIDATION_ERROR]: 'Input validation failed on client or server',
  [ApiErrorType.TIMEOUT_ERROR]: 'Request exceeded configured timeout limit',
  [ApiErrorType.AUTHENTICATION_ERROR]: 'Invalid credentials or expired session',
  [ApiErrorType.AUTHORIZATION_ERROR]: 'Insufficient permissions for requested action',
  [ApiErrorType.NOT_FOUND_ERROR]: 'Resource does not exist or has been deleted',
  [ApiErrorType.RATE_LIMIT_ERROR]: 'API rate limit exceeded for current time window',
};

export function createAppError(
  type: ApiErrorType,
  originalError?: Error,
  statusCode?: number
): AppError {
  return {
    type,
    message: originalError?.message || ERROR_MESSAGES[type],
    retryable: isRetryableError(type),
    statusCode,
    timestamp: new Date(),
    userMessage: ERROR_MESSAGES[type],
    technicalDetails: TECHNICAL_ERROR_DETAILS[type],
  };
}

export function isRetryableError(type: ApiErrorType): boolean {
  const retryableErrors = [
    ApiErrorType.NETWORK_ERROR,
    ApiErrorType.DATABASE_ERROR,
    ApiErrorType.TIMEOUT_ERROR,
    ApiErrorType.RATE_LIMIT_ERROR,
  ];
  return retryableErrors.includes(type);
}

export function getRetryDelay(attempt: number, options: RetryOptions): number {
  if (options.exponential) {
    return options.backoffMs * Math.pow(2, attempt - 1);
  }
  return options.backoffMs;
}