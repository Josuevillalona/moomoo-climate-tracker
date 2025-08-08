-- Database optimization indexes for deals table
-- This script adds indexes for commonly queried fields to improve performance
-- Run this script against your Supabase database to apply optimizations

-- Drop existing indexes if they exist (to avoid conflicts)
DROP INDEX IF EXISTS idx_deals_date_announced;
DROP INDEX IF EXISTS idx_deals_funding_stage;
DROP INDEX IF EXISTS idx_deals_climate_sub_sector;
DROP INDEX IF EXISTS idx_deals_geography_country;
DROP INDEX IF EXISTS idx_deals_amount_raised;
DROP INDEX IF EXISTS idx_deals_status_date;
DROP INDEX IF EXISTS idx_deals_composite_filters;
DROP INDEX IF EXISTS idx_deals_company_name_text;
DROP INDEX IF EXISTS idx_deals_created_at;
DROP INDEX IF EXISTS idx_deals_pagination;

-- Primary performance indexes for commonly queried fields
-- Date index for recent deals and date range queries
CREATE INDEX idx_deals_date_announced ON public.deals(date_announced DESC NULLS LAST) 
WHERE date_announced IS NOT NULL;

-- Categorical indexes for filtering
CREATE INDEX idx_deals_funding_stage ON public.deals(funding_stage) 
WHERE funding_stage IS NOT NULL;

CREATE INDEX idx_deals_climate_sub_sector ON public.deals(climate_sub_sector) 
WHERE climate_sub_sector IS NOT NULL;

CREATE INDEX idx_deals_geography_country ON public.deals(geography_country) 
WHERE geography_country IS NOT NULL;

-- Amount index for range queries and sorting
CREATE INDEX idx_deals_amount_raised ON public.deals(amount_raised DESC NULLS LAST) 
WHERE amount_raised IS NOT NULL;

-- Created at index for fallback sorting
CREATE INDEX idx_deals_created_at ON public.deals(created_at DESC);

-- Composite indexes for common query patterns
-- Status + date for dashboard queries (most selective first)
CREATE INDEX idx_deals_status_date ON public.deals(status, date_announced DESC NULLS LAST)
WHERE date_announced IS NOT NULL;

-- Comprehensive composite index for complex filtering
-- Order: most selective to least selective for optimal performance
CREATE INDEX idx_deals_composite_filters ON public.deals(
  status, 
  funding_stage, 
  climate_sub_sector, 
  geography_country, 
  date_announced DESC NULLS LAST
) WHERE date_announced IS NOT NULL;

-- Pagination optimization index (id + date for cursor-based pagination)
CREATE INDEX idx_deals_pagination ON public.deals(id, date_announced DESC NULLS LAST)
WHERE date_announced IS NOT NULL;

-- Full-text search index on company names
CREATE INDEX idx_deals_company_name_text ON public.deals 
USING gin(to_tsvector('english', company_name))
WHERE company_name IS NOT NULL;

-- Partial index for active/processed deals only (reduces index size)
CREATE INDEX idx_deals_active_status ON public.deals(date_announced DESC NULLS LAST, amount_raised DESC NULLS LAST)
WHERE status IN ('PROCESSED_AI', 'VERIFIED', 'PUBLISHED');

-- Update table statistics for query planner optimization
ANALYZE public.deals;

-- Display index information for verification
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'deals' 
ORDER BY indexname;