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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-brand-green text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-brand-green/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-brand-charcoal" />
            </div>
            <h1 className="text-xl font-bold">Moo Climate</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Button variant="secondary" className="w-full justify-start bg-brand-yellow text-brand-charcoal hover:bg-brand-yellow/90">
            <Home className="w-4 h-4 mr-3" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-green/80">
            <Search className="w-4 h-4 mr-3" />
            Advanced Search
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-green/80">
            <History className="w-4 h-4 mr-3" />
            History
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-green/80">
            <Bookmark className="w-4 h-4 mr-3" />
            Saved Searches
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-green/80">
            <Database className="w-4 h-4 mr-3" />
            Saved Lists
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-green/80">
            <FileText className="w-4 h-4 mr-3" />
            Reports
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-green/80">
            <MessageSquare className="w-4 h-4 mr-3" />
            News
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-green/80">
            <Activity className="w-4 h-4 mr-3" />
            Plugins & Apps
          </Button>
        </nav>

        {/* Hide Sidebar Button */}
        <div className="p-4 border-t border-brand-green/20">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-brand-green/80">
            <ChevronRight className="w-4 h-4 mr-3" />
            Hide Sidebar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-brand-charcoal">Dashboard</h1>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add widgets
              </Button>
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
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Top Row - Charts and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Closed Deals Chart */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">CLOSED DEALS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center">
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>$10M</span>
                      <span>7,000</span>
                    </div>
                    <div className="h-32 bg-gradient-to-r from-brand-green to-brand-yellow rounded-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-green/20 to-transparent"></div>
                      {/* Simulated line chart */}
                      <svg className="w-full h-full" viewBox="0 0 300 120">
                        <path
                          d="M 20 80 Q 80 60 120 70 T 200 50 T 280 65"
                          stroke="#F7D774"
                          strokeWidth="3"
                          fill="none"
                        />
                        <path
                          d="M 20 90 Q 80 75 120 80 T 200 65 T 280 75"
                          stroke="#2E5E4E"
                          strokeWidth="3"
                          fill="none"
                        />
                      </svg>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
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
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">QUICK COUNTS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickCounts.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">{item.label}</span>
                          <span className="text-sm font-medium">{item.value}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
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
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">DEALS BY REGIONS</CardTitle>
                  <div className="flex items-center space-x-2">
                    <select className="text-xs border border-gray-300 rounded px-2 py-1">
                      <option>World (21,093)</option>
                    </select>
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gradient-to-br from-brand-blue/20 to-brand-green/20 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="text-center">
                    <Globe className="w-16 h-16 text-brand-green mx-auto mb-2" />
                    <p className="text-sm text-gray-600">World Map Visualization</p>
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
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">RECENT FUNDING ROUNDS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
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
                      <span className="text-blue-600 hover:underline cursor-pointer">{deal.company}</span>
                      <span className="text-gray-600">{deal.type}</span>
                      <span className="text-gray-500">{deal.date}</span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    View All (36,175)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Top Company Signals */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">TOP COMPANY SIGNALS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-600 mb-1">{topCompany.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{topCompany.type} • {topCompany.location}</p>
                    
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-gray-500">Last Inv. Type</p>
                        <p className="font-medium">{topCompany.lastInv}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Inv. Date</p>
                        <p className="font-medium">{topCompany.lastDate}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Investors</p>
                        <p className="font-medium">{topCompany.investors}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="text-center">
                        <span className="text-lg font-bold">{topCompany.people}</span>
                        <p className="text-xs text-gray-500">People</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Growth Indicators */}
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <div className="relative w-20 h-20 mx-auto">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="#f3f3f3" strokeWidth="8" fill="none" />
                          <circle cx="50" cy="50" r="40" stroke="#F7D774" strokeWidth="8" fill="none" 
                                  strokeDasharray="5 245" className="transition-all duration-300" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-sm font-bold">{topCompany.weeklyGrowth}</div>
                            <div className="text-xs text-gray-500">Weekly Growth</div>
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
                            <div className="text-sm font-bold">{topCompany.medianValue}</div>
                            <div className="text-xs text-gray-500">Median</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* News Curated for You */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">CLIMATE TECH NEWS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
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
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">CLIMATE FUND RETURNS</CardTitle>
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Market Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-brand-yellow/10 rounded-lg">
                    <div className="text-2xl font-bold text-brand-charcoal">{dashboardStats.totalDeals}</div>
                    <div className="text-sm text-gray-600">Total Deals</div>
                  </div>
                  <div className="text-center p-4 bg-brand-green/10 rounded-lg">
                    <div className="text-2xl font-bold text-brand-charcoal">${dashboardStats.totalFunding}B</div>
                    <div className="text-sm text-gray-600">Total Funding</div>
                  </div>
                  <div className="text-center p-4 bg-brand-blue/10 rounded-lg">
                    <div className="text-2xl font-bold text-brand-charcoal">{dashboardStats.companies}</div>
                    <div className="text-sm text-gray-600">Companies</div>
                  </div>
                  <div className="text-center p-4 bg-gray-100 rounded-lg">
                    <div className="text-2xl font-bold text-brand-charcoal">{dashboardStats.investors}</div>
                    <div className="text-sm text-gray-600">Investors</div>
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
