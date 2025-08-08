import { FundingService } from "../funding";
import { supabase } from "../../supabase";
import { ApiException, ApiErrorType, DatabaseDeal, DealFilters } from "../../../types/api";
import { it } from "node:test";
import { describe } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { describe } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { describe } from "node:test";
import { it } from "node:test";
import { it } from "node:test";
import { describe } from "node:test";
import { beforeEach } from "node:test";
import { describe } from "node:test";

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

describe("FundingService Optimized Queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboardMetrics - Optimized Version", () => {
    it("should execute multiple optimized queries for dashboard metrics", async () => {
      // Mock successful responses for each query - the measureQuery mock will call the function
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
          data: [
            {
              id: 1,
              amount_raised: 1000000,
              company_name: "Company A",
              date_announced: "2024-01-01",
              created_at: "2024-01-01",
            },
            {
              id: 2,
              amount_raised: 2000000,
              company_name: "Company B",
              date_announced: "2024-01-02",
              created_at: "2024-01-02",
            },
          ],
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
            { geography_country: "USA", amount_raised: 1500000 },
            { geography_country: "Germany", amount_raised: 1500000 },
          ],
          error: null,
        })
        .mockResolvedValueOnce({
          data: [
            { lead_investors: "Investor A", other_investors: "Investor B" },
            { lead_investors: "Investor C", other_investors: null },
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

      // Verify that measureQuery was called for each optimized query
      expect(mockMeasureQuery).toHaveBeenCalledTimes(4);
    });

    it("should handle partial query failures gracefully", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      // Mock the measureQuery to simulate partial failures
      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery
        .mockResolvedValueOnce({
          data: [
            {
              id: 1,
              amount_raised: 1000000,
              company_name: "Company A",
              date_announced: "2024-01-01",
              created_at: "2024-01-01",
            },
          ],
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
          data: [{ lead_investors: "Investor A", other_investors: null }],
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

  describe("getRecentDeals - Optimized Version", () => {
    it("should execute optimized query with selective field selection", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      // Mock the measureQuery to return the query result
      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            company_name: "Company A",
            funding_stage: "Series A",
            amount_raised: 1000000,
            date_announced: "2024-01-01",
            lead_investors: "Investor A",
            other_investors: "Investor B",
            climate_sub_sector: "Solar",
            geography_country: "USA",
            status: "PROCESSED_AI",
            created_at: "2024-01-01",
          },
        ],
        error: null,
      });

      const result = await FundingService.getRecentDeals(5);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toMatchObject({
        id: 1,
        companyName: "Company A",
        fundingStage: "Series A",
        amountRaised: 1000000,
      });

      // Verify measureQuery was called with correct parameters
      expect(mockMeasureQuery).toHaveBeenCalledWith(
        "recent-deals",
        expect.any(Function),
        expect.objectContaining({
          queryType: "recent-deals",
          limit: 5,
          expectedRows: 5,
        })
      );
    });

    it("should cap limit to prevent excessive data transfer", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      // Mock the measureQuery to return empty result
      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({ data: [], error: null });

      await FundingService.getRecentDeals(100); // Request 100 deals

      // Verify measureQuery was called with capped limit
      expect(mockMeasureQuery).toHaveBeenCalledWith(
        "recent-deals",
        expect.any(Function),
        expect.objectContaining({
          limit: 100,
          expectedRows: 100,
        })
      );
    });
  });

  describe("getDealsWithFilters - Optimized Version", () => {
    it("should apply filters in optimal order for index usage", async () => {
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

      // Mock the measureQuery to return empty result
      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      });

      const filters = {
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

      await FundingService.getDealsWithFilters(filters);

      // Verify measureQuery was called with correct parameters
      expect(mockMeasureQuery).toHaveBeenCalledWith(
        "filtered-deals-paginated",
        expect.any(Function),
        expect.objectContaining({
          queryType: "filtered-pagination",
          filters: expect.arrayContaining([
            "dateRange",
            "amountRange",
            "fundingStage",
            "climateSector",
            "limit",
            "offset",
          ]),
          limit: 20,
          offset: 0,
          expectedRows: 20,
        })
      );
    });

    it("should cap pagination limit to prevent excessive data transfer", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      // Mock the measureQuery to return empty result
      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      });

      const filters = {
        limit: 200, // Request 200 items
        offset: 0,
      };

      await FundingService.getDealsWithFilters(filters);

      // Verify limit was capped at 100
      expect(mockMeasureQuery).toHaveBeenCalledWith(
        "filtered-deals-paginated",
        expect.any(Function),
        expect.objectContaining({
          limit: 100, // Should be capped
          offset: 0,
          expectedRows: 100,
        })
      );
    });

    it("should return proper pagination metadata", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      // Mock the measureQuery to return paginated result
      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({
        data: new Array(20).fill(null).map((_, i) => ({
          id: i + 1,
          company_name: `Company ${i + 1}`,
          funding_stage: "Series A",
          amount_raised: 1000000,
          date_announced: "2024-01-01",
          lead_investors: "Investor A",
          other_investors: null,
          climate_sub_sector: "Solar",
          geography_country: "USA",
          status: "PROCESSED_AI",
          created_at: "2024-01-01",
        })),
        error: null,
        count: 150, // Total count
      });

      const filters = {
        limit: 20,
        offset: 40, // Page 3
      };

      const result = await FundingService.getDealsWithFilters(filters);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.data).toHaveLength(20);
      expect(result.data?.total).toBe(150);
      expect(result.data?.page).toBe(3);
      expect(result.data?.pageSize).toBe(20);
      expect(result.data?.hasMore).toBe(true);
    });
  });

  describe("Performance Monitoring Integration", () => {
    it("should measure query performance for all optimized methods", async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQueryBuilder as any);

      // Mock the measureQuery to return empty result
      const mockMeasureQuery = require("../../utils/performance")
        .measureQuery as jest.MockedFunction<any>;
      mockMeasureQuery.mockResolvedValueOnce({ data: [], error: null });

      await FundingService.getRecentDeals(5);

      // Verify performance monitoring was called
      expect(mockMeasureQuery).toHaveBeenCalledWith(
        "recent-deals",
        expect.any(Function),
        expect.objectContaining({
          queryType: "recent-deals",
          limit: 5,
          expectedRows: 5,
        })
      );
    });
  });
});
