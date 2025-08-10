-- Alex's Investment Scoring Function and Real-Time Alert System
-- This function calculates Alex's proprietary 0-100 investment score

-- =============================================================================
-- ALEX'S SCORING FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_alex_score(
    funding_stage_param text,
    amount_raised_param numeric,
    company_id_param uuid,
    has_ai_focus_param boolean DEFAULT NULL,
    climate_sectors_param text[] DEFAULT NULL,
    headquarters_country_param text DEFAULT NULL,
    media_mentions_param integer DEFAULT 0
) RETURNS integer AS $$
DECLARE
    score integer := 0;
    company_record record;
BEGIN
    -- Get company data if not provided as parameters
    IF has_ai_focus_param IS NULL OR climate_sectors_param IS NULL OR headquarters_country_param IS NULL THEN
        SELECT 
            has_ai_focus,
            climate_sub_sectors,
            headquarters_country,
            media_mentions
        INTO company_record
        FROM companies 
        WHERE id = company_id_param;
        
        -- Use fetched data if parameters not provided
        has_ai_focus_param := COALESCE(has_ai_focus_param, company_record.has_ai_focus);
        climate_sectors_param := COALESCE(climate_sectors_param, company_record.climate_sub_sectors);
        headquarters_country_param := COALESCE(headquarters_country_param, company_record.headquarters_country);
        media_mentions_param := COALESCE(media_mentions_param, company_record.media_mentions);
    END IF;

    -- =============================================================================
    -- FUNDING STAGE SCORING (30 points max)
    -- =============================================================================
    score := score + CASE 
        WHEN funding_stage_param IN ('Seed', 'Series A') THEN 30
        WHEN funding_stage_param = 'Pre-Seed' THEN 25
        WHEN funding_stage_param = 'Series B' THEN 20
        WHEN funding_stage_param IN ('Series C', 'Series D', 'Series D+') THEN 15
        WHEN funding_stage_param = 'Growth' THEN 10
        ELSE 5 -- Unknown or other stages
    END;

    -- =============================================================================
    -- AI FOCUS SCORING (25 points max)
    -- =============================================================================
    IF has_ai_focus_param = true THEN
        score := score + 25;
    ELSIF has_ai_focus_param = false THEN
        score := score + 5; -- Still some points for non-AI climate tech
    END IF;

    -- =============================================================================
    -- CLIMATE SECTOR SCORING (25 points max)
    -- =============================================================================
    IF climate_sectors_param IS NOT NULL AND array_length(climate_sectors_param, 1) > 0 THEN
        -- High priority sectors for Alex
        IF climate_sectors_param && ARRAY[
            'Industrial Automation',
            'Supply Chain',
            'Energy Storage',
            'Electric Vehicles',
            'Carbon Capture'
        ] THEN
            score := score + 25;
        -- Medium priority sectors
        ELSIF climate_sectors_param && ARRAY[
            'Solar Energy',
            'Wind Energy',
            'Agriculture Tech',
            'Water Management',
            'Green Building'
        ] THEN
            score := score + 20;
        -- Other climate sectors
        ELSE
            score := score + 15;
        END IF;
    ELSE
        score := score + 10; -- Default for unknown sectors
    END IF;

    -- =============================================================================
    -- GEOGRAPHY SCORING (10 points max)
    -- =============================================================================
    score := score + CASE 
        WHEN headquarters_country_param = 'United States' THEN 10
        WHEN headquarters_country_param IN ('Canada', 'United Kingdom') THEN 7
        WHEN headquarters_country_param IN ('Germany', 'France', 'Netherlands', 'Sweden', 'Denmark') THEN 6
        WHEN headquarters_country_param IN ('Israel', 'Singapore', 'Australia') THEN 5
        WHEN headquarters_country_param IN ('India', 'Brazil') THEN 4
        ELSE 2 -- Other countries
    END;

    -- =============================================================================
    -- FUNDING SIZE SCORING (10 points max)
    -- =============================================================================
    IF amount_raised_param IS NOT NULL THEN
        score := score + CASE
            -- Alex's sweet spot
            WHEN amount_raised_param BETWEEN 1000000 AND 8000000 THEN 10 -- $1M-$8M
            -- Acceptable range
            WHEN amount_raised_param BETWEEN 500000 AND 15000000 THEN 8   -- $500K-$15M
            -- Too small
            WHEN amount_raised_param < 500000 THEN 3
            -- Too large for Alex's typical check
            WHEN amount_raised_param > 15000000 THEN 5
            ELSE 5
        END;
    ELSE
        score := score + 3; -- Unknown amount
    END IF;

    -- =============================================================================
    -- PROPRIETARY SIGNALS BONUS (10 points max)
    -- =============================================================================
    
    -- Low media attention bonus (stealth opportunities)
    IF media_mentions_param <= 2 THEN
        score := score + 5;
    ELSIF media_mentions_param <= 5 THEN
        score := score + 3;
    END IF;

    -- Early stage + AI + Industrial combo bonus
    IF funding_stage_param IN ('Seed', 'Series A') 
       AND has_ai_focus_param = true 
       AND climate_sectors_param && ARRAY['Industrial Automation', 'Supply Chain'] THEN
        score := score + 5;
    END IF;

    -- Ensure score is within bounds
    score := GREATEST(0, LEAST(100, score));
    
    RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- TRIGGER FUNCTION FOR AUTOMATIC SCORING
-- =============================================================================

CREATE OR REPLACE FUNCTION deals_new_auto_score()
RETURNS TRIGGER AS $$
DECLARE
    calculated_score integer;
BEGIN
    -- Calculate Alex's investment score automatically
    calculated_score := calculate_alex_score(
        NEW.funding_stage,
        NEW.amount_raised_usd,
        NEW.company_id
    );
    
    -- Set the investment score
    NEW.investment_score := calculated_score;
    
    -- Set updated_at timestamp
    NEW.updated_at := NOW();
    
    -- Trigger real-time alert if high score
    IF calculated_score >= 70 THEN
        PERFORM pg_notify('high_score_deal', 
            json_build_object(
                'deal_id', NEW.id,
                'company_id', NEW.company_id,
                'investment_score', calculated_score,
                'funding_stage', NEW.funding_stage,
                'amount_raised_usd', NEW.amount_raised_usd,
                'source_name', NEW.source_name
            )::text
        );
    END IF;
    
    -- Trigger medium score alert if applicable
    IF calculated_score >= 60 AND calculated_score < 70 THEN
        PERFORM pg_notify('medium_score_deal', 
            json_build_object(
                'deal_id', NEW.id,
                'company_id', NEW.company_id,
                'investment_score', calculated_score
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CREATE TRIGGERS
-- =============================================================================

-- Trigger for automatic scoring on INSERT
CREATE TRIGGER deals_new_auto_score_insert
    BEFORE INSERT ON public.deals_new
    FOR EACH ROW
    EXECUTE FUNCTION deals_new_auto_score();

-- Trigger for automatic scoring on UPDATE (when relevant fields change)
CREATE TRIGGER deals_new_auto_score_update
    BEFORE UPDATE OF funding_stage, amount_raised_usd, company_id ON public.deals_new
    FOR EACH ROW
    WHEN (
        OLD.funding_stage IS DISTINCT FROM NEW.funding_stage OR
        OLD.amount_raised_usd IS DISTINCT FROM NEW.amount_raised_usd OR
        OLD.company_id IS DISTINCT FROM NEW.company_id
    )
    EXECUTE FUNCTION deals_new_auto_score();

-- =============================================================================
-- ALEX'S DASHBOARD VIEWS
-- =============================================================================

-- Alex's daily prospects view (high-score deals needing review)
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
    d.alex_notes,
    d.created_at,
    c.name as company_name,
    c.has_ai_focus,
    c.climate_sub_sectors,
    c.headquarters_country,
    c.headquarters_city,
    c.description,
    c.website,
    c.verification_status,
    -- Calculate days since announcement
    CASE 
        WHEN d.date_announced IS NOT NULL THEN 
            EXTRACT(days FROM (CURRENT_DATE - d.date_announced))::integer
        ELSE 
            EXTRACT(days FROM (CURRENT_DATE - d.created_at::date))::integer
    END as days_since_announced
FROM deals_new d
JOIN companies c ON d.company_id = c.id
WHERE d.investment_score >= 60
  AND d.alex_review_status = 'pending'
  AND d.status IN ('new', 'processed')
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
    ds.last_error_at,
    COALESCE(deal_stats.deals_found_last_7_days, 0) as deals_found_last_7_days,
    COALESCE(deal_stats.avg_score_last_7_days, 0) as avg_score_last_7_days,
    COALESCE(deal_stats.high_score_deals_last_7_days, 0) as high_score_deals_last_7_days
FROM data_sources ds
LEFT JOIN (
    SELECT 
        d.source_name,
        COUNT(d.id) as deals_found_last_7_days,
        ROUND(AVG(d.investment_score))::integer as avg_score_last_7_days,
        COUNT(d.id) FILTER (WHERE d.investment_score >= 70) as high_score_deals_last_7_days
    FROM deals_new d
    WHERE d.created_at >= CURRENT_DATE - INTERVAL '7 days'
    GROUP BY d.source_name
) deal_stats ON ds.name = deal_stats.source_name
ORDER BY ds.reliability_score DESC, deals_found_last_7_days DESC;

-- Alex's review summary view
CREATE OR REPLACE VIEW alex_review_summary AS
SELECT 
    alex_review_status,
    COUNT(*) as deal_count,
    ROUND(AVG(investment_score))::integer as avg_score,
    COUNT(*) FILTER (WHERE investment_score >= 80) as high_score_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_count
FROM deals_new
WHERE alex_review_status IS NOT NULL
GROUP BY alex_review_status
ORDER BY 
    CASE alex_review_status
        WHEN 'pending' THEN 1
        WHEN 'interested' THEN 2
        WHEN 'passed' THEN 3
        WHEN 'auto_filtered' THEN 4
    END;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to manually recalculate scores for existing deals
CREATE OR REPLACE FUNCTION recalculate_all_scores()
RETURNS integer AS $$
DECLARE
    updated_count integer := 0;
    deal_record record;
BEGIN
    FOR deal_record IN 
        SELECT id, funding_stage, amount_raised_usd, company_id 
        FROM deals_new 
        WHERE investment_score IS NULL OR investment_score = 0
    LOOP
        UPDATE deals_new 
        SET investment_score = calculate_alex_score(
            deal_record.funding_stage,
            deal_record.amount_raised_usd,
            deal_record.company_id
        )
        WHERE id = deal_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get Alex's filter recommendations based on deal patterns
CREATE OR REPLACE FUNCTION get_alex_filter_recommendations()
RETURNS TABLE(
    filter_type text,
    recommended_value text,
    deal_count integer,
    avg_score numeric
) AS $$
BEGIN
    RETURN QUERY
    -- Top performing funding stages
    SELECT 
        'funding_stage'::text,
        d.funding_stage::text,
        COUNT(*)::integer,
        ROUND(AVG(d.investment_score), 1)
    FROM deals_new d
    WHERE d.investment_score >= 70
      AND d.funding_stage IS NOT NULL
    GROUP BY d.funding_stage
    HAVING COUNT(*) >= 3
    ORDER BY AVG(d.investment_score) DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS AND DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION calculate_alex_score IS 'Alex''s proprietary investment scoring algorithm (0-100 scale)';
COMMENT ON FUNCTION deals_new_auto_score IS 'Trigger function for automatic deal scoring and real-time alerts';
COMMENT ON FUNCTION recalculate_all_scores IS 'Utility function to recalculate scores for existing deals';
COMMENT ON VIEW alex_daily_prospects IS 'Alex''s curated list of high-scoring deals requiring review';
COMMENT ON VIEW pipeline_health IS 'Data source performance monitoring for pipeline health';
COMMENT ON VIEW alex_review_summary IS 'Summary of Alex''s deal review activity and outcomes';
