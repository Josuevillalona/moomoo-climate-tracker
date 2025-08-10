'use client';

import React, { useState, useEffect } from 'react';
import { climateVCApi } from '../../../lib/api/climate-vc-api';
import { EnhancedDeal, AlexDealFilters } from '../../../types/climate-schema';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Bot,
  Cpu,
  Sparkles,
  Filter,
  RefreshCw,
  ArrowRight,
  DollarSign,
  Calendar,
  MapPin
} from 'lucide-react';

interface AIFocusedDealsWidgetProps {
  size?: 'normal' | 'expanded';
  className?: string;
}

const AIFocusedDealsWidget: React.FC<AIFocusedDealsWidgetProps> = ({
  size = 'normal',
  className = ''
}) => {
  const [deals, setDeals] = useState<EnhancedDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AlexDealFilters>({
    has_ai_focus: true,
    investment_score_min: 60,
    alex_review_status: ['pending', 'interested']
  });

  const isExpanded = size === 'expanded';

  useEffect(() => {
    loadAIDeals();
  }, [filters]);

  const loadAIDeals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await climateVCApi.searchDeals(
        filters,
        1,
        isExpanded ? 15 : 8
      );
      
      if (response.error) {
        setError(response.error);
      } else {
        setDeals(response.data?.deals || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI deals');
    } finally {
      setLoading(false);
    }
  };

  const getAISignalColor = (signalType: string) => {
    switch (signalType) {
      case 'ai_mention': return 'bg-blue-100 text-blue-800';
      case 'ml_capability': return 'bg-purple-100 text-purple-800';
      case 'automation': return 'bg-green-100 text-green-800';
      case 'intelligence': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'seed': return 'bg-emerald-100 text-emerald-800';
      case 'series a': case 'series-a': return 'bg-blue-100 text-blue-800';
      case 'series b': case 'series-b': return 'bg-purple-100 text-purple-800';
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
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString();
  };

  // Simulate AI signals for demonstration
  const generateAISignals = (deal: EnhancedDeal) => {
    const signals = [];
    
    if (deal.company?.name.toLowerCase().includes('ai')) {
      signals.push({ type: 'ai_mention', confidence: 0.95 });
    }
    if (deal.company?.description?.toLowerCase().includes('machine learning')) {
      signals.push({ type: 'ml_capability', confidence: 0.88 });
    }
    if (deal.company?.climate_sub_sectors?.some(s => s.includes('Automation'))) {
      signals.push({ type: 'automation', confidence: 0.92 });
    }
    
    return signals;
  };

  const updateFilters = (newFilters: Partial<AlexDealFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI-Powered Climate Deals</span>
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
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI-Powered Climate Deals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadAIDeals} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span>AI-Powered Climate Tech</span>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 ml-2">
              {deals.length} deals
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {/* Score Filter */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-gray-500">Min Score:</span>
              <select 
                value={filters.investment_score_min || 60}
                onChange={(e) => updateFilters({ investment_score_min: parseInt(e.target.value) })}
                className="border rounded px-2 py-1 text-xs"
              >
                <option value={50}>50+</option>
                <option value={60}>60+</option>
                <option value={70}>70+</option>
                <option value={80}>80+</option>
              </select>
            </div>
            
            <Button variant="ghost" size="sm" onClick={loadAIDeals}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-lg font-semibold text-purple-600">
              <Bot className="w-4 h-4" />
              <span>{deals.filter(d => d.investment_score && d.investment_score >= 80).length}</span>
            </div>
            <p className="text-xs text-gray-500">High-Score AI</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-lg font-semibold text-green-600">
              <Zap className="w-4 h-4" />
              <span>{deals.filter(d => d.alex_review_status === 'pending').length}</span>
            </div>
            <p className="text-xs text-gray-500">Need Review</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-lg font-semibold text-blue-600">
              <TrendingUp className="w-4 h-4" />
              <span>
                {formatAmount(deals.reduce((sum, d) => sum + (d.amount_raised_usd || 0), 0))}
              </span>
            </div>
            <p className="text-xs text-gray-500">Total Funding</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {deals.length > 0 ? deals.map((deal) => {
            const aiSignals = generateAISignals(deal);
            
            return (
              <div
                key={deal.id}
                className="p-4 rounded-lg border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all duration-200 bg-gradient-to-r from-white to-purple-50/30"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 hover:text-purple-600 cursor-pointer">
                        {deal.company?.name}
                      </h3>
                      
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                        <Brain className="w-3 h-3 mr-1" />
                        AI
                      </Badge>
                      
                      {deal.company?.verification_status === 'verified' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    {deal.company?.climate_sub_sectors && (
                      <p className="text-sm text-gray-600 mb-2">
                        {deal.company.climate_sub_sectors.slice(0, 2).join(', ')}
                      </p>
                    )}
                  </div>
                  
                  {/* Investment Score with AI Boost Indicator */}
                  <div className="flex items-center space-x-2">
                    <div className="px-3 py-1 rounded-full font-semibold text-sm bg-purple-100 text-purple-800">
                      {deal.investment_score || 0}
                      {(deal.investment_score || 0) >= 70 && (
                        <Cpu className="w-3 h-3 ml-1 inline" />
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Signals */}
                {aiSignals.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">AI Signals:</p>
                    <div className="flex flex-wrap gap-1">
                      {aiSignals.map((signal, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className={`text-xs ${getAISignalColor(signal.type)}`}
                        >
                          {signal.type.replace('_', ' ')} ({Math.round(signal.confidence * 100)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deal Details */}
                <div className={`grid ${isExpanded ? 'grid-cols-4' : 'grid-cols-2'} gap-3 mb-3`}>
                  <div className="flex items-center space-x-1 text-sm">
                    <Badge variant="outline" className={getStageColor(deal.funding_stage || '')}>
                      {deal.funding_stage || 'N/A'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-sm">
                    <DollarSign className="w-3 h-3 text-gray-400" />
                    <span className="font-medium">{formatAmount(deal.amount_raised_usd)}</span>
                  </div>
                  
                  {isExpanded && (
                    <>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{deal.company?.headquarters_country || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(deal.date_announced)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Investors & Source */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div>
                    {deal.investors && deal.investors.length > 0 ? (
                      <span>
                        Led by {deal.investors.find(i => i.role === 'lead')?.investor?.name || deal.investors[0]?.investor?.name}
                        {deal.investors.length > 1 && ` +${deal.investors.length - 1} others`}
                      </span>
                    ) : (
                      <span>Investors TBD</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span>via {deal.source_name}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Review Status for Pending Deals */}
                {deal.alex_review_status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Awaiting Review
                      </Badge>
                      
                      <Button variant="outline" size="sm" className="text-purple-600 hover:bg-purple-50">
                        <Brain className="w-3 h-3 mr-1" />
                        Review Deal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="text-center py-8">
              <Brain className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No AI-focused deals found</p>
              <p className="text-gray-400 text-xs mt-1">Adjust filters or check back later</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t mt-4">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Filter className="w-3 h-3" />
                <span>AI-focused • Score {filters.investment_score_min}+ • Auto-filtered</span>
              </div>
            </div>
            
            <Button variant="outline" size="sm">
              <TrendingUp className="w-3 h-3 mr-1" />
              View All AI Deals
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIFocusedDealsWidget;
