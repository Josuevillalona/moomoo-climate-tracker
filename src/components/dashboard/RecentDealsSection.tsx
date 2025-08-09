import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionErrorBoundary, RecentDealsErrorFallback } from "@/components/dashboard/ErrorFallbacks";
import { LoadingTransition, RecentDealsLoading } from "@/components/dashboard/LoadingStates";
import { NewDealsBadge, CompactNewDealsIndicator } from "@/components/dashboard/NewDealsNotification";
import { AnimatedDealItem } from "@/components/dashboard/NewDealHighlight";
import { MoreHorizontal } from "lucide-react";
import { FundingDeal, DashboardMetrics } from "@/types/api";

interface RecentDealsSectionProps {
  recentDeals: FundingDeal[];
  metrics: DashboardMetrics | null;
  sectionsLoaded: {
    metrics: boolean;
    recentDeals: boolean;
    charts: boolean;
    news: boolean;
  };
  newDealsCount: number;
  newDealIds: Set<number>;
  clearNewDeals: () => void;
  onRefetch: () => void;
}

export default function RecentDealsSection({ 
  recentDeals, 
  metrics, 
  sectionsLoaded, 
  newDealsCount, 
  newDealIds, 
  clearNewDeals, 
  onRefetch 
}: RecentDealsSectionProps) {
  return (
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
                <CardTitle className="text-sm font-medium text-brand-charcoal uppercase tracking-wide text-shadow-black-subtle">
                  RECENT FUNDING ROUNDS
                </CardTitle>
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
                    onRefetch();
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
  );
}
