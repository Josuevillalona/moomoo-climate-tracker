import { supabase } from '../supabase';
import {
  Deal,
  EnhancedDeal,
  Company,
  Investor,
  DealInvestor,
  AlexDashboardMetrics,
  AlexDealFilters,
  DealSearchResult,
  AlexFilterSettings,
  AlexDealView,
  DataSource,
  ApiResponse
} from '../../types/climate-schema';

export class ClimateVCApiService {
  
  /**
   * Get Alex's daily prospects - deals with high investment scores
   */
  async getAlexDailyProspects(limit: number = 50): Promise<ApiResponse<EnhancedDeal[]>> {
    try {
      const { data, error } = await supabase
        .from('alex_daily_prospects')
        .select(`
          *,
          company:companies(*),
          investors:deal_investors(
            *,
            investor:investors(*)
          )
        `)
        .order('investment_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        data: data as EnhancedDeal[],
        error: null,
        metadata: {
          total_count: data?.length || 0
        }
      };
    } catch (error) {
      console.error('Error fetching Alex daily prospects:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search deals with Alex's intelligent filtering
   */
  async searchDeals(
    filters: AlexDealFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<DealSearchResult>> {
    try {
      let query = supabase
        .from('deals')
        .select(`
          *,
          company:companies(*),
          investors:deal_investors(
            *,
            investor:investors(*)
          )
        `, { count: 'exact' });

      // Apply Alex's investment score filter
      if (filters.investment_score_min) {
        query = query.gte('investment_score', filters.investment_score_min);
      }

      // Apply review status filter
      if (filters.alex_review_status?.length) {
        query = query.in('alex_review_status', filters.alex_review_status);
      }

      // Apply funding stage filter
      if (filters.funding_stages?.length) {
        query = query.in('funding_stage', filters.funding_stages);
      }

      // Apply funding range filter
      if (filters.funding_range?.min) {
        query = query.gte('amount_raised_usd', filters.funding_range.min);
      }
      if (filters.funding_range?.max) {
        query = query.lte('amount_raised_usd', filters.funding_range.max);
      }

      // Apply date range filter
      if (filters.date_range?.start) {
        query = query.gte('date_announced', filters.date_range.start);
      }
      if (filters.date_range?.end) {
        query = query.lte('date_announced', filters.date_range.end);
      }

      // Apply confidence score filter
      if (filters.confidence_score_min) {
        query = query.gte('confidence_score', filters.confidence_score_min);
      }

      // Company-level filters (requires joining)
      if (filters.has_ai_focus !== undefined) {
        query = query.eq('companies.has_ai_focus', filters.has_ai_focus);
      }

      if (filters.climate_sectors?.length) {
        query = query.overlaps('companies.climate_sub_sectors', filters.climate_sectors);
      }

      if (filters.countries?.length) {
        query = query.in('companies.headquarters_country', filters.countries);
      }

      // Add pagination
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      // Order by investment score and recency
      query = query.order('investment_score', { ascending: false })
                  .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: {
          deals: data as EnhancedDeal[],
          total_count: count || 0,
          filtered_count: data?.length || 0,
          filters_applied: filters,
          page,
          page_size: pageSize
        },
        error: null,
        metadata: {
          total_count: count || 0,
          page,
          page_size: pageSize,
          filters_applied: filters
        }
      };
    } catch (error) {
      console.error('Error searching deals:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get Alex's dashboard metrics
   */
  async getAlexDashboardMetrics(): Promise<ApiResponse<AlexDashboardMetrics>> {
    try {
      // Execute multiple queries for comprehensive metrics
      const [
        dealsResult,
        weeklyDealsResult,
        pendingReviewResult,
        highScoreResult,
        fundingStatsResult,
        sectorStatsResult,
        pipelineHealthResult
      ] = await Promise.all([
        // Total deals
        supabase.from('deals').select('count'),
        
        // Deals this week
        supabase
          .from('deals')
          .select('count')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Deals requiring review
        supabase
          .from('deals')
          .select('count')
          .eq('alex_review_status', 'pending'),
        
        // High score deals (>70)
        supabase
          .from('deals')
          .select('count')
          .gte('investment_score', 70),
        
        // Funding statistics
        supabase
          .from('deals')
          .select('amount_raised_usd')
          .not('amount_raised_usd', 'is', null),
        
        // Sector breakdown
        supabase
          .from('deals')
          .select(`
            companies!inner(climate_sub_sectors),
            amount_raised_usd,
            investment_score
          `)
          .not('companies.climate_sub_sectors', 'is', null),
        
        // Pipeline health from view
        supabase.from('pipeline_health').select('*')
      ]);

      // Calculate funding statistics
      const fundingAmounts = fundingStatsResult.data?.map(d => d.amount_raised_usd).filter(Boolean) || [];
      const totalFunding = fundingAmounts.reduce((sum, amount) => sum + amount, 0);
      const avgDealSize = fundingAmounts.length > 0 ? totalFunding / fundingAmounts.length : 0;

      // Process sector breakdown
      const sectorMap = new Map<string, { count: number; funding: number; scores: number[] }>();
      sectorStatsResult.data?.forEach((item: any) => {
        const sectors = item.companies?.climate_sub_sectors || [];
        if (Array.isArray(sectors)) {
          sectors.forEach((sector: string) => {
            if (!sectorMap.has(sector)) {
              sectorMap.set(sector, { count: 0, funding: 0, scores: [] });
            }
            const sectorData = sectorMap.get(sector)!;
            sectorData.count++;
            if (item.amount_raised_usd) sectorData.funding += item.amount_raised_usd;
            if (item.investment_score) sectorData.scores.push(item.investment_score);
          });
        }
      });

      const topSectors = Array.from(sectorMap.entries())
        .map(([sector, data]) => ({
          sector,
          deal_count: data.count,
          total_funding: data.funding,
          avg_investment_score: data.scores.length > 0 
            ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length 
            : 0,
          percentage: (data.count / (sectorStatsResult.data?.length || 1)) * 100
        }))
        .sort((a, b) => b.deal_count - a.deal_count)
        .slice(0, 10);

      const metrics: AlexDashboardMetrics = {
        total_deals: dealsResult.count || 0,
        deals_this_week: weeklyDealsResult.count || 0,
        deals_requiring_review: pendingReviewResult.count || 0,
        high_score_deals: highScoreResult.count || 0,
        total_funding_usd: totalFunding,
        average_deal_size: avgDealSize,
        top_ai_sectors: topSectors,
        top_funding_stages: [], // Will be calculated separately if needed
        geographic_distribution: [], // Will be calculated separately if needed
        pipeline_health: {
          active_sources: pipelineHealthResult.data?.filter(s => s.is_active).length || 0,
          total_sources: pipelineHealthResult.data?.length || 0,
          avg_reliability_score: pipelineHealthResult.data?.reduce((sum, s) => sum + s.reliability_score, 0) / (pipelineHealthResult.data?.length || 1) || 0,
          last_update: new Date().toISOString(),
          deals_added_24h: 0, // Calculate if needed
          error_rate: 0 // Calculate if needed
        }
      };

      return {
        data: metrics,
        error: null
      };
    } catch (error) {
      console.error('Error fetching Alex dashboard metrics:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update Alex's review for a deal
   */
  async updateAlexReview(
    dealId: string, 
    status: 'interested' | 'passed' | 'auto_filtered',
    notes?: string
  ): Promise<ApiResponse<Deal>> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .update({
          alex_review_status: status,
          alex_notes: notes,
          alex_review_date: new Date().toISOString()
        })
        .eq('id', dealId)
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error updating Alex review:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get Alex's filter settings
   */
  async getAlexFilterSettings(): Promise<ApiResponse<AlexFilterSettings[]>> {
    try {
      const { data, error } = await supabase
        .from('alex_filter_settings')
        .select('*')
        .order('setting_name');

      if (error) throw error;

      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error fetching Alex filter settings:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update Alex's filter settings
   */
  async updateAlexFilterSettings(
    settingName: string, 
    filterValues: Record<string, any>,
    isEnabled: boolean = true
  ): Promise<ApiResponse<AlexFilterSettings>> {
    try {
      const { data, error } = await supabase
        .from('alex_filter_settings')
        .upsert({
          setting_name: settingName,
          filter_values: filterValues,
          is_enabled: isEnabled
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        error: null
      };
    } catch (error) {
      console.error('Error updating Alex filter settings:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get companies with enrichment details
   */
  async getCompanies(
    filters: {
      has_ai_focus?: boolean;
      climate_sectors?: string[];
      countries?: string[];
      enrichment_status?: string[];
    } = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<ApiResponse<{ companies: Company[]; total_count: number }>> {
    try {
      let query = supabase
        .from('companies')
        .select('*', { count: 'exact' });

      if (filters.has_ai_focus !== undefined) {
        query = query.eq('has_ai_focus', filters.has_ai_focus);
      }

      if (filters.climate_sectors?.length) {
        query = query.overlaps('climate_sub_sectors', filters.climate_sectors);
      }

      if (filters.countries?.length) {
        query = query.in('headquarters_country', filters.countries);
      }

      if (filters.enrichment_status?.length) {
        query = query.in('enrichment_status', filters.enrichment_status);
      }

      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1)
                  .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: {
          companies: data || [],
          total_count: count || 0
        },
        error: null,
        metadata: {
          total_count: count || 0,
          page,
          page_size: pageSize
        }
      };
    } catch (error) {
      console.error('Error fetching companies:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Subscribe to real-time updates for deals
   */
  subscribeToDeals(callback: (payload: any) => void) {
    return supabase
      .channel('deals_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals'
        },
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to Alex's high-score deals in real-time
   */
  subscribeToHighScoreDeals(callback: (payload: any) => void, minScore: number = 70) {
    return supabase
      .channel('high_score_deals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deals',
          filter: `investment_score=gte.${minScore}`
        },
        callback
      )
      .subscribe();
  }
}

// Export singleton instance
export const climateVCApi = new ClimateVCApiService();
