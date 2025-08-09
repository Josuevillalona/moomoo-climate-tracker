import { supabase } from "../supabase";
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
  SubscriptionOptions,
} from "../../types/api";
import { measureQuery, performanceMonitor } from "../utils/performance";
import {
  errorLogger,
  logApiError,
  logDatabaseError,
} from "../monitoring/errorLogger";
import {
  performanceMonitor as newPerformanceMonitor,
  trackApiCall,
  trackDatabaseQuery,
} from "../monitoring/performanceMonitor";
import {
  realtimeMonitor,
  ConnectionEvent,
  ConnectionState,
} from "../monitoring/realtimeMonitor";

export class FundingService {
  /**
   * Fetch dashboard metrics including totals and aggregated data
   * Optimized version with selective field queries and aggregations
   */
  static async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    console.log(
      "FundingService.getDashboardMetrics: Starting optimized version..."
    );

    return trackApiCall(
      async () => {
        try {
          // Optimized approach: Use multiple targeted queries instead of fetching all data
          // This reduces data transfer and improves performance for large datasets

          // 1. Get basic counts and totals with minimal data transfer
          console.log(
            "FundingService.getDashboardMetrics: Fetching basic metrics..."
          );
          const { data: basicMetrics, error: basicError } = (await measureQuery(
            "dashboard-basic-metrics",
            async () =>
              await supabase
                .from("deals")
                .select(
                  "id, amount_raised, company_name, date_announced, created_at"
                )
                .not("amount_raised", "is", null), // Only deals with funding amounts for accurate metrics
            { queryType: "basic-metrics", expectedRows: "variable" }
          )) as any;

          if (basicError) {
            console.error(
              "FundingService.getDashboardMetrics: Basic metrics error:",
              basicError
            );
            logDatabaseError(
              "fetch_basic_metrics",
              "deals",
              undefined,
              new Error(basicError.message)
            );
            throw new ApiException(
              ApiErrorType.DATABASE_ERROR,
              `Failed to fetch basic metrics: ${basicError.message}`,
              true
            );
          }

          // 2. Get sector data for top sectors calculation
          console.log(
            "FundingService.getDashboardMetrics: Fetching sector data..."
          );
          const { data: sectorData, error: sectorError } = (await measureQuery(
            "dashboard-sector-data",
            async () =>
              await supabase
                .from("deals")
                .select("climate_sub_sector, amount_raised")
                .not("climate_sub_sector", "is", null)
                .not("amount_raised", "is", null),
            { queryType: "sector-aggregation", expectedRows: "variable" }
          )) as any;

          if (sectorError) {
            console.warn(
              "FundingService.getDashboardMetrics: Sector data error:",
              sectorError
            );
            logDatabaseError(
              "fetch_sector_data",
              "deals",
              undefined,
              new Error(sectorError.message)
            );
          }

          // 3. Get country data for top countries calculation
          console.log(
            "FundingService.getDashboardMetrics: Fetching country data..."
          );
          const { data: countryData, error: countryError } =
            (await measureQuery(
              "dashboard-country-data",
              async () =>
                await supabase
                  .from("deals")
                  .select("geography_country, amount_raised")
                  .not("geography_country", "is", null)
                  .not("amount_raised", "is", null),
              { queryType: "country-aggregation", expectedRows: "variable" }
            )) as any;

          if (countryError) {
            console.warn(
              "FundingService.getDashboardMetrics: Country data error:",
              countryError
            );
            logDatabaseError(
              "fetch_country_data",
              "deals",
              undefined,
              new Error(countryError.message)
            );
          }

          // 4. Get investor data for unique investor count (limited to reduce data transfer)
          console.log(
            "FundingService.getDashboardMetrics: Fetching investor data..."
          );
          const { data: investorData, error: investorError } =
            (await measureQuery(
              "dashboard-investor-data",
              async () =>
                await supabase
                  .from("deals")
                  .select("lead_investors, other_investors")
                  .or("lead_investors.not.is.null,other_investors.not.is.null"),
              { queryType: "investor-aggregation", expectedRows: "variable" }
            )) as any;

          if (investorError) {
            console.warn(
              "FundingService.getDashboardMetrics: Investor data error:",
              investorError
            );
            logDatabaseError(
              "fetch_investor_data",
              "deals",
              undefined,
              new Error(investorError.message)
            );
          }

          console.log("FundingService.getDashboardMetrics: Query results:", {
            basicMetricsCount: basicMetrics?.length || 0,
            sectorDataCount: sectorData?.length || 0,
            countryDataCount: countryData?.length || 0,
            investorDataCount: investorData?.length || 0,
          });

          if (!basicMetrics || basicMetrics.length === 0) {
            console.log(
              "FundingService.getDashboardMetrics: No deals found, returning empty metrics"
            );
            return {
              data: {
                totalDeals: 0,
                totalFunding: 0,
                totalCompanies: 0,
                totalInvestors: 0,
                growthRate: 0,
                averageDealSize: 0,
                topSectors: [],
                topCountries: [],
              },
              error: null,
              loading: false,
            };
          }

          // Calculate metrics from optimized data sets
          console.log(
            "FundingService.getDashboardMetrics: Calculating optimized metrics..."
          );
          const metrics = this.calculateOptimizedMetrics(
            basicMetrics,
            sectorData || [],
            countryData || [],
            investorData || []
          );
          console.log(
            "FundingService.getDashboardMetrics: Calculated optimized metrics:",
            metrics
          );

          return {
            data: metrics,
            error: null,
            loading: false,
          };
        } catch (error) {
          console.error(
            "FundingService.getDashboardMetrics: Caught error:",
            error
          );

          const apiError =
            error instanceof ApiException
              ? error
              : new ApiException(
                  ApiErrorType.NETWORK_ERROR,
                  `Unexpected error fetching dashboard metrics: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`,
                  true
                );

          // Log the error with monitoring
          logApiError(
            "/api/dashboard/metrics",
            "GET",
            undefined,
            error instanceof Error ? error : new Error(String(error))
          );

          console.log(
            "FundingService.getDashboardMetrics: Returning error response:",
            apiError.message
          );
          return {
            data: null,
            error: apiError.message,
            loading: false,
          };
        }
      },
      "/api/dashboard/metrics",
      "GET"
    );
  }

  /**
   * Fetch recent deals with optional limit - optimized version
   */
  static async getRecentDeals(
    limit: number = 5
  ): Promise<ApiResponse<FundingDeal[]>> {
    console.log(
      "FundingService.getRecentDeals: Starting optimized version with limit:",
      limit
    );

    try {
      console.log(
        "FundingService.getRecentDeals: Querying Supabase with optimized query..."
      );

      // Optimized query: Use composite index (status + date) and select only needed fields initially
      const { data: deals, error } = (await measureQuery(
        "recent-deals",
        async () =>
          await supabase
            .from("deals")
            .select(
              `
            id,
            company_name,
            funding_stage,
            amount_raised,
            date_announced,
            lead_investors,
            other_investors,
            climate_sub_sector,
            geography_country,
            status,
            created_at
          `
            )
            .not("date_announced", "is", null) // Use index-friendly filter
            .order("date_announced", { ascending: false, nullsFirst: false })
            .limit(Math.min(limit, 50)), // Cap limit to prevent excessive data transfer
        { queryType: "recent-deals", limit, expectedRows: limit }
      )) as any;

      console.log("FundingService.getRecentDeals: Supabase response:", {
        dealsCount: deals?.length,
        error: error?.message,
      });

      if (error) {
        console.error("FundingService.getRecentDeals: Database error:", error);
        throw new ApiException(
          ApiErrorType.DATABASE_ERROR,
          `Failed to fetch recent deals: ${error.message}`,
          true
        );
      }

      console.log("FundingService.getRecentDeals: Transforming deals...");
      const transformedDeals =
        deals?.map((deal: any) => this.transformDealForDisplay(deal)) || [];
      console.log(
        "FundingService.getRecentDeals: Transformed deals:",
        transformedDeals
      );

      return {
        data: transformedDeals,
        error: null,
        loading: false,
      };
    } catch (error) {
      console.error("FundingService.getRecentDeals: Caught error:", error);

      const apiError =
        error instanceof ApiException
          ? error
          : new ApiException(
              ApiErrorType.NETWORK_ERROR,
              `Unexpected error fetching recent deals: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              true
            );

      console.log(
        "FundingService.getRecentDeals: Returning error response:",
        apiError.message
      );
      return {
        data: null,
        error: apiError.message,
        loading: false,
      };
    }
  }

  /**
   * Fetch deals with filters and pagination - optimized version
   */
  static async getDealsWithFilters(
    filters: DealFilters
  ): Promise<ApiResponse<PaginatedResponse<FundingDeal>>> {
    try {
      console.log(
        "FundingService.getDealsWithFilters: Starting optimized query with filters:",
        filters
      );

      // Optimize pagination limits
      const limit = Math.min(filters.limit || 20, 100); // Cap at 100 to prevent excessive data transfer
      const offset = Math.max(filters.offset || 0, 0);

      // Build optimized query with selective field selection
      let query = supabase.from("deals").select(
        `
          id,
          company_name,
          funding_stage,
          amount_raised,
          date_announced,
          lead_investors,
          other_investors,
          climate_sub_sector,
          geography_country,
          status,
          created_at
        `,
        { count: "exact" }
      );

      // Apply filters in optimal order (most selective first to use indexes effectively)

      // Date range filter first (uses date index)
      if (filters.dateRange) {
        query = query
          .gte("date_announced", filters.dateRange.start)
          .lte("date_announced", filters.dateRange.end);
      }

      // Status filter (uses composite index)
      if (filters.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
      }

      // Amount range filter (uses amount index)
      if (filters.amountRange) {
        query = query
          .gte("amount_raised", filters.amountRange.min)
          .lte("amount_raised", filters.amountRange.max)
          .not("amount_raised", "is", null); // Exclude null amounts
      }

      // Categorical filters (use individual indexes)
      if (filters.fundingStage && filters.fundingStage.length > 0) {
        query = query.in("funding_stage", filters.fundingStage);
      }

      if (filters.climateSector && filters.climateSector.length > 0) {
        query = query.in("climate_sub_sector", filters.climateSector);
      }

      if (filters.country && filters.country.length > 0) {
        query = query.in("geography_country", filters.country);
      }

      // Apply ordering (uses composite index for optimal performance)
      query = query.order("date_announced", {
        ascending: false,
        nullsFirst: false,
      });

      // Apply pagination with range
      query = query.range(offset, offset + limit - 1);

      console.log(
        "FundingService.getDealsWithFilters: Executing optimized query..."
      );
      const {
        data: deals,
        error,
        count,
      } = (await measureQuery(
        "filtered-deals-paginated",
        async () => await query,
        {
          queryType: "filtered-pagination",
          filters: Object.keys(filters).filter(
            (key) => filters[key as keyof DealFilters] !== undefined
          ),
          limit,
          offset,
          expectedRows: limit,
        }
      )) as any;

      if (error) {
        console.error(
          "FundingService.getDealsWithFilters: Database error:",
          error
        );
        throw new ApiException(
          ApiErrorType.DATABASE_ERROR,
          `Failed to fetch filtered deals: ${error.message}`,
          true
        );
      }

      console.log("FundingService.getDealsWithFilters: Query results:", {
        dealsCount: deals?.length || 0,
        totalCount: count,
        offset,
        limit,
      });

      const transformedDeals =
        deals?.map((deal: any) => this.transformDealForDisplay(deal)) || [];
      const total = count || 0;
      const page = Math.floor(offset / limit) + 1;
      const hasMore = offset + limit < total;

      return {
        data: {
          data: transformedDeals,
          total,
          page,
          pageSize: limit,
          hasMore,
        },
        error: null,
        loading: false,
      };
    } catch (error) {
      console.error("FundingService.getDealsWithFilters: Caught error:", error);

      const apiError =
        error instanceof ApiException
          ? error
          : new ApiException(
              ApiErrorType.NETWORK_ERROR,
              `Unexpected error fetching filtered deals: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              true
            );

      return {
        data: null,
        error: apiError.message,
        loading: false,
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
      .channel("deals-changes")
      .on(
        "postgres_changes" as any,
        {
          event: options.event || "*",
          schema: options.schema || "public",
          table: options.table || "deals",
          filter: options.filter,
        },
        (payload: any) => {
          callback({
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: payload.new as DatabaseDeal | null,
            old: payload.old as DatabaseDeal | null,
            errors: payload.errors || null,
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
   * Fetch deals with cursor-based pagination for optimal performance with large datasets
   */
  static async getDealsWithCursor(
    filters: DealFilters & { cursor?: { id: number; date: string } }
  ): Promise<
    ApiResponse<{
      data: FundingDeal[];
      hasMore: boolean;
      nextCursor: { id: number; date: string } | null;
    }>
  > {
    try {
      console.log(
        "FundingService.getDealsWithCursor: Starting cursor-based query with filters:",
        filters
      );

      // Optimize pagination limits
      const limit = Math.min(filters.limit || 20, 100);

      // Build optimized query with selective field selection
      let query = supabase.from("deals").select(`
          id,
          company_name,
          funding_stage,
          amount_raised,
          date_announced,
          lead_investors,
          other_investors,
          climate_sub_sector,
          geography_country,
          status,
          created_at
        `);

      // Apply cursor-based pagination for consistent results
      if (filters.cursor) {
        // Use composite cursor (date + id) for stable pagination
        query = query.or(
          `date_announced.lt.${filters.cursor.date},and(date_announced.eq.${filters.cursor.date},id.lt.${filters.cursor.id})`
        );
      }

      // Apply filters in optimal order (most selective first)

      // Date range filter first (uses date index)
      if (filters.dateRange) {
        query = query
          .gte("date_announced", filters.dateRange.start)
          .lte("date_announced", filters.dateRange.end);
      }

      // Status filter (uses composite index)
      if (filters.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
      }

      // Amount range filter (uses amount index)
      if (filters.amountRange) {
        query = query
          .gte("amount_raised", filters.amountRange.min)
          .lte("amount_raised", filters.amountRange.max)
          .not("amount_raised", "is", null);
      }

      // Categorical filters (use individual indexes)
      if (filters.fundingStage && filters.fundingStage.length > 0) {
        query = query.in("funding_stage", filters.fundingStage);
      }

      if (filters.climateSector && filters.climateSector.length > 0) {
        query = query.in("climate_sub_sector", filters.climateSector);
      }

      if (filters.country && filters.country.length > 0) {
        query = query.in("geography_country", filters.country);
      }

      // Apply consistent ordering for cursor pagination
      query = query
        .order("date_announced", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false }) // Secondary sort for consistency
        .limit(limit + 1); // Fetch one extra to check if there are more results

      console.log(
        "FundingService.getDealsWithCursor: Executing cursor-based query..."
      );
      const { data: deals, error } = (await measureQuery(
        "cursor-paginated-deals",
        async () => await query,
        {
          queryType: "cursor-pagination",
          filters: Object.keys(filters).filter(
            (key) => filters[key as keyof typeof filters] !== undefined
          ),
          limit,
          hasCursor: !!filters.cursor,
          expectedRows: limit,
        }
      )) as any;

      if (error) {
        console.error(
          "FundingService.getDealsWithCursor: Database error:",
          error
        );
        throw new ApiException(
          ApiErrorType.DATABASE_ERROR,
          `Failed to fetch deals with cursor: ${error.message}`,
          true
        );
      }

      console.log("FundingService.getDealsWithCursor: Query results:", {
        dealsCount: deals?.length || 0,
        limit,
      });

      const hasMore = deals && deals.length > limit;
      const resultDeals = hasMore ? deals.slice(0, limit) : deals || [];

      // Generate next cursor from the last item
      const nextCursor =
        hasMore && resultDeals.length > 0
          ? {
              id: resultDeals[resultDeals.length - 1].id,
              date:
                resultDeals[resultDeals.length - 1].date_announced ||
                resultDeals[resultDeals.length - 1].created_at,
            }
          : null;

      const transformedDeals = resultDeals.map((deal: any) =>
        this.transformDealForDisplay(deal)
      );

      return {
        data: {
          data: transformedDeals,
          hasMore,
          nextCursor,
        },
        error: null,
        loading: false,
      };
    } catch (error) {
      console.error("FundingService.getDealsWithCursor: Caught error:", error);

      const apiError =
        error instanceof ApiException
          ? error
          : new ApiException(
              ApiErrorType.NETWORK_ERROR,
              `Unexpected error fetching deals with cursor: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              true
            );

      return {
        data: null,
        error: apiError.message,
        loading: false,
      };
    }
  }

  /**
   * Get deal by ID
   */
  static async getDealById(id: number): Promise<ApiResponse<FundingDeal>> {
    try {
      const { data: deal, error } = await supabase
        .from("deals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
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
        loading: false,
      };
    } catch (error) {
      const apiError =
        error instanceof ApiException
          ? error
          : new ApiException(
              ApiErrorType.NETWORK_ERROR,
              `Unexpected error fetching deal: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              true
            );

      return {
        data: null,
        error: apiError.message,
        loading: false,
      };
    }
  }

  /**
   * Private method to transform database deal to display format
   */
  private static transformDealForDisplay(deal: DatabaseDeal): FundingDeal {
    const leadInvestors = deal.lead_investors
      ? deal.lead_investors
          .split(",")
          .map((inv) => inv.trim())
          .filter((inv) => inv.length > 0)
      : [];

    const otherInvestors = deal.other_investors
      ? deal.other_investors
          .split(",")
          .map((inv) => inv.trim())
          .filter((inv) => inv.length > 0)
      : [];

    const allInvestors = [...leadInvestors, ...otherInvestors];

    const dateAnnounced = deal.date_announced || deal.created_at;
    const daysAgo = this.calculateDaysAgo(dateAnnounced);

    return {
      id: deal.id,
      companyName: deal.company_name || "Unknown Company",
      fundingStage: deal.funding_stage || "Unknown",
      amountRaised: deal.amount_raised || 0,
      dateAnnounced,
      leadInvestors,
      otherInvestors,
      climateSector: deal.climate_sub_sector || "Unknown",
      country: deal.geography_country || "Unknown",
      status: deal.status,
      createdAt: deal.created_at,
      formattedAmount: this.formatCurrency(deal.amount_raised || 0),
      formattedDate: this.formatDate(dateAnnounced),
      daysAgo,
      allInvestors,
    };
  }

  /**
   * Private method to calculate optimized metrics from separate data sets
   */
  private static calculateOptimizedMetrics(
    basicMetrics: Array<{
      id: number;
      amount_raised: number | null;
      company_name: string;
      date_announced: string | null;
      created_at: string;
    }>,
    sectorData: Array<{
      climate_sub_sector: string | null;
      amount_raised: number | null;
    }>,
    countryData: Array<{
      geography_country: string | null;
      amount_raised: number | null;
    }>,
    investorData: Array<{
      lead_investors: string | null;
      other_investors: string | null;
    }>
  ): DashboardMetrics {
    console.log(
      "FundingService.calculateOptimizedMetrics: Processing data sets..."
    );

    // Basic metrics from main dataset
    const totalDeals = basicMetrics.length;
    const totalFunding = basicMetrics.reduce(
      (sum, deal) => sum + (deal.amount_raised || 0),
      0
    );
    const totalCompanies = new Set(
      basicMetrics.map((deal) => deal.company_name)
    ).size;
    const averageDealSize = totalDeals > 0 ? totalFunding / totalDeals : 0;

    // Calculate unique investors from investor data
    const allInvestors = new Set<string>();
    investorData.forEach((deal) => {
      if (deal.lead_investors) {
        deal.lead_investors.split(",").forEach((inv) => {
          const trimmed = inv.trim();
          if (trimmed) allInvestors.add(trimmed);
        });
      }
      if (deal.other_investors) {
        deal.other_investors.split(",").forEach((inv) => {
          const trimmed = inv.trim();
          if (trimmed) allInvestors.add(trimmed);
        });
      }
    });
    const totalInvestors = allInvestors.size;

    // Calculate growth rate (comparing last 30 days to previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentDeals = basicMetrics.filter((deal) => {
      const dealDate = new Date(deal.date_announced || deal.created_at);
      return dealDate >= thirtyDaysAgo;
    }).length;

    const previousDeals = basicMetrics.filter((deal) => {
      const dealDate = new Date(deal.date_announced || deal.created_at);
      return dealDate >= sixtyDaysAgo && dealDate < thirtyDaysAgo;
    }).length;

    const growthRate =
      previousDeals > 0
        ? ((recentDeals - previousDeals) / previousDeals) * 100
        : 0;

    // Calculate top sectors from sector data
    const sectorCounts = new Map<string, { count: number; funding: number }>();
    sectorData.forEach((item) => {
      if (item.climate_sub_sector) {
        const sector = item.climate_sub_sector;
        const current = sectorCounts.get(sector) || { count: 0, funding: 0 };
        sectorCounts.set(sector, {
          count: current.count + 1,
          funding: current.funding + (item.amount_raised || 0),
        });
      }
    });

    const topSectors = Array.from(sectorCounts.entries())
      .map(([sector, data]) => ({
        sector,
        dealCount: data.count,
        totalFunding: data.funding,
        percentage: totalDeals > 0 ? (data.count / totalDeals) * 100 : 0,
      }))
      .sort((a, b) => b.dealCount - a.dealCount)
      .slice(0, 5);

    // Calculate top countries from country data
    const countryCounts = new Map<string, { count: number; funding: number }>();
    countryData.forEach((item) => {
      if (item.geography_country) {
        const country = item.geography_country;
        const current = countryCounts.get(country) || { count: 0, funding: 0 };
        countryCounts.set(country, {
          count: current.count + 1,
          funding: current.funding + (item.amount_raised || 0),
        });
      }
    });

    const topCountries = Array.from(countryCounts.entries())
      .map(([country, data]) => ({
        country,
        dealCount: data.count,
        totalFunding: data.funding,
        percentage: totalDeals > 0 ? (data.count / totalDeals) * 100 : 0,
      }))
      .sort((a, b) => b.dealCount - a.dealCount)
      .slice(0, 5);

    console.log(
      "FundingService.calculateOptimizedMetrics: Calculated metrics:",
      {
        totalDeals,
        totalFunding,
        totalCompanies,
        totalInvestors,
        topSectorsCount: topSectors.length,
        topCountriesCount: topCountries.length,
      }
    );

    return {
      totalDeals,
      totalFunding,
      totalCompanies,
      totalInvestors,
      growthRate,
      averageDealSize,
      topSectors,
      topCountries,
    };
  }

  /**
   * Private method to calculate metrics from deals array (legacy method for backward compatibility)
   */
  private static calculateMetricsFromDeals(
    deals: DatabaseDeal[]
  ): DashboardMetrics {
    const totalDeals = deals.length;
    const totalFunding = deals.reduce(
      (sum, deal) => sum + (deal.amount_raised || 0),
      0
    );
    const totalCompanies = new Set(deals.map((deal) => deal.company_name)).size;

    // Calculate unique investors
    const allInvestors = new Set<string>();
    deals.forEach((deal) => {
      if (deal.lead_investors) {
        deal.lead_investors
          .split(",")
          .forEach((inv) => allInvestors.add(inv.trim()));
      }
      if (deal.other_investors) {
        deal.other_investors
          .split(",")
          .forEach((inv) => allInvestors.add(inv.trim()));
      }
    });
    const totalInvestors = allInvestors.size;

    const averageDealSize = totalDeals > 0 ? totalFunding / totalDeals : 0;

    // Calculate growth rate (simplified - comparing last 30 days to previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentDeals = deals.filter((deal) => {
      const dealDate = new Date(deal.date_announced || deal.created_at);
      return dealDate >= thirtyDaysAgo;
    }).length;

    const previousDeals = deals.filter((deal) => {
      const dealDate = new Date(deal.date_announced || deal.created_at);
      return dealDate >= sixtyDaysAgo && dealDate < thirtyDaysAgo;
    }).length;

    const growthRate =
      previousDeals > 0
        ? ((recentDeals - previousDeals) / previousDeals) * 100
        : 0;

    // Calculate top sectors
    const sectorCounts = new Map<string, { count: number; funding: number }>();
    deals.forEach((deal) => {
      const sector = deal.climate_sub_sector || "Unknown";
      const current = sectorCounts.get(sector) || { count: 0, funding: 0 };
      sectorCounts.set(sector, {
        count: current.count + 1,
        funding: current.funding + (deal.amount_raised || 0),
      });
    });

    const topSectors = Array.from(sectorCounts.entries())
      .map(([sector, data]) => ({
        sector,
        dealCount: data.count,
        totalFunding: data.funding,
        percentage: (data.count / totalDeals) * 100,
      }))
      .sort((a, b) => b.dealCount - a.dealCount)
      .slice(0, 5);

    // Calculate top countries
    const countryCounts = new Map<string, { count: number; funding: number }>();
    deals.forEach((deal) => {
      const country = deal.geography_country || "Unknown";
      const current = countryCounts.get(country) || { count: 0, funding: 0 };
      countryCounts.set(country, {
        count: current.count + 1,
        funding: current.funding + (deal.amount_raised || 0),
      });
    });

    const topCountries = Array.from(countryCounts.entries())
      .map(([country, data]) => ({
        country,
        dealCount: data.count,
        totalFunding: data.funding,
        percentage: (data.count / totalDeals) * 100,
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
      topCountries,
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
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  private static calculateDaysAgo(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
