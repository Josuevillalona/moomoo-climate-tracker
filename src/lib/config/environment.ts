/**
 * Environment configuration utilities
 * Provides centralized environment variable management and validation
 */

export interface EnvironmentConfig {
  supabase: {
    url: string
    anonKey: string
  }
  app: {
    environment: 'development' | 'production' | 'test'
    isDevelopment: boolean
    isProduction: boolean
  }
}

/**
 * Validates and returns the current environment configuration
 * Throws detailed errors if required variables are missing or invalid
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Validate Supabase URL
  if (!supabaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is required. ' +
      'Please add it to your .env.local file. ' +
      'You can find this in your Supabase project settings.'
    )
  }

  // Validate Supabase anon key
  if (!supabaseAnonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is required. ' +
      'Please add it to your .env.local file. ' +
      'You can find this in your Supabase project API settings.'
    )
  }

  // Validate URL format
  let parsedUrl: URL
  try {
    parsedUrl = new URL(supabaseUrl)
  } catch (error) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL format: "${supabaseUrl}". ` +
      'Expected format: https://your-project-id.supabase.co'
    )
  }

  // Validate that it's a Supabase URL
  if (!parsedUrl.hostname.includes('supabase.co')) {
    console.warn(
      `Warning: NEXT_PUBLIC_SUPABASE_URL doesn't appear to be a Supabase URL: ${supabaseUrl}`
    )
  }

  // Validate anon key format (basic JWT structure check)
  const keyParts = supabaseAnonKey.split('.')
  if (keyParts.length !== 3) {
    throw new Error(
      'Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY format. ' +
      'Expected a JWT token with 3 parts separated by dots.'
    )
  }

  // App environment configuration
  const nodeEnv = process.env.NODE_ENV || 'development'
  const environment = ['development', 'production', 'test'].includes(nodeEnv) 
    ? nodeEnv as 'development' | 'production' | 'test'
    : 'development'

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey
    },
    app: {
      environment,
      isDevelopment: environment === 'development',
      isProduction: environment === 'production'
    }
  }
}

/**
 * Logs environment configuration status (without sensitive data)
 * Useful for debugging configuration issues
 */
export function logEnvironmentStatus(): void {
  try {
    const config = getEnvironmentConfig()
    
    console.log('🔧 Environment Configuration Status:')
    console.log(`   Environment: ${config.app.environment}`)
    console.log(`   Supabase URL: ${config.supabase.url}`)
    console.log(`   Supabase Key: ${config.supabase.anonKey.substring(0, 20)}...`)
    console.log('✅ All environment variables are properly configured')
  } catch (error) {
    console.error('❌ Environment Configuration Error:')
    console.error(`   ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('\n💡 Quick Setup Guide:')
      console.log('   1. Copy .env.example to .env.local')
      console.log('   2. Fill in your Supabase project URL and anon key')
      console.log('   3. Restart your development server')
    }
  }
}

/**
 * Runtime environment validation
 * Call this during app initialization to catch configuration issues early
 */
export function validateEnvironment(): boolean {
  try {
    getEnvironmentConfig()
    return true
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logEnvironmentStatus()
    }
    return false
  }
}