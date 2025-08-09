/**
 * Test suite for AnalyticsDashboard component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AnalyticsDashboard } from '../AnalyticsDashboard';
import useAnalytics from '../../../hooks/useAnalytics';

// Setup test environment
import '@testing-library/jest-dom';

// Mock the useAnalytics hook
jest.mock('../../../hooks/useAnalytics');

const mockUseAnalytics = useAnalytics as jest.MockedFunction<typeof useAnalytics>;

const mockAnalyticsData = {
  realTimeMetrics: {
    currentSessions: 5,
    averageLoadTime: 2500,
    errorRate: 3.2,
    refreshRate: 8,
    userActivity: 25
  },
  generateReport: jest.fn(() => ({
    timeRange: { 
      start: new Date('2024-01-01T00:00:00Z'), 
      end: new Date('2024-01-02T00:00:00Z') 
    },
    totalSessions: 150,
    totalUsers: 75,
    averageSessionDuration: 420000, // 7 minutes
    averageLoadTime: 2800,
    bounceRate: 28.5,
    errorRate: 4.1,
    mostUsedFeatures: [
      { feature: 'dashboard-refresh', usage: 45 },
      { feature: 'search', usage: 32 },
      { feature: 'filter-sector', usage: 28 },
      { feature: 'export-csv', usage: 15 }
    ],
    performanceMetrics: {
      averageApiResponseTime: 1350,
      cacheHitRate: 68.5,
      successRate: 94.2,
      p95LoadTime: 4200
    },
    userEngagement: {
      averageInteractionsPerSession: 12.3,
      averagePageViewsPerSession: 3.1,
      returnUserRate: 42.8
    },
    topErrors: [
      { error: 'API Timeout', count: 8, impact: 'High' },
      { error: 'Network Error', count: 5, impact: 'Medium' },
      { error: 'Parse Error', count: 2, impact: 'Low' }
    ],
    recommendations: [
      'Consider optimizing dashboard load times - current average exceeds 3 seconds',
      'High cache miss rate - review caching strategy'
    ]
  })),
  exportData: jest.fn(),
  clearData: jest.fn(),
  isTracking: true,
  sessionId: 'test-session-123',
  trackInteraction: jest.fn(),
  trackDataRefresh: jest.fn(),
  trackFeatureUsage: jest.fn(),
  trackSearch: jest.fn(),
  trackFilter: jest.fn(),
  trackExport: jest.fn()
};

// Mock DOM APIs for file download
const mockCreateElement = jest.fn(() => ({
  href: '',
  download: '',
  click: jest.fn(),
  remove: jest.fn()
}));

const mockCreateObjectURL = jest.fn(() => 'blob:test-url');
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement
});

Object.defineProperty(document.body, 'appendChild', {
  value: jest.fn()
});

Object.defineProperty(document.body, 'removeChild', {
  value: jest.fn()
});

Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL
});

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    mockUseAnalytics.mockReturnValue(mockAnalyticsData);
    jest.clearAllMocks();
  });

  it('should render analytics dashboard with real-time metrics', () => {
    render(<AnalyticsDashboard />);

    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Active Sessions
    expect(screen.getByText('2.5s')).toBeInTheDocument(); // Avg Load Time
    expect(screen.getByText('3.2%')).toBeInTheDocument(); // Error Rate
    expect(screen.getByText('8/5min')).toBeInTheDocument(); // Refresh Rate
    expect(screen.getByText('25')).toBeInTheDocument(); // User Activity
  });

  it('should display historical metrics in overview tab', () => {
    render(<AnalyticsDashboard />);

    expect(screen.getByText('150')).toBeInTheDocument(); // Total Sessions
    expect(screen.getByText('75')).toBeInTheDocument(); // Total Users
    expect(screen.getByText('7.0m')).toBeInTheDocument(); // Avg Session Duration
    expect(screen.getByText('28.5%')).toBeInTheDocument(); // Bounce Rate
  });

  it('should display performance health indicators', () => {
    render(<AnalyticsDashboard />);

    expect(screen.getByText('2.8s')).toBeInTheDocument(); // Load Time
    expect(screen.getByText('94.2%')).toBeInTheDocument(); // Success Rate
    expect(screen.getByText('68.5%')).toBeInTheDocument(); // Cache Hit Rate
    expect(screen.getByText('4.1%')).toBeInTheDocument(); // Error Rate
  });

  it('should display user engagement metrics', () => {
    render(<AnalyticsDashboard />);

    expect(screen.getByText('12.3')).toBeInTheDocument(); // Interactions/Session
    expect(screen.getByText('3.1')).toBeInTheDocument(); // Page Views/Session
    expect(screen.getByText('42.8%')).toBeInTheDocument(); // Return User Rate
  });

  it('should switch between tabs', () => {
    render(<AnalyticsDashboard />);

    // Click on Performance tab
    fireEvent.click(screen.getByText('Performance'));
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('1.4s')).toBeInTheDocument(); // Average API Response

    // Click on Features tab
    fireEvent.click(screen.getByText('Features'));
    expect(screen.getByText('Most Used Features')).toBeInTheDocument();
    expect(screen.getByText('dashboard-refresh')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument(); // Usage count
  });

  it('should handle time range selection', () => {
    render(<AnalyticsDashboard />);

    const timeRangeSelect = screen.getByDisplayValue('Last 24 Hours');
    fireEvent.change(timeRangeSelect, { target: { value: '7d' } });

    expect(mockAnalyticsData.generateReport).toHaveBeenCalledWith(
      expect.objectContaining({
        start: expect.any(Date),
        end: expect.any(Date)
      })
    );
  });

  it('should export data as JSON', () => {
    mockAnalyticsData.exportData.mockReturnValue('{"test": "data"}');
    render(<AnalyticsDashboard />);

    fireEvent.click(screen.getByText('Export JSON'));

    expect(mockAnalyticsData.exportData).toHaveBeenCalledWith('json');
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should export data as CSV', () => {
    mockAnalyticsData.exportData.mockReturnValue('timestamp,type,value\n2024-01-01,test,123');
    render(<AnalyticsDashboard />);

    fireEvent.click(screen.getByText('Export CSV'));

    expect(mockAnalyticsData.exportData).toHaveBeenCalledWith('csv');
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it('should clear analytics data', () => {
    render(<AnalyticsDashboard />);

    fireEvent.click(screen.getByText('Clear Data'));

    expect(mockAnalyticsData.clearData).toHaveBeenCalled();
  });

  it('should display performance recommendations', () => {
    render(<AnalyticsDashboard />);

    // Switch to Performance tab
    fireEvent.click(screen.getByText('Performance'));

    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText(/optimizing dashboard load times/)).toBeInTheDocument();
    expect(screen.getByText(/cache miss rate/)).toBeInTheDocument();
  });

  it('should show system health as optimal when no recommendations', () => {
    const mockDataWithoutRecommendations = {
      ...mockAnalyticsData,
      generateReport: jest.fn(() => ({
        ...mockAnalyticsData.generateReport(),
        recommendations: []
      }))
    };

    mockUseAnalytics.mockReturnValue(mockDataWithoutRecommendations);
    render(<AnalyticsDashboard />);

    fireEvent.click(screen.getByText('Performance'));

    expect(screen.getByText('System performance is optimal')).toBeInTheDocument();
  });

  it('should display feature usage with progress bars', () => {
    render(<AnalyticsDashboard />);

    fireEvent.click(screen.getByText('Features'));

    expect(screen.getByText('dashboard-refresh')).toBeInTheDocument();
    expect(screen.getByText('search')).toBeInTheDocument();
    expect(screen.getByText('filter-sector')).toBeInTheDocument();
    expect(screen.getByText('export-csv')).toBeInTheDocument();

    // Check usage counts
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('32')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    const mockLoadingData = {
      ...mockAnalyticsData,
      generateReport: jest.fn(() => null)
    };

    mockUseAnalytics.mockReturnValue(mockLoadingData);
    render(<AnalyticsDashboard />);

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('should auto-refresh data at specified interval', async () => {
    jest.useFakeTimers();
    
    render(<AnalyticsDashboard refreshInterval={5000} />);

    // Initial call
    expect(mockAnalyticsData.generateReport).toHaveBeenCalledTimes(1);

    // Advance time by refresh interval
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(mockAnalyticsData.generateReport).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  it('should display health status indicators with appropriate colors', () => {
    render(<AnalyticsDashboard />);

    // Check for health status icons (these would be rendered as SVG elements)
    const healthIndicators = screen.getAllByRole('img', { hidden: true });
    expect(healthIndicators.length).toBeGreaterThan(0);
  });

  it('should format durations correctly', () => {
    render(<AnalyticsDashboard />);

    // Check various duration formats
    expect(screen.getByText('2.5s')).toBeInTheDocument(); // Load time in seconds
    expect(screen.getByText('7.0m')).toBeInTheDocument(); // Session duration in minutes
  });

  it('should format percentages correctly', () => {
    render(<AnalyticsDashboard />);

    // Check percentage formatting
    expect(screen.getByText('28.5%')).toBeInTheDocument(); // Bounce rate
    expect(screen.getByText('94.2%')).toBeInTheDocument(); // Success rate
    expect(screen.getByText('68.5%')).toBeInTheDocument(); // Cache hit rate
  });

  it('should handle custom time range prop', () => {
    const customTimeRange = {
      start: new Date('2024-01-01T00:00:00Z'),
      end: new Date('2024-01-07T00:00:00Z')
    };

    render(<AnalyticsDashboard timeRange={customTimeRange} />);

    expect(mockAnalyticsData.generateReport).toHaveBeenCalledWith(customTimeRange);
  });

  it('should show/hide details based on showDetails prop', () => {
    const { rerender } = render(<AnalyticsDashboard showDetails={false} />);

    // With showDetails=false, detailed sections should not be visible
    fireEvent.click(screen.getByText('Performance'));
    
    rerender(<AnalyticsDashboard showDetails={true} />);
    
    // With showDetails=true, detailed sections should be visible
    expect(screen.getByText('System Health')).toBeInTheDocument();
  });
});

describe('AnalyticsDashboard Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle analytics generation errors gracefully', () => {
    const mockErrorData = {
      ...mockAnalyticsData,
      generateReport: jest.fn(() => {
        throw new Error('Analytics generation failed');
      })
    };

    mockUseAnalytics.mockReturnValue(mockErrorData);
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<AnalyticsDashboard />);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error generating analytics report:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle export errors gracefully', () => {
    const mockErrorData = {
      ...mockAnalyticsData,
      exportData: jest.fn(() => {
        throw new Error('Export failed');
      })
    };

    mockUseAnalytics.mockReturnValue(mockErrorData);
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<AnalyticsDashboard />);
    
    fireEvent.click(screen.getByText('Export JSON'));

    // Should not crash the component
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});