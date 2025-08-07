"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Globe } from "lucide-react";

/**
 * Individual loading components for different dashboard sections
 * These provide granular loading states for progressive loading
 */

export function MetricsCardLoading() {
  return (
    <div className="text-center p-4 bg-gradient-to-br from-gray-100/50 to-gray-50/30 rounded-lg border border-gray-200/30 shadow-sm animate-loading-pulse">
      <Skeleton className="h-8 w-16 mx-auto mb-2" />
      <Skeleton className="h-4 w-20 mx-auto" />
    </div>
  );
}

export function TopMetricsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div 
          key={index}
          className="animate-loading-fade"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <MetricsCardLoading />
        </div>
      ))}
    </div>
  );
}

export function ChartCardLoading() {
  return (
    <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
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
          <Skeleton className="h-32 w-full rounded-lg animate-shimmer" />
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
  );
}

export function QuickCountsLoading() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex justify-between items-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
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
  );
}

export function WorldMapLoading() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
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
  );
}

export function RecentDealsLoading() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
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
            <div key={i} className="flex justify-between items-center animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
          <Skeleton className="h-8 w-full mt-4" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CompanySignalsLoading() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
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
          
          {/* Growth Indicators Loading */}
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
  );
}

export function NewsLoading() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <MoreHorizontal className="w-4 h-4 text-brand-charcoal/60" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
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
  );
}

export function FundReturnsLoading() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
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
              <Skeleton className="w-full h-full animate-shimmer" />
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
  );
}

/**
 * Progressive loading indicator for sections that are still loading
 */
export function SectionLoadingIndicator({ 
  title, 
  description 
}: { 
  title: string; 
  description?: string; 
}) {
  return (
    <div className="flex items-center justify-center p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm font-medium text-brand-charcoal">{title}</p>
        {description && (
          <p className="text-xs text-brand-charcoal/70 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Smooth transition wrapper for loading states
 */
export function LoadingTransition({ 
  isLoading, 
  children, 
  loadingComponent,
  className = "",
  delay = 0
}: {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div 
      className={`transition-all duration-500 ease-in-out ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {isLoading ? (
        <div className="animate-loading-fade">
          {loadingComponent}
        </div>
      ) : (
        <div className="animate-loading-fade">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Progressive loading indicator with customizable message
 */
export function ProgressiveLoadingIndicator({ 
  sections,
  completedSections,
  currentSection
}: { 
  sections: string[];
  completedSections: string[];
  currentSection?: string;
}) {
  return (
    <div className="flex items-center justify-center p-6 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20">
      <div className="text-center max-w-md">
        <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        
        <h3 className="text-lg font-medium text-brand-charcoal mb-2">Loading Dashboard</h3>
        
        {currentSection && (
          <p className="text-sm text-brand-charcoal/70 mb-4">
            Currently loading: {currentSection}
          </p>
        )}
        
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={section} className="flex items-center justify-between text-sm">
              <span className={`${completedSections.includes(section) ? 'text-brand-green' : 'text-brand-charcoal/50'}`}>
                {section}
              </span>
              <div className="ml-4">
                {completedSections.includes(section) ? (
                  <div className="w-4 h-4 bg-brand-green rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : currentSection === section ? (
                  <div className="w-4 h-4 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-brand-yellow h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(completedSections.length / sections.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-brand-charcoal/60 mt-2">
            {completedSections.length} of {sections.length} sections loaded
          </p>
        </div>
      </div>
    </div>
  );
}