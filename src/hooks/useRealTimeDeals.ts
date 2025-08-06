import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DatabaseDeal, FundingDeal, ApiErrorType, ApiException } from '../types/api';
import { DashboardTransformer } from '../lib/transformers/dashboard';

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

  // Cleanup function
  useEffect(() => {
    return () => {
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
    if (!mountedRef.current || payload.eventType !== 'INSERT' || !payload.new) {
      return;
    }

    try {
      // Transform the database deal to UI format
      const transformedDeal = DashboardTransformer.transformSingleDeal(payload.new);
      
      if (mountedRef.current) {
        setNewDeals(prev => {
          // Add new deal to the beginning and limit the array size
          const updated = [transformedDeal, ...prev].slice(0, opts.maxNewDeals);
          return updated;
        });
        
        setLastUpdate(new Date());
        
        // Call the callback if provided
        opts.onNewDeal(transformedDeal);
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Failed to process new deal: ${error.message}`
        : 'Failed to process new deal: Unknown error';
      
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

  // Reconnect with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (!mountedRef.current || reconnectAttemptsRef.current >= opts.reconnectAttempts) {
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = opts.reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        // Unsubscribe from existing channel
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
        
        // Create new subscription
        setupSubscription();
      }
    }, delay);
  }, [opts.reconnectAttempts, opts.reconnectDelay]);

  // Setup real-time subscription
  const setupSubscription = useCallback(() => {
    if (!mountedRef.current || !opts.enabled) return;

    try {
      // Create a new channel for deals table
      const channel = supabase
        .channel('deals-changes')
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
          handleConnectionChange(status, error);
          
          // Attempt reconnection on certain error types
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            attemptReconnect();
          }
        });

      channelRef.current = channel;
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `Failed to setup real-time subscription: ${error.message}`
        : 'Failed to setup real-time subscription: Unknown error';
      
      if (mountedRef.current) {
        setConnectionError(errorMessage);
        opts.onError(errorMessage);
      }
    }
  }, [opts.enabled, handleNewDeal, handleConnectionChange, attemptReconnect, opts]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (!mountedRef.current) return;

    // Reset reconnection attempts
    reconnectAttemptsRef.current = 0;
    
    // Clear any pending reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Unsubscribe from existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Reset connection state
    setIsConnected(false);
    setConnectionError(null);

    // Setup new subscription
    setupSubscription();
  }, [setupSubscription]);

  // Initialize subscription on mount or when enabled changes
  useEffect(() => {
    if (opts.enabled) {
      setupSubscription();
    } else {
      // Clean up subscription when disabled
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
      setConnectionError(null);
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [opts.enabled, setupSubscription]);

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