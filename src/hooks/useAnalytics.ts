/**
 * React hook for user analytics and performance metrics
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  userAnalytics, 
  UserInteractionType, 
  RefreshType, 
  AnalyticsReport,
  DashboardLoadMetrics,
  DataRefreshMetrics,
  UserInteraction
} from '../lib/analytics/userAnalytics';

export interface UseAnalyticsOptions {
  trackPageViews?: boolean;
  trackClicks?: boolean;
  trackScrolling?: boolean;
  autoTrackLoadTime?: boolean;
  sessionTimeout?: number; // in milliseconds
}

export interface UseAnalyticsReturn {
  // Tracking functions
  trackInteraction: (type: UserInteractionType, element: string, metadata?: Record<string, any>) => void;
  trackDataRefresh: (type: RefreshType, dataSource: string, duration: number, success: boolean, options?: any) => void;
  trackFeatureUsage: (feature: string, metadata?: Record<string, any>) => void;
  trackSearch: (query: string, results: number, duration: number) => void;
  trackFilter: (filterType: string, filterValue: string, results: number) => void;
  trackExport: (format: string, recordCount: number, duration: number) => void;
  
  // Analytics data
  realTimeMetrics: {
    currentSessions: number;
    averageLoadTime: number;
    errorRate: number;
    refreshRate: number;
    userActivity: number;
  };
  
  // Report generation
  generateReport: (timeRange: { start: Date; end: Date }) => AnalyticsReport;
  exportData: (format: 'json' | 'csv') => void;
  clearData: () => void;
  
  // State
  isTracking: boolean;
  sessionId: string;
}

const DEFAULT_OPTIONS: Required<UseAnalyticsOptions> = {
  trackPageViews: true,
  trackClicks: true,
  trackScrolling: true,
  autoTrackLoadTime: true,
  sessionTimeout: 30 * 60 * 1000 // 30 minutes
};

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [isTracking, setIsTracking] = useState(true);
  const [sessionId] = useState(() => userAnalytics['currentSessionId']);
  const [realTimeMetrics, setRealTimeMetrics] = useState(() => userAnalytics.getRealTimeMetrics());
  const loadStartTime = useRef<number>(Date.now());
  const pageLoadTracked = useRef<boolean>(false);

  // Update real-time metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isTracking) {
        setRealTimeMetrics(userAnalytics.getRealTimeMetrics());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isTracking]);

  // Track page load time automatically
  useEffect(() => {
    if (opts.autoTrackLoadTime && !pageLoadTracked.current) {
      const trackLoadTime = () => {
        const loadTime = Date.now() - loadStartTime.current;
        userAnalytics.trackDashboardLoad({
          totalLoadTime: loadTime,
          timestamp: new Date(),
          sessionId
        });
        pageLoadTracked.current = true;
      };

      if (document.readyState === 'complete') {
        trackLoadTime();
      } else {
        window.addEventListener('load', trackLoadTime);
        return () => window.removeEventListener('load', trackLoadTime);
      }
    }
  }, [opts.autoTrackLoadTime, sessionId]);

  // Track page view on mount
  useEffect(() => {
    if (opts.trackPageViews && isTracking) {
      userAnalytics.trackPageView(window.location.pathname, {
        referrer: document.referrer,
        title: document.title
      });
    }
  }, [opts.trackPageViews, isTracking]);

  // Tracking functions
  const trackInteraction = useCallback((
    type: UserInteractionType, 
    element: string, 
    metadata?: Record<string, any>
  ) => {
    if (isTracking) {
      userAnalytics.trackInteraction(type, element, metadata);
    }
  }, [isTracking]);

  const trackDataRefresh = useCallback((
    type: RefreshType,
    dataSource: string,
    duration: number,
    success: boolean,
    options?: any
  ) => {
    if (isTracking) {
      userAnalytics.trackDataRefresh(type, dataSource, duration, success, options);
    }
  }, [isTracking]);

  const trackFeatureUsage = useCallback((feature: string, metadata?: Record<string, any>) => {
    if (isTracking) {
      userAnalytics.trackFeatureUsage(feature, metadata);
    }
  }, [isTracking]);

  const trackSearch = useCallback((query: string, results: number, duration: number) => {
    if (isTracking) {
      userAnalytics.trackSearch(query, results, duration);
    }
  }, [isTracking]);

  const trackFilter = useCallback((filterType: string, filterValue: string, results: number) => {
    if (isTracking) {
      userAnalytics.trackFilter(filterType, filterValue, results);
    }
  }, [isTracking]);

  const trackExport = useCallback((format: string, recordCount: number, duration: number) => {
    if (isTracking) {
      userAnalytics.trackExport(format, recordCount, duration);
    }
  }, [isTracking]);

  // Report generation
  const generateReport = useCallback((timeRange: { start: Date; end: Date }) => {
    return userAnalytics.getAnalyticsReport(timeRange);
  }, []);

  const exportData = useCallback((format: 'json' | 'csv') => {
    const data = userAnalytics.exportData(format);
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const clearData = useCallback(() => {
    userAnalytics.clearData();
    setRealTimeMetrics(userAnalytics.getRealTimeMetrics());
  }, []);

  return {
    trackInteraction,
    trackDataRefresh,
    trackFeatureUsage,
    trackSearch,
    trackFilter,
    trackExport,
    realTimeMetrics,
    generateReport,
    exportData,
    clearData,
    isTracking,
    sessionId
  };
}

// Hook for tracking specific dashboard operations
export function useDashboardAnalytics() {
  const analytics = useAnalytics();
  const operationStartTimes = useRef<Map<string, number>>(new Map());

  const startOperation = useCallback((operationName: string) => {
    operationStartTimes.current.set(operationName, Date.now());
  }, []);

  const endOperation = useCallback((
    operationName: string, 
    success: boolean, 
    metadata?: Record<string, any>
  ) => {
    const startTime = operationStartTimes.current.get(operationName);
    if (startTime) {
      const duration = Date.now() - startTime;
      analytics.trackDataRefresh(
        RefreshType.MANUAL,
        operationName,
        duration,
        success,
        metadata
      );
      operationStartTimes.current.delete(operationName);
    }
  }, [analytics]);

  const trackDashboardInteraction = useCallback((element: string, metadata?: Record<string, any>) => {
    analytics.trackInteraction(UserInteractionType.CLICK, element, {
      ...metadata,
      page: 'dashboard'
    });
  }, [analytics]);

  const trackDashboardLoad = useCallback((loadMetrics: Partial<DashboardLoadMetrics>) => {
    userAnalytics.trackDashboardLoad(loadMetrics);
  }, []);

  return {
    ...analytics,
    startOperation,
    endOperation,
    trackDashboardInteraction,
    trackDashboardLoad
  };
}

// Hook for performance monitoring
export function usePerformanceAnalytics() {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    apiResponseTime: 0,
    errorCount: 0
  });

  const measureOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      userAnalytics.trackDataRefresh(
        RefreshType.MANUAL,
        operationName,
        duration,
        true
      );

      setPerformanceMetrics(prev => ({
        ...prev,
        apiResponseTime: duration
      }));

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      userAnalytics.trackDataRefresh(
        RefreshType.MANUAL,
        operationName,
        duration,
        false,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );

      setPerformanceMetrics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }));

      throw error;
    }
  }, []);

  const measureRender = useCallback(<T>(
    renderFunction: () => T,
    componentName: string
  ): T => {
    const startTime = Date.now();
    const result = renderFunction();
    const duration = Date.now() - startTime;

    userAnalytics.trackInteraction(
      UserInteractionType.VIEW,
      componentName,
      { renderTime: duration }
    );

    setPerformanceMetrics(prev => ({
      ...prev,
      renderTime: duration
    }));

    return result;
  }, []);

  return {
    performanceMetrics,
    measureOperation,
    measureRender
  };
}

export default useAnalytics;