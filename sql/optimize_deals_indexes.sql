-- Database optimization indexes for deals table
-- This script adds indexes for commonly queried fields to improve performance

-- Drop existing indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS idx_deals_date_announced;
DROP INDEX IF EXISTS idx_deals_funding_stage;
DROP INDEX IF EXISTS idx_deals_climate_sub_sector;
DROP INDEX IF EXISTS idx_deals_geography_country;
DROP INDEX IF EXISTS idx_deals_amount_raised;
DROP INDEX IF EXISTS idx_deals_status_date;
DROP INDEX IF EXISTS idx_deals_composite_filters;

-- Primary performance indexes for commonly queried fields
CREATE INDEX idx_deals_date_announced ON public.deals(date_announced DESC NULLS LAST);
CREATE INDEX idx_deals_funding_stage ON public.deals(funding_stage) WHERE funding_stage IS NOT NULL;
CREATE INDEX idx_deals_climate_sub_sector ON public.deals(climate_sub_sector) WHERE climate_sub_sector IS NOT NULL;
CREATE INDEX idx_deals_geography_country ON public.deals(geography_country) WHERE geography_country IS NOT NULL;
CREATE INDEX idx_deals_amount_raised ON public.deals(amount_raised DESC NULLS LAST) WHERE amount_raised IS NOT NULL;

-- Composite index for status + date queries (most common dashboard query pattern)
CREATE INDEX idx_deals_status_date ON public.deals(status, date_announced DESC NULLS LAST);

-- Composite index for filtering operations (covers multiple filter combinations)
CREATE INDEX idx_deals_composite_filters ON public.deals(status, funding_stage, climate_sub_sector, geography_country, date_announced DESC NULLS LAST);

-- Index for full-text search on company names (if needed for search functionality)
CREATE INDEX idx_deals_company_name_text ON public.deals USING gin(to_tsvector('english', company_name));

-- Analyze table to update statistics for query planner
ANALYZE public.deals;