import { useState, useEffect, useCallback, useRef } from 'react';
import { FundingService } from '../lib/api/funding';
import { DashboardMetrics, FundingDeal, ApiErrorType, ApiException } from '../types/api';

export interface UseDashboardDataReturn {
  metrics: DashboardMetrics | null;
  recentDeals: FundingDeal[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
  lastUpdated: Date | null;
}

export interface UseDashboardDataOptions {
  recentDealsLimit?: number;
  enableAutoRefresh?: boolean;
  autoRefreshInterval?: number; // in milliseconds
  retryAttempts?: number;
  retryDelay?: number; // in milliseconds
}

const DEFAULT_OPTIONS: Required<UseDashboardDataOptions> = {
  recentDealsLimit: 5,
  enableAutoRefresh: false,
  autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

export function useDashboardData(options: UseDashboardDataOptions = {}): UseDashboardDataReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // State management
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentDeals, setRecentDeals] = useState<FundingDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs for cleanup and preventing stale closures
  const mountedRef = useRef(true);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Retry logic with exponential backoff
  const retryWithBackoff = useCallback(
    async (fn: () => Promise<void>, attempt: number = 1): Promise<void> => {
      try {
        await fn();
      } catch (error) {
        if (attempt < opts.retryAttempts && mountedRef.current) {
          const delay = opts.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          
          retryTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              retryWithBackoff(fn, attempt + 1);
            }
          }, delay);
        } else {
          throw error;
        }
      }
    },
    [opts.retryAttempts, opts.retryDelay]
  );

  // Core data fetching function
  const fetchDashboardData = useCallback(async (isRefetch: boolean = false) => {
    if (!mountedRef.current) return;

    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Fetch metrics and recent deals in parallel
      const [metricsResponse, dealsResponse] = await Promise.all([
        FundingService.getDashboardMetrics(),
        FundingService.getRecentDeals(opts.recentDealsLimit)
      ]);

      if (!mountedRef.current) return;

      // Handle metrics response
      if (metricsResponse.error) {
        throw new ApiException(
          ApiErrorType.DATABASE_ERROR,
          `Failed to fetch dashboard metrics: ${metricsResponse.error}`,
          true
        );
      }

      // Handle deals response
      if (dealsResponse.error) {
        throw new ApiException(
          ApiErrorType.DATABASE_ERROR,
          `Failed to fetch recent deals: ${dealsResponse.error}`,
          true
        );
      }

      // Update state with successful data
      setMetrics(metricsResponse.data);
      setRecentDeals(dealsResponse.data || []);
      setLastUpdated(new Date());
      setError(null);

    } catch (error) {
      if (!mountedRef.current) return;

      const errorMessage = error instanceof ApiException 
        ? error.message 
        : error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while fetching dashboard data';

      setError(errorMessage);
      
      // Don't clear existing data on refetch errors to maintain UX
      if (!isRefetch) {
        setMetrics(null);
        setRecentDeals([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsRefetching(false);
      }
    }
  }, [opts.recentDealsLimit]);

  // Refetch function with retry logic
  const refetch = useCallback(async () => {
    if (!mountedRef.current) return;

    await retryWithBackoff(() => fetchDashboardData(true));
  }, [fetchDashboardData, retryWithBackoff]);

  // Initial data fetch on mount
  useEffect(() => {
    const initialFetch = async () => {
      await retryWithBackoff(() => fetchDashboardData(false));
    };

    initialFetch();
  }, [fetchDashboardData, retryWithBackoff]);

  // Auto-refresh setup
  useEffect(() => {
    if (!opts.enableAutoRefresh || !mountedRef.current) return;

    autoRefreshIntervalRef.current = setInterval(() => {
      if (mountedRef.current && !loading && !isRefetching) {
        refetch();
      }
    }, opts.autoRefreshInterval);

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [opts.enableAutoRefresh, opts.autoRefreshInterval, loading, isRefetching, refetch]);

  // Handle visibility change to refetch data when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading && !isRefetching && lastUpdated) {
        // Refetch if data is older than 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (lastUpdated < fiveMinutesAgo) {
          refetch();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, isRefetching, lastUpdated, refetch]);

  return {
    metrics,
    recentDeals,
    loading,
    error,
    refetch,
    isRefetching,
    lastUpdated,
  };
}

// Additional utility hook for cache invalidation
export function useDashboardCache() {
  const [cacheKey, setCacheKey] = useState(0);

  const invalidateCache = useCallback(() => {
    setCacheKey(prev => prev + 1);
  }, []);

  return {
    cacheKey,
    invalidateCache,
  };
}