'use client';

import React, { useState, useEffect } from 'react';
import { climateVCApi } from '../../../lib/api/climate-vc-api';
import { AlexDashboardMetrics, DataSource } from '../../../types/climate-schema';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Globe,
  Rss,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Database,
  Zap,
  BarChart3
} from 'lucide-react';

interface PipelineHealthWidgetProps {
  size?: 'normal' | 'expanded';
  className?: string;
}

interface PipelineMetrics {
  totalSources: number;
  activeSources: number;
  avgReliability: number;
  recentDeals: number;
  errorRate: number;
  lastUpdate: string;
}

const PipelineHealthWidget: React.FC<PipelineHealthWidgetProps> = ({
  size = 'normal',
  className = ''
}) => {
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isExpanded = size === 'expanded';

  useEffect(() => {
    loadPipelineHealth();
  }, []);

  const loadPipelineHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get dashboard metrics which includes pipeline health
      const response = await climateVCApi.getAlexDashboardMetrics();
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        const pipelineHealth = response.data.pipeline_health;
        setMetrics({
          totalSources: pipelineHealth.total_sources,
          activeSources: pipelineHealth.active_sources,
          avgReliability: pipelineHealth.avg_reliability_score,
          recentDeals: pipelineHealth.deals_added_24h,
          errorRate: pipelineHealth.error_rate,
          lastUpdate: pipelineHealth.last_update
        });
      }

      // If expanded, also load individual source details
      if (isExpanded) {
        // This would be a separate API call to get individual data sources
        // For now, we'll simulate some data
        setSources([
          {
            id: '1',
            name: 'TechCrunch',
            type: 'news',
            url: 'https://techcrunch.com',
            is_active: true,
            reliability_score: 0.92,
            last_scraped_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            last_successful_scrape: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            error_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Climate Insider',
            type: 'news',
            url: 'https://climateinsider.com',
            is_active: true,
            reliability_score: 0.95,
            last_scraped_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            last_successful_scrape: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            error_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'CTVC',
            type: 'news',
            url: 'https://www.ctvc.co',
            is_active: true,
            reliability_score: 0.88,
            last_scraped_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            last_successful_scrape: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            error_count: 1,
            last_error_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            last_error_message: 'Rate limit exceeded',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline health');
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = () => {
    if (!metrics) return { status: 'unknown', color: 'gray', icon: Clock };
    
    const healthScore = (metrics.activeSources / metrics.totalSources) * metrics.avgReliability;
    
    if (healthScore >= 0.8) return { status: 'excellent', color: 'green', icon: CheckCircle };
    if (healthScore >= 0.6) return { status: 'good', color: 'blue', icon: Activity };
    if (healthScore >= 0.4) return { status: 'warning', color: 'yellow', icon: AlertTriangle };
    return { status: 'critical', color: 'red', icon: AlertCircle };
  };

  const formatLastUpdate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getSourceStatus = (source: DataSource) => {
    if (!source.is_active) return { color: 'bg-gray-100 text-gray-600', text: 'Inactive' };
    if (source.error_count > 5) return { color: 'bg-red-100 text-red-600', text: 'Errors' };
    if (source.reliability_score < 0.7) return { color: 'bg-yellow-100 text-yellow-600', text: 'Warning' };
    return { color: 'bg-green-100 text-green-600', text: 'Healthy' };
  };

  const health = getHealthStatus();
  const HealthIcon = health.icon;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Pipeline Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Pipeline Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadPipelineHealth} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Pipeline Health</span>
            <Badge 
              variant="secondary" 
              className={`ml-2 bg-${health.color}-100 text-${health.color}-800`}
            >
              <HealthIcon className="w-3 h-3 mr-1" />
              {health.status}
            </Badge>
          </CardTitle>
          
          <Button variant="ghost" size="sm" onClick={loadPipelineHealth}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        {metrics && (
          <div className="mt-4 text-sm text-gray-600">
            Last updated {formatLastUpdate(metrics.lastUpdate)}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {metrics && (
          <div className="space-y-6">
            {/* Overall Health Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-2xl font-bold text-green-600 mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span>{metrics.activeSources}</span>
                  <span className="text-sm text-gray-400">/{metrics.totalSources}</span>
                </div>
                <p className="text-xs text-gray-500">Active Sources</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-2xl font-bold text-blue-600 mb-1">
                  <BarChart3 className="w-5 h-5" />
                  <span>{Math.round(metrics.avgReliability * 100)}%</span>
                </div>
                <p className="text-xs text-gray-500">Avg Reliability</p>
              </div>
            </div>

            {/* Reliability Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Overall Reliability</span>
                <span className="font-medium">{Math.round(metrics.avgReliability * 100)}%</span>
              </div>
              <Progress value={metrics.avgReliability * 100} className="h-2" />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <Database className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">{metrics.recentDeals}</p>
                  <p className="text-xs text-blue-600">Deals (24h)</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                <Zap className="w-4 h-4 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">{Math.round((1 - metrics.errorRate) * 100)}%</p>
                  <p className="text-xs text-green-600">Success Rate</p>
                </div>
              </div>
            </div>

            {/* Individual Sources (Expanded View) */}
            {isExpanded && sources.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Data Sources
                </h4>
                
                <div className="space-y-3">
                  {sources.map((source) => {
                    const status = getSourceStatus(source);
                    
                    return (
                      <div key={source.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Rss className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-medium text-sm">{source.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{source.type}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-sm font-medium">{Math.round(source.reliability_score * 100)}%</p>
                            <p className="text-xs text-gray-500">
                              {source.last_scraped_at && formatLastUpdate(source.last_scraped_at)}
                            </p>
                          </div>
                          
                          <Badge variant="outline" className={`text-xs ${status.color}`}>
                            {status.text}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${health.status === 'excellent' ? 'bg-green-400' : health.status === 'good' ? 'bg-blue-400' : 'bg-yellow-400'} animate-pulse`}></div>
                    <span>Monitoring {metrics.totalSources} sources</span>
                  </div>
                </div>
                
                <Button variant="outline" size="sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PipelineHealthWidget;
