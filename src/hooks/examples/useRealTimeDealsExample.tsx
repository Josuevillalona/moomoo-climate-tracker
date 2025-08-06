import React from 'react';
import { useRealTimeDeals, useRealTimeNotifications } from '../useRealTimeDeals';

/**
 * Example component demonstrating how to use the useRealTimeDeals hook
 * This shows real-time updates, connection status, and notification handling
 */
export function RealTimeDealsExample() {
  const {
    newDeals,
    isConnected,
    connectionError,
    lastUpdate,
    clearNewDeals,
    reconnect,
    newDealsCount,
  } = useRealTimeDeals({
    enabled: true,
    maxNewDeals: 10,
    onNewDeal: (deal) => {
      console.log('New deal received:', deal);
      // You could trigger a notification here
      addNotification(`New deal: ${deal.companyName} raised ${deal.formattedAmount}`, 'success');
    },
    onConnectionChange: (connected) => {
      console.log('Connection status changed:', connected);
      if (connected) {
        addNotification('Real-time updates connected', 'success');
      } else {
        addNotification('Real-time updates disconnected', 'warning');
      }
    },
    onError: (error) => {
      console.error('Real-time error:', error);
      addNotification(`Real-time error: ${error}`, 'error');
    },
  });

  const {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  } = useRealTimeNotifications();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Real-Time Deals Monitor</h1>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          {connectionError && (
            <div className="text-red-600 text-sm">
              Error: {connectionError}
            </div>
          )}
          
          {lastUpdate && (
            <div className="text-gray-600 text-sm">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          
          <button
            onClick={reconnect}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Reconnect
          </button>
        </div>
      </div>

      {/* New Deals Counter */}
      <div className="mb-6 p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            New Deals ({newDealsCount})
          </h2>
          {newDealsCount > 0 && (
            <button
              onClick={clearNewDeals}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* New Deals List */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Recent New Deals</h2>
        {newDeals.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No new deals yet. Waiting for real-time updates...
          </div>
        ) : (
          <div className="space-y-3">
            {newDeals.map((deal) => (
              <div
                key={deal.id}
                className="p-4 border rounded-lg bg-green-50 border-green-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{deal.companyName}</h3>
                    <p className="text-gray-600">
                      {deal.fundingStage} • {deal.formattedAmount} • {deal.climateSector}
                    </p>
                    <p className="text-sm text-gray-500">
                      {deal.country} • {deal.formattedDate}
                    </p>
                    {deal.leadInvestors.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Lead: {deal.leadInvestors.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {deal.daysAgo} days ago
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Notifications</h2>
            <button
              onClick={clearNotifications}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded border-l-4 ${
                  notification.type === 'success'
                    ? 'bg-green-50 border-green-400 text-green-800'
                    : notification.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                    : notification.type === 'error'
                    ? 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-blue-50 border-blue-400 text-blue-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-xs opacity-50 hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">How to test:</h3>
        <ol className="text-sm text-gray-700 space-y-1">
          <li>1. Make sure your Supabase connection is configured</li>
          <li>2. Insert a new row into the 'deals' table in your database</li>
          <li>3. Watch for the new deal to appear in real-time above</li>
          <li>4. Check the connection status and notifications</li>
        </ol>
      </div>
    </div>
  );
}

/**
 * Minimal example showing just the hook usage
 */
export function MinimalRealTimeExample() {
  const { newDeals, isConnected, newDealsCount } = useRealTimeDeals({
    enabled: true,
    onNewDeal: (deal) => {
      console.log('New funding deal:', deal.companyName, deal.formattedAmount);
    },
  });

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>Real-time: {isConnected ? 'Connected' : 'Disconnected'}</span>
        <span>New deals: {newDealsCount}</span>
      </div>
      
      {newDeals.slice(0, 3).map((deal) => (
        <div key={deal.id} className="p-2 border rounded mb-2">
          <strong>{deal.companyName}</strong> - {deal.formattedAmount}
        </div>
      ))}
    </div>
  );
}