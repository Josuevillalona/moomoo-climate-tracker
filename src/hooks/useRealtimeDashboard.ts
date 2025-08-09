import { useState, useEffect, useCallback, useRef } from 'react';
import { FundingDeal } from '@/types/api';
import { useRealTimeDeals } from '@/hooks/useRealTimeDeals';
import { useDashboardAnalytics } from '@/hooks/useAnalytics';
import { RefreshType } from '@/lib/analytics/userAnalytics';
import { useNotifications } from '@/components/ui/notification';
import { useNewDealHighlights } from '@/components/dashboard/NewDealHighlight';

interface UseRealtimeDashboardOptions {
  onRefetch: () => Promise<any>;
}

export function useRealtimeDashboard({ onRefetch }: UseRealtimeDashboardOptions) {
  const analytics = useDashboardAnalytics();
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const [newDealIds, setNewDealIds] = useState<Set<number>>(new Set());
  const { isHighlighted, addHighlight, removeHighlight, clearHighlights } = useNewDealHighlights(Array.from(newDealIds));
  
  const [showNewDealsNotification, setShowNewDealsNotification] = useState(false);
  const [notificationTimeout, setNotificationTimeout] = useState<NodeJS.Timeout | null>(null);

  // Memoized callback functions for real-time deals
  const onNewDeal = useCallback((deal: FundingDeal) => {
    console.log('🔴 New deal received:', deal);
    // Track new deal ID for highlighting
    setNewDealIds(prev => {
      const newSet = new Set(prev);
      newSet.add(deal.id);
      return newSet;
    });
    // Track real-time data refresh
    analytics.trackDataRefresh(RefreshType.REALTIME, 'new-deal', 0, true, {
      dealId: deal.id,
      companyName: deal.companyName,
      recordsUpdated: 1,
      userInitiated: false,
      backgroundRefresh: true
    });
    // Automatically refresh dashboard data when new deal arrives
    onRefetch();
  }, [onRefetch]); // Removed analytics from dependencies

  const onConnectionChange = useCallback((connected: boolean) => {
    console.log('🔴 Real-time connection status:', connected);
  }, []);

  const onError = useCallback((error: string) => {
    console.error('🔴 Real-time connection error:', error);
  }, []);

  // Real-time subscription for live updates
  const realTimeOptions = {
    enabled: true,
    maxNewDeals: 10,
    onNewDeal,
    onConnectionChange,
    onError
  };

  const { 
    newDeals, 
    isConnected, 
    connectionError, 
    lastUpdate, 
    clearNewDeals, 
    reconnect,
    newDealsCount 
  } = useRealTimeDeals(realTimeOptions);

  // Handle new deals notifications with enhanced system
  useEffect(() => {
    if (newDealsCount > 0 && !showNewDealsNotification) {
      setShowNewDealsNotification(true);
      
      // Add system notification
      addNotification({
        type: 'success',
        title: 'New Funding Data',
        message: `${newDealsCount} new deal${newDealsCount > 1 ? 's' : ''} added to the dashboard`,
        duration: 4000,
      });
      
      // Clear any existing timeout
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }
      
      // Auto-hide main notification after 6 seconds
      const timeout = setTimeout(() => {
        setShowNewDealsNotification(false);
      }, 6000);
      
      setNotificationTimeout(timeout);
    }
  }, [newDealsCount, showNewDealsNotification]); // Removed notificationTimeout

  // Cleanup notification timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }
    };
  }, []); // Run only on unmount

  // Clear new deal highlights after 15 seconds
  useEffect(() => {
    if (newDealIds.size > 0) {
      const timeout = setTimeout(() => {
        setNewDealIds(new Set());
        clearHighlights();
      }, 15000);
      
      return () => clearTimeout(timeout);
    }
  }, [newDealIds]); // Removed clearHighlights from dependencies

  return {
    // Real-time state
    newDeals,
    isConnected,
    connectionError,
    lastUpdate,
    newDealsCount,
    clearNewDeals,
    reconnect,
    
    // Notifications
    notifications,
    addNotification,
    dismissNotification,
    showNewDealsNotification,
    setShowNewDealsNotification,
    
    // Deal highlights
    newDealIds,
    setNewDealIds,
    isHighlighted,
    addHighlight,
    removeHighlight,
    clearHighlights
  };
}
