import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    const session = await getSession();
    
    if (!session.orgId) {
      console.log('Confirm: No orgId in session');
      return NextResponse.json({ error: 'Not authenticated', confirmed: false }, { status: 401 });
    }

    console.log(`Confirm: Looking for pending subscription for org ${session.orgId}`);

    // Find pending subscription
    const { data: subscription, error: queryError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('org_id', session.orgId)
      .maybeSingle();

    if (queryError) {
      console.error('Confirm: Query error:', queryError);
      return NextResponse.json({ error: 'Database error', confirmed: false }, { status: 500 });
    }

    if (!subscription) {
      console.log(`Confirm: No subscription found for org ${session.orgId}`);
      return NextResponse.json({ confirmed: false, message: 'No pending subscription' }, { status: 200 });
    }

    // If already active, just return success
    if (subscription.status === 'active') {
      console.log(`Confirm: Subscription already active for org ${session.orgId}`);
      return NextResponse.json({ confirmed: true, message: 'Already active' }, { status: 200 });
    }

    console.log(`Confirm: Found subscription ${subscription.id} with status ${subscription.status}`);

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
      console.error('Confirm: Failed to update subscription:', error);
      return NextResponse.json({ error: 'Failed to confirm subscription', confirmed: false }, { status: 500 });
    }

    console.log(`Confirm: Successfully marked subscription ${subscription.id} as active`);
    return NextResponse.json({ confirmed: true }, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/subscriptions/confirm:', error);
    return NextResponse.json({ error: 'Internal server error', confirmed: false }, { status: 500 });
  }
}
