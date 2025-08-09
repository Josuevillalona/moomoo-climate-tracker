/**
 * Test suite for user analytics system
 */

import { userAnalytics, UserInteractionType, RefreshType } from '../userAnalytics';

// Mock errorLogger
jest.mock('../../monitoring/errorLogger', () => ({
  errorLogger: {
    logPerformanceError: jest.fn(),
    logError: jest.fn()
  }
}));

// Mock performanceMonitor
jest.mock('../../monitoring/performanceMonitor', () => ({
  performanceMonitor: {
    trackOperation: jest.fn(),
    recordMetric: jest.fn(),
    measureSync: jest.fn((fn, name, category, metadata) => {
      // Just execute the function if provided
      if (typeof fn === 'function') {
        return fn();
      }
    })
  },
  PerformanceCategory: {
    API_CALL: 'api_call',
    DATABASE_QUERY: 'database_query',
    REALTIME_CONNECTION: 'realtime_connection',
    UI_RENDER: 'ui_render',
    DATA_TRANSFORMATION: 'data_transformation',
    CACHE_OPERATION: 'cache_operation',
    NETWORK_REQUEST: 'network_request'
  }
}));

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => [])
};

// Mock navigator
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  connection: {
    effectiveType: '4g'
  }
};

// Mock document
const mockDocument = {
  readyState: 'complete',
  referrer: 'https://example.com',
  title: 'Test Dashboard',
  hidden: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock window
const mockWindow = {
  location: {
    pathname: '/dashboard'
  },
  screen: {
    width: 1920,
    height: 1080
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  scrollY: 0,
  scrollX: 0
};

// Setup global mocks
global.performance = mockPerformance as any;
global.navigator = mockNavigator as any;
global.document = mockDocument as any;
global.window = mockWindow as any;

describe('UserAnalytics', () => {
  beforeEach(() => {
    // Clear all analytics data before each test
    userAnalytics.clearData();
    jest.clearAllMocks();
  });

  describe('Dashboard Load Tracking', () => {
    it('should track dashboard load metrics', () => {
      const loadMetrics = {
        totalLoadTime: 2500,
        timeToFirstByte: 200,
        domContentLoaded: 1500,
        firstContentfulPaint: 1800,
        apiCallsCount: 3,
        errorCount: 0,
        cacheHitRate: 75
      };

      userAnalytics.trackDashboardLoad(loadMetrics);

      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.averageLoadTime).toBe(2500);
      expect(report.performanceMetrics.cacheHitRate).toBe(0); // No cache data in load metrics
    });

    it('should log slow dashboard loads', () => {
      const { errorLogger } = require('../../monitoring/errorLogger');
      const logPerformanceErrorSpy = jest.spyOn(errorLogger, 'logPerformanceError');

      userAnalytics.trackDashboardLoad({
        totalLoadTime: 6000 // Slow load that exceeds threshold (5000ms)
      });

      // Should trigger slow load warning through errorLogger
      expect(logPerformanceErrorSpy).toHaveBeenCalledWith(
        'Slow Dashboard Load',
        6000,
        5000, // SLOW_LOAD_THRESHOLD
        expect.objectContaining({
          loadMetric: expect.any(Object),
          isThrottled: true,
          timeSinceLastLog: expect.any(Number)
        })
      );
      
      logPerformanceErrorSpy.mockRestore();
    });
  });

  describe('User Interaction Tracking', () => {
    it('should track user interactions', () => {
      userAnalytics.trackInteraction(
        UserInteractionType.CLICK,
        'refresh-button',
        { section: 'header' }
      );

      userAnalytics.trackInteraction(
        UserInteractionType.SEARCH,
        'search-input',
        { query: 'climate tech', results: 25 }
      );

      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.userEngagement.averageInteractionsPerSession).toBe(2);
    });

    it('should track feature usage', () => {
      userAnalytics.trackFeatureUsage('dashboard-refresh', { source: 'header' });
      userAnalytics.trackFeatureUsage('export-data', { format: 'csv' });

      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.mostUsedFeatures).toHaveLength(2);
      expect(report.mostUsedFeatures[0].feature).toBe('dashboard-refresh');
    });

    it('should track search operations', () => {
      userAnalytics.trackSearch('renewable energy', 42, 150);

      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.userEngagement.averageInteractionsPerSession).toBe(1);
    });

    it('should track filter operations', () => {
      userAnalytics.trackFilter('sector', 'renewable-energy', 15);
      userAnalytics.trackFilter('stage', 'series-a', 8);

      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.userEngagement.averageInteractionsPerSession).toBe(2);
    });

    it('should track export operations', () => {
      userAnalytics.trackExport('csv', 100, 500);

      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      // Export creates an interaction, not a feature usage
      expect(report.userEngagement.averageInteractionsPerSession).toBe(1);
    });
  });

  describe('Data Refresh Tracking', () => {
    it('should track successful data refreshes', () => {
      userAnalytics.trackDataRefresh(
        RefreshType.MANUAL,
        'dashboard-metrics',
        1200,
        true,
        {
          recordsUpdated: 50,
          userInitiated: true,
          cacheUsed: false
        }
      );

      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.performanceMetrics.successRate).toBe(100);
      expect(report.performanceMetrics.averageApiResponseTime).toBe(1200);
    });

    it('should track failed data refreshes', () => {
      userAnalytics.trackDataRefresh(
        RefreshType.AUTO,
        'recent-deals',
        2000,
        false,
        {
          errorMessage: 'Network timeout',
          userInitiated: false
        }
      );

      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.performanceMetrics.successRate).toBe(0);
      expect(report.errorRate).toBeGreaterThan(0);
    });

    it('should track real-time updates', () => {
      userAnalytics.trackDataRefresh(
        RefreshType.REALTIME,
        'new-deal',
        0,
        true,
        {
          recordsUpdated: 1,
          backgroundRefresh: true,
          userInitiated: false
        }
      );

      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.performanceMetrics.successRate).toBe(100);
    });

    it('should calculate cache hit rate correctly', () => {
      // Track multiple refreshes with different cache usage
      userAnalytics.trackDataRefresh(RefreshType.MANUAL, 'data1', 100, true, { cacheUsed: true });
      userAnalytics.trackDataRefresh(RefreshType.MANUAL, 'data2', 200, true, { cacheUsed: true });
      userAnalytics.trackDataRefresh(RefreshType.MANUAL, 'data3', 300, true, { cacheUsed: false });
      userAnalytics.trackDataRefresh(RefreshType.MANUAL, 'data4', 400, true, { cacheUsed: false });

      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.performanceMetrics.cacheHitRate).toBe(50); // 2 out of 4 used cache
    });
  });

  describe('Analytics Reports', () => {
    beforeEach(() => {
      // Set up test data
      userAnalytics.trackDashboardLoad({ totalLoadTime: 2000 });
      userAnalytics.trackDashboardLoad({ totalLoadTime: 3000 });
      
      userAnalytics.trackInteraction(UserInteractionType.CLICK, 'button1');
      userAnalytics.trackInteraction(UserInteractionType.CLICK, 'button2');
      userAnalytics.trackInteraction(UserInteractionType.SEARCH, 'search');
      
      userAnalytics.trackDataRefresh(RefreshType.MANUAL, 'api1', 1000, true);
      userAnalytics.trackDataRefresh(RefreshType.AUTO, 'api2', 1500, false);
      
      userAnalytics.trackFeatureUsage('feature1');
      userAnalytics.trackFeatureUsage('feature1'); // Used twice
      userAnalytics.trackFeatureUsage('feature2');
    });

    it('should generate comprehensive analytics report', () => {
      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.totalSessions).toBe(1);
      expect(report.averageLoadTime).toBe(2500); // Average of 2000 and 3000
      expect(report.performanceMetrics.successRate).toBe(50); // 1 success, 1 failure
      expect(report.userEngagement.averageInteractionsPerSession).toBe(6); // 3 interactions + 3 feature usages
      expect(report.mostUsedFeatures[0].feature).toBe('feature1');
      expect(report.mostUsedFeatures[0].usage).toBe(2);
    });

    it('should filter report by time range', () => {
      const futureTime = new Date(Date.now() + 60000);
      const report = userAnalytics.getAnalyticsReport({
        start: futureTime,
        end: new Date(futureTime.getTime() + 60000)
      });

      expect(report.totalSessions).toBe(0);
      expect(report.averageLoadTime).toBe(0);
    });

    it('should generate recommendations based on metrics', () => {
      // Add slow load times to trigger recommendations
      userAnalytics.trackDashboardLoad({ totalLoadTime: 5000 });
      userAnalytics.trackDashboardLoad({ totalLoadTime: 6000 });

      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.recommendations).toContainEqual(
        expect.stringContaining('optimizing dashboard load times')
      );
    });
  });

  describe('Real-time Metrics', () => {
    it('should provide real-time metrics', () => {
      userAnalytics.trackDashboardLoad({ totalLoadTime: 1500 });
      userAnalytics.trackDataRefresh(RefreshType.MANUAL, 'test', 800, true);
      userAnalytics.trackInteraction(UserInteractionType.CLICK, 'button');

      const metrics = userAnalytics.getRealTimeMetrics();

      expect(metrics.currentSessions).toBe(1);
      expect(metrics.averageLoadTime).toBe(1500);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.refreshRate).toBe(1);
      expect(metrics.userActivity).toBe(1);
    });
  });

  describe('Data Export', () => {
    beforeEach(() => {
      userAnalytics.trackInteraction(UserInteractionType.CLICK, 'test-button');
      userAnalytics.trackDashboardLoad({ totalLoadTime: 2000 });
      userAnalytics.trackDataRefresh(RefreshType.MANUAL, 'test-api', 1000, true);
    });

    it('should export data as JSON', () => {
      const jsonData = userAnalytics.exportData('json');
      const parsed = JSON.parse(jsonData);

      expect(parsed).toHaveProperty('interactions');
      expect(parsed).toHaveProperty('loadMetrics');
      expect(parsed).toHaveProperty('refreshMetrics');
      expect(parsed).toHaveProperty('sessions');
      expect(parsed.interactions).toHaveLength(1);
      expect(parsed.loadMetrics).toHaveLength(1);
      expect(parsed.refreshMetrics).toHaveLength(1);
    });

    it('should export data as CSV', () => {
      const csvData = userAnalytics.exportData('csv');
      
      expect(csvData).toContain('timestamp,type,category,value,metadata');
      expect(csvData).toContain('interaction');
      expect(csvData).toContain('load_metric');
    });
  });

  describe('Session Management', () => {
    it('should track session metrics', () => {
      userAnalytics.trackPageView('/dashboard');
      userAnalytics.trackInteraction(UserInteractionType.CLICK, 'button1');
      userAnalytics.trackInteraction(UserInteractionType.CLICK, 'button2');
      userAnalytics.trackFeatureUsage('feature1');

      userAnalytics.endSession();

      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.totalSessions).toBe(1);
      expect(report.userEngagement.averagePageViewsPerSession).toBe(1);
      expect(report.userEngagement.averageInteractionsPerSession).toBe(4); // 1 page view + 2 clicks + 1 feature usage
    });

    it('should calculate engagement score', () => {
      // High engagement session
      for (let i = 0; i < 10; i++) {
        userAnalytics.trackInteraction(UserInteractionType.CLICK, `button${i}`);
      }
      userAnalytics.trackPageView('/dashboard');
      userAnalytics.trackPageView('/search');
      userAnalytics.trackFeatureUsage('feature1');
      userAnalytics.trackFeatureUsage('feature2');

      userAnalytics.endSession();

      // The engagement score should be calculated based on interactions, page views, and features used
      // This is tested indirectly through the session metrics
      const report = userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });

      expect(report.userEngagement.averageInteractionsPerSession).toBe(14); // 10 clicks + 2 page views + 2 feature usages
    });
  });

  describe('Event Listeners', () => {
    it('should allow subscribing to analytics events', () => {
      const listener = jest.fn();
      const unsubscribe = userAnalytics.subscribe(listener);

      userAnalytics.trackInteraction(UserInteractionType.CLICK, 'test-button');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'userInteraction',
          data: expect.objectContaining({
            type: UserInteractionType.CLICK,
            element: 'test-button'
          })
        })
      );

      unsubscribe();
      userAnalytics.trackInteraction(UserInteractionType.CLICK, 'test-button2');

      // Should not be called after unsubscribe
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Storage Management', () => {
    it('should trim storage when exceeding max size', () => {
      const originalMaxSize = userAnalytics['maxStorageSize'];
      userAnalytics['maxStorageSize'] = 5; // Set small limit for testing

      // Add more interactions than the limit
      for (let i = 0; i < 10; i++) {
        userAnalytics.trackInteraction(UserInteractionType.CLICK, `button${i}`);
      }

      const interactions = userAnalytics['interactions'];
      expect(interactions.length).toBe(5); // Should be trimmed to max size

      // Restore original max size
      userAnalytics['maxStorageSize'] = originalMaxSize;
    });
  });
});

describe('Analytics Integration', () => {
  it('should work with performance monitor integration', () => {
    // This test verifies that analytics integrates properly with the performance monitor
    userAnalytics.trackDataRefresh(RefreshType.MANUAL, 'test-operation', 1500, true);

    // The performance monitor integration should work without throwing errors
    expect(() => userAnalytics.trackDataRefresh(RefreshType.MANUAL, 'test-operation', 1500, true)).not.toThrow();
  });

  it('should handle errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    // Test with invalid data
    userAnalytics.trackDashboardLoad({
      totalLoadTime: NaN,
      errorCount: -1
    });

    // Should not throw errors
    expect(() => {
      userAnalytics.getAnalyticsReport({
        start: new Date(Date.now() - 60000),
        end: new Date()
      });
    }).not.toThrow();

    consoleSpy.mockRestore();
  });
});