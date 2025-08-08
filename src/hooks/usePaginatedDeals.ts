import { useState, useEffect, useCallback, useRef } from 'react';
import { FundingService } from '../lib/api/funding';
import { FundingDeal, DealFilters, PaginatedResponse } from '../types/api';

export interface UsePaginatedDealsOptions {
  initialFilters?: DealFilters;
  pageSize?: number;
  enableAutoRefresh?: boolean;
  autoRefreshInterval?: number;
}

export interface UsePaginatedDealsReturn {
  deals: FundingDeal[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  filters: DealFilters;
  isRefetching: boolean;
  lastUpdated: Date | null;
  // Actions
  setFilters: (filters: DealFilters) => void;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>; // For infinite scroll
}

export function usePaginatedDeals(options: UsePaginatedDealsOptions = {}): UsePaginatedDealsReturn {
  const {
    initialFilters = {},
    pageSize = 20,
    enableAutoRefresh = false,
    autoRefreshInterval = 5 * 60 * 1000
  } = options;

  // State management
  const [deals, setDeals] = useState<FundingDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Pagination state
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Filter state
  const [filters, setFiltersState] = useState<DealFilters>({
    ...initialFilters,
    limit: pageSize,
    offset: 0
  });

  // Refs for cleanup and auto-refresh
  const mountedRef = useRef(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data function with optimized pagination
  const fetchData = useCallback(async (newFilters?: DealFilters, isRefetch = false) => {
    console.log('usePaginatedDeals: fetchData called', { newFilters, isRefetch });
    
    const currentFilters = newFilters || filters;
    
    if (mountedRef.current) {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setLoading(true);
      }
      setError(null);
    }

    try {
      const response = await FundingService.getDealsWithFilters(currentFilters);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (mountedRef.current && response.data) {
        const { data: newDeals, total: newTotal, page: newPage, hasMore: newHasMore } = response.data;
        
        setDeals(newDeals);
        setTotal(newTotal);
        setPage(newPage);
        setHasMore(newHasMore);
        setLastUpdated(new Date());
        
        console.log('usePaginatedDeals: Data updated', {
          dealsCount: newDeals.length,
          total: newTotal,
          page: newPage,
          hasMore: newHasMore
        });
      }
    } catch (err) {
      console.error('usePaginatedDeals: Error fetching data:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch deals');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setIsRefetching(false);
      }
    }
  }, [filters]);

  // Load more data for infinite scroll
  const loadMore = useCallback(async () => {
    if (!hasMore || loading || isRefetching) return;

    console.log('usePaginatedDeals: loadMore called');
    
    const nextOffset = (filters.offset || 0) + (filters.limit || pageSize);
    const newFilters = {
      ...filters,
      offset: nextOffset
    };

    setIsRefetching(true);
    
    try {
      const response = await FundingService.getDealsWithFilters(newFilters);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (mountedRef.current && response.data) {
        const { data: newDeals, hasMore: newHasMore } = response.data;
        
        // Append new deals to existing ones
        setDeals(prevDeals => [...prevDeals, ...newDeals]);
        setHasMore(newHasMore);
        setFiltersState(newFilters);
        setLastUpdated(new Date());
        
        console.log('usePaginatedDeals: More data loaded', {
          newDealsCount: newDeals.length,
          totalDealsCount: deals.length + newDeals.length,
          hasMore: newHasMore
        });
      }
    } catch (err) {
      console.error('usePaginatedDeals: Error loading more data:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load more deals');
      }
    } finally {
      if (mountedRef.current) {
        setIsRefetching(false);
      }
    }
  }, [deals.length, filters, hasMore, loading, isRefetching, pageSize]);

  // Navigation functions
  const nextPage = useCallback(async () => {
    if (!hasMore) return;
    
    const nextOffset = (filters.offset || 0) + (filters.limit || pageSize);
    const newFilters = {
      ...filters,
      offset: nextOffset
    };
    
    setFiltersState(newFilters);
    await fetchData(newFilters);
  }, [filters, hasMore, pageSize, fetchData]);

  const prevPage = useCallback(async () => {
    const currentOffset = filters.offset || 0;
    if (currentOffset <= 0) return;
    
    const prevOffset = Math.max(0, currentOffset - (filters.limit || pageSize));
    const newFilters = {
      ...filters,
      offset: prevOffset
    };
    
    setFiltersState(newFilters);
    await fetchData(newFilters);
  }, [filters, pageSize, fetchData]);

  const goToPage = useCallback(async (targetPage: number) => {
    if (targetPage < 1) return;
    
    const newOffset = (targetPage - 1) * (filters.limit || pageSize);
    const newFilters = {
      ...filters,
      offset: newOffset
    };
    
    setFiltersState(newFilters);
    await fetchData(newFilters);
  }, [filters, pageSize, fetchData]);

  // Filter update function
  const setFilters = useCallback((newFilters: DealFilters) => {
    console.log('usePaginatedDeals: setFilters called', newFilters);
    
    // Reset pagination when filters change
    const filtersWithPagination = {
      ...newFilters,
      limit: newFilters.limit || pageSize,
      offset: 0
    };
    
    setFiltersState(filtersWithPagination);
    fetchData(filtersWithPagination);
  }, [pageSize, fetchData]);

  // Refetch function
  const refetch = useCallback(async () => {
    console.log('usePaginatedDeals: refetch called');
    await fetchData(filters, true);
  }, [filters, fetchData]);

  // Initial data fetch
  useEffect(() => {
    console.log('usePaginatedDeals: Initial fetch effect');
    fetchData();
  }, []); // Empty dependency array for initial load only

  // Auto-refresh setup
  useEffect(() => {
    if (enableAutoRefresh) {
      console.log('usePaginatedDeals: Setting up auto-refresh');
      
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          console.log('usePaginatedDeals: Auto-refresh triggered');
          fetchData(filters, true);
        }
      }, autoRefreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [enableAutoRefresh, autoRefreshInterval, filters, fetchData]);

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
    total,
    page,
    pageSize: filters.limit || pageSize,
    hasMore,
    filters,
    isRefetching,
    lastUpdated,
    setFilters,
    nextPage,
    prevPage,
    goToPage,
    refetch,
    loadMore
  };
}

export default usePaginatedDeals;