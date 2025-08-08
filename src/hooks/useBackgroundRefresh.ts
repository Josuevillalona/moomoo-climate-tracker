import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { cacheInvalidation } from '../lib/query/invalidation';

export interface UseBackgroundRefreshOptions {
  /**
   * Interval in milliseconds for background refresh
   * @default 5 * 60 * 1000 (5 minutes)
   */
  interval?: number;
  
  /**
   * Whether to enable background refresh
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Whether to refresh only when the page is visible
   * @default true
   */
  onlyWhenVisible?: boolean;
  
  /**
   * Whether to refresh only stale data
   * @default true
   */
  onlyStale?: boolean;
  
  /**
   * Callback when background refresh starts
   */
  onRefreshStart?: () => void;
  
  /**
   * Callback when background refresh completes
   */
  onRefreshComplete?: () => void;
  
  /**
   * Callback when background refresh fails
   */
  onRefreshError?: (error: Error) => void;
}

export interface UseBackgroundRefreshReturn {
  /**
   * Manually trigger a background refresh
   */
  triggerRefresh: () => Promise<void>;
  
  /**
   * Whether a background refresh is currently in progress
   */
  isRefreshing: boolean;
  
  /**
   * Last time a background refresh was completed
   */
  lastRefresh: Date | null;
  
  /**
   * Start the background refresh interval
   */
  start: () => void;
  
  /**
   * Stop the background refresh interval
   */
  stop: () => void;
  
  /**
   * Whether the background refresh is currently active
   */
  isActive: boolean;
}

export function useBackgroundRefresh(
  options: UseBackgroundRefreshOptions = {}
): UseBackgroundRefreshReturn {
  const {
    interval = 5 * 60 * 1000, // 5 minutes
    enabled = true,
    onlyWhenVisible = true,
    onlyStale = true,
    onRefreshStart,
    onRefreshComplete,
    onRefreshError,
  } = options;

  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const lastRefreshRef = useRef<Date | null>(null);
  const isActiveRef = useRef(false);

  const triggerRefresh = useCallback(async () => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      return;
    }

    // Check visibility if required
    if (onlyWhenVisible && document.visibilityState !== 'visible') {
      return;
    }

    isRefreshingRef.current = true;
    onRefreshStart?.();

    try {
      if (onlyStale) {
        await cacheInvalidation.backgroundRefresh.refreshStale();
      } else {
        await cacheInvalidation.backgroundRefresh.silentRefresh();
      }
      
      lastRefreshRef.current = new Date();
      onRefreshComplete?.();
    } catch (error) {
      console.error('Background refresh failed:', error);
      onRefreshError?.(error instanceof Error ? error : new Error('Unknown refresh error'));
    } finally {
      isRefreshingRef.current = false;
    }
  }, [onlyWhenVisible, onlyStale, onRefreshStart, onRefreshComplete, onRefreshError]);

  const start = useCallback(() => {
    if (intervalRef.current || !enabled) {
      return;
    }

    isActiveRef.current = true;
    intervalRef.current = setInterval(triggerRefresh, interval);
  }, [enabled, interval, triggerRefresh]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      isActiveRef.current = false;
    }
  }, []);

  // Auto-start/stop based on enabled flag
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    return stop;
  }, [enabled, start, stop]);

  // Handle visibility changes
  useEffect(() => {
    if (!onlyWhenVisible) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        // Trigger immediate refresh when page becomes visible
        triggerRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [onlyWhenVisible, enabled, triggerRefresh]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (enabled) {
        // Trigger refresh when coming back online
        triggerRefresh();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [enabled, triggerRefresh]);

  return {
    triggerRefresh,
    isRefreshing: isRefreshingRef.current,
    lastRefresh: lastRefreshRef.current,
    start,
    stop,
    isActive: isActiveRef.current,
  };
}

/**
 * Hook for smart background refresh that adapts to user behavior
 */
export function useSmartBackgroundRefresh(options: UseBackgroundRefreshOptions = {}) {
  const baseOptions = { ...options };
  
  // Adjust refresh interval based on user activity
  useEffect(() => {
    let activityTimeout: NodeJS.Timeout;
    let isUserActive = true;
    
    const resetActivityTimer = () => {
      isUserActive = true;
      clearTimeout(activityTimeout);
      
      // Consider user inactive after 10 minutes of no activity
      activityTimeout = setTimeout(() => {
        isUserActive = false;
      }, 10 * 60 * 1000);
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetActivityTimer, { passive: true });
    });

    resetActivityTimer();

    return () => {
      clearTimeout(activityTimeout);
      events.forEach(event => {
        document.removeEventListener(event, resetActivityTimer);
      });
    };
  }, []);

  return useBackgroundRefresh(baseOptions);
}

export default useBackgroundRefresh;