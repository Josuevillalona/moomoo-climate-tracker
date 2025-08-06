"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
  const { metrics, recentDeals, loading, error, refetch } = useDashboardData({
    recentDealsLimit: 5,
    enableAutoRefresh: true,
    autoRefreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Debug logging
  console.log('🎯 Dashboard render:', {
    loading,
    error,
    metricsLoaded: !!metrics,
    recentDealsCount: recentDeals?.length || 0
  });

  // Show loading state
  if (loading) {
    console.log('⏳ Dashboard: Showing loading state');
    return <DashboardSkeleton />;
  }

  // Show error state with retry option
  if (error) {
    console.error('❌ Dashboard: Showing error state:', error);
    return (
      <div className="min-h-screen bg-brand-blue/20 flex items-center justify-center">
        <Card className="max-w-md mx-auto bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Unable to Load Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refetch} className="bg-brand-yellow hover:bg-brand-yellow/90">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('✅ Dashboard: Rendering main dashboard with data');

  return (
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
                <Button variant="outline" size="sm" onClick={refetch}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
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
          {/* Top Row - Charts and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Closed Deals Chart */}
            <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
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

            {/* Quick Counts */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">QUICK COUNTS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Top Sectors */}
                  {metrics?.topSectors?.slice(0, 6).map((sector, index) => (
                    <div key={index} className="flex justify-between items-center">
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
                  // Fallback if no sector data
                  Array.from({ length: 6 }, (_, index) => (
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
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Deals by Regions - World Map */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">DEALS BY REGIONS</CardTitle>
                  <div className="flex items-center space-x-2">
                    <select className="text-xs border border-gray-300 rounded px-2 py-1">
                      <option>World (21,093)</option>
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
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent SEC Filings */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">RECENT FUNDING ROUNDS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-medium text-gray-600 border-b pb-2">
                    <span>Company</span>
                    <span>Type</span>
                    <span>Date</span>
                  </div>
                  {recentDeals.map((deal) => (
                    <div key={deal.id} className="flex justify-between items-center text-sm">
                      <span className="text-blue-600 hover:underline cursor-pointer">{deal.companyName}</span>
                      <span className="text-gray-600">{deal.fundingStage || 'N/A'}</span>
                      <span className="text-gray-500">{deal.formattedDate}</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    View All ({metrics?.totalDeals || 0})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Top Company Signals */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">TOP COMPANY SIGNALS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDeals.length > 0 ? (
                    <div>
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

            {/* News Curated for You */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">CLIMATE TECH NEWS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {newsItems.map((item, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
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
          </div>

          {/* Third Row - Fund Returns Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
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

            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-brand-charcoal">Market Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/10 rounded-lg border border-brand-yellow/20 shadow-sm">
                    <div className="text-2xl font-bold text-brand-charcoal">{metrics?.totalDeals || 0}</div>
                    <div className="text-sm text-brand-charcoal/70">Total Deals</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-brand-green/20 to-brand-green/10 rounded-lg border border-brand-green/20 shadow-sm">
                    <div className="text-2xl font-bold text-brand-charcoal">
                      ${metrics?.totalFunding ? (metrics.totalFunding / 1000000000).toFixed(1) : '0'}B
                    </div>
                    <div className="text-sm text-brand-charcoal/70">Total Funding</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-brand-blue/20 to-brand-blue/10 rounded-lg border border-brand-blue/20 shadow-sm">
                    <div className="text-2xl font-bold text-brand-charcoal">{metrics?.totalCompanies || 0}</div>
                    <div className="text-sm text-brand-charcoal/70">Companies</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-gray-200/50 to-gray-100/30 rounded-lg border border-gray-200/30 shadow-sm">
                    <div className="text-2xl font-bold text-brand-charcoal">{metrics?.totalInvestors || 0}</div>
                    <div className="text-sm text-brand-charcoal/70">Investors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
