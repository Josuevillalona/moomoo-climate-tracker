import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Fetch deals with 'PROCESSED_AI' status from Supabase
    const { data: deals, error } = await supabase
      .from('deals')
      .select('*')
      .eq('status', 'PROCESSED_AI')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deals from database', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deals: deals || [],
      success: true
    });
  } catch (error) {
    console.error('Error fetching deals for review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals', success: false },
      { status: 500 }
    );
  }
}
