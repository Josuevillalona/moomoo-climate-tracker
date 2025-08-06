"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * DashboardSkeleton Component
 * 
 * A comprehensive skeleton loading component that matches the dashboard layout structure.
 * Features smooth loading animations, staggered timing, and maintains proper spacing.
 * 
 * Features:
 * - Matches exact dashboard layout structure
 * - Smooth shimmer animations on skeleton elements
 * - Staggered fade-in and slide-up animations for cards
 * - Animated background elements (gentle-pulse, float, drift)
 * - Maintains proper spacing and responsive grid layouts
 * - Smooth transitions between loading and loaded states
 * 
 * Usage:
 * ```tsx
 * import { DashboardSkeleton } from '@/components/dashboard';
 * 
 * function MyComponent() {
 *   const [isLoading, setIsLoading] = useState(true);
 *   
 *   return (
 *     <div>
 *       {isLoading ? <DashboardSkeleton /> : <Dashboard />}
 *     </div>
 *   );
 * }
 * ```
 * 
 * Requirements satisfied:
 * - 3.1: Loading indicators during data fetch
 * - 3.2: Smooth transitions between loading and loaded states
 */
import { 
  BarChart3, 
  Home,
  Search,
  History,
  Bookmark,
  Database,
  FileText,
  MessageSquare,
  Activity,
  ChevronRight,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Globe
} from "lucide-react";

export default function DashboardSkeleton() {
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
      
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-brand-blue/95 backdrop-blur-sm text-white flex flex-col relative z-10">
        {/* Logo Skeleton */}
        <div className="p-6 border-b border-brand-blue/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-yellow rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-brand-charcoal" />
            </div>
            <Skeleton className="h-6 w-32 bg-white/20" />
          </div>
        </div>

        {/* Navigation Skeleton */}
        <nav className="flex-1 p-4 space-y-2">
          <div className="w-full h-10 bg-brand-yellow rounded-md flex items-center px-3">
            <Home className="w-4 h-4 mr-3" />
            <span>Dashboard</span>
          </div>
          {[Search, History, Bookmark, Database, FileText, MessageSquare, Activity].map((Icon, index) => (
            <div key={index} className="w-full h-10 bg-brand-blue/40 rounded-md flex items-center px-3">
              <Icon className="w-4 h-4 mr-3 text-white/60" />
              <Skeleton className="h-4 w-20 bg-white/20" />
            </div>
          ))}
        </nav>

        {/* Hide Sidebar Button Skeleton */}
        <div className="p-4 border-t border-brand-blue/20">
          <div className="w-full h-10 bg-brand-blue/40 rounded-md flex items-center px-3">
            <ChevronRight className="w-4 h-4 mr-3 text-white/60" />
            <Skeleton className="h-4 w-24 bg-white/20" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header Skeleton */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-white/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-40" />
              <div className="h-8 px-3 border border-gray-300 rounded-md flex items-center space-x-2">
                <Plus className="w-4 h-4 text-gray-400" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Skeleton className="h-10 w-64 pl-10" />
              </div>
              <Skeleton className="h-8 w-12" />
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Dashboard Content Skeleton */}
        <main className="flex-1 p-6 space-y-6 overflow-auto relative z-10">
          {/* Top Row - Charts and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Closed Deals Chart Skeleton */}
            <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <div className="flex justify-between">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-3 w-6" />
                    ))}
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Skeleton className="w-3 h-3 rounded-sm" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <Skeleton className="w-3 h-3 rounded-sm" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Counts Skeleton */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex justify-between items-center animate-fade-in" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex justify-between mt-1">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Deals by Regions - World Map Skeleton */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-24" />
                    <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gradient-to-br from-brand-blue/30 via-brand-yellow/20 to-brand-green/30 rounded-lg flex items-center justify-center relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-green/10 to-brand-blue/10"></div>
                  <div className="text-center">
                    <Globe className="w-16 h-16 text-brand-green/60 mx-auto mb-2 animate-pulse" />
                    <Skeleton className="h-4 w-32 mx-auto mb-4" />
                    <div className="flex items-center justify-center space-x-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-1">
                          <Skeleton className="w-2 h-2 rounded-full" />
                          <Skeleton className="h-3 w-6" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {/* Recent Funding Rounds Skeleton */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center animate-fade-in" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                  <Skeleton className="h-8 w-full mt-4" />
                </div>
              </CardContent>
            </Card>

            {/* Top Company Signals Skeleton */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Skeleton className="h-6 w-32 mb-1" />
                    <Skeleton className="h-4 w-48 mb-2" />
                    
                    <div className="grid grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i}>
                          <Skeleton className="h-3 w-16 mb-1" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 text-center">
                      <Skeleton className="h-6 w-16 mx-auto mb-1" />
                      <Skeleton className="h-3 w-12 mx-auto" />
                    </div>
                  </div>
                  
                  {/* Growth Indicators Skeleton */}
                  <div className="flex space-x-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex-1">
                        <div className="relative w-20 h-20 mx-auto">
                          <div className="w-full h-full rounded-full border-8 border-gray-200 animate-pulse"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <Skeleton className="h-4 w-8 mb-1" />
                              <Skeleton className="h-3 w-12" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Climate Tech News Skeleton */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-slide-up" style={{ animationDelay: '0.7s' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 animate-fade-in" style={{ animationDelay: `${0.7 + index * 0.1}s` }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-3 w-full mb-1" />
                          <Skeleton className="h-3 w-3/4 mb-2" />
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-3 w-16" />
                            <span className="text-xs text-gray-500">•</span>
                            <Skeleton className="h-3 w-8" />
                          </div>
                        </div>
                        <Skeleton className="h-3 w-6 ml-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Third Row - Fund Returns Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-slide-up" style={{ animationDelay: '0.9s' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <div className="flex justify-between items-end h-full space-x-2">
                    <div className="flex flex-col justify-end space-y-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-3 w-8" />
                      ))}
                    </div>
                    <div className="flex-1 h-full relative">
                      <Skeleton className="w-full h-full" />
                    </div>
                    <div className="flex flex-col justify-end space-y-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-3 w-6" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg animate-slide-up" style={{ animationDelay: '1.0s' }}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="text-center p-4 bg-gradient-to-br from-gray-100/50 to-gray-50/30 rounded-lg border border-gray-200/30 shadow-sm animate-slide-up" style={{ animationDelay: `${1.0 + i * 0.1}s` }}>
                      <Skeleton className="h-8 w-16 mx-auto mb-2" />
                      <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}