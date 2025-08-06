-- Create the deals table
CREATE TABLE public.deals (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  company_name text DEFAULT ''::text,
  amount_raised double precision,
  currency text DEFAULT 'USD'::text,
  funding_stage text,
  date_announced date,
  lead_investors text,
  other_investors text,
  climate_sub_sector text,
  geography_country text,
  source_url text,
  raw_text_content text,
  status text DEFAULT 'NEW'::text,
  funding_amount_str text,
  CONSTRAINT deals_pkey PRIMARY KEY (id)
);

-- Enable Row Level Security (recommended)
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (adjust based on your auth needs)
CREATE POLICY "Allow all operations on deals" ON public.deals
FOR ALL USING (true);

-- Optional: Create indexes for better performance
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deals_created_at ON public.deals(created_at);
CREATE INDEX idx_deals_company_name ON public.deals(company_name);
