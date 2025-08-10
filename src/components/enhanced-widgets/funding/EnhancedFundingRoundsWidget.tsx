'use client';

import React from 'react';
import { EnhancedFundingRoundsProps } from '../../../types/enhanced-widgets';
import { FundingDeal } from '../../../types/api';
import EnhancedWidgetWrapper from '../EnhancedWidgetWrapper';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { MoreHorizontal, TrendingUp, Calendar, DollarSign } from 'lucide-react';

const EnhancedFundingRoundsWidget: React.FC<EnhancedFundingRoundsProps> = ({
  size,
  filters,
  onFilterChange,
  realTimeEnabled,
  deals,
  loading,
  error,
}) => {
  const isExpanded = size === 'expanded';
  
  // Convert regular deals to enhanced deals for display
  const enhancedDeals = deals.map(deal => ({
    ...deal,
    signals: [],
    relevanceScore: 0.8,
    matchedFilters: [],
    isNew: false,
    // Add computed fields for compatibility
    sector: deal.climateSector,
    fundingAmount: deal.amountRaised,
    leadInvestor: deal.leadInvestors?.[0] || null,
  }));

  const formatAmount = (amount: number | null) => {
    if (!amount) return 'Undisclosed';
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const getStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'seed': return 'bg-green-100 text-green-800';
      case 'series a': return 'bg-blue-100 text-blue-800';
      case 'series b': return 'bg-purple-100 text-purple-800';
      case 'series c': case 'series c+': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <EnhancedWidgetWrapper
      title="Recent Funding Rounds"
      subtitle={`${enhancedDeals.length} deals found`}
      size={size}
      loading={loading}
      error={error}
      type="funding"
    >
      <div className="space-y-4">
        {/* Header row for expanded view - hidden on mobile */}
        {isExpanded && (
          <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-medium text-gray-600 border-b pb-2">
            <div className="col-span-3">Company</div>
            <div className="col-span-2">Stage</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Lead Investor</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Actions</div>
          </div>
        )}

        {/* Deals list */}
        <div className="space-y-3">
          {enhancedDeals.length > 0 ? enhancedDeals.map((deal, index) => (
            <div
              key={deal.id}
              className={`
                ${isExpanded 
                  ? 'p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200' 
                  : 'flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200'
                }
              `}
            >
              {isExpanded ? (
                // Expanded layout - responsive
                <>
                  {/* Desktop layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <div className="font-medium text-blue-600 hover:underline cursor-pointer">
                        {deal.companyName}
                      </div>
                      {deal.sector && (
                        <div className="text-xs text-gray-500 mt-1">{deal.sector}</div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Badge 
                        variant="secondary" 
                        className={`${getStageColor(deal.fundingStage || '')} text-xs`}
                      >
                        {deal.fundingStage || 'N/A'}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">
                          {formatAmount(deal.fundingAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">
                        {deal.leadInvestor || 'Undisclosed'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {deal.formattedDate}
                        </span>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile/Tablet layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-blue-600 hover:underline cursor-pointer">
                          {deal.companyName}
                        </div>
                        {deal.sector && (
                          <div className="text-xs text-gray-500 mt-1">{deal.sector}</div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge 
                        variant="secondary" 
                        className={`${getStageColor(deal.fundingStage || '')} text-xs`}
                      >
                        {deal.fundingStage || 'N/A'}
                      </Badge>
                      <div className="flex items-center space-x-1 text-sm">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <span className="font-medium">
                          {formatAmount(deal.fundingAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>{deal.leadInvestor || 'Undisclosed'}</span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{deal.formattedDate}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Compact layout
                <>
                  <div className="flex-1">
                    <div className="font-medium text-blue-600 hover:underline cursor-pointer text-sm">
                      {deal.companyName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {deal.fundingStage || 'N/A'} • {formatAmount(deal.fundingAmount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{deal.formattedDate}</div>
                    {deal.leadInvestor && (
                      <div className="text-xs text-gray-500">{deal.leadInvestor}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <TrendingUp className="w-8 h-8 mx-auto" />
              </div>
              <p className="text-gray-500 text-sm">No recent deals available</p>
              <p className="text-gray-400 text-xs mt-1">Check back later for updates</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {realTimeEnabled && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Real-time updates enabled</span>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm">
              View All Deals
            </Button>
          </div>
        </div>
      </div>
    </EnhancedWidgetWrapper>
  );
};

export default EnhancedFundingRoundsWidget;