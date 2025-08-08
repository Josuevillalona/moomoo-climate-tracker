import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardDataCached, dashboardCacheUtils } from '../useDashboardDataCached';
import { DashboardMetrics, FundingDeal } from '../../types/api';

// Mock the entire API module to avoid Supabase import issues
jest.mock('../../lib/api/funding', () => ({
  FundingService: {
    getDashboardMetrics: jest.fn(),
    getRecentDeals: jest.fn(),
  },
}));

// Mock the query hooks to avoid Supabase dependencies
jest.mock('../queries/useDashboardMetrics', () => ({
  useDashboardMetrics: jest.fn(),
}));

jest.mock('../queries/useRecentDeals', () => ({
  useRecentDeals: jest.fn(),
}));

const mockUseDashboardMetrics = require('../queries/useDashboardMetrics').useDashboardMetrics;
const mockUseRecentDeals = require('../queries/useRecentDeals').useRecentDeals;

// Mock data
const mockMetrics: DashboardMetrics = {
  totalDeals: 100,
  totalFunding: 1000000000,
  totalCompanies: 50,
  totalInvestors: 200,
  growthRate: 15.5,
  averageDealSize: 10000000,
  topSectors: [],
  topCountries: [],
};

const mockDeals: FundingDeal[] = [
  {
    id: 1,
    companyName: 'Test Company',
    fundingStage: 'Series A',
    amountRaised: 10000000,
    dateAnnounced: '2024-01-01',
    leadInvestors: ['Test VC'],
    otherInvestors: [],
    climateSector: 'Clean Energy',
    country: 'USA',
    status: 'PROCESSED_AI',
    createdAt: '2024-01-01T00:00:00Z',
    formattedAmount: '$10M',
    formattedDate: 'Jan 1, 2024',
    daysAgo: 30,
    allInvestors: ['Test VC'],
  },
];

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useDashboardDataCached', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses for query hooks
    mockUseDashboardMetrics.mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      dataUpdatedAt: Date.now(),
      failureCount: 0,
    });

    mockUseRecentDeals.mockReturnValue({
      data: mockDeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      dataUpdatedAt: Date.now(),
      failureCount: 0,
    });
  });

  it('should fetch and cache dashboard data', async () => {
    // Set up loading state initially
    mockUseDashboardMetrics.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      dataUpdatedAt: undefined,
      failureCount: 0,
    });

    mockUseRecentDeals.mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      dataUpdatedAt: undefined,
      failureCount: 0,
    });

    const wrapper = createWrapper();
    
    const { result, rerender } = renderHook(() => useDashboardDataCached(), {
      wrapper,
    });

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.metrics).toBe(null);
    expect(result.current.recentDeals).toEqual([]);

    // Update mocks to return data
    mockUseDashboardMetrics.mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      dataUpdatedAt: Date.now(),
      failureCount: 0,
    });

    mockUseRecentDeals.mockReturnValue({
      data: mockDeals,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      dataUpdatedAt: Date.now(),
      failureCount: 0,
    });

    // Trigger re-render
    rerender();

    // Data should be loaded
    expect(result.current.loading).toBe(false);
    expect(result.current.metrics).toEqual(mockMetrics);
    expect(result.current.recentDeals).toEqual(mockDeals);
    expect(result.current.error).toBe(null);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'API Error';
    mockUseDashboardMetrics.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: errorMessage },
      refetch: jest.fn(),
      isRefetching: false,
      dataUpdatedAt: Date.now(),
      failureCount: 1,
    });

    const wrapper = createWrapper();
    
    const { result } = renderHook(() => useDashboardDataCached(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.metrics).toBe(null);
  });

  it('should support manual refetch', async () => {
    const mockRefetchMetrics = jest.fn();
    const mockRefetchDeals = jest.fn();
    
    mockUseDashboardMetrics.mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      error: null,
      refetch: mockRefetchMetrics,
      isRefetching: false,
      dataUpdatedAt: Date.now(),
      failureCount: 0,
    });

    mockUseRecentDeals.mockReturnValue({
      data: mockDeals,
      isLoading: false,
      error: null,
      refetch: mockRefetchDeals,
      isRefetching: false,
      dataUpdatedAt: Date.now(),
      failureCount: 0,
    });

    const wrapper = createWrapper();
    
    const { result } = renderHook(() => useDashboardDataCached(), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Trigger refetch
    await result.current.refetch();

    expect(mockRefetchMetrics).toHaveBeenCalled();
    expect(mockRefetchDeals).toHaveBeenCalled();
  });

  it('should call onDataUpdate callback when data changes', async () => {
    const onDataUpdate = jest.fn();
    const wrapper = createWrapper();
    
    renderHook(() => useDashboardDataCached({ onDataUpdate }), {
      wrapper,
    });

    await waitFor(() => {
      expect(onDataUpdate).toHaveBeenCalledWith(mockMetrics, mockDeals);
    });
  });

  it('should respect recentDealsLimit option', async () => {
    const limit = 3;
    const wrapper = createWrapper();
    
    renderHook(() => useDashboardDataCached({ recentDealsLimit: limit }), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockUseRecentDeals).toHaveBeenCalledWith(limit);
    });
  });

  describe('dashboardCacheUtils', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 0,
          },
        },
      });
    });

    it('should invalidate all dashboard queries', async () => {
      const spy = jest.spyOn(queryClient, 'invalidateQueries');
      
      await dashboardCacheUtils.invalidateAll(queryClient);
      
      expect(spy).toHaveBeenCalledWith({
        queryKey: ['dashboard'],
      });
    });

    it('should invalidate only metrics', async () => {
      const spy = jest.spyOn(queryClient, 'invalidateQueries');
      
      await dashboardCacheUtils.invalidateMetrics(queryClient);
      
      expect(spy).toHaveBeenCalledWith({
        queryKey: ['dashboard', 'metrics'],
      });
    });

    it('should set optimistic data', () => {
      const spy = jest.spyOn(queryClient, 'setQueryData');
      
      dashboardCacheUtils.setOptimisticMetrics(queryClient, mockMetrics);
      
      expect(spy).toHaveBeenCalledWith(['dashboard', 'metrics'], mockMetrics);
    });

    it('should prefetch dashboard data', async () => {
      const spy = jest.spyOn(queryClient, 'prefetchQuery');
      
      await dashboardCacheUtils.prefetchDashboard(queryClient);
      
      expect(spy).toHaveBeenCalledTimes(2); // metrics and recent deals
    });

    it('should clear cache', () => {
      const spy = jest.spyOn(queryClient, 'removeQueries');
      
      dashboardCacheUtils.clearCache(queryClient);
      
      expect(spy).toHaveBeenCalledWith({
        queryKey: ['dashboard'],
      });
    });
  });
});