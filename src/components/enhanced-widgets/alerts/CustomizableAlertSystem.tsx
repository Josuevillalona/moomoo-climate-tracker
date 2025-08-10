'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { 
  Bell, 
  Settings, 
  Filter, 
  Zap, 
  Mail, 
  Brain, 
  DollarSign,
  MapPin,
  Building,
  AlertTriangle,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { EnhancedDeal, AlexDealFilters } from '../../../types/climate-schema';
import { AlertConfigDialog } from './AlertConfigDialog';
import { useRealtimeAlerts } from '../../../hooks/useRealtimeAlerts';

interface CustomizableAlertSystemProps {
  size?: 'compact' | 'expanded' | 'full';
  enableNotifications?: boolean;
  enableEmailAlerts?: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  filters: AlexDealFilters;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  triggerCount: number;
  lastTriggered?: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  slackEnabled?: boolean;
}

const CustomizableAlertSystem: React.FC<CustomizableAlertSystemProps> = ({
  size = 'expanded',
  enableNotifications = true,
  enableEmailAlerts = true,
}) => {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: 'alex-ai-seed',
      name: 'AI Seed Deals',
      description: 'Seed stage deals with AI focus',
      filters: {
        funding_stages: ['Seed'],
        has_ai_focus: true,
        investment_score_min: 70,
        funding_range: { min: 500000, max: 5000000 }
      },
      isActive: true,
      priority: 'high',
      triggerCount: 12,
      lastTriggered: '2025-08-08T15:30:00Z',
      emailEnabled: true,
      pushEnabled: true,
    },
    {
      id: 'alex-industrial-series-a',
      name: 'Industrial Series A',
      description: 'Series A in industrial automation & supply chain',
      filters: {
        funding_stages: ['Series A'],
        climate_sectors: ['Industrial Automation', 'Supply Chain'],
        countries: ['United States', 'Canada', 'United Kingdom'],
        funding_range: { min: 1000000, max: 15000000 },
        investment_score_min: 60
      },
      isActive: true,
      priority: 'medium',
      triggerCount: 8,
      lastTriggered: '2025-08-07T09:15:00Z',
      emailEnabled: true,
      pushEnabled: false,
    },
    {
      id: 'alex-stealth-deals',
      name: 'Stealth Mode Opportunities',
      description: 'Low media mention deals with high scores',
      filters: {
        investment_score_min: 80,
        confidence_score_min: 0.7,
        alex_review_status: ['pending']
      },
      isActive: true,
      priority: 'critical',
      triggerCount: 3,
      lastTriggered: '2025-08-09T11:45:00Z',
      emailEnabled: true,
      pushEnabled: true,
      slackEnabled: true,
    }
  ]);

  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
  const [recentMatches, setRecentMatches] = useState<EnhancedDeal[]>([]);

  // Use real-time alerts hook
  const { 
    matchingDeals, 
    totalMatches, 
    isConnected, 
    connectionState,
    subscribe,
    unsubscribe 
  } = useRealtimeAlerts(alertRules.filter(rule => rule.isActive));

  useEffect(() => {
    if (matchingDeals.length > 0) {
      setRecentMatches(prev => [...matchingDeals, ...prev].slice(0, 10));
      
      // Trigger notifications for new matches
      matchingDeals.forEach((deal: EnhancedDeal) => {
        triggerAlert(deal);
      });
    }
  }, [matchingDeals]);

  const triggerAlert = (deal: EnhancedDeal) => {
    // Find matching rules
    const matchingRules = alertRules.filter(rule => 
      rule.isActive && doesDealMatchRule(deal, rule)
    );

    matchingRules.forEach(rule => {
      // Update trigger count
      setAlertRules(prev => 
        prev.map(r => 
          r.id === rule.id 
            ? { ...r, triggerCount: r.triggerCount + 1, lastTriggered: new Date().toISOString() }
            : r
        )
      );

      // Send notifications based on rule settings
      if (rule.pushEnabled && enableNotifications) {
        sendPushNotification(deal, rule);
      }
      
      if (rule.emailEnabled && enableEmailAlerts) {
        sendEmailAlert(deal, rule);
      }
      
      if (rule.slackEnabled) {
        sendSlackAlert(deal, rule);
      }
    });
  };

  const doesDealMatchRule = (deal: EnhancedDeal, rule: AlertRule): boolean => {
    const filters = rule.filters;
    
    // Check investment score
    if (filters.investment_score_min && (deal.investment_score || 0) < filters.investment_score_min) {
      return false;
    }
    
    // Check funding stage
    if (filters.funding_stages?.length && !filters.funding_stages.includes(deal.funding_stage || '')) {
      return false;
    }
    
    // Check AI focus
    if (filters.has_ai_focus !== undefined && deal.company?.has_ai_focus !== filters.has_ai_focus) {
      return false;
    }
    
    // Check funding range
    if (filters.funding_range && deal.amount_raised_usd) {
      if (filters.funding_range.min && deal.amount_raised_usd < filters.funding_range.min) return false;
      if (filters.funding_range.max && deal.amount_raised_usd > filters.funding_range.max) return false;
    }
    
    // Check countries
    if (filters.countries?.length && !filters.countries.includes(deal.company?.headquarters_country || '')) {
      return false;
    }
    
    // Check climate sectors
    if (filters.climate_sectors?.length) {
      const dealSectors = deal.company?.climate_sub_sectors || [];
      if (!filters.climate_sectors.some(sector => dealSectors.includes(sector))) {
        return false;
      }
    }
    
    return true;
  };

  const sendPushNotification = (deal: EnhancedDeal, rule: AlertRule) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🚨 ${rule.name} Alert`, {
        body: `${deal.company?.name} raised ${formatAmount(deal.amount_raised_usd)} in ${deal.funding_stage}`,
        icon: '/favicon.ico',
        tag: `alert-${rule.id}-${deal.id}`,
      });
    }
  };

  const sendEmailAlert = async (deal: EnhancedDeal, rule: AlertRule) => {
    // This would integrate with your email service (SendGrid, etc.)
    console.log('📧 Email alert triggered:', { deal: deal.company?.name, rule: rule.name });
    
    // Example API call
    try {
      await fetch('/api/alerts/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleName: rule.name,
          deal: {
            companyName: deal.company?.name,
            amount: deal.amount_raised_usd,
            stage: deal.funding_stage,
            score: deal.investment_score,
            url: deal.source_url
          },
          recipient: 'alex@climatevcp.com' // Alex's email
        })
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  };

  const sendSlackAlert = async (deal: EnhancedDeal, rule: AlertRule) => {
    // Slack webhook integration
    console.log('📱 Slack alert triggered:', { deal: deal.company?.name, rule: rule.name });
  };

  const formatAmount = (amount?: number | null) => {
    if (!amount) return 'Undisclosed';
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'connecting': return 'text-yellow-600 bg-yellow-50';
      case 'disconnected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (size === 'compact') {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Alerts
            </CardTitle>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConnectionStatusColor()}`}>
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alertRules.filter(rule => rule.isActive).map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${rule.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                  <span className="text-sm font-medium">{rule.name}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {rule.triggerCount}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-xl flex items-center">
              <Zap className="w-6 h-6 mr-2 text-orange-500" />
              Real-Time Deal Alerts
            </CardTitle>
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getConnectionStatusColor()}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span>{connectionState === 'connected' ? 'Live Updates' : 'Reconnecting...'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Bell className="w-3 h-3" />
              <span>{totalMatches} today</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfigDialog(true)}
              className="flex items-center space-x-1"
            >
              <Settings className="w-4 h-4" />
              <span>Configure</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Alert Rules */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Active Alert Rules
          </h3>
          <div className="grid gap-3">
            {alertRules.map(rule => (
              <div key={rule.id} className={`p-4 rounded-lg border-2 ${rule.isActive ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <Badge className={getPriorityColor(rule.priority)} variant="outline">
                      {rule.priority}
                    </Badge>
                    <h4 className="font-semibold">{rule.name}</h4>
                    {!rule.isActive && <Badge variant="secondary">Paused</Badge>}
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>{rule.triggerCount} matches</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRule(rule);
                        setShowConfigDialog(true);
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                
                {/* Filter Summary */}
                <div className="flex flex-wrap gap-2">
                  {rule.filters.funding_stages?.map(stage => (
                    <Badge key={stage} variant="secondary" className="text-xs">
                      {stage}
                    </Badge>
                  ))}
                  {rule.filters.has_ai_focus && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
                      <Brain className="w-3 h-3 mr-1" />
                      AI Focus
                    </Badge>
                  )}
                  {rule.filters.funding_range && (
                    <Badge variant="secondary" className="text-xs">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {formatAmount(rule.filters.funding_range.min)} - {formatAmount(rule.filters.funding_range.max)}
                    </Badge>
                  )}
                  {rule.filters.countries?.slice(0, 2).map(country => (
                    <Badge key={country} variant="secondary" className="text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      {country}
                    </Badge>
                  ))}
                  {rule.filters.investment_score_min && (
                    <Badge variant="secondary" className="text-xs">
                      Score ≥ {rule.filters.investment_score_min}
                    </Badge>
                  )}
                </div>
                
                {/* Notification Settings */}
                <div className="flex items-center space-x-4 mt-3 pt-3 border-t">
                  <div className="flex items-center space-x-1">
                    <Mail className={`w-4 h-4 ${rule.emailEnabled ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${rule.emailEnabled ? 'text-blue-600' : 'text-gray-500'}`}>
                      Email
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Bell className={`w-4 h-4 ${rule.pushEnabled ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${rule.pushEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                      Push
                    </span>
                  </div>
                  {rule.slackEnabled && (
                    <div className="flex items-center space-x-1">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-purple-600">Slack</span>
                    </div>
                  )}
                  {rule.lastTriggered && (
                    <div className="text-xs text-gray-500 ml-auto">
                      Last: {new Date(rule.lastTriggered).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Recent Matches
            </h3>
            <div className="space-y-2">
              {recentMatches.slice(0, 3).map(deal => (
                <div key={deal.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="font-semibold text-orange-900">{deal.company?.name}</div>
                      <Badge variant="secondary" className="text-xs">
                        {deal.funding_stage}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {formatAmount(deal.amount_raised_usd)}
                      </Badge>
                      {deal.company?.has_ai_focus && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          <Brain className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-orange-700 font-medium">
                      Score: {deal.investment_score}
                    </div>
                  </div>
                  <div className="text-xs text-orange-600 mt-1">
                    {deal.company?.climate_sub_sectors?.join(', ')} • {deal.company?.headquarters_country}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Configuration Dialog */}
      {showConfigDialog && (
        <AlertConfigDialog
          rule={selectedRule}
          onSave={(updatedRule: AlertRule) => {
            if (selectedRule) {
              setAlertRules(prev => 
                prev.map(r => r.id === selectedRule.id ? updatedRule : r)
              );
            } else {
              setAlertRules(prev => [...prev, { ...updatedRule, id: Date.now().toString() }]);
            }
            setShowConfigDialog(false);
            setSelectedRule(null);
          }}
          onClose={() => {
            setShowConfigDialog(false);
            setSelectedRule(null);
          }}
        />
      )}
    </Card>
  );
};

export default CustomizableAlertSystem;
