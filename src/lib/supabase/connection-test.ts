/**
 * Supabase connection testing utilities
 * Provides functions to test and validate the Supabase connection
 */

import { supabase } from '../supabase'

export interface ConnectionTestResult {
  success: boolean
  message: string
  details?: {
    canConnect: boolean
    canQuery: boolean
    tableExists: boolean
    hasData: boolean
    recordCount?: number
  }
  error?: string
}

/**
 * Comprehensive Supabase connection test
 * Tests connection, table access, and basic query functionality
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const details = {
    canConnect: false,
    canQuery: false,
    tableExists: false,
    hasData: false,
    recordCount: 0
  }

  try {
    // Test 1: Basic connection
    console.log('🔍 Testing Supabase connection...')
    
    // Test 2: Query the deals table
    console.log('🔍 Testing deals table access...')
    const { data, error, count } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return {
        success: false,
        message: 'Failed to query deals table',
        details,
        error: error.message
      }
    }

    details.canConnect = true
    details.canQuery = true
    details.tableExists = true
    details.recordCount = count || 0
    details.hasData = (count || 0) > 0

    // Test 3: Try to fetch a sample record
    if (details.hasData) {
      console.log('🔍 Testing sample data retrieval...')
      const { data: sampleData, error: sampleError } = await supabase
        .from('deals')
        .select('id, company_name, funding_stage')
        .limit(1)

      if (sampleError) {
        return {
          success: false,
          message: 'Failed to retrieve sample data',
          details,
          error: sampleError.message
        }
      }
    }

    const message = details.hasData 
      ? `✅ Connection successful! Found ${details.recordCount} deals in the database.`
      : '✅ Connection successful! Database is ready but contains no deals yet.'

    return {
      success: true,
      message,
      details
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return {
      success: false,
      message: 'Connection test failed',
      details,
      error: errorMessage
    }
  }
}

/**
 * Quick connection health check
 * Lightweight test for monitoring purposes
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('deals')
      .select('count')
      .limit(1)
      .single()

    return !error
  } catch {
    return false
  }
}

/**
 * Test real-time subscription capability
 * Verifies that real-time features are working
 */
export async function testRealTimeConnection(): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  try {
    console.log('🔍 Testing real-time subscription...')
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          message: 'Real-time connection test timed out',
          error: 'Subscription setup took too long'
        })
      }, 5000)

      const subscription = supabase
        .channel('connection-test')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'deals' 
          }, 
          () => {
            // This callback won't be called during the test,
            // but successful subscription setup indicates working real-time
          }
        )
        .subscribe((status) => {
          clearTimeout(timeout)
          
          if (status === 'SUBSCRIBED') {
            subscription.unsubscribe()
            resolve({
              success: true,
              message: '✅ Real-time connection is working'
            })
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            resolve({
              success: false,
              message: 'Real-time connection failed',
              error: `Subscription status: ${status}`
            })
          }
        })
    })
  } catch (error) {
    return {
      success: false,
      message: 'Real-time connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Run all connection tests and return comprehensive results
 */
export async function runAllConnectionTests(): Promise<{
  overall: boolean
  results: {
    basic: ConnectionTestResult
    realtime: Awaited<ReturnType<typeof testRealTimeConnection>>
  }
}> {
  console.log('🚀 Running comprehensive Supabase connection tests...\n')

  const basicTest = await testSupabaseConnection()
  const realtimeTest = await testRealTimeConnection()

  const overall = basicTest.success && realtimeTest.success

  console.log('\n📊 Test Results Summary:')
  console.log(`   Basic Connection: ${basicTest.success ? '✅' : '❌'}`)
  console.log(`   Real-time: ${realtimeTest.success ? '✅' : '❌'}`)
  console.log(`   Overall: ${overall ? '✅ All tests passed' : '❌ Some tests failed'}`)

  return {
    overall,
    results: {
      basic: basicTest,
      realtime: realtimeTest
    }
  }
}

/**
 * CLI test runner - can be called directly for debugging
 * Usage: node -e "require('./src/lib/supabase/connection-test.ts').runCLITest()"
 */
export async function runCLITest(): Promise<void> {
  try {
    const results = await runAllConnectionTests()
    
    if (!results.overall) {
      console.error('\n❌ Connection tests failed. Please check your configuration.')
      process.exit(1)
    }
    
    console.log('\n✅ All connection tests passed successfully!')
  } catch (error) {
    console.error('\n💥 Test execution failed:', error)
    process.exit(1)
  }
}