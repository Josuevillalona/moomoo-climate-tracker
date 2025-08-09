import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionErrorBoundary, ChartErrorFallback } from "@/components/dashboard/ErrorFallbacks";
import { LoadingTransition, FundReturnsLoading } from "@/components/dashboard/LoadingStates";
import { MoreHorizontal } from "lucide-react";
import { DashboardMetrics } from "@/types/api";

interface FundReturnsSectionProps {
  metrics: DashboardMetrics | null;
  sectionsLoaded: {
    metrics: boolean;
    recentDeals: boolean;
    charts: boolean;
    news: boolean;
  };
}

export default function FundReturnsSection({ metrics, sectionsLoaded }: FundReturnsSectionProps) {
  return (
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
              <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide text-shadow-black-subtle">
                CLIMATE FUND RETURNS
              </CardTitle>
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
  );
}
