import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { queryKeys } from '../lib/query/keys';
import { useDashboardMetrics } from './queries/useDashboardMetrics';
import { useRecentDeals } from './queries/useRecentDeals';
import { DashboardMetrics, FundingDeal } from '../types/api';

export interface UseDashboardDataCachedOptions {
  recentDealsLimit?: number;
  enableAutoRefresh?: boolean;
  autoRefreshInterval?: number;
  onDataUpdate?: (metrics: DashboardMetrics | null, deals: FundingDeal[]) => void;
}

export interface UseDashboardDataCachedReturn {
  metrics: DashboardMetrics | null;
  recentDeals: FundingDeal[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
  lastUpdated: Date | null;
  retryCount: number;
}

export function useDashboardDataCached(
  options: UseDashboardDataCachedOptions = {}
): UseDashboardDataCachedReturn {
  const queryClient = useQueryClient();
  const recentDealsLimit = options.recentDealsLimit || 5;
  const enableAutoRefresh = options.enableAutoRefresh || false;
  const autoRefreshInterval = options.autoRefreshInterval || 5 * 60 * 1000;
  const onDataUpdate = options.onDataUpdate;

  // Use individual query hooks for better caching granularity
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
    isRefetching: isRefetchingMetrics,
    dataUpdatedAt: metricsUpdatedAt,
    failureCount: metricsRetryCount
  } = useDashboardMetrics();

  const {
    data: recentDeals,
    isLoading: dealsLoading,
    error: dealsError,
    refetch: refetchDeals,
    isRefetching: isRefetchingDeals,
    dataUpdatedAt: dealsUpdatedAt,
    failureCount: dealsRetryCount
  } = useRecentDeals(recentDealsLimit);

  // Combine loading states
  const loading = metricsLoading || dealsLoading;
  const isRefetching = isRefetchingMetrics || isRefetchingDeals;
  
  // Combine error states
  const error = metricsError?.message || dealsError?.message || null;
  
  // Get the most recent update time
  const lastUpdated = metricsUpdatedAt && dealsUpdatedAt 
    ? new Date(Math.max(metricsUpdatedAt, dealsUpdatedAt))
    : metricsUpdatedAt 
      ? new Date(metricsUpdatedAt)
      : dealsUpdatedAt 
        ? new Date(dealsUpdatedAt)
        : null;

  // Get the highest retry count
  const retryCount = Math.max(metricsRetryCount, dealsRetryCount);

  // Manual refetch function
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchMetrics(),
      refetchDeals()
    ]);
  }, [refetchMetrics, refetchDeals]);

  // Call onDataUpdate when data changes
  useEffect(() => {
    if (onDataUpdate && metrics && recentDeals) {
      onDataUpdate(metrics, recentDeals);
    }
  }, [metrics, recentDeals, onDataUpdate]);

  // Auto-refresh setup using React Query's built-in refetch interval
  useEffect(() => {
    if (enableAutoRefresh) {
      // Set up custom interval for more control
      const interval = setInterval(() => {
        // Only refetch if window is focused to avoid unnecessary requests
        if (document.visibilityState === 'visible') {
          refetch();
        }
      }, autoRefreshInterval);

      return () => clearInterval(interval);
    }
  }, [enableAutoRefresh, autoRefreshInterval, refetch]);

  return {
    metrics: metrics || null,
    recentDeals: recentDeals || [],
    loading,
    error,
    refetch,
    isRefetching,
    lastUpdated,
    retryCount,
  };
}

// Cache invalidation utilities
export const dashboardCacheUtils = {
  /**
   * Invalidate all dashboard-related queries
   */
  invalidateAll: (queryClient: ReturnType<typeof useQueryClient>) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.all
    });
  },

  /**
   * Invalidate only metrics
   */
  invalidateMetrics: (queryClient: ReturnType<typeof useQueryClient>) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.metrics()
    });
  },

  /**
   * Invalidate only recent deals
   */
  invalidateRecentDeals: (queryClient: ReturnType<typeof useQueryClient>, limit?: number) => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.recentDeals(limit)
    });
  },

  /**
   * Prefetch dashboard data
   */
  prefetchDashboard: async (queryClient: ReturnType<typeof useQueryClient>, limit: number = 5) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.metrics(),
        staleTime: 10 * 60 * 1000, // 10 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.recentDeals(limit),
        staleTime: 2 * 60 * 1000, // 2 minutes
      })
    ]);
  },

  /**
   * Set optimistic data for dashboard metrics
   */
  setOptimisticMetrics: (
    queryClient: ReturnType<typeof useQueryClient>, 
    metrics: DashboardMetrics
  ) => {
    queryClient.setQueryData(queryKeys.dashboard.metrics(), metrics);
  },

  /**
   * Set optimistic data for recent deals
   */
  setOptimisticRecentDeals: (
    queryClient: ReturnType<typeof useQueryClient>, 
    deals: FundingDeal[],
    limit: number = 5
  ) => {
    queryClient.setQueryData(queryKeys.dashboard.recentDeals(limit), deals);
  },

  /**
   * Remove all dashboard data from cache
   */
  clearCache: (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.removeQueries({
      queryKey: queryKeys.dashboard.all
    });
  }
};

export default useDashboardDataCached;