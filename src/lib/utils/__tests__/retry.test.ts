import { withRetry } from '../retry';

describe('withRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return result on first successful attempt', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');

    const result = await withRetry(mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValueOnce('success');

    const result = await withRetry(mockFn, 3, 100);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max attempts', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Persistent failure'));

    await expect(withRetry(mockFn, 2, 100)).rejects.toThrow('Persistent failure');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should use exponential backoff', async () => {
    // Test that exponential backoff delays increase properly
    const originalSetTimeout = global.setTimeout;
    const delays: number[] = [];
    
    global.setTimeout = jest.fn().mockImplementation((callback, delay) => {
      delays.push(delay);
      return originalSetTimeout(callback, 0); // Execute immediately for test
    });

    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValueOnce('success');

    const result = await withRetry(mockFn, 3, 1000);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
    
    // Check that delays follow exponential backoff pattern
    expect(delays).toHaveLength(2); // Two delays for two retries
    expect(delays[0]).toBe(1000); // First retry: 1000 * 2^0 = 1000
    expect(delays[1]).toBe(2000); // Second retry: 1000 * 2^1 = 2000

    global.setTimeout = originalSetTimeout;
  });

  it('should handle different error types', async () => {
    const networkError = new Error('Network error');
    const timeoutError = new Error('Timeout error');
    
    const mockFn = jest.fn()
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValueOnce('success');

    const result = await withRetry(mockFn, 3, 100);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should handle custom max attempts', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));

    await expect(withRetry(mockFn, 5, 100)).rejects.toThrow('Always fails');
    expect(mockFn).toHaveBeenCalledTimes(5);
  });

  it('should handle zero max attempts', async () => {
    const mockFn = jest.fn().mockRejectedValue(new Error('Immediate failure'));

    await expect(withRetry(mockFn, 0, 100)).rejects.toThrow('Max attempts must be greater than 0');
    expect(mockFn).toHaveBeenCalledTimes(0);
  });

  it('should handle custom backoff delay', async () => {
    jest.useFakeTimers();
    
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce('success');

    // Start the retry process
    const retryPromise = withRetry(mockFn, 2, 500);

    // Allow the first call to execute
    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Fast-forward custom backoff period
    jest.advanceTimersByTime(500);
    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Complete the promise
    const result = await retryPromise;
    expect(result).toBe('success');
    
    jest.useRealTimers();
  });

  it('should preserve original error message', async () => {
    const originalError = new Error('Original error message');
    const mockFn = jest.fn().mockRejectedValue(originalError);

    await expect(withRetry(mockFn, 1, 100)).rejects.toThrow('Original error message');
  });

  it('should handle async functions that return promises', async () => {
    const mockAsyncFn = jest.fn().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'async success';
    });

    const result = await withRetry(mockAsyncFn);

    expect(result).toBe('async success');
    expect(mockAsyncFn).toHaveBeenCalledTimes(1);
  });

  it('should handle functions that throw synchronously', async () => {
    const mockFn = jest.fn().mockImplementation(() => {
      throw new Error('Sync error');
    });

    await expect(withRetry(mockFn, 2, 100)).rejects.toThrow('Sync error');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should handle mixed sync and async errors', async () => {
    const mockFn = jest.fn()
      .mockImplementationOnce(() => {
        throw new Error('Sync error');
      })
      .mockRejectedValueOnce(new Error('Async error'))
      .mockResolvedValueOnce('success');

    const result = await withRetry(mockFn, 3, 100);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });
});