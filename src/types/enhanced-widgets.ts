// Enhanced TypeScript interfaces for dashboard widget enhancements

import { FundingDeal } from './api';

// Enhanced Funding Deal Types
export interface EnhancedFundingDeal extends FundingDeal {
  signals: DealSignal[];
  relevanceScore: number;
  matchedFilters: string[];
  isNew: boolean;
  highlightUntil?: Date;
}

export interface DealSignal {
  type: 'growth_indicator' | 'market_expansion' | 'technology_advancement';
  description: string;
  confidence: number;
  source: string;
}

export interface FundingFilters {
  stages: FundingStage[];
  sectors: string[];
  fundingRange: {
    min: number;
    max: number;
  };
  dateRange: {
    start: Date;
    end: Date;
  };
  keywords: string[];
}

export interface FundingStage {
  id: string;
  name: 'Seed' | 'Series A' | 'Series B' | 'Series C+';
  selected: boolean;
}

// Enhanced News Article Types
export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  source: string;
  publishedAt: Date;
  relevanceScore: number;
  signals: NewsSignal[];
  relatedCompanies: string[];
  category: NewsCategory;
  url: string;
  imageUrl?: string;
}

export interface NewsSignal {
  type: 'funding' | 'product_launch' | 'patent' | 'partnership' | 'acquisition';
  confidence: number;
  extractedData: Record<string, any>;
}

export enum NewsCategory {
  FUNDING = 'funding',
  PRODUCT = 'product',
  MARKET = 'market',
  REGULATORY = 'regulatory',
  PARTNERSHIP = 'partnership'
}

export interface NewsFilters {
  categories: NewsCategory[];
  signalTypes: NewsSignal['type'][];
  relevanceThreshold: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  sources: string[];
  relatedToFundingFilters: boolean;
}

// User Preferences Types
export interface UserPreferences {
  id: string;
  userId: string;
  defaultFilters: {
    funding: FundingFilters;
    news: NewsFilters;
  };
  notificationSettings: NotificationSettings;
  dashboardLayout: DashboardLayout;
  reportTemplates: ReportTemplate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  fundingAlerts: boolean;
  newsAlerts: boolean;
  reportGeneration: boolean;
}

export interface DashboardLayout {
  widgetSizes: Record<string, 'normal' | 'expanded'>;
  widgetOrder: string[];
  gridColumns: number;
  customPositions?: Record<string, { x: number; y: number; w: number; h: number }>;
}

// Report Generation Types
export interface ReportConfig {
  title: string;
  sections: ReportSection[];
  format: 'pdf' | 'excel' | 'powerpoint';
  template: ReportTemplate;
  includeCharts: boolean;
  includeTables: boolean;
  customBranding: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface ReportSection {
  type: 'funding_rounds' | 'news_highlights' | 'market_signals' | 'executive_summary';
  title: string;
  data: any;
  chartType?: 'bar' | 'line' | 'pie' | 'table';
  includeInExport: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  styling: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logoUrl?: string;
  };
}

// Enhanced Widget Component Props
export interface EnhancedWidgetProps {
  title: string;
  size: 'normal' | 'expanded';
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
  children: React.ReactNode;
}

export interface EnhancedFundingRoundsProps {
  size: 'normal' | 'expanded';
  filters: FundingFilters;
  onFilterChange: (filters: FundingFilters) => void;
  realTimeEnabled: boolean;
  deals: EnhancedFundingDeal[];
  loading?: boolean;
  error?: Error | null;
}

export interface EnhancedNewsProps {
  filters: NewsFilters;
  relevanceThreshold: number;
  onArticleClick: (article: NewsArticle) => void;
  articles: NewsArticle[];
  loading?: boolean;
  error?: Error | null;
}

export interface ReportGeneratorProps {
  dashboardData: DashboardData;
  selectedFilters: FilterState;
  onGenerateReport: (config: ReportConfig) => void;
  loading?: boolean;
  error?: Error | null;
}

// Supporting Types
export interface DashboardData {
  fundingDeals: EnhancedFundingDeal[];
  newsArticles: NewsArticle[];
  metrics: DashboardMetrics;
  lastUpdated: Date;
}

export interface FilterState {
  funding: FundingFilters;
  news: NewsFilters;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface DashboardMetrics {
  totalDeals: number;
  totalFunding: number;
  totalCompanies: number;
  totalInvestors: number;
  growthRate: number;
  averageDealSize: number;
  topSectors: SectorMetric[];
  topCountries: CountryMetric[];
}

export interface SectorMetric {
  sector: string;
  dealCount: number;
  totalFunding: number;
  percentage: number;
}

export interface CountryMetric {
  country: string;
  dealCount: number;
  totalFunding: number;
  percentage: number;
}

// Error Handling Types
export interface WidgetError {
  type: 'network' | 'data' | 'permission' | 'unknown';
  message: string;
  retryable: boolean;
  timestamp: Date;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

// Real-time Update Types
export interface RealTimeUpdate {
  type: 'funding_deal' | 'news_article' | 'metric_update';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
}

export interface NotificationPayload {
  id: string;
  type: 'funding_alert' | 'news_alert' | 'report_ready';
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  read: boolean;
}