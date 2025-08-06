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

// Mock data for climate tech funding
const user = {
  id: "1",
  name: "Alex Chen",
  role: "Climate VC Analyst",
  avatar: "/api/placeholder/150/150",
  email: "alex.chen@climatevc.com"
};

const dashboardStats = {
  totalDeals: 629,
  totalFunding: 225,
  companies: 731,
  investors: 810
};

const recentDeals = [
  { id: "1", company: "SolarNext", type: "Series A", date: "12-Jun-2024", amount: "$15M" },
  { id: "2", company: "CleanWave", type: "Seed Round", date: "11-Jun-2024", amount: "$8M" },
  { id: "3", company: "EcoFlow Dynamics", type: "Series B", date: "10-Jun-2024", amount: "$32M" },
  { id: "4", company: "GreenTech Solutions", type: "Early Stage VC", date: "09-Jun-2024", amount: "$12M" },
  { id: "5", company: "Carbon Capture Co", type: "Corporate Asset Purchase", date: "08-Jun-2024", amount: "$25M" },
];

const quickCounts = [
  { label: "Companies", value: "629,225", sublabel: "Pre-venture", subvalue: "140,469" },
  { label: "Investments", value: "731,819", sublabel: "Angel & Seed", subvalue: "112,678" },
  { label: "Venture Capital", value: "106,734", sublabel: "VC Deals", subvalue: "104,362" },
  { label: "Private Equity", value: "106,974", sublabel: "PE Deals", subvalue: "158,329" },
  { label: "M&A", value: "179,829", sublabel: "Strategic M&A", subvalue: "106,251" },
  { label: "Other Listed", value: "75,929", sublabel: "Other", subvalue: "89,364" },
];

const topCompany = {
  name: "ClimateCore",
  type: "Social/Platform Software",
  location: "Menlo Park, CA",
  lastInv: "Series B",
  lastDate: "May-2024",
  investors: 92,
  people: 18770,
  weeklyGrowth: "0.01%",
  medianValue: "326K"
};

const newsItems = [
  {
    title: "Tesla launches new $15M Series A",
    description: "App focused platform for creating an end-to-end platform that enables...",
    date: "2w",
    source: "PitchBook"
  },
  {
    title: "Uber threatens to fire engineer at center of Waymo suit",
    description: "Another day and another piece of Uber news. The ridesharing giant has reportedly...",
    date: "3w",
    source: "PitchBook"
  },
  {
    title: "Everything Microsoft announced at Build 2017",
    description: "At Microsoft's annual Build developer conference came lots and more...",
    date: "4w",
    source: "PitchBook"
  }
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-gray via-brand-white to-brand-azure/10 relative overflow-hidden flex">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-brand-yellow/20 rounded-full blur-3xl animate-gentle-pulse"></div>
        <div className="absolute top-1/3 right-20 w-40 h-40 bg-brand-tree-light/20 rounded-full blur-3xl animate-gentle-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-brand-azure/20 rounded-full blur-3xl animate-gentle-pulse delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-brand-yellow/10 to-brand-green/10 rounded-full blur-3xl animate-gentle-pulse delay-500"></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232E5E4E' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 right-1/4 w-4 h-4 bg-brand-yellow/30 rounded-full animate-float delay-300"></div>
        <div className="absolute bottom-1/3 right-10 w-3 h-3 bg-brand-tree-medium/40 rounded-full animate-float delay-700"></div>
        <div className="absolute top-1/2 left-10 w-5 h-5 bg-brand-azure/30 rounded-full animate-float delay-1100"></div>
        
        {/* Drifting Elements */}
        <div className="absolute top-1/4 left-1/3 w-6 h-6 bg-brand-yellow/20 rounded-full animate-drift"></div>
        <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-brand-tree-light/30 rounded-full animate-drift delay-1500"></div>
      </div>
      
      {/* Sidebar */}
      <div className="w-64 bg-brand-green/95 backdrop-blur-sm text-white flex flex-col relative z-10 shadow-xl">
        {/* Logo */}
        <div className="p-6 border-b border-brand-green/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="/moomoo-headshot.png" 
                alt="MooMoo Climate Cow" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-xl font-bold font-heading text-brand-white">MooMoo Climate</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="secondary" className="w-full justify-start bg-brand-yellow text-brand-charcoal hover:bg-brand-yellow/90 font-medium">
            <Home className="w-4 h-4 mr-3" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-brand-white hover:bg-brand-green/70 hover:text-brand-white">
            <Search className="w-4 h-4 mr-3" />
            Advanced Search
          </Button>
          <Button variant="ghost" className="w-full justify-start text-brand-white hover:bg-brand-green/70 hover:text-brand-white">
            <History className="w-4 h-4 mr-3" />
            History
          </Button>
          <Button variant="ghost" className="w-full justify-start text-brand-white hover:bg-brand-green/70 hover:text-brand-white">
            <Bookmark className="w-4 h-4 mr-3" />
            Saved Searches
          </Button>
          <Button variant="ghost" className="w-full justify-start text-brand-white hover:bg-brand-green/70 hover:text-brand-white">
            <Database className="w-4 h-4 mr-3" />
            Saved Lists
          </Button>
          <Button variant="ghost" className="w-full justify-start text-brand-white hover:bg-brand-green/70 hover:text-brand-white">
            <FileText className="w-4 h-4 mr-3" />
            Reports
          </Button>
          <Button variant="ghost" className="w-full justify-start text-brand-white hover:bg-brand-green/70 hover:text-brand-white">
            <MessageSquare className="w-4 h-4 mr-3" />
            News
          </Button>
          <Button variant="ghost" className="w-full justify-start text-brand-white hover:bg-brand-green/70 hover:text-brand-white">
            <Activity className="w-4 h-4 mr-3" />
            Plugins & Apps
          </Button>
        </nav>

        {/* Hide Sidebar Button */}
        <div className="p-4 border-t border-brand-green/30">
          <Button variant="ghost" className="w-full justify-start text-brand-white hover:bg-brand-green/70 hover:text-brand-white">
            <ChevronRight className="w-4 h-4 mr-3" />
            Hide Sidebar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="bg-brand-white/95 backdrop-blur-sm border-b border-brand-gray/30 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold font-heading text-brand-charcoal">MooMoo Climate</h1>
              <Button variant="outline" size="sm" className="border-brand-green text-brand-green hover:bg-brand-green hover:text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add widgets
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-brand-charcoal/60" />
                <input
                  type="text"
                  placeholder="Search Climate Data"
                  className="pl-10 pr-4 py-2 border border-brand-gray/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:border-brand-yellow bg-brand-white"
                />
              </div>
              <Button variant="ghost" size="sm" className="text-brand-charcoal hover:bg-brand-gray">
                Help
              </Button>
              <Avatar className="w-8 h-8 border-2 border-brand-yellow">
                <AvatarFallback className="bg-brand-yellow text-brand-charcoal font-semibold">AC</AvatarFallback>
              </Avatar>
              <span className="text-sm text-brand-charcoal font-medium">{user.name}</span>
              <ChevronDown className="w-4 h-4 text-brand-charcoal/60" />
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 space-y-6 overflow-auto relative z-10">
          {/* Top Row - Charts and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Closed Deals Chart */}
            <Card className="lg:col-span-1 bg-brand-white/90 backdrop-blur-sm border-brand-gray/30 shadow-lg hover:shadow-xl transition-shadow">
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
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-brand-yellow/20 to-brand-azure/10"></div>
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
                        <div className="w-3 h-3 bg-brand-yellow rounded-sm shadow-sm"></div>
                        <span className="text-brand-charcoal"># of Deals</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-brand-green rounded-sm shadow-sm"></div>
                        <span className="text-brand-charcoal">Median Deal Size ($)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Counts */}
            <Card className="bg-brand-white/90 backdrop-blur-sm border-brand-gray/30 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">QUICK COUNTS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickCounts.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-brand-charcoal font-medium">{item.label}</span>
                          <span className="text-sm font-semibold text-brand-charcoal">{item.value}</span>
                        </div>
                        <div className="flex justify-between text-xs text-brand-charcoal/60 mt-1">
                          <span>{item.sublabel}</span>
                          <span>{item.subvalue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Deals by Regions - World Map */}
            <Card className="bg-brand-white/90 backdrop-blur-sm border-brand-gray/30 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">DEALS BY REGIONS</CardTitle>
                  <div className="flex items-center space-x-2">
                    <select className="text-xs border border-brand-gray/60 rounded px-2 py-1 bg-brand-white text-brand-charcoal focus:border-brand-yellow">
                      <option>World (21,093)</option>
                    </select>
                    <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gradient-to-br from-brand-azure/20 via-brand-yellow/10 to-brand-green/20 rounded-lg flex items-center justify-center relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-green/5 to-brand-azure/5"></div>
                  <div className="text-center">
                    <Globe className="w-16 h-16 text-brand-green mx-auto mb-2" />
                    <p className="text-sm text-brand-charcoal/70 font-medium">World Map Visualization</p>
                    <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-brand-azure rounded-full"></div>
                        <span className="text-brand-charcoal">0</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-brand-tree-light rounded-full"></div>
                        <span className="text-brand-charcoal">1-5</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-brand-yellow rounded-full"></div>
                        <span className="text-brand-charcoal">6-20</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-brand-brown-light rounded-full"></div>
                        <span className="text-brand-charcoal">&gt;20</span>
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
            <Card className="bg-brand-white/90 backdrop-blur-sm border-brand-gray/30 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">RECENT FUNDING ROUNDS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-medium text-brand-charcoal/70 border-b border-brand-gray/30 pb-2">
                    <span>Company</span>
                    <span>Type</span>
                    <span>Date</span>
                  </div>
                  {recentDeals.map((deal) => (
                    <div key={deal.id} className="flex justify-between items-center text-sm">
                      <span className="text-brand-azure hover:text-brand-azure/80 hover:underline cursor-pointer font-medium">{deal.company}</span>
                      <span className="text-brand-charcoal/70">{deal.type}</span>
                      <span className="text-brand-charcoal/60">{deal.date}</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-4 border-brand-green text-brand-green hover:bg-brand-green hover:text-white">
                    View All (36,175)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Top Company Signals */}
            <Card className="bg-brand-white/90 backdrop-blur-sm border-brand-gray/30 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">TOP COMPANY SIGNALS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-azure mb-1">{topCompany.name}</h3>
                    <p className="text-sm text-brand-charcoal/70 mb-2">{topCompany.type} • {topCompany.location}</p>
                    
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-brand-charcoal/60">Last Inv. Type</p>
                        <p className="font-medium text-brand-charcoal">{topCompany.lastInv}</p>
                      </div>
                      <div>
                        <p className="text-brand-charcoal/60">Last Inv. Date</p>
                        <p className="font-medium text-brand-charcoal">{topCompany.lastDate}</p>
                      </div>
                      <div>
                        <p className="text-brand-charcoal/60">Investors</p>
                        <p className="font-medium text-brand-charcoal">{topCompany.investors}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="text-center">
                        <span className="text-lg font-bold text-brand-charcoal">{topCompany.people}</span>
                        <p className="text-xs text-brand-charcoal/60">People</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Growth Indicators */}
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <div className="relative w-20 h-20 mx-auto">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="#F3F3F3" strokeWidth="8" fill="none" />
                          <circle cx="50" cy="50" r="40" stroke="#F7D774" strokeWidth="8" fill="none" 
                                  strokeDasharray="5 245" className="transition-all duration-300" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-sm font-bold text-brand-charcoal">{topCompany.weeklyGrowth}</div>
                            <div className="text-xs text-brand-charcoal/60">Weekly Growth</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="relative w-20 h-20 mx-auto">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="#F3F3F3" strokeWidth="8" fill="none" />
                          <circle cx="50" cy="50" r="40" stroke="#2E5E4E" strokeWidth="8" fill="none" 
                                  strokeDasharray="180 70" className="transition-all duration-300" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-sm font-bold text-brand-charcoal">{topCompany.medianValue}</div>
                            <div className="text-xs text-brand-charcoal/60">Median</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* News Curated for You */}
            <Card className="bg-brand-white/90 backdrop-blur-sm border-brand-gray/30 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">CLIMATE TECH NEWS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {newsItems.map((item, index) => (
                    <div key={index} className="border-b border-brand-gray/30 pb-3 last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-brand-azure hover:text-brand-azure/80 hover:underline cursor-pointer mb-1">
                            {item.title}
                          </h4>
                          <p className="text-xs text-brand-charcoal/70 mb-2 line-clamp-2">
                            {item.description}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-brand-charcoal/60">
                            <span>Moo Climate</span>
                            <span>•</span>
                            <span>{item.date}</span>
                          </div>
                        </div>
                        <span className="text-xs text-brand-charcoal/50 ml-2">{item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Third Row - Fund Returns Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-brand-white/90 backdrop-blur-sm border-brand-gray/30 shadow-lg hover:shadow-xl transition-shadow">
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
                      <span className="text-xs text-brand-charcoal/60">60%</span>
                      <span className="text-xs text-brand-charcoal/60">40%</span>
                      <span className="text-xs text-brand-charcoal/60">20%</span>
                      <span className="text-xs text-brand-charcoal/60">0%</span>
                      <span className="text-xs text-brand-charcoal/60">-20%</span>
                    </div>
                    <div className="flex-1 h-full relative">
                      <div className="absolute bottom-0 left-0 right-0 h-px bg-brand-gray"></div>
                      <svg className="w-full h-full" viewBox="0 0 300 160">
                        <path
                          d="M 20 140 Q 80 120 120 130 T 200 110 T 280 125"
                          stroke="#2E5E4E"
                          strokeWidth="2"
                          fill="none"
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col justify-end space-y-1 text-xs text-brand-charcoal/60">
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

            <Card className="bg-brand-white/90 backdrop-blur-sm border-brand-gray/30 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide">Market Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/10 rounded-lg border border-brand-yellow/30 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-brand-charcoal">{dashboardStats.totalDeals}</div>
                    <div className="text-sm text-brand-charcoal/70 font-medium">Total Deals</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-brand-green/20 to-brand-green/10 rounded-lg border border-brand-green/30 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-brand-charcoal">${dashboardStats.totalFunding}B</div>
                    <div className="text-sm text-brand-charcoal/70 font-medium">Total Funding</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-brand-azure/20 to-brand-azure/10 rounded-lg border border-brand-azure/30 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-brand-charcoal">{dashboardStats.companies}</div>
                    <div className="text-sm text-brand-charcoal/70 font-medium">Companies</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-brand-tree-light/20 to-brand-tree-light/10 rounded-lg border border-brand-tree-light/30 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-2xl font-bold text-brand-charcoal">{dashboardStats.investors}</div>
                    <div className="text-sm text-brand-charcoal/70 font-medium">Investors</div>
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
