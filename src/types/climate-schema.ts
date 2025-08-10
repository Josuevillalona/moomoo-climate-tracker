// TypeScript types matching Alex's Climate Tech VC Pipeline Schema

export interface Company {
  id: string;
  name: string;
  website?: string;
  domain?: string;
  description?: string;
  founding_year?: number;
  employee_count_range?: string;
  employee_count_estimated?: number;
  headquarters_city?: string;
  headquarters_state?: string;
  headquarters_country?: string;
  is_climate_tech: boolean;
  has_ai_focus: boolean;
  climate_sub_sectors?: string[];
  target_markets?: string[];
  verification_status: 'verified' | 'unverified' | 'pending';
  legal_name?: string;
  incorporation_date?: string;
  enrichment_status: 'pending' | 'basic' | 'complete';
  data_sources?: string[];
  confidence_score: number;
  media_mentions: number;
  last_enriched_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  company_id: string;
  amount_raised_usd?: number;
  original_amount?: string;
  original_currency: string;
  funding_stage?: string;
  date_announced?: string;
  source_url: string;
  source_type: string;
  source_name: string;
  raw_text_content?: string;
  confidence_score: number;
  investment_score?: number;
  alex_review_status: 'pending' | 'interested' | 'passed' | 'auto_filtered';
  alex_notes?: string;
  alex_review_date?: string;
  status: 'new' | 'processed' | 'enriched';
  created_at: string;
  updated_at: string;
  // Joined company data
  company?: Company;
}

export interface Investor {
  id: string;
  name: string;
  type?: 'vc' | 'angel' | 'corporate_vc' | 'family_office';
  website?: string;
  climate_focus: boolean;
  geographic_focus?: string[];
  typical_check_size_min?: number;
  typical_check_size_max?: number;
  portfolio_count: number;
  enrichment_status: 'pending' | 'basic' | 'complete';
  created_at: string;
  updated_at: string;
}

export interface DealInvestor {
  id: string;
  deal_id: string;
  investor_id: string;
  role: 'lead' | 'participant' | 'unknown';
  amount_invested?: number;
  created_at: string;
  // Joined data
  investor?: Investor;
}

export interface AlexFilterSettings {
  id: string;
  setting_name: string;
  is_enabled: boolean;
  filter_values: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AlexDealView {
  id: string;
  view_name: string;
  filter_criteria: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'news' | 'vc_portfolio' | 'government';
  url?: string;
  is_active: boolean;
  reliability_score: number;
  last_scraped_at?: string;
  last_successful_scrape?: string;
  error_count: number;
  last_error_at?: string;
  last_error_message?: string;
  created_at: string;
  updated_at: string;
}

// Enhanced view types that combine multiple tables
export interface EnhancedDeal extends Deal {
  company: Company;
  investors: DealInvestor[];
  calculated_score?: number;
  relevance_score?: number;
  ai_signals?: AISignal[];
  market_signals?: MarketSignal[];
}

export interface AISignal {
  type: 'ai_mention' | 'ml_capability' | 'automation' | 'intelligence';
  confidence: number;
  source: string;
  description: string;
  extracted_at: string;
}

export interface MarketSignal {
  type: 'market_expansion' | 'product_launch' | 'partnership' | 'acquisition';
  confidence: number;
  impact_score: number;
  description: string;
  source: string;
}

// Alex's Dashboard Specific Types
export interface AlexDashboardMetrics {
  total_deals: number;
  deals_this_week: number;
  deals_requiring_review: number;
  high_score_deals: number;
  total_funding_usd: number;
  average_deal_size: number;
  top_ai_sectors: SectorBreakdown[];
  top_funding_stages: StageBreakdown[];
  geographic_distribution: GeographicBreakdown[];
  pipeline_health: PipelineHealth;
}

export interface SectorBreakdown {
  sector: string;
  deal_count: number;
  total_funding: number;
  avg_investment_score: number;
  percentage: number;
}

export interface StageBreakdown {
  stage: string;
  deal_count: number;
  total_funding: number;
  avg_deal_size: number;
  percentage: number;
}

export interface GeographicBreakdown {
  country: string;
  deal_count: number;
  total_funding: number;
  avg_investment_score: number;
  percentage: number;
}

export interface PipelineHealth {
  active_sources: number;
  total_sources: number;
  avg_reliability_score: number;
  last_update: string;
  deals_added_24h: number;
  error_rate: number;
}

// Filter and Search Types
export interface AlexDealFilters {
  investment_score_min?: number;
  alex_review_status?: Array<'pending' | 'interested' | 'passed' | 'auto_filtered'>;
  funding_stages?: string[];
  climate_sectors?: string[];
  has_ai_focus?: boolean;
  countries?: string[];
  funding_range?: {
    min?: number;
    max?: number;
  };
  date_range?: {
    start?: string;
    end?: string;
  };
  confidence_score_min?: number;
  data_sources?: string[];
}

export interface DealSearchResult {
  deals: EnhancedDeal[];
  total_count: number;
  filtered_count: number;
  filters_applied: AlexDealFilters;
  page: number;
  page_size: number;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  metadata?: {
    total_count?: number;
    page?: number;
    page_size?: number;
    filters_applied?: any;
  };
}

// Real-time subscription types
export interface RealtimeUpdate {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: any;
  old?: any;
  errors?: string[];
}

// Widget Configuration Types
export interface WidgetConfig {
  id: string;
  type: 'deals' | 'metrics' | 'pipeline' | 'companies' | 'investors';
  title: string;
  size: 'small' | 'medium' | 'large';
  refresh_interval: number;
  filters: Record<string, any>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface DashboardConfig {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  layout: 'grid' | 'list' | 'custom';
  auto_refresh: boolean;
  created_at: string;
  updated_at: string;
}
