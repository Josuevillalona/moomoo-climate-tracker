/**
 * Performance monitoring utilities for database queries and API calls
 */

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface QueryPerformanceOptions {
  operation: string;
  metadata?: Record<string, any>;
  logToConsole?: boolean;
  threshold?: number; // Log warning if query takes longer than this (ms)
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  /**
   * Measure the performance of an async operation
   */
  async measureAsync<T>(
    operation: () => Promise<T>,
    options: QueryPerformanceOptions
  ): Promise<T> {
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
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      
      const metric: PerformanceMetric = {
        operation: options.operation,
        duration,
        timestamp,
        success,
        error,
        metadata: options.metadata
      };

      this.addMetric(metric);

      // Log to console if enabled
      if (options.logToConsole !== false) {
        this.logMetric(metric, options.threshold);
      }
    }
  }

  /**
   * Measure the performance of a synchronous operation
   */
  measureSync<T>(
    operation: () => T,
    options: QueryPerformanceOptions
  ): T {
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
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      
      const metric: PerformanceMetric = {
        operation: options.operation,
        duration,
        timestamp,
        success,
        error,
        metadata: options.metadata
      };

      this.addMetric(metric);

      // Log to console if enabled
      if (options.logToConsole !== false) {
        this.logMetric(metric, options.threshold);
      }
    }
  }

  /**
   * Add a metric to the collection
   */
  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Log metric to console with appropriate level
   */
  private logMetric(metric: PerformanceMetric, threshold = 1000) {
    const { operation, duration, success, error, metadata } = metric;
    const formattedDuration = `${duration.toFixed(2)}ms`;
    
    if (!success) {
      console.error(`❌ ${operation} failed in ${formattedDuration}:`, error, metadata);
    } else if (duration > threshold) {
      console.warn(`⚠️ ${operation} slow query (${formattedDuration})`, metadata);
    } else {
      console.log(`✅ ${operation} completed in ${formattedDuration}`, metadata);
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operation?: string): {
    totalCalls: number;
    successRate: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    recentErrors: string[];
  } {
    const relevantMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {
        totalCalls: 0,
        successRate: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        recentErrors: []
      };
    }

    const successfulMetrics = relevantMetrics.filter(m => m.success);
    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const recentErrors = relevantMetrics
      .filter(m => !m.success && m.error)
      .slice(-5)
      .map(m => m.error!);

    const p95Index = Math.floor(durations.length * 0.95);

    return {
      totalCalls: relevantMetrics.length,
      successRate: (successfulMetrics.length / relevantMetrics.length) * 100,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: durations[0] || 0,
      maxDuration: durations[durations.length - 1] || 0,
      p95Duration: durations[p95Index] || 0,
      recentErrors
    };
  }

  /**
   * Get all metrics for a time range
   */
  getMetricsInRange(startTime: Date, endTime: Date): PerformanceMetric[] {
    return this.metrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
  }

  /**
   * Get recent metrics (last N)
   */
  getRecentMetrics(count = 10): PerformanceMetric[] {
    return this.metrics.slice(-count);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator function for measuring API method performance
 */
export function measurePerformance(operation: string, threshold?: number) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;
    
    descriptor.value = (async function (this: any, ...args: any[]) {
      return performanceMonitor.measureAsync(
        () => method.apply(this, args),
        {
          operation: `${target.constructor.name}.${operation}`,
          threshold,
          metadata: { args: args.length }
        }
      );
    }) as T;
  };
}

/**
 * Utility function to measure query performance with context
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return performanceMonitor.measureAsync(queryFn, {
    operation: `Query: ${queryName}`,
    metadata,
    threshold: 2000 // Warn if query takes longer than 2 seconds
  });
}

/**
 * Utility function to log slow queries
 */
export function logSlowQuery(
  queryName: string,
  duration: number,
  threshold = 1000,
  metadata?: Record<string, any>
) {
  if (duration > threshold) {
    console.warn(
      `🐌 Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`,
      metadata
    );
  }
}

/**
 * Get performance summary for dashboard display
 */
export function getPerformanceSummary() {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const recentMetrics = performanceMonitor.getMetricsInRange(oneHourAgo, now);
  const apiStats = performanceMonitor.getStats();
  
  return {
    totalQueries: recentMetrics.length,
    averageResponseTime: apiStats.averageDuration,
    successRate: apiStats.successRate,
    slowQueries: recentMetrics.filter(m => m.duration > 2000).length,
    errors: apiStats.recentErrors.length,
    lastHourActivity: recentMetrics.length
  };
}

export default performanceMonitor;