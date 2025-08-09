import { FundingService } from "../funding";
import { supabase } from "../../supabase";
import {
  ApiException,
  ApiErrorType,
  DatabaseDeal,
  DealFilters,
} from "../../../types/api";

// Mock Supabase
jest.mock("../../supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

// Mock performance monitor
jest.mock("../../utils/performance", () => ({
  measureQuery: jest.fn((name: string, fn: () => any, metadata?: any) => fn()),
  performanceMonitor: {
    measureAsync: jest.fn((fn: () => any, options?: any) => fn()),
    getStats: jest.fn(),
    getRecentMetrics: jest.fn(() => []),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock data
const mockDatabaseDeal: DatabaseDeal = {
  id: 1,
  created_at: "2024-01-01T00:00:00Z",
  company_name: "Test Company",
  amount_raised: 1000000,
  currency: "USD",
  funding_stage: "Series A",
  date_announced: "2024-01-01",
  lead_investors: "Test VC, Another VC",
  other_investors: "Angel Investor",
  climate_sub_sector: "Solar",
  geography_country: "USA",
  source_url: "https://example.com",
  raw_text_content: "Test content",
  status: "PROCESSED_AI",
  funding_amount_str: "$1M",
};

const mockDatabaseDeals: DatabaseDeal[] = [
  mockDatabaseDeal,
  {
    ...mockDatabaseDeal,
    id: 2,
    company_name: "Another Company",
    amount_raised: 2000000,
    climate_sub_sector: "Wind",
    geography_country: "Germany",
  },
];

describe("FundingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboardMetrics", () => {
    it("should fetch and calculate dashboard metrics successfully", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      // Mock the measureQuery to return the actual query results
      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery
        .mockResolvedValueOnce({
          data: mockDatabaseDeals,
          error: null,
        })
        .mockResolvedValueOnce({
          data: [
            { climate_sub_sector: "Solar", amount_raised: 1000000 },
            { climate_sub_sector: "Wind", amount_raised: 2000000 },
          ],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [
            { geography_country: "USA", amount_raised: 1000000 },
            { geography_country: "Germany", amount_raised: 2000000 },
          ],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [
            {
              lead_investors: "Test VC, Another VC",
              other_investors: "Angel Investor",
            },
            { lead_investors: "Test VC", other_investors: null },
          ],
          error: null,
        });

      const result = await FundingService.getDashboardMetrics();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.totalDeals).toBe(2);
      expect(result.data?.totalFunding).toBe(3000000);
      expect(result.data?.totalCompanies).toBe(2);
      expect(result.data?.topSectors).toHaveLength(2);
      expect(result.data?.topCountries).toHaveLength(2);
      expect(result.loading).toBe(false);

      // Verify that measureQuery was called for each optimized query
      expect(mockMeasureQuery).toHaveBeenCalledTimes(4);
    });

    it("should handle database errors gracefully", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed" },
      });

      const result = await FundingService.getDashboardMetrics();

      expect(result.data).toBeNull();
      expect(result.error).toContain("Failed to fetch basic metrics");
      expect(result.loading).toBe(false);
    });

    it("should return empty metrics when no deals found", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await FundingService.getDashboardMetrics();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.totalDeals).toBe(0);
      expect(result.data?.totalFunding).toBe(0);
      expect(result.data?.totalCompanies).toBe(0);
      expect(result.data?.totalInvestors).toBe(0);
    });

    it("should handle partial query failures gracefully", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery
        .mockResolvedValueOnce({
          data: [mockDatabaseDeal],
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Sector query failed" },
        })
        .mockResolvedValueOnce({
          data: [{ geography_country: "USA", amount_raised: 1000000 }],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ lead_investors: "Test VC", other_investors: null }],
          error: null,
        });

      const result = await FundingService.getDashboardMetrics();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.totalDeals).toBe(1);
      expect(result.data?.topSectors).toHaveLength(0); // Should handle missing sector data
      expect(result.data?.topCountries).toHaveLength(1);
    });
  });

  describe("getRecentDeals", () => {
    it("should fetch recent deals successfully", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: [mockDatabaseDeal],
        error: null,
      });

      const result = await FundingService.getRecentDeals(5);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toMatchObject({
        id: 1,
        companyName: "Test Company",
        fundingStage: "Series A",
        amountRaised: 1000000,
        formattedAmount: "$1.0M",
        leadInvestors: ["Test VC", "Another VC"],
        otherInvestors: ["Angel Investor"],
      });
      expect(result.loading).toBe(false);
    });

    it("should handle database errors", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      const result = await FundingService.getRecentDeals(5);

      expect(result.data).toBeNull();
      expect(result.error).toContain("Failed to fetch recent deals");
      expect(result.loading).toBe(false);
    });

    it("should cap limit to prevent excessive data transfer", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({ data: [], error: null });

      await FundingService.getRecentDeals(100);

      expect(mockMeasureQuery).toHaveBeenCalledWith(
        "recent-deals",
        expect.any(Function),
        expect.objectContaining({
          limit: 100, // Should be capped at 100 (not 50)
          expectedRows: 100,
        })
      );
    });

    it("should transform deals correctly", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: [mockDatabaseDeal],
        error: null,
      });

      const result = await FundingService.getRecentDeals(5);

      expect(result.data?.[0]).toMatchObject({
        id: 1,
        companyName: "Test Company",
        fundingStage: "Series A",
        amountRaised: 1000000,
        climateSector: "Solar",
        country: "USA",
        leadInvestors: ["Test VC", "Another VC"],
        otherInvestors: ["Angel Investor"],
        allInvestors: ["Test VC", "Another VC", "Angel Investor"],
      });
    });
  });

  describe("getDealsWithFilters", () => {
    it("should apply filters correctly", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: [mockDatabaseDeal],
        error: null,
        count: 1,
      });

      const filters: DealFilters = {
        dateRange: {
          start: "2024-01-01",
          end: "2024-12-31",
        },
        amountRange: {
          min: 100000,
          max: 10000000,
        },
        fundingStage: ["Series A", "Series B"],
        climateSector: ["Solar", "Wind"],
        limit: 20,
        offset: 0,
      };

      const result = await FundingService.getDealsWithFilters(filters);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.data).toHaveLength(1);
      expect(result.data?.total).toBe(1);
      expect(result.data?.page).toBe(1);
      expect(result.data?.pageSize).toBe(20);
      expect(result.data?.hasMore).toBe(false);
    });

    it("should cap pagination limit", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      });

      const filters: DealFilters = {
        limit: 200, // Request 200 items
        offset: 0,
      };

      await FundingService.getDealsWithFilters(filters);

      expect(mockMeasureQuery).toHaveBeenCalledWith(
        "filtered-deals-paginated",
        expect.any(Function),
        expect.objectContaining({
          limit: 100, // Should be capped at 100
          offset: 0,
          expectedRows: 100,
        })
      );
    });

    it("should handle database errors", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
        count: null,
      });

      const result = await FundingService.getDealsWithFilters({});

      expect(result.data).toBeNull();
      expect(result.error).toContain("Failed to fetch filtered deals");
    });
  });

  describe("getDealById", () => {
    it("should fetch deal by ID successfully", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockDatabaseDeal,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const result = await FundingService.getDealById(1);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe(1);
      expect(result.data?.companyName).toBe("Test Company");
    });

    it("should handle not found error", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "No rows found" },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const result = await FundingService.getDealById(999);

      expect(result.data).toBeNull();
      expect(result.error).toContain("Deal with ID 999 not found");
    });

    it("should handle database errors", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const result = await FundingService.getDealById(1);

      expect(result.data).toBeNull();
      expect(result.error).toContain("Failed to fetch deal");
    });
  });

  describe("subscribeToDeals", () => {
    it("should setup real-time subscription", () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };
      mockChannel.subscribe.mockReturnValue(mockChannel);

      mockSupabase.channel.mockReturnValue(mockChannel as any);

      const callback = jest.fn();
      const unsubscribe = FundingService.subscribeToDeals(callback);

      expect(mockSupabase.channel).toHaveBeenCalledWith("deals-changes");
      expect(mockChannel.on).toHaveBeenCalledWith(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deals",
          filter: undefined,
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();

      // Test unsubscribe
      unsubscribe();
      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it("should handle subscription with custom options", () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };
      mockChannel.subscribe.mockReturnValue(mockChannel);

      mockSupabase.channel.mockReturnValue(mockChannel as any);

      const callback = jest.fn();
      const options = {
        event: "INSERT" as const,
        schema: "custom",
        table: "custom_deals",
        filter: "status=eq.published",
      };

      FundingService.subscribeToDeals(callback, options);

      expect(mockChannel.on).toHaveBeenCalledWith(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "custom",
          table: "custom_deals",
          filter: "status=eq.published",
        },
        expect.any(Function)
      );
    });
  });

  describe("getDealsWithCursor", () => {
    it("should fetch deals with cursor pagination", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: [mockDatabaseDeal],
        error: null,
      });

      const filters = {
        limit: 10,
        cursor: { id: 5, date: "2024-01-01" },
      };

      const result = await FundingService.getDealsWithCursor(filters);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.data).toHaveLength(1);
      expect(result.data?.hasMore).toBe(false);
      expect(result.data?.nextCursor).toBeNull();
    });

    it("should handle cursor pagination with more results", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      // Return limit + 1 results to indicate more data
      mockMeasureQuery.mockResolvedValueOnce({
        data: [mockDatabaseDeal, { ...mockDatabaseDeal, id: 2 }],
        error: null,
      });

      const filters = { limit: 1 };

      const result = await FundingService.getDealsWithCursor(filters);

      expect(result.data?.hasMore).toBe(true);
      expect(result.data?.nextCursor).toEqual({
        id: 1,
        date: "2024-01-01",
      });
    });
  });

  describe("Error handling", () => {
    it("should handle network errors", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockRejectedValueOnce(new Error("Network error"));

      const result = await FundingService.getDashboardMetrics();

      expect(result.data).toBeNull();
      expect(result.error).toContain(
        "Unexpected error fetching dashboard metrics"
      );
    });

    it("should handle ApiException errors", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockRejectedValueOnce(
        new ApiException(
          ApiErrorType.DATABASE_ERROR,
          "Custom database error",
          true
        )
      );

      const result = await FundingService.getDashboardMetrics();

      expect(result.data).toBeNull();
      expect(result.error).toBe("Custom database error");
    });

    it("should handle timeout errors", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockRejectedValueOnce(
        new ApiException(ApiErrorType.TIMEOUT_ERROR, "Request timeout", true)
      );

      const result = await FundingService.getRecentDeals(5);

      expect(result.data).toBeNull();
      expect(result.error).toBe("Request timeout");
    });
  });

  describe("Data transformation", () => {
    it("should transform database deals correctly", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: [
          {
            ...mockDatabaseDeal,
            lead_investors: "VC One, VC Two",
            other_investors: "Angel One, Angel Two",
            amount_raised: 1500000,
          },
        ],
        error: null,
      });

      const result = await FundingService.getRecentDeals(1);

      const transformedDeal = result.data?.[0];
      expect(transformedDeal?.leadInvestors).toEqual(["VC One", "VC Two"]);
      expect(transformedDeal?.otherInvestors).toEqual([
        "Angel One",
        "Angel Two",
      ]);
      expect(transformedDeal?.allInvestors).toEqual([
        "VC One",
        "VC Two",
        "Angel One",
        "Angel Two",
      ]);
      expect(transformedDeal?.formattedAmount).toBe("$1.5M");
    });

    it("should handle null investor strings", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: [
          {
            ...mockDatabaseDeal,
            lead_investors: null,
            other_investors: null,
          },
        ],
        error: null,
      });

      const result = await FundingService.getRecentDeals(1);

      const transformedDeal = result.data?.[0];
      expect(transformedDeal?.leadInvestors).toEqual([]);
      expect(transformedDeal?.otherInvestors).toEqual([]);
      expect(transformedDeal?.allInvestors).toEqual([]);
    });

    it("should handle missing company names", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: [
          {
            ...mockDatabaseDeal,
            company_name: null,
            funding_stage: null,
            climate_sub_sector: null,
            geography_country: null,
          },
        ],
        error: null,
      });

      const result = await FundingService.getRecentDeals(1);

      const transformedDeal = result.data?.[0];
      expect(transformedDeal?.companyName).toBe("Unknown Company");
      expect(transformedDeal?.fundingStage).toBe("Unknown");
      expect(transformedDeal?.climateSector).toBe("Unknown");
      expect(transformedDeal?.country).toBe("Unknown");
    });
  });
});
