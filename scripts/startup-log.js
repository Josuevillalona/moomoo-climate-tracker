#!/usr/bin/env node

// Startup script to log AI company count from deals_new table
const { createClient } = require('@supabase/supabase-js');

async function logAICompanyCount() {
  try {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Supabase credentials not found in environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🚀 Checking AI companies in deals_new table...');
    
    // Get AI-focused companies
    const { data: aiDeals, error: aiError } = await supabase
      .from('deals_new')
      .select(`
        id,
        company:companies!deals_new_company_id_fkey (
          id,
          name,
          has_ai_focus
        )
      `)
      .eq('company.has_ai_focus', true);

    if (aiError) {
      console.error('❌ Error fetching AI companies:', aiError.message);
      return;
    }

    // Get total deals count
    const { data: allDeals, error: totalError } = await supabase
      .from('deals_new')
      .select('id', { count: 'exact' });

    if (totalError) {
      console.error('❌ Error fetching total deals:', totalError.message);
      return;
    }

    const aiCompanyCount = aiDeals?.length || 0;
    const totalDeals = allDeals?.length || 0;
    const percentage = totalDeals > 0 ? ((aiCompanyCount / totalDeals) * 100).toFixed(1) : '0';

    console.log('');
    console.log('📊 === DEALS_NEW DATABASE STATS ===');
    console.log(`🤖 AI-focused companies: ${aiCompanyCount}`);
    console.log(`📈 Total deals: ${totalDeals}`);
    console.log(`📊 AI percentage: ${percentage}%`);
    console.log('=====================================');
    console.log('');

  } catch (error) {
    console.error('❌ Error in startup script:', error.message);
  }
}

// Run the function
logAICompanyCount();
