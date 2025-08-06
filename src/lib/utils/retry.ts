import { RetryOptions, DEFAULT_RETRY_OPTIONS, getRetryDelay } from '@/lib/errors/types';

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on the last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Calculate delay for next attempt
      const delay = getRetryDelay(attempt, config);
      
      // Log retry attempt (in development)
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Retry attempt ${attempt}/${config.maxAttempts} failed:`, lastError.message);
        console.warn(`Retrying in ${delay}ms...`);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export class RetryableOperation<T> {
  private operation: () => Promise<T>;
  private options: RetryOptions;
  private onRetry?: (attempt: number, error: Error) => void;

  constructor(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {},
    onRetry?: (attempt: number, error: Error) => void
  ) {
    this.operation = operation;
    this.options = { ...DEFAULT_RETRY_OPTIONS, ...options };
    this.onRetry = onRetry;
  }

  async execute(): Promise<T> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await this.operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Call retry callback if provided
        if (this.onRetry) {
          this.onRetry(attempt, lastError);
        }

        // Don't retry on the last attempt
        if (attempt === this.options.maxAttempts) {
          break;
        }

        // Calculate delay for next attempt
        const delay = getRetryDelay(attempt, this.options);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  updateOptions(options: Partial<RetryOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

// Utility function to check if an error should be retried
export function shouldRetryError(error: Error): boolean {
  // Network errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return true;
  }

  // Timeout errors
  if (error.message.includes('timeout')) {
    return true;
  }

  // Rate limit errors
  if (error.message.includes('rate limit') || error.message.includes('429')) {
    return true;
  }

  // Server errors (5xx)
  if (error.message.includes('500') || error.message.includes('502') || 
      error.message.includes('503') || error.message.includes('504')) {
    return true;
  }

  return false;
}