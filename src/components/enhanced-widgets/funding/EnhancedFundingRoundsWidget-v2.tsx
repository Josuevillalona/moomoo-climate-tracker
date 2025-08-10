'use client';

import React from 'react';
import { EnhancedFundingRoundsProps } from '../../../types/enhanced-widgets';
import { FundingDeal } from '../../../types/api';
import { EnhancedDeal } from '../../../types/climate-schema';
import EnhancedWidgetWrapper from '../EnhancedWidgetWrapper';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { MoreHorizontal, TrendingUp, Calendar, DollarSign, Brain, Sparkles } from 'lucide-react';

// Updated props to support both old and new schema
interface UpdatedFundingRoundsProps extends Omit<EnhancedFundingRoundsProps, 'deals'> {
  deals: FundingDeal[] | EnhancedDeal[];
  useNewSchema?: boolean;
}

const EnhancedFundingRoundsWidget: React.FC<UpdatedFundingRoundsProps> = ({
  size,
  filters,
  onFilterChange,
  realTimeEnabled,
  deals,
  loading,
  error,
  useNewSchema = false,
}) => {
  const isExpanded = size === 'expanded';
  
  // Helper function to normalize deals for display
  const normalizeDeals = (dealsList: FundingDeal[] | EnhancedDeal[]) => {
    return dealsList.map(deal => {
      if (useNewSchema && 'company' in deal) {
        // New schema (EnhancedDeal)
        const enhancedDeal = deal as EnhancedDeal;
        return {
          id: enhancedDeal.id,
          companyName: enhancedDeal.company?.name || 'Unknown Company',
          fundingStage: enhancedDeal.funding_stage || 'N/A',
          amountRaised: enhancedDeal.amount_raised_usd || 0,
          dateAnnounced: enhancedDeal.date_announced || '',
          formattedDate: formatDate(enhancedDeal.date_announced),
          leadInvestors: enhancedDeal.investors?.filter(inv => inv.role === 'lead').map(inv => inv.investor?.name || '') || [],
          otherInvestors: enhancedDeal.investors?.filter(inv => inv.role !== 'lead').map(inv => inv.investor?.name || '') || [],
          climateSector: enhancedDeal.company?.climate_sub_sectors?.[0] || 'Climate Tech',
          country: enhancedDeal.company?.headquarters_country || 'Unknown',
          status: enhancedDeal.status || 'new',
          createdAt: enhancedDeal.created_at,
          daysAgo: calculateDaysAgo(enhancedDeal.date_announced),
          // Enhanced fields
          hasAiFocus: enhancedDeal.company?.has_ai_focus || false,
          investmentScore: enhancedDeal.investment_score || 0,
          verificationStatus: enhancedDeal.company?.verification_status || 'pending',
          confidenceScore: enhancedDeal.confidence_score || 0,
          sourceName: enhancedDeal.source_name || 'Unknown',
          alexReviewStatus: enhancedDeal.alex_review_status || 'pending',
          // Compatibility fields
          sector: enhancedDeal.company?.climate_sub_sectors?.[0] || 'Climate Tech',
          fundingAmount: enhancedDeal.amount_raised_usd || 0,
          leadInvestor: enhancedDeal.investors?.find(inv => inv.role === 'lead')?.investor?.name || null,
          signals: [],
          relevanceScore: (enhancedDeal.confidence_score || 0) * 100,
          matchedFilters: [],
          isNew: enhancedDeal.status === 'new',
        };
      } else {
        // Old schema (FundingDeal)
        const oldDeal = deal as FundingDeal;
        return {
          ...oldDeal,
          // Enhanced compatibility fields
          hasAiFocus: false, // Unknown in old schema
          investmentScore: 0, // Not available in old schema
          verificationStatus: 'pending' as const,
          confidenceScore: 0.5,
          sourceName: 'Legacy Source',
          alexReviewStatus: 'pending' as const,
          // Ensure compatibility
          sector: oldDeal.climateSector,
          fundingAmount: oldDeal.amountRaised,
          leadInvestor: oldDeal.leadInvestors?.[0] || null,
          signals: [],
          relevanceScore: 0.8,
          matchedFilters: [],
          isNew: false,
        };
      }
    });
  };

  const normalizedDeals = normalizeDeals(deals);

  const formatAmount = (amount: number | null) => {
    if (!amount) return 'Undisclosed';
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  const calculateDaysAgo = (dateStr?: string | null) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'seed': return 'bg-green-100 text-green-800';
      case 'series a': case 'series-a': return 'bg-blue-100 text-blue-800';
      case 'series b': case 'series-b': return 'bg-purple-100 text-purple-800';
      case 'series c': case 'series-c': case 'series c+': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <EnhancedWidgetWrapper
      title={useNewSchema ? "Enhanced Funding Rounds" : "Recent Funding Rounds"}
      subtitle={`${normalizedDeals.length} deals found`}
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
            <div className="col-span-2">{useNewSchema ? 'Investors' : 'Lead Investor'}</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">
              {useNewSchema ? 'Score' : 'Actions'}
            </div>
          </div>
        )}

        {/* Deals list */}
        <div className="space-y-3">
          {normalizedDeals.length > 0 ? normalizedDeals.map((deal, index) => (
            <div
              key={deal.id}
              className={`
                ${isExpanded 
                  ? 'p-4 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200' 
                  : 'flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200'
                }
                ${deal.isNew ? 'ring-2 ring-green-500 bg-green-50' : 'bg-white'}
              `}
            >
              {isExpanded ? (
                // Expanded layout - responsive
                <>
                  {/* Desktop layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-blue-600 hover:underline cursor-pointer">
                          {deal.companyName}
                        </div>
                        {useNewSchema && deal.hasAiFocus && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                            <Brain className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        )}
                        {useNewSchema && deal.verificationStatus === 'verified' && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
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
                      {deal.otherInvestors && deal.otherInvestors.length > 0 && (
                        <div className="text-xs text-gray-400">
                          +{deal.otherInvestors.length} others
                        </div>
                      )}
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
                      {useNewSchema ? (
                        <div className={`px-2 py-1 rounded-full font-semibold text-xs ${getScoreColor(deal.investmentScore)}`}>
                          {deal.investmentScore}
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Mobile/Tablet layout */}
                  <div className="md:hidden space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-blue-600 hover:underline cursor-pointer">
                            {deal.companyName}
                          </div>
                          {useNewSchema && deal.hasAiFocus && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                              <Brain className="w-3 h-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        {deal.sector && (
                          <div className="text-xs text-gray-500 mt-1">{deal.sector}</div>
                        )}
                      </div>
                      {useNewSchema ? (
                        <div className={`px-2 py-1 rounded-full font-semibold text-xs ${getScoreColor(deal.investmentScore)}`}>
                          {deal.investmentScore}
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      )}
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
                    <div className="flex items-center space-x-2">
                      <div className="font-medium text-blue-600 hover:underline cursor-pointer text-sm">
                        {deal.companyName}
                      </div>
                      {useNewSchema && deal.hasAiFocus && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                          <Brain className="w-3 h-3" />
                        </Badge>
                      )}
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
                    {useNewSchema && deal.investmentScore > 0 && (
                      <div className={`text-xs font-medium ${getScoreColor(deal.investmentScore).split(' ')[0]}`}>
                        Score: {deal.investmentScore}
                      </div>
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
                  <span>
                    {useNewSchema ? 'Enhanced real-time updates' : 'Real-time updates enabled'}
                  </span>
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
