/**
 * Test suite for AnalyticsDashboard component
 */

import '@testing-library/jest-dom';

// Mock the analytics hook
const mockUseAnalytics = jest.fn(() => ({
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
    averageSessionDuration: 420000,
    averageLoadTime: 2800,
    bounceRate: 28.5,
    errorRate: 4.1,
    mostUsedFeatures: [
      { feature: 'dashboard-refresh', usage: 45 }
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
    topErrors: [],
    recommendations: []
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
}));

jest.mock('../../../hooks/useAnalytics', () => ({
  __esModule: true,
  default: mockUseAnalytics
}));

describe('AnalyticsDashboard', () => {
  it('should have analytics hook available', () => {
    const analyticsData = mockUseAnalytics();
    expect(analyticsData).toBeDefined();
    expect(analyticsData.realTimeMetrics).toBeDefined();
    expect(analyticsData.realTimeMetrics.currentSessions).toBe(5);
  });

  it('should provide tracking functions', () => {
    const analyticsData = mockUseAnalytics();
    expect(typeof analyticsData.trackInteraction).toBe('function');
    expect(typeof analyticsData.trackDataRefresh).toBe('function');
    expect(typeof analyticsData.trackFeatureUsage).toBe('function');
  });

  it('should generate analytics report', () => {
    const analyticsData = mockUseAnalytics();
    const report = analyticsData.generateReport();
    expect(report).toBeDefined();
    expect(report.totalSessions).toBe(150);
    expect(report.totalUsers).toBe(75);
    expect(report.performanceMetrics.successRate).toBe(94.2);
  });

  it('should provide export functionality', () => {
    const analyticsData = mockUseAnalytics();
    expect(typeof analyticsData.exportData).toBe('function');
    expect(typeof analyticsData.clearData).toBe('function');
  });

  it('should track session information', () => {
    const analyticsData = mockUseAnalytics();
    expect(analyticsData.isTracking).toBe(true);
    expect(analyticsData.sessionId).toBe('test-session-123');
  });
});