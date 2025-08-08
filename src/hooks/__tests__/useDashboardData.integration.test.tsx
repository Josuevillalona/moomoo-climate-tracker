import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDashboardData } from '../useDashboardData';
import { FundingService } from '@/lib/api/funding';
import { DashboardMetrics, FundingDeal, ApiResponse } from '@/types/api';

// Mock the FundingService
jest.mock('@/lib/api/funding');

const mockFundingService = FundingService as jest.Mocked<typeof FundingService>;

// Sample test data
const mockMetrics: DashboardMetrics = {
  totalDeals: 250,
  totalFunding: 5000000000,
  totalCompanies: 200,
  totalInvestors: 150,
  growthRate: 25.5,
  averageDealSize: 20000000,
  topSectors: [
    { sector: 'Solar Energy', dealCount: 50, totalFunding: 1000000000, percentage: 20.0 },
    { sector: 'Wind Energy', dealCount: 40, totalFunding: 800000000, percentage: 16.0 },
    { sector: 'Energy Storage', dealCount: 35, totalFunding: 700000000, percentage: 14.0 },
  ],
  topCountries: [
    { country: 'United States', dealCount: 100, totalFunding: 2000000000, percentage: 40.0 },
    { country: 'China', dealCount: 60, totalFunding: 1200000000, percentage: 24.0 },
    { country: 'Germany', dealCount: 40, totalFunding: 800000000, percentage: 16.0 },
  ],
};

const mockRecentDeals: FundingDeal[] = [
  {
    id: 1,
    companyName: 'SolarTech Inc',
    fundingStage: 'Series A',
    amountRaised: 25000000,
    dateAnnounced: '2024-01-15',
    leadInvestors: ['Green Ventures'],
    otherInvestors: ['Climate Capital'],
    climateSector: 'Solar Energy',
    country: 'United States',
    status: 'verified',
    createdAt: '2024-01-15T10:00:00Z',
    formattedAmount: '$25M',
    formattedDate: 'Jan 15, 2024',
    daysAgo: 5,
    allInvestors: ['Green Ventures', 'Climate Capital'],
  },
  {
    id: 2,
    companyName: 'WindPower Co',
    fundingStage: 'Seed',
    amountRaised: 8000000,
    dateAnnounced: '2024-01-12',
    leadInvestors: ['Tech Ventures'],
    otherInvestors: ['Energy Fund'],
    climateSector: 'Wind Energy',
    country: 'Germany',
    status: 'verified',
    createdAt: '2024-01-12T14:30:00Z',
    formattedAmount: '$8M',
    formattedDate: 'Jan 12, 2024',
    daysAgo: 8,
    allInvestors: ['Tech Ventures', 'Energy Fund'],
  },
  {
    id: 3,
    companyName: 'BatteryTech Ltd',
    fundingStage: 'Series B',
    amountRaised: 50000000,
    dateAnnounced: '2024-01-10',
    leadInvestors: ['Battery Ventures', 'Energy Capital'],
    otherInvestors: ['Green Fund'],
    climateSector: 'Energy Storage',
    country: 'United Kingdom',
    status: 'verified',
    createdAt: '2024-01-10T09:15:00Z',
    formattedAmount: '$50M',
    formattedDate: 'Jan 10, 2024',
    daysAgo: 10,
    allInvestors: ['Battery Ventures', 'Energy Capital', 'Green Fund'],
  },
];

describe('useDashboardData Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default successful responses
    mockFundingService.getDashboardMetrics.mockResolvedValue({
      data: mockMetrics,
      error: null,
      loading: false,
    });

    mockFundingService.getRecentDeals.mockResolvedValue({
      data: mockRecentDeals,
      error: null,
      loading: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should initialize with loading state', async () => {
      const { result } = renderHook(() => useDashboardData());

      // Should start in loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.metrics).toBe(null);
      expect(result.current.recentDeals).toEqual([]);
      expect(result.current.error).toBe(null);
      expect(result.current.isRefetching).toBe(false);
      expect(result.current.lastUpdated).toBe(null);
      expect(result.current.retryCount).toBe(0);
    });

    it('should fetch data on mount and update state correctly', async () => {
      const { result } = renderHook(() => useDashboardData());

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics).toEqual(mockMetrics);
      expect(result.current.recentDeals).toEqual(mockRecentDeals);
      expect(result.current.error).toBe(null);
      expect(result.current.lastUpdated).toBeInstanceOf(Date);

      // Verify API calls were made
      expect(mockFundingService.getDashboardMetrics).toHaveBeenCalledTimes(1);
      expect(mockFundingService.getRecentDeals).toHaveBeenCalledWith(5);
    });

    it('should use custom options correctly', async () => {
      const mockOnDataUpdate = jest.fn();
      
      const { result } = renderHook(() => 
        useDashboardData({
          recentDealsLimit: 10,
          enableAutoRefresh: false,
          onDataUpdate: mockOnDataUpdate,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFundingService.getRecentDeals).toHaveBeenCalledWith(10);
      expect(mockOnDataUpdate).toHaveBeenCalledWith(mockMetrics, mockRecentDeals);
    });

    it('should handle concurrent API calls correctly', async () => {
      // Make API calls take different amounts of time
      mockFundingService.getDashboardMetrics.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: mockMetrics,
          error: null,
          loading: false,
        }), 100))
      );

      mockFundingService.getRecentDeals.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          data: mockRecentDeals,
          error: null,
          loading: false,
        }), 50))
      );

      const { result } = renderHook(() => useDashboardData());

      // Fast-forward timers
      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Both API calls should have completed
      expect(result.current.metrics).toEqual(mockMetrics);
      expect(result.current.recentDeals).toEqual(mockRecentDeals);
    });
  });

  describe('Error Handling', () => {
    it('should handle metrics API error', async () => {
      mockFundingService.getDashboardMetrics.mockResolvedValue({
        data: null,
        error: 'Failed to fetch metrics',
        loading: false,
      });

      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch dashboard metrics: Failed to fetch metrics');
      expect(result.current.metrics).toBe(null);
      expect(result.current.recentDeals).toEqual([]);
    });

    it('should handle recent deals API error', async () => {
      mockFundingService.getRecentDeals.mockResolvedValue({
        data: null,
        error: 'Failed to fetch deals',
        loading: false,
      });

      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch dashboard metrics: Failed to fetch deals');
      expect(result.current.metrics).toBe(null);
      expect(result.current.recentDeals).toEqual([]);
    });

    it('should handle network errors', async () => {
      mockFundingService.getDashboardMetrics.mockRejectedValue(
        new Error('Network error: Connection timeout')
      );

      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error: Connection timeout');
      expect(result.current.metrics).toBe(null);
    });

    it('should handle partial failures gracefully', async () => {
      // Metrics succeeds, deals fails
      mockFundingService.getRecentDeals.mockResolvedValue({
        data: null,
        error: 'Deals service unavailable',
        loading: false,
      });

      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch dashboard metrics: Deals service unavailable');
    });

    it('should handle unknown errors', async () => {
      mockFundingService.getDashboardMetrics.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch data');
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const { result } = renderHook(() => useDashboardData());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock calls
      mockFundingService.getDashboardMetrics.mockClear();
      mockFundingService.getRecentDeals.mockClear();

      // Call refetch
      act(() => {
        result.current.refetch();
      });

      expect(result.current.isRefetching).toBe(true);

      await waitFor(() => {
        expect(result.current.isRefetching).toBe(false);
      });

      // Should have called APIs again
      expect(mockFundingService.getDashboardMetrics).toHaveBeenCalledTimes(1);
      expect(mockFundingService.getRecentDeals).toHaveBeenCalledTimes(1);
    });

    it('should maintain existing data during refetch', async () => {
      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalMetrics = result.current.metrics;
      const originalDeals = result.current.recentDeals;

      // Start refetch
      act(() => {
        result.current.refetch();
      });

      // Data should still be available during refetch
      expect(result.current.metrics).toEqual(originalMetrics);
      expect(result.current.recentDeals).toEqual(originalDeals);
      expect(result.current.isRefetching).toBe(true);
    });

    it('should handle refetch errors without losing existing data', async () => {
      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalMetrics = result.current.metrics;
      const originalDeals = result.current.recentDeals;

      // Make refetch fail
      mockFundingService.getDashboardMetrics.mockRejectedValue(
        new Error('Refetch failed')
      );

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.isRefetching).toBe(false);
      });

      // Should keep original data and show error
      expect(result.current.metrics).toEqual(originalMetrics);
      expect(result.current.recentDeals).toEqual(originalDeals);
      expect(result.current.error).toBe('Refetch failed');
    });
  });

  describe('Auto-refresh Functionality', () => {
    it('should auto-refresh when enabled', async () => {
      const { result } = renderHook(() => 
        useDashboardData({
          enableAutoRefresh: true,
          autoRefreshInterval: 1000,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear initial calls
      mockFundingService.getDashboardMetrics.mockClear();
      mockFundingService.getRecentDeals.mockClear();

      // Fast-forward time to trigger auto-refresh
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockFundingService.getDashboardMetrics).toHaveBeenCalledTimes(1);
      });

      expect(mockFundingService.getRecentDeals).toHaveBeenCalledTimes(1);
    });

    it('should not auto-refresh when disabled', async () => {
      const { result } = renderHook(() => 
        useDashboardData({
          enableAutoRefresh: false,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear initial calls
      mockFundingService.getDashboardMetrics.mockClear();
      mockFundingService.getRecentDeals.mockClear();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Should not have made additional calls
      expect(mockFundingService.getDashboardMetrics).not.toHaveBeenCalled();
      expect(mockFundingService.getRecentDeals).not.toHaveBeenCalled();
    });

    it('should clear auto-refresh interval on unmount', async () => {
      const { result, unmount } = renderHook(() => 
        useDashboardData({
          enableAutoRefresh: true,
          autoRefreshInterval: 1000,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      unmount();

      // Clear initial calls
      mockFundingService.getDashboardMetrics.mockClear();
      mockFundingService.getRecentDeals.mockClear();

      // Fast-forward time after unmount
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // Should not make calls after unmount
      expect(mockFundingService.getDashboardMetrics).not.toHaveBeenCalled();
      expect(mockFundingService.getRecentDeals).not.toHaveBeenCalled();
    });

    it('should handle auto-refresh errors gracefully', async () => {
      const { result } = renderHook(() => 
        useDashboardData({
          enableAutoRefresh: true,
          autoRefreshInterval: 1000,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalMetrics = result.current.metrics;

      // Make auto-refresh fail
      mockFundingService.getDashboardMetrics.mockRejectedValue(
        new Error('Auto-refresh failed')
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Auto-refresh failed');
      });

      // Should keep original data
      expect(result.current.metrics).toEqual(originalMetrics);
    });
  });

  describe('Data Update Callbacks', () => {
    it('should call onDataUpdate callback when data changes', async () => {
      const mockOnDataUpdate = jest.fn();

      const { result } = renderHook(() => 
        useDashboardData({
          onDataUpdate: mockOnDataUpdate,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockOnDataUpdate).toHaveBeenCalledWith(mockMetrics, mockRecentDeals);
    });

    it('should call onDataUpdate on refetch', async () => {
      const mockOnDataUpdate = jest.fn();

      const { result } = renderHook(() => 
        useDashboardData({
          onDataUpdate: mockOnDataUpdate,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockOnDataUpdate.mockClear();

      // Update mock data for refetch
      const updatedMetrics = { ...mockMetrics, totalDeals: 300 };
      mockFundingService.getDashboardMetrics.mockResolvedValue({
        data: updatedMetrics,
        error: null,
        loading: false,
      });

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.isRefetching).toBe(false);
      });

      expect(mockOnDataUpdate).toHaveBeenCalledWith(updatedMetrics, mockRecentDeals);
    });

    it('should not call onDataUpdate on errors', async () => {
      const mockOnDataUpdate = jest.fn();

      mockFundingService.getDashboardMetrics.mockRejectedValue(
        new Error('API Error')
      );

      const { result } = renderHook(() => 
        useDashboardData({
          onDataUpdate: mockOnDataUpdate,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockOnDataUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle component unmounting during API calls', async () => {
      let resolveMetrics: (value: any) => void;
      let resolveDeals: (value: any) => void;

      mockFundingService.getDashboardMetrics.mockImplementation(() => 
        new Promise(resolve => { resolveMetrics = resolve; })
      );

      mockFundingService.getRecentDeals.mockImplementation(() => 
        new Promise(resolve => { resolveDeals = resolve; })
      );

      const { result, unmount } = renderHook(() => useDashboardData());

      expect(result.current.loading).toBe(true);

      // Unmount before API calls complete
      unmount();

      // Complete API calls after unmount
      act(() => {
        resolveMetrics!({
          data: mockMetrics,
          error: null,
          loading: false,
        });
        resolveDeals!({
          data: mockRecentDeals,
          error: null,
          loading: false,
        });
      });

      // Should not cause any errors or warnings
    });

    it('should handle rapid mount/unmount cycles', async () => {
      for (let i = 0; i < 5; i++) {
        const { unmount } = renderHook(() => useDashboardData());
        unmount();
      }

      // Should not cause memory leaks or errors
    });

    it('should handle options changes correctly', async () => {
      const { result, rerender } = renderHook(
        ({ limit }) => useDashboardData({ recentDealsLimit: limit }),
        { initialProps: { limit: 5 } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFundingService.getRecentDeals).toHaveBeenCalledWith(5);

      // Change options
      mockFundingService.getRecentDeals.mockClear();
      
      rerender({ limit: 10 });

      // Should not automatically refetch on options change
      expect(mockFundingService.getRecentDeals).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data responses', async () => {
      const emptyMetrics: DashboardMetrics = {
        totalDeals: 0,
        totalFunding: 0,
        totalCompanies: 0,
        totalInvestors: 0,
        growthRate: 0,
        averageDealSize: 0,
        topSectors: [],
        topCountries: [],
      };

      mockFundingService.getDashboardMetrics.mockResolvedValue({
        data: emptyMetrics,
        error: null,
        loading: false,
      });

      mockFundingService.getRecentDeals.mockResolvedValue({
        data: [],
        error: null,
        loading: false,
      });

      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics).toEqual(emptyMetrics);
      expect(result.current.recentDeals).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should handle null data responses', async () => {
      mockFundingService.getDashboardMetrics.mockResolvedValue({
        data: null,
        error: null,
        loading: false,
      });

      mockFundingService.getRecentDeals.mockResolvedValue({
        data: null,
        error: null,
        loading: false,
      });

      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics).toBe(null);
      expect(result.current.recentDeals).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should handle malformed API responses', async () => {
      mockFundingService.getDashboardMetrics.mockResolvedValue({
        data: { invalid: 'data' } as any,
        error: null,
        loading: false,
      });

      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle malformed data gracefully
      expect(result.current.metrics).toEqual({ invalid: 'data' });
      expect(result.current.error).toBe(null);
    });

    it('should handle very large datasets', async () => {
      const largeDealsArray = Array.from({ length: 1000 }, (_, i) => ({
        ...mockRecentDeals[0],
        id: i + 1,
        companyName: `Company ${i + 1}`,
      }));

      mockFundingService.getRecentDeals.mockResolvedValue({
        data: largeDealsArray,
        error: null,
        loading: false,
      });

      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.recentDeals).toHaveLength(1000);
      expect(result.current.error).toBe(null);
    });

    it('should handle concurrent refetch calls', async () => {
      const { result } = renderHook(() => useDashboardData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      mockFundingService.getDashboardMetrics.mockClear();
      mockFundingService.getRecentDeals.mockClear();

      // Call refetch multiple times rapidly
      act(() => {
        result.current.refetch();
        result.current.refetch();
        result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.isRefetching).toBe(false);
      });

      // Should handle concurrent calls gracefully
      expect(mockFundingService.getDashboardMetrics).toHaveBeenCalled();
      expect(mockFundingService.getRecentDeals).toHaveBeenCalled();
    });
  });
});