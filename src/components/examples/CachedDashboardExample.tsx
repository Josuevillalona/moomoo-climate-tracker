'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useDashboardDataOptimized } from '@/hooks/useDashboardDataOptimized';
import { RefreshCw, Play, Pause, Trash2, Download, Activity } from 'lucide-react';

export function CachedDashboardExample() {
  const [showCacheStats, setShowCacheStats] = useState(false);
  
  const {
    metrics,
    recentDeals,
    loading,
    error,
    refetch,
    isRefetching,
    lastUpdated,
    invalidateCache,
    preloadData,
    clearCache,
    startBackgroundRefresh,
    stopBackgroundRefresh,
    isBackgroundRefreshActive,
    cacheStats,
    optimisticUpdate,
  } = useDashboardDataOptimized({
    recentDealsLimit: 3,
    enableBackgroundRefresh: true,
    backgroundRefreshInterval: 30 * 1000, // 30 seconds for demo
    enableCachePreloading: true,
    enableOptimisticUpdates: true,
    onPerformanceMetrics: (perfMetrics) => {
      console.log('Performance metrics:', perfMetrics);
    },
  });

  const handleOptimisticUpdate = () => {
    // Simulate adding a new deal optimistically
    const newDeal = {
      id: Date.now(),
      companyName: 'Demo Climate Co',
      fundingStage: 'Series A',
      amountRaised: 15000000,
      dateAnnounced: new Date().toISOString(),
      leadInvestors: ['Demo VC'],
      otherInvestors: [],
      climateSector: 'Clean Energy',
      country: 'USA',
      status: 'PROCESSED_AI',
      createdAt: new Date().toISOString(),
      formattedAmount: '$15M',
      formattedDate: 'Today',
      daysAgo: 0,
      allInvestors: ['Demo VC'],
    };

    optimisticUpdate.addDeal(newDeal);
    
    // Also update metrics optimistically
    optimisticUpdate.updateMetrics((current) => ({
      ...current!,
      totalDeals: (current?.totalDeals || 0) + 1,
      totalFunding: (current?.totalFunding || 0) + 15000000,
    }));
  };

  if (loading && !metrics) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !metrics) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={refetch}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Cache Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Cache Management Demo</span>
            <div className="flex items-center space-x-2">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              {isRefetching && (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={refetch}
              disabled={isRefetching}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            <Button
              onClick={isBackgroundRefreshActive ? stopBackgroundRefresh : startBackgroundRefresh}
              variant={isBackgroundRefreshActive ? "default" : "outline"}
              size="sm"
            >
              {isBackgroundRefreshActive ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Auto
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Auto
                </>
              )}
            </Button>
            
            <Button
              onClick={preloadData}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Preload
            </Button>
            
            <Button
              onClick={clearCache}
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
          </div>
          
          <div className="mt-4 flex space-x-4">
            <Button
              onClick={invalidateCache}
              variant="outline"
              size="sm"
            >
              Invalidate Cache
            </Button>
            
            <Button
              onClick={handleOptimisticUpdate}
              variant="outline"
              size="sm"
            >
              Add Optimistic Deal
            </Button>
            
            <Button
              onClick={() => setShowCacheStats(!showCacheStats)}
              variant="outline"
              size="sm"
            >
              <Activity className="w-4 h-4 mr-2" />
              {showCacheStats ? 'Hide' : 'Show'} Stats
            </Button>
          </div>
          
          {showCacheStats && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Cache Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Queries:</span>
                  <div className="text-lg">{cacheStats.totalQueries}</div>
                </div>
                <div>
                  <span className="font-medium">Active:</span>
                  <div className="text-lg text-green-600">{cacheStats.activeQueries}</div>
                </div>
                <div>
                  <span className="font-medium">Stale:</span>
                  <div className="text-lg text-yellow-600">{cacheStats.staleQueries}</div>
                </div>
                <div>
                  <span className="font-medium">Errors:</span>
                  <div className="text-lg text-red-600">{cacheStats.errorQueries}</div>
                </div>
                <div>
                  <span className="font-medium">Cache Size:</span>
                  <div className="text-lg">{Math.round(cacheStats.cacheSize / 1024)}KB</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Background refresh: {isBackgroundRefreshActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Data Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.totalDeals?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Funding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${((metrics?.totalFunding || 0) / 1000000000).toFixed(1)}B
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.totalCompanies?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Deals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deals (Cached)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentDeals.map((deal) => (
              <div key={deal.id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{deal.companyName}</h4>
                  <p className="text-sm text-gray-600">
                    {deal.fundingStage} • {deal.climateSector}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{deal.formattedAmount}</div>
                  <div className="text-sm text-gray-600">{deal.formattedDate}</div>
                </div>
              </div>
            ))}
            {recentDeals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No recent deals found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CachedDashboardExample;