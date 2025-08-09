import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionErrorBoundary, CompanySignalsErrorFallback } from "@/components/dashboard/ErrorFallbacks";
import { LoadingTransition, CompanySignalsLoading } from "@/components/dashboard/LoadingStates";
import { MoreHorizontal } from "lucide-react";
import { FundingDeal, DashboardMetrics } from "@/types/api";

interface CompanySignalsSectionProps {
  recentDeals: FundingDeal[];
  metrics: DashboardMetrics | null;
  sectionsLoaded: {
    metrics: boolean;
    recentDeals: boolean;
    charts: boolean;
    news: boolean;
  };
}

export default function CompanySignalsSection({ 
  recentDeals, 
  metrics, 
  sectionsLoaded 
}: CompanySignalsSectionProps) {
  return (
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
              <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide text-shadow-black-subtle">
                TOP COMPANY SIGNALS
              </CardTitle>
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
  );
}
