import {
  DatabaseDeal,
  FundingDeal,
  DashboardMetrics,
  SectorMetric,
  CountryMetric
} from '../../types/api';

export class DashboardTransformer {
  /**
   * Transform raw database deals for dashboard display
   */
  static transformDealsForDisplay(deals: DatabaseDeal[]): FundingDeal[] {
    return deals.map(deal => this.transformSingleDeal(deal));
  }

  /**
   * Transform a single database deal for display
   */
  static transformSingleDeal(deal: DatabaseDeal): FundingDeal {
    const leadInvestors = this.parseInvestorString(deal.lead_investors);
    const otherInvestors = this.parseInvestorString(deal.other_investors);
    const allInvestors = [...leadInvestors, ...otherInvestors];

    const dateAnnounced = deal.date_announced || deal.created_at;
    const daysAgo = this.calculateDaysAgo(dateAnnounced);

    return {
      id: deal.id,
      companyName: deal.company_name || 'Unknown Company',
      fundingStage: this.normalizeFundingStage(deal.funding_stage),
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
   * Calculate comprehensive dashboard metrics from raw deal data
   */
  static calculateMetrics(deals: DatabaseDeal[]): DashboardMetrics {
    const totalDeals = deals.length;
    const totalFunding = this.calculateTotalFunding(deals);
    const totalCompanies = this.calculateUniqueCompanies(deals);
    const totalInvestors = this.calculateUniqueInvestors(deals);
    const growthRate = this.calculateGrowthRate(deals);
    const averageDealSize = totalDeals > 0 ? totalFunding / totalDeals : 0;
    const topSectors = this.calculateTopSectors(deals);
    const topCountries = this.calculateTopCountries(deals);

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
   * Currency formatting with intelligent scaling
   */
  static formatCurrency(amount: number, options: {
    showCents?: boolean;
    compact?: boolean;
    currency?: string;
  } = {}): string {
    const { showCents = false, compact = true, currency = 'USD' } = options;

    if (amount === 0) return '$0';

    if (compact) {
      if (amount >= 1000000000) {
        const billions = amount / 1000000000;
        return `$${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)}B`;
      } else if (amount >= 1000000) {
        const millions = amount / 1000000;
        return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
      } else if (amount >= 1000) {
        const thousands = amount / 1000;
        return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
      }
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0
    }).format(amount);
  }

  /**
   * Date formatting with multiple format options
   */
  static formatDate(dateString: string, format: 'short' | 'medium' | 'long' | 'relative' = 'short'): string {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      
      case 'medium':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'long':
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'relative':
        return this.formatRelativeDate(date);
      
      default:
        return this.formatDate(dateString, 'short');
    }
  }

  /**
   * Format relative date (e.g., "2 days ago", "1 month ago")
   */
  static formatRelativeDate(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  }

  /**
   * Calculate percentage with formatting
   */
  static formatPercentage(value: number, total: number, decimals: number = 1): string {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
  }

  /**
   * Format large numbers with appropriate scaling
   */
  static formatNumber(num: number, compact: boolean = true): string {
    if (compact) {
      if (num >= 1000000000) {
        return `${(num / 1000000000).toFixed(1)}B`;
      } else if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
      }
    }
    
    return num.toLocaleString();
  }

  /**
   * Normalize funding stage names for consistency
   */
  static normalizeFundingStage(stage: string | null): string {
    if (!stage) return 'Unknown';
    
    const normalized = stage.toLowerCase().trim();
    
    // Common stage mappings
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

    return stageMap[normalized] || this.capitalizeWords(stage);
  }

  /**
   * Parse investor string into array of investor names
   */
  private static parseInvestorString(investorString: string | null): string[] {
    if (!investorString) return [];
    
    return investorString
      .split(/[,;]/) // Split by comma or semicolon
      .map(investor => investor.trim())
      .filter(investor => investor.length > 0)
      .map(investor => this.cleanInvestorName(investor));
  }

  /**
   * Clean and normalize investor names
   */
  private static cleanInvestorName(name: string): string {
    // Remove common prefixes/suffixes and normalize
    return name
      .replace(/^(Mr\.|Ms\.|Dr\.|Prof\.)\s+/i, '')
      .replace(/\s+(Inc\.|LLC|Ltd\.|Corp\.)$/i, '')
      .trim();
  }

  /**
   * Calculate days between date and now
   */
  private static calculateDaysAgo(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate total funding from deals
   */
  private static calculateTotalFunding(deals: DatabaseDeal[]): number {
    return deals.reduce((sum, deal) => sum + (deal.amount_raised || 0), 0);
  }

  /**
   * Calculate unique companies count
   */
  private static calculateUniqueCompanies(deals: DatabaseDeal[]): number {
    const uniqueCompanies = new Set(
      deals
        .map(deal => deal.company_name?.toLowerCase().trim())
        .filter(name => name && name.length > 0)
    );
    return uniqueCompanies.size;
  }

  /**
   * Calculate unique investors count
   */
  private static calculateUniqueInvestors(deals: DatabaseDeal[]): number {
    const allInvestors = new Set<string>();
    
    deals.forEach(deal => {
      const leadInvestors = this.parseInvestorString(deal.lead_investors);
      const otherInvestors = this.parseInvestorString(deal.other_investors);
      
      [...leadInvestors, ...otherInvestors].forEach(investor => {
        allInvestors.add(investor.toLowerCase().trim());
      });
    });
    
    return allInvestors.size;
  }

  /**
   * Calculate growth rate comparing recent period to previous period
   */
  private static calculateGrowthRate(deals: DatabaseDeal[], periodDays: number = 30): number {
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
  private static calculateTopSectors(deals: DatabaseDeal[], limit: number = 5): SectorMetric[] {
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
  private static calculateTopCountries(deals: DatabaseDeal[], limit: number = 5): CountryMetric[] {
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
   * Capitalize words in a string
   */
  private static capitalizeWords(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}