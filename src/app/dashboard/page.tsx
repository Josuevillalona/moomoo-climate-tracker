"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { useDashboardData } from "@/hooks/useDashboardData";
import { useRealTimeDeals } from "@/hooks/useRealTimeDeals";
import { FundingDeal } from "@/types/api";
import { useDashboardAnalytics } from "@/hooks/useAnalytics";
import { RefreshType } from "@/lib/analytics/userAnalytics";
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

// Static news data (placeholder until news API is implemented)
const newsItems = [
  {
    title: "Climate Tech Funding Reaches Record Highs",
    description: "Investment in climate technology companies continues to grow as investors seek sustainable solutions...",
    date: "2w",
    source: "Climate Tech News"
  },
  {
    title: "New Carbon Capture Technologies Show Promise",
    description: "Recent breakthroughs in direct air capture technology are attracting significant venture capital...",
    date: "3w",
    source: "Climate Tech News"
  },
  {
    title: "Renewable Energy Startups Lead Funding Rounds",
    description: "Solar and wind energy companies dominate the latest funding announcements in the climate sector...",
    date: "4w",
    source: "Climate Tech News"
  }
];

export default function Dashboard() {
  const dashboardOptions = useMemo(() => ({
    recentDealsLimit: 5,
    enableAutoRefresh: true,
    autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
  }), []);

  const { metrics, recentDeals, loading, error, refetch, isRefetching } = useDashboardData(dashboardOptions);
  
  // Analytics tracking
  const analytics = useDashboardAnalytics();
  const dashboardLoadStart = useRef<number>(Date.now());

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
      companyName: deal.company_name,
      recordsUpdated: 1,
      userInitiated: false,
      backgroundRefresh: true
    });
    // Automatically refresh dashboard data when new deal arrives
    refetch();
  }, [refetch, analytics]);

  const onConnectionChange = useCallback((connected: boolean) => {
    console.log('🔴 Real-time connection status:', connected);
  }, []);

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

    // Track dashboard load completion when all sections are loaded
    if (newSectionsLoaded.metrics && newSectionsLoaded.recentDeals && !loading) {
      const loadTime = Date.now() - dashboardLoadStart.current;
      analytics.trackDashboardLoad({
        totalLoadTime: loadTime,
        apiCallsCount: 2, // metrics + recent deals
        errorCount: error ? 1 : 0,
        sessionId: analytics.sessionId,
        timestamp: new Date()
      });
    }
  }, [metrics, recentDeals, loading, error, analytics]);

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

  // Debug logging
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
    <div className="min-h-screen bg-brand-blue/20 relative overflow-hidden flex">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-brand-yellow/30 rounded-full blur-3xl animate-gentle-pulse"></div>
        <div className="absolute top-1/3 right-20 w-40 h-40 bg-brand-tree-light/30 rounded-full blur-3xl animate-gentle-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-brand-blue/30 rounded-full blur-3xl animate-gentle-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-brand-yellow/20 to-brand-tree-light/20 rounded-full blur-3xl animate-gentle-pulse delay-500"></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232E5E4E' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 right-1/4 w-4 h-4 bg-brand-yellow/40 rounded-full animate-float delay-300"></div>
        <div className="absolute bottom-1/3 right-10 w-3 h-3 bg-brand-tree-medium/50 rounded-full animate-float delay-700"></div>
        <div className="absolute top-1/2 left-10 w-5 h-5 bg-brand-blue/40 rounded-full animate-float delay-1100"></div>
        
        {/* Drifting Elements */}
        <div className="absolute top-1/4 left-1/3 w-6 h-6 bg-brand-yellow/30 rounded-full animate-drift"></div>
        <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-brand-tree-light/40 rounded-full animate-drift delay-1500"></div>
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
          <Button 
            variant="secondary" 
            className="w-full justify-start bg-brand-yellow text-white hover:bg-brand-yellow/90"
            onClick={() => analytics.trackFeatureUsage('navigation-dashboard')}
          >
            <Home className="w-4 h-4 mr-3" />
            Dashboard
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white hover:bg-brand-blue/80"
            onClick={() => analytics.trackFeatureUsage('navigation-search')}
          >
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
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80">
            <FileText className="w-4 h-4 mr-3" />
            Reports
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80">
            <MessageSquare className="w-4 h-4 mr-3" />
            News
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80">
            <Activity className="w-4 h-4 mr-3" />
            Plugins & Apps
          </Button>
        </nav>

        {/* Hide Sidebar Button */}
        <div className="p-4 border-t border-brand-blue/20">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-blue/80">
            <ChevronRight className="w-4 h-4 mr-3" />
            Hide Sidebar
          </Button>
        </div>
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
                <Button variant="outline" size="sm" onClick={() => {
                  analytics.trackFeatureUsage('dashboard-refresh', { source: 'header-button' });
                  analytics.startOperation('manual-refresh');
                  refetch().finally(() => {
                    analytics.endOperation('manual-refresh', true, { source: 'header-button' });
                  });
                }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                {/* Real-time connection indicator */}
                <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-100">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                  <span className="text-xs text-gray-600">
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
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

          {/* Real-time connection status indicator */}
          {!isConnected && (
            <div className="fixed top-20 left-6 z-50 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Real-time updates disconnected</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={reconnect}
                  className="text-white hover:bg-red-600/50 p-1 h-auto"
                >
                  Reconnect
                </Button>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Closed Deals Chart */}
            <SectionErrorBoundary
              sectionName="Closed Deals Chart"
              fallback={(error, retry) => (
                <ChartErrorFallback error={error} retry={retry} />
              )}
              resetKeys={[metrics?.totalDeals].filter(key => key !== undefined)}
            >
              <LoadingTransition
                isLoading={!sectionsLoaded.charts}
                loadingComponent={<ChartCardLoading />}
                delay={100}
              >
                <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">CLOSED DEALS</CardTitle>
                      <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-center justify-center">
                      <div className="w-full space-y-2">
                        <div className="flex justify-between text-xs text-brand-charcoal/70">
                          <span>$10M</span>
                          <span>7,000</span>
                        </div>
                        <div className="h-32 bg-gradient-to-r from-brand-green/80 to-brand-yellow/80 rounded-lg relative overflow-hidden shadow-inner">
                          <div className="absolute inset-0 bg-gradient-to-t from-brand-green/30 to-transparent"></div>
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-brand-yellow/20 to-brand-blue/10"></div>
                          {/* Simulated line chart */}
                          <svg className="w-full h-full" viewBox="0 0 300 120">
                            <path
                              d="M 20 80 Q 80 60 120 70 T 200 50 T 280 65"
                              stroke="#F7D774"
                              strokeWidth="3"
                              fill="none"
                              className="drop-shadow-sm"
                            />
                            <path
                              d="M 20 90 Q 80 75 120 80 T 200 65 T 280 75"
                              stroke="#2E5E4E"
                              strokeWidth="3"
                              fill="none"
                              className="drop-shadow-sm"
                            />
                          </svg>
                        </div>
                        <div className="flex justify-between text-xs text-brand-charcoal/70">
                          <span>Oct</span>
                          <span>Nov</span>
                          <span>Dec</span>
                          <span>Jan</span>
                          <span>Feb</span>
                          <span>Mar</span>
                          <span>Apr</span>
                          <span>May</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs">
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-brand-yellow rounded-sm"></div>
                            <span># of Deals</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 bg-brand-green rounded-sm"></div>
                            <span>Median Deal Size ($)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </LoadingTransition>
            </SectionErrorBoundary>

            {/* Quick Counts */}
            <SectionErrorBoundary
              sectionName="Quick Counts"
              fallback={(error, retry) => (
                <MetricsErrorFallback error={error} retry={retry} />
              )}
              resetKeys={[metrics?.totalDeals, metrics?.topSectors?.length].filter(key => key !== undefined)}
            >
              <LoadingTransition
                isLoading={!sectionsLoaded.metrics}
                loadingComponent={<QuickCountsLoading />}
                delay={200}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load" style={{ animationDelay: '0.1s' }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">QUICK COUNTS</CardTitle>
                      <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Display error state if no sectors but metrics exist */}
                      {sectionsLoaded.metrics && (!metrics?.topSectors || metrics.topSectors.length === 0) && (
                        <SectionErrorDisplay
                          error={{
                            type: 'NOT_FOUND_ERROR' as any,
                            message: 'No sector data available',
                            retryable: true,
                            timestamp: new Date(),
                            userMessage: 'No sector breakdown data is currently available',
                            technicalDetails: 'Sector metrics calculation failed'
                          }}
                          retry={refetch}
                          sectionName="Sector Data"
                          className="py-4"
                        />
                      )}
                      
                      {/* Top Sectors */}
                      {metrics?.topSectors?.slice(0, 6).map((sector, index) => (
                        <div key={index} className="flex justify-between items-center animate-loading-fade" style={{ animationDelay: `${index * 0.1}s` }}>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-700">{sector.sector}</span>
                              <span className="text-sm font-medium">{sector.dealCount}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Deals</span>
                              <span>${(sector.totalFunding / 1000000).toFixed(1)}M</span>
                            </div>
                          </div>
                        </div>
                      )) || 
                      // Fallback if no sector data and still loading
                      (!sectionsLoaded.metrics && Array.from({ length: 6 }, (_, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-700">Loading...</span>
                              <span className="text-sm font-medium">-</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>-</span>
                              <span>-</span>
                            </div>
                          </div>
                        </div>
                      )))}
                    </div>
                  </CardContent>
                </Card>
              </LoadingTransition>
            </SectionErrorBoundary>

            {/* Deals by Regions - World Map */}
            <SectionErrorBoundary
              sectionName="Regional Data"
              fallback={(error, retry) => (
                <WorldMapErrorFallback error={error} retry={retry} />
              )}
              resetKeys={[metrics?.totalDeals].filter(key => key !== undefined)}
            >
              <LoadingTransition
                isLoading={!sectionsLoaded.charts}
                loadingComponent={<WorldMapLoading />}
                delay={300}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load" style={{ animationDelay: '0.2s' }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">DEALS BY REGIONS</CardTitle>
                      <div className="flex items-center space-x-2">
                        <select className="text-xs border border-gray-300 rounded px-2 py-1">
                          <option>World ({metrics?.totalDeals || 0})</option>
                        </select>
                        <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-gradient-to-br from-brand-blue/30 via-brand-yellow/20 to-brand-green/30 rounded-lg flex items-center justify-center relative overflow-hidden shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-green/10 to-brand-blue/10"></div>
                      <div className="text-center">
                        <Globe className="w-16 h-16 text-brand-green mx-auto mb-2" />
                        <p className="text-sm text-brand-charcoal/70">World Map Visualization</p>
                        <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>0</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-brand-green rounded-full"></div>
                            <span>1-5</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-brand-yellow rounded-full"></div>
                            <span>6-20</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            <span>&gt;20</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </LoadingTransition>
            </SectionErrorBoundary>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Funding Rounds */}
            <SectionErrorBoundary
              sectionName="Recent Funding Rounds"
              fallback={(error, retry) => (
                <RecentDealsErrorFallback error={error} retry={retry} />
              )}
              resetKeys={[recentDeals.length].filter(key => key !== undefined)}
            >
              <LoadingTransition
                isLoading={!sectionsLoaded.recentDeals}
                loadingComponent={<RecentDealsLoading />}
                delay={400}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load" style={{ animationDelay: '0.3s' }} id="recent-deals-section">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">RECENT FUNDING ROUNDS</CardTitle>
                        {/* New deals badge */}
                        <div className="relative">
                          <NewDealsBadge 
                            count={newDealsCount} 
                            isVisible={newDealsCount > 0} 
                            size="sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Compact new deals indicator */}
                        <CompactNewDealsIndicator
                          newDealsCount={newDealsCount}
                          isVisible={newDealsCount > 0}
                          onClick={() => {
                            // Clear new deals and refresh
                            clearNewDeals();
                            refetch();
                          }}
                        />
                        <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs font-medium text-gray-600 border-b pb-2">
                        <span>Company</span>
                        <span>Type</span>
                        <span>Date</span>
                      </div>
                      {recentDeals.length > 0 ? recentDeals.map((deal, index) => {
                        const isNewDeal = newDealIds.has(deal.id);
                        return (
                          <AnimatedDealItem
                            key={deal.id}
                            deal={deal}
                            isNew={isNewDeal}
                            index={index}
                          >
                            <div className="flex justify-between items-center text-sm rounded-lg px-2 py-1 transition-all duration-300">
                              <span className={`hover:underline cursor-pointer ${isNewDeal ? 'text-green-700 font-medium' : 'text-blue-600'}`}>
                                {deal.companyName}
                              </span>
                              <span className="text-gray-600">{deal.fundingStage || 'N/A'}</span>
                              <span className="text-gray-500">{deal.formattedDate}</span>
                            </div>
                          </AnimatedDealItem>
                        );
                      }) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">No recent deals available</p>
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        View All ({metrics?.totalDeals || 0})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </LoadingTransition>
            </SectionErrorBoundary>

            {/* Top Company Signals */}
            <SectionErrorBoundary
              sectionName="Company Signals"
              fallback={(error, retry) => (
                <CompanySignalsErrorFallback error={error} retry={retry} />
              )}
              resetKeys={[recentDeals.length, metrics?.growthRate].filter(key => key !== undefined)}
            >
            <LoadingTransition
              isLoading={!sectionsLoaded.recentDeals}
              loadingComponent={<CompanySignalsLoading />}
              delay={500}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load" style={{ animationDelay: '0.4s' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">TOP COMPANY SIGNALS</CardTitle>
                    <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentDeals.length > 0 ? (
                      <div className="animate-loading-fade">
                        <h3 className="text-lg font-semibold text-blue-600 mb-1">{recentDeals[0].companyName}</h3>
                        <p className="text-sm text-gray-600 mb-2">{recentDeals[0].climateSector} • {recentDeals[0].country}</p>
                        
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-gray-500">Funding Stage</p>
                            <p className="font-medium">{recentDeals[0].fundingStage || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Date</p>
                            <p className="font-medium">{recentDeals[0].formattedDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-medium">{recentDeals[0].formattedAmount}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <div className="text-center">
                            <span className="text-lg font-bold">{recentDeals[0].daysAgo}</span>
                            <p className="text-xs text-gray-500">Days Ago</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No recent deals available</p>
                      </div>
                    )}
                    
                    {/* Growth Indicators */}
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <div className="relative w-20 h-20 mx-auto">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="#f3f3f3" strokeWidth="8" fill="none" />
                            <circle cx="50" cy="50" r="40" stroke="#F7D774" strokeWidth="8" fill="none" 
                                    strokeDasharray={`${(metrics?.growthRate || 0) * 2.5} 245`} className="transition-all duration-300" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-sm font-bold">{metrics?.growthRate?.toFixed(1) || '0'}%</div>
                              <div className="text-xs text-gray-500">Growth Rate</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="relative w-20 h-20 mx-auto">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="#f3f3f3" strokeWidth="8" fill="none" />
                            <circle cx="50" cy="50" r="40" stroke="#2E5E4E" strokeWidth="8" fill="none" 
                                    strokeDasharray="180 70" className="transition-all duration-300" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-sm font-bold">
                                ${metrics?.averageDealSize ? (metrics.averageDealSize / 1000000).toFixed(1) : '0'}M
                              </div>
                              <div className="text-xs text-gray-500">Avg Deal</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </LoadingTransition>
            </SectionErrorBoundary>

            {/* Climate Tech News */}
            <SectionErrorBoundary
              sectionName="Climate Tech News"
              fallback={(error, retry) => (
                <NewsErrorFallback error={error} retry={retry} />
              )}
              resetKeys={[newsItems.length].filter(key => key !== undefined)}
            >
            <LoadingTransition
              isLoading={false} // News is static, so never loading
              loadingComponent={<NewsLoading />}
              delay={600}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load" style={{ animationDelay: '0.5s' }}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">CLIMATE TECH NEWS</CardTitle>
                    <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {newsItems.map((item, index) => (
                      <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 animate-loading-fade" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-blue-600 hover:underline cursor-pointer mb-1">
                              {item.title}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {item.description}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>Moo Climate</span>
                              <span>•</span>
                              <span>{item.date}</span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 ml-2">{item.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </LoadingTransition>
            </SectionErrorBoundary>
          </div>

          {/* Third Row - Fund Returns Chart and Market Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionErrorBoundary
              sectionName="Fund Returns Chart"
              fallback={(error, retry) => (
                <ChartErrorFallback error={error} retry={retry} />
              )}
              resetKeys={[metrics?.totalDeals].filter(key => key !== undefined)}
            >
              <LoadingTransition
                isLoading={!sectionsLoaded.charts}
                loadingComponent={<FundReturnsLoading />}
                delay={700}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load" style={{ animationDelay: '0.6s' }}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">CLIMATE FUND RETURNS</CardTitle>
                      <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <div className="flex justify-between items-end h-full space-x-2">
                        <div className="flex flex-col justify-end space-y-1">
                          <span className="text-xs text-gray-500">60%</span>
                          <span className="text-xs text-gray-500">40%</span>
                          <span className="text-xs text-gray-500">20%</span>
                          <span className="text-xs text-gray-500">0%</span>
                          <span className="text-xs text-gray-500">-20%</span>
                        </div>
                        <div className="flex-1 h-full relative">
                          <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300"></div>
                          <svg className="w-full h-full" viewBox="0 0 300 160">
                            <path
                              d="M 20 140 Q 80 120 120 130 T 200 110 T 280 125"
                              stroke="#2E5E4E"
                              strokeWidth="2"
                              fill="none"
                            />
                          </svg>
                        </div>
                        <div className="flex flex-col justify-end space-y-1 text-xs text-gray-500">
                          <span>10x</span>
                          <span>8x</span>
                          <span>6x</span>
                          <span>4x</span>
                          <span>2x</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </LoadingTransition>
            </SectionErrorBoundary>

            <SectionErrorBoundary
              sectionName="Market Overview"
              fallback={(error, retry) => (
                <MetricsErrorFallback error={error} retry={retry} />
              )}
              resetKeys={[metrics?.totalDeals, metrics?.totalFunding, metrics?.totalCompanies, metrics?.totalInvestors].filter(key => key !== undefined)}
            >

            <LoadingTransition
              isLoading={!sectionsLoaded.metrics}
              loadingComponent={
                <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <MetricsCardLoading key={i} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              }
              delay={800}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-progressive-load" style={{ animationDelay: '0.7s' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-brand-charcoal">Market Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/10 rounded-lg border border-brand-yellow/20 shadow-sm animate-loading-fade" style={{ animationDelay: '0.8s' }}>
                      <div className="text-2xl font-bold text-brand-charcoal">{metrics?.totalDeals || 0}</div>
                      <div className="text-sm text-brand-charcoal/70">Total Deals</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-brand-green/20 to-brand-green/10 rounded-lg border border-brand-green/20 shadow-sm animate-loading-fade" style={{ animationDelay: '0.9s' }}>
                      <div className="text-2xl font-bold text-brand-charcoal">
                        ${metrics?.totalFunding ? (metrics.totalFunding / 1000000000).toFixed(1) : '0'}B
                      </div>
                      <div className="text-sm text-brand-charcoal/70">Total Funding</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-brand-blue/20 to-brand-blue/10 rounded-lg border border-brand-blue/20 shadow-sm animate-loading-fade" style={{ animationDelay: '1.0s' }}>
                      <div className="text-2xl font-bold text-brand-charcoal">{metrics?.totalCompanies || 0}</div>
                      <div className="text-sm text-brand-charcoal/70">Companies</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-gray-200/50 to-gray-100/30 rounded-lg border border-gray-200/30 shadow-sm animate-loading-fade" style={{ animationDelay: '1.1s' }}>
                      <div className="text-2xl font-bold text-brand-charcoal">{metrics?.totalInvestors || 0}</div>
                      <div className="text-sm text-brand-charcoal/70">Investors</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </LoadingTransition>
            </SectionErrorBoundary>
          </div>
        </main>
      </div>
      
      {/* Debug Component - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-hidden z-50">
          <RealTimeDebug />
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
