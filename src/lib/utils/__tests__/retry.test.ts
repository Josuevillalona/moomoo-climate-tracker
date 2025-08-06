import { withRetry, RetryableOperation, shouldRetryError } from '@/lib/utils/retry';

describe('withRetry', () => {
  it('returns result on successful first attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    
    const result = await withRetry(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');
    
    const result = await withRetry(mockFn, { maxAttempts: 3, backoffMs: 10 });
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('throws error after max attempts', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));
    
    await expect(withRetry(mockFn, { maxAttempts: 2, backoffMs: 10 }))
      .rejects.toThrow('Persistent failure');
    
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('respects maxAttempts configuration', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Failure'));
    
    await expect(withRetry(mockFn, { maxAttempts: 1, backoffMs: 10 }))
      .rejects.toThrow('Failure');
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('RetryableOperation', () => {
  it('executes operation successfully', async () => {
    const mockOperation = jest.fn().mockResolvedValue('success');
    const operation = new RetryableOperation(mockOperation);
    
    const result = await operation.execute();
    
    expect(result).toBe('success');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry callback on failures', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success');
    
    const onRetry = jest.fn();
    const operation = new RetryableOperation(mockOperation, { backoffMs: 10 }, onRetry);
    
    const result = await operation.execute();
    
    expect(result).toBe('success');
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });

  it('allows updating options', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Failure'));
    const operation = new RetryableOperation(mockOperation, { maxAttempts: 2, backoffMs: 10 });
    
    operation.updateOptions({ maxAttempts: 1 });
    
    await expect(operation.execute()).rejects.toThrow('Failure');
    expect(mockOperation).toHaveBeenCalledTimes(1);
  });
});

describe('shouldRetryError', () => {
  it('returns true for network errors', () => {
    const networkError = new Error('fetch failed');
    expect(shouldRetryError(networkError)).toBe(true);
  });

  it('returns true for timeout errors', () => {
    const timeoutError = new Error('Request timeout');
    expect(shouldRetryError(timeoutError)).toBe(true);
  });

  it('returns true for rate limit errors', () => {
    const rateLimitError = new Error('rate limit exceeded');
    expect(shouldRetryError(rateLimitError)).toBe(true);
  });

  it('returns true for server errors', () => {
    const serverError = new Error('500 Internal Server Error');
    expect(shouldRetryError(serverError)).toBe(true);
  });

  it('returns false for client errors', () => {
    const clientError = new Error('400 Bad Request');
    expect(shouldRetryError(clientError)).toBe(false);
  });

  it('returns false for validation errors', () => {
    const validationError = new Error('Invalid input');
    expect(shouldRetryError(validationError)).toBe(false);
  });
});