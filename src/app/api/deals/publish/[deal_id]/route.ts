import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: { deal_id: string } }
) {
  try {
    const dealId = parseInt(params.deal_id);
    const body = await request.json();

    // Validate dealId
    if (isNaN(dealId)) {
      return NextResponse.json(
        { error: 'Invalid deal ID', success: false },
        { status: 400 }
      );
    }

    // Update the deal in Supabase and set status to PUBLISHED
    const { data, error } = await supabase
      .from('deals')
      .update({
        company_name: body.company_name,
        funding_amount_str: body.funding_amount_str,
        amount_raised: body.amount_raised,
        currency: body.currency,
        funding_stage: body.funding_stage,
        date_announced: body.date_announced,
        lead_investors: body.lead_investors,
        other_investors: body.other_investors,
        climate_sub_sector: body.climate_sub_sector,
        geography_country: body.geography_country,
        source_url: body.source_url,
        status: 'PUBLISHED'
      })
      .eq('id', dealId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update deal in database', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Deal ${dealId} published successfully`,
      deal: data
    });
  } catch (error) {
    console.error('Error publishing deal:', error);
    return NextResponse.json(
      { error: 'Failed to publish deal', success: false },
      { status: 500 }
    );
  }
}
