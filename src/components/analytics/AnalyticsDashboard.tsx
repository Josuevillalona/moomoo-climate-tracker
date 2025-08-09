/**
 * Analytics dashboard component for monitoring user behavior and system performance
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  BarChart3, 
  Users, 
  Clock, 
  Activity, 
  TrendingUp, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  MousePointer,
  Search,
  Filter,
  FileDown
} from 'lucide-react';
import { userAnalytics, AnalyticsReport, UserInteractionType } from '../../lib/analytics/userAnalytics';
import useAnalytics from '../../hooks/useAnalytics';

interface AnalyticsDashboardProps {
  refreshInterval?: number;
  showDetails?: boolean;
  timeRange?: { start: Date; end: Date };
}

export function AnalyticsDashboard({ 
  refreshInterval = 10000, 
  showDetails = true,
  timeRange 
}: AnalyticsDashboardProps) {
  const { realTimeMetrics, generateReport, exportData, clearData } = useAnalytics();
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    return timeRange || { start, end };
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'users' | 'features'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Generate report when time range changes
  useEffect(() => {
    setIsLoading(true);
    try {
      const newReport = generateReport(selectedTimeRange);
      setReport(newReport);
    } catch (error) {
      console.error('Error generating analytics report:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange, generateReport]);

  // Auto-refresh report
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        const newReport = generateReport(selectedTimeRange);
        setReport(newReport);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [selectedTimeRange, generateReport, refreshInterval, isLoading]);

  const handleTimeRangeChange = (range: string) => {
    const end = new Date();
    let start: Date;

    switch (range) {
      case '1h':
        start = new Date(end.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    }

    setSelectedTimeRange({ start, end });
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getHealthStatus = (value: number, thresholds: { good: number; warning: number }): {
    status: 'good' | 'warning' | 'critical';
    color: string;
    icon: React.ReactNode;
  } => {
    if (value <= thresholds.good) {
      return { status: 'good', color: 'text-green-600', icon: <CheckCircle className="w-4 h-4" /> };
    } else if (value <= thresholds.warning) {
      return { status: 'warning', color: 'text-yellow-600', icon: <AlertTriangle className="w-4 h-4" /> };
    } else {
      return { status: 'critical', color: 'text-red-600', icon: <XCircle className="w-4 h-4" /> };
    }
  };

  const interactionTypeIcons = {
    [UserInteractionType.CLICK]: <MousePointer className="w-4 h-4" />,
    [UserInteractionType.VIEW]: <Eye className="w-4 h-4" />,
    [UserInteractionType.SEARCH]: <Search className="w-4 h-4" />,
    [UserInteractionType.FILTER]: <Filter className="w-4 h-4" />,
    [UserInteractionType.EXPORT]: <FileDown className="w-4 h-4" />,
    [UserInteractionType.SCROLL]: <Activity className="w-4 h-4" />,
    [UserInteractionType.NAVIGATION]: <Activity className="w-4 h-4" />,
    [UserInteractionType.REFRESH]: <RefreshCw className="w-4 h-4" />,
    [UserInteractionType.HOVER]: <MousePointer className="w-4 h-4" />,
    [UserInteractionType.FOCUS]: <Activity className="w-4 h-4" />,
    [UserInteractionType.RESIZE]: <Activity className="w-4 h-4" />
  };

  if (isLoading && !report) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-500">Loading analytics...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          {/* Time Range Selector */}
          <select 
            className="px-3 py-1 border border-gray-300 rounded text-sm"
            onChange={(e) => handleTimeRangeChange(e.target.value)}
          >
            <option value="1h">Last Hour</option>
            <option value="24h" selected>Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <Button onClick={() => exportData('json')} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button onClick={() => exportData('csv')} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={clearData} variant="outline" size="sm">
            Clear Data
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
          { key: 'performance', label: 'Performance', icon: <Clock className="w-4 h-4" /> },
          { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
          { key: 'features', label: 'Features', icon: <Activity className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Sessions</p>
                    <p className="text-2xl font-bold">{realTimeMetrics.currentSessions}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Avg Load Time</p>
                    <p className="text-2xl font-bold">{formatDuration(realTimeMetrics.averageLoadTime)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Error Rate</p>
                    <p className="text-2xl font-bold">{formatPercentage(realTimeMetrics.errorRate)}</p>
                  </div>
                  <AlertTriangle className={`w-8 h-8 ${realTimeMetrics.errorRate > 5 ? 'text-red-500' : 'text-yellow-500'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Refresh Rate</p>
                    <p className="text-2xl font-bold">{realTimeMetrics.refreshRate}/5min</p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">User Activity</p>
                    <p className="text-2xl font-bold">{realTimeMetrics.userActivity}</p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Historical Metrics */}
          {report && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Session Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Sessions</span>
                    <span className="font-medium">{report.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Users</span>
                    <span className="font-medium">{report.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Avg Session Duration</span>
                    <span className="font-medium">{formatDuration(report.averageSessionDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Bounce Rate</span>
                    <span className="font-medium">{formatPercentage(report.bounceRate)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Load Time</span>
                    <div className="flex items-center space-x-2">
                      {getHealthStatus(report.averageLoadTime, { good: 2000, warning: 3000 }).icon}
                      <span className="font-medium">{formatDuration(report.averageLoadTime)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Success Rate</span>
                    <div className="flex items-center space-x-2">
                      {getHealthStatus(100 - report.performanceMetrics.successRate, { good: 5, warning: 10 }).icon}
                      <span className="font-medium">{formatPercentage(report.performanceMetrics.successRate)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Cache Hit Rate</span>
                    <div className="flex items-center space-x-2">
                      {getHealthStatus(100 - report.performanceMetrics.cacheHitRate, { good: 20, warning: 40 }).icon}
                      <span className="font-medium">{formatPercentage(report.performanceMetrics.cacheHitRate)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Error Rate</span>
                    <div className="flex items-center space-x-2">
                      {getHealthStatus(report.errorRate, { good: 2, warning: 5 }).icon}
                      <span className="font-medium">{formatPercentage(report.errorRate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Engagement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Interactions/Session</span>
                    <span className="font-medium">{report.userEngagement.averageInteractionsPerSession.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Page Views/Session</span>
                    <span className="font-medium">{report.userEngagement.averagePageViewsPerSession.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Return User Rate</span>
                    <span className="font-medium">{formatPercentage(report.userEngagement.returnUserRate)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && report && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Average API Response</span>
                    <span className="font-medium">{formatDuration(report.performanceMetrics.averageApiResponseTime)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((report.performanceMetrics.averageApiResponseTime / 5000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">P95 Load Time</span>
                    <span className="font-medium">{formatDuration(report.performanceMetrics.p95LoadTime)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${Math.min((report.performanceMetrics.p95LoadTime / 10000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Cache Hit Rate</span>
                    <span className="font-medium">{formatPercentage(report.performanceMetrics.cacheHitRate)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${report.performanceMetrics.cacheHitRate}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.recommendations.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <ul className="space-y-2">
                        {report.recommendations.slice(0, 3).map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span>System performance is optimal</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Features Tab */}
      {activeTab === 'features' && report && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Most Used Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.mostUsedFeatures.slice(0, 10).map((feature, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm">{feature.feature}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(feature.usage / Math.max(...report.mostUsedFeatures.map(f => f.usage))) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{feature.usage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboard;