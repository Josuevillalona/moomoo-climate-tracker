"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardAnalytics } from "@/hooks/useAnalytics";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { RefreshType } from "@/lib/analytics/userAnalytics";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardErrorFallback, SectionErrorDisplay } from "@/components/dashboard/ErrorFallbacks";
import { NewDealsNotification, CompactNewDealsIndicator, NewDealsBadge } from "@/components/dashboard/NewDealsNotification";
import { AnimatedDealItem } from "@/components/dashboard/NewDealHighlight";
import { NotificationContainer } from "@/components/ui/notification";
import { Card, CardContent } from "@/components/ui/card";

// Extracted components
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricsSection from "@/components/dashboard/MetricsSection";
import ChartsSection from "@/components/dashboard/ChartsSection";
import RecentDealsSection from "@/components/dashboard/RecentDealsSection";
import CompanySignalsSection from "@/components/dashboard/CompanySignalsSection";
import NewsSection from "@/components/dashboard/NewsSection";
import FundReturnsSection from "@/components/dashboard/FundReturnsSection";

// Static user data (not from API)
const user = {
  id: "1",
  name: "Alex Chen",
  role: "Climate VC Analyst",
  avatar: "/api/placeholder/150/150",
  email: "alex.chen@climatevc.com"
};

export default function Dashboard() {
  const dashboardOptions = useMemo(() => ({
    recentDealsLimit: 5,
    enableAutoRefresh: true,
    autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
  }), []);

  const { metrics, recentDeals, loading, error, refetch, isRefetching } = useDashboardData(dashboardOptions);
  
  // Analytics tracking with auto-tracking disabled to prevent conflicts
  const analytics = useDashboardAnalytics();
  const dashboardLoadStart = useRef<number>(Date.now());
  const loadTracked = useRef<boolean>(false); // Prevent multiple load tracking calls

  // Real-time dashboard functionality
  const {
    newDeals,
    isConnected,
    connectionError,
    lastUpdate,
    newDealsCount,
    clearNewDeals,
    reconnect,
    notifications,
    addNotification,
    dismissNotification,
    showNewDealsNotification,
    setShowNewDealsNotification,
    newDealIds,
    setNewDealIds,
    isHighlighted,
    addHighlight,
    removeHighlight,
    clearHighlights
  } = useRealtimeDashboard({ onRefetch: refetch });

  // Progressive loading states for different sections
  const [sectionsLoaded, setSectionsLoaded] = useState({
    metrics: false,
    recentDeals: false,
    charts: false,
    news: true // Static data, always "loaded"
  });

  // Update section loading states based on data availability
  useEffect(() => {
    const newSectionsLoaded = {
      metrics: !!metrics,
      recentDeals: recentDeals.length > 0,
      charts: !!metrics, // Charts depend on metrics
      news: true
    };
    console.log('🎯 Dashboard: Updating sectionsLoaded:', {
      hasMetrics: !!metrics,
      recentDealsCount: recentDeals.length,
      newSectionsLoaded
    });
    setSectionsLoaded(newSectionsLoaded);

    // Track dashboard load completion when all sections are loaded (only once per session)
    if (newSectionsLoaded.metrics && newSectionsLoaded.recentDeals && !loading && !loadTracked.current) {
      const loadTime = Date.now() - dashboardLoadStart.current;
      loadTracked.current = true; // Mark as tracked to prevent duplicate calls
      
      console.log('📊 Dashboard: Tracking load completion:', {
        loadTime,
        apiCalls: 2,
        errors: error ? 1 : 0
      });
      
      analytics.trackDashboardLoad({
        totalLoadTime: loadTime,
        apiCallsCount: 2, // metrics + recent deals
        errorCount: error ? 1 : 0,
        sessionId: analytics.sessionId,
        timestamp: new Date()
      });
    }
  }, [metrics, recentDeals, loading, error]); // Removed analytics from dependencies

  // Reset load tracking when component unmounts or dashboard reloads
  useEffect(() => {
    return () => {
      loadTracked.current = false;
    };
  }, []);

  // Debug logging (throttled to reduce spam)
  const logThrottleRef = useRef<number>(0);
  const now = Date.now();
  if (now - logThrottleRef.current > 5000) { // Log at most every 5 seconds
    console.log('🎯 Dashboard render:', {
      loading,
      error,
      metricsLoaded: !!metrics,
      recentDealsCount: recentDeals?.length || 0,
      sectionsLoaded,
      realTimeConnected: isConnected,
      newDealsCount,
      lastRealTimeUpdate: lastUpdate
    });
    logThrottleRef.current = now;
  }

  // Enhanced refresh function with analytics
  const handleRefresh = () => {
    analytics.trackFeatureUsage('dashboard-refresh', { source: 'header-button' });
    analytics.startOperation('manual-refresh');
    refetch().finally(() => {
      analytics.endOperation('manual-refresh', true, { source: 'header-button' });
    });
  };

  // Navigation handler
  const handleNavigationClick = (feature: string) => {
    analytics.trackFeatureUsage(feature);
  };

  // Show full loading skeleton only on initial load
  if (loading && !metrics && recentDeals.length === 0) {
    console.log('⏳ Dashboard: Showing initial loading state', {
      loading,
      hasMetrics: !!metrics,
      recentDealsLength: recentDeals.length,
      shouldShowLoading: loading && !metrics && recentDeals.length === 0
    });
    return <DashboardSkeleton />;
  }

  // Show error state with retry option - only for complete failure
  if (error && !metrics && recentDeals.length === 0) {
    console.error('❌ Dashboard: Showing error state:', error);
    return (
      <ErrorBoundary
        fallback={(appError, retry) => (
          <DashboardErrorFallback error={appError} retry={retry} />
        )}
        maxRetries={3}
      >
        <div className="min-h-screen bg-brand-blue/20 flex items-center justify-center">
          <Card className="max-w-md mx-auto bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <SectionErrorDisplay
                error={{
                  type: 'DATABASE_ERROR' as any,
                  message: error,
                  retryable: true,
                  timestamp: new Date(),
                  userMessage: error,
                  technicalDetails: 'Dashboard data fetch failed'
                }}
                retry={refetch}
                sectionName="Dashboard"
                className="text-center"
              />
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  console.log('✅ Dashboard: Rendering main dashboard with progressive loading');

  return (
    <ErrorBoundary
      fallback={(appError, retry) => (
        <DashboardErrorFallback error={appError} retry={retry} />
      )}
      onError={(appError) => {
        console.error('Global dashboard error:', appError);
      }}
      maxRetries={3}
      resetKeys={[metrics?.totalDeals, recentDeals.length].filter(key => key !== undefined)}
    >
      <DashboardBackground>
        {/* Sidebar */}
        <DashboardSidebar onNavigationClick={handleNavigationClick} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative z-10">
          {/* Header */}
          <DashboardHeader
            user={user}
            isConnected={isConnected}
            isRefetching={isRefetching}
            onRefresh={handleRefresh}
            onFeatureUsage={analytics.trackFeatureUsage}
          />

          {/* Dashboard Content */}
          <main className="flex-1 p-6 space-y-6 overflow-auto relative z-10">
            {/* Refresh indicator */}
            {isRefetching && (
              <div className="fixed top-20 right-6 z-50 bg-brand-yellow/90 backdrop-blur-sm text-brand-charcoal px-4 py-2 rounded-lg shadow-lg animate-slide-up">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Refreshing data...</span>
                </div>
              </div>
            )}

            {/* Real-time connection status indicator */}
            {!isConnected && (
              <div className="fixed top-20 left-6 z-50 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Real-time updates disconnected</span>
                  <button 
                    onClick={reconnect}
                    className="text-white hover:bg-red-600/50 px-2 py-1 rounded text-sm"
                  >
                    Reconnect
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced new deals notification */}
            <NewDealsNotification
              newDealsCount={newDealsCount}
              isVisible={showNewDealsNotification && newDealsCount > 0}
              onDismiss={() => {
                setShowNewDealsNotification(false);
                clearNewDeals();
              }}
              onViewDeals={() => {
                // Scroll to recent deals section
                const recentDealsSection = document.getElementById('recent-deals-section');
                recentDealsSection?.scrollIntoView({ behavior: 'smooth' });
                setShowNewDealsNotification(false);
              }}
              autoHideDuration={6000}
            />

            {/* System notifications container */}
            <NotificationContainer
              notifications={notifications}
              position="top-right"
              maxNotifications={3}
            />

            {/* Top Row - Charts and Stats */}
            <ChartsSection metrics={metrics} sectionsLoaded={sectionsLoaded} />

            {/* Second Row - Recent Deals (Expanded), Company Signals, News */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Enhanced Recent Funding Rounds Widget - Responsive sizing */}
              <div className="col-span-1 md:col-span-2 lg:col-span-2">
                <RecentDealsSection 
                  recentDeals={recentDeals}
                  metrics={metrics}
                  sectionsLoaded={sectionsLoaded}
                  newDealsCount={newDealsCount}
                  newDealIds={newDealIds}
                  clearNewDeals={clearNewDeals}
                  onRefetch={refetch}
                  size="expanded"
                />
              </div>
              
              {/* Company Signals - Responsive sizing */}
              <div className="col-span-1 md:col-span-1 lg:col-span-1">
                <CompanySignalsSection 
                  recentDeals={recentDeals}
                  metrics={metrics}
                  sectionsLoaded={sectionsLoaded}
                />
              </div>
              
              {/* News Section - Responsive sizing */}
              <div className="col-span-1 md:col-span-1 lg:col-span-1">
                <NewsSection />
              </div>
            </div>

            {/* Third Row - Metrics and Fund Returns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FundReturnsSection 
                metrics={metrics}
                sectionsLoaded={sectionsLoaded}
              />
              <MetricsSection 
                metrics={metrics}
                sectionsLoaded={sectionsLoaded}
                onRefetch={refetch}
              />
            </div>
          </main>
        </div>
      </DashboardBackground>
    </ErrorBoundary>
  );
}
