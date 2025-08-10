import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionErrorBoundary, RecentDealsErrorFallback } from "@/components/dashboard/ErrorFallbacks";
import { LoadingTransition, RecentDealsLoading } from "@/components/dashboard/LoadingStates";
import { NewDealsBadge, CompactNewDealsIndicator } from "@/components/dashboard/NewDealsNotification";
import { AnimatedDealItem } from "@/components/dashboard/NewDealHighlight";
import { MoreHorizontal, ExternalLink, X, ChevronLeft, ChevronRight, Search, TrendingUp } from "lucide-react";
import { FundingDeal, DashboardMetrics } from "@/types/api";
import EnhancedFundingRoundsWidget from "@/components/enhanced-widgets/funding/EnhancedFundingRoundsWidget";
import { FundingFilters } from "@/types/enhanced-widgets";

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
  newDealIds: Set<number | string>;
  clearNewDeals: () => void;
  onRefetch: () => void;
  size?: 'normal' | 'expanded';
}

// Simple inline modal component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  deals: FundingDeal[];
  title: string;
  newDealIds: Set<number | string>;
}

function SimpleModal({ isOpen, onClose, deals, title, newDealIds }: ModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const DEALS_PER_PAGE = 20;

  if (!isOpen) return null;

  const filteredDeals = deals.filter(deal => 
    deal.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.fundingStage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDeals.length / DEALS_PER_PAGE);
  const startIndex = (currentPage - 1) * DEALS_PER_PAGE;
  const paginatedDeals = filteredDeals.slice(startIndex, startIndex + DEALS_PER_PAGE);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6 text-brand-green" />
            <h2 className="text-2xl font-bold text-brand-charcoal">{title}</h2>
            <span className="px-2 py-1 bg-brand-yellow/20 text-brand-charcoal rounded-full text-sm">
              {filteredDeals.length} deals
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search companies or stages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Deals List */}
        <div className="flex-1 overflow-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div className="space-y-2">
            {paginatedDeals.map((deal, index) => {
              const isNewDeal = newDealIds.has(String(deal.id));
              return (
                <div key={deal.id} className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg hover:bg-gray-50 border">
                  <div className="col-span-4">
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold ${isNewDeal ? 'text-green-700' : 'text-brand-charcoal'}`}>
                        {deal.companyName}
                      </span>
                      {isNewDeal && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">NEW</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 text-sm">{deal.fundingStage}</div>
                  <div className="col-span-2 font-semibold">{deal.formattedAmount}</div>
                  <div className="col-span-2 text-sm text-gray-600">{deal.climateSector}</div>
                  <div className="col-span-2 text-sm text-gray-500">{deal.formattedDate}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecentDealsSection({ 
  recentDeals, 
  metrics, 
  sectionsLoaded, 
  newDealsCount, 
  newDealIds, 
  clearNewDeals, 
  onRefetch,
  size = 'normal'
}: RecentDealsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dynamic sizing logic
  const getDisplayConfig = () => {
    const totalDeals = recentDeals.length;
    
    if (size === 'expanded') {
      // For expanded widget, show more deals but still have limits
      if (totalDeals <= 12) {
        return { displayCount: totalDeals, showViewAll: false };
      } else {
        return { displayCount: 12, showViewAll: true };
      }
    } else {
      // For normal size, show fewer deals
      if (totalDeals <= 6) {
        return { displayCount: totalDeals, showViewAll: false };
      } else {
        return { displayCount: 6, showViewAll: true };
      }
    }
  };

  const { displayCount, showViewAll } = getDisplayConfig();
  const displayDeals = recentDeals.slice(0, displayCount);
  // Default filters for enhanced widget
  const defaultFilters: FundingFilters = {
    stages: [
      { id: 'seed', name: 'Seed', selected: true },
      { id: 'series-a', name: 'Series A', selected: true },
      { id: 'series-b', name: 'Series B', selected: true },
      { id: 'series-c', name: 'Series C+', selected: true },
    ],
    sectors: [],
    fundingRange: { min: 0, max: 1000000000 },
    dateRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() },
    keywords: []
  };

  const handleFilterChange = (filters: FundingFilters) => {
    // TODO: Implement filter change logic in future tasks
    console.log('Filter change:', filters);
  };

  // Use enhanced widget for expanded size
  if (size === 'expanded') {
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
          <div className="space-y-4">
            {/* Enhanced widget with dynamic data */}
            <EnhancedFundingRoundsWidget
              size="expanded"
              filters={defaultFilters}
              onFilterChange={handleFilterChange}
              realTimeEnabled={true}
              deals={displayDeals.map(deal => ({
                ...deal,
                signals: [],
                relevanceScore: 0.8,
                matchedFilters: [],
                isNew: newDealIds.has(String(deal.id)),
              }))}
              loading={!sectionsLoaded.recentDeals}
              error={null}
            />
            
            {/* View All button for expanded widget */}
            {showViewAll && (
              <div className="flex justify-end">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                  className="bg-brand-green hover:bg-brand-green/90"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View All {recentDeals.length} Deals
                </Button>
              </div>
            )}
          </div>

          {/* Modal for expanded view */}
          <SimpleModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            deals={recentDeals}
            title="All Recent Funding Rounds"
            newDealIds={newDealIds}
          />
        </LoadingTransition>
      </SectionErrorBoundary>
    );
  }

  // Original compact widget for normal size
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
                <span>Stage</span>
                <span>Amount</span>
                <span>Date</span>
              </div>
              {displayDeals.length > 0 ? displayDeals.map((deal, index) => {
                const isNewDeal = newDealIds.has(String(deal.id));
                return (
                  <AnimatedDealItem
                    key={deal.id}
                    deal={deal}
                    isNew={isNewDeal}
                    index={index}
                  >
                    <div className="flex justify-between items-center text-sm rounded-lg px-2 py-2 transition-all duration-300 hover:bg-gray-50">
                      <span className={`hover:underline cursor-pointer font-medium ${isNewDeal ? 'text-green-700' : 'text-blue-600'}`}>
                        {deal.companyName}
                      </span>
                      <span className="text-gray-600 text-xs">{deal.fundingStage || 'N/A'}</span>
                      <span className="text-brand-charcoal font-semibold text-xs">{deal.formattedAmount}</span>
                      <span className="text-gray-500 text-xs">{deal.formattedDate}</span>
                    </div>
                  </AnimatedDealItem>
                );
              }) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No recent deals available</p>
                </div>
              )}
              
              {/* Dynamic button - View All or View Total */}
              <div className="flex gap-2 mt-4">
                {showViewAll ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View All ({recentDeals.length})
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="flex-1">
                    Total: {recentDeals.length} Deals
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal for expanded view */}
        <SimpleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          deals={recentDeals}
          title="All Recent Funding Rounds"
          newDealIds={newDealIds}
        />
      </LoadingTransition>
    </SectionErrorBoundary>
  );
}
