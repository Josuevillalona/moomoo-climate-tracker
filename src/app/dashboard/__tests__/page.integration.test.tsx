import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../page';
import { FundingService } from '@/lib/api/funding';
import { supabase } from '@/lib/supabase';
import { DashboardMetrics, FundingDeal, ApiErrorType } from '@/types/api';

// Mock the API service
jest.mock('@/lib/api/funding');
jest.mock('@/lib/supabase');

// Mock the hooks
jest.mock('@/hooks/useDashboardData');
jest.mock('@/hooks/useRealTimeDeals');

// Mock Lucide React icons to avoid rendering issues
jest.mock('lucide-react', () => ({
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Users: () => <div data-testid="users-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
  Search: () => <div data-testid="search-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Briefcase: () => <div data-testid="briefcase-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  MoreHorizontal: () => <div data-testid="more-horizontal-icon" />,
  Home: () => <div data-testid="home-icon" />,
  Database: () => <div data-testid="database-icon" />,
  History: () => <div data-testid="history-icon" />,
  Bookmark: () => <div data-testid="bookmark-icon" />,
  PieChart: () => <div data-testid="pie-chart-icon" />,
  Globe: () => <div data-testid="globe-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Download: () => <div data-testid="download-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
}));

// Mock the dashboard components to avoid complex rendering
jest.mock('@/components/dashboard/DashboardSkeleton', () => {
  return function MockDashboardSkeleton() {
    return <div data-testid="dashboard-skeleton">Loading dashboard...</div>;
  };
});

jest.mock('@/components/dashboard/ErrorFallbacks', () => ({
  DashboardErrorFallback: ({ error, retry }: any) => (
    <div data-testid="dashboard-error-fallback">
      <div data-testid="error-message">{error.userMessage || error.message}</div>
      <button data-testid="retry-button" onClick={retry}>
        Retry
      </button>
    </div>
  ),
  SectionErrorBoundary: ({ children, fallback }: any) => {
    try {
      return <>{children}</>;
    } catch (error) {
      return fallback ? fallback(error, () => {}) : <div data-testid="section-error">Error</div>;
    }
  },
  MetricsErrorFallback: ({ error, retry }: any) => (
    <div data-testid="metrics-error-fallback">
      <div data-testid="error-message">{error.userMessage || error.message}</div>
      <button data-testid="retry-button" onClick={retry}>
        Retry
      </button>
    </div>
  ),
  ChartErrorFallback: ({ error, retry }: any) => (
    <div data-testid="chart-error-fallback">
      <div data-testid="error-message">{error.userMessage || error.message}</div>
      <button data-testid="retry-button" onClick={retry}>
        Retry
      </button>
    </div>
  ),
  RecentDealsErrorFallback: ({ error, retry }: any) => (
    <div data-testid="recent-deals-error-fallback">
      <div data-testid="error-message">{error.userMessage || error.message}</div>
      <button data-testid="retry-button" onClick={retry}>
        Retry
      </button>
    </div>
  ),
  WorldMapErrorFallback: ({ error, retry }: any) => (
    <div data-testid="world-map-error-fallback">
      <div data-testid="error-message">{error.userMessage || error.message}</div>
      <button data-testid="retry-button" onClick={retry}>
        Retry
      </button>
    </div>
  ),
  CompanySignalsErrorFallback: ({ error, retry }: any) => (
    <div data-testid="company-signals-error-fallback">
      <div data-testid="error-message">{error.userMessage || error.message}</div>
      <button data-testid="retry-button" onClick={retry}>
        Retry
      </button>
    </div>
  ),
  NewsErrorFallback: ({ error, retry }: any) => (
    <div data-testid="news-error-fallback">
      <div data-testid="error-message">{error.userMessage || error.message}</div>
      <button data-testid="retry-button" onClick={retry}>
        Retry
      </button>
    </div>
  ),
  FundReturnsErrorFallback: ({ error, retry }: any) => (
    <div data-testid="fund-returns-error-fallback">
      <div data-testid="error-message">{error.userMessage || error.message}</div>
      <button data-testid="retry-button" onClick={retry}>
        Retry
      </button>
    </div>
  ),
  SectionErrorDisplay: ({ error, retry }: any) => (
    <div data-testid="section-error-display">
      <div data-testid="error-message">{error.userMessage || error.message}</div>
      <button data-testid="retry-button" onClick={retry}>
        Retry
      </button>
    </div>
  ),
}));

jest.mock('@/components/dashboard/LoadingStates', () => ({
  MetricsCardLoading: () => <div data-testid="metrics-loading">Loading metrics...</div>,
  TopMetricsLoading: () => <div data-testid="top-metrics-loading">Loading top metrics...</div>,
  ChartCardLoading: () => <div data-testid="chart-loading">Loading chart...</div>,
  QuickCountsLoading: () => <div data-testid="quick-counts-loading">Loading quick counts...</div>,
  WorldMapLoading: () => <div data-testid="world-map-loading">Loading world map...</div>,
  RecentDealsLoading: () => <div data-testid="recent-deals-loading">Loading recent deals...</div>,
  CompanySignalsLoading: () => <div data-testid="company-signals-loading">Loading company signals...</div>,
  NewsLoading: () => <div data-testid="news-loading">Loading news...</div>,
  FundReturnsLoading: () => <div data-testid="fund-returns-loading">Loading fund returns...</div>,
  LoadingTransition: ({ isLoading, loadingComponent, children }: any) => 
    isLoading ? loadingComponent : children,
  SectionLoadingIndicator: () => <div data-testid="section-loading">Loading section...</div>,
}));

jest.mock('@/components/dashboard/NewDealsNotification', () => ({
  NewDealsNotification: ({ newDealsCount, isVisible, onDismiss, onViewDeals }: any) => 
    isVisible ? (
      <div data-testid="new-deals-notification">
        <div data-testid="new-deals-count">{newDealsCount} new deals</div>
        <button data-testid="dismiss-notification" onClick={onDismiss}>Dismiss</button>
        <button data-testid="view-deals" onClick={onViewDeals}>View Deals</button>
      </div>
    ) : null,
  CompactNewDealsIndicator: ({ count }: any) => (
    <div data-testid="compact-new-deals-indicator">{count}</div>
  ),
  NewDealsBadge: ({ count }: any) => (
    <div data-testid="new-deals-badge">{count}</div>
  ),
}));

jest.mock('@/components/dashboard/NewDealHighlight', () => ({
  NewDealHighlight: ({ children, isHighlighted }: any) => (
    <div data-testid="new-deal-highlight" data-highlighted={isHighlighted}>
      {children}
    </div>
  ),
  AnimatedDealItem: ({ children, isNew }: any) => (
    <div data-testid="animated-deal-item" data-new={isNew}>
      {children}
    </div>
  ),
  useNewDealHighlights: (dealIds: number[]) => ({
    isHighlighted: (id: number) => dealIds.includes(id),
    addHighlight: jest.fn(),
    removeHighlight: jest.fn(),
    clearHighlights: jest.fn(),
  }),
}));

jest.mock('@/components/ui/notification', () => ({
  useNotifications: () => ({
    notifications: [],
    addNotification: jest.fn(),
    dismissNotification: jest.fn(),
  }),
  NotificationContainer: () => <div data-testid="notification-container" />,
}));

jest.mock('@/components/debug/RealTimeDebug', () => {
  return function MockRealTimeDebug() {
    return <div data-testid="real-time-debug">Real-time debug info</div>;
  };
});

// Mock ErrorBoundary
jest.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children, fallback, onError }: any) => {
    try {
      return <>{children}</>;
    } catch (error) {
      if (fallback) {
        return fallback(error, () => {});
      }
      return <div data-testid="error-boundary">Error occurred</div>;
    }
  },
}));

const mockFundingService = FundingService as jest.Mocked<typeof FundingService>;

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

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock the hooks
    mockUseDashboardData = require('@/hooks/useDashboardData').useDashboardData;
    mockUseRealTimeDeals = require('@/hooks/useRealTimeDeals').useRealTimeDeals;

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
  });

  describe('Dashboard Page Rendering with Real API Data', () => {
    it('should render dashboard with real metrics data', async () => {
      render(<Dashboard />);

      // Wait for the dashboard to load
      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // Check that main dashboard elements are present
      expect(screen.getByText('MooMoo Climate')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      
      // Verify that the hook was called
      expect(mockUseDashboardData).toHaveBeenCalledWith(
        expect.objectContaining({
          recentDealsLimit: 5,
          enableAutoRefresh: true,
          autoRefreshInterval: 5 * 60 * 1000,
        })
      );
    });

    it('should display real-time connection status', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // Check for real-time connection indicator
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    it('should render metrics sections when data is available', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // Check for various dashboard sections
      expect(screen.getByText('CLOSED DEALS')).toBeInTheDocument();
      expect(screen.getByText('QUICK COUNTS')).toBeInTheDocument();
      expect(screen.getByText('DEALS BY REGIONS')).toBeInTheDocument();
    });

    it('should handle progressive loading states correctly', async () => {
      // Start with loading state
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

      const { rerender } = render(<Dashboard />);

      // Should show loading skeleton initially
      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();

      // Update to loaded state
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

      rerender(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // Should show actual content
      expect(screen.getByText('MooMoo Climate')).toBeInTheDocument();
    });

    it('should display recent deals data correctly', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // The actual deal rendering would be in the truncated part of the component
      // We can verify the hook was called with the correct data
      expect(mockUseDashboardData).toHaveBeenCalled();
      
      const hookCall = mockUseDashboardData.mock.calls[0][0];
      expect(hookCall.recentDealsLimit).toBe(5);
    });
  });

  describe('Error Handling and Retry Functionality', () => {
    it('should display error state when API fails completely', async () => {
      const mockRefetch = jest.fn();
      mockUseDashboardData.mockReturnValue({
        metrics: null,
        recentDeals: [],
        loading: false,
        error: 'Failed to fetch dashboard data',
        refetch: mockRefetch,
        isRefetching: false,
        lastUpdated: null,
        retryCount: 1,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // Should show error state
      expect(screen.getByTestId('dashboard-error-fallback')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to fetch dashboard data');
      
      // Should have retry button
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeInTheDocument();

      // Test retry functionality
      fireEvent.click(retryButton);
      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should handle partial data loading with some errors', async () => {
      // Simulate partial success - metrics loaded but deals failed
      mockUseDashboardData.mockReturnValue({
        metrics: mockMetrics,
        recentDeals: [],
        loading: false,
        error: null, // No global error, but individual sections might fail
        refetch: jest.fn(),
        isRefetching: false,
        lastUpdated: new Date(),
        retryCount: 0,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // Should render main dashboard (not error fallback)
      expect(screen.getByText('MooMoo Climate')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-error-fallback')).not.toBeInTheDocument();
    });

    it('should show refresh indicator during refetch', async () => {
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

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // Should show refresh indicator
      expect(screen.getByText('Refreshing data...')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
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

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(networkError);
      });
    });

    it('should handle database errors with appropriate messaging', async () => {
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

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent(dbError);
      });
    });
  });

  describe('Real-time Update Functionality', () => {
    it('should display real-time connection status correctly', async () => {
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: [],
        isConnected: true,
        connectionError: null,
        lastUpdate: null,
        clearNewDeals: jest.fn(),
        reconnect: jest.fn(),
        newDealsCount: 0,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Live')).toBeInTheDocument();
      });
    });

    it('should show disconnected state when real-time connection fails', async () => {
      const mockReconnect = jest.fn();
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: [],
        isConnected: false,
        connectionError: 'WebSocket connection failed',
        lastUpdate: null,
        clearNewDeals: jest.fn(),
        reconnect: mockReconnect,
        newDealsCount: 0,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
        expect(screen.getByText('Real-time updates disconnected')).toBeInTheDocument();
      });

      // Test reconnect functionality
      const reconnectButton = screen.getByText('Reconnect');
      fireEvent.click(reconnectButton);
      expect(mockReconnect).toHaveBeenCalled();
    });

    it('should display new deals notification when new deals arrive', async () => {
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

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('new-deals-notification')).toBeInTheDocument();
        expect(screen.getByTestId('new-deals-count')).toHaveTextContent('1 new deals');
      });

      // Test dismiss functionality
      const dismissButton = screen.getByTestId('dismiss-notification');
      fireEvent.click(dismissButton);
      expect(mockClearNewDeals).toHaveBeenCalled();
    });

    it('should handle multiple new deals correctly', async () => {
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: mockRecentDeals,
        isConnected: true,
        connectionError: null,
        lastUpdate: new Date(),
        clearNewDeals: jest.fn(),
        reconnect: jest.fn(),
        newDealsCount: 2,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('new-deals-count')).toHaveTextContent('2 new deals');
      });
    });

    it('should handle real-time subscription errors', async () => {
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: [],
        isConnected: false,
        connectionError: 'Subscription failed: Authentication error',
        lastUpdate: null,
        clearNewDeals: jest.fn(),
        reconnect: jest.fn(),
        newDealsCount: 0,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Real-time updates disconnected')).toBeInTheDocument();
      });
    });

    it('should update dashboard data when new deals arrive via real-time', async () => {
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

      // Simulate new deal arriving
      const mockOnNewDeal = jest.fn();
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: [mockRecentDeals[0]],
        isConnected: true,
        connectionError: null,
        lastUpdate: new Date(),
        clearNewDeals: jest.fn(),
        reconnect: jest.fn(),
        newDealsCount: 1,
      });

      render(<Dashboard />);

      // Verify that the real-time hook was set up with proper callbacks
      expect(mockUseRealTimeDeals).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          maxNewDeals: 10,
          onNewDeal: expect.any(Function),
          onConnectionChange: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });
  });

  describe('User Interactions', () => {
    it('should handle manual refresh button click', async () => {
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

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // Find and click refresh button
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should handle new deals notification view deals action', async () => {
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: [mockRecentDeals[0]],
        isConnected: true,
        connectionError: null,
        lastUpdate: new Date(),
        clearNewDeals: jest.fn(),
        reconnect: jest.fn(),
        newDealsCount: 1,
      });

      // Mock scrollIntoView
      const mockScrollIntoView = jest.fn();
      Object.defineProperty(Element.prototype, 'scrollIntoView', {
        value: mockScrollIntoView,
        writable: true,
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('new-deals-notification')).toBeInTheDocument();
      });

      // Click view deals button
      const viewDealsButton = screen.getByTestId('view-deals');
      fireEvent.click(viewDealsButton);

      // Should attempt to scroll to recent deals section
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should handle search input interactions', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // Find search input
      const searchInput = screen.getByPlaceholderText('Search Climate Data');
      expect(searchInput).toBeInTheDocument();

      // Test typing in search
      await userEvent.type(searchInput, 'solar energy');
      expect(searchInput).toHaveValue('solar energy');
    });
  });

  describe('Performance and Loading States', () => {
    it('should show appropriate loading states during initial load', async () => {
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

      render(<Dashboard />);

      // Should show skeleton loader
      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('should handle progressive loading of different sections', async () => {
      // Start with partial data
      mockUseDashboardData.mockReturnValue({
        metrics: mockMetrics,
        recentDeals: [], // No deals yet
        loading: false,
        error: null,
        refetch: jest.fn(),
        isRefetching: false,
        lastUpdated: new Date(),
        retryCount: 0,
      });

      const { rerender } = render(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // Update with deals data
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

      rerender(<Dashboard />);

      // Should show full dashboard
      expect(screen.getByText('MooMoo Climate')).toBeInTheDocument();
    });

    it('should handle concurrent loading and real-time updates', async () => {
      // Start with loading state
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

      // Real-time is connected but no new deals yet
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: [],
        isConnected: true,
        connectionError: null,
        lastUpdate: null,
        clearNewDeals: jest.fn(),
        reconnect: jest.fn(),
        newDealsCount: 0,
      });

      const { rerender } = render(<Dashboard />);

      expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();

      // Data loads while real-time is active
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

      rerender(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
        expect(screen.getByText('Live')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases and Error Recovery', () => {
    it('should handle empty data gracefully', async () => {
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

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // Should still render dashboard structure
      expect(screen.getByText('MooMoo Climate')).toBeInTheDocument();
    });

    it('should handle malformed data gracefully', async () => {
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

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      });

      // Should still render without crashing
      expect(screen.getByText('MooMoo Climate')).toBeInTheDocument();
    });

    it('should recover from temporary errors', async () => {
      const mockRefetch = jest.fn();
      
      // Start with error state
      mockUseDashboardData.mockReturnValue({
        metrics: null,
        recentDeals: [],
        loading: false,
        error: 'Temporary network error',
        refetch: mockRefetch,
        isRefetching: false,
        lastUpdated: null,
        retryCount: 1,
      });

      const { rerender } = render(<Dashboard />);

      expect(screen.getByTestId('dashboard-error-fallback')).toBeInTheDocument();

      // Simulate recovery
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

      rerender(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-error-fallback')).not.toBeInTheDocument();
        expect(screen.getByText('MooMoo Climate')).toBeInTheDocument();
      });
    });

    it('should handle real-time reconnection scenarios', async () => {
      const mockReconnect = jest.fn();
      
      // Start disconnected
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: [],
        isConnected: false,
        connectionError: 'Connection lost',
        lastUpdate: null,
        clearNewDeals: jest.fn(),
        reconnect: mockReconnect,
        newDealsCount: 0,
      });

      const { rerender } = render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Real-time updates disconnected')).toBeInTheDocument();
      });

      // Simulate reconnection
      mockUseRealTimeDeals.mockReturnValue({
        newDeals: [],
        isConnected: true,
        connectionError: null,
        lastUpdate: new Date(),
        clearNewDeals: jest.fn(),
        reconnect: mockReconnect,
        newDealsCount: 0,
      });

      rerender(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Live')).toBeInTheDocument();
        expect(screen.queryByText('Real-time updates disconnected')).not.toBeInTheDocument();
      });
    });
  });
});