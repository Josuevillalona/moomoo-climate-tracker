import { supabase } from '../supabase';
import {
  DatabaseDeal,
  FundingDeal,
  DashboardMetrics,
  DealFilters,
  ApiResponse,
  PaginatedResponse,
  ApiException,
  ApiErrorType,
  RealtimePayload,
  SubscriptionOptions
} from '../../types/api';

export class FundingService {
  /**
   * Fetch dashboard metrics including totals and aggregated data
   */
  static async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    try {
      // Fetch all deals for metric calculations
      const { data: deals, error } = await supabase
        .from('deals')
        .select('*')
        .eq('status', 'PUBLISHED');

      if (error) {
        throw new ApiException(
          ApiErrorType.DATABASE_ERROR,
          `Failed to fetch deals for metrics: ${error.message}`,
          true
        );
      }

      if (!deals || deals.length === 0) {
        return {
          data: {
            totalDeals: 0,
            totalFunding: 0,
            totalCompanies: 0,
            totalInvestors: 0,
            growthRate: 0,
            averageDealSize: 0,
            topSectors: [],
            topCountries: []
          },
          error: null,
          loading: false
        };
      }

      // Calculate metrics from deals data
      const metrics = this.calculateMetricsFromDeals(deals);

      return {
        data: metrics,
        error: null,
        loading: false
      };
    } catch (error) {
      const apiError = error instanceof ApiException 
        ? error 
        : new ApiException(
            ApiErrorType.NETWORK_ERROR,
            `Unexpected error fetching dashboard metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
            true
          );

      return {
        data: null,
        error: apiError.message,
        loading: false
      };
    }
  }

  /**
   * Fetch recent deals with optional limit
   */
  static async getRecentDeals(limit: number = 5): Promise<ApiResponse<FundingDeal[]>> {
    try {
      const { data: deals, error } = await supabase
        .from('deals')
        .select('*')
        .eq('status', 'PUBLISHED')
        .order('date_announced', { ascending: false })
        .limit(limit);

      if (error) {
        throw new ApiException(
          ApiErrorType.DATABASE_ERROR,
          `Failed to fetch recent deals: ${error.message}`,
          true
        );
      }

      const transformedDeals = deals?.map(deal => this.transformDealForDisplay(deal)) || [];

      return {
        data: transformedDeals,
        error: null,
        loading: false
      };
    } catch (error) {
      const apiError = error instanceof ApiException 
        ? error 
        : new ApiException(
            ApiErrorType.NETWORK_ERROR,
            `Unexpected error fetching recent deals: ${error instanceof Error ? error.message : 'Unknown error'}`,
            true
          );

      return {
        data: null,
        error: apiError.message,
        loading: false
      };
    }
  }

  /**
   * Fetch deals with filters and pagination
   */
  static async getDealsWithFilters(filters: DealFilters): Promise<ApiResponse<PaginatedResponse<FundingDeal>>> {
    try {
      let query = supabase
        .from('deals')
        .select('*', { count: 'exact' })
        .eq('status', 'PUBLISHED');

      // Apply filters
      if (filters.fundingStage && filters.fundingStage.length > 0) {
        query = query.in('funding_stage', filters.fundingStage);
      }

      if (filters.climateSector && filters.climateSector.length > 0) {
        query = query.in('climate_sub_sector', filters.climateSector);
      }

      if (filters.country && filters.country.length > 0) {
        query = query.in('geography_country', filters.country);
      }

      if (filters.dateRange) {
        query = query
          .gte('date_announced', filters.dateRange.start)
          .lte('date_announced', filters.dateRange.end);
      }

      if (filters.amountRange) {
        query = query
          .gte('amount_raised', filters.amountRange.min)
          .lte('amount_raised', filters.amountRange.max);
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      // Apply pagination
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by date announced (most recent first)
      query = query.order('date_announced', { ascending: false });

      const { data: deals, error, count } = await query;

      if (error) {
        throw new ApiException(
          ApiErrorType.DATABASE_ERROR,
          `Failed to fetch filtered deals: ${error.message}`,
          true
        );
      }

      const transformedDeals = deals?.map(deal => this.transformDealForDisplay(deal)) || [];
      const total = count || 0;
      const page = Math.floor(offset / limit) + 1;
      const hasMore = offset + limit < total;

      return {
        data: {
          data: transformedDeals,
          total,
          page,
          pageSize: limit,
          hasMore
        },
        error: null,
        loading: false
      };
    } catch (error) {
      const apiError = error instanceof ApiException 
        ? error 
        : new ApiException(
            ApiErrorType.NETWORK_ERROR,
            `Unexpected error fetching filtered deals: ${error instanceof Error ? error.message : 'Unknown error'}`,
            true
          );

      return {
        data: null,
        error: apiError.message,
        loading: false
      };
    }
  }

  /**
   * Subscribe to real-time deal updates
   */
  static subscribeToDeals(
    callback: (payload: RealtimePayload<DatabaseDeal>) => void,
    options: SubscriptionOptions = {}
  ) {
    const channel = supabase
      .channel('deals-changes')
      .on(
        'postgres_changes' as any,
        {
          event: options.event || '*',
          schema: options.schema || 'public',
          table: options.table || 'deals',
          filter: options.filter
        },
        (payload: any) => {
          callback({
            eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            new: payload.new as DatabaseDeal | null,
            old: payload.old as DatabaseDeal | null,
            errors: payload.errors || null
          });
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Get deal by ID
   */
  static async getDealById(id: number): Promise<ApiResponse<FundingDeal>> {
    try {
      const { data: deal, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new ApiException(
            ApiErrorType.NOT_FOUND_ERROR,
            `Deal with ID ${id} not found`,
            false,
            404
          );
        }
        throw new ApiException(
          ApiErrorType.DATABASE_ERROR,
          `Failed to fetch deal: ${error.message}`,
          true
        );
      }

      const transformedDeal = this.transformDealForDisplay(deal);

      return {
        data: transformedDeal,
        error: null,
        loading: false
      };
    } catch (error) {
      const apiError = error instanceof ApiException 
        ? error 
        : new ApiException(
            ApiErrorType.NETWORK_ERROR,
            `Unexpected error fetching deal: ${error instanceof Error ? error.message : 'Unknown error'}`,
            true
          );

      return {
        data: null,
        error: apiError.message,
        loading: false
      };
    }
  }

  /**
   * Private method to transform database deal to display format
   */
  private static transformDealForDisplay(deal: DatabaseDeal): FundingDeal {
    const leadInvestors = deal.lead_investors 
      ? deal.lead_investors.split(',').map(inv => inv.trim()).filter(inv => inv.length > 0)
      : [];
    
    const otherInvestors = deal.other_investors 
      ? deal.other_investors.split(',').map(inv => inv.trim()).filter(inv => inv.length > 0)
      : [];

    const allInvestors = [...leadInvestors, ...otherInvestors];

    const dateAnnounced = deal.date_announced || deal.created_at;
    const daysAgo = this.calculateDaysAgo(dateAnnounced);

    return {
      id: deal.id,
      companyName: deal.company_name || 'Unknown Company',
      fundingStage: deal.funding_stage || 'Unknown',
      amountRaised: deal.amount_raised || 0,
      dateAnnounced,
      leadInvestors,
      otherInvestors,
      climateSector: deal.climate_sub_sector || 'Unknown',
      country: deal.geography_country || 'Unknown',
      status: deal.status,
      createdAt: deal.created_at,
      formattedAmount: this.formatCurrency(deal.amount_raised || 0),
      formattedDate: this.formatDate(dateAnnounced),
      daysAgo,
      allInvestors
    };
  }

  /**
   * Private method to calculate metrics from deals array
   */
  private static calculateMetricsFromDeals(deals: DatabaseDeal[]): DashboardMetrics {
    const totalDeals = deals.length;
    const totalFunding = deals.reduce((sum, deal) => sum + (deal.amount_raised || 0), 0);
    const totalCompanies = new Set(deals.map(deal => deal.company_name)).size;
    
    // Calculate unique investors
    const allInvestors = new Set<string>();
    deals.forEach(deal => {
      if (deal.lead_investors) {
        deal.lead_investors.split(',').forEach(inv => allInvestors.add(inv.trim()));
      }
      if (deal.other_investors) {
        deal.other_investors.split(',').forEach(inv => allInvestors.add(inv.trim()));
      }
    });
    const totalInvestors = allInvestors.size;

    const averageDealSize = totalDeals > 0 ? totalFunding / totalDeals : 0;

    // Calculate growth rate (simplified - comparing last 30 days to previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentDeals = deals.filter(deal => {
      const dealDate = new Date(deal.date_announced || deal.created_at);
      return dealDate >= thirtyDaysAgo;
    }).length;

    const previousDeals = deals.filter(deal => {
      const dealDate = new Date(deal.date_announced || deal.created_at);
      return dealDate >= sixtyDaysAgo && dealDate < thirtyDaysAgo;
    }).length;

    const growthRate = previousDeals > 0 ? ((recentDeals - previousDeals) / previousDeals) * 100 : 0;

    // Calculate top sectors
    const sectorCounts = new Map<string, { count: number; funding: number }>();
    deals.forEach(deal => {
      const sector = deal.climate_sub_sector || 'Unknown';
      const current = sectorCounts.get(sector) || { count: 0, funding: 0 };
      sectorCounts.set(sector, {
        count: current.count + 1,
        funding: current.funding + (deal.amount_raised || 0)
      });
    });

    const topSectors = Array.from(sectorCounts.entries())
      .map(([sector, data]) => ({
        sector,
        dealCount: data.count,
        totalFunding: data.funding,
        percentage: (data.count / totalDeals) * 100
      }))
      .sort((a, b) => b.dealCount - a.dealCount)
      .slice(0, 5);

    // Calculate top countries
    const countryCounts = new Map<string, { count: number; funding: number }>();
    deals.forEach(deal => {
      const country = deal.geography_country || 'Unknown';
      const current = countryCounts.get(country) || { count: 0, funding: 0 };
      countryCounts.set(country, {
        count: current.count + 1,
        funding: current.funding + (deal.amount_raised || 0)
      });
    });

    const topCountries = Array.from(countryCounts.entries())
      .map(([country, data]) => ({
        country,
        dealCount: data.count,
        totalFunding: data.funding,
        percentage: (data.count / totalDeals) * 100
      }))
      .sort((a, b) => b.dealCount - a.dealCount)
      .slice(0, 5);

    return {
      totalDeals,
      totalFunding,
      totalCompanies,
      totalInvestors,
      growthRate,
      averageDealSize,
      topSectors,
      topCountries
    };
  }

  /**
   * Private utility methods
   */
  private static formatCurrency(amount: number): string {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  }

  private static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private static calculateDaysAgo(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}