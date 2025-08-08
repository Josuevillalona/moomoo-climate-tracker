"use client";

import { useDashboardData } from "@/hooks/useDashboardData";

export default function TestDashboard() {
  const { metrics, recentDeals, loading, error } = useDashboardData({
    recentDealsLimit: 5,
    enableAutoRefresh: false,
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Data Test</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Loading:</strong> {loading ? 'true' : 'false'}
        </div>
        
        <div>
          <strong>Error:</strong> {error || 'null'}
        </div>
        
        <div>
          <strong>Has Metrics:</strong> {metrics ? 'true' : 'false'}
        </div>
        
        <div>
          <strong>Recent Deals Count:</strong> {recentDeals.length}
        </div>
        
        {metrics && (
          <div>
            <h2 className="text-lg font-semibold">Metrics:</h2>
            <pre className="bg-gray-100 p-4 rounded">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </div>
        )}
        
        {recentDeals.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold">Recent Deals:</h2>
            <pre className="bg-gray-100 p-4 rounded">
              {JSON.stringify(recentDeals, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}