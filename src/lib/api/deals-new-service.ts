import { supabase } from '../supabase';
import { EnhancedDeal, Company, Deal, Investor, DealInvestor } from '../../types/climate-schema';

export class DealsNewService {
  /**
   * Create a new deal in the enhanced schema (deals_new table)
   */
  static async createDeal(dealData: {
    company: Partial<Company>;
    deal: Partial<Deal>;
    investors?: Partial<Investor>[];
  }): Promise<{ data: EnhancedDeal | null; error: string | null }> {
    try {
      // 1. Create or get company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .upsert({
          name: dealData.company.name,
          headquarters_country: dealData.company.headquarters_country,
          climate_sub_sectors: dealData.company.climate_sub_sectors,
          has_ai_focus: dealData.company.has_ai_focus || false,
          is_climate_tech: dealData.company.is_climate_tech || true,
          verification_status: 'pending',
          enrichment_status: 'pending',
          confidence_score: dealData.company.confidence_score || 0.5,
          media_mentions: dealData.company.media_mentions || 0,
        }, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (companyError) throw new Error(`Company creation failed: ${companyError.message}`);

      // 2. Create deal with automatic scoring
      const { data: deal, error: dealError } = await supabase
        .from('deals_new') // Use the new table
        .insert({
          company_id: company.id,
          amount_raised_usd: dealData.deal.amount_raised_usd,
          original_amount: dealData.deal.original_amount,
          original_currency: dealData.deal.original_currency || 'USD',
          funding_stage: dealData.deal.funding_stage,
          date_announced: dealData.deal.date_announced,
          source_url: dealData.deal.source_url,
          source_type: dealData.deal.source_type || 'news',
          source_name: dealData.deal.source_name,
          raw_text_content: dealData.deal.raw_text_content,
          confidence_score: dealData.deal.confidence_score || 0.5,
          alex_review_status: 'pending',
          status: 'new'
        })
        .select()
        .single();

      if (dealError) throw new Error(`Deal creation failed: ${dealError.message}`);

      // 3. Create investor relationships if provided
      const investorData: DealInvestor[] = [];
      if (dealData.investors && dealData.investors.length > 0) {
        for (const investorInfo of dealData.investors) {
          // Create or get investor
          const { data: investor } = await supabase
            .from('investors')
            .upsert({
              name: investorInfo.name,
              type: investorInfo.type || 'vc',
              climate_focus: investorInfo.climate_focus || false,
              portfolio_count: 0,
              enrichment_status: 'pending'
            }, { onConflict: 'name' })
            .select()
            .single();

          if (investor) {
            // Create deal-investor relationship
            const { data: dealInvestor } = await supabase
              .from('deal_investors')
              .insert({
                deal_id: deal.id,
                investor_id: investor.id,
                role: 'participant', // Default, can be updated later
              })
              .select(`
                id,
                deal_id,
                investor_id,
                role,
                amount_invested,
                created_at,
                investor:investors(*)
              `)
              .single();

            if (dealInvestor) {
              investorData.push(dealInvestor);
            }
          }
        }
      }

      // 4. Return enhanced deal object
      const enhancedDeal: EnhancedDeal = {
        ...deal,
        company,
        investors: investorData
      };

      return { data: enhancedDeal, error: null };
    } catch (error) {
      console.error('DealsNewService.createDeal error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error creating deal' 
      };
    }
  }

  /**
   * Get deals with enhanced schema joins
   */
  static async getEnhancedDeals(options: {
    limit?: number;
    offset?: number;
    minScore?: number;
    status?: string[];
  } = {}): Promise<{ data: EnhancedDeal[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('deals_new')
        .select(`
          *,
          company:companies(*),
          investors:deal_investors(
            id,
            role,
            amount_invested,
            investor:investors(*)
          )
        `);

      // Apply filters
      if (options.minScore) {
        query = query.gte('investment_score', options.minScore);
      }

      if (options.status) {
        query = query.in('status', options.status);
      }

      // Apply pagination
      query = query
        .order('date_announced', { ascending: false })
        .order('investment_score', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw new Error(`Query failed: ${error.message}`);

      return { data: data as EnhancedDeal[], error: null };
    } catch (error) {
      console.error('DealsNewService.getEnhancedDeals error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error fetching deals' 
      };
    }
  }

  /**
   * Get Alex's daily prospects (high-score deals needing review)
   */
  static async getAlexDailyProspects(): Promise<{ data: EnhancedDeal[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('deals_new')
        .select(`
          *,
          company:companies(*),
          investors:deal_investors(
            id,
            role,
            amount_invested,
            investor:investors(*)
          )
        `)
        .gte('investment_score', 60)
        .eq('alex_review_status', 'pending')
        .eq('status', 'new')
        .order('investment_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw new Error(`Query failed: ${error.message}`);

      return { data: data as EnhancedDeal[], error: null };
    } catch (error) {
      console.error('DealsNewService.getAlexDailyProspects error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error fetching prospects' 
      };
    }
  }

  /**
   * Update Alex's review status for a deal
   */
  static async updateAlexReview(
    dealId: string, 
    status: 'interested' | 'passed' | 'auto_filtered', 
    notes?: string
  ): Promise<{ data: Deal | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('deals_new')
        .update({
          alex_review_status: status,
          alex_notes: notes,
          alex_review_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId)
        .select()
        .single();

      if (error) throw new Error(`Update failed: ${error.message}`);

      return { data, error: null };
    } catch (error) {
      console.error('DealsNewService.updateAlexReview error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error updating review' 
      };
    }
  }

  /**
   * Subscribe to real-time deal alerts
   */
  static subscribeToAlerts(
    minScore: number,
    callback: (deal: EnhancedDeal) => void
  ) {
    const channel = supabase
      .channel('deal_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deals_new',
          filter: `investment_score=gte.${minScore}`
        },
        async (payload) => {
          // Fetch complete deal data with relationships
          const { data: enhancedDeal } = await supabase
            .from('deals_new')
            .select(`
              *,
              company:companies(*),
              investors:deal_investors(
                id,
                role,
                amount_invested,
                investor:investors(*)
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (enhancedDeal) {
            callback(enhancedDeal as EnhancedDeal);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }

  /**
   * Get dashboard metrics from enhanced schema
   */
  static async getDashboardMetrics(): Promise<{ 
    data: {
      totalDeals: number;
      dealsThisWeek: number;
      dealsRequiringReview: number;
      highScoreDeals: number;
      totalFundingUsd: number;
      averageDealSize: number;
    } | null; 
    error: string | null; 
  }> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [
        { count: totalDeals },
        { count: dealsThisWeek },
        { count: dealsRequiringReview },
        { count: highScoreDeals },
        { data: fundingData }
      ] = await Promise.all([
        supabase.from('deals_new').select('*', { count: 'exact', head: true }),
        supabase.from('deals_new').select('*', { count: 'exact', head: true })
          .gte('created_at', oneWeekAgo.toISOString()),
        supabase.from('deals_new').select('*', { count: 'exact', head: true })
          .eq('alex_review_status', 'pending'),
        supabase.from('deals_new').select('*', { count: 'exact', head: true })
          .gte('investment_score', 70),
        supabase.from('deals_new').select('amount_raised_usd')
          .not('amount_raised_usd', 'is', null)
      ]);

      const totalFundingUsd = fundingData?.reduce((sum, deal) => sum + (deal.amount_raised_usd || 0), 0) || 0;
      const averageDealSize = fundingData?.length ? totalFundingUsd / fundingData.length : 0;

      return {
        data: {
          totalDeals: totalDeals || 0,
          dealsThisWeek: dealsThisWeek || 0,
          dealsRequiringReview: dealsRequiringReview || 0,
          highScoreDeals: highScoreDeals || 0,
          totalFundingUsd,
          averageDealSize
        },
        error: null
      };
    } catch (error) {
      console.error('DealsNewService.getDashboardMetrics error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error fetching metrics' 
      };
    }
  }
}

export default DealsNewService;
