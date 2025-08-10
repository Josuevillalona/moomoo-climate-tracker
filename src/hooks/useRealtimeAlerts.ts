import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { EnhancedDeal, AlexDealFilters } from '../types/climate-schema';

interface AlertRule {
  id: string;
  name: string;
  filters: AlexDealFilters;
  isActive: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface UseRealtimeAlertsReturn {
  matchingDeals: EnhancedDeal[];
  totalMatches: number;
  isConnected: boolean;
  connectionState: 'connected' | 'connecting' | 'disconnected';
  subscribe: () => void;
  unsubscribe: () => void;
}

export const useRealtimeAlerts = (alertRules: AlertRule[]): UseRealtimeAlertsReturn => {
  const [matchingDeals, setMatchingDeals] = useState<EnhancedDeal[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  const checkDealAgainstRules = useCallback((deal: any): boolean => {
    return alertRules.some(rule => {
      if (!rule.isActive) return false;
      
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
      if (filters.has_ai_focus !== undefined && deal.has_ai_focus !== filters.has_ai_focus) {
        return false;
      }
      
      // Check funding range
      if (filters.funding_range && deal.amount_raised_usd) {
        if (filters.funding_range.min && deal.amount_raised_usd < filters.funding_range.min) return false;
        if (filters.funding_range.max && deal.amount_raised_usd > filters.funding_range.max) return false;
      }
      
      return true;
    });
  }, [alertRules]);

  const subscribe = useCallback(() => {
    setConnectionState('connecting');
    
    // Subscribe to real-time changes on deals_new table
    const channel = supabase
      .channel('deals_new_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deals', // Will be 'deals_new' after migration
        },
        (payload) => {
          const newDeal = payload.new as any;
          
          if (checkDealAgainstRules(newDeal)) {
            const enhancedDeal: EnhancedDeal = {
              ...newDeal,
              company: {
                id: newDeal.company_id || '',
                name: newDeal.company_name || '',
                has_ai_focus: newDeal.has_ai_focus || false,
                headquarters_country: newDeal.geography_country || '',
                climate_sub_sectors: newDeal.climate_sub_sector ? [newDeal.climate_sub_sector] : [],
                is_climate_tech: true,
                verification_status: 'pending',
                enrichment_status: 'pending',
                confidence_score: 0.5,
                media_mentions: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              investors: [],
            };
            
            setMatchingDeals(prev => [enhancedDeal, ...prev]);
            setTotalMatches(prev => prev + 1);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionState('connected');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          setConnectionState('disconnected');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
      setConnectionState('disconnected');
    };
  }, [checkDealAgainstRules]);

  const unsubscribe = useCallback(() => {
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  useEffect(() => {
    const cleanup = subscribe();
    return cleanup;
  }, [subscribe]);

  // Load initial matches from today
  useEffect(() => {
    const loadTodayMatches = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: deals } = await supabase
        .from('deals') // Will be 'deals_new' after migration
        .select('*')
        .gte('created_at', today)
        .order('created_at', { ascending: false });
      
      if (deals) {
        const matching = deals.filter(checkDealAgainstRules);
        setTotalMatches(matching.length);
      }
    };
    
    loadTodayMatches();
  }, [checkDealAgainstRules]);

  return {
    matchingDeals,
    totalMatches,
    isConnected,
    connectionState,
    subscribe,
    unsubscribe,
  };
};
