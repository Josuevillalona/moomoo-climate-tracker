/**
 * Custom hook for accessing monitoring data and functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { errorLogger, ErrorMetrics, ErrorLogEntry } from '../lib/monitoring/errorLogger';
import { performanceMonitor, PerformanceStats, ApiResponseTimeMetrics } from '../lib/monitoring/performanceMonitor';
import { realtimeMonitor, RealtimeStats, ConnectionHealth } from '../lib/monitoring/realtimeMonitor';

export interface MonitoringData {
  errors: ErrorMetrics;
  performance: PerformanceStats;
  realtime: RealtimeStats;
  apiMetrics: ApiResponseTimeMetrics[];
  connectionIssues: Array<{
    connectionId: string;
    issueType: string;
    severity: string;
    description: string;
    occurrences: number;
    lastOccurrence: Date;
    suggestions: string[];
  }>;
  lastUpdated: Date;
}

export interface UseMonitoringOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  includeDetails?: boolean;
}

export interface UseMonitoringReturn {
  data: MonitoringData;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  clearAllData: () => void;
  exportData: (format: 'json' | 'csv') => void;
  subscribe: (callback: (data: MonitoringData) => void) => () => void;
  getConnectionHealth: (connectionId: string) => ConnectionHealth | null;
  getRecentErrors: (limit?: number) => ErrorLogEntry[];
}

const DEFAULT_OPTIONS: Required<UseMonitoringOptions> = {
  autoRefresh: true,
  refreshInterval: 5000,
  includeDetails: false
};

export function useMonitoring(options: UseMonitoringOptions = {}): UseMonitoringReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [data, setData] = useState<MonitoringData>(() => ({
    errors: errorLogger.getMetrics(),
    performance: performanceMonitor.getStats(),
    realtime: realtimeMonitor.getRealtimeStats(),
    apiMetrics: performanceMonitor.getApiResponseTimeMetrics(),
    connectionIssues: realtimeMonitor.getConnectionIssuesReport(),
    lastUpdated: new Date()
  }));
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribers, setSubscribers] = useState<Array<(data: MonitoringData) => void>>([]);

  // Refresh monitoring data
  const refresh = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);

      const newData: MonitoringData = {
        errors: errorLogger.getMetrics(),
        performance: performanceMonitor.getStats(),
        realtime: realtimeMonitor.getRealtimeStats(),
        apiMetrics: performanceMonitor.getApiResponseTimeMetrics(),
        connectionIssues: realtimeMonitor.getConnectionIssuesReport(),
        lastUpdated: new Date()
      };

      setData(newData);
      
      // Notify subscribers
      subscribers.forEach(callback => {
        try {
          callback(newData);
        } catch (err) {
          console.error('Error in monitoring subscriber:', err);
        }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh monitoring data';
      setError(errorMessage);
      console.error('Error refreshing monitoring data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [subscribers]);

  // Auto-refresh effect
  useEffect(() => {
    if (!opts.autoRefresh) return;

    const interval = setInterval(refresh, opts.refreshInterval);
    return () => clearInterval(interval);
  }, [opts.autoRefresh, opts.refreshInterval, refresh]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Clear all monitoring data
  const clearAllData = useCallback(() => {
    try {
      errorLogger.clearErrors();
      performanceMonitor.clearMetrics();
      realtimeMonitor.clearMetrics();
      refresh(); // Refresh to show cleared state
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear monitoring data';
      setError(errorMessage);
      console.error('Error clearing monitoring data:', err);
    }
  }, [refresh]);

  // Export monitoring data
  const exportData = useCallback((format: 'json' | 'csv') => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        errors: {
          metrics: data.errors,
          logs: errorLogger.exportErrors(format)
        },
        performance: {
          stats: data.performance,
          metrics: performanceMonitor.exportMetrics(format)
        },
        realtime: data.realtime,
        apiMetrics: data.apiMetrics,
        connectionIssues: data.connectionIssues
      };

      const content = format === 'json' 
        ? JSON.stringify(exportData, null, 2)
        : convertToCSV(exportData);

      const blob = new Blob([content], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monitoring-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export monitoring data';
      setError(errorMessage);
      console.error('Error exporting monitoring data:', err);
    }
  }, [data]);

  // Subscribe to monitoring updates
  const subscribe = useCallback((callback: (data: MonitoringData) => void) => {
    setSubscribers(prev => [...prev, callback]);
    
    // Return unsubscribe function
    return () => {
      setSubscribers(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  // Get connection health for specific connection
  const getConnectionHealth = useCallback((connectionId: string): ConnectionHealth | null => {
    return realtimeMonitor.getConnectionHealth(connectionId);
  }, []);

  // Get recent errors
  const getRecentErrors = useCallback((limit = 20): ErrorLogEntry[] => {
    return data.errors.recentErrors.slice(0, limit);
  }, [data.errors.recentErrors]);

  return {
    data,
    isLoading,
    error,
    refresh,
    clearAllData,
    exportData,
    subscribe,
    getConnectionHealth,
    getRecentErrors
  };
}

// Helper function to convert data to CSV format
function convertToCSV(data: any): string {
  const headers = ['timestamp', 'type', 'category', 'value', 'details'];
  const rows: string[][] = [headers];

  // Add error metrics
  Object.entries(data.errors.metrics.errorsByCategory).forEach(([category, count]) => {
    rows.push([
      data.timestamp,
      'error_count',
      category,
      String(count),
      ''
    ]);
  });

  // Add performance metrics
  rows.push([
    data.timestamp,
    'performance',
    'total_operations',
    String(data.performance.stats.totalOperations),
    ''
  ]);

  rows.push([
    data.timestamp,
    'performance',
    'average_duration',
    String(data.performance.stats.averageDuration),
    'milliseconds'
  ]);

  rows.push([
    data.timestamp,
    'performance',
    'success_rate',
    String(data.performance.stats.successRate),
    'percentage'
  ]);

  // Add realtime metrics
  rows.push([
    data.timestamp,
    'realtime',
    'active_connections',
    String(data.realtime.activeConnections),
    ''
  ]);

  rows.push([
    data.timestamp,
    'realtime',
    'average_latency',
    String(data.realtime.averageLatency),
    'milliseconds'
  ]);

  return rows.map(row => row.join(',')).join('\n');
}

// Hook for monitoring specific operations
export function useOperationMonitoring(operationName: string) {
  const [metrics, setMetrics] = useState(() => 
    performanceMonitor.getStats({ operation: operationName })
  );

  const refresh = useCallback(() => {
    setMetrics(performanceMonitor.getStats({ operation: operationName }));
  }, [operationName]);

  useEffect(() => {
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    metrics,
    refresh
  };
}

// Hook for monitoring API endpoints
export function useApiMonitoring(endpoint?: string) {
  const [metrics, setMetrics] = useState(() => {
    const allMetrics = performanceMonitor.getApiResponseTimeMetrics();
    return endpoint 
      ? allMetrics.filter(m => m.endpoint === endpoint)
      : allMetrics;
  });

  const refresh = useCallback(() => {
    const allMetrics = performanceMonitor.getApiResponseTimeMetrics();
    setMetrics(endpoint 
      ? allMetrics.filter(m => m.endpoint === endpoint)
      : allMetrics
    );
  }, [endpoint]);

  useEffect(() => {
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    metrics,
    refresh
  };
}

// Hook for monitoring real-time connections
export function useRealtimeMonitoring(connectionId?: string) {
  const [stats, setStats] = useState(() => realtimeMonitor.getRealtimeStats());
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth | null>(() => 
    connectionId ? realtimeMonitor.getConnectionHealth(connectionId) : null
  );

  const refresh = useCallback(() => {
    setStats(realtimeMonitor.getRealtimeStats());
    if (connectionId) {
      setConnectionHealth(realtimeMonitor.getConnectionHealth(connectionId));
    }
  }, [connectionId]);

  useEffect(() => {
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  return {
    stats,
    connectionHealth,
    refresh
  };
}

export default useMonitoring;