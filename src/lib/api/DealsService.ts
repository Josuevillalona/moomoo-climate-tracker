import { BaseApiService } from './BaseApiService';
import {
  DatabaseDeal,
  FundingDeal,
  DealFilters,
  RecentDealsResponse,
  PaginatedDealsResponse,
  DealResponse,
  PaginatedResponse,
  ApiResponse
} from '../../types/api';

/**
 * Service for handling individual deals and deal collections
 */
export class DealsService extends BaseApiService {
  /**
   * Fetch recent funding deals with optimized query
   */
  static async getRecentDeals(limit: number = 10): Promise<RecentDealsResponse> {
    console.log(`DealsService.getRecentDeals: Fetching ${limit} recent deals...`);

    return this.executeWithTracking(async () => {
      const dbDeals = await this.executeQuery(
        'recentDeals',
        async () => this.getSupabaseClient()
          .from('deals')
          .select('*')
          .eq('status', 'active')
          .order('date_announced', { ascending: false })
          .limit(limit)
      );

      console.log(`DealsService.getRecentDeals: Fetched ${dbDeals.length} deals from database`);

      // Transform database deals to UI format
      const transformedDeals = dbDeals.map(deal => this.transformDatabaseDeal(deal));

      console.log(`DealsService.getRecentDeals: Transformed ${transformedDeals.length} deals`);

      return transformedDeals;
    }, 'getRecentDeals');
  }

  /**
   * Fetch paginated deals with filters
   */
  static async getDeals(
    filters: DealFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedDealsResponse> {
    console.log('DealsService.getDeals: Fetching deals with filters:', filters);

    return this.executeWithTracking(async () => {
      const offset = (page - 1) * pageSize;
      
      // Build query with filters
      let query = this.getSupabaseClient()
        .from('deals')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Apply filters
      if (filters.fundingStage?.length) {
        query = query.in('funding_stage', filters.fundingStage);
      }
      
      if (filters.climateSector?.length) {
        query = query.in('climate_sub_sector', filters.climateSector);
      }
      
      if (filters.country?.length) {
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

      // Apply pagination and ordering
      query = query
        .order('date_announced', { ascending: false })
        .range(offset, offset + pageSize - 1);

      const result = await this.executeQuery(
        'paginatedDeals',
        async () => query
      );

      // Supabase returns { data, count } when using count: 'exact'
      const transformedDeals = (result as any).data.map((deal: DatabaseDeal) => this.transformDatabaseDeal(deal));
      const total = (result as any).count || 0;

      const paginatedResponse: PaginatedResponse<FundingDeal> = {
        data: transformedDeals,
        total,
        page,
        pageSize,
        hasMore: offset + pageSize < total
      };

      console.log(`DealsService.getDeals: Returning ${transformedDeals.length} deals (page ${page}/${Math.ceil(total / pageSize)})`);

      return paginatedResponse;
    }, 'getDeals');
  }

  /**
   * Get a single deal by ID
   */
  static async getDealById(id: number): Promise<DealResponse> {
    console.log(`DealsService.getDealById: Fetching deal ${id}...`);

    return this.executeWithTracking(async () => {
      const dbDeal = await this.executeQuery(
        'dealById',
        async () => this.getSupabaseClient()
          .from('deals')
          .select('*')
          .eq('id', id)
          .eq('status', 'active')
          .single()
      );

      if (!dbDeal) {
        throw new Error(`Deal with ID ${id} not found`);
      }

      const transformedDeal = this.transformDatabaseDeal(dbDeal as DatabaseDeal);

      console.log(`DealsService.getDealById: Transformed deal for ID ${id}`);

      return transformedDeal;
    }, 'getDealById');
  }

  /**
   * Search deals by company name or other criteria
   */
  static async searchDeals(
    searchTerm: string,
    limit: number = 10
  ): Promise<RecentDealsResponse> {
    console.log(`DealsService.searchDeals: Searching for "${searchTerm}"...`);

    return this.executeWithTracking(async () => {
      const dbDeals = await this.executeQuery(
        'searchDeals',
        async () => this.getSupabaseClient()
          .from('deals')
          .select('*')
          .eq('status', 'active')
          .or(`company_name.ilike.%${searchTerm}%,climate_sub_sector.ilike.%${searchTerm}%,geography_country.ilike.%${searchTerm}%`)
          .order('date_announced', { ascending: false })
          .limit(limit)
      );

      const transformedDeals = dbDeals.map(deal => this.transformDatabaseDeal(deal));

      console.log(`DealsService.searchDeals: Found ${transformedDeals.length} deals matching "${searchTerm}"`);

      return transformedDeals;
    }, 'searchDeals');
  }

  /**
   * Transform database deal to UI format
   */
  private static transformDatabaseDeal(dbDeal: DatabaseDeal): FundingDeal {
    const leadInvestors = dbDeal.lead_investors 
      ? dbDeal.lead_investors.split(',').map(inv => inv.trim()).filter(inv => inv)
      : [];
    
    const otherInvestors = dbDeal.other_investors 
      ? dbDeal.other_investors.split(',').map(inv => inv.trim()).filter(inv => inv)
      : [];

    const allInvestors = [...leadInvestors, ...otherInvestors];

    // Format amount
    const formattedAmount = dbDeal.amount_raised 
      ? dbDeal.amount_raised >= 1000000000
        ? `$${(dbDeal.amount_raised / 1000000000).toFixed(1)}B`
        : dbDeal.amount_raised >= 1000000
        ? `$${(dbDeal.amount_raised / 1000000).toFixed(1)}M`
        : `$${(dbDeal.amount_raised / 1000).toFixed(0)}K`
      : 'Undisclosed';

    // Format date
    const dateAnnounced = dbDeal.date_announced ? new Date(dbDeal.date_announced) : new Date();
    const formattedDate = dateAnnounced.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Calculate days ago
    const now = new Date();
    const timeDiff = now.getTime() - dateAnnounced.getTime();
    const daysAgo = Math.floor(timeDiff / (1000 * 3600 * 24));

    return {
      id: dbDeal.id,
      companyName: dbDeal.company_name,
      fundingStage: dbDeal.funding_stage || 'Unknown',
      amountRaised: dbDeal.amount_raised || 0,
      dateAnnounced: dbDeal.date_announced || dbDeal.created_at,
      leadInvestors,
      otherInvestors,
      climateSector: dbDeal.climate_sub_sector || 'Unknown',
      country: dbDeal.geography_country || 'Unknown',
      status: dbDeal.status,
      createdAt: dbDeal.created_at,
      formattedAmount,
      formattedDate,
      daysAgo,
      allInvestors
    };
  }

  /**
   * Get deals count by filters
   */
  static async getDealsCount(filters: DealFilters = {}): Promise<ApiResponse<number>> {
    return this.executeWithTracking(async () => {
      let query = this.getSupabaseClient()
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');

      // Apply same filters as getDeals
      if (filters.fundingStage?.length) {
        query = query.in('funding_stage', filters.fundingStage);
      }
      
      if (filters.climateSector?.length) {
        query = query.in('climate_sub_sector', filters.climateSector);
      }
      
      if (filters.country?.length) {
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

      const result = await this.executeQuery(
        'dealsCount',
        async () => query
      );

      return (result as any).count || 0;
    }, 'getDealsCount');
  }
}
