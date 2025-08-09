/**
 * Enhanced performance monitoring system for API response times and system metrics
 */

import { errorLogger, ErrorCategory, ErrorSeverity } from './errorLogger';

export interface PerformanceMetric {
  id: string;
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
  category: PerformanceCategory;
  threshold?: number;
  slowQuery?: boolean;
}

export enum PerformanceCategory {
  API_CALL = 'api_call',
  DATABASE_QUERY = 'database_query',
  REALTIME_CONNECTION = 'realtime_connection',
  UI_RENDER = 'ui_render',
  DATA_TRANSFORMATION = 'data_transformation',
  CACHE_OPERATION = 'cache_operation',
  NETWORK_REQUEST = 'network_request'
}

export interface PerformanceThresholds {
  [PerformanceCategory.API_CALL]: number;
  [PerformanceCategory.DATABASE_QUERY]: number;
  [PerformanceCategory.REALTIME_CONNECTION]: number;
  [PerformanceCategory.UI_RENDER]: number;
  [PerformanceCategory.DATA_TRANSFORMATION]: number;
  [PerformanceCategory.CACHE_OPERATION]: number;
  [PerformanceCategory.NETWORK_REQUEST]: number;
}

export interface PerformanceStats {
  totalOperations: number;
  successRate: number;
  averageDuration: number;
  medianDuration: number;
  p95Duration: number;
  p99Duration: number;
  minDuration: number;
  maxDuration: number;
  slowOperations: number;
  errorRate: number;
  operationsPerMinute: number;
  recentTrends: {
    last5Minutes: PerformanceMetric[];
    last15Minutes: PerformanceMetric[];
    lastHour: PerformanceMetric[];
  };
}

export interface ApiResponseTimeMetrics {
  endpoint: string;
  method: string;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  lastRequest: Date;
  slowRequests: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 2000; // Keep last 2000 metrics
  private listeners: Array<(metric: PerformanceMetric) => void> = [];
  
  // Throttling for slow operation logging
  private lastSlowLogTime = new Map<string, number>();
  private slowLogThrottle = 15000; // 15 seconds between similar slow operation logs
  
  // Default performance thresholds (in milliseconds)
  private thresholds: PerformanceThresholds = {
    [PerformanceCategory.API_CALL]: 3000, // Increased from 2000 to 3000
    [PerformanceCategory.DATABASE_QUERY]: 2000, // Increased from 1000 to 2000
    [PerformanceCategory.REALTIME_CONNECTION]: 5000,
    [PerformanceCategory.UI_RENDER]: 100,
    [PerformanceCategory.DATA_TRANSFORMATION]: 500,
    [PerformanceCategory.CACHE_OPERATION]: 50,
    [PerformanceCategory.NETWORK_REQUEST]: 5000 // Increased from 3000 to 5000
  };

  /**
   * Measure the performance of an async operation
   */
  async measureAsync<T>(
    operation: () => Promise<T>,
    operationName: string,
    category: PerformanceCategory,
    metadata?: Record<string, any>,
    customThreshold?: number
  ): Promise<T> {
    const metricId = this.generateMetricId();
    const startTime = performance.now();
    const timestamp = new Date();
    let success = true;
    let error: string | undefined;
    let result: T;

    try {
      result = await operation();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      
      // Log the error to error logger
      errorLogger.logError(
        ErrorCategory.PERFORMANCE_ERROR,
        ErrorSeverity.MEDIUM,
        `Performance monitoring caught error in ${operationName}`,
        err instanceof Error ? err : new Error(String(err)),
        { category, metadata, operationName },
        true
      );
      
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      const threshold = customThreshold || this.thresholds[category];
      const slowQuery = duration > threshold;
      
      const metric: PerformanceMetric = {
        id: metricId,
        operation: operationName,
        duration,
        timestamp,
        success,
        error,
        metadata,
        category,
        threshold,
        slowQuery
      };

      this.addMetric(metric);
      this.notifyListeners(metric);

      // Log slow operations
      if (slowQuery) {
        this.logSlowOperation(metric);
      }

      // Log performance errors for critical slowdowns
      if (duration > threshold * 2) {
        errorLogger.logPerformanceError(
          operationName,
          duration,
          threshold,
          { category, metadata }
        );
      }
    }
  }

  /**
   * Measure the performance of a synchronous operation
   */
  measureSync<T>(
    operation: () => T,
    operationName: string,
    category: PerformanceCategory,
    metadata?: Record<string, any>,
    customThreshold?: number
  ): T {
    const metricId = this.generateMetricId();
    const startTime = performance.now();
    const timestamp = new Date();
    let success = true;
    let error: string | undefined;
    let result: T;

    try {
      result = operation();
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      
      errorLogger.logError(
        ErrorCategory.PERFORMANCE_ERROR,
        ErrorSeverity.MEDIUM,
        `Performance monitoring caught error in ${operationName}`,
        err instanceof Error ? err : new Error(String(err)),
        { category, metadata, operationName },
        true
      );
      
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      const threshold = customThreshold || this.thresholds[category];
      const slowQuery = duration > threshold;
      
      const metric: PerformanceMetric = {
        id: metricId,
        operation: operationName,
        duration,
        timestamp,
        success,
        error,
        metadata,
        category,
        threshold,
        slowQuery
      };

      this.addMetric(metric);
      this.notifyListeners(metric);

      if (slowQuery) {
        this.logSlowOperation(metric);
      }

      if (duration > threshold * 2) {
        errorLogger.logPerformanceError(
          operationName,
          duration,
          threshold,
          { category, metadata }
        );
      }
    }
  }

  /**
   * Track API response times specifically
   */
  async trackApiCall<T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method: string,
    requestData?: any
  ): Promise<T> {
    return this.measureAsync(
      apiCall,
      `${method} ${endpoint}`,
      PerformanceCategory.API_CALL,
      {
        endpoint,
        method,
        requestSize: requestData ? JSON.stringify(requestData).length : 0,
        hasRequestData: !!requestData
      }
    );
  }

  /**
   * Track database query performance
   */
  async trackDatabaseQuery<T>(
    query: () => Promise<T>,
    queryName: string,
    table?: string,
    queryType?: string
  ): Promise<T> {
    return this.measureAsync(
      query,
      queryName,
      PerformanceCategory.DATABASE_QUERY,
      {
        table,
        queryType,
        isDatabaseQuery: true
      }
    );
  }

  /**
   * Track real-time connection performance
   */
  trackRealtimeConnection(
    connectionId: string,
    event: string,
    duration: number,
    success: boolean,
    error?: string
  ): void {
    const metric: PerformanceMetric = {
      id: this.generateMetricId(),
      operation: `Realtime: ${event}`,
      duration,
      timestamp: new Date(),
      success,
      error,
      metadata: {
        connectionId,
        event,
        isRealtimeConnection: true
      },
      category: PerformanceCategory.REALTIME_CONNECTION,
      threshold: this.thresholds[PerformanceCategory.REALTIME_CONNECTION],
      slowQuery: duration > this.thresholds[PerformanceCategory.REALTIME_CONNECTION]
    };

    this.addMetric(metric);
    this.notifyListeners(metric);

    if (metric.slowQuery) {
      this.logSlowOperation(metric);
    }
  }

  /**
   * Get performance statistics for a specific operation or category
   */
  getStats(
    filter?: {
      operation?: string;
      category?: PerformanceCategory;
      timeRange?: { start: Date; end: Date };
    }
  ): PerformanceStats {
    let relevantMetrics = this.metrics;

    if (filter) {
      if (filter.operation) {
        relevantMetrics = relevantMetrics.filter(m => m.operation === filter.operation);
      }
      if (filter.category) {
        relevantMetrics = relevantMetrics.filter(m => m.category === filter.category);
      }
      if (filter.timeRange) {
        relevantMetrics = relevantMetrics.filter(
          m => m.timestamp >= filter.timeRange!.start && m.timestamp <= filter.timeRange!.end
        );
      }
    }

    if (relevantMetrics.length === 0) {
      return this.getEmptyStats();
    }

    const successfulMetrics = relevantMetrics.filter(m => m.success);
    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const slowOperations = relevantMetrics.filter(m => m.slowQuery).length;

    // Calculate percentiles
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const medianIndex = Math.floor(durations.length * 0.5);

    // Calculate operations per minute
    const timeSpan = relevantMetrics.length > 1
      ? (relevantMetrics[relevantMetrics.length - 1].timestamp.getTime() - relevantMetrics[0].timestamp.getTime()) / (1000 * 60)
      : 1;
    const operationsPerMinute = relevantMetrics.length / Math.max(timeSpan, 1);

    // Get recent trends
    const now = new Date();
    const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);
    const last15Minutes = new Date(now.getTime() - 15 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    return {
      totalOperations: relevantMetrics.length,
      successRate: (successfulMetrics.length / relevantMetrics.length) * 100,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      medianDuration: durations[medianIndex] || 0,
      p95Duration: durations[p95Index] || 0,
      p99Duration: durations[p99Index] || 0,
      minDuration: durations[0] || 0,
      maxDuration: durations[durations.length - 1] || 0,
      slowOperations,
      errorRate: ((relevantMetrics.length - successfulMetrics.length) / relevantMetrics.length) * 100,
      operationsPerMinute,
      recentTrends: {
        last5Minutes: relevantMetrics.filter(m => m.timestamp >= last5Minutes),
        last15Minutes: relevantMetrics.filter(m => m.timestamp >= last15Minutes),
        lastHour: relevantMetrics.filter(m => m.timestamp >= lastHour)
      }
    };
  }

  /**
   * Get API response time metrics grouped by endpoint
   */
  getApiResponseTimeMetrics(): ApiResponseTimeMetrics[] {
    const apiMetrics = this.metrics.filter(m => m.category === PerformanceCategory.API_CALL);
    const endpointGroups = new Map<string, PerformanceMetric[]>();

    // Group metrics by endpoint and method
    apiMetrics.forEach(metric => {
      const endpoint = metric.metadata?.endpoint || 'unknown';
      const method = metric.metadata?.method || 'unknown';
      const key = `${method} ${endpoint}`;
      
      if (!endpointGroups.has(key)) {
        endpointGroups.set(key, []);
      }
      endpointGroups.get(key)!.push(metric);
    });

    // Calculate metrics for each endpoint
    return Array.from(endpointGroups.entries()).map(([key, metrics]) => {
      const [method, endpoint] = key.split(' ', 2);
      const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
      const successfulRequests = metrics.filter(m => m.success).length;
      const p95Index = Math.floor(durations.length * 0.95);
      const slowRequests = metrics.filter(m => m.slowQuery).length;

      return {
        endpoint,
        method,
        averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minResponseTime: durations[0] || 0,
        maxResponseTime: durations[durations.length - 1] || 0,
        p95ResponseTime: durations[p95Index] || 0,
        totalRequests: metrics.length,
        successfulRequests,
        failedRequests: metrics.length - successfulRequests,
        errorRate: ((metrics.length - successfulRequests) / metrics.length) * 100,
        lastRequest: metrics[metrics.length - 1]?.timestamp || new Date(),
        slowRequests
      };
    }).sort((a, b) => b.totalRequests - a.totalRequests);
  }

  /**
   * Get slow operations report
   */
  getSlowOperationsReport(limit = 20): Array<{
    operation: string;
    category: PerformanceCategory;
    averageDuration: number;
    maxDuration: number;
    occurrences: number;
    lastOccurrence: Date;
  }> {
    const slowMetrics = this.metrics.filter(m => m.slowQuery);
    const operationGroups = new Map<string, PerformanceMetric[]>();

    slowMetrics.forEach(metric => {
      const key = `${metric.category}:${metric.operation}`;
      if (!operationGroups.has(key)) {
        operationGroups.set(key, []);
      }
      operationGroups.get(key)!.push(metric);
    });

    return Array.from(operationGroups.entries())
      .map(([key, metrics]) => {
        const [category, operation] = key.split(':', 2);
        const durations = metrics.map(m => m.duration);
        
        return {
          operation,
          category: category as PerformanceCategory,
          averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
          maxDuration: Math.max(...durations),
          occurrences: metrics.length,
          lastOccurrence: metrics[metrics.length - 1].timestamp
        };
      })
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, limit);
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Subscribe to performance metric events
   */
  subscribe(listener: (metric: PerformanceMetric) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['id', 'operation', 'category', 'duration', 'timestamp', 'success', 'slowQuery'];
      const rows = this.metrics.map(metric => [
        metric.id,
        metric.operation,
        metric.category,
        metric.duration,
        metric.timestamp.toISOString(),
        metric.success,
        metric.slowQuery
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    
    return JSON.stringify(this.metrics, null, 2);
  }

  // Private methods

  private generateMetricId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  private notifyListeners(metric: PerformanceMetric): void {
    this.listeners.forEach(listener => {
      try {
        listener(metric);
      } catch (err) {
        console.error('Error in performance monitor listener:', err);
      }
    });
  }

  private logSlowOperation(metric: PerformanceMetric): void {
    const operationKey = `${metric.category}:${metric.operation}`;
    const now = Date.now();
    const lastLogTime = this.lastSlowLogTime.get(operationKey) || 0;
    
    // Only log if enough time has passed since last log of the same operation
    if (now - lastLogTime > this.slowLogThrottle) {
      this.lastSlowLogTime.set(operationKey, now);
      
      const emoji = this.getCategoryEmoji(metric.category);
      console.warn(
        `${emoji} Slow ${metric.category}: ${metric.operation} took ${metric.duration.toFixed(2)}ms (threshold: ${metric.threshold}ms)`,
        { 
          ...metric.metadata,
          isThrottled: true,
          timeSinceLastLog: now - lastLogTime
        }
      );
    }
  }

  private getCategoryEmoji(category: PerformanceCategory): string {
    switch (category) {
      case PerformanceCategory.API_CALL: return '🌐';
      case PerformanceCategory.DATABASE_QUERY: return '🗄️';
      case PerformanceCategory.REALTIME_CONNECTION: return '⚡';
      case PerformanceCategory.UI_RENDER: return '🎨';
      case PerformanceCategory.DATA_TRANSFORMATION: return '🔄';
      case PerformanceCategory.CACHE_OPERATION: return '💾';
      case PerformanceCategory.NETWORK_REQUEST: return '📡';
      default: return '⏱️';
    }
  }

  private getEmptyStats(): PerformanceStats {
    return {
      totalOperations: 0,
      successRate: 0,
      averageDuration: 0,
      medianDuration: 0,
      p95Duration: 0,
      p99Duration: 0,
      minDuration: 0,
      maxDuration: 0,
      slowOperations: 0,
      errorRate: 0,
      operationsPerMinute: 0,
      recentTrends: {
        last5Minutes: [],
        last15Minutes: [],
        lastHour: []
      }
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const trackApiCall = performanceMonitor.trackApiCall.bind(performanceMonitor);
export const trackDatabaseQuery = performanceMonitor.trackDatabaseQuery.bind(performanceMonitor);
export const trackRealtimeConnection = performanceMonitor.trackRealtimeConnection.bind(performanceMonitor);

export default performanceMonitor;