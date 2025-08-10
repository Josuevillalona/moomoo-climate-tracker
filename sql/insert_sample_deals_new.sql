-- Sample data for deals_new table and supporting tables
-- This provides test data that matches Alex's investment criteria

-- =============================================================================
-- SAMPLE COMPANIES
-- =============================================================================

INSERT INTO public.companies (
    id,
    name,
    website,
    domain,
    description,
    headquarters_country,
    is_climate_tech,
    has_ai_focus,
    climate_sub_sectors,
    verification_status,
    confidence_score,
    media_mentions
) VALUES 
(
    gen_random_uuid(),
    'Jeh Aerospace',
    'https://jehaerospace.com',
    'jehaerospace.com',
    'AI-powered commercial aircraft supply chain optimization platform',
    'India',
    true,
    true,
    ARRAY['Supply Chain', 'Industrial Automation'],
    'verified',
    0.85,
    2
),
(
    gen_random_uuid(),
    'ClimateAI Solutions',
    'https://climateai.io',
    'climateai.io',
    'Machine learning platform for climate risk assessment and adaptation',
    'United States',
    true,
    true,
    ARRAY['Climate Analytics', 'Agriculture Tech'],
    'verified',
    0.92,
    1
),
(
    gen_random_uuid(),
    'GreenGrid Energy',
    'https://greengrid.energy',
    'greengrid.energy',
    'Smart grid optimization for renewable energy distribution',
    'Canada',
    true,
    true,
    ARRAY['Energy Storage', 'Solar Energy'],
    'pending',
    0.78,
    5
),
(
    gen_random_uuid(),
    'Industrial Carbon Solutions',
    'https://indcarbonsolutions.com',
    'indcarbonsolutions.com',
    'Carbon capture technology for industrial manufacturing',
    'United Kingdom',
    true,
    false,
    ARRAY['Carbon Capture', 'Industrial Automation'],
    'verified',
    0.88,
    8
),
(
    gen_random_uuid(),
    'NextGen Battery Tech',
    'https://nextgenbattery.com',
    'nextgenbattery.com',
    'Advanced lithium-ion battery technology for electric vehicles',
    'United States',
    true,
    false,
    ARRAY['Energy Storage', 'Electric Vehicles'],
    'verified',
    0.91,
    12
);

-- =============================================================================
-- SAMPLE INVESTORS
-- =============================================================================

INSERT INTO public.investors (
    id,
    name,
    type,
    website,
    climate_focus,
    geographic_focus,
    typical_check_size_min,
    typical_check_size_max
) VALUES 
(
    gen_random_uuid(),
    'Breakthrough Energy Ventures',
    'vc',
    'https://www.breakthroughenergy.org',
    true,
    ARRAY['United States', 'Canada', 'Europe'],
    5000000,
    50000000
),
(
    gen_random_uuid(),
    'Energy Impact Partners',
    'vc',
    'https://energyimpactpartners.com',
    true,
    ARRAY['United States', 'Canada'],
    1000000,
    25000000
),
(
    gen_random_uuid(),
    'Bessemer Venture Partners',
    'vc',
    'https://www.bvp.com',
    false,
    ARRAY['United States', 'India', 'Israel'],
    2000000,
    15000000
),
(
    gen_random_uuid(),
    'Khosla Ventures',
    'vc',
    'https://www.khoslaventures.com',
    true,
    ARRAY['United States'],
    500000,
    20000000
),
(
    gen_random_uuid(),
    'Climate Angels Network',
    'angel',
    'https://climateangels.net',
    true,
    ARRAY['United States', 'Canada', 'United Kingdom'],
    100000,
    2000000
);

-- =============================================================================
-- SAMPLE DEALS_NEW DATA
-- =============================================================================

-- Get company and investor IDs for foreign key references
WITH company_ids AS (
    SELECT name, id FROM companies WHERE name IN (
        'Jeh Aerospace', 
        'ClimateAI Solutions', 
        'GreenGrid Energy', 
        'Industrial Carbon Solutions', 
        'NextGen Battery Tech'
    )
),
investor_ids AS (
    SELECT name, id FROM investors WHERE name IN (
        'Breakthrough Energy Ventures',
        'Energy Impact Partners', 
        'Bessemer Venture Partners',
        'Khosla Ventures',
        'Climate Angels Network'
    )
)

-- Insert sample deals
INSERT INTO public.deals_new (
    id,
    company_id,
    amount_raised_usd,
    original_amount,
    original_currency,
    funding_stage,
    date_announced,
    source_url,
    source_type,
    source_name,
    raw_text_content,
    confidence_score,
    alex_review_status,
    status
) VALUES 
-- Jeh Aerospace deal (should score high: AI + Supply Chain + Seed)
(
    gen_random_uuid(),
    (SELECT id FROM company_ids WHERE name = 'Jeh Aerospace'),
    11000000,
    '$11M',
    'USD',
    'Series A',
    CURRENT_DATE - INTERVAL '2 days',
    'https://techcrunch.com/2025/08/07/jeh-aerospace-nets-11m-series-a',
    'news',
    'TechCrunch',
    'Jeh Aerospace nets $11M to scale the commercial aircraft supply chain in India. The AI-powered platform optimizes logistics and reduces costs for airlines.',
    0.85,
    'pending',
    'new'
),
-- ClimateAI Solutions deal (should score very high: AI + Climate + US)
(
    gen_random_uuid(),
    (SELECT id FROM company_ids WHERE name = 'ClimateAI Solutions'),
    5500000,
    '$5.5M',
    'USD',
    'Seed',
    CURRENT_DATE - INTERVAL '1 day',
    'https://venturebeat.com/2025/08/08/climateai-raises-5-5m-seed',
    'news',
    'VentureBeat',
    'ClimateAI Solutions raises $5.5M seed round to expand its machine learning platform for climate risk assessment.',
    0.92,
    'pending',
    'new'
),
-- GreenGrid Energy deal (good score: AI + Energy + Canada)
(
    gen_random_uuid(),
    (SELECT id FROM company_ids WHERE name = 'GreenGrid Energy'),
    8200000,
    'CAD $11M',
    'CAD',
    'Series A',
    CURRENT_DATE - INTERVAL '5 days',
    'https://betakit.com/2025/08/04/greengrid-energy-series-a',
    'news',
    'BetaKit',
    'GreenGrid Energy secures CAD $11M Series A to scale smart grid optimization across Canada.',
    0.78,
    'pending',
    'new'
),
-- Industrial Carbon Solutions (medium score: no AI but good sector + UK)
(
    gen_random_uuid(),
    (SELECT id FROM company_ids WHERE name = 'Industrial Carbon Solutions'),
    15000000,
    '£12M',
    'GBP',
    'Series B',
    CURRENT_DATE - INTERVAL '10 days',
    'https://techeu.com/2025/07/30/industrial-carbon-solutions-series-b',
    'news',
    'Tech.eu',
    'Industrial Carbon Solutions raises £12M Series B to deploy carbon capture technology in manufacturing.',
    0.88,
    'pending',
    'new'
),
-- NextGen Battery Tech (medium score: good sector but lots of media attention)
(
    gen_random_uuid(),
    (SELECT id FROM company_ids WHERE name = 'NextGen Battery Tech'),
    25000000,
    '$25M',
    'USD',
    'Series B',
    CURRENT_DATE - INTERVAL '14 days',
    'https://techcrunch.com/2025/07/26/nextgen-battery-tech-series-b',
    'news',
    'TechCrunch',
    'NextGen Battery Tech closes $25M Series B to accelerate production of next-generation batteries for EVs.',
    0.91,
    'interested',
    'processed'
);

-- =============================================================================
-- SAMPLE DEAL-INVESTOR RELATIONSHIPS
-- =============================================================================

WITH deal_ids AS (
    SELECT 
        d.id as deal_id,
        c.name as company_name
    FROM deals_new d
    JOIN companies c ON d.company_id = c.id
),
investor_ids AS (
    SELECT name, id as investor_id FROM investors
)

INSERT INTO public.deal_investors (
    deal_id,
    investor_id,
    role,
    amount_invested
) VALUES 
-- Jeh Aerospace investors
(
    (SELECT deal_id FROM deal_ids WHERE company_name = 'Jeh Aerospace'),
    (SELECT investor_id FROM investor_ids WHERE name = 'Bessemer Venture Partners'),
    'lead',
    6000000
),
(
    (SELECT deal_id FROM deal_ids WHERE company_name = 'Jeh Aerospace'),
    (SELECT investor_id FROM investor_ids WHERE name = 'Climate Angels Network'),
    'participant',
    2000000
),
-- ClimateAI Solutions investors
(
    (SELECT deal_id FROM deal_ids WHERE company_name = 'ClimateAI Solutions'),
    (SELECT investor_id FROM investor_ids WHERE name = 'Khosla Ventures'),
    'lead',
    3500000
),
(
    (SELECT deal_id FROM deal_ids WHERE company_name = 'ClimateAI Solutions'),
    (SELECT investor_id FROM investor_ids WHERE name = 'Climate Angels Network'),
    'participant',
    1000000
),
-- GreenGrid Energy investors
(
    (SELECT deal_id FROM deal_ids WHERE company_name = 'GreenGrid Energy'),
    (SELECT investor_id FROM investor_ids WHERE name = 'Energy Impact Partners'),
    'lead',
    5000000
),
-- Industrial Carbon Solutions investors
(
    (SELECT deal_id FROM deal_ids WHERE company_name = 'Industrial Carbon Solutions'),
    (SELECT investor_id FROM investor_ids WHERE name = 'Breakthrough Energy Ventures'),
    'lead',
    12000000
),
-- NextGen Battery Tech investors
(
    (SELECT deal_id FROM deal_ids WHERE company_name = 'NextGen Battery Tech'),
    (SELECT investor_id FROM investor_ids WHERE name = 'Breakthrough Energy Ventures'),
    'lead',
    15000000
),
(
    (SELECT deal_id FROM deal_ids WHERE company_name = 'NextGen Battery Tech'),
    (SELECT investor_id FROM investor_ids WHERE name = 'Energy Impact Partners'),
    'participant',
    8000000
);

-- =============================================================================
-- SAMPLE ALEX FILTER SETTINGS
-- =============================================================================

INSERT INTO public.alex_filter_settings (
    setting_name,
    is_enabled,
    filter_values
) VALUES 
(
    'default_stage_filter',
    true,
    '{
        "funding_stages": ["Seed", "Series A"],
        "mode": "flexible",
        "description": "Alex''s preferred funding stages with flexible matching"
    }'::jsonb
),
(
    'ai_requirement',
    true,
    '{
        "has_ai_focus": true,
        "mode": "strict",
        "description": "Require AI focus for deal consideration"
    }'::jsonb
),
(
    'geographic_preference',
    true,
    '{
        "countries": ["United States", "Canada", "United Kingdom"],
        "mode": "flexible",
        "description": "Geographic focus for investment opportunities"
    }'::jsonb
),
(
    'funding_size_range',
    true,
    '{
        "min_amount": 500000,
        "max_amount": 15000000,
        "optimal_min": 1000000,
        "optimal_max": 8000000,
        "description": "Target funding size range for Alex''s investments"
    }'::jsonb
);

-- =============================================================================
-- SAMPLE ALEX DEAL VIEWS
-- =============================================================================

INSERT INTO public.alex_deal_views (
    view_name,
    filter_criteria,
    is_active
) VALUES 
(
    'All Deals',
    '{
        "investment_score_min": 0,
        "alex_review_status": ["pending", "interested"],
        "description": "All deals regardless of filters"
    }'::jsonb,
    false
),
(
    'AI Seed Deals',
    '{
        "funding_stages": ["Seed"],
        "has_ai_focus": true,
        "investment_score_min": 70,
        "countries": ["United States", "Canada", "United Kingdom"],
        "description": "High-scoring AI seed deals in target countries"
    }'::jsonb,
    true
),
(
    'Flexible Filter',
    '{
        "investment_score_min": 60,
        "funding_stages": ["Seed", "Series A"],
        "climate_sectors": ["Industrial Automation", "Supply Chain", "Energy Storage"],
        "description": "Flexible filtering for broader deal discovery"
    }'::jsonb,
    false
);

-- =============================================================================
-- SAMPLE DATA SOURCES
-- =============================================================================

INSERT INTO public.data_sources (
    name,
    type,
    url,
    is_active,
    reliability_score,
    last_scraped_at,
    last_successful_scrape
) VALUES 
(
    'TechCrunch',
    'news',
    'https://techcrunch.com',
    true,
    0.95,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
),
(
    'VentureBeat',
    'news',
    'https://venturebeat.com',
    true,
    0.88,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
),
(
    'Crunchbase',
    'vc_portfolio',
    'https://crunchbase.com',
    true,
    0.92,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes'
),
(
    'BetaKit',
    'news',
    'https://betakit.com',
    true,
    0.85,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
),
(
    'Tech.eu',
    'news',
    'https://tech.eu',
    true,
    0.80,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '4 hours'
);

-- =============================================================================
-- TRIGGER SCORE CALCULATION
-- =============================================================================

-- Update investment scores for all inserted deals
-- This will trigger the scoring function we created
UPDATE deals_new SET updated_at = NOW() WHERE investment_score IS NULL;

-- Verify sample data was inserted correctly
DO $$
DECLARE
    deal_count integer;
    company_count integer;
    investor_count integer;
BEGIN
    SELECT COUNT(*) INTO deal_count FROM deals_new;
    SELECT COUNT(*) INTO company_count FROM companies;
    SELECT COUNT(*) INTO investor_count FROM investors;
    
    RAISE NOTICE 'Sample data inserted successfully:';
    RAISE NOTICE '  - % companies', company_count;
    RAISE NOTICE '  - % deals', deal_count;
    RAISE NOTICE '  - % investors', investor_count;
    RAISE NOTICE '  - Sample data represents Alex''s target deal types with proper scoring';
END $$;
