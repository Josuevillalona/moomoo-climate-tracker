import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealIds, newStatus } = body;

    if (!dealIds || !Array.isArray(dealIds) || !newStatus) {
      return NextResponse.json(
        { error: 'dealIds (array) and newStatus are required', success: false },
        { status: 400 }
      );
    }

    // Update the status of specified deals
    const { data, error } = await supabase
      .from('deals')
      .update({ status: newStatus })
      .in('id', dealIds)
      .select('id, company_name, status');

    if (error) {
      console.error('Supabase error updating deal statuses:', error);
      return NextResponse.json(
        { error: 'Failed to update deal statuses', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      updatedDeals: data || [],
      success: true,
      message: `Updated ${data?.length || 0} deals to status: ${newStatus}`
    });
  } catch (error) {
    console.error('Error updating deal statuses:', error);
    return NextResponse.json(
      { error: 'Failed to update deal statuses', success: false },
      { status: 500 }
    );
  }
}

// Get deals by status for quick filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('deals')
      .select('id, company_name, status, funding_stage, amount_raised, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: deals, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deals', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deals: deals || [],
      success: true,
      filtered_by: status || 'all',
      total: deals?.length || 0
    });
  } catch (error) {
    console.error('Error fetching deals by status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals', success: false },
      { status: 500 }
    );
  }
}
