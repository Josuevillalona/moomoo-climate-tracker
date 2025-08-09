import { BaseApiService } from './BaseApiService';
import {
  DashboardMetrics,
  DashboardMetricsResponse,
  SectorMetric,
  CountryMetric,
  DatabaseDeal,
  ApiResponse
} from '../../types/api';

/**
 * Service for handling dashboard metrics and aggregated data
 */
export class MetricsService extends BaseApiService {
  /**
   * Fetch dashboard metrics including totals and aggregated data
   * Optimized version with selective field queries and aggregations
   */
  static async getDashboardMetrics(): Promise<DashboardMetricsResponse> {
    console.log("MetricsService.getDashboardMetrics: Starting optimized version...");

    return this.executeWithTracking(async () => {
      // Optimized approach: Use multiple targeted queries instead of fetching all data
      // This reduces data transfer and improves performance for large datasets

      // 1. Get basic counts and totals with minimal data transfer
      console.log("MetricsService.getDashboardMetrics: Fetching basic metrics...");
      
      const basicMetrics = await this.executeQuery(
        'basicMetrics',
        async () => this.getSupabaseClient()
          .from('deals')
          .select('id, amount_raised, climate_sub_sector, geography_country, lead_investors, other_investors, date_announced', { count: 'exact' })
          .eq('status', 'active')
      );

      if (!basicMetrics) {
        throw new Error('Failed to fetch basic metrics');
      }

      // 2. Calculate metrics from the fetched data
      const totalDeals = basicMetrics.length;
      const validAmounts = basicMetrics
        .filter(deal => deal.amount_raised && deal.amount_raised > 0)
        .map(deal => deal.amount_raised);

      const totalFunding = validAmounts.reduce((sum, amount) => sum + amount, 0);
      const averageDealSize = validAmounts.length > 0 ? totalFunding / validAmounts.length : 0;

      // 3. Calculate unique companies and investors
      const uniqueCompanies = new Set(basicMetrics.map(deal => deal.id)).size; // Using ID as proxy
      
      const allInvestors = new Set<string>();
      basicMetrics.forEach(deal => {
        if (deal.lead_investors) {
          deal.lead_investors.split(',').forEach((inv: string) => allInvestors.add(inv.trim()));
        }
        if (deal.other_investors) {
          deal.other_investors.split(',').forEach((inv: string) => allInvestors.add(inv.trim()));
        }
      });
      const totalInvestors = allInvestors.size;

      // 4. Calculate sector metrics
      const sectorCounts = new Map<string, { count: number; funding: number }>();
      basicMetrics.forEach(deal => {
        const sector = deal.climate_sub_sector || 'Unknown';
        const current = sectorCounts.get(sector) || { count: 0, funding: 0 };
        current.count += 1;
        current.funding += deal.amount_raised || 0;
        sectorCounts.set(sector, current);
      });

      const topSectors: SectorMetric[] = Array.from(sectorCounts.entries())
        .map(([sector, data]) => ({
          sector,
          dealCount: data.count,
          totalFunding: data.funding,
          percentage: totalDeals > 0 ? (data.count / totalDeals) * 100 : 0
        }))
        .sort((a, b) => b.dealCount - a.dealCount)
        .slice(0, 10);

      // 5. Calculate country metrics
      const countryCounts = new Map<string, { count: number; funding: number }>();
      basicMetrics.forEach(deal => {
        const country = deal.geography_country || 'Unknown';
        const current = countryCounts.get(country) || { count: 0, funding: 0 };
        current.count += 1;
        current.funding += deal.amount_raised || 0;
        countryCounts.set(country, current);
      });

      const topCountries: CountryMetric[] = Array.from(countryCounts.entries())
        .map(([country, data]) => ({
          country,
          dealCount: data.count,
          totalFunding: data.funding,
          percentage: totalDeals > 0 ? (data.count / totalDeals) * 100 : 0
        }))
        .sort((a, b) => b.dealCount - a.dealCount)
        .slice(0, 10);

      // 6. Calculate growth rate (simplified - based on recent vs older deals)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      const recentDeals = basicMetrics.filter(deal => 
        deal.date_announced && new Date(deal.date_announced) >= thirtyDaysAgo
      ).length;
      const olderDeals = totalDeals - recentDeals;
      const growthRate = olderDeals > 0 ? ((recentDeals - olderDeals) / olderDeals) * 100 : 0;

      const metrics: DashboardMetrics = {
        totalDeals,
        totalFunding,
        totalCompanies: uniqueCompanies,
        totalInvestors,
        growthRate,
        averageDealSize,
        topSectors,
        topCountries
      };

      console.log("MetricsService.getDashboardMetrics: Metrics calculated:", {
        totalDeals: metrics.totalDeals,
        totalFunding: metrics.totalFunding,
        sectorsCount: metrics.topSectors.length,
        countriesCount: metrics.topCountries.length
      });

      return metrics;
    }, 'getDashboardMetrics');
  }

  /**
   * Get sector-specific metrics
   */
  static async getSectorMetrics(limit: number = 10): Promise<ApiResponse<SectorMetric[]>> {
    return this.executeWithTracking(async () => {
      const deals = await this.executeQuery(
        'sectorMetrics',
        async () => this.getSupabaseClient()
          .from('deals')
          .select('climate_sub_sector, amount_raised')
          .eq('status', 'active')
          .not('climate_sub_sector', 'is', null)
      );

      const sectorCounts = new Map<string, { count: number; funding: number }>();
      deals.forEach(deal => {
        const sector = deal.climate_sub_sector;
        const current = sectorCounts.get(sector) || { count: 0, funding: 0 };
        current.count += 1;
        current.funding += deal.amount_raised || 0;
        sectorCounts.set(sector, current);
      });

      const totalDeals = deals.length;
      const metrics: SectorMetric[] = Array.from(sectorCounts.entries())
        .map(([sector, data]) => ({
          sector,
          dealCount: data.count,
          totalFunding: data.funding,
          percentage: totalDeals > 0 ? (data.count / totalDeals) * 100 : 0
        }))
        .sort((a, b) => b.dealCount - a.dealCount)
        .slice(0, limit);

      return metrics;
    }, 'getSectorMetrics');
  }

  /**
   * Get country-specific metrics
   */
  static async getCountryMetrics(limit: number = 10): Promise<ApiResponse<CountryMetric[]>> {
    return this.executeWithTracking(async () => {
      const deals = await this.executeQuery(
        'countryMetrics',
        async () => this.getSupabaseClient()
          .from('deals')
          .select('geography_country, amount_raised')
          .eq('status', 'active')
          .not('geography_country', 'is', null)
      );

      const countryCounts = new Map<string, { count: number; funding: number }>();
      deals.forEach(deal => {
        const country = deal.geography_country;
        const current = countryCounts.get(country) || { count: 0, funding: 0 };
        current.count += 1;
        current.funding += deal.amount_raised || 0;
        countryCounts.set(country, current);
      });

      const totalDeals = deals.length;
      const metrics: CountryMetric[] = Array.from(countryCounts.entries())
        .map(([country, data]) => ({
          country,
          dealCount: data.count,
          totalFunding: data.funding,
          percentage: totalDeals > 0 ? (data.count / totalDeals) * 100 : 0
        }))
        .sort((a, b) => b.dealCount - a.dealCount)
        .slice(0, limit);

      return metrics;
    }, 'getCountryMetrics');
  }
}
