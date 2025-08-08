import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { performanceMonitor, getPerformanceSummary } from '@/lib/utils/performance';
import { Activity, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

export interface PerformanceMonitorProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function PerformanceMonitor({
  className = '',
  autoRefresh = true,
  refreshInterval = 5000
}: PerformanceMonitorProps) {
  const [summary, setSummary] = useState(getPerformanceSummary());
  const [recentMetrics, setRecentMetrics] = useState(performanceMonitor.getRecentMetrics(10));
  const [isExpanded, setIsExpanded] = useState(false);

  const refreshData = () => {
    setSummary(getPerformanceSummary());
    setRecentMetrics(performanceMonitor.getRecentMetrics(10));
  };

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (successRate: number) => {
    if (successRate >= 95) return 'text-green-600';
    if (successRate >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceColor = (avgTime: number) => {
    if (avgTime < 500) return 'text-green-600';
    if (avgTime < 2000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border-white/20 shadow-lg ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Performance Monitor</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshData}
              className="p-1 h-auto"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-charcoal">
              {summary.totalQueries}
            </div>
            <div className="text-xs text-gray-600">Total Queries</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getPerformanceColor(summary.averageResponseTime)}`}>
              {formatDuration(summary.averageResponseTime)}
            </div>
            <div className="text-xs text-gray-600">Avg Response</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatusColor(summary.successRate)}`}>
              {summary.successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {summary.slowQueries}
            </div>
            <div className="text-xs text-gray-600">Slow Queries</div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="flex items-center space-x-1">
            {summary.errors === 0 ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span className="text-xs text-gray-600">
              {summary.errors === 0 ? 'No Errors' : `${summary.errors} Errors`}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600">
              {summary.lastHourActivity} queries/hour
            </span>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-brand-charcoal mb-2">Recent Queries</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {recentMetrics.map((metric, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between text-xs p-2 rounded ${
                      metric.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {metric.success ? (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                      )}
                      <span className="font-medium">{metric.operation}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={getPerformanceColor(metric.duration)}>
                        {formatDuration(metric.duration)}
                      </span>
                      <span className="text-gray-500">
                        {metric.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Query Type Breakdown */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-brand-charcoal mb-2">Query Performance</h4>
              <div className="space-y-2">
                {['dashboard-basic-metrics', 'recent-deals', 'filtered-deals-paginated'].map(operation => {
                  const stats = performanceMonitor.getStats(operation);
                  if (stats.totalCalls === 0) return null;
                  
                  return (
                    <div key={operation} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{operation}</span>
                      <div className="flex items-center space-x-2">
                        <span>{stats.totalCalls} calls</span>
                        <span className={getPerformanceColor(stats.averageDuration)}>
                          {formatDuration(stats.averageDuration)} avg
                        </span>
                        <span className={getStatusColor(stats.successRate)}>
                          {stats.successRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PerformanceMonitor;