import { queryClient } from '../client';

describe('Query Client Configuration', () => {
  it('should have correct default options', () => {
    const defaultOptions = queryClient.getDefaultOptions();
    
    // Check query defaults
    expect(defaultOptions.queries?.staleTime).toBe(5 * 60 * 1000); // 5 minutes
    expect(defaultOptions.queries?.gcTime).toBe(30 * 60 * 1000); // 30 minutes
    expect(typeof defaultOptions.queries?.retry).toBe('function');
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe('always');
    expect(defaultOptions.queries?.refetchOnReconnect).toBe('always');
    expect(defaultOptions.queries?.refetchInterval).toBe(false);
    expect(defaultOptions.queries?.refetchIntervalInBackground).toBe(false);
    
    // Check mutation defaults
    expect(typeof defaultOptions.mutations?.retry).toBe('function');
  });

  it('should have retry delay function', () => {
    const defaultOptions = queryClient.getDefaultOptions();
    const retryDelay = defaultOptions.queries?.retryDelay as Function;
    
    expect(typeof retryDelay).toBe('function');
    
    // Test exponential backoff
    expect(retryDelay(0)).toBe(1000); // First retry: 1 second
    expect(retryDelay(1)).toBe(2000); // Second retry: 2 seconds
    expect(retryDelay(2)).toBe(4000); // Third retry: 4 seconds
    expect(retryDelay(10)).toBe(30000); // Max delay: 30 seconds
  });
});