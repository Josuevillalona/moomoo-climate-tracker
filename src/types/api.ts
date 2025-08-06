// Database types matching the actual deals table schema
export interface DatabaseDeal {
  id: number;
  created_at: string;
  company_name: string;
  amount_raised: number | null;
  currency: string;
  funding_stage: string | null;
  date_announced: string | null;
  lead_investors: string | null;
  other_investors: string | null;
  climate_sub_sector: string | null;
  geography_country: string | null;
  source_url: string | null;
  raw_text_content: string | null;
  status: string;
  funding_amount_str: string | null;
}

// Transformed deal interface for UI display
export interface FundingDeal {
  id: number;
  companyName: string;
  fundingStage: string;
  amountRaised: number;
  dateAnnounced: string;
  leadInvestors: string[];
  otherInvestors: string[];
  climateSector: string;
  country: string;
  status: string;
  createdAt: string;
  // Computed fields for display
  formattedAmount: string;
  formattedDate: string;
  daysAgo: number;
  allInvestors: string[];
}

// Dashboard metrics interface
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

// Supporting metric interfaces
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

// API response wrapper types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Filter interfaces for API queries
export interface DealFilters {
  fundingStage?: string[];
  climateSector?: string[];
  country?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  status?: string[];
  limit?: number;
  offset?: number;
}

// Pagination interface
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Real-time subscription types
export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  errors: string[] | null;
}

export interface SubscriptionOptions {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  table?: string;
  filter?: string;
}

// API service method return types
export type DashboardMetricsResponse = ApiResponse<DashboardMetrics>;
export type RecentDealsResponse = ApiResponse<FundingDeal[]>;
export type PaginatedDealsResponse = ApiResponse<PaginatedResponse<FundingDeal>>;
export type DealResponse = ApiResponse<FundingDeal>;

// Error types for specific error handling
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR'
}

export class ApiException extends Error {
  constructor(
    public type: ApiErrorType,
    message: string,
    public retryable: boolean = true,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiException';
  }
}