import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on your schema
export interface Deal {
  id: number
  created_at: string
  company_name: string | null
  amount_raised: number | null
  currency: number | null
  funding_stage: string | null
  date_announced: string | null
  lead_investors: string | null
  other_investors: string | null
  climate_sub_sector: string | null
  geography_country: string | null
  source_url: string | null
  raw_text_content: string | null
  status: string
  funding_amount_str: string | null
}

export interface Database {
  public: {
    Tables: {
      deals: {
        Row: Deal
        Insert: Omit<Deal, 'id' | 'created_at'>
        Update: Partial<Omit<Deal, 'id' | 'created_at'>>
      }
    }
  }
}
