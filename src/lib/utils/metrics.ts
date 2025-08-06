import { DatabaseDeal, DashboardMetrics, SectorMetric, CountryMetric } from '../../types/api';
import { parseInvestors } from './formatters';

/**
 * Utility functions for calculating various metrics from deal data
 */

/**
 * Calculate comprehensive dashboard metrics from deal data
 */
export function calculateDashboardMetrics(deals: DatabaseDeal[]): DashboardMetrics {
  const totalDeals = deals.length;
  const totalFunding = calculateTotalFunding(deals);
  const totalCompanies = calculateUniqueCompanies(deals);
  const totalInvestors = calculateUniqueInvestors(deals);
  const growthRate = calculateGrowthRate(deals);
  const averageDealSize = totalDeals > 0 ? totalFunding / totalDeals : 0;
  const topSectors = calculateTopSectors(deals);
  const topCountries = calculateTopCountries(deals);

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
 * Calculate total funding amount from deals
 */
export function calculateTotalFunding(deals: DatabaseDeal[]): number {
  return deals.reduce((sum, deal) => sum + (deal.amount_raised || 0), 0);
}

/**
 * Calculate number of unique companies
 */
export function calculateUniqueCompanies(deals: DatabaseDeal[]): number {
  const uniqueCompanies = new Set(
    deals
      .map(deal => deal.company_name?.toLowerCase().trim())
      .filter(name => name && name.length > 0)
  );
  return uniqueCompanies.size;
}

/**
 * Calculate number of unique investors
 */
export function calculateUniqueInvestors(deals: DatabaseDeal[]): number {
  const allInvestors = new Set<string>();
  
  deals.forEach(deal => {
    const leadInvestors = parseInvestors(deal.lead_investors);
    const otherInvestors = parseInvestors(deal.other_investors);
    
    [...leadInvestors, ...otherInvestors].forEach(investor => {
      allInvestors.add(investor.toLowerCase().trim());
    });
  });
  
  return allInvestors.size;
}

/**
 * Calculate growth rate comparing recent period to previous period
 */
export function calculateGrowthRate(
  deals: DatabaseDeal[], 
  periodDays: number = 30
): number {
  const now = new Date();
  const recentPeriodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(now.getTime() - 2 * periodDays * 24 * 60 * 60 * 1000);

  const recentDeals = deals.filter(deal => {
    const dealDate = new Date(deal.date_announced || deal.created_at);
    return dealDate >= recentPeriodStart;
  }).length;

  const previousDeals = deals.filter(deal => {
    const dealDate = new Date(deal.date_announced || deal.created_at);
    return dealDate >= previousPeriodStart && dealDate < recentPeriodStart;
  }).length;

  if (previousDeals === 0) return recentDeals > 0 ? 100 : 0;
  
  return ((recentDeals - previousDeals) / previousDeals) * 100;
}

/**
 * Calculate top sectors by deal count and funding
 */
export function calculateTopSectors(
  deals: DatabaseDeal[], 
  limit: number = 5
): SectorMetric[] {
  const sectorMap = new Map<string, { count: number; funding: number }>();
  
  deals.forEach(deal => {
    const sector = deal.climate_sub_sector || 'Unknown';
    const current = sectorMap.get(sector) || { count: 0, funding: 0 };
    sectorMap.set(sector, {
      count: current.count + 1,
      funding: current.funding + (deal.amount_raised || 0)
    });
  });

  const totalDeals = deals.length;
  
  return Array.from(sectorMap.entries())
    .map(([sector, data]) => ({
      sector,
      dealCount: data.count,
      totalFunding: data.funding,
      percentage: totalDeals > 0 ? (data.count / totalDeals) * 100 : 0
    }))
    .sort((a, b) => b.dealCount - a.dealCount)
    .slice(0, limit);
}

/**
 * Calculate top countries by deal count and funding
 */
export function calculateTopCountries(
  deals: DatabaseDeal[], 
  limit: number = 5
): CountryMetric[] {
  const countryMap = new Map<string, { count: number; funding: number }>();
  
  deals.forEach(deal => {
    const country = deal.geography_country || 'Unknown';
    const current = countryMap.get(country) || { count: 0, funding: 0 };
    countryMap.set(country, {
      count: current.count + 1,
      funding: current.funding + (deal.amount_raised || 0)
    });
  });

  const totalDeals = deals.length;
  
  return Array.from(countryMap.entries())
    .map(([country, data]) => ({
      country,
      dealCount: data.count,
      totalFunding: data.funding,
      percentage: totalDeals > 0 ? (data.count / totalDeals) * 100 : 0
    }))
    .sort((a, b) => b.dealCount - a.dealCount)
    .slice(0, limit);
}

/**
 * Calculate funding distribution by stage
 */
export function calculateFundingByStage(deals: DatabaseDeal[]): Array<{
  stage: string;
  count: number;
  totalFunding: number;
  averageFunding: number;
  percentage: number;
}> {
  const stageMap = new Map<string, { count: number; funding: number }>();
  
  deals.forEach(deal => {
    const stage = normalizeFundingStage(deal.funding_stage);
    const current = stageMap.get(stage) || { count: 0, funding: 0 };
    stageMap.set(stage, {
      count: current.count + 1,
      funding: current.funding + (deal.amount_raised || 0)
    });
  });

  const totalDeals = deals.length;
  
  return Array.from(stageMap.entries())
    .map(([stage, data]) => ({
      stage,
      count: data.count,
      totalFunding: data.funding,
      averageFunding: data.count > 0 ? data.funding / data.count : 0,
      percentage: totalDeals > 0 ? (data.count / totalDeals) * 100 : 0
    }))
    .sort((a, b) => b.totalFunding - a.totalFunding);
}

/**
 * Calculate monthly funding trends
 */
export function calculateMonthlyTrends(
  deals: DatabaseDeal[], 
  months: number = 12
): Array<{
  month: string;
  year: number;
  dealCount: number;
  totalFunding: number;
  averageFunding: number;
}> {
  const now = new Date();
  const monthlyData = new Map<string, { count: number; funding: number }>();

  // Initialize last N months
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData.set(key, { count: 0, funding: 0 });
  }

  // Aggregate deals by month
  deals.forEach(deal => {
    const dealDate = new Date(deal.date_announced || deal.created_at);
    const key = `${dealDate.getFullYear()}-${String(dealDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthlyData.has(key)) {
      const current = monthlyData.get(key)!;
      monthlyData.set(key, {
        count: current.count + 1,
        funding: current.funding + (deal.amount_raised || 0)
      });
    }
  });

  return Array.from(monthlyData.entries())
    .map(([key, data]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: parseInt(year),
        dealCount: data.count,
        totalFunding: data.funding,
        averageFunding: data.count > 0 ? data.funding / data.count : 0
      };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return new Date(`${a.month} 1, ${a.year}`).getMonth() - new Date(`${b.month} 1, ${b.year}`).getMonth();
    });
}

/**
 * Calculate investor activity metrics
 */
export function calculateInvestorMetrics(deals: DatabaseDeal[]): Array<{
  investor: string;
  dealCount: number;
  totalInvestment: number;
  averageInvestment: number;
  sectors: string[];
  isLead: boolean;
}> {
  const investorMap = new Map<string, {
    dealCount: number;
    totalInvestment: number;
    sectors: Set<string>;
    leadCount: number;
  }>();

  deals.forEach(deal => {
    const leadInvestors = parseInvestors(deal.lead_investors);
    const otherInvestors = parseInvestors(deal.other_investors);
    const sector = deal.climate_sub_sector || 'Unknown';
    const amount = deal.amount_raised || 0;

    // Process lead investors
    leadInvestors.forEach(investor => {
      const key = investor.toLowerCase().trim();
      const current = investorMap.get(key) || {
        dealCount: 0,
        totalInvestment: 0,
        sectors: new Set(),
        leadCount: 0
      };
      
      investorMap.set(key, {
        dealCount: current.dealCount + 1,
        totalInvestment: current.totalInvestment + amount,
        sectors: current.sectors.add(sector),
        leadCount: current.leadCount + 1
      });
    });

    // Process other investors
    otherInvestors.forEach(investor => {
      const key = investor.toLowerCase().trim();
      const current = investorMap.get(key) || {
        dealCount: 0,
        totalInvestment: 0,
        sectors: new Set(),
        leadCount: 0
      };
      
      investorMap.set(key, {
        dealCount: current.dealCount + 1,
        totalInvestment: current.totalInvestment + amount,
        sectors: current.sectors.add(sector),
        leadCount: current.leadCount
      });
    });
  });

  return Array.from(investorMap.entries())
    .map(([investor, data]) => ({
      investor: capitalizeWords(investor),
      dealCount: data.dealCount,
      totalInvestment: data.totalInvestment,
      averageInvestment: data.dealCount > 0 ? data.totalInvestment / data.dealCount : 0,
      sectors: Array.from(data.sectors),
      isLead: data.leadCount > 0
    }))
    .sort((a, b) => b.dealCount - a.dealCount);
}

/**
 * Normalize funding stage names
 */
function normalizeFundingStage(stage: string | null): string {
  if (!stage) return 'Unknown';
  
  const normalized = stage.toLowerCase().trim();
  
  const stageMap: Record<string, string> = {
    'seed': 'Seed',
    'pre-seed': 'Pre-Seed',
    'preseed': 'Pre-Seed',
    'series a': 'Series A',
    'series-a': 'Series A',
    'seriesa': 'Series A',
    'series b': 'Series B',
    'series-b': 'Series B',
    'seriesb': 'Series B',
    'series c': 'Series C',
    'series-c': 'Series C',
    'seriesc': 'Series C',
    'series d': 'Series D+',
    'series e': 'Series D+',
    'series f': 'Series D+',
    'bridge': 'Bridge',
    'convertible': 'Convertible',
    'debt': 'Debt',
    'grant': 'Grant',
    'ipo': 'IPO',
    'acquisition': 'Acquisition',
    'merger': 'Merger'
  };

  return stageMap[normalized] || capitalizeWords(stage);
}

/**
 * Capitalize words helper
 */
function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}