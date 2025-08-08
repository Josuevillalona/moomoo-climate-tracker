#!/usr/bin/env node

/**
 * Script to analyze database performance and provide optimization recommendations
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeTableStats() {
  console.log('📊 Analyzing table statistics...\n');

  try {
    // Get table size and row count
    const { data: tableStats, error: tableError } = await supabase
      .rpc('get_table_stats', { table_name: 'deals' });

    if (tableError) {
      console.log('ℹ️  Table stats not available via RPC, using basic queries...');
      
      // Fallback to basic count query
      const { count, error: countError } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('❌ Failed to get table count:', countError.message);
        return;
      }

      console.log(`📋 Table: deals`);
      console.log(`   Rows: ${count?.toLocaleString() || 'Unknown'}`);
      console.log(`   Size: Unable to determine`);
    } else {
      console.log('📋 Table Statistics:');
      console.log(`   Rows: ${tableStats?.row_count?.toLocaleString() || 'Unknown'}`);
      console.log(`   Size: ${tableStats?.table_size || 'Unknown'}`);
      console.log(`   Index Size: ${tableStats?.index_size || 'Unknown'}`);
    }

  } catch (error) {
    console.error('❌ Failed to analyze table stats:', error.message);
  }
}

async function analyzeIndexUsage() {
  console.log('\n🔍 Analyzing index usage...\n');

  try {
    // Try to get index usage statistics
    const { data: indexStats, error } = await supabase
      .rpc('get_index_usage_stats');

    if (error) {
      console.log('ℹ️  Index usage stats not available via RPC');
      console.log('   This requires database admin privileges');
      return;
    }

    if (!indexStats || indexStats.length === 0) {
      console.log('ℹ️  No index usage data available');
      return;
    }

    console.log('📈 Index Usage Statistics:');
    indexStats.forEach(stat => {
      const efficiency = stat.idx_tup_read > 0 
        ? ((stat.idx_tup_fetch / stat.idx_tup_read) * 100).toFixed(1)
        : 0;

      console.log(`   ${stat.indexname}:`);
      console.log(`     Scans: ${stat.idx_scan?.toLocaleString() || 0}`);
      console.log(`     Efficiency: ${efficiency}%`);
    });

  } catch (error) {
    console.log('ℹ️  Index analysis not available:', error.message);
  }
}

async function testQueryPerformance() {
  console.log('\n⚡ Testing query performance...\n');

  const queries = [
    {
      name: 'Recent Deals (Optimized)',
      query: () => supabase
        .from('deals')
        .select('id, company_name, funding_stage, amount_raised, date_announced')
        .not('date_announced', 'is', null)
        .order('date_announced', { ascending: false })
        .limit(10)
    },
    {
      name: 'Dashboard Metrics (Basic)',
      query: () => supabase
        .from('deals')
        .select('id, amount_raised, company_name')
        .not('amount_raised', 'is', null)
        .limit(100)
    },
    {
      name: 'Filtered Query (Status + Date)',
      query: () => supabase
        .from('deals')
        .select('id, company_name, funding_stage, amount_raised, date_announced')
        .in('status', ['PROCESSED_AI', 'VERIFIED'])
        .not('date_announced', 'is', null)
        .order('date_announced', { ascending: false })
        .limit(20)
    },
    {
      name: 'Sector Aggregation',
      query: () => supabase
        .from('deals')
        .select('climate_sub_sector, amount_raised')
        .not('climate_sub_sector', 'is', null)
        .not('amount_raised', 'is', null)
        .limit(50)
    }
  ];

  for (const { name, query } of queries) {
    try {
      const startTime = performance.now();
      const { data, error } = await query();
      const duration = performance.now() - startTime;

      if (error) {
        console.log(`❌ ${name}: Failed - ${error.message}`);
        continue;
      }

      const rowCount = Array.isArray(data) ? data.length : 0;
      const timePerRow = rowCount > 0 ? duration / rowCount : duration;

      let status = '✅';
      if (duration > 2000) status = '🐌';
      else if (duration > 1000) status = '⚠️';

      console.log(`${status} ${name}:`);
      console.log(`     Duration: ${duration.toFixed(0)}ms`);
      console.log(`     Rows: ${rowCount}`);
      console.log(`     Time/Row: ${timePerRow.toFixed(2)}ms`);

    } catch (error) {
      console.log(`❌ ${name}: Error - ${error.message}`);
    }
  }
}

async function generateRecommendations() {
  console.log('\n💡 Performance Recommendations:\n');

  try {
    // Get basic table info for recommendations
    const { count } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true });

    const rowCount = count || 0;

    console.log('🎯 Based on your data size and query patterns:\n');

    if (rowCount < 1000) {
      console.log('✅ Small Dataset Optimizations:');
      console.log('   • Current pagination strategy is optimal');
      console.log('   • Consider increasing page sizes to 50-100 items');
      console.log('   • Basic indexes are sufficient');
    } else if (rowCount < 10000) {
      console.log('📈 Medium Dataset Optimizations:');
      console.log('   • Implement hybrid pagination (offset + cursor)');
      console.log('   • Use composite indexes for complex filters');
      console.log('   • Consider data caching for dashboard metrics');
      console.log('   • Page size: 20-25 items optimal');
    } else {
      console.log('🚀 Large Dataset Optimizations:');
      console.log('   • Use cursor-based pagination for all queries');
      console.log('   • Implement aggressive caching strategies');
      console.log('   • Consider data partitioning by date');
      console.log('   • Page size: 15-20 items optimal');
      console.log('   • Use background data refresh');
    }

    console.log('\n🔧 General Recommendations:');
    console.log('   • Run ANALYZE regularly to update query planner stats');
    console.log('   • Monitor slow query logs');
    console.log('   • Use connection pooling for high concurrency');
    console.log('   • Implement query result caching');
    console.log('   • Consider read replicas for dashboard queries');

    console.log('\n📊 Monitoring Setup:');
    console.log('   • Enable slow query logging (>1s threshold)');
    console.log('   • Monitor index hit ratios');
    console.log('   • Track query execution plans');
    console.log('   • Set up performance alerts');

  } catch (error) {
    console.error('❌ Failed to generate recommendations:', error.message);
  }
}

async function main() {
  console.log('🔍 Database Performance Analysis\n');
  console.log('=' .repeat(50));

  await analyzeTableStats();
  await analyzeIndexUsage();
  await testQueryPerformance();
  await generateRecommendations();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Analysis complete!');
  console.log('\nNext steps:');
  console.log('1. Run `npm run db:optimize` to apply optimizations');
  console.log('2. Monitor performance using the debug dashboard');
  console.log('3. Adjust pagination strategies based on recommendations');
}

main().catch(console.error);