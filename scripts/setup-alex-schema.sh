#!/bin/bash

# Alex's Climate VC Pipeline Database Setup Script
# This script helps migrate from the simple deals table to the comprehensive schema

echo "🚀 Setting up Alex's Climate VC Pipeline Database Schema..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Run 'supabase init' first."
    exit 1
fi

echo "📋 Creating migration file..."

# Create the migration file with current timestamp
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_FILE="supabase/migrations/${TIMESTAMP}_alex_climate_vc_schema.sql"

# Copy the schema to the migration file
cat > "$MIGRATION_FILE" << 'EOF'
-- Alex's Climate Tech VC Pipeline - Database Schema Migration
-- This migration creates the complete normalized schema for Alex's dashboard

-- First, backup existing deals data if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deals') THEN
        -- Create backup table
        DROP TABLE IF EXISTS deals_backup;
        CREATE TABLE deals_backup AS SELECT * FROM deals;
        
        RAISE NOTICE 'Existing deals table backed up to deals_backup';
    END IF;
END $$;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Companies table - Normalized company information
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500),
    domain VARCHAR(255),
    description TEXT,
    founding_year INTEGER,
    employee_count_range VARCHAR(50),
    employee_count_estimated INTEGER,
    headquarters_city VARCHAR(100),
    headquarters_state VARCHAR(100),
    headquarters_country VARCHAR(100),
    is_climate_tech BOOLEAN DEFAULT true,
    has_ai_focus BOOLEAN DEFAULT false,
    climate_sub_sectors TEXT[],
    target_markets TEXT[],
    verification_status VARCHAR(20) DEFAULT 'pending',
    legal_name VARCHAR(255),
    incorporation_date DATE,
    enrichment_status VARCHAR(20) DEFAULT 'pending',
    data_sources TEXT[],
    confidence_score FLOAT DEFAULT 0.5,
    media_mentions INTEGER DEFAULT 0,
    last_enriched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rename existing deals table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deals') THEN
        ALTER TABLE deals RENAME TO deals_old;
        RAISE NOTICE 'Existing deals table renamed to deals_old';
    END IF;
END $$;

-- New deals table with proper schema
CREATE TABLE deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    amount_raised_usd NUMERIC(15,2),
    original_amount VARCHAR(100),
    original_currency VARCHAR(10) DEFAULT 'USD',
    funding_stage VARCHAR(50),
    date_announced DATE,
    source_url VARCHAR(1000) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    raw_text_content TEXT,
    confidence_score FLOAT DEFAULT 0.5,
    investment_score INTEGER,
    alex_review_status VARCHAR(20) DEFAULT 'pending',
    alex_notes TEXT,
    alex_review_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investors table
CREATE TABLE IF NOT EXISTS investors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    website VARCHAR(500),
    climate_focus BOOLEAN DEFAULT false,
    geographic_focus TEXT[],
    typical_check_size_min NUMERIC(15,2),
    typical_check_size_max NUMERIC(15,2),
    portfolio_count INTEGER DEFAULT 0,
    enrichment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal-Investor relationships
CREATE TABLE IF NOT EXISTS deal_investors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'unknown',
    amount_invested NUMERIC(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(deal_id, investor_id)
);

-- Alex's filter settings
CREATE TABLE IF NOT EXISTS alex_filter_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_name VARCHAR(50) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT true,
    filter_values JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alex's saved deal views
CREATE TABLE IF NOT EXISTS alex_deal_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    view_name VARCHAR(100) NOT NULL,
    filter_criteria JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrichment queue
CREATE TABLE IF NOT EXISTS enrichment_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    enrichment_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 5,
    attempts INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data sources tracking
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    url VARCHAR(1000),
    is_active BOOLEAN DEFAULT true,
    reliability_score FLOAT DEFAULT 1.0,
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    last_successful_scrape TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    last_error_at TIMESTAMP WITH TIME ZONE,
    last_error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_domain ON companies(domain);
CREATE INDEX IF NOT EXISTS idx_companies_climate_tech ON companies(is_climate_tech);
CREATE INDEX IF NOT EXISTS idx_companies_ai_focus ON companies(has_ai_focus);
CREATE INDEX IF NOT EXISTS idx_companies_country ON companies(headquarters_country);
CREATE INDEX IF NOT EXISTS idx_companies_enrichment_status ON companies(enrichment_status);

-- Deals indexes
CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id);
CREATE INDEX IF NOT EXISTS idx_deals_source_url ON deals(source_url);
CREATE INDEX IF NOT EXISTS idx_deals_funding_stage ON deals(funding_stage);
CREATE INDEX IF NOT EXISTS idx_deals_date_announced ON deals(date_announced);
CREATE INDEX IF NOT EXISTS idx_deals_investment_score ON deals(investment_score);
CREATE INDEX IF NOT EXISTS idx_deals_alex_review_status ON deals(alex_review_status);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);

-- Other indexes
CREATE INDEX IF NOT EXISTS idx_investors_name ON investors(name);
CREATE INDEX IF NOT EXISTS idx_investors_type ON investors(type);
CREATE INDEX IF NOT EXISTS idx_investors_climate_focus ON investors(climate_focus);
CREATE INDEX IF NOT EXISTS idx_deal_investors_deal_id ON deal_investors(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_investors_investor_id ON deal_investors(investor_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_company_id ON enrichment_queue(company_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_queue_status ON enrichment_queue(status);
CREATE INDEX IF NOT EXISTS idx_data_sources_name ON data_sources(name);
CREATE INDEX IF NOT EXISTS idx_data_sources_is_active ON data_sources(is_active);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE alex_filter_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alex_deal_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
DO $$ 
BEGIN
    -- Companies policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Allow authenticated users to read companies') THEN
        CREATE POLICY "Allow authenticated users to read companies" ON companies FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Allow authenticated users to write companies') THEN
        CREATE POLICY "Allow authenticated users to write companies" ON companies FOR ALL TO authenticated USING (true);
    END IF;
    
    -- Deals policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'Allow authenticated users to read deals') THEN
        CREATE POLICY "Allow authenticated users to read deals" ON deals FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deals' AND policyname = 'Allow authenticated users to write deals') THEN
        CREATE POLICY "Allow authenticated users to write deals" ON deals FOR ALL TO authenticated USING (true);
    END IF;
    
    -- Similar policies for other tables...
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'investors' AND policyname = 'Allow authenticated users full access investors') THEN
        CREATE POLICY "Allow authenticated users full access investors" ON investors FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'deal_investors' AND policyname = 'Allow authenticated users full access deal_investors') THEN
        CREATE POLICY "Allow authenticated users full access deal_investors" ON deal_investors FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alex_filter_settings' AND policyname = 'Allow authenticated users full access alex_filter_settings') THEN
        CREATE POLICY "Allow authenticated users full access alex_filter_settings" ON alex_filter_settings FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'alex_deal_views' AND policyname = 'Allow authenticated users full access alex_deal_views') THEN
        CREATE POLICY "Allow authenticated users full access alex_deal_views" ON alex_deal_views FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrichment_queue' AND policyname = 'Allow authenticated users full access enrichment_queue') THEN
        CREATE POLICY "Allow authenticated users full access enrichment_queue" ON enrichment_queue FOR ALL TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'data_sources' AND policyname = 'Allow authenticated users full access data_sources') THEN
        CREATE POLICY "Allow authenticated users full access data_sources" ON data_sources FOR ALL TO authenticated USING (true);
    END IF;
END $$;

-- =============================================================================
-- VIEWS FOR ALEX'S DASHBOARD
-- =============================================================================

-- Alex's daily prospects view
CREATE OR REPLACE VIEW alex_daily_prospects AS
SELECT 
    d.id,
    d.investment_score,
    d.company_id,
    d.funding_stage,
    d.amount_raised_usd,
    d.date_announced,
    d.source_name,
    d.source_url,
    d.alex_review_status,
    d.created_at,
    c.name as company_name,
    c.has_ai_focus,
    c.climate_sub_sectors,
    c.headquarters_country
FROM deals d
JOIN companies c ON d.company_id = c.id
WHERE d.investment_score >= 60
  AND d.alex_review_status = 'pending'
ORDER BY d.investment_score DESC, d.created_at DESC;

-- Pipeline health view
CREATE OR REPLACE VIEW pipeline_health AS
SELECT 
    ds.name as source_name,
    ds.type as source_type,
    ds.is_active,
    ds.reliability_score,
    ds.last_scraped_at,
    ds.error_count,
    COUNT(d.id) as deals_found_last_7_days
FROM data_sources ds
LEFT JOIN deals d ON d.source_name = ds.name 
    AND d.created_at >= NOW() - INTERVAL '7 days'
GROUP BY ds.id, ds.name, ds.type, ds.is_active, ds.reliability_score, ds.last_scraped_at, ds.error_count
ORDER BY ds.reliability_score DESC;

-- =============================================================================
-- ALEX'S SCORING FUNCTION
-- =============================================================================

-- Alex's investment score calculation function
CREATE OR REPLACE FUNCTION calculate_alex_score(
    funding_stage_param text,
    amount_raised numeric,
    has_ai boolean,
    climate_sectors text[],
    headquarters_country text,
    media_mentions integer DEFAULT 0,
    confidence_score float DEFAULT 0.5
) RETURNS integer AS $$
DECLARE
    score integer := 0;
    target_sectors text[] := ARRAY[
        'Climate Tech - Energy & Grid',
        'Climate Tech - Industrial Software',
        'Climate Tech - Energy Storage',
        'Climate Tech - Smart Manufacturing',
        'Climate Tech - Carbon & Emissions'
    ];
BEGIN
    -- Stage scoring (30 points max)
    CASE LOWER(funding_stage_param)
        WHEN 'seed', 'series a', 'series-a', 'pre-seed' THEN score := score + 30;
        WHEN 'series b', 'series-b' THEN score := score + 15;
        WHEN 'series c', 'series-c', 'growth' THEN score := score + 5;
        ELSE score := score + 0;
    END CASE;
    
    -- AI requirement (25 points max)
    IF has_ai THEN
        score := score + 25;
    ELSE
        score := score - 15;
    END IF;
    
    -- Sector matching (25 points max)
    IF climate_sectors && target_sectors THEN
        score := score + 25;
    ELSIF EXISTS(
        SELECT 1 FROM unnest(climate_sectors) AS sector 
        WHERE sector LIKE 'Climate Tech%'
    ) THEN
        score := score + 10;
    END IF;
    
    -- Geographic preference (10 points max)
    CASE headquarters_country
        WHEN 'US' THEN score := score + 10;
        WHEN 'Canada', 'UK' THEN score := score + 7;
        ELSE score := score + 0;
    END CASE;
    
    -- Funding size (15 points max)
    IF amount_raised BETWEEN 1000000 AND 8000000 THEN
        score := score + 15;
    ELSIF amount_raised BETWEEN 500000 AND 15000000 THEN
        score := score + 8;
    ELSIF amount_raised > 15000000 THEN
        score := score - 10;
    ELSIF amount_raised < 500000 THEN
        score := score - 5;
    END IF;
    
    -- Proprietary deal flow bonus (10 points max)
    IF media_mentions < 3 THEN
        score := score + 10;
    ELSIF media_mentions > 10 THEN
        score := score - 5;
    END IF;
    
    -- Data confidence bonus (10 points max)
    score := score + (confidence_score * 10)::integer;
    
    RETURN LEAST(100, GREATEST(0, score));
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TIMESTAMP TRIGGERS
-- =============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at 
    BEFORE UPDATE ON deals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investors_updated_at ON investors;
CREATE TRIGGER update_investors_updated_at 
    BEFORE UPDATE ON investors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_sources_updated_at ON data_sources;
CREATE TRIGGER update_data_sources_updated_at 
    BEFORE UPDATE ON data_sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert Alex's default filter settings
INSERT INTO alex_filter_settings (setting_name, is_enabled, filter_values) VALUES
('stage_filter', true, '{
    "enabled": true,
    "allowed_stages": ["seed", "series a", "series-a", "pre-seed"],
    "strict_mode": false
}'),
('ai_filter', true, '{
    "enabled": true,
    "require_ai": true,
    "strict_mode": false
}'),
('sector_filter', true, '{
    "enabled": true,
    "target_sectors": [
        "Climate Tech - Energy & Grid",
        "Climate Tech - Industrial Software", 
        "Climate Tech - Energy Storage",
        "Climate Tech - Smart Manufacturing",
        "Climate Tech - Carbon & Emissions"
    ],
    "strict_mode": false
}'),
('geography_filter', true, '{
    "enabled": true,
    "preferred_countries": ["US", "Canada", "UK"],
    "strict_mode": false
}'),
('funding_size_filter', true, '{
    "enabled": true,
    "min_amount": 500000,
    "max_amount": 15000000,
    "optimal_min": 1000000,
    "optimal_max": 8000000,
    "strict_mode": false
}')
ON CONFLICT (setting_name) DO NOTHING;

-- Insert Alex's default view
INSERT INTO alex_deal_views (view_name, filter_criteria, is_active) VALUES
('alex_default', '{
    "stage_filter": {"enabled": true, "strict_mode": false},
    "ai_filter": {"enabled": true, "strict_mode": false},
    "sector_filter": {"enabled": true, "strict_mode": false},
    "geography_filter": {"enabled": true, "strict_mode": false},
    "funding_size_filter": {"enabled": true, "strict_mode": false}
}', true)
ON CONFLICT DO NOTHING;

-- Insert initial data sources
INSERT INTO data_sources (name, type, url, is_active, reliability_score) VALUES
('TechCrunch', 'news', 'https://techcrunch.com/category/startups/', true, 0.9),
('Climate Insider', 'news', 'https://climateinsider.com/category/exclusives/', true, 0.95),
('CTVC', 'news', 'https://www.ctvc.co/tag/insights/', true, 0.85),
('Axios Pro Climate', 'news', 'https://pro.axios.com/climate-deals', true, 0.9),
('AgFunder News', 'news', 'https://agfundernews.com/', true, 0.8),
('Tech Funding News', 'news', 'https://techfundingnews.com/category/climate-tech/', true, 0.8),
('Canary Media', 'news', 'https://www.canarymedia.com/articles', true, 0.9)
ON CONFLICT (name) DO NOTHING;

-- Migration complete
RAISE NOTICE 'Alex Climate VC Pipeline schema migration completed successfully!';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Review the deals_backup table if you had existing data';
RAISE NOTICE '2. Migrate your existing deals data to the new schema structure';
RAISE NOTICE '3. Update your application code to use the new API endpoints';
RAISE NOTICE '4. Test the new Alex dashboard at /alex-dashboard';
EOF

echo "✅ Migration file created: $MIGRATION_FILE"
echo ""
echo "📝 Next steps:"
echo "1. Review the migration file"
echo "2. Run: supabase db push"
echo "3. Test your new Alex dashboard at /alex-dashboard"
echo ""
echo "🔧 Optional: If you have existing data, you may need to create a custom migration script"
echo "   to transform your current deals table data to the new schema structure."
