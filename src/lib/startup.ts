import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function logAICompanyCount() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: deals, error } = await supabase
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

    if (error) {
      console.error('Error fetching AI companies:', error);
      return;
    }

    const aiCompanyCount = deals?.length || 0;
    console.log('🤖 AI-focused companies in deals_new:', aiCompanyCount);
    
    // Also log total companies for comparison
    const { data: allDeals } = await supabase
      .from('deals_new')
      .select('id');
    
    const totalDeals = allDeals?.length || 0;
    console.log('📊 Total deals in deals_new:', totalDeals);
    console.log('📈 AI percentage:', totalDeals > 0 ? `${((aiCompanyCount / totalDeals) * 100).toFixed(1)}%` : '0%');

  } catch (error) {
    console.error('Error in logAICompanyCount:', error);
  }
}
