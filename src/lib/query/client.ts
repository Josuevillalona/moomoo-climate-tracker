import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized defaults for our use case
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep data in cache for 30 minutes (increased for better performance)
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data, but with throttling
      refetchOnWindowFocus: 'always',
      // Refetch on reconnect for data consistency
      refetchOnReconnect: 'always',
      // Disable automatic background refetch (we'll handle this manually)
      refetchInterval: false,
      refetchIntervalInBackground: false,
      // Network mode for better offline handling
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations once on failure
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
      // Network mode for mutations
      networkMode: 'online',
    },
  },
});

// Add global error handler
queryClient.setMutationDefaults(['dashboard'], {
  mutationFn: async (variables: any) => {
    // Global mutation logic can go here
    throw new Error('Mutation not implemented');
  },
  onError: (error) => {
    console.error('Mutation error:', error);
  },
});

// Add query cache event listeners for debugging and monitoring
if (process.env.NODE_ENV === 'development') {
  queryClient.getQueryCache().subscribe((event) => {
    console.log('Query cache event:', event.type, event.query.queryKey);
  });
}

// Memory management: periodically clean up unused queries
if (typeof window !== 'undefined') {
  setInterval(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const unusedQueries = queries.filter(
      query => query.getObserversCount() === 0 && 
      Date.now() - (query.state.dataUpdatedAt || 0) > 30 * 60 * 1000 // 30 minutes old
    );
    
    if (unusedQueries.length > 0) {
      console.log(`Cleaning up ${unusedQueries.length} unused queries`);
      unusedQueries.forEach(query => cache.remove(query));
    }
  }, 10 * 60 * 1000); // Run every 10 minutes
}