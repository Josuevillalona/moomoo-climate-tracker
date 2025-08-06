import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Fetch all deals to see what statuses exist
    const { data: deals, error } = await supabase
      .from('deals')
      .select('id, company_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deals from database', success: false },
        { status: 500 }
      );
    }

    // Also get status counts
    const { data: statusCounts, error: countError } = await supabase
      .from('deals')
      .select('status')
      .then(({ data, error }) => {
        if (error) return { data: null, error };
        
        const counts = data?.reduce((acc, deal) => {
          acc[deal.status] = (acc[deal.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        return { data: counts, error: null };
      });

    return NextResponse.json({
      deals: deals || [],
      statusCounts: statusCounts || {},
      success: true,
      total: deals?.length || 0
    });
  } catch (error) {
    console.error('Error fetching all deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals', success: false },
      { status: 500 }
    );
  }
}
