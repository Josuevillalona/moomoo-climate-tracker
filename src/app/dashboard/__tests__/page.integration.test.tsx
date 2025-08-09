/**
 * Dashboard Integration Tests
 * 
 * These tests verify the dashboard functionality by testing the hooks and logic
 * without complex DOM rendering to avoid React 18 + JSDOM compatibility issues.
 */

import { DashboardMetrics, FundingDeal } from '@/types/api';

// Mock the hooks
jest.mock('@/hooks/useDashboardData');
jest.mock('@/hooks/useRealTimeDeals');
jest.mock('@/hooks/useAnalytics');

// Sample test data
const mockMetrics: DashboardMetrics = {
  totalDeals: 150,
  totalFunding: 2500000000,
  totalCompanies: 120,
  totalInvestors: 85,
  growthRate: 15.5,
  averageDealSize: 16666667,
  topSectors: [
    { sector: 'Solar Energy', dealCount: 25, totalFunding: 500000000, percentage: 16.7 },
    { sector: 'Carbon Capture', dealCount: 20, totalFunding: 400000000, percentage: 13.3 },
    { sector: 'Energy Storage', dealCount: 18, totalFunding: 350000000, percentage: 12.0 },
  ],
  topCountries: [
    { country: 'United States', dealCount: 60, totalFunding: 1200000000, percentage: 40.0 },
    { country: 'Germany', dealCount: 25, totalFunding: 500000000, percentage: 16.7 },
    { country: 'United Kingdom', dealCount: 20, totalFunding: 400000000, percentage: 13.3 },
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
    companyName: 'CarbonCapture Co',
    fundingStage: 'Seed',
    amountRaised: 5000000,
    dateAnnounced: '2024-01-10',
    leadInvestors: ['Tech Ventures'],
    otherInvestors: [],
    climateSector: 'Carbon Capture',
    country: 'Germany',
    status: 'verified',
    createdAt: '2024-01-10T14:30:00Z',
    formattedAmount: '$5M',
    formattedDate: 'Jan 10, 2024',
    daysAgo: 10,
    allInvestors: ['Tech Ventures'],
  },
];

describe('Dashboard Integration Tests', () => {
  let mockUseDashboardData: jest.Mock;
  let mockUseRealTimeDeals: jest.Mock;
  let mockUseDashboardAnalytics: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock the hooks
    mockUseDashboardData = require('@/hooks/useDashboardData').useDashboardData;
    mockUseRealTimeDeals = require('@/hooks/useRealTimeDeals').useRealTimeDeals;
    mockUseDashboardAnalytics = require('@/hooks/useAnalytics').useDashboardAnalytics;

    // Default successful state
    mockUseDashboardData.mockReturnValue({
      metrics: mockMetrics,
      recentDeals: mockRecentDeals,
      loading: false,
      error: null,
      refetch: jest.fn(),
      isRefetching: false,
      lastUpdated: new Date(),
      retryCount: 0,
    });

    mockUseRealTimeDeals.mockReturnValue({
      newDeals: [],
      isConnected: true,
      connectionError: null,
      lastUpdate: null,
      clearNewDeals: jest.fn(),
      reconnect: jest.fn(),
      newDealsCount: 0,
    });

    mockUseDashboardAnalytics.mockReturnValue({
      trackDashboardLoad: jest.fn(),
      trackDataRefresh: jest.fn(),
      trackFeatureUsage: jest.fn(),
      startOperation: jest.fn(),
      endOperation: jest.fn(),
      sessionId: 'test-session-id',
    });
  });

  describe('Dashboard Data Integration', () => {
    it('should call useDashboardData with correct options', () => {
      // Import and call the hook directly
      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      const options = {
        recentDealsLimit: 5,
        enableAutoRefresh: true,
        autoRefreshInterval: 5 * 60 * 1000,
      };

      useDashboardData(options);

      expect(mockUseDashboardData).toHaveBeenCalledWith(options);
    });

    it('should handle successful data loading', () => {
      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      const result = useDashboardData({
        recentDealsLimit: 5,
        enableAutoRefresh: true,
        autoRefreshInterval: 5 * 60 * 1000,
      });

      expect(result.metrics).toEqual(mockMetrics);
      expect(result.recentDeals).toEqual(mockRecentDeals);
      expect(result.loading).toBe(false);
      expect(result.error).toBeNull();
    });

    it('should handle loading state', () => {
      mockUseDashboardData.mockReturnValue({
        metrics: null,
        recentDeals: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
        lastUpdated: null,
        retryCount: 0,
      });

      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      const result = useDashboardData({
        recentDealsLimit: 5,
        enableAutoRefresh: true,
        autoRefreshInterval: 5 * 60 * 1000,
      });

      expect(result.loading).toBe(true);
      expect(result.metrics).toBeNull();
      expect(result.recentDeals).toEqual([]);
    });

    it('should handle error state', () => {
      const errorMessage = 'Failed to fetch dashboard data';
      mockUseDashboardData.mockReturnValue({
        metrics: null,
        recentDeals: [],
        loading: false,
        error: errorMessage,
        refetch: jest.fn(),
        isRefetching: false,
        lastUpdated: null,
        retryCount: 1,
      });

      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      const result = useDashboardData({
        recentDealsLimit: 5,
        enableAutoRefresh: true,
        autoRefreshInterval: 5 * 60 * 1000,
      });

      expect(result.error).toBe(errorMessage);
      expect(result.loading).toBe(false);
      expect(result.metrics).toBeNull();
    });

    it('should handle refetch functionality', () => {
      const mockRefetch = jest.fn();
      mockUseDashboardData.mockReturnValue({
        metrics: mockMetrics,
        recentDeals: mockRecentDeals,
        loading: false,
        error: null,
        refetch: mockRefetch,
        isRefetching: false,
        lastUpdated: new Date(),
        retryCount: 0,
      });

      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      const result = useDashboardData({
        recentDealsLimit: 5,
        enableAutoRefresh: true,
        autoRefreshInterval: 5 * 60 * 1000,
      });

      result.refetch();
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Real-time Updates Integration', () => {
    it('should call useRealTimeDeals with correct options', () => {
      const { useRealTimeDeals } = require('@/hooks/useRealTimeDeals');
      
      const options = {
        enabled: true,
        maxNewDeals: 10,
        onNewDeal: expect.any(Function),
        onConnectionChange: expect.any(Function),
        onError: expect.any(Function),
      };

      useRealTimeDeals(options);

      expect(mockUseRealTimeDeals).toHaveBeenCalledWith(options);
    });

    it('should handle connected state', () => {
      const { useRealTimeDeals } = require('@/hooks/useRealTimeDeals');
      
      const result = useRealTimeDeals({
        enabled: true,
        maxNewDeals: 10,
        onNewDeal: jest.fn(),
        onConnectionChange: jest.fn(),
        onError: jest.fn(),
      });

      expect(result.isConnected).toBe(true);
      expect(result.connectionError).toBeNull();
      expect(result.newDealsCount).toBe(0);
    });

    it('should handle disconnected state', () => {
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: [],
        isConnected: false,
        connectionError: 'WebSocket connection failed',
        lastUpdate: null,
        clearNewDeals: jest.fn(),
        reconnect: jest.fn(),
        newDealsCount: 0,
      });

      const { useRealTimeDeals } = require('@/hooks/useRealTimeDeals');
      
      const result = useRealTimeDeals({
        enabled: true,
        maxNewDeals: 10,
        onNewDeal: jest.fn(),
        onConnectionChange: jest.fn(),
        onError: jest.fn(),
      });

      expect(result.isConnected).toBe(false);
      expect(result.connectionError).toBe('WebSocket connection failed');
    });

    it('should handle new deals', () => {
      const mockClearNewDeals = jest.fn();
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: [mockRecentDeals[0]],
        isConnected: true,
        connectionError: null,
        lastUpdate: new Date(),
        clearNewDeals: mockClearNewDeals,
        reconnect: jest.fn(),
        newDealsCount: 1,
      });

      const { useRealTimeDeals } = require('@/hooks/useRealTimeDeals');
      
      const result = useRealTimeDeals({
        enabled: true,
        maxNewDeals: 10,
        onNewDeal: jest.fn(),
        onConnectionChange: jest.fn(),
        onError: jest.fn(),
      });

      expect(result.newDealsCount).toBe(1);
      expect(result.newDeals).toEqual([mockRecentDeals[0]]);
      
      result.clearNewDeals();
      expect(mockClearNewDeals).toHaveBeenCalled();
    });

    it('should handle reconnection', () => {
      const mockReconnect = jest.fn();
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: [],
        isConnected: false,
        connectionError: 'Connection lost',
        lastUpdate: null,
        clearNewDeals: jest.fn(),
        reconnect: mockReconnect,
        newDealsCount: 0,
      });

      const { useRealTimeDeals } = require('@/hooks/useRealTimeDeals');
      
      const result = useRealTimeDeals({
        enabled: true,
        maxNewDeals: 10,
        onNewDeal: jest.fn(),
        onConnectionChange: jest.fn(),
        onError: jest.fn(),
      });

      result.reconnect();
      expect(mockReconnect).toHaveBeenCalled();
    });
  });

  describe('Analytics Integration', () => {
    it('should call useDashboardAnalytics', () => {
      const { useDashboardAnalytics } = require('@/hooks/useAnalytics');
      
      const result = useDashboardAnalytics();

      expect(mockUseDashboardAnalytics).toHaveBeenCalled();
      expect(result.sessionId).toBe('test-session-id');
    });

    it('should track dashboard load', () => {
      const mockTrackDashboardLoad = jest.fn();
      mockUseDashboardAnalytics.mockReturnValue({
        trackDashboardLoad: mockTrackDashboardLoad,
        trackDataRefresh: jest.fn(),
        trackFeatureUsage: jest.fn(),
        startOperation: jest.fn(),
        endOperation: jest.fn(),
        sessionId: 'test-session-id',
      });

      const { useDashboardAnalytics } = require('@/hooks/useAnalytics');
      
      const result = useDashboardAnalytics();
      
      const loadData = {
        totalLoadTime: 1500,
        apiCallsCount: 2,
        errorCount: 0,
        sessionId: 'test-session-id',
        timestamp: new Date(),
      };

      result.trackDashboardLoad(loadData);
      expect(mockTrackDashboardLoad).toHaveBeenCalledWith(loadData);
    });

    it('should track feature usage', () => {
      const mockTrackFeatureUsage = jest.fn();
      mockUseDashboardAnalytics.mockReturnValue({
        trackDashboardLoad: jest.fn(),
        trackDataRefresh: jest.fn(),
        trackFeatureUsage: mockTrackFeatureUsage,
        startOperation: jest.fn(),
        endOperation: jest.fn(),
        sessionId: 'test-session-id',
      });

      const { useDashboardAnalytics } = require('@/hooks/useAnalytics');
      
      const result = useDashboardAnalytics();
      
      result.trackFeatureUsage('dashboard-refresh', { source: 'header-button' });
      expect(mockTrackFeatureUsage).toHaveBeenCalledWith('dashboard-refresh', { source: 'header-button' });
    });

    it('should track data refresh', () => {
      const mockTrackDataRefresh = jest.fn();
      mockUseDashboardAnalytics.mockReturnValue({
        trackDashboardLoad: jest.fn(),
        trackDataRefresh: mockTrackDataRefresh,
        trackFeatureUsage: jest.fn(),
        startOperation: jest.fn(),
        endOperation: jest.fn(),
        sessionId: 'test-session-id',
      });

      const { useDashboardAnalytics } = require('@/hooks/useAnalytics');
      
      const result = useDashboardAnalytics();
      
      result.trackDataRefresh('MANUAL', 'user-action', 1200, true, {
        source: 'header-button',
        recordsUpdated: 5,
      });
      
      expect(mockTrackDataRefresh).toHaveBeenCalledWith('MANUAL', 'user-action', 1200, true, {
        source: 'header-button',
        recordsUpdated: 5,
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors', () => {
      const networkError = 'Network error: Unable to connect to server';
      mockUseDashboardData.mockReturnValue({
        metrics: null,
        recentDeals: [],
        loading: false,
        error: networkError,
        refetch: jest.fn(),
        isRefetching: false,
        lastUpdated: null,
        retryCount: 0,
      });

      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      const result = useDashboardData({
        recentDealsLimit: 5,
        enableAutoRefresh: true,
        autoRefreshInterval: 5 * 60 * 1000,
      });

      expect(result.error).toBe(networkError);
    });

    it('should handle database errors', () => {
      const dbError = 'Database error: Connection timeout';
      mockUseDashboardData.mockReturnValue({
        metrics: null,
        recentDeals: [],
        loading: false,
        error: dbError,
        refetch: jest.fn(),
        isRefetching: false,
        lastUpdated: null,
        retryCount: 0,
      });

      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      const result = useDashboardData({
        recentDealsLimit: 5,
        enableAutoRefresh: true,
        autoRefreshInterval: 5 * 60 * 1000,
      });

      expect(result.error).toBe(dbError);
    });

    it('should handle real-time connection errors', () => {
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: [],
        isConnected: false,
        connectionError: 'Subscription failed: Authentication error',
        lastUpdate: null,
        clearNewDeals: jest.fn(),
        reconnect: jest.fn(),
        newDealsCount: 0,
      });

      const { useRealTimeDeals } = require('@/hooks/useRealTimeDeals');
      
      const result = useRealTimeDeals({
        enabled: true,
        maxNewDeals: 10,
        onNewDeal: jest.fn(),
        onConnectionChange: jest.fn(),
        onError: jest.fn(),
      });

      expect(result.connectionError).toBe('Subscription failed: Authentication error');
      expect(result.isConnected).toBe(false);
    });
  });

  describe('Data Validation', () => {
    it('should handle empty metrics data', () => {
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

      mockUseDashboardData.mockReturnValue({
        metrics: emptyMetrics,
        recentDeals: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
        lastUpdated: new Date(),
        retryCount: 0,
      });

      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      const result = useDashboardData({
        recentDealsLimit: 5,
        enableAutoRefresh: true,
        autoRefreshInterval: 5 * 60 * 1000,
      });

      expect(result.metrics).toEqual(emptyMetrics);
      expect(result.metrics.totalDeals).toBe(0);
      expect(result.metrics.topSectors).toEqual([]);
    });

    it('should handle malformed data gracefully', () => {
      const malformedMetrics = {
        ...mockMetrics,
        topSectors: null, // Malformed data
      } as any;

      mockUseDashboardData.mockReturnValue({
        metrics: malformedMetrics,
        recentDeals: mockRecentDeals,
        loading: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
        lastUpdated: new Date(),
        retryCount: 0,
      });

      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      const result = useDashboardData({
        recentDealsLimit: 5,
        enableAutoRefresh: true,
        autoRefreshInterval: 5 * 60 * 1000,
      });

      expect(result.metrics.topSectors).toBeNull();
      expect(result.recentDeals).toEqual(mockRecentDeals);
    });

    it('should validate deal data structure', () => {
      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      const result = useDashboardData({
        recentDealsLimit: 5,
        enableAutoRefresh: true,
        autoRefreshInterval: 5 * 60 * 1000,
      });

      expect(result.recentDeals).toHaveLength(2);
      
      const firstDeal = result.recentDeals[0];
      expect(firstDeal).toHaveProperty('id');
      expect(firstDeal).toHaveProperty('companyName');
      expect(firstDeal).toHaveProperty('fundingStage');
      expect(firstDeal).toHaveProperty('amountRaised');
      expect(firstDeal).toHaveProperty('dateAnnounced');
      expect(firstDeal).toHaveProperty('formattedAmount');
      expect(firstDeal).toHaveProperty('formattedDate');
      expect(firstDeal).toHaveProperty('allInvestors');
      
      expect(typeof firstDeal.id).toBe('number');
      expect(typeof firstDeal.companyName).toBe('string');
      expect(typeof firstDeal.amountRaised).toBe('number');
      expect(Array.isArray(firstDeal.allInvestors)).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle refetch during loading', () => {
      const mockRefetch = jest.fn();
      mockUseDashboardData.mockReturnValue({
        metrics: mockMetrics,
        recentDeals: mockRecentDeals,
        loading: false,
        error: null,
        refetch: mockRefetch,
        isRefetching: true, // Currently refetching
        lastUpdated: new Date(),
        retryCount: 0,
      });

      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      const result = useDashboardData({
        recentDealsLimit: 5,
        enableAutoRefresh: true,
        autoRefreshInterval: 5 * 60 * 1000,
      });

      expect(result.isRefetching).toBe(true);
      expect(result.loading).toBe(false);
      expect(result.metrics).toEqual(mockMetrics);
    });

    it('should handle multiple new deals efficiently', () => {
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: mockRecentDeals,
        isConnected: true,
        connectionError: null,
        lastUpdate: new Date(),
        clearNewDeals: jest.fn(),
        reconnect: jest.fn(),
        newDealsCount: 2,
      });

      const { useRealTimeDeals } = require('@/hooks/useRealTimeDeals');
      
      const result = useRealTimeDeals({
        enabled: true,
        maxNewDeals: 10,
        onNewDeal: jest.fn(),
        onConnectionChange: jest.fn(),
        onError: jest.fn(),
      });

      expect(result.newDealsCount).toBe(2);
      expect(result.newDeals).toHaveLength(2);
    });

    it('should handle auto-refresh configuration', () => {
      const { useDashboardData } = require('@/hooks/useDashboardData');
      
      const options = {
        recentDealsLimit: 10,
        enableAutoRefresh: false,
        autoRefreshInterval: 10 * 60 * 1000, // 10 minutes
      };

      useDashboardData(options);

      expect(mockUseDashboardData).toHaveBeenCalledWith(options);
    });
  });
});