'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import AlexProspectsWidget from './AlexProspectsWidget';
import AIFocusedDealsWidget from './AIFocusedDealsWidget';
import PipelineHealthWidget from './PipelineHealthWidget';
import { climateVCApi } from '../../../lib/api/climate-vc-api';
import { AlexDashboardMetrics } from '../../../types/climate-schema';
import { 
  Star, 
  Brain, 
  TrendingUp, 
  Activity,
  DollarSign,
  Building2,
  Users,
  Globe,
  Zap,
  Settings,
  RefreshCw,
  BarChart3,
  Filter
} from 'lucide-react';

interface AlexDashboardProps {
  className?: string;
}

const AlexDashboard: React.FC<AlexDashboardProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<AlexDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardMetrics();
    
    // Set up real-time subscription for high-score deals
    const subscription = climateVCApi.subscribeToHighScoreDeals((payload) => {
      console.log('New high-score deal:', payload);
      // Refresh metrics when new high-score deals come in
      loadDashboardMetrics();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loadDashboardMetrics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await climateVCApi.getAlexDashboardMetrics();
      
      if (response.error) {
        setError(response.error);
      } else {
        setMetrics(response.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const formatLastUpdated = () => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return lastUpdated.toLocaleDateString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Alex's Climate VC Dashboard</h1>
          <p className="text-gray-600">AI-powered deal flow intelligence for climate tech investments</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Last updated: {formatLastUpdated()}
          </div>
          <Button onClick={loadDashboardMetrics} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="default" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Deals */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.total_deals.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{metrics.deals_this_week} this week
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* High Score Deals */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Score Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.high_score_deals}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {metrics.deals_requiring_review} need review
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Funding */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Funding</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(metrics.total_funding_usd)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Avg: {formatAmount(metrics.average_deal_size)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Health */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pipeline Health</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(metrics.pipeline_health.avg_reliability_score * 100)}%
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {metrics.pipeline_health.active_sources}/{metrics.pipeline_health.total_sources} sources active
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top AI Sectors Breakdown */}
      {metrics && metrics.top_ai_sectors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span>Top Climate AI Sectors</span>
              <Badge variant="secondary" className="ml-2">
                {metrics.top_ai_sectors.length} sectors
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.top_ai_sectors.slice(0, 6).map((sector, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm text-gray-900">
                      {sector.sector.replace('Climate Tech - ', '')}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {sector.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{sector.deal_count} deals</span>
                    <span>{formatAmount(sector.total_funding)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Avg Score:</span>
                    <span className="font-medium text-purple-600">
                      {sector.avg_investment_score.toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alex's Top Prospects - Full width on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2">
          <AlexProspectsWidget size="expanded" />
        </div>
        
        {/* Pipeline Health - 1/3 width on desktop */}
        <div className="lg:col-span-1">
          <PipelineHealthWidget size="expanded" />
        </div>
      </div>

      {/* AI-Focused Deals - Full width */}
      <div className="grid grid-cols-1">
        <AIFocusedDealsWidget size="expanded" />
      </div>

      {/* Additional Features Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Filter className="w-4 h-4 mr-2" />
              Adjust AI Filters
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Building2 className="w-4 h-4 mr-2" />
              Export Deal List
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Investor Network
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-600">New high-score deal detected</span>
                <span className="text-xs text-gray-400">2m ago</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-600">Filter settings updated</span>
                <span className="text-xs text-gray-400">15m ago</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-600">AI sector analysis complete</span>
                <span className="text-xs text-gray-400">1h ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span>AI Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="font-medium text-purple-900 mb-1">Trending Sector</p>
                <p className="text-purple-700">Energy Storage deals up 40% this week</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900 mb-1">Investment Pattern</p>
                <p className="text-blue-700">Series A rounds showing strong AI focus</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <Activity className="w-5 h-5" />
              <span className="font-medium">Dashboard Error</span>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
            <Button 
              onClick={loadDashboardMetrics} 
              variant="outline" 
              size="sm" 
              className="mt-3 border-red-200 text-red-800 hover:bg-red-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AlexDashboard;
