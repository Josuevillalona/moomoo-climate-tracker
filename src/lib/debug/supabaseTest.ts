import { supabase } from '../supabase';

export async function testSupabaseRealTime() {
  console.log('🧪 Testing Supabase Real-Time Connection...');
  
  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('deals')
      .select('id')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Basic connection failed:', connectionError);
      return { success: false, error: connectionError.message };
    }
    
    console.log('✅ Basic connection successful');

    // Test 2: Check if real-time is enabled on the table
    console.log('2️⃣ Testing real-time subscription setup...');
    
    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout;
      
      const channel = supabase
        .channel(`test-channel-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'deals'
          },
          (payload) => {
            console.log('✅ Real-time test payload received:', payload);
          }
        )
        .subscribe((status, error) => {
          console.log('📡 Real-time subscription status:', status, error?.message || '');
          
          if (error) {
            console.error('❌ Real-time subscription error:', error);
            clearTimeout(timeoutId);
            supabase.removeChannel(channel);
            resolve({ success: false, error: error.message });
          } else if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription successful');
            
            // Clean up the test channel after a short delay
            timeoutId = setTimeout(() => {
              supabase.removeChannel(channel);
              resolve({ success: true });
            }, 2000);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('❌ Real-time subscription failed with status:', status);
            clearTimeout(timeoutId);
            supabase.removeChannel(channel);
            resolve({ success: false, error: `Subscription failed: ${status}` });
          } else if (status === 'CLOSED') {
            console.log('📡 Channel closed');
            clearTimeout(timeoutId);
            resolve({ success: false, error: 'Channel was closed' });
          }
        });

      // Set a timeout to avoid hanging
      setTimeout(() => {
        console.log('⏰ Real-time test timeout');
        supabase.removeChannel(channel);
        resolve({ success: false, error: 'Test timeout after 10 seconds' });
      }, 10000);
    });

  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function checkSupabaseRLS() {
  console.log('🔒 Checking Row Level Security policies...');
  
  try {
    // Try to select from deals table
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ RLS check failed:', error);
      if (error.message.includes('RLS') || error.message.includes('policy')) {
        return {
          hasRLS: true,
          blocked: true,
          error: error.message,
          suggestion: 'Row Level Security might be blocking access. Check your RLS policies.'
        };
      }
      return {
        hasRLS: false,
        blocked: true,
        error: error.message
      };
    }
    
    console.log('✅ RLS check passed, can read data');
    return {
      hasRLS: false,
      blocked: false,
      recordCount: data?.length || 0
    };
    
  } catch (error) {
    console.error('❌ RLS check exception:', error);
    return {
      hasRLS: false,
      blocked: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkRealtimeEnabled() {
  console.log('🔍 Checking if real-time is enabled...');
  
  try {
    // Try to get information about the table
    const { data, error } = await supabase
      .from('deals')
      .select('id')
      .limit(1);
    
    if (error) {
      return {
        enabled: false,
        error: error.message,
        suggestion: 'Cannot access deals table. Check permissions.'
      };
    }

    // The real test is trying to subscribe
    return new Promise((resolve) => {
      const testChannel = supabase
        .channel(`realtime-check-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {})
        .subscribe((status, error) => {
          supabase.removeChannel(testChannel);
          
          if (error) {
            resolve({
              enabled: false,
              error: error.message,
              suggestion: 'Real-time subscription failed. Check if real-time is enabled in Supabase dashboard.'
            });
          } else if (status === 'SUBSCRIBED') {
            resolve({
              enabled: true,
              message: 'Real-time is properly configured'
            });
          } else {
            resolve({
              enabled: false,
              error: `Subscription status: ${status}`,
              suggestion: 'Real-time subscription did not complete successfully.'
            });
          }
        });

      // Timeout after 5 seconds
      setTimeout(() => {
        supabase.removeChannel(testChannel);
        resolve({
          enabled: false,
          error: 'Subscription timeout',
          suggestion: 'Real-time subscription timed out. This might indicate real-time is not enabled.'
        });
      }, 5000);
    });

  } catch (error) {
    return {
      enabled: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Failed to check real-time status'
    };
  }
}

export async function runFullDiagnostic() {
  console.log('🔍 Running full Supabase diagnostic...');
  
  const results = {
    timestamp: new Date().toISOString(),
    connection: null as any,
    rls: null as any,
    realtime: null as any,
    realtimeEnabled: null as any
  };
  
  // Test basic connection
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('count')
      .limit(1);
    
    results.connection = {
      success: !error,
      error: error?.message,
      hasData: !!data
    };
  } catch (error) {
    results.connection = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
  
  // Test RLS
  results.rls = await checkSupabaseRLS();
  
  // Check if real-time is enabled
  results.realtimeEnabled = await checkRealtimeEnabled();
  
  // Test real-time
  results.realtime = await testSupabaseRealTime();
  
  console.log('📊 Full diagnostic results:', results);
  return results;
}