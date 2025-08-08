import { renderHook, waitFor, act } from '@testing-library/react';
import { useDashboardData } from '../useDashboardData';

// Mock the FundingService module
jest.mock('../../lib/api/funding', () => ({
  FundingService: {
    getDashboardMetrics: jest.fn(),
    getRecentDeals: jest.fn(),
  },
}));

// Import the mocked module
import { FundingService } from '../../lib/api/funding';
const mockFundingService = FundingService as jest.Mocked<typeof FundingService>;

// Mock data
const mockMetrics = {
  totalDeals: 100,
  totalFunding: 1000000000,
  totalCompanies: 50,
  totalInvestors: 25,
  growthRate: 15.5,
  averageDealSize: 10000000,
  topSectors: [],
  topCountries: []
};

const mockDeals = [
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
    status: 'PUBLISHED',
    createdAt: '2024-01-01T00:00:00Z',
    formattedAmount: '$10M',
    formattedDate: 'Jan 1, 2024',
    daysAgo: 30,
    allInvestors: ['Test VC']
  }
];

describe('useDashboardData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM visibility state
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible'
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should fetch dashboard data on mount', async () => {
    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: mockMetrics,
      error: null,
      loading: false
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: mockDeals,
      error: null,
      loading: false
    });

    const { result } = renderHook(() => useDashboardData());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.metrics).toBe(null);
    expect(result.current.recentDeals).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toEqual(mockMetrics);
    expect(result.current.recentDeals).toEqual(mockDeals);
    expect(result.current.error).toBe(null);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Failed to fetch data';
    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: null,
      error: errorMessage,
      loading: false
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: null,
      error: errorMessage,
      loading: false
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toContain('Failed to fetch dashboard metrics');
    expect(result.current.metrics).toBe(null);
    expect(result.current.recentDeals).toEqual([]);
  });

  it('should refetch data when refetch is called', async () => {
    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: mockMetrics,
      error: null,
      loading: false
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: mockDeals,
      error: null,
      loading: false
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mocks to track refetch calls
    jest.clearAllMocks();

    // Call refetch wrapped in act
    await act(async () => {
      await result.current.refetch();
    });

    expect(mockFundingService.getDashboardMetrics).toHaveBeenCalledTimes(1);
    expect(mockFundingService.getRecentDeals).toHaveBeenCalledTimes(1);
  });

  it('should handle refetch loading state correctly', async () => {
    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: mockMetrics,
      error: null,
      loading: false
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: mockDeals,
      error: null,
      loading: false
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock a slow refetch
    mockFundingService.getDashboardMetrics.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        data: mockMetrics,
        error: null,
        loading: false
      }), 100))
    );

    mockFundingService.getRecentDeals.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        data: mockDeals,
        error: null,
        loading: false
      }), 100))
    );

    // Start refetch wrapped in act
    let refetchPromise: Promise<void>;
    await act(async () => {
      refetchPromise = result.current.refetch();
    });

    // Should show refetching state
    await waitFor(() => {
      expect(result.current.isRefetching).toBe(true);
    });

    // Wait for refetch to complete
    await act(async () => {
      await refetchPromise!;
    });

    await waitFor(() => {
      expect(result.current.isRefetching).toBe(false);
    });
  });

  it('should use custom options correctly', async () => {
    const customLimit = 10;
    
    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: mockMetrics,
      error: null,
      loading: false
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: mockDeals,
      error: null,
      loading: false
    });

    renderHook(() => useDashboardData({ recentDealsLimit: customLimit }));

    await waitFor(() => {
      expect(mockFundingService.getRecentDeals).toHaveBeenCalledWith(customLimit);
    });
  });

  it('should setup auto-refresh when enabled', async () => {
    jest.useFakeTimers();

    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: mockMetrics,
      error: null,
      loading: false
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: mockDeals,
      error: null,
      loading: false
    });

    const { result } = renderHook(() => 
      useDashboardData({ 
        enableAutoRefresh: true, 
        autoRefreshInterval: 1000 
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear initial calls
    jest.clearAllMocks();

    // Fast-forward time wrapped in act
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockFundingService.getDashboardMetrics).toHaveBeenCalledTimes(1);
      expect(mockFundingService.getRecentDeals).toHaveBeenCalledTimes(1);
    });
  });

  it('should cleanup intervals on unmount', () => {
    jest.useFakeTimers();
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: mockMetrics,
      error: null,
      loading: false
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: mockDeals,
      error: null,
      loading: false
    });

    const { unmount } = renderHook(() => 
      useDashboardData({ enableAutoRefresh: true })
    );

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should handle partial API failures', async () => {
    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: mockMetrics,
      error: null,
      loading: false
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: null,
      error: 'Failed to fetch deals',
      loading: false
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toContain('Failed to fetch dashboard metrics');
    expect(result.current.metrics).toBe(null);
    expect(result.current.recentDeals).toEqual([]);
  });

  it('should call onDataUpdate callback when data is fetched', async () => {
    const onDataUpdate = jest.fn();

    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: mockMetrics,
      error: null,
      loading: false
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: mockDeals,
      error: null,
      loading: false
    });

    renderHook(() => useDashboardData({ onDataUpdate }));

    await waitFor(() => {
      expect(onDataUpdate).toHaveBeenCalledWith(mockMetrics, mockDeals);
    });
  });

  it('should handle concurrent refetch calls', async () => {
    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: mockMetrics,
      error: null,
      loading: false
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: mockDeals,
      error: null,
      loading: false
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear mocks to track refetch calls
    jest.clearAllMocks();

    // Make multiple concurrent refetch calls
    await act(async () => {
      const promises = [
        result.current.refetch(),
        result.current.refetch(),
        result.current.refetch(),
      ];
      await Promise.all(promises);
    });

    // Should handle concurrent calls gracefully
    expect(mockFundingService.getDashboardMetrics).toHaveBeenCalled();
    expect(mockFundingService.getRecentDeals).toHaveBeenCalled();
  });

  it('should handle empty data responses', async () => {
    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: {
        totalDeals: 0,
        totalFunding: 0,
        totalCompanies: 0,
        totalInvestors: 0,
        growthRate: 0,
        averageDealSize: 0,
        topSectors: [],
        topCountries: []
      },
      error: null,
      loading: false
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: [],
      error: null,
      loading: false
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics?.totalDeals).toBe(0);
    expect(result.current.recentDeals).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should handle API timeout scenarios', async () => {
    mockFundingService.getDashboardMetrics.mockImplementation(
      () => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    );

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: mockDeals,
      error: null,
      loading: false
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toContain('Request timeout');
  });

  it('should maintain state consistency during rapid option changes', async () => {
    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: mockMetrics,
      error: null,
      loading: false
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: mockDeals,
      error: null,
      loading: false
    });

    const { result, rerender } = renderHook(
      ({ limit }) => useDashboardData({ recentDealsLimit: limit }),
      { initialProps: { limit: 5 } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Change options rapidly
    rerender({ limit: 10 });
    rerender({ limit: 15 });
    rerender({ limit: 20 });

    // Should maintain consistent state
    expect(result.current.metrics).toBeDefined();
    expect(result.current.recentDeals).toBeDefined();
  });
});