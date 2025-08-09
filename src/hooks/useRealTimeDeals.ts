import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DatabaseDeal, FundingDeal, ApiErrorType, ApiException } from '../types/api';
import { DashboardTransformer } from '../lib/transformers/dashboard';
import { realtimeMonitor, ConnectionEvent, ConnectionState } from '../lib/monitoring/realtimeMonitor';
import { logRealtimeError } from '../lib/monitoring/errorLogger';

export interface UseRealTimeDealsReturn {
  newDeals: FundingDeal[];
  isConnected: boolean;
  connectionError: string | null;
  lastUpdate: Date | null;
  clearNewDeals: () => void;
  reconnect: () => void;
  newDealsCount: number;
}

export interface UseRealTimeDealsOptions {
  enabled?: boolean;
  maxNewDeals?: number; // Maximum number of new deals to keep in memory
  onNewDeal?: (deal: FundingDeal) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: string) => void;
  reconnectAttempts?: number;
  reconnectDelay?: number; // in milliseconds
}

const DEFAULT_OPTIONS: Required<UseRealTimeDealsOptions> = {
  enabled: true,
  maxNewDeals: 50,
  onNewDeal: () => {},
  onConnectionChange: () => {},
  onError: () => {},
  reconnectAttempts: 5,
  reconnectDelay: 2000, // 2 seconds
};

export function useRealTimeDeals(options: UseRealTimeDealsOptions = {}): UseRealTimeDealsReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // State management
  const [newDeals, setNewDeals] = useState<FundingDeal[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Refs for cleanup and preventing stale closures
  const mountedRef = useRef(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const setupSubscriptionRef = useRef<(() => void) | null>(null);

  // Check if Supabase client is available
  useEffect(() => {
    if (!supabase) {
      console.error('❌ Supabase client not available');
      setConnectionError('Supabase client not initialized');
      return;
    }
    console.log('✅ Supabase client available for real-time connections');
  }, []);

  // Cleanup function
  useEffect(() => {
    mountedRef.current = true;
    console.log('🎯 useRealTimeDeals mounted');
    
    return () => {
      console.log('🧹 useRealTimeDeals unmounting');
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Clear new deals function
  const clearNewDeals = useCallback(() => {
    if (mountedRef.current) {
      setNewDeals([]);
    }
  }, []);

  // Handle new deal insertion
  const handleNewDeal = useCallback((payload: RealtimePostgresChangesPayload<DatabaseDeal>) => {
    console.log('🆕 Real-time payload received:', {
      eventType: payload.eventType,
      hasNew: !!payload.new,
      mounted: mountedRef.current
    });

    if (!mountedRef.current || payload.eventType !== 'INSERT' || !payload.new) {
      console.log('⚠️ Ignoring payload:', {
        mounted: mountedRef.current,
        eventType: payload.eventType,
        hasNew: !!payload.new
      });
      return;
    }

    try {
      console.log('🔄 Transforming new deal:', payload.new);
      // Transform the database deal to UI format
      const transformedDeal = DashboardTransformer.transformSingleDeal(payload.new);
      console.log('✅ Deal transformed successfully:', transformedDeal);
      
      if (mountedRef.current) {
        setNewDeals(prev => {
          // Add new deal to the beginning and limit the array size
          const updated = [transformedDeal, ...prev].slice(0, opts.maxNewDeals);
          console.log(`📊 Updated new deals list: ${updated.length} deals`);
          return updated;
        });
        
        setLastUpdate(new Date());
        
        // Call the callback if provided
        opts.onNewDeal(transformedDeal);
        console.log('🎉 New deal processed successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Failed to process new deal: ${error.message}`
        : 'Failed to process new deal: Unknown error';
      
      console.error('❌ Error processing new deal:', error);
      console.error('❌ Payload that caused error:', payload.new);
      
      if (mountedRef.current) {
        setConnectionError(errorMessage);
        opts.onError(errorMessage);
      }
    }
  }, [opts]);

  // Handle connection status changes
  const handleConnectionChange = useCallback((status: string, error?: Error) => {
    if (!mountedRef.current) return;

    const connected = status === 'SUBSCRIBED';
    setIsConnected(connected);
    
    if (connected) {
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
    } else if (error) {
      const errorMessage = `Real-time connection ${status.toLowerCase()}: ${error.message}`;
      setConnectionError(errorMessage);
      opts.onError(errorMessage);
    }
    
    opts.onConnectionChange(connected);
  }, [opts]);

  // Setup real-time subscription
  const setupSubscription = useCallback(() => {
    if (!mountedRef.current || !opts.enabled) return;

    try {
      // Clean up any existing channel first
      if (channelRef.current) {
        console.log('🔄 Cleaning up existing channel before creating new one');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Create a unique channel name to avoid conflicts
      const channelName = `deals-changes-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('🚀 Creating new real-time channel:', channelName);

      // Track connection attempt
      const connectionStartTime = performance.now();
      realtimeMonitor.trackConnectionEvent(
        channelName,
        ConnectionEvent.CONNECT,
        ConnectionState.CONNECTING,
        { channelName, enabled: opts.enabled }
      );

      // Create a new channel for deals table
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'deals'
          },
          handleNewDeal
        )
        .subscribe((status, error) => {
          console.log('📡 Real-time subscription status:', status, error?.message || '');
          
          if (!mountedRef.current) {
            console.log('⚠️ Component unmounted, ignoring status change');
            return;
          }

          // Track connection status changes
          const connectionDuration = performance.now() - connectionStartTime;
          const connectionState = status === 'SUBSCRIBED' ? ConnectionState.CONNECTED :
                                 status === 'CHANNEL_ERROR' ? ConnectionState.ERROR :
                                 status === 'TIMED_OUT' ? ConnectionState.ERROR :
                                 ConnectionState.CONNECTING;

          realtimeMonitor.trackConnectionEvent(
            channelName,
            status === 'SUBSCRIBED' ? ConnectionEvent.CONNECT : ConnectionEvent.ERROR,
            connectionState,
            { status, subscriptionDuration: connectionDuration },
            error,
            connectionDuration
          );

          handleConnectionChange(status, error);
          
          // Attempt reconnection on certain error types
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('🔄 Connection error, attempting reconnect...');
            
            // Log the error
            if (error) {
              logRealtimeError(channelName, 'subscription_error', error);
            }

            // Use the ref to avoid circular dependency
            if (setupSubscriptionRef.current && reconnectAttemptsRef.current < opts.reconnectAttempts) {
              reconnectAttemptsRef.current += 1;
              const delay = opts.reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
              
              console.log(`🔄 Attempting reconnect ${reconnectAttemptsRef.current}/${opts.reconnectAttempts} in ${delay}ms`);
              
              // Track reconnection attempt
              realtimeMonitor.trackReconnection(
                channelName,
                reconnectAttemptsRef.current,
                opts.reconnectAttempts,
                0,
                false,
                error,
                { delay, reason: status }
              );
              
              reconnectTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current) {
                  console.log('🚀 Executing reconnect attempt');
                  // Unsubscribe from existing channel
                  if (channelRef.current) {
                    supabase.removeChannel(channelRef.current);
                    channelRef.current = null;
                  }
                  
                  // Create new subscription using ref
                  setupSubscriptionRef.current?.();
                } else {
                  console.log('⚠️ Component unmounted during reconnect attempt');
                }
              }, delay);
            }
          }
        });

      channelRef.current = channel;
      console.log('✅ Real-time subscription setup complete');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Failed to setup real-time subscription: ${error.message}`
        : 'Failed to setup real-time subscription: Unknown error';
      
      console.error('❌ Real-time setup error:', errorMessage);
      
      // Log the setup error
      logRealtimeError(
        'setup_subscription',
        'subscription_setup_failed',
        error instanceof Error ? error : new Error(errorMessage)
      );
      
      if (mountedRef.current) {
        setConnectionError(errorMessage);
        opts.onError(errorMessage);
      }
    }
  }, [opts.enabled, handleNewDeal, handleConnectionChange, opts]);

  // Update the ref whenever setupSubscription changes
  useEffect(() => {
    setupSubscriptionRef.current = setupSubscription;
  }, [setupSubscription]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (!mountedRef.current) {
      console.log('⚠️ Cannot reconnect: component unmounted');
      return;
    }

    console.log('🔄 Manual reconnect triggered');

    // Reset reconnection attempts
    reconnectAttemptsRef.current = 0;
    
    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Unsubscribe from existing channel
    if (channelRef.current) {
      console.log('🧹 Removing existing channel for reconnect');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Reset connection state
    setIsConnected(false);
    setConnectionError(null);

    // Setup new subscription with a small delay
    setTimeout(() => {
      if (mountedRef.current && setupSubscriptionRef.current) {
        console.log('🚀 Setting up new subscription after reconnect');
        setupSubscriptionRef.current();
      }
    }, 500);
  }, []);

  // Initialize subscription on mount or when enabled changes
  useEffect(() => {
    console.log('🎯 useRealTimeDeals effect triggered, enabled:', opts.enabled);
    
    if (opts.enabled) {
      // Add a small delay to avoid React Strict Mode double-mounting issues
      const timeoutId = setTimeout(() => {
        if (mountedRef.current && setupSubscriptionRef.current) {
          console.log('⏰ Setting up subscription after delay');
          setupSubscriptionRef.current();
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        console.log('🧹 Cleaning up subscription setup timeout');
      };
    } else {
      // Clean up subscription when disabled
      console.log('❌ Real-time disabled, cleaning up');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
      setConnectionError(null);
    }
  }, [opts.enabled]);

  // Separate cleanup effect for unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up real-time resources');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle browser visibility changes to reconnect when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && opts.enabled && !isConnected && mountedRef.current) {
        // Attempt to reconnect when user returns to the tab
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [opts.enabled, isConnected, reconnect]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (opts.enabled && !isConnected && mountedRef.current) {
        reconnect();
      }
    };

    const handleOffline = () => {
      if (mountedRef.current) {
        setIsConnected(false);
        setConnectionError('Network connection lost');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [opts.enabled, isConnected, reconnect]);

  return {
    newDeals,
    isConnected,
    connectionError,
    lastUpdate,
    clearNewDeals,
    reconnect,
    newDealsCount: newDeals.length,
  };
}

// Utility hook for managing real-time notifications
export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
  }>>([]);

  const addNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const notification = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: new Date(),
    };

    setNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep only last 10 notifications
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };
}