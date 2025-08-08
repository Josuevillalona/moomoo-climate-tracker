'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealTimeDeals } from '@/hooks/useRealTimeDeals';
import { runFullDiagnostic, testSupabaseRealTime, checkSupabaseRLS } from '@/lib/debug/supabaseTest';

export default function RealTimeDebug() {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [testConnection, setTestConnection] = useState<boolean>(false);

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  // Test basic Supabase connection
  const testSupabaseConnection = async () => {
    addDebugInfo('🧪 Running full diagnostic...');
    const results = await runFullDiagnostic();
    
    addDebugInfo(`📊 Connection: ${results.connection.success ? '✅' : '❌'} ${results.connection.error || 'OK'}`);
    addDebugInfo(`🔒 RLS: ${results.rls.blocked ? '❌ Blocked' : '✅ OK'} ${results.rls.error || ''}`);
    addDebugInfo(`⚡ RT Enabled: ${results.realtimeEnabled.enabled ? '✅' : '❌'} ${results.realtimeEnabled.error || results.realtimeEnabled.message || ''}`);
    addDebugInfo(`📡 RT Test: ${results.realtime.success ? '✅' : '❌'} ${results.realtime.error || 'OK'}`);
    
    if (results.realtimeEnabled.suggestion) {
      addDebugInfo(`💡 ${results.realtimeEnabled.suggestion}`);
    }
  };

  // Test just RLS
  const testRLS = async () => {
    addDebugInfo('🔒 Testing Row Level Security...');
    const result = await checkSupabaseRLS();
    
    if (result.blocked) {
      addDebugInfo(`❌ RLS blocking access: ${result.error}`);
      if (result.suggestion) {
        addDebugInfo(`💡 ${result.suggestion}`);
      }
    } else {
      addDebugInfo(`✅ RLS check passed, found ${result.recordCount} records`);
    }
  };

  // Test just real-time
  const testRealTimeOnly = async () => {
    addDebugInfo('📡 Testing real-time subscription...');
    const result = await testSupabaseRealTime() as { success: boolean; error?: string };
    
    if (result.success) {
      addDebugInfo('✅ Real-time test successful');
    } else {
      addDebugInfo(`❌ Real-time test failed: ${result.error}`);
    }
  };

  // Test real-time subscription
  const {
    newDeals,
    isConnected,
    connectionError,
    lastUpdate,
    reconnect,
    newDealsCount
  } = useRealTimeDeals({
    enabled: testConnection,
    onNewDeal: (deal) => {
      addDebugInfo(`🆕 New deal received: ${(deal as any).company_name} - ${(deal as any).formattedAmount}`);
    },
    onConnectionChange: (connected) => {
      addDebugInfo(`📡 Connection status: ${connected ? 'CONNECTED' : 'DISCONNECTED'}`);
    },
    onError: (error) => {
      addDebugInfo(`❌ Real-time error: ${error}`);
    }
  });

  useEffect(() => {
    addDebugInfo('🚀 RealTimeDebug component mounted');
    testSupabaseConnection();
  }, []);

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Real-Time Connection Debug</h3>
      
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium">
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {connectionError && (
            <span className="text-red-600 text-sm">({connectionError})</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex space-x-2">
          <button
            onClick={() => setTestConnection(!testConnection)}
            className={`px-4 py-2 rounded ${
              testConnection 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {testConnection ? 'Stop Real-Time' : 'Start Real-Time'}
          </button>
          
          <button
            onClick={reconnect}
            disabled={!testConnection}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Reconnect
          </button>
          
          <button
            onClick={testSupabaseConnection}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs"
          >
            Full Test
          </button>
          
          <button
            onClick={testRLS}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs"
          >
            Test RLS
          </button>
          
          <button
            onClick={testRealTimeOnly}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-xs"
          >
            Test RT
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">New Deals:</span> {newDealsCount}
          </div>
          <div>
            <span className="font-medium">Last Update:</span> {lastUpdate?.toLocaleTimeString() || 'Never'}
          </div>
          <div>
            <span className="font-medium">Real-Time:</span> {testConnection ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {/* Recent New Deals */}
        {newDeals.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Recent New Deals:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {newDeals.slice(0, 5).map((deal) => (
                <div key={deal.id} className="text-sm bg-white p-2 rounded">
                  <span className="font-medium">{(deal as any).company_name}</span> - {(deal as any).formattedAmount}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Log */}
        <div>
          <h4 className="font-medium mb-2">Debug Log:</h4>
          <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-64 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <div>No debug info yet...</div>
            ) : (
              debugInfo.map((info, index) => (
                <div key={index}>{info}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}