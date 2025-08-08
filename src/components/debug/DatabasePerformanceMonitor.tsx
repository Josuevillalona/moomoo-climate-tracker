import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { performanceMonitor, getPerformanceSummary } from '@/lib/utils/performance';
import { queryOptimizer } from '@/lib/utils/queryOptimizer';
import { getConnectionStats } from '@/lib/utils/connectionPool';
import { RefreshCw, Database, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceData {
  summary: ReturnType<typeof getPerformanceSummary>;
  queryAnalysis: ReturnType<typeof queryOptimizer.getPerformanceSummary>;
  connectionStats: ReturnType<typeof getConnectionStats>;
  recentMetrics: Array<{
    operation: string;
    duration: number;
    timestamp: Date;
    success: boolean;
    error?: string;
  }>;
}

export function DatabasePerformanceMonitor() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchPerformanceData = async () => {
    try {
      const summary = getPerformanceSummary();
      const queryAnalysis = queryOptimizer.getPerformanceSummary();
      const connectionStats = getConnectionStats();
      const recentMetrics = performanceMonitor.getRecentMetrics(20);

      setData({
        summary,
        queryAnalysis,
        connectionStats,
        recentMetrics
      });
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'poor': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getEfficiencyIcon = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'poor': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading performance data...</span>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Failed to load performance data
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Database Performance Monitor</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Zap className="w-4 h-4 mr-1" />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPerformanceData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Queries</p>
              <p className="text-2xl font-bold">{data.summary.totalQueries}</p>
            </div>
            <Database className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold">{data.summary.averageResponseTime.toFixed(0)}ms</p>
            </div>
            <Zap className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold">{data.summary.successRate.toFixed(1)}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Slow Queries</p>
              <p className="text-2xl font-bold">{data.summary.slowQueries}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Connection Pool Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Connection Pool Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Active Connections</p>
            <p className="text-xl font-bold text-blue-600">{data.connectionStats.activeConnections}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Idle Connections</p>
            <p className="text-xl font-bold text-green-600">{data.connectionStats.idleConnections}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Connections</p>
            <p className="text-xl font-bold">{data.connectionStats.totalConnections}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Failed Connections</p>
            <p className="text-xl font-bold text-red-600">{data.connectionStats.failedConnections}</p>
          </div>
        </div>
      </Card>

      {/* Query Efficiency Distribution */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Query Efficiency Distribution</h3>
        <div className="space-y-3">
          {Object.entries(data.queryAnalysis.efficiencyDistribution).map(([efficiency, count]) => (
            <div key={efficiency} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getEfficiencyIcon(efficiency)}
                <span className={`capitalize ${getEfficiencyColor(efficiency)}`}>
                  {efficiency}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      efficiency === 'excellent' ? 'bg-green-500' :
                      efficiency === 'good' ? 'bg-blue-500' :
                      efficiency === 'poor' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${(count / data.queryAnalysis.totalQueries) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium w-8">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Slow Queries */}
      {data.queryAnalysis.slowQueries.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            Slow Queries
          </h3>
          <div className="space-y-3">
            {data.queryAnalysis.slowQueries.slice(0, 5).map((query, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{query.queryName}</span>
                  <div className="flex items-center space-x-2">
                    {getEfficiencyIcon(query.efficiency)}
                    <span className="text-sm text-gray-600">
                      {query.executionTime.toFixed(0)}ms
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {query.rowsReturned} rows returned
                </div>
                {query.suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-yellow-700">Suggestions:</p>
                    <ul className="text-sm text-yellow-600 list-disc list-inside">
                      {query.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Query Activity</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {data.recentMetrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-2">
                {metric.success ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">{metric.operation}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{metric.duration.toFixed(0)}ms</span>
                <span>{metric.timestamp.toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default DatabasePerformanceMonitor;