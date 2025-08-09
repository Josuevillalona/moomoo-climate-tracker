import { useState, useEffect, useCallback, useRef } from 'react';
import { FundingService } from '../lib/api/funding';
import { DashboardMetrics, FundingDeal } from '../types/api';

export interface UseDashboardDataOptions {
  recentDealsLimit?: number;
  enableAutoRefresh?: boolean;
  autoRefreshInterval?: number;
  onDataUpdate?: (metrics: DashboardMetrics | null, deals: FundingDeal[]) => void;
}

export interface UseDashboardDataReturn {
  metrics: DashboardMetrics | null;
  recentDeals: FundingDeal[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
  lastUpdated: Date | null;
  retryCount: number;
}

export function useDashboardData(options: UseDashboardDataOptions = {}): UseDashboardDataReturn {
  const hookId = useRef(Math.random().toString(36).substr(2, 9));
  // Reduced logging - only log hook initialization
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 useDashboardData: Hook initialized with options:', options);
  }
  
  // Extract and memoize options to prevent unnecessary re-renders
  const recentDealsLimit = options.recentDealsLimit || 5;
  const enableAutoRefresh = options.enableAutoRefresh || false;
  const autoRefreshInterval = options.autoRefreshInterval || 5 * 60 * 1000;
  const onDataUpdate = options.onDataUpdate;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentDeals, setRecentDeals] = useState<FundingDeal[]>([]);
  const [isRefetching, setIsRefetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Fetch data function
  const fetchData = useCallback(async (isRefetch = false) => {
    // Reduced logging frequency
    if (process.env.NODE_ENV === 'development' && !isRefetch) {
      console.log('🚀 useDashboardData: Fetching initial data');
    }
    
    // Set loading state immediately
    if (mountedRef.current) {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setLoading(true);
      }
      setError(null);
    }
    
    try {
      // Make parallel API calls
      const [metricsResponse, dealsResponse] = await Promise.all([
        FundingService.getDashboardMetrics(),
        FundingService.getRecentDeals(recentDealsLimit)
      ]);
      
      // Check for API errors
      if (metricsResponse.error || dealsResponse.error) {
        const errorMessage = metricsResponse.error || dealsResponse.error || 'Unknown error';
        throw new Error(`Failed to fetch dashboard metrics: ${errorMessage}`);
      }
      
      // Update state if component is still mounted
      if (mountedRef.current) {
        setMetrics(metricsResponse.data);
        setRecentDeals(dealsResponse.data || []);
        setLastUpdated(new Date());
        
        // Clear loading state immediately after setting data
        setLoading(false);
        setIsRefetching(false);
        
        if (onDataUpdate) {
          onDataUpdate(metricsResponse.data, dealsResponse.data || []);
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 useDashboardData: Data updated successfully');
        }
      }
      
    } catch (err) {
      console.error('🚀 useDashboardData: Error fetching data:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    }
    
    // Clear loading state in error case only
    if (mountedRef.current) {
      console.log('🚀 useDashboardData: Clearing loading state after error');
      setLoading(false);
      setIsRefetching(false);
    }
    
  }, [recentDealsLimit]);

  // Initial data fetch - run immediately on mount
  useEffect(() => {
    console.log('🚀 useDashboardData: Initial fetch effect triggered, hookId:', hookId.current);
    console.log('🚀 useDashboardData: About to call fetchData');
    
    // Call fetchData directly to avoid dependency issues
    const initialFetch = async () => {
      console.log('🚀 useDashboardData: fetchData called with isRefetch: false, hookId:', hookId.current);
      
      // Set loading state immediately
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }
      
      try {
        console.log('🚀 useDashboardData: Calling APIs...');
        const [metricsResponse, dealsResponse] = await Promise.all([
          FundingService.getDashboardMetrics(),
          FundingService.getRecentDeals(recentDealsLimit)
        ]);
        
        console.log('🚀 useDashboardData: API responses received');
        
        // Check for API errors
        if (metricsResponse.error || dealsResponse.error) {
          const errorMessage = metricsResponse.error || dealsResponse.error || 'Unknown error';
          throw new Error(`Failed to fetch dashboard metrics: ${errorMessage}`);
        }
        
        // Update state - React handles unmounted component state updates safely
        console.log('🚀 useDashboardData: Setting data');
        setMetrics(metricsResponse.data);
        setRecentDeals(dealsResponse.data || []);
        setLastUpdated(new Date());
        
        // Clear loading state immediately after setting data
        console.log('🚀 useDashboardData: Clearing loading state immediately');
        setLoading(false);
        setIsRefetching(false);
        
        if (onDataUpdate && mountedRef.current) {
          onDataUpdate(metricsResponse.data, dealsResponse.data || []);
        }
      } catch (err) {
        console.error('🚀 useDashboardData: Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        // Clear loading state in error case only
        console.log('🚀 useDashboardData: Clearing loading state after error');
        setLoading(false);
        setIsRefetching(false);
      }
    };
    
    initialFetch();
  }, []); // Empty dependency array to run only once on mount

  // Auto-refresh setup
  useEffect(() => {
    if (enableAutoRefresh) {
      console.log('🔄 Setting up auto-refresh with interval:', autoRefreshInterval);
      
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          console.log('🔄 Auto-refresh triggered');
          fetchData(true);
        }
      }, autoRefreshInterval);

      return () => {
        if (intervalRef.current) {
          console.log('🔄 Clearing auto-refresh interval');
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [enableAutoRefresh, autoRefreshInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const refetch = useCallback(async () => {
    console.log('🚀 useDashboardData: Manual refetch requested');
    await fetchData(true);
  }, [fetchData]);

  console.log('🎯 useDashboardData: Returning state:', {
    hookId: hookId.current,
    loading,
    error,
    metricsLoaded: !!metrics,
    recentDealsCount: recentDeals.length,
    metrics: metrics ? 'has data' : 'null',
    recentDeals: recentDeals.length > 0 ? `${recentDeals.length} deals` : 'empty array',
    shouldShowSkeleton: loading && !metrics && recentDeals.length === 0
  });

  return {
    metrics,
    recentDeals,
    loading,
    error,
    refetch,
    isRefetching,
    lastUpdated,
    retryCount,
  };
}

export default useDashboardData;