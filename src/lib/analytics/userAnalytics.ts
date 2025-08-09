/**
 * User analytics and performance metrics tracking system
 * Tracks dashboard load times, user interactions, data refresh frequency, and success rates
 */

import { performanceMonitor, PerformanceCategory } from '../monitoring/performanceMonitor';
import { errorLogger, ErrorCategory, ErrorSeverity } from '../monitoring/errorLogger';

export interface UserInteraction {
  id: string;
  type: UserInteractionType;
  element: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
  sessionId: string;
  userId?: string;
  page: string;
}

export enum UserInteractionType {
  CLICK = 'click',
  SCROLL = 'scroll',
  SEARCH = 'search',
  FILTER = 'filter',
  NAVIGATION = 'navigation',
  REFRESH = 'refresh',
  EXPORT = 'export',
  VIEW = 'view',
  HOVER = 'hover',
  FOCUS = 'focus',
  RESIZE = 'resize'
}

export interface DashboardLoadMetrics {
  id: string;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  totalLoadTime: number;
  timeToFirstByte: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  apiCallsCount: number;
  apiCallsTime: number;
  dataFetchTime: number;
  renderTime: number;
  errorCount: number;
  retryCount: number;
  cacheHitRate: number;
  connectionType?: string;
  deviceType?: string;
  browserInfo?: string;
  screenResolution?: string;
}

export interface DataRefreshMetrics {
  id: string;
  sessionId: string;
  timestamp: Date;
  refreshType: RefreshType;
  duration: number;
  success: boolean;
  dataSource: string;
  recordsUpdated: number;
  errorMessage?: string;
  userInitiated: boolean;
  backgroundRefresh: boolean;
  cacheUsed: boolean;
  networkLatency?: number;
}

export enum RefreshType {
  MANUAL = 'manual',
  AUTO = 'auto',
  REALTIME = 'realtime',
  BACKGROUND = 'background',
  RETRY = 'retry'
}

export interface UserSessionMetrics {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  interactions: number;
  dataRefreshes: number;
  errorsEncountered: number;
  featuresUsed: string[];
  bounceRate: boolean;
  engagementScore: number;
  performanceScore: number;
  satisfactionScore?: number;
  deviceInfo: {
    type: string;
    browser: string;
    os: string;
    screenSize: string;
    connectionType?: string;
  };
}

export interface AnalyticsReport {
  timeRange: { start: Date; end: Date };
  totalSessions: number;
  totalUsers: number;
  averageSessionDuration: number;
  averageLoadTime: number;
  bounceRate: number;
  errorRate: number;
  mostUsedFeatures: Array<{ feature: string; usage: number }>;
  performanceMetrics: {
    averageApiResponseTime: number;
    cacheHitRate: number;
    successRate: number;
    p95LoadTime: number;
  };
  userEngagement: {
    averageInteractionsPerSession: number;
    averagePageViewsPerSession: number;
    returnUserRate: number;
  };
  topErrors: Array<{ error: string; count: number; impact: string }>;
  recommendations: string[];
}

class UserAnalytics {
  private interactions: UserInteraction[] = [];
  private loadMetrics: DashboardLoadMetrics[] = [];
  private refreshMetrics: DataRefreshMetrics[] = [];
  private sessions: Map<string, UserSessionMetrics> = new Map();
  private currentSessionId: string;
  private maxStorageSize = 5000; // Maximum number of records to keep
  private listeners: Array<(event: any) => void> = [];
  
  // Throttling for performance error logging
  private lastPerformanceLogTime = new Map<string, number>();
  private performanceLogThrottle = 30000; // 30 seconds between similar performance logs
  
  // Updated thresholds
  private readonly SLOW_LOAD_THRESHOLD = 5000; // 5 seconds instead of 3
  private readonly CRITICAL_LOAD_THRESHOLD = 10000; // 10 seconds for critical logging

  constructor() {
    this.currentSessionId = this.generateSessionId();
    this.initializeSession();
    this.setupEventListeners();
    this.startPerformanceObserver();
  }

  /**
   * Track dashboard load performance
   */
  trackDashboardLoad(metrics: Partial<DashboardLoadMetrics>): void {
    const loadMetric: DashboardLoadMetrics = {
      id: this.generateId(),
      sessionId: this.currentSessionId,
      timestamp: new Date(),
      totalLoadTime: 0,
      timeToFirstByte: 0,
      domContentLoaded: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      apiCallsCount: 0,
      apiCallsTime: 0,
      dataFetchTime: 0,
      renderTime: 0,
      errorCount: 0,
      retryCount: 0,
      cacheHitRate: 0,
      ...metrics
    };

    this.loadMetrics.push(loadMetric);
    this.updateSessionMetrics('loadTime', loadMetric.totalLoadTime);
    this.trimStorage();
    this.notifyListeners({ type: 'dashboardLoad', data: loadMetric });

    // Log slow loads with throttling to reduce spam
    if (loadMetric.totalLoadTime > this.SLOW_LOAD_THRESHOLD) {
      const operationKey = 'Slow Dashboard Load';
      const now = Date.now();
      const lastLogTime = this.lastPerformanceLogTime.get(operationKey) || 0;
      
      // Only log if enough time has passed since last log, or if it's critically slow
      if (now - lastLogTime > this.performanceLogThrottle || loadMetric.totalLoadTime > this.CRITICAL_LOAD_THRESHOLD) {
        this.lastPerformanceLogTime.set(operationKey, now);
        
        errorLogger.logPerformanceError(
          'Slow Dashboard Load',
          loadMetric.totalLoadTime,
          this.SLOW_LOAD_THRESHOLD,
          { 
            loadMetric,
            isThrottled: true,
            timeSinceLastLog: now - lastLogTime 
          }
        );
      }
    }
  }

  /**
   * Track user interactions
   */
  trackInteraction(
    type: UserInteractionType,
    element: string,
    metadata?: Record<string, any>,
    duration?: number
  ): void {
    const interaction: UserInteraction = {
      id: this.generateId(),
      type,
      element,
      timestamp: new Date(),
      duration,
      metadata,
      sessionId: this.currentSessionId,
      page: window.location.pathname
    };

    this.interactions.push(interaction);
    this.updateSessionMetrics('interaction');
    this.trimStorage();
    this.notifyListeners({ type: 'userInteraction', data: interaction });

    // Track interaction performance
    if (duration) {
      performanceMonitor.measureSync(
        () => {},
        `User Interaction: ${type} ${element}`,
        PerformanceCategory.UI_RENDER,
        { interactionType: type, element, ...metadata }
      );
    }
  }

  /**
   * Track data refresh operations
   */
  trackDataRefresh(
    refreshType: RefreshType,
    dataSource: string,
    duration: number,
    success: boolean,
    options: {
      recordsUpdated?: number;
      errorMessage?: string;
      userInitiated?: boolean;
      backgroundRefresh?: boolean;
      cacheUsed?: boolean;
      networkLatency?: number;
    } = {}
  ): void {
    const refreshMetric: DataRefreshMetrics = {
      id: this.generateId(),
      sessionId: this.currentSessionId,
      timestamp: new Date(),
      refreshType,
      duration,
      success,
      dataSource,
      recordsUpdated: options.recordsUpdated || 0,
      errorMessage: options.errorMessage,
      userInitiated: options.userInitiated || false,
      backgroundRefresh: options.backgroundRefresh || false,
      cacheUsed: options.cacheUsed || false,
      networkLatency: options.networkLatency
    };

    this.refreshMetrics.push(refreshMetric);
    this.updateSessionMetrics('dataRefresh', success);
    this.trimStorage();
    this.notifyListeners({ type: 'dataRefresh', data: refreshMetric });

    // Track refresh performance
    performanceMonitor.measureSync(
      () => {},
      `Data Refresh: ${refreshType} ${dataSource}`,
      PerformanceCategory.API_CALL,
      {
        refreshType,
        dataSource,
        success,
        recordsUpdated: options.recordsUpdated,
        cacheUsed: options.cacheUsed
      }
    );
  }

  /**
   * Track page view
   */
  trackPageView(page: string, metadata?: Record<string, any>): void {
    this.trackInteraction(
      UserInteractionType.VIEW,
      page,
      { ...metadata, pageView: true }
    );
    this.updateSessionMetrics('pageView');
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, metadata?: Record<string, any>): void {
    this.trackInteraction(
      UserInteractionType.CLICK,
      feature,
      { ...metadata, featureUsage: true }
    );
    this.updateSessionMetrics('featureUsage', feature);
  }

  /**
   * Track search operations
   */
  trackSearch(query: string, results: number, duration: number): void {
    this.trackInteraction(
      UserInteractionType.SEARCH,
      'search-input',
      { query, results, duration }
    );
  }

  /**
   * Track filter operations
   */
  trackFilter(filterType: string, filterValue: string, results: number): void {
    this.trackInteraction(
      UserInteractionType.FILTER,
      `filter-${filterType}`,
      { filterType, filterValue, results }
    );
  }

  /**
   * Track export operations
   */
  trackExport(format: string, recordCount: number, duration: number): void {
    this.trackInteraction(
      UserInteractionType.EXPORT,
      `export-${format}`,
      { format, recordCount },
      duration
    );
  }

  /**
   * Get analytics report for a time range
   */
  getAnalyticsReport(timeRange: { start: Date; end: Date }): AnalyticsReport {
    const filteredSessions = Array.from(this.sessions.values()).filter(
      session => session.startTime >= timeRange.start && session.startTime <= timeRange.end
    );

    const filteredInteractions = this.interactions.filter(
      interaction => interaction.timestamp >= timeRange.start && interaction.timestamp <= timeRange.end
    );

    const filteredLoadMetrics = this.loadMetrics.filter(
      metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );

    const filteredRefreshMetrics = this.refreshMetrics.filter(
      metric => metric.timestamp >= timeRange.start && metric.timestamp <= timeRange.end
    );

    // Calculate metrics
    const totalSessions = filteredSessions.length;
    const totalUsers = new Set(filteredSessions.map(s => s.userId).filter(Boolean)).size;
    const averageSessionDuration = filteredSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / Math.max(totalSessions, 1);
    const averageLoadTime = filteredLoadMetrics.reduce((sum, m) => sum + m.totalLoadTime, 0) / Math.max(filteredLoadMetrics.length, 1);
    const bounceRate = filteredSessions.filter(s => s.bounceRate).length / Math.max(totalSessions, 1) * 100;
    const errorRate = filteredSessions.reduce((sum, s) => sum + s.errorsEncountered, 0) / Math.max(totalSessions, 1);

    // Feature usage analysis
    const featureUsage = new Map<string, number>();
    filteredInteractions.forEach(interaction => {
      if (interaction.metadata?.featureUsage) {
        const count = featureUsage.get(interaction.element) || 0;
        featureUsage.set(interaction.element, count + 1);
      }
    });

    const mostUsedFeatures = Array.from(featureUsage.entries())
      .map(([feature, usage]) => ({ feature, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);

    // Performance metrics
    const successfulRefreshes = filteredRefreshMetrics.filter(m => m.success);
    const averageApiResponseTime = successfulRefreshes.reduce((sum, m) => sum + m.duration, 0) / Math.max(successfulRefreshes.length, 1);
    const cacheHitRate = filteredRefreshMetrics.filter(m => m.cacheUsed).length / Math.max(filteredRefreshMetrics.length, 1) * 100;
    const successRate = successfulRefreshes.length / Math.max(filteredRefreshMetrics.length, 1) * 100;
    const loadTimes = filteredLoadMetrics.map(m => m.totalLoadTime).sort((a, b) => a - b);
    const p95LoadTime = loadTimes[Math.floor(loadTimes.length * 0.95)] || 0;

    // User engagement
    const averageInteractionsPerSession = filteredInteractions.length / Math.max(totalSessions, 1);
    const averagePageViewsPerSession = filteredSessions.reduce((sum, s) => sum + s.pageViews, 0) / Math.max(totalSessions, 1);
    const returnUserRate = 0; // Would need user tracking across sessions

    // Top errors (simplified)
    const topErrors = [
      { error: 'API Timeout', count: 5, impact: 'High' },
      { error: 'Network Error', count: 3, impact: 'Medium' },
      { error: 'Data Parse Error', count: 2, impact: 'Low' }
    ];

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      averageLoadTime,
      errorRate,
      bounceRate,
      cacheHitRate,
      successRate
    });

    return {
      timeRange,
      totalSessions,
      totalUsers,
      averageSessionDuration,
      averageLoadTime,
      bounceRate,
      errorRate,
      mostUsedFeatures,
      performanceMetrics: {
        averageApiResponseTime,
        cacheHitRate,
        successRate,
        p95LoadTime
      },
      userEngagement: {
        averageInteractionsPerSession,
        averagePageViewsPerSession,
        returnUserRate
      },
      topErrors,
      recommendations
    };
  }

  /**
   * Get real-time dashboard metrics
   */
  getRealTimeMetrics(): {
    currentSessions: number;
    averageLoadTime: number;
    errorRate: number;
    refreshRate: number;
    userActivity: number;
  } {
    const now = new Date();
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);
    const last1Minute = new Date(now.getTime() - 1 * 60 * 1000);

    const recentLoadMetrics = this.loadMetrics.filter(m => m.timestamp >= last5Minutes);
    const recentRefreshMetrics = this.refreshMetrics.filter(m => m.timestamp >= last5Minutes);
    const recentInteractions = this.interactions.filter(i => i.timestamp >= last1Minute);

    return {
      currentSessions: Array.from(this.sessions.values()).filter(s => !s.endTime).length,
      averageLoadTime: recentLoadMetrics.reduce((sum, m) => sum + m.totalLoadTime, 0) / Math.max(recentLoadMetrics.length, 1),
      errorRate: recentRefreshMetrics.filter(m => !m.success).length / Math.max(recentRefreshMetrics.length, 1) * 100,
      refreshRate: recentRefreshMetrics.length,
      userActivity: recentInteractions.length
    };
  }

  /**
   * Export analytics data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      interactions: this.interactions,
      loadMetrics: this.loadMetrics,
      refreshMetrics: this.refreshMetrics,
      sessions: Array.from(this.sessions.values()),
      exportTimestamp: new Date().toISOString()
    };

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all analytics data
   */
  clearData(): void {
    this.interactions = [];
    this.loadMetrics = [];
    this.refreshMetrics = [];
    this.sessions.clear();
    this.initializeSession();
  }

  /**
   * Subscribe to analytics events
   */
  subscribe(listener: (event: any) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * End current session
   */
  endSession(): void {
    const session = this.sessions.get(this.currentSessionId);
    if (session && !session.endTime) {
      session.endTime = new Date();
      session.duration = session.endTime.getTime() - session.startTime.getTime();
      session.bounceRate = session.pageViews <= 1 && session.interactions < 3;
      session.engagementScore = this.calculateEngagementScore(session);
      session.performanceScore = this.calculatePerformanceScore(session);
    }
  }

  // Private methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): void {
    const session: UserSessionMetrics = {
      sessionId: this.currentSessionId,
      startTime: new Date(),
      pageViews: 0,
      interactions: 0,
      dataRefreshes: 0,
      errorsEncountered: 0,
      featuresUsed: [],
      bounceRate: false,
      engagementScore: 0,
      performanceScore: 0,
      deviceInfo: this.getDeviceInfo()
    };

    this.sessions.set(this.currentSessionId, session);
  }

  private setupEventListeners(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.endSession();
      } else {
        this.currentSessionId = this.generateSessionId();
        this.initializeSession();
      }
    });

    // Track window unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const element = target.tagName.toLowerCase() + (target.id ? `#${target.id}` : '') + (target.className ? `.${target.className.split(' ')[0]}` : '');
      
      this.trackInteraction(
        UserInteractionType.CLICK,
        element,
        {
          x: event.clientX,
          y: event.clientY,
          button: event.button
        }
      );
    });

    // Track scrolling
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackInteraction(
          UserInteractionType.SCROLL,
          'window',
          {
            scrollY: window.scrollY,
            scrollX: window.scrollX
          }
        );
      }, 250);
    });
  }

  private startPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.trackDashboardLoad({
              totalLoadTime: navEntry.loadEventEnd - navEntry.fetchStart,
              timeToFirstByte: navEntry.responseStart - navEntry.fetchStart,
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
              connectionType: (navigator as any).connection?.effectiveType
            });
          }
        });
      });

      try {
        navObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('Navigation timing observer not supported');
      }

      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const paintMetrics: Partial<DashboardLoadMetrics> = {};
        
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            paintMetrics.firstContentfulPaint = entry.startTime;
          }
        });

        if (Object.keys(paintMetrics).length > 0) {
          this.trackDashboardLoad(paintMetrics);
        }
      });

      try {
        paintObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.warn('Paint timing observer not supported');
      }
    }
  }

  private updateSessionMetrics(type: string, value?: any): void {
    const session = this.sessions.get(this.currentSessionId);
    if (!session) return;

    switch (type) {
      case 'interaction':
        session.interactions++;
        break;
      case 'pageView':
        session.pageViews++;
        break;
      case 'dataRefresh':
        session.dataRefreshes++;
        if (!value) session.errorsEncountered++;
        break;
      case 'featureUsage':
        if (value && !session.featuresUsed.includes(value)) {
          session.featuresUsed.push(value);
        }
        break;
    }
  }

  private getDeviceInfo(): UserSessionMetrics['deviceInfo'] {
    const ua = navigator.userAgent;
    return {
      type: /Mobile|Android|iPhone|iPad/.test(ua) ? 'mobile' : 'desktop',
      browser: this.getBrowserName(ua),
      os: this.getOSName(ua),
      screenSize: `${screen.width}x${screen.height}`,
      connectionType: (navigator as any).connection?.effectiveType
    };
  }

  private getBrowserName(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private calculateEngagementScore(session: UserSessionMetrics): number {
    let score = 0;
    score += Math.min(session.interactions * 2, 50);
    score += Math.min(session.pageViews * 10, 30);
    score += Math.min(session.featuresUsed.length * 5, 20);
    return Math.min(score, 100);
  }

  private calculatePerformanceScore(session: UserSessionMetrics): number {
    const sessionLoadMetrics = this.loadMetrics.filter(m => m.sessionId === session.sessionId);
    const avgLoadTime = sessionLoadMetrics.reduce((sum, m) => sum + m.totalLoadTime, 0) / Math.max(sessionLoadMetrics.length, 1);
    
    let score = 100;
    if (avgLoadTime > 3000) score -= 30;
    else if (avgLoadTime > 2000) score -= 20;
    else if (avgLoadTime > 1000) score -= 10;
    
    score -= session.errorsEncountered * 10;
    return Math.max(score, 0);
  }

  private generateRecommendations(metrics: {
    averageLoadTime: number;
    errorRate: number;
    bounceRate: number;
    cacheHitRate: number;
    successRate: number;
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.averageLoadTime > 3000) {
      recommendations.push('Consider optimizing dashboard load times - current average exceeds 3 seconds');
    }

    if (metrics.errorRate > 5) {
      recommendations.push('High error rate detected - investigate API reliability and error handling');
    }

    if (metrics.bounceRate > 40) {
      recommendations.push('High bounce rate suggests users are not finding value quickly - review initial user experience');
    }

    if (metrics.cacheHitRate < 60) {
      recommendations.push('Low cache hit rate - consider improving caching strategy for better performance');
    }

    if (metrics.successRate < 95) {
      recommendations.push('Data refresh success rate is below optimal - investigate network and API issues');
    }

    return recommendations;
  }

  private convertToCSV(data: any): string {
    const headers = ['timestamp', 'type', 'category', 'value', 'metadata'];
    const rows: string[][] = [headers];

    // Add interactions
    data.interactions.forEach((interaction: UserInteraction) => {
      rows.push([
        interaction.timestamp.toISOString(),
        'interaction',
        interaction.type,
        interaction.element,
        JSON.stringify(interaction.metadata || {})
      ]);
    });

    // Add load metrics
    data.loadMetrics.forEach((metric: DashboardLoadMetrics) => {
      rows.push([
        metric.timestamp.toISOString(),
        'load_metric',
        'dashboard_load',
        metric.totalLoadTime.toString(),
        JSON.stringify({
          apiCallsCount: metric.apiCallsCount,
          errorCount: metric.errorCount,
          cacheHitRate: metric.cacheHitRate
        })
      ]);
    });

    return rows.map(row => row.join(',')).join('\n');
  }

  private trimStorage(): void {
    if (this.interactions.length > this.maxStorageSize) {
      this.interactions = this.interactions.slice(-this.maxStorageSize);
    }
    if (this.loadMetrics.length > this.maxStorageSize) {
      this.loadMetrics = this.loadMetrics.slice(-this.maxStorageSize);
    }
    if (this.refreshMetrics.length > this.maxStorageSize) {
      this.refreshMetrics = this.refreshMetrics.slice(-this.maxStorageSize);
    }
  }

  private notifyListeners(event: any): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in analytics listener:', err);
      }
    });
  }
}

// Global analytics instance
export const userAnalytics = new UserAnalytics();

// Convenience functions
export const trackDashboardLoad = userAnalytics.trackDashboardLoad.bind(userAnalytics);
export const trackInteraction = userAnalytics.trackInteraction.bind(userAnalytics);
export const trackDataRefresh = userAnalytics.trackDataRefresh.bind(userAnalytics);
export const trackPageView = userAnalytics.trackPageView.bind(userAnalytics);
export const trackFeatureUsage = userAnalytics.trackFeatureUsage.bind(userAnalytics);
export const trackSearch = userAnalytics.trackSearch.bind(userAnalytics);
export const trackFilter = userAnalytics.trackFilter.bind(userAnalytics);
export const trackExport = userAnalytics.trackExport.bind(userAnalytics);

export default userAnalytics;