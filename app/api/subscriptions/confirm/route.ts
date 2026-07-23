import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const session = await getSession();
    if (!session.orgId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find pending subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('org_id', session.orgId)
      .eq('status', 'pending')
      .maybeSingle();

    if (!subscription) {
      // Already active or doesn't exist
      return NextResponse.json({ confirmed: false }, { status: 200 });
    }

    // Calculate next renewal date (30 days from today)
    const today = new Date();
    const nextRenewalDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Mark as active after successful HitPay redirect
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        next_renewal_date: nextRenewalDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (error) {
      console.error('Failed to confirm subscription:', error);
      return NextResponse.json({ error: 'Failed to confirm subscription' }, { status: 500 });
    }

    return NextResponse.json({ confirmed: true }, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/subscriptions/confirm:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
