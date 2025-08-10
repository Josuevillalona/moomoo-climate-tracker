-- Create deals_new table with enhanced schema for Alex's Climate VC Pipeline
-- This table replaces the legacy 'deals' table with normalized structure

CREATE TABLE public.deals_new (
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
    confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    investment_score INTEGER CHECK (investment_score >= 0 AND investment_score <= 100),
    alex_review_status VARCHAR(20) DEFAULT 'pending' CHECK (alex_review_status IN ('pending', 'interested', 'passed', 'auto_filtered')),
    alex_notes TEXT,
    alex_review_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'processed', 'enriched')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.deals_new IS 'Enhanced deals table with normalized schema and Alex''s scoring system';
COMMENT ON COLUMN public.deals_new.company_id IS 'Foreign key to companies table';
COMMENT ON COLUMN public.deals_new.amount_raised_usd IS 'Funding amount converted to USD';
COMMENT ON COLUMN public.deals_new.original_amount IS 'Original funding amount as string (e.g., "$5M", "€2.5M")';
COMMENT ON COLUMN public.deals_new.investment_score IS 'Alex''s proprietary investment score (0-100)';
COMMENT ON COLUMN public.deals_new.alex_review_status IS 'Alex''s review status for this deal';
COMMENT ON COLUMN public.deals_new.confidence_score IS 'Data quality confidence score (0.0-1.0)';

-- Enable Row Level Security
ALTER TABLE public.deals_new ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users full access deals_new" 
ON public.deals_new 
FOR ALL 
TO authenticated 
USING (true);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deals_new_updated_at 
    BEFORE UPDATE ON public.deals_new 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
