const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://gpxbbzdxxtlibsjymmsy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweGJiemR4eHRsaWJzanltbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNTMxNTcsImV4cCI6MjA2OTkyOTE1N30.JW6Erge0BZ85mOTSqb3e-C8_-polfRfUOnUuFBYt_O4'
);

const supabase = createClient(
  'https://gpxbbzdxxtlibsjymmsy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweGJiemR4eHRsaWJzanlvbXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMxNjk2MzksImV4cCI6MjA0ODc0NTYzOX0.HBJkPCOBEU69pxfyKtIp8lTZfGIaKbCOgJJF7O_iqLI'
);

async function addSampleData() {
  console.log('Adding sample climate tech deals...');
  
  const sampleDeals = [
    {
      company_name: 'CleanTech Solar',
      amount_raised: 15000000,
      currency: 'USD',
      funding_stage: 'Series A',
      date_announced: '2024-01-15',
      lead_investors: 'Green Ventures',
      other_investors: 'Climate Fund, Energy Partners',
      climate_sub_sector: 'Solar Energy',
      geography_country: 'USA',
      status: 'PROCESSED_AI',
      funding_amount_str: '$15M'
    },
    {
      company_name: 'Carbon Capture Co',
      amount_raised: 25000000,
      currency: 'USD', 
      funding_stage: 'Series B',
      date_announced: '2024-02-20',
      lead_investors: 'Carbon Partners',
      other_investors: 'Tech Ventures, Clean Energy Fund',
      climate_sub_sector: 'Carbon Capture',
      geography_country: 'Canada',
      status: 'PROCESSED_AI',
      funding_amount_str: '$25M'
    },
    {
      company_name: 'WindPower Tech',
      amount_raised: 8000000,
      currency: 'USD',
      funding_stage: 'Seed',
      date_announced: '2024-03-10',
      lead_investors: 'Wind Ventures',
      other_investors: 'Green Tech Fund',
      climate_sub_sector: 'Wind Energy',
      geography_country: 'Germany',
      status: 'PROCESSED_AI',
      funding_amount_str: '$8M'
    },
    {
      company_name: 'EV Battery Solutions',
      amount_raised: 50000000,
      currency: 'USD',
      funding_stage: 'Series C',
      date_announced: '2024-04-05',
      lead_investors: 'Battery Capital',
      other_investors: 'Electric Ventures, Auto Fund',
      climate_sub_sector: 'Energy Storage',
      geography_country: 'China',
      status: 'PROCESSED_AI',
      funding_amount_str: '$50M'
    },
    {
      company_name: 'Green Building Tech',
      amount_raised: 12000000,
      currency: 'USD',
      funding_stage: 'Series A',
      date_announced: '2024-05-12',
      lead_investors: 'Building Fund',
      other_investors: 'Sustainable Ventures',
      climate_sub_sector: 'Green Buildings',
      geography_country: 'UK',
      status: 'PROCESSED_AI',
      funding_amount_str: '$12M'
    }
  ];

  const { data, error } = await supabase
    .from('deals')
    .insert(sampleDeals)
    .select();

  if (error) {
    console.error('Error inserting sample data:', error);
  } else {
    console.log('Successfully inserted', data.length, 'sample deals');
    console.log('Sample data:', data);
  }

  // Check if data was inserted
  const { data: allDeals, error: fetchError } = await supabase
    .from('deals')
    .select('*');

  if (fetchError) {
    console.error('Error fetching deals:', fetchError);
  } else {
    console.log('Total deals in database:', allDeals.length);
  }
}

addSampleData().catch(console.error);
