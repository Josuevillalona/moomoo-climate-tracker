/**
 * Test suite for useAnalytics hook
 */

import { renderHook, act } from '@testing-library/react';
import useAnalytics, { useDashboardAnalytics, usePerformanceAnalytics } from '../useAnalytics';
import { UserInteractionType, RefreshType } from '../../lib/analytics/userAnalytics';

// Mock the analytics module
jest.mock('../../lib/analytics/userAnalytics', () => ({
  userAnalytics: {
    trackInteraction: jest.fn(),
    trackDataRefresh: jest.fn(),
    trackFeatureUsage: jest.fn(),
    trackSearch: jest.fn(),
    trackFilter: jest.fn(),
    trackExport: jest.fn(),
    trackPageView: jest.fn(),
    trackDashboardLoad: jest.fn(),
    getRealTimeMetrics: jest.fn(() => ({
      currentSessions: 1,
      averageLoadTime: 2000,
      errorRate: 5,
      refreshRate: 3,
      userActivity: 10
    })),
    getAnalyticsReport: jest.fn(() => ({
      timeRange: { start: new Date(), end: new Date() },
      totalSessions: 5,
      totalUsers: 3,
      averageSessionDuration: 300000,
      averageLoadTime: 2500,
      bounceRate: 25,
      errorRate: 2,
      mostUsedFeatures: [
        { feature: 'dashboard-refresh', usage: 15 },
        { feature: 'search', usage: 10 }
      ],
      performanceMetrics: {
        averageApiResponseTime: 1200,
        cacheHitRate: 75,
        successRate: 95,
        p95LoadTime: 3000
      },
      userEngagement: {
        averageInteractionsPerSession: 8,
        averagePageViewsPerSession: 2.5,
        returnUserRate: 40
      },
      topErrors: [],
      recommendations: []
    })),
    exportData: jest.fn(() => '{"test": "data"}'),
    clearData: jest.fn(),
    endSession: jest.fn(),
    currentSessionId: 'test-session-123'
  },
  UserInteractionType: {
    CLICK: 'click',
    SEARCH: 'search',
    FILTER: 'filter',
    EXPORT: 'export',
    VIEW: 'view',
    SCROLL: 'scroll',
    NAVIGATION: 'navigation',
    REFRESH: 'refresh',
    HOVER: 'hover',
    FOCUS: 'focus',
    RESIZE: 'resize'
  },
  RefreshType: {
    MANUAL: 'manual',
    AUTO: 'auto',
    REALTIME: 'realtime',
    BACKGROUND: 'background',
    RETRY: 'retry'
  }
}));

// Mock DOM APIs
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

// Mock window properties
delete (window as any).location;
(window as any).location = {
  pathname: '/dashboard'
};

Object.defineProperty(document, 'referrer', {
  value: 'https://example.com'
});

Object.defineProperty(document, 'title', {
  value: 'Test Dashboard'
});

Object.defineProperty(document, 'readyState', {
  value: 'complete'
});

describe('useAnalytics', () => {
  const mockAnalytics = require('../../lib/analytics/userAnalytics').userAnalytics;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default options', () => {
    const { result } = renderHook(() => useAnalytics());

    expect(result.current.isTracking).toBe(true);
    expect(result.current.sessionId).toBe('test-session-123');
    expect(result.current.realTimeMetrics).toEqual({
      currentSessions: 1,
      averageLoadTime: 2000,
      errorRate: 5,
      refreshRate: 3,
      userActivity: 10
    });
  });

  it('should track page view on mount when enabled', () => {
    renderHook(() => useAnalytics({ trackPageViews: true }));

    expect(mockAnalytics.trackPageView).toHaveBeenCalledWith('/dashboard', {
      referrer: 'https://example.com',
      title: 'Test Dashboard'
    });
  });

  it('should not track page view when disabled', () => {
    renderHook(() => useAnalytics({ trackPageViews: false }));

    expect(mockAnalytics.trackPageView).not.toHaveBeenCalled();
  });

  it('should provide tracking functions', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackInteraction(UserInteractionType.CLICK, 'test-button', { test: 'data' });
    });

    expect(mockAnalytics.trackInteraction).toHaveBeenCalledWith(
      UserInteractionType.CLICK,
      'test-button',
      { test: 'data' }
    );
  });

  it('should track data refresh', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackDataRefresh(RefreshType.MANUAL, 'test-api', 1500, true, { test: 'options' });
    });

    expect(mockAnalytics.trackDataRefresh).toHaveBeenCalledWith(
      RefreshType.MANUAL,
      'test-api',
      1500,
      true,
      { test: 'options' }
    );
  });

  it('should track feature usage', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackFeatureUsage('test-feature', { context: 'test' });
    });

    expect(mockAnalytics.trackFeatureUsage).toHaveBeenCalledWith('test-feature', { context: 'test' });
  });

  it('should track search operations', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackSearch('climate tech', 25, 300);
    });

    expect(mockAnalytics.trackSearch).toHaveBeenCalledWith('climate tech', 25, 300);
  });

  it('should track filter operations', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackFilter('sector', 'renewable-energy', 15);
    });

    expect(mockAnalytics.trackFilter).toHaveBeenCalledWith('sector', 'renewable-energy', 15);
  });

  it('should track export operations', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackExport('csv', 100, 500);
    });

    expect(mockAnalytics.trackExport).toHaveBeenCalledWith('csv', 100, 500);
  });

  it('should generate analytics report', () => {
    const { result } = renderHook(() => useAnalytics());
    const timeRange = { start: new Date(), end: new Date() };

    const report = result.current.generateReport(timeRange);

    expect(mockAnalytics.getAnalyticsReport).toHaveBeenCalledWith(timeRange);
    expect(report.totalSessions).toBe(5);
  });

  it('should export data and trigger download', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.exportData('json');
    });

    expect(mockAnalytics.exportData).toHaveBeenCalledWith('json');
    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockCreateElement).toHaveBeenCalledWith('a');
  });

  it('should clear analytics data', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.clearData();
    });

    expect(mockAnalytics.clearData).toHaveBeenCalled();
  });

  it('should not track when tracking is disabled', () => {
    const { result, rerender } = renderHook(
      ({ isTracking }) => useAnalytics(),
      { initialProps: { isTracking: true } }
    );

    // Manually set tracking to false (simulating user preference)
    act(() => {
      (result.current as any).isTracking = false;
    });

    act(() => {
      result.current.trackInteraction(UserInteractionType.CLICK, 'test-button');
    });

    // Should not call the underlying analytics function when tracking is disabled
    expect(mockAnalytics.trackInteraction).not.toHaveBeenCalled();
  });
});

describe('useDashboardAnalytics', () => {
  const mockAnalytics = require('../../lib/analytics/userAnalytics').userAnalytics;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide dashboard-specific tracking functions', () => {
    const { result } = renderHook(() => useDashboardAnalytics());

    expect(result.current.startOperation).toBeDefined();
    expect(result.current.endOperation).toBeDefined();
    expect(result.current.trackDashboardInteraction).toBeDefined();
    expect(result.current.trackDashboardLoad).toBeDefined();
  });

  it('should track dashboard operations with timing', () => {
    const { result } = renderHook(() => useDashboardAnalytics());

    act(() => {
      result.current.startOperation('test-operation');
    });

    // Simulate some time passing
    jest.advanceTimersByTime(1000);

    act(() => {
      result.current.endOperation('test-operation', true, { test: 'metadata' });
    });

    expect(mockAnalytics.trackDataRefresh).toHaveBeenCalledWith(
      RefreshType.MANUAL,
      'test-operation',
      expect.any(Number),
      true,
      { test: 'metadata' }
    );
  });

  it('should track dashboard interactions with page context', () => {
    const { result } = renderHook(() => useDashboardAnalytics());

    act(() => {
      result.current.trackDashboardInteraction('refresh-button', { section: 'header' });
    });

    expect(mockAnalytics.trackInteraction).toHaveBeenCalledWith(
      UserInteractionType.CLICK,
      'refresh-button',
      {
        section: 'header',
        page: 'dashboard'
      }
    );
  });

  it('should track dashboard load metrics', () => {
    const { result } = renderHook(() => useDashboardAnalytics());
    const loadMetrics = {
      totalLoadTime: 2500,
      apiCallsCount: 3,
      errorCount: 0
    };

    act(() => {
      result.current.trackDashboardLoad(loadMetrics);
    });

    expect(mockAnalytics.trackDashboardLoad).toHaveBeenCalledWith(loadMetrics);
  });
});

describe('usePerformanceAnalytics', () => {
  const mockAnalytics = require('../../lib/analytics/userAnalytics').userAnalytics;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default performance metrics', () => {
    const { result } = renderHook(() => usePerformanceAnalytics());

    expect(result.current.performanceMetrics).toEqual({
      loadTime: 0,
      renderTime: 0,
      apiResponseTime: 0,
      errorCount: 0
    });
  });

  it('should measure async operations', async () => {
    const { result } = renderHook(() => usePerformanceAnalytics());
    const mockOperation = jest.fn().mockResolvedValue('success');

    await act(async () => {
      const operationResult = await result.current.measureOperation(mockOperation, 'test-operation');
      expect(operationResult).toBe('success');
    });

    expect(mockOperation).toHaveBeenCalled();
    expect(mockAnalytics.trackDataRefresh).toHaveBeenCalledWith(
      RefreshType.MANUAL,
      'test-operation',
      expect.any(Number),
      true
    );
    expect(result.current.performanceMetrics.apiResponseTime).toBeGreaterThan(0);
  });

  it('should handle operation errors', async () => {
    const { result } = renderHook(() => usePerformanceAnalytics());
    const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));

    await act(async () => {
      try {
        await result.current.measureOperation(mockOperation, 'failing-operation');
      } catch (error) {
        expect(error.message).toBe('Test error');
      }
    });

    expect(mockAnalytics.trackDataRefresh).toHaveBeenCalledWith(
      RefreshType.MANUAL,
      'failing-operation',
      expect.any(Number),
      false,
      { error: 'Test error' }
    );
    expect(result.current.performanceMetrics.errorCount).toBe(1);
  });

  it('should measure render operations', () => {
    const { result } = renderHook(() => usePerformanceAnalytics());
    const mockRenderFunction = jest.fn().mockReturnValue('rendered');

    act(() => {
      const renderResult = result.current.measureRender(mockRenderFunction, 'test-component');
      expect(renderResult).toBe('rendered');
    });

    expect(mockRenderFunction).toHaveBeenCalled();
    expect(mockAnalytics.trackInteraction).toHaveBeenCalledWith(
      UserInteractionType.VIEW,
      'test-component',
      { renderTime: expect.any(Number) }
    );
    expect(result.current.performanceMetrics.renderTime).toBeGreaterThan(0);
  });
});

describe('Analytics Hook Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should update real-time metrics periodically', () => {
    const { result } = renderHook(() => useAnalytics());

    // Initial metrics
    expect(result.current.realTimeMetrics.currentSessions).toBe(1);

    // Advance time to trigger interval
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Should have called getRealTimeMetrics again
    expect(require('../../lib/analytics/userAnalytics').userAnalytics.getRealTimeMetrics).toHaveBeenCalledTimes(2);
  });

  it('should handle auto-load tracking', () => {
    const mockAddEventListener = jest.fn();
    const mockRemoveEventListener = jest.fn();
    
    Object.defineProperty(window, 'addEventListener', {
      value: mockAddEventListener
    });
    
    Object.defineProperty(window, 'removeEventListener', {
      value: mockRemoveEventListener
    });

    const { unmount } = renderHook(() => useAnalytics({ autoTrackLoadTime: true }));

    // Should set up load event listener when document is not complete
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true
    });

    renderHook(() => useAnalytics({ autoTrackLoadTime: true }));

    expect(mockAddEventListener).toHaveBeenCalledWith('load', expect.any(Function));

    unmount();
  });
});