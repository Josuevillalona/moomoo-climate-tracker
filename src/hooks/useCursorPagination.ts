import { useState, useEffect, useCallback, useRef } from 'react';
import { FundingService } from '../lib/api/funding';
import { FundingDeal, DealFilters } from '../types/api';

export interface CursorPaginationOptions {
  pageSize?: number;
  initialFilters?: DealFilters;
  enableAutoRefresh?: boolean;
  autoRefreshInterval?: number;
}

export interface CursorPaginationReturn {
  deals: FundingDeal[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  isLoadingMore: boolean;
  filters: DealFilters;
  lastUpdated: Date | null;
  // Actions
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  setFilters: (filters: DealFilters) => void;
  reset: () => void;
}

/**
 * Enhanced pagination hook using cursor-based pagination for better performance
 * with large datasets. Uses ID + date as cursor for consistent ordering.
 */
export function useCursorPagination(options: CursorPaginationOptions = {}): CursorPaginationReturn {
  const {
    pageSize = 20,
    initialFilters = {},
    enableAutoRefresh = false,
    autoRefreshInterval = 5 * 60 * 1000
  } = options;

  // State management
  const [deals, setDeals] = useState<FundingDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cursor, setCursor] = useState<{ id: number; date: string } | null>(null);
  
  // Filter state
  const [filters, setFiltersState] = useState<DealFilters>({
    ...initialFilters,
    limit: pageSize
  });

  // Refs for cleanup and auto-refresh
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced fetch function with cursor-based pagination
  const fetchDeals = useCallback(async (
    currentFilters: DealFilters,
    currentCursor: { id: number; date: string } | null = null,
    append = false
  ) => {
    console.log('useCursorPagination: fetchDeals called', { 
      currentFilters, 
      currentCursor, 
      append 
    });

    if (mountedRef.current) {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
    }

    try {
      // Build optimized query with cursor
      const queryFilters: DealFilters = {
        ...currentFilters,
        limit: pageSize
      };

      // Add cursor conditions for pagination
      if (currentCursor) {
        // Use cursor for consistent pagination
        queryFilters.cursor = currentCursor;
      }

      const response = await FundingService.getDealsWithCursor(queryFilters);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (mountedRef.current && response.data) {
        const { data: newDeals, hasMore: moreAvailable, nextCursor } = response.data;
        
        if (append) {
          setDeals(prevDeals => [...prevDeals, ...newDeals]);
        } else {
          setDeals(newDeals);
        }
        
        setHasMore(moreAvailable);
        setCursor(nextCursor);
        setLastUpdated(new Date());
        
        console.log('useCursorPagination: Data updated', {
          newDealsCount: newDeals.length,
          totalDealsCount: append ? deals.length + newDeals.length : newDeals.length,
          hasMore: moreAvailable,
          nextCursor
        });
      }
    } catch (err) {
      console.error('useCursorPagination: Error fetching data:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch deals');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [deals.length, pageSize]);

  // Load more data using cursor
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || isLoadingMore || !cursor) return;

    console.log('useCursorPagination: loadMore called with cursor:', cursor);
    await fetchDeals(filters, cursor, true);
  }, [hasMore, loading, isLoadingMore, cursor, filters, fetchDeals]);

  // Refresh data (reset to first page)
  const refresh = useCallback(async () => {
    console.log('useCursorPagination: refresh called');
    setCursor(null);
    await fetchDeals(filters, null, false);
  }, [filters, fetchDeals]);

  // Update filters and reset pagination
  const setFilters = useCallback((newFilters: DealFilters) => {
    console.log('useCursorPagination: setFilters called', newFilters);
    
    const filtersWithPageSize = {
      ...newFilters,
      limit: newFilters.limit || pageSize
    };
    
    setFiltersState(filtersWithPageSize);
    setCursor(null);
    fetchDeals(filtersWithPageSize, null, false);
  }, [pageSize, fetchDeals]);

  // Reset pagination state
  const reset = useCallback(() => {
    console.log('useCursorPagination: reset called');
    setDeals([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
    setLastUpdated(null);
  }, []);

  // Initial data fetch
  useEffect(() => {
    console.log('useCursorPagination: Initial fetch effect');
    fetchDeals(filters, null, false);
  }, []); // Empty dependency array for initial load only

  // Auto-refresh setup
  useEffect(() => {
    if (enableAutoRefresh) {
      console.log('useCursorPagination: Setting up auto-refresh');
      
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          console.log('useCursorPagination: Auto-refresh triggered');
          refresh();
        }
      }, autoRefreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [enableAutoRefresh, autoRefreshInterval, refresh]);

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

  return {
    deals,
    loading,
    error,
    hasMore,
    isLoadingMore,
    filters,
    lastUpdated,
    loadMore,
    refresh,
    setFilters,
    reset
  };
}

export default useCursorPagination;