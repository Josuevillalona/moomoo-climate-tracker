'use client';

import React, { useState, useEffect } from 'react';
import { climateVCApi } from '../../../lib/api/climate-vc-api';
import { EnhancedDeal, AlexDealFilters } from '../../../types/climate-schema';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  Star, 
  TrendingUp, 
  Brain, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Eye,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Sparkles,
  Globe
} from 'lucide-react';

interface AlexProspectsWidgetProps {
  size?: 'normal' | 'expanded';
  className?: string;
}

const AlexProspectsWidget: React.FC<AlexProspectsWidgetProps> = ({
  size = 'normal',
  className = ''
}) => {
  const [prospects, setProspects] = useState<EnhancedDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null);

  const isExpanded = size === 'expanded';

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await climateVCApi.getAlexDailyProspects(isExpanded ? 20 : 10);
      
      if (response.error) {
        setError(response.error);
      } else {
        setProspects(response.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prospects');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (dealId: string, status: 'interested' | 'passed') => {
    try {
      await climateVCApi.updateAlexReview(dealId, status);
      // Refresh the list
      loadProspects();
    } catch (err) {
      console.error('Failed to update review:', err);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
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

  const formatAmount = (amount?: number) => {
    if (!amount) return 'Undisclosed';
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Alex's Top Prospects</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Alex's Top Prospects</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadProspects} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Alex's Top Prospects</span>
            <Badge variant="secondary" className="ml-2">
              {prospects.length} deals
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={loadProspects}>
            <TrendingUp className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {prospects.length > 0 ? prospects.map((deal) => (
            <div
              key={deal.id}
              className={`
                p-4 rounded-lg border border-gray-100 hover:border-gray-200 
                hover:shadow-sm transition-all duration-200
                ${selectedDeal === deal.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}
              `}
              onClick={() => setSelectedDeal(selectedDeal === deal.id ? null : deal.id)}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                      {deal.company?.name}
                    </h3>
                    {deal.company?.has_ai_focus && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                        <Brain className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                    )}
                    {deal.company?.verification_status === 'verified' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  {deal.company?.climate_sub_sectors && deal.company.climate_sub_sectors.length > 0 && (
                    <p className="text-sm text-gray-600 mb-2">
                      {deal.company.climate_sub_sectors.slice(0, 2).join(', ')}
                      {deal.company.climate_sub_sectors.length > 2 && (
                        <span className="text-gray-400"> +{deal.company.climate_sub_sectors.length - 2} more</span>
                      )}
                    </p>
                  )}
                </div>
                
                {/* Investment Score */}
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full font-semibold text-sm ${getScoreColor(deal.investment_score || 0)}`}>
                    {deal.investment_score || 0}
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Details Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getStageColor(deal.funding_stage || '')}>
                    {deal.funding_stage || 'N/A'}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-1 text-sm">
                  <DollarSign className="w-3 h-3 text-gray-400" />
                  <span className="font-medium">{formatAmount(deal.amount_raised_usd)}</span>
                </div>
                
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span>{deal.company?.headquarters_country || 'Unknown'}</span>
                </div>
                
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <span>{formatDate(deal.date_announced)}</span>
                </div>
              </div>

              {/* Investors */}
              {deal.investors && deal.investors.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Investors:</p>
                  <div className="flex flex-wrap gap-1">
                    {deal.investors.slice(0, 3).map((dealInvestor) => (
                      <Badge key={dealInvestor.id} variant="outline" className="text-xs">
                        {dealInvestor.investor?.name}
                        {dealInvestor.role === 'lead' && (
                          <span className="ml-1 text-blue-600">•</span>
                        )}
                      </Badge>
                    ))}
                    {deal.investors.length > 3 && (
                      <Badge variant="outline" className="text-xs text-gray-500">
                        +{deal.investors.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Alex's Review Actions */}
              {deal.alex_review_status === 'pending' && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Source: {deal.source_name} • Score: {Math.round((deal.confidence_score || 0) * 100)}%
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReview(deal.id, 'interested');
                      }}
                      className="text-green-600 hover:bg-green-50"
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Interested
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReview(deal.id, 'passed');
                      }}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <ThumbsDown className="w-3 h-3 mr-1" />
                      Pass
                    </Button>
                  </div>
                </div>
              )}

              {/* Expanded Details */}
              {selectedDeal === deal.id && isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Company Details</p>
                      <div className="space-y-1 text-gray-600">
                        {deal.company?.website && (
                          <div className="flex items-center space-x-1">
                            <Globe className="w-3 h-3" />
                            <a href={deal.company.website} target="_blank" rel="noopener noreferrer" 
                               className="text-blue-600 hover:underline">
                              Website
                            </a>
                          </div>
                        )}
                        {deal.company?.founding_year && (
                          <p>Founded: {deal.company.founding_year}</p>
                        )}
                        {deal.company?.employee_count_range && (
                          <p>Team Size: {deal.company.employee_count_range}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-700 mb-2">Deal Details</p>
                      <div className="space-y-1 text-gray-600">
                        <p>Currency: {deal.original_currency}</p>
                        <p>Source: {deal.source_type}</p>
                        {deal.source_url && (
                          <a href={deal.source_url} target="_blank" rel="noopener noreferrer"
                             className="text-blue-600 hover:underline">
                            View Source
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="text-center py-8">
              <Star className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No prospects available</p>
              <p className="text-gray-400 text-xs mt-1">Check back later for new deals</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t mt-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live updates from {prospects.length > 0 ? 'multiple sources' : 'pending'}</span>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="w-3 h-3 mr-1" />
              View All
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlexProspectsWidget;
