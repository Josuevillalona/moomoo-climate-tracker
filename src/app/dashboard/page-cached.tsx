"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Play, 
  Pause,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Activity,
  Target,
  Briefcase,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Home,
  Database,
  History,
  Bookmark,
  PieChart,
  Globe,
  Plus,
  ChevronRight,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";
import { useDashboardDataOptimized } from "@/hooks/useDashboardDataOptimized";
import { useRealTimeDeals } from "@/hooks/useRealTimeDeals";
import { FundingDeal } from "@/types/api";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { 
  MetricsCardLoading,
  TopMetricsLoading,
  ChartCardLoading,
  QuickCountsLoading,
  WorldMapLoading,
  RecentDealsLoading,
  CompanySignalsLoading,
  NewsLoading,
  FundReturnsLoading,
  LoadingTransition,
  SectionLoadingIndicator
} from "@/components/dashboard/LoadingStates";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { 
  SectionErrorBoundary,
  DashboardErrorFallback,
  MetricsErrorFallback,
  ChartErrorFallback,
  RecentDealsErrorFallback,
  WorldMapErrorFallback,
  CompanySignalsErrorFallback,
  NewsErrorFallback,
  FundReturnsErrorFallback,
  SectionErrorDisplay
} from "@/components/dashboard/ErrorFallbacks";
import { NewDealsNotification, CompactNewDealsIndicator, NewDealsBadge } from "@/components/dashboard/NewDealsNotification";
import RealTimeDebug from "@/components/debug/RealTimeDebug";
import { NewDealHighlight, AnimatedDealItem, useNewDealHighlights } from "@/components/dashboard/NewDealHighlight";
import { useNotifications, NotificationContainer } from "@/components/ui/notification";

// Static user data (not from API)
const user = {
  id: "1",
  name: "Alex Chen",
  role: "Climate VC Analyst",
  avatar: "/api/placeholder/150/150",
  email: "alex.chen@climatevc.com"
};

export default function DashboardCached() {
  // Enhanced dashboard options with caching optimizations
  const dashboardOptions = useMemo(() => ({
    recentDealsLimit: 5,
    enableAutoRefresh: true,
    autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
    enableBackgroundRefresh: true,
    backgroundRefreshInterval: 2 * 60 * 1000, // 2 minutes for background
    enableCachePreloading: true,
    enableOptimisticUpdates: true,
    memoryManagement: {
      maxQueries: 50,
      cleanupInterval: 10 * 60 * 1000, // 10 minutes
    },
    onPerformanceMetrics: (metrics: any) => {
      console.log('📊 Dashboard Performance Metrics:', metrics);
    },
  }), []);

  // Use the optimized cached hook
  const { 
    metrics, 
    recentDeals, 
    loading, 
    error, 
    refetch, 
    isRefetching,
    lastUpdated,
    retryCount,
    invalidateCache,
    preloadData,
    clearCache,
    startBackgroundRefresh,
    stopBackgroundRefresh,
    isBackgroundRefreshActive,
    cacheStats,
    optimisticUpdate
  } = useDashboardDataOptimized(dashboardOptions);

  // Memoized callback functions for real-time deals
  const onNewDeal = useCallback((deal: FundingDeal) => {
    console.log('🔴 New deal received:', deal);
    
    // Use optimistic updates for immediate UI feedback
    optimisticUpdate.addDeal(deal);
    
    // Track new deal ID for highlighting
    setNewDealIds(prev => {
      const newSet = new Set(prev);
      newSet.add(deal.id);
      return newSet;
    });
    
    // Invalidate cache to ensure fresh data
    setTimeout(() => {
      invalidateCache();
    }, 1000); // Small delay to allow optimistic update to show first
  }, [optimisticUpdate, invalidateCache]);

  const onConnectionChange = useCallback((connected: boolean) => {
    console.log('🔴 Real-time connection status:', connected);
    if (connected) {
      // Preload data when connection is restored
      preloadData();
    }
  }, [preloadData]);

  const onError = useCallback((error: string) => {
    console.error('🔴 Real-time connection error:', error);
  }, []);

  // Real-time subscription for live updates
  const realTimeOptions = useMemo(() => ({
    enabled: true,
    maxNewDeals: 10,
    onNewDeal,
    onConnectionChange,
    onError
  }), [onNewDeal, onConnectionChange, onError]);

  const { 
    newDeals, 
    isConnected, 
    connectionError, 
    lastUpdate, 
    clearNewDeals, 
    reconnect,
    newDealsCount 
  } = useRealTimeDeals(realTimeOptions);

  // Progressive loading states for different sections
  const [sectionsLoaded, setSectionsLoaded] = useState({
    metrics: false,
    recentDeals: false,
    charts: false,
    news: true // Static data, always "loaded"
  });

  // Enhanced notification system
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const [showNewDealsNotification, setShowNewDealsNotification] = useState(false);
  const [notificationTimeout, setNotificationTimeout] = useState<NodeJS.Timeout | null>(null);
  const [newDealIds, setNewDealIds] = useState<Set<number>>(new Set());
  const { isHighlighted, addHighlight, removeHighlight, clearHighlights } = useNewDealHighlights(Array.from(newDealIds));

  // Cache management state
  const [showCacheStats, setShowCacheStats] = useState(false);

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
      newSectionsLoaded,
      cacheStats
    });
    setSectionsLoaded(newSectionsLoaded);
  }, [metrics, recentDeals, cacheStats]);

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
  }, [newDealsCount, showNewDealsNotification, notificationTimeout, addNotification]);

  // Cleanup notification timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }
    };
  }, [notificationTimeout]);

  // Clear new deal highlights after 15 seconds
  useEffect(() => {
    if (newDealIds.size > 0) {
      const timeout = setTimeout(() => {
        setNewDealIds(new Set());
        clearHighlights();
      }, 15000);
      
      return () => clearTimeout(timeout);
    }
  }, [newDealIds, clearHighlights]);

  // Enhanced refetch with cache management
  const handleRefresh = useCallback(async () => {
    await refetch();
    // Preload related data after refresh
    setTimeout(() => {
      preloadData();
    }, 500);
  }, [refetch, preloadData]);

  // Debug logging with cache information
  console.log('🎯 Dashboard render:', {
    loading,
    error,
    metricsLoaded: !!metrics,
    recentDealsCount: recentDeals?.length || 0,
    sectionsLoaded,
    realTimeConnected: isConnected,
    newDealsCount,
    lastRealTimeUpdate: lastUpdate,
    lastCacheUpdate: lastUpdated,
    backgroundRefreshActive: isBackgroundRefreshActive,
    cacheStats,
    retryCount
  });

  // Show full loading skeleton only on initial load
  if (loading && !metrics && recentDeals.length === 0) {
    console.log('⏳ Dashboard: Showing initial loading state');
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
                retry={handleRefresh}
                sectionName="Dashboard"
                className="text-center"
              />
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  console.log('✅ Dashboard: Rendering main dashboard with optimized caching');

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
    <div className="min-h-screen bg-brand-blue/20 relative overflow-hidden flex">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-brand-yellow/30 rounded-full blur-3xl animate-gentle-pulse"></div>
        <div className="absolute top-1/3 right-20 w-40 h-40 bg-brand-tree-light/30 rounded-full blur-3xl animate-gentle-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-brand-blue/30 rounded-full blur-3xl animate-gentle-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-brand-yellow/20 to-brand-tree-light/20 rounded-full blur-3xl animate-gentle-pulse delay-500"></div>
      </div>
      
      {/* Sidebar */}
      <div className="w-64 bg-brand-blue/95 backdrop-blur-sm text-white flex flex-col relative z-10">
        {/* Logo */}
        <div className="p-6 border-b border-brand-blue/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-brand-charcoal" />
            </div>
            <h1 className="text-xl font-bold font-heading">MooMoo Climate</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="secondary" className="w-full justify-start bg-brand-yellow text-white hover:bg-brand-yellow/90">
            <Home className="w-4 h-4 mr-3" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80">
            <Search className="w-4 h-4 mr-3" />
            Advanced Search
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80">
            <History className="w-4 h-4 mr-3" />
            History
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80">
            <Bookmark className="w-4 h-4 mr-3" />
            Saved Searches
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80">
            <Database className="w-4 h-4 mr-3" />
            Saved Lists
          </Button>
        </nav>

        {/* Cache Management Section (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 border-t border-brand-blue/20">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-white hover:bg-brand-blue/80 text-xs"
              onClick={() => setShowCacheStats(!showCacheStats)}
            >
              <Activity className="w-4 h-4 mr-3" />
              Cache Stats
            </Button>
            {showCacheStats && (
              <div className="mt-2 p-2 bg-brand-blue/50 rounded text-xs space-y-1">
                <div>Queries: {cacheStats.totalQueries}</div>
                <div>Active: {cacheStats.activeQueries}</div>
                <div>Stale: {cacheStats.staleQueries}</div>
                <div>Errors: {cacheStats.errorQueries}</div>
                <div>Size: {Math.round(cacheStats.cacheSize / 1024)}KB</div>
                <div className="flex space-x-1 mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearCache}
                    className="text-xs p-1 h-auto text-white hover:bg-red-500/50"
                  >
                    Clear
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={preloadData}
                    className="text-xs p-1 h-auto text-white hover:bg-green-500/50"
                  >
                    Preload
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-white/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold font-heading text-brand-yellow">MooMoo Climate</h1>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add widgets
                </Button>
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {/* Background refresh toggle */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={isBackgroundRefreshActive ? stopBackgroundRefresh : startBackgroundRefresh}
                  className={isBackgroundRefreshActive ? 'bg-green-50 border-green-200' : ''}
                >
                  {isBackgroundRefreshActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  Auto-refresh
                </Button>
                {/* Real-time connection indicator */}
                <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-100">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                  <span className="text-xs text-gray-600">
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
                {/* Cache status indicator */}
                {lastUpdated && (
                  <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-50">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span className="text-xs text-blue-600">
                      {new Date(lastUpdated).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Climate Data"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>
              <Button variant="ghost" size="sm">
                Help
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarFallback>AC</AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600">{user.name}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </header>

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

          {/* Enhanced new deals notification */}
          <NewDealsNotification
            newDealsCount={newDealsCount}
            isVisible={showNewDealsNotification && newDealsCount > 0}
            onDismiss={() => {
              setShowNewDealsNotification(false);
              clearNewDeals();
            }}
            onViewDeals={() => {
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

          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <LoadingTransition
              isLoading={!sectionsLoaded.metrics}
              loadingComponent={<MetricsCardLoading />}
              delay={0}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Deals</p>
                      <p className="text-2xl font-bold text-brand-charcoal">{metrics?.totalDeals?.toLocaleString() || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-brand-yellow/20 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-brand-yellow" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </LoadingTransition>

            <LoadingTransition
              isLoading={!sectionsLoaded.metrics}
              loadingComponent={<MetricsCardLoading />}
              delay={100}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Funding</p>
                      <p className="text-2xl font-bold text-brand-charcoal">
                        ${((metrics?.totalFunding || 0) / 1000000000).toFixed(1)}B
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-brand-green/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-brand-green" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </LoadingTransition>

            <LoadingTransition
              isLoading={!sectionsLoaded.metrics}
              loadingComponent={<MetricsCardLoading />}
              delay={200}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Companies</p>
                      <p className="text-2xl font-bold text-brand-charcoal">{metrics?.totalCompanies?.toLocaleString() || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-brand-blue/20 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-brand-blue" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </LoadingTransition>

            <LoadingTransition
              isLoading={!sectionsLoaded.metrics}
              loadingComponent={<MetricsCardLoading />}
              delay={300}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load" style={{ animationDelay: '0.3s' }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Investors</p>
                      <p className="text-2xl font-bold text-brand-charcoal">{metrics?.totalInvestors?.toLocaleString() || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-brand-tree-medium/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-brand-tree-medium" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </LoadingTransition>
          </div>

          {/* Recent Deals Section */}
          <div id="recent-deals-section">
            <SectionErrorBoundary
              sectionName="Recent Deals"
              fallback={(error, retry) => (
                <RecentDealsErrorFallback error={error} retry={retry} />
              )}
              resetKeys={[recentDeals.length]}
            >
              <LoadingTransition
                isLoading={!sectionsLoaded.recentDeals}
                loadingComponent={<RecentDealsLoading />}
                delay={400}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load" style={{ animationDelay: '0.4s' }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-brand-charcoal">Recent Funding Rounds</CardTitle>
                      {newDealsCount > 0 && (
                        <NewDealsBadge count={newDealsCount} isVisible={true} />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentDeals.map((deal, index) => (
                        <AnimatedDealItem
                          key={deal.id}
                          deal={deal}
                          isHighlighted={isHighlighted(deal.id)}
                          delay={index * 100}
                        />
                      ))}
                      {recentDeals.length === 0 && sectionsLoaded.recentDeals && (
                        <div className="text-center py-8 text-gray-500">
                          <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No recent deals found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </LoadingTransition>
            </SectionErrorBoundary>
          </div>
        </main>
      </div>
    </div>
    </ErrorBoundary>
  );
}