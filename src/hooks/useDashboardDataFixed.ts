import { useState, useEffect, useCallback, useRef } from 'react';
import { FundingService } from '../lib/api/funding';
import { DashboardMetrics, FundingDeal } from '../types/api';

export interface UseDashboardDataOptions {
  recentDealsLimit?: number;
  enableAutoRefresh?: boolean;
  autoRefreshInterval?: number;
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
  console.log('🎯 useDashboardData: Hook starting with options:', options);
  
  // State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentDeals, setRecentDeals] = useState<FundingDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const mountedRef = useRef(true);
  
  console.log('🎯 useDashboardData: States initialized, about to set up data fetch');

  // Data fetch function
  const fetchData = useCallback(async () => {
    console.log('🚀 useDashboardData: Starting data fetch...');
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 useDashboardData: Calling APIs...');
      const [metricsResponse, dealsResponse] = await Promise.all([
        FundingService.getDashboardMetrics(),
        FundingService.getRecentDeals(options.recentDealsLimit || 5)
      ]);
      
      console.log('🚀 useDashboardData: API responses received:', {
        metrics: metricsResponse,
        deals: dealsResponse
      });
      
      if (mountedRef.current) {
        setMetrics(metricsResponse.data);
        setRecentDeals(dealsResponse.data || []);
        setLastUpdated(new Date());
        console.log('🚀 useDashboardData: State updated successfully!');
        console.log('🚀 useDashboardData: New state - metrics:', !!metricsResponse.data, 'deals:', dealsResponse.data?.length || 0);
      }
    } catch (err) {
      console.error('🚀 useDashboardData: Error fetching data:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsRefetching(false);
        console.log('🚀 useDashboardData: Loading set to false');
      }
    }
  }, [options.recentDealsLimit]);

  // Initial data load
  useEffect(() => {
    console.log('🚀 USEEFFECT IS RUNNING!!!! FINALLY!');
    fetchData();
    
    return () => {
      console.log('🧹 useEffect cleanup called');
    };
  }, [fetchData]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = useCallback(async () => {
    console.log('🚀 useDashboardData: Manual refetch requested');
    setIsRefetching(true);
    await fetchData();
  }, [fetchData]);

  console.log('🎯 useDashboardData: Returning state:', {
    loading,
    error,
    metricsLoaded: !!metrics,
    recentDealsCount: recentDeals.length
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
