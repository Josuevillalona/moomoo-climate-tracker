import { useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboardDataCached, UseDashboardDataCachedOptions } from './useDashboardDataCached';
import { useBackgroundRefresh } from './useBackgroundRefresh';
import { cacheInvalidation } from '../lib/query/invalidation';
import { DashboardMetrics, FundingDeal } from '../types/api';

export interface UseDashboardDataOptimizedOptions extends UseDashboardDataCachedOptions {
  /**
   * Enable intelligent background refresh
   * @default true
   */
  enableBackgroundRefresh?: boolean;
  
  /**
   * Background refresh interval in milliseconds
   * @default 5 * 60 * 1000 (5 minutes)
   */
  backgroundRefreshInterval?: number;
  
  /**
   * Enable cache preloading strategies
   * @default true
   */
  enableCachePreloading?: boolean;
  
  /**
   * Enable optimistic updates
   * @default true
   */
  enableOptimisticUpdates?: boolean;
  
  /**
   * Memory management options
   */
  memoryManagement?: {
    maxQueries?: number;
    cleanupInterval?: number;
  };
  
  /**
   * Performance monitoring callback
   */
  onPerformanceMetrics?: (metrics: {
    cacheHitRate: number;
    averageLoadTime: number;
    errorRate: number;
  }) => void;
}

export interface UseDashboardDataOptimizedReturn {
  // Data and state
  metrics: DashboardMetrics | null;
  recentDeals: FundingDeal[];
  loading: boolean;
  error: string | null;
  isRefetching: boolean;
  lastUpdated: Date | null;
  retryCount: number;
  
  // Actions
  refetch: () => Promise<void>;
  
  // Cache management
  invalidateCache: () => Promise<void>;
  preloadData: () => Promise<void>;
  clearCache: () => void;
  
  // Background refresh control
  startBackgroundRefresh: () => void;
  stopBackgroundRefresh: () => void;
  isBackgroundRefreshActive: boolean;
  
  // Performance metrics
  cacheStats: {
    totalQueries: number;
    activeQueries: number;
    staleQueries: number;
    errorQueries: number;
    cacheSize: number;
  };
  
  // Optimistic updates
  optimisticUpdate: {
    addDeal: (deal: FundingDeal) => void;
    updateMetrics: (updater: (current: DashboardMetrics | undefined) => DashboardMetrics) => void;
  };
}

export function useDashboardDataOptimized(
  options: UseDashboardDataOptimizedOptions = {}
): UseDashboardDataOptimizedReturn {
  const {
    enableBackgroundRefresh = true,
    backgroundRefreshInterval = 5 * 60 * 1000,
    enableCachePreloading = true,
    enableOptimisticUpdates = true,
    memoryManagement = {},
    onPerformanceMetrics,
    ...cachedOptions
  } = options;

  const queryClient = useQueryClient();
  
  // Use the cached dashboard data hook
  const dashboardData = useDashboardDataCached(cachedOptions);
  
  // Set up background refresh
  const backgroundRefresh = useBackgroundRefresh({
    interval: backgroundRefreshInterval,
    enabled: enableBackgroundRefresh,
    onRefreshComplete: () => {
      // Optionally trigger performance metrics calculation
      if (onPerformanceMetrics) {
        const stats = cacheInvalidation.getCacheStats();
        onPerformanceMetrics({
          cacheHitRate: 0.95, // This would need to be calculated based on actual metrics
          averageLoadTime: 500, // This would need to be tracked
          errorRate: stats.errorQueries / stats.totalQueries,
        });
      }
    },
  });

  // Cache management functions
  const invalidateCache = useCallback(async () => {
    await cacheInvalidation.invalidateDashboard();
  }, []);

  const preloadData = useCallback(async () => {
    if (enableCachePreloading) {
      await cacheInvalidation.prefetchDashboard(cachedOptions.recentDealsLimit);
    }
  }, [enableCachePreloading, cachedOptions.recentDealsLimit]);

  const clearCache = useCallback(() => {
    cacheInvalidation.clearAllCache();
  }, []);

  // Optimistic update functions
  const optimisticUpdate = useMemo(() => ({
    addDeal: (deal: FundingDeal) => {
      if (enableOptimisticUpdates) {
        cacheInvalidation.optimisticUpdate.addDealToRecent(
          deal, 
          cachedOptions.recentDealsLimit || 5
        );
      }
    },
    updateMetrics: (updater: (current: DashboardMetrics | undefined) => DashboardMetrics) => {
      if (enableOptimisticUpdates) {
        cacheInvalidation.optimisticUpdate.updateMetrics(updater);
      }
    },
  }), [enableOptimisticUpdates, cachedOptions.recentDealsLimit]);

  // Get cache statistics
  const cacheStats = useMemo(() => {
    return cacheInvalidation.getCacheStats();
  }, [dashboardData.lastUpdated]); // Recalculate when data updates

  // Memory management
  useEffect(() => {
    if (memoryManagement.maxQueries || memoryManagement.cleanupInterval) {
      const interval = setInterval(() => {
        if (memoryManagement.maxQueries) {
          cacheInvalidation.memoryManagement.setMemoryLimits(memoryManagement.maxQueries);
        }
      }, memoryManagement.cleanupInterval || 10 * 60 * 1000); // Default 10 minutes

      return () => clearInterval(interval);
    }
  }, [memoryManagement]);

  // Preload data on mount
  useEffect(() => {
    if (enableCachePreloading) {
      preloadData();
    }
  }, [enableCachePreloading, preloadData]);

  // Enhanced refetch that includes cache warming
  const enhancedRefetch = useCallback(async () => {
    await dashboardData.refetch();
    
    // Warm cache with related data
    if (enableCachePreloading) {
      setTimeout(() => {
        preloadData();
      }, 100); // Small delay to avoid overwhelming the API
    }
  }, [dashboardData.refetch, enableCachePreloading, preloadData]);

  return {
    // Data and state from cached hook
    metrics: dashboardData.metrics,
    recentDeals: dashboardData.recentDeals,
    loading: dashboardData.loading,
    error: dashboardData.error,
    isRefetching: dashboardData.isRefetching,
    lastUpdated: dashboardData.lastUpdated,
    retryCount: dashboardData.retryCount,
    
    // Enhanced actions
    refetch: enhancedRefetch,
    
    // Cache management
    invalidateCache,
    preloadData,
    clearCache,
    
    // Background refresh control
    startBackgroundRefresh: backgroundRefresh.start,
    stopBackgroundRefresh: backgroundRefresh.stop,
    isBackgroundRefreshActive: backgroundRefresh.isActive,
    
    // Performance metrics
    cacheStats,
    
    // Optimistic updates
    optimisticUpdate,
  };
}

/**
 * Hook for dashboard data with automatic performance optimization
 */
export function useDashboardDataAuto(
  options: Omit<UseDashboardDataOptimizedOptions, 'enableBackgroundRefresh' | 'enableCachePreloading' | 'enableOptimisticUpdates'> = {}
) {
  // Automatically enable all optimizations
  return useDashboardDataOptimized({
    ...options,
    enableBackgroundRefresh: true,
    enableCachePreloading: true,
    enableOptimisticUpdates: true,
    memoryManagement: {
      maxQueries: 50,
      cleanupInterval: 10 * 60 * 1000, // 10 minutes
      ...options.memoryManagement,
    },
  });
}

export default useDashboardDataOptimized;