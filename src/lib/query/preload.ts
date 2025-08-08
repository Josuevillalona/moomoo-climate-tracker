import { queryClient } from './client';
import { queryKeys } from './keys';
import { FundingService } from '../api/funding';

/**
 * Utilities for preloading and warming cache
 */
export const cachePreload = {
  /**
   * Preload dashboard data before user navigates to dashboard
   */
  preloadDashboard: async (recentDealsLimit: number = 5) => {
    try {
      await Promise.all([
        // Preload metrics
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.metrics(),
          queryFn: async () => {
            const response = await FundingService.getDashboardMetrics();
            if (response.error) throw new Error(response.error);
            if (!response.data) throw new Error('No metrics data received');
            return response.data;
          },
          staleTime: 10 * 60 * 1000, // 10 minutes
        }),
        
        // Preload recent deals
        queryClient.prefetchQuery({
          queryKey: queryKeys.dashboard.recentDeals(recentDealsLimit),
          queryFn: async () => {
            const response = await FundingService.getRecentDeals(recentDealsLimit);
            if (response.error) throw new Error(response.error);
            return response.data || [];
          },
          staleTime: 2 * 60 * 1000, // 2 minutes
        }),
      ]);
      
      console.log('Dashboard data preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload dashboard data:', error);
    }
  },

  /**
   * Warm cache with initial data on app startup
   */
  warmCache: async () => {
    // Only warm cache if no data exists
    const hasMetrics = queryClient.getQueryData(queryKeys.dashboard.metrics());
    const hasDeals = queryClient.getQueryData(queryKeys.dashboard.recentDeals(5));
    
    if (!hasMetrics || !hasDeals) {
      await cachePreload.preloadDashboard();
    }
  },

  /**
   * Set initial data in cache (useful for SSR or initial data from server)
   */
  setInitialData: (metrics: any, deals: any[], recentDealsLimit: number = 5) => {
    // Set metrics data
    queryClient.setQueryData(queryKeys.dashboard.metrics(), metrics);
    
    // Set deals data
    queryClient.setQueryData(queryKeys.dashboard.recentDeals(recentDealsLimit), deals);
    
    console.log('Initial data set in cache');
  },

  /**
   * Check if data exists in cache
   */
  hasCachedData: (recentDealsLimit: number = 5) => {
    const hasMetrics = !!queryClient.getQueryData(queryKeys.dashboard.metrics());
    const hasDeals = !!queryClient.getQueryData(queryKeys.dashboard.recentDeals(recentDealsLimit));
    
    return {
      hasMetrics,
      hasDeals,
      hasAll: hasMetrics && hasDeals,
    };
  },
};