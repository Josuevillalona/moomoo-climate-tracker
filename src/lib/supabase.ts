import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getEnvironmentConfig } from './config/environment'

// Get validated environment configuration
const config = getEnvironmentConfig()
const { url: supabaseUrl, anonKey: supabaseAnonKey } = config.supabase

// Create Supabase client with enhanced configuration
console.log('Supabase: Initializing client with config:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length
});

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

console.log('Supabase: Client created successfully');

// Connection health check function
export async function checkSupabaseConnection(): Promise<{
  connected: boolean
  error?: string
}> {
  try {
    const { error } = await supabase
      .from('deals')
      .select('count')
      .limit(1)
      .single()

    if (error) {
      return {
        connected: false,
        error: `Database connection failed: ${error.message}`
      }
    }

    return { connected: true }
  } catch (error) {
    return {
      connected: false,
      error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Export configuration for debugging purposes (non-sensitive data only)
export const supabaseConfig = {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey.length
}

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
