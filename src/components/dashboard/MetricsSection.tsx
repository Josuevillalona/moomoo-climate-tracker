import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionErrorBoundary, MetricsErrorFallback } from "@/components/dashboard/ErrorFallbacks";
import { LoadingTransition, QuickCountsLoading } from "@/components/dashboard/LoadingStates";
import { SectionErrorDisplay } from "@/components/dashboard/ErrorFallbacks";
import { MoreHorizontal } from "lucide-react";
import { DashboardMetrics } from "@/types/api";

interface MetricsSectionProps {
  metrics: DashboardMetrics | null;
  sectionsLoaded: {
    metrics: boolean;
    recentDeals: boolean;
    charts: boolean;
    news: boolean;
  };
  onRefetch: () => void;
}

export default function MetricsSection({ metrics, sectionsLoaded, onRefetch }: MetricsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide text-shadow-black-subtle">
                  QUICK COUNTS
                </CardTitle>
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
                    retry={onRefetch}
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

      {/* Market Overview */}
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
                <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="text-center p-4 bg-gray-100 rounded-lg animate-pulse">
                      <div className="h-8 w-16 bg-gray-200 rounded mx-auto mb-2" />
                      <div className="h-4 w-20 bg-gray-200 rounded mx-auto" />
                    </div>
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
  );
}
