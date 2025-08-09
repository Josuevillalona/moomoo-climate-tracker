/**
 * Monitoring dashboard component for displaying error logs, performance metrics, and real-time connection health
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { errorLogger, ErrorCategory, ErrorSeverity } from '../../lib/monitoring/errorLogger';
import { performanceMonitor, PerformanceCategory } from '../../lib/monitoring/performanceMonitor';
import { realtimeMonitor, ConnectionState } from '../../lib/monitoring/realtimeMonitor';

interface MonitoringDashboardProps {
  refreshInterval?: number; // in milliseconds
  showDetails?: boolean;
}

export function MonitoringDashboard({ 
  refreshInterval = 5000, 
  showDetails = false 
}: MonitoringDashboardProps) {
  const [errorMetrics, setErrorMetrics] = useState(errorLogger.getMetrics());
  const [performanceStats, setPerformanceStats] = useState(performanceMonitor.getStats());
  const [realtimeStats, setRealtimeStats] = useState(realtimeMonitor.getRealtimeStats());
  const [apiMetrics, setApiMetrics] = useState(performanceMonitor.getApiResponseTimeMetrics());
  const [connectionIssues, setConnectionIssues] = useState(realtimeMonitor.getConnectionIssuesReport());
  const [activeTab, setActiveTab] = useState<'overview' | 'errors' | 'performance' | 'realtime'>('overview');

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      setErrorMetrics(errorLogger.getMetrics());
      setPerformanceStats(performanceMonitor.getStats());
      setRealtimeStats(realtimeMonitor.getRealtimeStats());
      setApiMetrics(performanceMonitor.getApiResponseTimeMetrics());
      setConnectionIssues(realtimeMonitor.getConnectionIssuesReport());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getSeverityColor = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.CRITICAL: return 'text-red-600 bg-red-50';
      case ErrorSeverity.HIGH: return 'text-red-500 bg-red-50';
      case ErrorSeverity.MEDIUM: return 'text-yellow-600 bg-yellow-50';
      case ErrorSeverity.LOW: return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConnectionStateColor = (state: ConnectionState): string => {
    switch (state) {
      case ConnectionState.CONNECTED: return 'text-green-600 bg-green-50';
      case ConnectionState.CONNECTING: return 'text-blue-600 bg-blue-50';
      case ConnectionState.RECONNECTING: return 'text-yellow-600 bg-yellow-50';
      case ConnectionState.ERROR: return 'text-red-600 bg-red-50';
      case ConnectionState.DISCONNECTED: return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const clearAllData = () => {
    errorLogger.clearErrors();
    performanceMonitor.clearMetrics();
    realtimeMonitor.clearMetrics();
    // Refresh displays
    setErrorMetrics(errorLogger.getMetrics());
    setPerformanceStats(performanceMonitor.getStats());
    setRealtimeStats(realtimeMonitor.getRealtimeStats());
    setApiMetrics([]);
    setConnectionIssues([]);
  };

  const exportData = (format: 'json' | 'csv') => {
    const data = {
      timestamp: new Date().toISOString(),
      errors: errorLogger.exportErrors(format),
      performance: performanceMonitor.exportMetrics(format),
      errorMetrics,
      performanceStats,
      realtimeStats
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-data-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Monitoring Dashboard</h2>
        <div className="flex gap-2">
          <Button onClick={() => exportData('json')} variant="outline" size="sm">
            Export JSON
          </Button>
          <Button onClick={() => exportData('csv')} variant="outline" size="sm">
            Export CSV
          </Button>
          <Button onClick={clearAllData} variant="outline" size="sm">
            Clear Data
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'errors', label: 'Errors' },
          { key: 'performance', label: 'Performance' },
          { key: 'realtime', label: 'Real-time' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Errors</h3>
            <p className="text-2xl font-bold text-red-600">{errorMetrics.totalErrors}</p>
            <p className="text-xs text-gray-500">
              Rate: {formatPercentage(errorMetrics.errorRate)}/min
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Avg Response Time</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatDuration(performanceStats.averageDuration)}
            </p>
            <p className="text-xs text-gray-500">
              Success: {formatPercentage(performanceStats.successRate)}
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Active Connections</h3>
            <p className="text-2xl font-bold text-green-600">{realtimeStats.activeConnections}</p>
            <p className="text-xs text-gray-500">
              Total: {realtimeStats.totalConnections}
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">System Health</h3>
            <p className="text-2xl font-bold text-green-600">
              {realtimeStats.healthyConnections > 0 ? 'Good' : 'Issues'}
            </p>
            <p className="text-xs text-gray-500">
              {realtimeStats.unhealthyConnections} issues
            </p>
          </Card>
        </div>
      )}

      {/* Errors Tab */}
      {activeTab === 'errors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Errors by Category</h3>
              <div className="space-y-2">
                {Object.entries(errorMetrics.errorsByCategory).map(([category, count]) => (
                  count > 0 && (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  )
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Errors by Severity</h3>
              <div className="space-y-2">
                {Object.entries(errorMetrics.errorsBySeverity).map(([severity, count]) => (
                  count > 0 && (
                    <div key={severity} className="flex justify-between items-center">
                      <span className={`text-sm px-2 py-1 rounded ${getSeverityColor(severity as ErrorSeverity)}`}>
                        {severity}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  )
                ))}
              </div>
            </Card>
          </div>

          {showDetails && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Recent Errors</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {errorMetrics.recentErrors.slice(0, 10).map((error) => (
                  <div key={error.id} className="border-l-4 border-red-400 pl-3 py-2 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{error.message}</p>
                        <p className="text-xs text-gray-500">
                          {error.timestamp.toLocaleString()} • {error.category}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(error.severity)}`}>
                        {error.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Operations</h3>
              <p className="text-2xl font-bold">{performanceStats.totalOperations}</p>
              <p className="text-xs text-gray-500">
                {formatPercentage(performanceStats.successRate)} success
              </p>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500">P95 Response Time</h3>
              <p className="text-2xl font-bold">{formatDuration(performanceStats.p95Duration)}</p>
              <p className="text-xs text-gray-500">
                Avg: {formatDuration(performanceStats.averageDuration)}
              </p>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Slow Operations</h3>
              <p className="text-2xl font-bold text-yellow-600">{performanceStats.slowOperations}</p>
              <p className="text-xs text-gray-500">
                {formatPercentage((performanceStats.slowOperations / Math.max(performanceStats.totalOperations, 1)) * 100)} of total
              </p>
            </Card>
          </div>

          {showDetails && apiMetrics.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">API Endpoints Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Endpoint</th>
                      <th className="text-left py-2">Method</th>
                      <th className="text-left py-2">Avg Time</th>
                      <th className="text-left py-2">P95 Time</th>
                      <th className="text-left py-2">Requests</th>
                      <th className="text-left py-2">Error Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiMetrics.slice(0, 10).map((metric, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{metric.endpoint}</td>
                        <td className="py-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {metric.method}
                          </span>
                        </td>
                        <td className="py-2">{formatDuration(metric.averageResponseTime)}</td>
                        <td className="py-2">{formatDuration(metric.p95ResponseTime)}</td>
                        <td className="py-2">{metric.totalRequests}</td>
                        <td className="py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            metric.errorRate > 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {formatPercentage(metric.errorRate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Real-time Tab */}
      {activeTab === 'realtime' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Connections</h3>
              <p className="text-2xl font-bold">{realtimeStats.activeConnections}</p>
              <p className="text-xs text-gray-500">
                {realtimeStats.totalConnections} total
              </p>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Avg Latency</h3>
              <p className="text-2xl font-bold">{formatDuration(realtimeStats.averageLatency)}</p>
              <p className="text-xs text-gray-500">
                {realtimeStats.totalMessages} messages
              </p>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Reconnects</h3>
              <p className="text-2xl font-bold text-yellow-600">{realtimeStats.totalReconnects}</p>
              <p className="text-xs text-gray-500">
                Error rate: {formatPercentage(realtimeStats.errorRate)}
              </p>
            </Card>

            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-500">Uptime</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatDuration(realtimeStats.connectionUptime)}
              </p>
              <p className="text-xs text-gray-500">
                {realtimeStats.healthyConnections} healthy
              </p>
            </Card>
          </div>

          {showDetails && connectionIssues.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">Connection Issues</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {connectionIssues.slice(0, 10).map((issue, index) => (
                  <div key={index} className="border-l-4 border-yellow-400 pl-3 py-2 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{issue.description}</p>
                        <p className="text-xs text-gray-500">
                          Connection: {issue.connectionId} • {issue.lastOccurrence.toLocaleString()}
                        </p>
                        {issue.suggestions.length > 0 && (
                          <ul className="text-xs text-gray-600 mt-1 list-disc list-inside">
                            {issue.suggestions.slice(0, 2).map((suggestion, i) => (
                              <li key={i}>{suggestion}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default MonitoringDashboard;