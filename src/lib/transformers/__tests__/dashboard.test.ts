import { DashboardTransformer } from '../dashboard';
import { DatabaseDeal } from '../../../types/api';

describe('DashboardTransformer', () => {
  const mockDatabaseDeal: DatabaseDeal = {
    id: 1,
    created_at: '2024-01-01T00:00:00Z',
    company_name: 'Test Company',
    amount_raised: 1000000,
    currency: 'USD',
    funding_stage: 'series a',
    date_announced: '2024-01-01',
    lead_investors: 'Test VC, Another VC',
    other_investors: 'Angel Investor',
    climate_sub_sector: 'Solar',
    geography_country: 'USA',
    source_url: 'https://example.com',
    raw_text_content: 'Test content',
    status: 'PROCESSED_AI',
    funding_amount_str: '$1M',
  };

  const mockDatabaseDeals: DatabaseDeal[] = [
    mockDatabaseDeal,
    {
      ...mockDatabaseDeal,
      id: 2,
      company_name: 'Another Company',
      amount_raised: 2000000,
      funding_stage: 'Series B',
      climate_sub_sector: 'Wind',
      geography_country: 'Germany',
      lead_investors: 'German VC',
      other_investors: null,
      date_announced: '2024-01-15',
    },
    {
      ...mockDatabaseDeal,
      id: 3,
      company_name: 'Third Company',
      amount_raised: 500000,
      funding_stage: 'seed',
      climate_sub_sector: 'Solar',
      geography_country: 'USA',
      lead_investors: 'Seed VC',
      other_investors: 'Angel One, Angel Two',
      date_announced: '2023-12-01',
    },
  ];

  describe('transformSingleDeal', () => {
    it('should transform a database deal to display format', () => {
      const result = DashboardTransformer.transformSingleDeal(mockDatabaseDeal);

      expect(result).toMatchObject({
        id: 1,
        companyName: 'Test Company',
        fundingStage: 'Series A',
        amountRaised: 1000000,
        dateAnnounced: '2024-01-01',
        leadInvestors: ['Test VC', 'Another VC'],
        otherInvestors: ['Angel Investor'],
        climateSector: 'Solar',
        country: 'USA',
        status: 'PROCESSED_AI',
        createdAt: '2024-01-01T00:00:00Z',
        formattedAmount: '$1M',
        allInvestors: ['Test VC', 'Another VC', 'Angel Investor'],
      });

      expect(result.formattedDate).toBe('Jan 1, 2024');
      expect(result.daysAgo).toBeGreaterThan(0);
    });

    it('should handle null values gracefully', () => {
      const dealWithNulls: DatabaseDeal = {
        ...mockDatabaseDeal,
        company_name: null as any,
        funding_stage: null,
        lead_investors: null,
        other_investors: null,
        climate_sub_sector: null,
        geography_country: null,
        amount_raised: null,
        date_announced: null,
      };

      const result = DashboardTransformer.transformSingleDeal(dealWithNulls);

      expect(result.companyName).toBe('Unknown Company');
      expect(result.fundingStage).toBe('Unknown');
      expect(result.leadInvestors).toEqual([]);
      expect(result.otherInvestors).toEqual([]);
      expect(result.climateSector).toBe('Unknown');
      expect(result.country).toBe('Unknown');
      expect(result.amountRaised).toBe(0);
      expect(result.dateAnnounced).toBe('2024-01-01T00:00:00Z'); // Falls back to created_at
    });

    it('should parse investor strings correctly', () => {
      const dealWithInvestors: DatabaseDeal = {
        ...mockDatabaseDeal,
        lead_investors: 'VC One, VC Two; VC Three',
        other_investors: 'Angel One,Angel Two,Angel Three',
      };

      const result = DashboardTransformer.transformSingleDeal(dealWithInvestors);

      expect(result.leadInvestors).toEqual(['VC One', 'VC Two', 'VC Three']);
      expect(result.otherInvestors).toEqual(['Angel One', 'Angel Two', 'Angel Three']);
      expect(result.allInvestors).toEqual([
        'VC One', 'VC Two', 'VC Three', 'Angel One', 'Angel Two', 'Angel Three'
      ]);
    });

    it('should normalize funding stages', () => {
      const testCases = [
        { input: 'seed', expected: 'Seed' },
        { input: 'pre-seed', expected: 'Pre-Seed' },
        { input: 'series a', expected: 'Series A' },
        { input: 'series-b', expected: 'Series B' },
        { input: 'seriesc', expected: 'Series C' },
        { input: 'series d', expected: 'Series D+' },
        { input: 'bridge', expected: 'Bridge' },
        { input: 'unknown stage', expected: 'Unknown Stage' },
      ];

      testCases.forEach(({ input, expected }) => {
        const deal: DatabaseDeal = { ...mockDatabaseDeal, funding_stage: input };
        const result = DashboardTransformer.transformSingleDeal(deal);
        expect(result.fundingStage).toBe(expected);
      });
    });
  });

  describe('transformDealsForDisplay', () => {
    it('should transform multiple deals', () => {
      const result = DashboardTransformer.transformDealsForDisplay(mockDatabaseDeals);

      expect(result).toHaveLength(3);
      expect(result[0].companyName).toBe('Test Company');
      expect(result[1].companyName).toBe('Another Company');
      expect(result[2].companyName).toBe('Third Company');
    });

    it('should handle empty array', () => {
      const result = DashboardTransformer.transformDealsForDisplay([]);
      expect(result).toEqual([]);
    });
  });

  describe('calculateMetrics', () => {
    it('should calculate comprehensive dashboard metrics', () => {
      const result = DashboardTransformer.calculateMetrics(mockDatabaseDeals);

      expect(result.totalDeals).toBe(3);
      expect(result.totalFunding).toBe(3500000); // 1M + 2M + 0.5M
      expect(result.totalCompanies).toBe(3);
      expect(result.averageDealSize).toBe(3500000 / 3);
      expect(result.topSectors).toHaveLength(2); // Solar and Wind
      expect(result.topCountries).toHaveLength(2); // USA and Germany
    });

    it('should calculate unique companies correctly', () => {
      const dealsWithDuplicates: DatabaseDeal[] = [
        mockDatabaseDeal,
        { ...mockDatabaseDeal, id: 2, amount_raised: 2000000 }, // Same company
        { ...mockDatabaseDeal, id: 3, company_name: 'Different Company' },
      ];

      const result = DashboardTransformer.calculateMetrics(dealsWithDuplicates);

      expect(result.totalDeals).toBe(3);
      expect(result.totalCompanies).toBe(2); // Only 2 unique companies
    });

    it('should calculate unique investors correctly', () => {
      const result = DashboardTransformer.calculateMetrics(mockDatabaseDeals);

      // Should count unique investors across all deals
      expect(result.totalInvestors).toBeGreaterThan(0);
    });

    it('should handle empty deals array', () => {
      const result = DashboardTransformer.calculateMetrics([]);

      expect(result.totalDeals).toBe(0);
      expect(result.totalFunding).toBe(0);
      expect(result.totalCompanies).toBe(0);
      expect(result.totalInvestors).toBe(0);
      expect(result.averageDealSize).toBe(0);
      expect(result.growthRate).toBe(0);
      expect(result.topSectors).toEqual([]);
      expect(result.topCountries).toEqual([]);
    });

    it('should calculate top sectors correctly', () => {
      const result = DashboardTransformer.calculateMetrics(mockDatabaseDeals);

      expect(result.topSectors).toHaveLength(2);
      
      // Solar should be first (2 deals)
      const solarSector = result.topSectors.find(s => s.sector === 'Solar');
      expect(solarSector).toBeDefined();
      expect(solarSector?.dealCount).toBe(2);
      expect(solarSector?.totalFunding).toBe(1500000); // 1M + 0.5M
      expect(solarSector?.percentage).toBeCloseTo(66.67, 1); // 2/3 * 100

      // Wind should be second (1 deal)
      const windSector = result.topSectors.find(s => s.sector === 'Wind');
      expect(windSector).toBeDefined();
      expect(windSector?.dealCount).toBe(1);
      expect(windSector?.totalFunding).toBe(2000000);
      expect(windSector?.percentage).toBeCloseTo(33.33, 1); // 1/3 * 100
    });

    it('should calculate top countries correctly', () => {
      const result = DashboardTransformer.calculateMetrics(mockDatabaseDeals);

      expect(result.topCountries).toHaveLength(2);
      
      // USA should be first (2 deals)
      const usaCountry = result.topCountries.find(c => c.country === 'USA');
      expect(usaCountry).toBeDefined();
      expect(usaCountry?.dealCount).toBe(2);
      expect(usaCountry?.totalFunding).toBe(1500000); // 1M + 0.5M

      // Germany should be second (1 deal)
      const germanyCountry = result.topCountries.find(c => c.country === 'Germany');
      expect(germanyCountry).toBeDefined();
      expect(germanyCountry?.dealCount).toBe(1);
      expect(germanyCountry?.totalFunding).toBe(2000000);
    });

    it('should calculate growth rate', () => {
      // Create deals with different dates to test growth calculation
      const now = new Date();
      const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
      const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);

      const dealsWithDates: DatabaseDeal[] = [
        { ...mockDatabaseDeal, id: 1, date_announced: twentyDaysAgo.toISOString().split('T')[0] },
        { ...mockDatabaseDeal, id: 2, date_announced: twentyDaysAgo.toISOString().split('T')[0] },
        { ...mockDatabaseDeal, id: 3, date_announced: fortyDaysAgo.toISOString().split('T')[0] },
      ];

      const result = DashboardTransformer.calculateMetrics(dealsWithDates);

      // Should calculate growth rate based on recent vs previous period
      expect(typeof result.growthRate).toBe('number');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with compact notation by default', () => {
      expect(DashboardTransformer.formatCurrency(0)).toBe('$0');
      expect(DashboardTransformer.formatCurrency(500)).toBe('$500'); // Less than 1000, uses Intl.NumberFormat
      expect(DashboardTransformer.formatCurrency(1000)).toBe('1K');
      expect(DashboardTransformer.formatCurrency(1500)).toBe('1.5K');
      expect(DashboardTransformer.formatCurrency(1000000)).toBe('1M');
      expect(DashboardTransformer.formatCurrency(1500000)).toBe('1.5M');
      expect(DashboardTransformer.formatCurrency(1000000000)).toBe('1B');
      expect(DashboardTransformer.formatCurrency(1500000000)).toBe('1.5B');
    });

    it('should format currency without compact notation when disabled', () => {
      expect(DashboardTransformer.formatCurrency(1000, { compact: false })).toBe('$1,000');
      expect(DashboardTransformer.formatCurrency(1000000, { compact: false })).toBe('$1,000,000');
    });

    it('should show cents when requested', () => {
      expect(DashboardTransformer.formatCurrency(1000.50, { compact: false, showCents: true })).toBe('$1,000.50');
    });

    it('should handle different currencies', () => {
      expect(DashboardTransformer.formatCurrency(1000, { compact: false, currency: 'EUR' })).toBe('€1,000');
    });
  });

  describe('formatDate', () => {
    const testDate = '2024-01-15T10:30:00Z';

    it('should format date in short format by default', () => {
      const result = DashboardTransformer.formatDate(testDate);
      expect(result).toBe('Jan 15, 2024');
    });

    it('should format date in medium format', () => {
      const result = DashboardTransformer.formatDate(testDate, 'medium');
      expect(result).toBe('January 15, 2024');
    });

    it('should format date in long format', () => {
      const result = DashboardTransformer.formatDate(testDate, 'long');
      expect(result).toBe('Monday, January 15, 2024');
    });

    it('should format relative dates', () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

      expect(DashboardTransformer.formatDate(today.toISOString(), 'relative')).toBe('Today');
      expect(DashboardTransformer.formatDate(yesterday.toISOString(), 'relative')).toBe('Yesterday');
      expect(DashboardTransformer.formatDate(twoDaysAgo.toISOString(), 'relative')).toBe('2 days ago');
    });

    it('should handle invalid dates', () => {
      const result = DashboardTransformer.formatDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });
  });

  describe('formatRelativeDate', () => {
    it('should format relative dates correctly', () => {
      const now = new Date();
      const today = new Date(now);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      expect(DashboardTransformer.formatRelativeDate(today)).toBe('Today');
      expect(DashboardTransformer.formatRelativeDate(yesterday)).toBe('Yesterday');
      expect(DashboardTransformer.formatRelativeDate(twoDaysAgo)).toBe('2 days ago');
      expect(DashboardTransformer.formatRelativeDate(oneWeekAgo)).toBe('1 week ago');
      expect(DashboardTransformer.formatRelativeDate(twoWeeksAgo)).toBe('2 weeks ago');
      expect(DashboardTransformer.formatRelativeDate(oneMonthAgo)).toBe('1 month ago');
      expect(DashboardTransformer.formatRelativeDate(twoMonthsAgo)).toBe('2 months ago');
      expect(DashboardTransformer.formatRelativeDate(oneYearAgo)).toBe('1 year ago');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(DashboardTransformer.formatPercentage(25, 100)).toBe('25.0%');
      expect(DashboardTransformer.formatPercentage(33, 100, 2)).toBe('33.00%');
      expect(DashboardTransformer.formatPercentage(1, 3, 1)).toBe('33.3%');
    });

    it('should handle zero total', () => {
      expect(DashboardTransformer.formatPercentage(10, 0)).toBe('0%');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with compact notation by default', () => {
      expect(DashboardTransformer.formatNumber(1000)).toBe('1K');
      expect(DashboardTransformer.formatNumber(1000000)).toBe('1M');
      expect(DashboardTransformer.formatNumber(1000000000)).toBe('1B');
    });

    it('should format numbers without compact notation when disabled', () => {
      expect(DashboardTransformer.formatNumber(1000, false)).toBe('1,000');
      expect(DashboardTransformer.formatNumber(1000000, false)).toBe('1,000,000');
    });
  });

  describe('normalizeFundingStage', () => {
    it('should normalize common funding stages', () => {
      const testCases = [
        { input: 'seed', expected: 'Seed' },
        { input: 'pre-seed', expected: 'Pre-Seed' },
        { input: 'preseed', expected: 'Pre-Seed' },
        { input: 'series a', expected: 'Series A' },
        { input: 'series-a', expected: 'Series A' },
        { input: 'seriesa', expected: 'Series A' },
        { input: 'series b', expected: 'Series B' },
        { input: 'series c', expected: 'Series C' },
        { input: 'series d', expected: 'Series D+' },
        { input: 'series e', expected: 'Series D+' },
        { input: 'bridge', expected: 'Bridge' },
        { input: 'convertible', expected: 'Convertible' },
        { input: 'debt', expected: 'Debt' },
        { input: 'grant', expected: 'Grant' },
        { input: 'ipo', expected: 'IPO' },
        { input: 'acquisition', expected: 'Acquisition' },
        { input: 'merger', expected: 'Merger' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(DashboardTransformer.normalizeFundingStage(input)).toBe(expected);
      });
    });

    it('should handle null and unknown stages', () => {
      expect(DashboardTransformer.normalizeFundingStage(null)).toBe('Unknown');
      expect(DashboardTransformer.normalizeFundingStage('unknown stage')).toBe('Unknown Stage');
    });

    it('should capitalize unknown stages', () => {
      expect(DashboardTransformer.normalizeFundingStage('custom round')).toBe('Custom Round');
    });
  });
});