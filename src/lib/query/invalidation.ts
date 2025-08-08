import { queryClient } from './client';
import { queryKeys } from './keys';
import { DashboardMetrics, FundingDeal } from '../../types/api';

/**
 * Cache invalidation utilities for managing data freshness
 */
export const cacheInvalidation = {
  /**
   * Invalidate all dashboard-related queries
   */
  invalidateDashboard: async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.all,
    });
  },

  /**
   * Invalidate only dashboard metrics
   */
  invalidateDashboardMetrics: async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.metrics(),
    });
  },

  /**
   * Invalidate recent deals with optional limit filter
   */
  invalidateRecentDeals: async (limit?: number) => {
    if (limit) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.recentDeals(limit),
      });
    } else {
      // Invalidate all recent deals queries
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.dashboard.all, 'recent-deals'],
      });
    }
  },

  /**
   * Invalidate all deal-related queries
   */
  invalidateDeals: async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.deals.all,
    });
  },

  /**
   * Prefetch dashboard data for better UX
   */
  prefetchDashboard: async (recentDealsLimit: number = 5) => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.metrics(),
        queryFn: async () => {
          const { FundingService } = await import('../api/funding');
          const response = await FundingService.getDashboardMetrics();
          if (response.error) throw new Error(response.error);
          return response.data;
        },
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.recentDeals(recentDealsLimit),
        queryFn: async () => {
          const { FundingService } = await import('../api/funding');
          const response = await FundingService.getRecentDeals(recentDealsLimit);
          if (response.error) throw new Error(response.error);
          return response.data || [];
        },
      }),
    ]);
  },

  /**
   * Clear all cached data
   */
  clearAllCache: () => {
    queryClient.clear();
  },

  /**
   * Smart invalidation based on data changes
   */
  invalidateOnNewDeal: async (newDeal: FundingDeal) => {
    // Invalidate metrics as they will change with new deal
    await cacheInvalidation.invalidateDashboardMetrics();
    
    // Invalidate recent deals as the new deal might be in the recent list
    await cacheInvalidation.invalidateRecentDeals();
    
    // Invalidate any filtered deal lists that might include this deal
    await queryClient.invalidateQueries({
      queryKey: queryKeys.deals.all,
    });
  },

  /**
   * Optimistic updates for better UX
   */
  optimisticUpdate: {
    /**
     * Add a new deal optimistically to recent deals
     */
    addDealToRecent: (newDeal: FundingDeal, limit: number = 5) => {
      const queryKey = queryKeys.dashboard.recentDeals(limit);
      const currentDeals = queryClient.getQueryData<FundingDeal[]>(queryKey) || [];
      
      // Add new deal to the beginning and limit the array
      const updatedDeals = [newDeal, ...currentDeals].slice(0, limit);
      
      queryClient.setQueryData(queryKey, updatedDeals);
    },

    /**
     * Update metrics optimistically
     */
    updateMetrics: (updater: (current: DashboardMetrics | undefined) => DashboardMetrics) => {
      const queryKey = queryKeys.dashboard.metrics();
      queryClient.setQueryData(queryKey, updater);
    },
  },

  /**
   * Background refresh strategies
   */
  backgroundRefresh: {
    /**
     * Silently refetch data in the background
     */
    silentRefresh: async () => {
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: queryKeys.dashboard.metrics(),
          type: 'active',
        }),
        queryClient.refetchQueries({
          queryKey: [...queryKeys.dashboard.all, 'recent-deals'],
          type: 'active',
        }),
      ]);
    },

    /**
     * Refresh only stale data
     */
    refreshStale: async () => {
      await queryClient.refetchQueries({
        stale: true,
        type: 'active',
      });
    },

    /**
     * Periodic background refresh
     */
    startPeriodicRefresh: (intervalMs: number = 5 * 60 * 1000) => {
      const interval = setInterval(async () => {
        // Only refresh if the page is visible
        if (document.visibilityState === 'visible') {
          await cacheInvalidation.backgroundRefresh.refreshStale();
        }
      }, intervalMs);

      return () => clearInterval(interval);
    },
  },

  /**
   * Cache warming strategies
   */
  warmCache: {
    /**
     * Preload critical dashboard data
     */
    preloadDashboard: async () => {
      await cacheInvalidation.prefetchDashboard();
    },

    /**
     * Preload data based on user behavior patterns
     */
    preloadByPattern: async (userPreferences: { 
      preferredDealLimit?: number;
      frequentFilters?: Record<string, any>;
    }) => {
      const promises = [];

      // Preload with user's preferred deal limit
      if (userPreferences.preferredDealLimit) {
        promises.push(cacheInvalidation.prefetchDashboard(userPreferences.preferredDealLimit));
      }

      // Preload frequently used filters
      if (userPreferences.frequentFilters) {
        promises.push(
          queryClient.prefetchQuery({
            queryKey: queryKeys.deals.list(userPreferences.frequentFilters),
            queryFn: async () => {
              const { FundingService } = await import('../api/funding');
              const response = await FundingService.getDealsWithFilters(userPreferences.frequentFilters!);
              if (response.error) throw new Error(response.error);
              return response.data;
            },
          })
        );
      }

      await Promise.all(promises);
    },
  },

  /**
   * Get cache statistics for debugging
   */
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'pending').length,
      cacheSize: cache.getAll().reduce((size, query) => {
        return size + JSON.stringify(query.state.data).length;
      }, 0),
    };
  },

  /**
   * Memory management
   */
  memoryManagement: {
    /**
     * Clear old/unused queries to free memory
     */
    clearUnused: () => {
      queryClient.getQueryCache().clear();
    },

    /**
     * Set memory limits and cleanup strategies
     */
    setMemoryLimits: (maxQueries: number = 50) => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      if (queries.length > maxQueries) {
        // Remove oldest inactive queries
        const inactiveQueries = queries
          .filter(q => q.getObserversCount() === 0)
          .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0));
        
        const toRemove = inactiveQueries.slice(0, queries.length - maxQueries);
        toRemove.forEach(query => cache.remove(query));
      }
    },
  },
};