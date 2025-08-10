-- Create companies table (required for deals_new foreign key)
-- This is the normalized company information table

CREATE TABLE IF NOT EXISTS public.companies (
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
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('verified', 'unverified', 'pending')),
    legal_name VARCHAR(255),
    incorporation_date DATE,
    enrichment_status VARCHAR(20) DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'basic', 'complete')),
    data_sources TEXT[],
    confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    media_mentions INTEGER DEFAULT 0,
    last_enriched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name) -- Prevent duplicate company names
);

-- Create investors table
CREATE TABLE IF NOT EXISTS public.investors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('vc', 'angel', 'corporate_vc', 'family_office')),
    website VARCHAR(500),
    climate_focus BOOLEAN DEFAULT false,
    geographic_focus TEXT[],
    typical_check_size_min NUMERIC(15,2),
    typical_check_size_max NUMERIC(15,2),
    portfolio_count INTEGER DEFAULT 0,
    enrichment_status VARCHAR(20) DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'basic', 'complete')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name) -- Prevent duplicate investor names
);

-- Create deal_investors relationship table
CREATE TABLE IF NOT EXISTS public.deal_investors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID REFERENCES deals_new(id) ON DELETE CASCADE,
    investor_id UUID REFERENCES investors(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'unknown' CHECK (role IN ('lead', 'participant', 'unknown')),
    amount_invested NUMERIC(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(deal_id, investor_id) -- Prevent duplicate relationships
);

-- Create Alex's filter settings table
CREATE TABLE IF NOT EXISTS public.alex_filter_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_name VARCHAR(50) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT true,
    filter_values JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Alex's saved deal views table
CREATE TABLE IF NOT EXISTS public.alex_deal_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    view_name VARCHAR(100) NOT NULL,
    filter_criteria JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create data sources tracking table
CREATE TABLE IF NOT EXISTS public.data_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('news', 'vc_portfolio', 'government')),
    url VARCHAR(1000),
    is_active BOOLEAN DEFAULT true,
    reliability_score FLOAT DEFAULT 1.0 CHECK (reliability_score >= 0 AND reliability_score <= 1),
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    last_successful_scrape TIMESTAMP WITH TIME ZONE,
    error_count INTEGER DEFAULT 0,
    last_error_at TIMESTAMP WITH TIME ZONE,
    last_error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrichment queue table
CREATE TABLE IF NOT EXISTS public.enrichment_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    enrichment_type VARCHAR(50) NOT NULL,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    attempts INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.companies IS 'Normalized company information with enrichment capabilities';
COMMENT ON TABLE public.investors IS 'VC firms and angel investors with portfolio tracking';
COMMENT ON TABLE public.deal_investors IS 'Many-to-many relationship between deals and investors';
COMMENT ON TABLE public.alex_filter_settings IS 'Alex''s configurable filter preferences';
COMMENT ON TABLE public.alex_deal_views IS 'Alex''s saved deal view configurations';
COMMENT ON TABLE public.data_sources IS 'Data source health monitoring and reliability tracking';
COMMENT ON TABLE public.enrichment_queue IS 'Automated company data enrichment pipeline';

-- Enable Row Level Security on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_filter_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_deal_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrichment_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users full access companies" ON public.companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access investors" ON public.investors FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access deal_investors" ON public.deal_investors FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access alex_filter_settings" ON public.alex_filter_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access alex_deal_views" ON public.alex_deal_views FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access data_sources" ON public.data_sources FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access enrichment_queue" ON public.enrichment_queue FOR ALL TO authenticated USING (true);

-- Create update triggers for updated_at columns
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON public.companies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investors_updated_at 
    BEFORE UPDATE ON public.investors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alex_filter_settings_updated_at 
    BEFORE UPDATE ON public.alex_filter_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_sources_updated_at 
    BEFORE UPDATE ON public.data_sources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
