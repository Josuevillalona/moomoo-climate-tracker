import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionErrorBoundary, ChartErrorFallback, WorldMapErrorFallback } from "@/components/dashboard/ErrorFallbacks";
import { LoadingTransition, ChartCardLoading, WorldMapLoading } from "@/components/dashboard/LoadingStates";
import { MoreHorizontal, Globe } from "lucide-react";
import { DashboardMetrics } from "@/types/api";

interface ChartsSectionProps {
  metrics: DashboardMetrics | null;
  sectionsLoaded: {
    metrics: boolean;
    recentDeals: boolean;
    charts: boolean;
    news: boolean;
  };
}

export default function ChartsSection({ metrics, sectionsLoaded }: ChartsSectionProps) {
  return (
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
                <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide text-shadow-black-subtle">
                  CLOSED DEALS
                </CardTitle>
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

      {/* Placeholder for other charts */}
      <div className="lg:col-span-1">
        {/* This space can be used for additional charts */}
      </div>

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
                <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide text-shadow-black-subtle">
                  DEALS BY REGIONS
                </CardTitle>
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
  );
}
