-- Performance indexes for deals_new and related tables
-- Optimized for Alex's real-time alert system and dashboard queries

-- =============================================================================
-- DEALS_NEW TABLE INDEXES
-- =============================================================================

-- Primary indexes for deals_new table
CREATE INDEX IF NOT EXISTS idx_deals_new_company_id ON public.deals_new(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_new_date_announced ON public.deals_new(date_announced DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_deals_new_created_at ON public.deals_new(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_new_status ON public.deals_new(status);
CREATE INDEX IF NOT EXISTS idx_deals_new_alex_review_status ON public.deals_new(alex_review_status);

-- Investment score indexes (critical for Alex's alerts)
CREATE INDEX IF NOT EXISTS idx_deals_new_investment_score ON public.deals_new(investment_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_deals_new_investment_score_status ON public.deals_new(investment_score DESC, status) WHERE investment_score IS NOT NULL;

-- Real-time alert optimization - hot path index
CREATE INDEX IF NOT EXISTS idx_deals_new_alerts_hot ON public.deals_new(
    investment_score DESC, 
    created_at DESC
) WHERE status = 'new' AND investment_score >= 60;

-- Alex's review workflow index
CREATE INDEX IF NOT EXISTS idx_deals_new_alex_pending ON public.deals_new(
    investment_score DESC,
    date_announced DESC
) WHERE alex_review_status = 'pending';

-- Funding stage and amount indexes
CREATE INDEX IF NOT EXISTS idx_deals_new_funding_stage ON public.deals_new(funding_stage);
CREATE INDEX IF NOT EXISTS idx_deals_new_amount_raised ON public.deals_new(amount_raised_usd DESC NULLS LAST) WHERE amount_raised_usd IS NOT NULL;

-- Source tracking indexes
CREATE INDEX IF NOT EXISTS idx_deals_new_source_name ON public.deals_new(source_name);
CREATE INDEX IF NOT EXISTS idx_deals_new_source_type ON public.deals_new(source_type);
CREATE INDEX IF NOT EXISTS idx_deals_new_source_url ON public.deals_new USING hash(source_url); -- For exact lookups

-- Composite index for filtering and sorting
CREATE INDEX IF NOT EXISTS idx_deals_new_filter_sort ON public.deals_new(
    status,
    investment_score DESC,
    date_announced DESC
) WHERE status IN ('new', 'processed');

-- =============================================================================
-- COMPANIES TABLE INDEXES
-- =============================================================================

-- Primary company indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON public.companies(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_climate_tech ON public.companies(is_climate_tech);
CREATE INDEX IF NOT EXISTS idx_companies_ai_focus ON public.companies(has_ai_focus);
CREATE INDEX IF NOT EXISTS idx_companies_country ON public.companies(headquarters_country);
CREATE INDEX IF NOT EXISTS idx_companies_verification_status ON public.companies(verification_status);
CREATE INDEX IF NOT EXISTS idx_companies_enrichment_status ON public.companies(enrichment_status);

-- Climate sector index (using GIN for array searches)
CREATE INDEX IF NOT EXISTS idx_companies_climate_sectors ON public.companies USING GIN(climate_sub_sectors);

-- Alex's filtering indexes
CREATE INDEX IF NOT EXISTS idx_companies_alex_filters ON public.companies(
    is_climate_tech,
    has_ai_focus,
    headquarters_country
) WHERE is_climate_tech = true;

-- =============================================================================
-- INVESTORS TABLE INDEXES
-- =============================================================================

-- Primary investor indexes
CREATE INDEX IF NOT EXISTS idx_investors_name ON public.investors(name);
CREATE INDEX IF NOT EXISTS idx_investors_type ON public.investors(type);
CREATE INDEX IF NOT EXISTS idx_investors_climate_focus ON public.investors(climate_focus);
CREATE INDEX IF NOT EXISTS idx_investors_check_size_min ON public.investors(typical_check_size_min) WHERE typical_check_size_min IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_investors_check_size_max ON public.investors(typical_check_size_max) WHERE typical_check_size_max IS NOT NULL;

-- Geographic focus index (using GIN for array searches)
CREATE INDEX IF NOT EXISTS idx_investors_geographic_focus ON public.investors USING GIN(geographic_focus);

-- =============================================================================
-- DEAL_INVESTORS TABLE INDEXES
-- =============================================================================

-- Primary relationship indexes
CREATE INDEX IF NOT EXISTS idx_deal_investors_deal_id ON public.deal_investors(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_investors_investor_id ON public.deal_investors(investor_id);
CREATE INDEX IF NOT EXISTS idx_deal_investors_role ON public.deal_investors(role);

-- Lead investor lookup optimization
CREATE INDEX IF NOT EXISTS idx_deal_investors_leads ON public.deal_investors(deal_id) WHERE role = 'lead';

-- =============================================================================
-- ALEX'S TABLES INDEXES
-- =============================================================================

-- Alex filter settings indexes
CREATE INDEX IF NOT EXISTS idx_alex_filter_settings_name ON public.alex_filter_settings(setting_name);
CREATE INDEX IF NOT EXISTS idx_alex_filter_settings_enabled ON public.alex_filter_settings(is_enabled) WHERE is_enabled = true;

-- Alex deal views indexes
CREATE INDEX IF NOT EXISTS idx_alex_deal_views_active ON public.alex_deal_views(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alex_deal_views_name ON public.alex_deal_views(view_name);

-- =============================================================================
-- DATA SOURCES AND ENRICHMENT INDEXES
-- =============================================================================

-- Data sources indexes
CREATE INDEX IF NOT EXISTS idx_data_sources_name ON public.data_sources(name);
CREATE INDEX IF NOT EXISTS idx_data_sources_type ON public.data_sources(type);
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON public.data_sources(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_data_sources_reliability ON public.data_sources(reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_data_sources_last_scraped ON public.data_sources(last_scraped_at DESC NULLS LAST);

-- Enrichment queue indexes
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_company_id ON public.enrichment_queue(company_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status ON public.enrichment_queue(status);
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_priority ON public.enrichment_queue(priority DESC, created_at ASC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_type ON public.enrichment_queue(enrichment_type);

-- =============================================================================
-- SPECIALIZED COMPOSITE INDEXES FOR COMMON QUERIES
-- =============================================================================

-- Alex's daily prospects view optimization
CREATE INDEX IF NOT EXISTS idx_alex_daily_prospects ON public.deals_new(
    investment_score DESC,
    created_at DESC
) WHERE alex_review_status = 'pending' AND investment_score >= 60;

-- Real-time notification index
CREATE INDEX IF NOT EXISTS idx_deals_new_realtime_alerts ON public.deals_new(
    created_at DESC,
    investment_score DESC
) WHERE status = 'new' AND investment_score >= 50;

-- Dashboard metrics optimization
CREATE INDEX IF NOT EXISTS idx_deals_new_metrics ON public.deals_new(
    created_at DESC,
    amount_raised_usd
) WHERE amount_raised_usd IS NOT NULL;

-- Weekly performance tracking
CREATE INDEX IF NOT EXISTS idx_deals_new_weekly ON public.deals_new(
    created_at DESC
) WHERE created_at >= (CURRENT_DATE - INTERVAL '7 days');

-- =============================================================================
-- PARTIAL INDEXES FOR MEMORY EFFICIENCY
-- =============================================================================

-- High-value deals only
CREATE INDEX IF NOT EXISTS idx_deals_new_high_value ON public.deals_new(
    amount_raised_usd DESC,
    investment_score DESC
) WHERE amount_raised_usd >= 1000000; -- Deals >= $1M

-- AI-focused companies only
CREATE INDEX IF NOT EXISTS idx_deals_new_ai_focus ON public.deals_new(
    created_at DESC,
    investment_score DESC
) WHERE EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.id = deals_new.company_id 
    AND c.has_ai_focus = true
);

-- US/Canada/UK deals only (Alex's geographic preference)
CREATE INDEX IF NOT EXISTS idx_deals_new_target_geo ON public.deals_new(
    created_at DESC,
    investment_score DESC
) WHERE EXISTS (
    SELECT 1 FROM companies c 
    WHERE c.id = deals_new.company_id 
    AND c.headquarters_country IN ('United States', 'Canada', 'United Kingdom')
);

-- =============================================================================
-- INDEX USAGE COMMENTS
-- =============================================================================

COMMENT ON INDEX idx_deals_new_alerts_hot IS 'Critical index for real-time alert system performance';
COMMENT ON INDEX idx_deals_new_alex_pending IS 'Optimizes Alex''s pending review dashboard';
COMMENT ON INDEX idx_alex_daily_prospects IS 'Supports Alex''s daily prospects view';
COMMENT ON INDEX idx_deals_new_realtime_alerts IS 'Real-time notification system optimization';
COMMENT ON INDEX idx_companies_climate_sectors IS 'Enables fast climate sector filtering using GIN index';
COMMENT ON INDEX idx_investors_geographic_focus IS 'Supports investor geographic filtering';

-- =============================================================================
-- INDEX STATISTICS
-- =============================================================================

-- Analyze tables for query planner optimization
ANALYZE public.deals_new;
ANALYZE public.companies;
ANALYZE public.investors;
ANALYZE public.deal_investors;
ANALYZE public.alex_filter_settings;
ANALYZE public.alex_deal_views;
ANALYZE public.data_sources;
ANALYZE public.enrichment_queue;
