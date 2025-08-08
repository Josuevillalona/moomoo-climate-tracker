import React from 'react';
import { useDashboardData } from '../useDashboardData';

/**
 * Example component demonstrating how to use the useDashboardData hook
 * This shows the basic usage patterns and state handling
 */
export function DashboardDataExample() {
  const {
    metrics,
    recentDeals,
    loading,
    error,
    refetch,
    isRefetching,
    lastUpdated,
  } = useDashboardData({
    recentDealsLimit: 5,
    enableAutoRefresh: true,
    autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-800 font-medium">Error loading dashboard data</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={refetch}
            disabled={isRefetching}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            {isRefetching ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with refresh controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Data</h2>
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refetch}
            disabled={isRefetching}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isRefetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Metrics Display */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Total Deals</h3>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalDeals.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Total Funding</h3>
            <p className="text-2xl font-bold text-gray-900">
              ${(metrics.totalFunding / 1000000000).toFixed(1)}B
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Companies</h3>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalCompanies.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Growth Rate</h3>
            <p className="text-2xl font-bold text-gray-900">{metrics.growthRate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Recent Deals Display */}
      {recentDeals.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-4 py-3 border-b">
            <h3 className="text-lg font-medium">Recent Deals</h3>
          </div>
          <div className="divide-y">
            {recentDeals.map((deal) => (
              <div key={deal.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{deal.companyName}</h4>
                    <p className="text-sm text-gray-500">
                      {deal.fundingStage} • {deal.climateSector} • {deal.country}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{deal.formattedAmount}</p>
                    <p className="text-sm text-gray-500">{deal.formattedDate}</p>
                  </div>
                </div>
                {deal.leadInvestors.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Led by: {deal.leadInvestors.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Information */}
      <details className="bg-gray-50 p-4 rounded-lg">
        <summary className="cursor-pointer font-medium">Debug Information</summary>
        <div className="mt-2 space-y-2 text-sm">
          <p><strong>Loading:</strong> {loading.toString()}</p>
          <p><strong>Is Refetching:</strong> {isRefetching.toString()}</p>
          <p><strong>Error:</strong> {error || 'None'}</p>
          <p><strong>Last Updated:</strong> {lastUpdated?.toISOString() || 'Never'}</p>
          <p><strong>Metrics Available:</strong> {!!metrics ? 'Yes' : 'No'}</p>
          <p><strong>Recent Deals Count:</strong> {recentDeals.length}</p>
        </div>
      </details>
    </div>
  );
}

/**
 * Example with custom options
 */
export function CustomDashboardDataExample() {
  const {
    metrics,
    recentDeals,
    loading,
    error,
    refetch,
  } = useDashboardData({
    recentDealsLimit: 10, // Show more deals
    enableAutoRefresh: false, // Disable auto-refresh
  });

  // Similar rendering logic as above...
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Custom Configuration Example</h2>
      <p className="text-gray-600 mb-4">
        This example shows 10 recent deals, has auto-refresh disabled, 
        and uses custom retry settings.
      </p>
      {/* Rest of the component... */}
    </div>
  );
}