# Data Caching and Memoization

This document describes the intelligent data caching and memoization implementation using React Query (TanStack Query).

## Overview

The caching system provides:
- **Intelligent caching** with configurable stale times
- **Background data refresh** without blocking UI
- **Cache invalidation strategies** for data freshness
- **Optimistic updates** and error recovery
- **Performance optimizations** through memoization

## Architecture

### Query Client Configuration

The query client is configured with optimized defaults:

```typescript
// src/lib/query/client.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      gcTime: 10 * 60 * 1000,       // 10 minutes
      retry: 3,                      // Retry failed requests 3 times
      refetchOnWindowFocus: true,    // Refetch when window gains focus
      refetchInterval: 5 * 60 * 1000, // Background refresh every 5 minutes
    },
  },
});
```

### Query Keys

Hierarchical query keys enable efficient cache invalidation:

```typescript
// src/lib/query/keys.ts
export const queryKeys = {
  dashboard: {
    all: ['dashboard'],
    metrics: () => [...queryKeys.dashboard.all, 'metrics'],
    recentDeals: (limit?: number) => [...queryKeys.dashboard.all, 'recent-deals', limit],
  },
};
```

## Usage

### Basic Usage with Caching

Replace the original `useDashboardData` hook with the cached version:

```typescript
import { useDashboardDataCached } from '../hooks/useDashboardDataCached';

function Dashboard() {
  const {
    metrics,
    recentDeals,
    loading,
    error,
    refetch,
    isRefetching,
    lastUpdated,
  } = useDashboardDataCached({
    recentDealsLimit: 5,
    enableBackgroundRefresh: true,
    backgroundRefreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Component logic...
}
```

### Individual Query Hooks

For more granular control, use individual query hooks:

```typescript
import { useDashboardMetrics, useRecentDeals } from '../hooks/queries';

function MetricsComponent() {
  const { data: metrics, isLoading, error } = useDashboardMetrics();
  // Component logic...
}

function RecentDealsComponent() {
  const { data: deals, isLoading, error } = useRecentDeals(10);
  // Component logic...
}
```

### Cache Invalidation

Invalidate specific parts of the cache when data changes:

```typescript
import { cacheInvalidation } from '../lib/query/invalidation';

// Invalidate all dashboard data
await cacheInvalidation.invalidateDashboard();

// Invalidate only metrics
await cacheInvalidation.invalidateDashboardMetrics();

// Invalidate recent deals
await cacheInvalidation.invalidateRecentDeals(5);
```

### Background Refresh

Enable background refresh for seamless data updates:

```typescript
import { useBackgroundRefresh } from '../hooks/useBackgroundRefresh';

function App() {
  const { refreshNow, isRefreshing } = useBackgroundRefresh({
    enabled: true,
    interval: 5 * 60 * 1000, // 5 minutes
    onlyWhenFocused: true,
  });

  // Manual refresh
  const handleRefresh = () => refreshNow();
}
```

### Cache Preloading

Preload data before user navigation:

```typescript
import { cachePreload } from '../lib/query/preload';

// Preload dashboard data
await cachePreload.preloadDashboard(5);

// Check if data exists in cache
const { hasAll } = cachePreload.hasCachedData(5);
```

## Configuration Options

### Query-Specific Configuration

Different data types have different caching strategies:

```typescript
// Dashboard metrics (stable data)
useDashboardMetrics() // 10 minutes stale time, 30 minutes cache time

// Recent deals (dynamic data)
useRecentDeals() // 2 minutes stale time, 10 minutes cache time
```

### Background Refresh Options

```typescript
useBackgroundRefresh({
  enabled: true,                    // Enable/disable background refresh
  interval: 5 * 60 * 1000,         // Refresh interval (5 minutes)
  onlyWhenFocused: true,            // Only refresh when window is focused
  onRefreshStart: () => {},         // Callback when refresh starts
  onRefreshComplete: () => {},      // Callback when refresh completes
});
```

## Performance Benefits

### Reduced API Calls

- **Cache hits**: Subsequent requests use cached data
- **Background refresh**: Updates happen without user-initiated requests
- **Deduplication**: Multiple components requesting same data share single request

### Improved User Experience

- **Instant loading**: Cached data displays immediately
- **Seamless updates**: Background refresh doesn't show loading states
- **Offline resilience**: Cached data available when network is unavailable

### Memory Management

- **Garbage collection**: Unused cache entries are automatically cleaned up
- **Memory limits**: Cache size is managed automatically
- **Selective invalidation**: Only invalidate specific data when needed

## Error Handling

### Retry Logic

```typescript
// Exponential backoff retry
retry: 3,
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
```

### Error Recovery

```typescript
// Graceful error handling
if (error) {
  return <ErrorBoundary error={error} onRetry={refetch} />;
}
```

## Monitoring and Debugging

### Cache Statistics

```typescript
import { cacheInvalidation } from '../lib/query/invalidation';

const stats = cacheInvalidation.getCacheStats();
console.log('Cache stats:', stats);
// Output: { totalQueries: 5, activeQueries: 2, staleQueries: 1, ... }
```

### React Query Devtools

Development tools are automatically included:

```typescript
// Automatically included in development
{process.env.NODE_ENV === 'development' && (
  <ReactQueryDevtools initialIsOpen={false} />
)}
```

## Migration Guide

### From Original Hook

Replace `useDashboardData` with `useDashboardDataCached`:

```typescript
// Before
const { metrics, recentDeals, loading, error, refetch } = useDashboardData({
  recentDealsLimit: 5,
  enableAutoRefresh: true,
});

// After
const { metrics, recentDeals, loading, error, refetch } = useDashboardDataCached({
  recentDealsLimit: 5,
  enableBackgroundRefresh: true,
});
```

### Provider Setup

Wrap your app with the QueryProvider:

```typescript
// src/app/layout.tsx
import { QueryProvider } from '../components/providers/QueryProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

## Best Practices

1. **Use appropriate stale times**: Longer for stable data, shorter for dynamic data
2. **Implement cache invalidation**: Invalidate cache when data changes
3. **Enable background refresh**: Keep data fresh without user interaction
4. **Handle loading states**: Show loading only when no cached data exists
5. **Monitor cache performance**: Use devtools and statistics for optimization

## Testing

The caching implementation includes comprehensive tests:

```bash
# Run cache-specific tests
npm test -- --testPathPatterns="query.*test"

# Run all tests
npm test
```

## Troubleshooting

### Common Issues

1. **Stale data**: Check stale time configuration
2. **Memory usage**: Monitor cache size and garbage collection
3. **Network requests**: Verify background refresh settings
4. **Cache invalidation**: Ensure proper invalidation after mutations

### Debug Tools

- React Query Devtools (development)
- Cache statistics API
- Browser network tab
- Console logging for cache hits/misses